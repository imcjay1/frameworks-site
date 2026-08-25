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
| `craft-hero` | /craft | Hero | 21:9 | A wide establishing frame the hero copy sits over. Not named in the brief — the hero was specified as full-bleed but no image was supplied for it. |
| `craft-01-brief` | /craft | Stage 01 — The Brief | 16:9 | The first conversation: notes, plans and the brand's own material on a table. |
| `craft-02-direction` | /craft | Stage 02 — The Direction | 4:5 | On-site discovery — someone reading the space before a frame is shot. |
| `craft-03-a` | /craft | Stage 03 — The Making, upper band | 16:9 | The real world: the place itself, undisturbed. |
| `craft-03-b` | /craft | Stage 03 — The Making, upper band | 16:9 | Capture: the rig working in the space. |
| `craft-03-c` | /craft | Stage 03 — The Making, upper band | 16:9 | The digital journey: the finished experience on screen. |
| `craft-03-1` | /craft | Stage 03 — lower strip | 4:3 | Living light. |
| `craft-03-2` | /craft | Stage 03 — lower strip | 4:3 | Immersive sound. |
| `craft-03-3` | /craft | Stage 03 — lower strip | 4:3 | Embedded media. |
| `craft-03-4` | /craft | Stage 03 — lower strip | 4:3 | Intuitive interaction. |
| `craft-03-5` | /craft | Stage 03 — lower strip | 4:3 | Natural transitions. |
| `craft-04-review` | /craft | Stage 04 — The Refinement | 16:10 | The review: the experience examined across devices and screen sizes. |
| `craft-04-before` | /craft | Stage 04 — comparison panel | 16:9 | The same frame before refinement. Must be the identical viewpoint to `craft-04-after`. |
| `craft-04-after` | /craft | Stage 04 — comparison panel | 16:9 | The same frame after refinement. Must be the identical viewpoint to `craft-04-before`. |
| `craft-04-grade` | /craft | Stage 04 — grade strip | 21:9 | A wide graded frame showing the finished colour. |
| `craft-05-launch` | /craft | Stage 05 — The Launch | 4:5 | The delivered experience in use. |

## Pending client content

Values the client has not yet supplied. Declared in `tools/site_config.py` as
empty strings; anything that renders them is written to skip cleanly when empty.

| Constant | File | Status |
|---|---|---|
| `CONTACT_EMAIL` | `tools/site_config.py` | Outstanding — the Direct contact section on /contact does not render until this and `CONTACT_PHONE` are populated. |
| `CONTACT_PHONE` | `tools/site_config.py` | Outstanding — as above. |
