# Asset slots

Every layout position that needs an image the client has not supplied. Each one
renders the existing panel component with its background token and carries a
`data-asset-slot` attribute, so dropping the real image in later is a one-line
change per slot.

Append to this file — never overwrite it.

Supplied assets so far are **1122 × 1402 (4:5)**. Where a slot below asks for a
different ratio, the layout will crop to fill; supply at the stated ratio if you
want the full frame used.

| Slot | Page | Section | Ratio | What it should show |
|---|---|---|---|---|

## Pending client content

Values the client has not yet supplied. Declared in `tools/site_config.py` as
empty strings; anything that renders them is written to skip cleanly when empty.

| Constant | File | Status |
|---|---|---|
| `CONTACT_EMAIL` | `tools/site_config.py` | Outstanding — the Direct contact section on /contact does not render until this and `CONTACT_PHONE` are populated. |
| `CONTACT_PHONE` | `tools/site_config.py` | Outstanding — as above. |
