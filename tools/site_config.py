#!/usr/bin/env python3
"""Site configuration — the single source of truth for anything that appears on
more than one page.

This site has no JavaScript module layer to export constants from: it is static
HTML with no build step, and the nav has to be real markup so the site works
without JavaScript and is crawlable. So the constants live here and
`tools/sync-partials.py` renders them into the shared regions of all six pages.
Edit a constant, run the sync tool, commit the regenerated HTML.

  NAV           the six routes, in the client's approved order
  STUDIOS       the studio locations
  SOCIAL_LINKS  the client's social profiles
"""

# ---------------------------------------------------------------- navigation --
# Approved architecture: Home introduces, Studio reveals, Craft demonstrates,
# Works proves, Digital Services defines delivery, Contact begins the relationship.
NAV = [
    ("/",                 "Home"),
    ("/studio",           "Studio"),
    ("/craft",            "Craft"),
    ("/works",            "Works"),
    ("/digital-services", "Digital Services"),
    ("/contact",          "Contact"),
]

# ------------------------------------------------------------------- studios --
# (display name, role). `short` is the three-letter chip used on /digital-services.
STUDIOS = [
    {"name": "Monaco",                        "role": "Headquarters", "short": "MC"},
    {"name": "Jeddah, Kingdom of Saudi Arabia", "role": "Studio",     "short": "JED"},
    {"name": "United Kingdom",                "role": "Studio",       "short": "UK"},
]

# The running line — the country only, not the city.
STUDIO_LINE = ["Monaco", "Kingdom of Saudi Arabia", "United Kingdom"]

# --------------------------------------------------------------- social ------
SOCIAL_LINKS = [
    ("Instagram", "https://www.instagram.com/framework.studio_/"),
    ("LinkedIn",  "https://www.linkedin.com/company/frameworksstudios/"),
    ("Vimeo",     "https://vimeo.com/frameworksstudio"),
    ("YouTube",   "https://www.youtube.com/@Frameworks_Studios"),
    ("Facebook",  "https://www.facebook.com/frmworkstudio"),
    ("X",         "https://x.com/frmwork_studio"),
]

# 20px, currentColor, 1.5px stroke — drawn to sit on the same optical weight.
SOCIAL_ICONS = {
    "Instagram": '<rect x="3" y="3" width="18" height="18" rx="5"/>'
                 '<circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    "LinkedIn":  '<rect x="3" y="3" width="18" height="18" rx="2"/>'
                 '<line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7.2" r="1.1" fill="currentColor" stroke="none"/>'
                 '<path d="M11.5 17v-3.6a2.6 2.6 0 0 1 5.2 0V17"/><line x1="11.5" y1="10.5" x2="11.5" y2="17"/>',
    "Vimeo":     '<path d="M3.5 8.2c1.6-1.5 3-2.3 4.1-2.4 1.4-.2 2.3.8 2.6 2.9.3 2.3.5 3.7.7 4.2.3 1 .7 1.5 1.1 1.5.3 0 .8-.5 1.5-1.5.7-1 1.1-1.8 1.1-2.3.1-.9-.3-1.4-1.2-1.4-.4 0-.9.1-1.3.3.8-2.7 2.4-4 4.7-3.9 1.7.1 2.5 1.2 2.4 3.3-.1 1.6-1.2 3.8-3.2 6.6-2.1 2.9-3.9 4.4-5.3 4.4-.9 0-1.7-.9-2.3-2.6l-1.3-4.6c-.5-1.7-1-2.6-1.5-2.6-.1 0-.6.3-1.4.9z"/>',
    "YouTube":   '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.2 9.4l5 2.6-5 2.6z"/>',
    "Facebook":  '<path d="M14.5 8.2h2.2V5.4h-2.2c-1.9 0-3.4 1.5-3.4 3.4v1.6H9v2.8h2.1V21h2.8v-7.8h2.2l.4-2.8h-2.6V8.8c0-.3.3-.6.6-.6z"/>',
    "X":         '<path d="M4 4l7 9.2L4.4 20"/><path d="M20 20l-7-9.2L19.6 4"/>',
}
