#!/usr/bin/env python3
"""Copy the shared header/footer blocks from index.html into every other page.

There is no build step here — the six HTML files each hold a full copy of the
nav and footer so the site is navigable without JavaScript and readable by
crawlers. index.html is the source of truth; run this after editing any block
between a `<!-- #region SHARED:x -->` / `<!-- #endregion SHARED:x -->` pair.

  python3 tools/sync-partials.py           # rewrite the other pages
  python3 tools/sync-partials.py --check   # report drift, change nothing (exit 1)

aria-current="page" is the one thing allowed to differ per page; it is stripped
from the copied block and reapplied from each page's <body data-page="…">.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "index.html"
PAGES = {                       # file -> (data-page, path the nav should mark current)
    "index.html":            ("home", "/"),
    "craft.html":            ("craft", "/craft"),
    "sectors.html":          ("sectors", "/sectors"),
    "studio.html":           ("studio", "/studio"),
    "digital-services.html": ("digital-services", "/digital-services"),
    "contact.html":          ("contact", "/contact"),
}
REGIONS = ("head", "nav", "cta", "foot")

CURRENT = ' aria-current="page"'


def region(text, name):
    m = re.search(rf"<!-- #region SHARED:{name}\b.*?-->\n(.*?)\n\s*<!-- #endregion SHARED:{name} -->",
                  text, re.S)
    return m.group(1) if m else None


def mark_current(block, href):
    block = block.replace(CURRENT, "")
    # only the first match per block: the nav pill and the drawer link are in
    # separate blocks, so this stays one attribute per navigation landmark
    return re.sub(rf'(<a\b[^>]*\bhref="{re.escape(href)}")', rf"\1{CURRENT}", block)


def main():
    check = "--check" in sys.argv
    src = (ROOT / SOURCE).read_text()
    blocks = {}
    for name in REGIONS:
        b = region(src, name)
        if b is None:
            sys.exit(f"index.html is missing the SHARED:{name} region")
        blocks[name] = b

    drift = 0
    for page, (_, href) in PAGES.items():
        path = ROOT / page
        if not path.exists():
            print(f"skip {page} (not created yet)")
            continue
        text = original = path.read_text()
        for name, block in blocks.items():
            if region(text, name) is None:
                continue                      # e.g. contact.html carries no CTA band
            wanted = mark_current(block, href)
            text = re.sub(
                rf"(<!-- #region SHARED:{name}\b.*?-->\n).*?(\n\s*<!-- #endregion SHARED:{name} -->)",
                lambda m: m.group(1) + wanted + m.group(2), text, flags=re.S)
        if text != original:
            drift += 1
            print(("drift: " if check else "synced: ") + page)
            if not check:
                path.write_text(text)
        else:
            print(f"ok: {page}")

    if check and drift:
        sys.exit(1)


if __name__ == "__main__":
    main()
