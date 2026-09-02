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
from site_config import (NAV, STUDIOS, STUDIO_LINE,          # noqa: E402
                         SOCIAL_LINKS, SOCIAL_ICONS,
                         CONTACT_EMAIL, CONTACT_PHONE, MEMBERSHIPS)

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


def studio_line(sep, upper=False):
    line = f" {sep} ".join(STUDIO_LINE)
    return line.upper() if upper else line


def social_row(indent):
    """Icon-only links. aria-label carries the name, so the SVG stays hidden."""
    out = []
    for name, url in SOCIAL_LINKS:
        out.append(
            f'{indent}<a href="{url}" target="_blank" rel="noopener noreferrer"'
            f' aria-label="Frameworks Studios on {name}">'
            f'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"'
            f' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
            f' focusable="false">{SOCIAL_ICONS[name]}</svg></a>')
    return "\n".join(out)


def studio_columns(indent):
    """The three studios as equal columns — /contact section 04."""
    out = [indent + '<div class="studio-cols reveal">']
    for s in STUDIOS:
        out.append(f'{indent}  <div class="studio-col">'
                   f'<span class="studio-city">{s["name"].upper()}</span>'
                   f'<span class="studio-role">{s["role"]}</span></div>')
    out.append(indent + "</div>")
    return "\n".join(out)


def direct_contact(indent):
    """Section 05 of /contact. The client has not supplied an address or a
    number yet, so with both constants empty this renders nothing at all —
    the section is absent rather than empty, and the page still reads."""
    if not CONTACT_EMAIL and not CONTACT_PHONE:
        return ""
    rows = []
    if CONTACT_EMAIL:
        rows.append(f'{indent}    <div class="direct-col"><span class="direct-label">EMAIL</span>'
                    f'<a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></div>')
    if CONTACT_PHONE:
        tel = "".join(c for c in CONTACT_PHONE if c.isdigit() or c == "+")
        rows.append(f'{indent}    <div class="direct-col"><span class="direct-label">TELEPHONE</span>'
                    f'<a href="tel:{tel}">{CONTACT_PHONE}</a></div>')
    return ("\n".join([f'{indent}<section class="band ct-direct" style="padding-top:0">',
                       f'{indent}  <div class="eyebrow reveal">DIRECT CONTACT</div>',
                       f'{indent}  <div class="direct-cols reveal">'] + rows
                      + [f'{indent}  </div>', f'{indent}</section>']))


def member_of(indent):
    """The memberships row above the footer's social icons. The client has not
    supplied the marks yet, so with MEMBERSHIPS empty this renders nothing at
    all — the row is absent rather than an empty heading over blank space."""
    if not MEMBERSHIPS:
        return ""
    logos = "\n".join(
        f'{indent}    <img src="{path}" alt="{name}" loading="lazy" decoding="async">'
        for name, path in MEMBERSHIPS)
    return "\n".join([f'{indent}<div class="footer-member">',
                      f'{indent}  <span class="footer-member-k">Member of</span>',
                      f'{indent}  <div class="footer-member-marks">',
                      logos,
                      f'{indent}  </div>',
                      f'{indent}</div>'])


def studio_marks(indent):
    """The three-letter chips on /digital-services — from STUDIOS, not typed."""
    return "\n".join(f'{indent}<span class="dh-mark">{st["short"]}</span>' for st in STUDIOS)


GENERATORS = {
    "nav-island": lambda cur: nav_links(cur, "    "),
    "nav-drawer": lambda cur: nav_links(cur, "  "),
    "nav-footer": lambda cur: footer_links(cur, "    "),
    "social":     lambda cur: social_row("    "),
    "member-of":  lambda cur: member_of("  "),
    "copyright":  lambda cur: "    <span>© 2026 FRAMEWORKS STUDIOS · "
                              + studio_line("·", upper=True) + "</span>",
    "studio-line-drawer": lambda cur: "  " + studio_line("·"),
    "studio-line-home":   lambda cur: "        " + studio_line("·", upper=True),
    "studio-marks": lambda cur: studio_marks("          "),
    "studio-columns":     lambda cur: studio_columns("  "),
    "direct-contact":     lambda cur: direct_contact(""),
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
