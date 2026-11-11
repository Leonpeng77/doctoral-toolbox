#!/usr/bin/env python3
"""Wire i18n-data.js + i18n.js into every page (idempotent)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"

TAGS = (
    '<script src="{css}js/i18n-data.js"></script>\n'
    '<script src="{css}js/i18n.js"></script>\n'
)


def depth_of(rel):
    return rel.count('/')


def main():
    changed = 0
    for path in sorted(SITE.rglob("*.html")):
        rel = path.relative_to(SITE).as_posix()
        html = path.read_text(encoding="utf-8")
        if 'i18n.js' in html:
            continue
        prefix = '../' * depth_of(rel)
        tags = TAGS.format(css=prefix)
        if '</body>' in html:
            html = html.replace('</body>', tags + '</body>', 1)
        else:
            html += tags
        # Keep lang attribute honest on first paint.
        html = html.replace('<html lang="en"', '<html lang="en"', 1)
        path.write_text(html, encoding="utf-8")
        changed += 1
        print(f'  wired {rel}  (prefix {prefix})')
    print(f'injected into {changed} pages')


if __name__ == "__main__":
    main()
