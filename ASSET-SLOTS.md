# Asset slots

Every layout position that needs an image the client has not supplied. Each one
renders the existing panel component with its background token and carries a
`data-asset-slot` attribute, so dropping the real image in later is a one-line
change per slot.

Append to this file — never overwrite it.

Supplied assets so far are **1122 × 1402 (4:5)**. Where a slot below asks for a
different ratio, the layout will crop to fill; supply at the stated ratio if you
want the full frame used.

| Slot | Page | Section | Ratio | What it should show | Status |
|---|---|---|---|---|---|
| `studio-philosophy` | /studio | Mosaic tile 02 — The Philosophy | 3:2 | A close detail shot suggesting optics or light. | **Filled** — `/assets/studio/philosophy.webp` |
| `studio-today` | /studio | Mosaic tile 03 — The Studio Today | 3:2 | The team at work around a layout table. | **Filled** — `/assets/studio/today.webp` |
| `craft-hero` | /craft | Hero | 21:9 | A wide establishing frame the hero copy sits over. Not named in the brief — the hero was specified as full-bleed but no image was supplied for it. | **Filled** — `/assets/craft/hero.webp` |
| `craft-01-brief` | /craft | Stage 01 — The Brief | 16:9 | The first conversation: notes, plans and the brand's own material on a table. | **Filled** — `/assets/craft/01-brief.webp` |
| `craft-02-direction` | /craft | Stage 02 — The Direction | 4:5 | On-site discovery — someone reading the space before a frame is shot. | **Filled** — `/assets/craft/02-direction.webp` |
| `craft-03-a` | /craft | Stage 03 — The Making, upper band | 16:9 | The real world: the place itself, undisturbed. | **Filled** — `/assets/craft/03-a.webp` |
| `craft-03-b` | /craft | Stage 03 — The Making, upper band | 16:9 | Capture: the rig working in the space. | **Filled** — `/assets/craft/03-b.webp` |
| `craft-03-c` | /craft | Stage 03 — The Making, upper band | 16:9 | The digital journey: the finished experience on screen. | **Filled** — `/assets/craft/03-c.webp` |
| `craft-03-1` | /craft | Stage 03 — lower strip | 4:3 | Living light. | **Filled** — `/assets/craft/03-1.webp` |
| `craft-03-2` | /craft | Stage 03 — lower strip | 4:3 | Immersive sound. | **Filled** — `/assets/craft/03-2.webp` |
| `craft-03-3` | /craft | Stage 03 — lower strip | 4:3 | Embedded media. | **Filled** — `/assets/craft/03-3.webp` |
| `craft-03-4` | /craft | Stage 03 — lower strip | 4:3 | Intuitive interaction. | **Filled** — `/assets/craft/03-4.webp` |
| `craft-03-5` | /craft | Stage 03 — lower strip | 4:3 | Natural transitions. | **Filled** — `/assets/craft/03-5.webp` |
| `craft-04-review` | /craft | Stage 04 — The Refinement | 16:10 | The review: the experience examined across devices and screen sizes. | **Filled** — `/assets/craft/04-review.webp` |
| `craft-04-before` | /craft | Stage 04 — comparison panel | 16:9 | The same frame before refinement. Must be the identical viewpoint to `craft-04-after`. | **Filled** — `/assets/craft/04-before.webp` |
| `craft-04-after` | /craft | Stage 04 — comparison panel | 16:9 | The same frame after refinement. Must be the identical viewpoint to `craft-04-before`. | **Filled** — `/assets/craft/04-after.webp` |
| `craft-04-grade` | /craft | Stage 04 — grade strip | 21:9 | A wide graded frame showing the finished colour. | **Filled** — `/assets/craft/04-grade.webp` |
| `craft-05-launch` | /craft | Stage 05 — The Launch | 4:5 | The delivered experience in use. | **Filled** — `/assets/craft/05-launch.webp` |

All slots are currently filled. Every image above was generated to the studio and
craft design mockups in `.design-refs/`, on one grade: warm sepia-and-bronze,
deep shadows, a single warm light source. **They are placeholders of record** —
drop a real photograph in at the same path and ratio and nothing else changes.
The `data-asset-slot` attributes were removed as each was filled; if a slot is
ever emptied again, restore the attribute and re-list it here.

`craft-04-before` is not a separate photograph: it is `craft-04-after` degraded
in post (desaturated, lifted blacks, reduced contrast) so the comparison shows
one frame in two states rather than two different places.

## Pending client content

Values the client has not yet supplied. Declared in `tools/site_config.py` as
empty strings; anything that renders them is written to skip cleanly when empty.

| Constant | File | Status |
|---|---|---|
| `CONTACT_EMAIL` | `tools/site_config.py` | Outstanding. Section 05 (Direct contact) of /contact renders only once this or `CONTACT_PHONE` is set; with both empty the section is absent from the markup entirely. Set the value, run `python3 tools/sync-partials.py`, commit the regenerated HTML. |
| `CONTACT_PHONE` | `tools/site_config.py` | Outstanding — as above. The `tel:` href is derived from the value by stripping everything but digits and a leading `+`. |
| `MEMBERSHIPS` | `tools/site_config.py` | Outstanding. The home page brief asks for a **Member of** row above the footer's social icons. No membership marks have been supplied, so the list is empty and `member_of()` in `tools/sync-partials.py` renders nothing — the row is absent from the markup on all six pages rather than an empty heading over blank space. Add `("Name", "/assets/memberships/name.webp")` entries, drop trimmed logos into `assets/memberships/`, run `python3 tools/sync-partials.py`, commit the regenerated HTML. The footer styling (`.footer-member`) is already in `assets/site.css` and inverts the marks to ivory, so supply them on a transparent background. |
