#!/usr/bin/env python3
"""Extract translatable block-level HTML from site pages into a JSON worksheet.

Only block-level text containers are extracted (and not when nested inside
another target container), so the translation can be injected back as
data-zh / data-zh-html without duplicating or breaking inline markup.
"""
from html.parser import HTMLParser
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
OUT = ROOT / "i18n-worksheet.json"

BLOCK = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th",
         "button", "label", "legend", "caption", "blockquote", "figcaption"}
SKIP = {"script", "style", "svg", "noscript", "head"}


class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.stack = []
        self.skip_depth = 0
        self.items = []
        self.counter = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP or self.skip_depth:
            if tag in SKIP:
                self.skip_depth += 1
            return
        inside_target = any(t in BLOCK for t, _ in self.stack)
        if tag in BLOCK and not inside_target:
            self.counter += 1
            self.stack.append((tag, {
                "id": f"t{self.counter}",
                "file": a.get("__file", ""),
                "raw": [],
                "attrs": a,
            }))
            self.items.append(self.stack[-1][1])
        else:
            self.stack.append((tag, None))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if self.skip_depth:
            if tag in SKIP:
                self.skip_depth -= 1
            return
        if not self.stack:
            return
        top_tag, meta = self.stack[-1]
        # unwind to the matching open tag
        idx = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                idx = i
                break
        if idx is not None:
            for _, m in self.stack[idx:]:
                if m is not None:
                    m["html"] = "".join(m["raw"]).strip()
            del self.stack[idx:]

    def handle_data(self, data):
        if self.skip_depth:
            return
        for _, meta in reversed(self.stack):
            if meta is not None:
                meta["raw"].append(data)
                break

    def handle_entityref(self, name):
        self.handle_data(f"&{name};")

    def handle_charref(self, name):
        self.handle_data(f"&#{name};")


def strip_tags(html):
    import re
    txt = re.sub(r"<[^>]+>", "", html)
    txt = (txt.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
              .replace("&middot;", "·").replace("&mdash;", "—").replace("&ndash;", "–")
              .replace("&nbsp;", " ").replace("&copy;", "©").replace("&rarr;", "→")
              .replace("&#9744;", "[ ]").replace("&quot;", '"').replace("&#39;", "'"))
    return " ".join(txt.split())


def main():
    pages = sorted(SITE.rglob("*.html"))
    worksheet = {}
    total = 0
    for page in pages:
        rel = page.relative_to(SITE).as_posix()
        if rel == "404.html":
            continue
        src = page.read_text(encoding="utf-8")
        ex = Extractor()
        # tag the file so items know their origin
        ex.feed(src.replace("<body", f'<body __file="{rel}"', 1))
        rows = []
        for it in ex.items:
            html = it.get("html", "")
            text = strip_tags(html)
            if not text or len(text) < 3:
                continue
            if text.lower().startswith(("var ", "function", "{", "http")):
                continue
            rows.append({"id": it["id"], "en": text,
                         "html": html if "<" in html else None})
        if rows:
            worksheet[rel] = rows
            total += len(rows)
    OUT.write_text(json.dumps(worksheet, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"worksheet -> {OUT.name}")
    print(f"pages: {len(worksheet)} | translatable blocks: {total}")
    for rel, rows in worksheet.items():
        print(f"  {rel:<48} {len(rows):>3}")


if __name__ == "__main__":
    main()
