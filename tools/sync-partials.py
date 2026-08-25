#!/usr/bin/env python3
"""Render the shared header/footer into every page.

There is no build step here — the six HTML files each hold a full copy of the
nav and footer so the site is navigable without JavaScript and readable by
crawlers. Two mechanisms:

  1. Static regions. `index.html` is the source of truth for everything between
     a `<!-- #region SHARED:x -->` / `<!-- #endregion SHARED:x -->` pair; the
     tool copies those into the other five pages.

  2. Generated runs. Anything driven by a constant in tools/site_config.py is
     written between `<!-- gen:name -->` / `<!-- /gen:name -->` markers. The nav
     appears three times per page (desktop island, mobile drawer, footer) and
     all three are rendered from NAV, so the order and labels have one source.

  python3 tools/sync-partials.py           # rewrite every page
  python3 tools/sync-partials.py --check   # report drift, change nothing (exit 1)

aria-current="page" is applied per page from PAGES, to the nav links only — the
brandmark is a logo link home, not a nav item, and must never carry it.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from site_config import NAV                                  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "index.html"
PAGES = {                       # file -> (data-page, path the nav should mark current)
    "index.html":            ("home", "/"),
    "craft.html":            ("craft", "/craft"),
    "works.html":            ("works", "/works"),
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


# ------------------------------------------------------------- generated runs --
def nav_links(current, indent):
    """The desktop island and the mobile drawer: one <a> per line."""
    return "\n".join(
        f'{indent}<a href="{href}"{CURRENT if href == current else ""}>{label}</a>'
        for href, label in NAV)


def footer_links(current, indent):
    """The footer: the same six, on one line."""
    return indent + " ".join(
        f'<a href="{href}"{CURRENT if href == current else ""}>{label}</a>'
        for href, label in NAV)


GENERATORS = {
    "nav-island": lambda cur: nav_links(cur, "    "),
    "nav-drawer": lambda cur: nav_links(cur, "  "),
    "nav-footer": lambda cur: footer_links(cur, "    "),
}


def fill(text, current):
    """Replace every gen: run with freshly rendered markup."""
    for name, build in GENERATORS.items():
        pattern = rf"(<!-- gen:{name} -->\n).*?(\n\s*<!-- /gen:{name} -->)"
        if not re.search(pattern, text, re.S):
            continue
        body = build(current)
        text = re.sub(pattern, lambda m: m.group(1) + body + m.group(2), text, flags=re.S)
    return text


def main():
    check = "--check" in sys.argv
    src = (ROOT / SOURCE).read_text()
    blocks = {}
    for name in REGIONS:
        b = region(src, name)
        if b is None:
            sys.exit(f"{SOURCE} is missing the SHARED:{name} region")
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
                continue                      # e.g. /contact carries no CTA band
            text = re.sub(
                rf"(<!-- #region SHARED:{name}\b.*?-->\n).*?(\n\s*<!-- #endregion SHARED:{name} -->)",
                lambda m: m.group(1) + block + m.group(2), text, flags=re.S)
        text = fill(text, href)
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
