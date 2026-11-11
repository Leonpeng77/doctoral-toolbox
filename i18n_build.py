#!/usr/bin/env python3
"""Annotate translatable elements with data-i18n keys and export a worksheet.

Strategy: scan text with a tiny state machine that only tracks whether we are
inside a tag, a quoted attribute, or a comment. We never rebuild element
content — we only INSERT an attribute at the correct position. This makes the
transformation byte-preserving for every visible text node.

Re-running is idempotent: elements that already carry data-i18n keep their key.
"""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
WORKSHEET = ROOT / "i18n-worksheet.json"

TARGET_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th",
               "button", "label", "legend", "caption", "blockquote",
               "figcaption", "dt", "dd"}
VOID = {"br", "hr", "img", "meta", "link", "input", "source", "area",
        "base", "col", "embed", "param", "track", "wbr"}
SKIP = {"script", "style", "svg", "noscript", "head"}


def page_key(rel):
    return re.sub(r"[^a-zA-Z0-9]+", "_", rel.replace(".html", "")).strip("_")


def scan_tags(html):
    """Yield (tag_name, start, end_of_open_tag, attrs_text, closing, selfclose)."""
    i, n = 0, len(html)
    while i < n:
        if html[i] != "<":
            i += 1
            continue
        if html.startswith("<!--", i):
            j = html.find("-->", i + 4)
            i = n if j < 0 else j + 3
            continue
        if html.startswith("<!", i) or html.startswith("<?", i):
            j = html.find(">", i + 2)
            i = n if j < 0 else j + 1
            continue
        j, quote = i + 1, None
        while j < n:
            c = html[j]
            if quote:
                if c == quote:
                    quote = None
            elif c in "\"'":
                quote = c
            elif c == ">":
                break
            j += 1
        if j >= n:
            break
        inner = html[i + 1:j]
        m = re.match(r"\s*(/?)\s*([a-zA-Z][\w-]*)", inner)
        if m:
            closing = bool(m.group(1))
            tag = m.group(2).lower()
            attrs = inner[m.end():]
            selfclose = attrs.rstrip().endswith("/")
            yield tag, i, j, attrs, closing, selfclose
        i = j + 1


def extract_inner(html_start, html, tag, close_positions):
    """Return the exact inner HTML of an element opened at html_start."""
    return html[html_start:close_positions]


def build_page(path, rel):
    html = path.read_text(encoding="utf-8")
    events = list(scan_tags(html))

    # First pass: find matching close positions with a tag stack.
    stack = []
    spans = []  # (tag, open_end, close_start, attrs, is_target)
    skip_depth = 0
    for idx, (tag, start, end, attrs, closing, selfclose) in enumerate(events):
        if tag in SKIP:
            if not closing:
                skip_depth += 1
            else:
                skip_depth = max(0, skip_depth - 1)
            continue
        if skip_depth:
            continue
        if closing:
            for k in range(len(stack) - 1, -1, -1):
                if stack[k]["tag"] == tag:
                    node = stack.pop(k)
                    node["close"] = start
                    spans.append(node)
                    break
            continue
        if selfclose or tag in VOID:
            continue
        parent_target = any(s["target"] for s in stack)
        is_target = (tag in TARGET_TAGS and not parent_target) or \
                    (tag == "span" and 'class="tag"' in attrs)
        # `end` is the index of the closing '>'. Text content starts after it;
        # attributes must be inserted BEFORE it.
        insert_at = end - 1 if attrs.rstrip().endswith("/") else end
        stack.append({"tag": tag, "open_end": end + 1, "insert_at": insert_at,
                      "attrs": attrs, "target": is_target, "close": None})

    spans.sort(key=lambda s: s["open_end"])

    rows = {}
    edits = []
    counter = 0
    for s in spans:
        if not s["target"] or s["close"] is None:
            continue
        existing = re.search(r'data-i18n="([^"]+)"', s["attrs"])
        if existing:
            key = existing.group(1)
        else:
            counter += 1
            key = f"i{counter}"
            edits.append((s["insert_at"], f' data-i18n="{key}"'))
        inner = html[s["open_end"]:s["close"]]
        text = re.sub(r"<[^>]+>", "", inner)
        for a, b in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                     ("&middot;", "·"), ("&mdash;", "—"), ("&ndash;", "–"),
                     ("&nbsp;", " "), ("&copy;", "©"), ("&rarr;", "→"),
                     ("&quot;", '"'), ("&#39;", "'"), ("&#9744;", "[ ]")]:
            text = text.replace(a, b)
        text = " ".join(text.split())
        if text and len(text) >= 2:
            rows[key] = {"en": text, "html": inner if "<" in inner else None}

    # Shared short phrases in nav + footer (keyed by their English text).
    shared = {}
    for s in spans:
        if s["tag"] != "a" or s["close"] is None:
            continue
        inner = html[s["open_end"]:s["close"]]
        if "<" in inner:
            continue
        text = " ".join(inner.split())
        if not text or len(text) > 40:
            continue
        before = html[:s["open_end"]]
        in_nav = before.rfind("<nav") > before.rfind("</nav>")
        in_foot = before.rfind("<footer") > before.rfind("</footer>")
        if in_nav or in_foot:
            shared[text] = None

    out = html
    for pos, attr in sorted(edits, reverse=True):
        out = out[:pos] + attr + out[pos:]

    if edits:
        path.write_text(out, encoding="utf-8")
    return rows, shared, len(edits)


def main():
    worksheet, shared_all = {}, set()
    total = 0
    for path in sorted(SITE.rglob("*.html")):
        rel = path.relative_to(SITE).as_posix()
        if rel == "404.html":
            continue
        rows, shared, n = build_page(path, rel)
        worksheet[rel] = rows
        shared_all |= set(shared)
        total += n
    payload = {"pages": worksheet, "shared": sorted(shared_all)}
    WORKSHEET.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"worksheet -> {WORKSHEET.name} | injected: {total} | shared phrases: {len(shared_all)}")
    for rel, rows in worksheet.items():
        print(f"  {rel:<48} {len(rows):>3}")


if __name__ == "__main__":
    main()
