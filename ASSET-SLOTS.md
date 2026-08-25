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
| `studio-philosophy` | /studio | Mosaic tile 02 — The Philosophy | 3:2 | A close detail shot suggesting optics or light. |
| `studio-today` | /studio | Mosaic tile 03 — The Studio Today | 3:2 | The team at work around a layout table. |

## Pending client content

Values the client has not yet supplied. Declared in `tools/site_config.py` as
empty strings; anything that renders them is written to skip cleanly when empty.

| Constant | File | Status |
|---|---|---|
| `CONTACT_EMAIL` | `tools/site_config.py` | Outstanding — the Direct contact section on /contact does not render until this and `CONTACT_PHONE` are populated. |
| `CONTACT_PHONE` | `tools/site_config.py` | Outstanding — as above. |
