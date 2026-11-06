# CEO amendments — 13 Sep 2026 (Martyn Fairbairn, 5 emails)

Source: 5 emails from martyn@frameworksstudios.com, 13 Sep 2026, with 18 annotated
screenshots, 3 font archives, 6 Google Drive links and 2 Pages documents.

Everything below was read from the emails, the annotated screenshots, the Drive
folders and the two Pages docs (`02 Landing Page.pages`, `03. the STUDIO.pages`).

> **Status, 6 Nov 2026.** Every point from the five emails is built and live
> except the photograph section (5.8). Seven smaller points still need Martyn's
> word; they are collected in §8 at the foot of this file. They were deliberately
> left out of the client-facing `amendments-13-sep.html`, which shows completed
> work only — so this file is the only record of them.

**Status key:** ✅ already done in the uncommitted work on `Frameworks-Site` ·
🔲 outstanding · ❓ needs a decision from Martyn or Cameron.

---

## 0. Where things stand

All of this work is committed on `Frameworks-Site` and deployed. The last four
commits are `c53face`, `2a2f468`, `2b45339` and `4be01bb`. Live at
`https://frameworksstudio.vercel.app` — note that the custom domain
`frameworksstudios.com` is a different site, the one hosting the 360 tours
themselves.

`docs/` is excluded from the deployment by `.vercelignore`, so this file is no
longer served publicly; it was, between `c53face` and `4be01bb`.

---

## 1. Email 01 — "Website FONT Amendment"

Attachments: `Posterama1933-Light.zip`, `Julius Sans One Regular.zip`, `Avenir.zip`,
`Font 1.png`, `Font 2.png`.

| # | Amendment | Where | Status |
|---|---|---|---|
| 1.1 | Header font → Posterama 1933 Light (first choice) or Julius Sans One Regular (second) | `assets/site.css` `--font-display` | ✅ Posterama active, Julius listed as fallback; both `@font-face`s declared |
| 1.2 | Body font → Avenir | `assets/site.css` `--font-body` | ✅ 7 Avenir weights self-hosted |
| 1.3 | "Keep this Font" — nav, wordmark, eyebrow chips, HUD labels unchanged | `--font-mono` (Fragment Mono) | ✅ untouched |
| 1.4 | Google Fonts request trimmed to Fragment Mono only; display/body preloaded | all 6 page `<head>`s | ✅ |

❓ **1.5 — Martyn asked to see which of the two header fonts suits the site best.**
Posterama 1933 Light is live. Does he want a side-by-side before this is signed off?
(`tools/type-preview.html` exists untracked in the main checkout and may already be that.)

---

## 2. Email 04 — "CRAFT amendments"

Body in full: *"Just change HEADER FONTs and BODY FONTs."* No attachments, no links.

| # | Amendment | Where | Status |
|---|---|---|---|
| 2.1 | Header + body fonts on /craft | inherited from the `--font-display` / `--font-body` tokens | ✅ |

🔲 **2.2** Visual check of `/craft` at 360 / 768 / 1024 / 1440 — Posterama is wider
than Fraunces, so the five stage rows and the ghosted stage numbers need re-checking
for overflow. `assets/craft.css` has 23 changed lines already; confirm they cover it.

---

## 3. Email 02 — "Landing Page Amendments" (9 screenshots + Drive doc)

| # | Amendment (from the red mark-up) | Where | Status |
|---|---|---|---|
| 3.1 | Hero: delete the "TRUSTED BY" logo island (crossed out) | `index.html` hero | ✅ removed |
| 3.2 | The six pillar statements belong in the scroll-pan sections, not in boxes | `index.html` `.cap` scroll captions | ✅ all six are now scroll captions |
| 3.3 | Delete the six-box "THE PILLARS" grid | `index.html` | ✅ removed |
| 3.4 | Delete the stats band (€400m+ / €6.3m / 15m+ / 60+) | `index.html` | ✅ removed |
| 3.5 | "THE STUDIO →" link → same button as the others | `index.html` | ✅ now `.btn-glass` "Explore the Studio" |
| 3.6 | "THE CRAFT →" link → same button | `index.html` | ✅ "Explore the Craft" |
| 3.7 | "DIGITAL SERVICES →" link → same button | `index.html` | ✅ "Explore Digital Services" |
| 3.8 | Sector taster: 3 rows only — Event Venues, Luxury Real Estate, Hotels & Resorts | `index.html` `#sectors` | ✅ |
| 3.9 | Drop the right-hand sector taglines | `index.html` | ✅ |
| 3.10 | Button under the taster → "EXPLORE THE WORKS" | `index.html` | ✅ |
| 3.11 | Wrong Super Yachts hover thumbnail | `assets/sectors/super-yachts.webp` | ✅ replaced with the Drive image (Sunseeker underway) |
| **3.12** | **"Trusted by" logos slightly bigger, and slow the carousel down** | `assets/site.css` `.client` 60px → **74px**, `.client img` max-width 248px → **300px**; speed on `index.html` `data-marquee-speed` 30 → **24** px/s; measurement bug fixed in `assets/site.js` (see 7.1) | ✅ **done** — verified at a true 24.0 px/s |

Drive doc `02 Landing Page.pages` holds the approved home-page copy — it matches
what is on the page now. No copy changes fall out of it.

---

## 4. Email 03 — "THE STUDIO page amendments" (4 screenshots + Drive doc)

| # | Amendment | Where | Status |
|---|---|---|---|
| 4.1 | Hero headline → new header font | `studio.html` h1 | ✅ via token |
| 4.2 | Tile statement lines → new header font; tile paragraphs → Avenir; "01 THE STUDIO" eyebrow keeps its current font | `assets/studio.css` | ✅ via tokens |
| ~~4.3~~ | ✅ **done** — the copy band was bottom-anchored and grew upward by the length of each tile's copy (measured 405 / 443 / 435). It now takes a fixed share of the tile with the label at its top; equal-height tiles give an equal share an equal start. Verified aligned to the pixel at 1060, 1120, 1200, 1280, 1366 and 1440; below 1025 the mosaic is already one tile per row. | `assets/studio.css` |
| ~~4.4~~ | ✅ **done** — all five tiles carry the verbatim Drive text; nine paragraphs became twenty-one. Tile 04 lost the statement line “NOTHING TEMPLATED. NOTHING IMPOSED.”, which the Drive document carries as body copy rather than a heading. Hero set to CREATED, per that document. | `studio.html` |

Example of the gap, tile 01 — current:

> Founded in Monaco in 2018 on a simple belief:
> EXTRAORDINARY PLACES DESERVE EXTRAORDINARY EXPERIENCES.
> We set out to transport people there long before arrival.
> THAT BELIEF BECAME FRAMEWORKS.

Required (verbatim from Drive):

> Frameworks Studios was founded in Monaco in 2018 with a simple belief:
> EXTRAORDINARY PLACES DESERVE EXTRAORDINARY EXPERIENCES.
> At a time when exceptional spaces were still being presented through traditional photography, brochures and familiar marketing formats, we saw an opportunity to create something more powerful.
> An experience that could transport people into a place long before arrival.
> One that could communicate its ambience, character and ambition — creating emotion, inspiring confidence and building a deeper connection between brands and their audiences.
> THAT BELIEF BECAME FRAMEWORKS.

Tiles 02–05 are similarly abridged. Tile 04's statement line is currently
"NOTHING TEMPLATED. NOTHING IMPOSED." — the Drive doc has no statement line for
BESPOKE BY NATURE and keeps "Nothing is templated. Nothing is imposed." as two
body sentences.

❓ **4.5** The Drive doc's hero reads **"BORN IN MONACO. CREATED AROUND EXPERIENCE."**
The page (and the home-page teaser, per `02 Landing Page.pages`) reads
**"BUILT AROUND EXPERIENCE."** Which is right — and should both match?

❓ **4.6** The full text roughly triples the copy in each tile. The five-tile mosaic
was designed around short blocks. Keep the mosaic and let tiles grow tall, or
re-flow to a different layout? This is a design call, not a code one.

---

## 5. Email 05 — "WORKS amendments" (3 screenshots + 4 Drive links + embeds)

### Already handled
| # | Amendment | Status |
|---|---|---|
| 5.1 | Delete every right-hand sector tagline ("Residences that sell before the first viewing", etc.) | ✅ all nine removed |
| 5.2 | Wrong Super Yachts thumbnail | ✅ (same asset as 3.11) |

### Outstanding
| # | Amendment | Where |
|---|---|---|
| ~~5.3~~ | ✅ **done** — intro lede deleted | `works.html` |
| ~~5.4~~ | ✅ **done** — renamed to his list; Luxury Real Estate kept, making ten sectors (see 5.10). Only the visible names changed: ids, `data-sector`, thumbnail filenames and the `/works#…` anchors keep their slugs, so no inbound link breaks. “ACADEMY’S” set as Academies, “COURES” as Courses. Casing was moot — `.sector-name` sets no `text-transform`; Posterama is a unicase face. | `works.html` |
| ~~5.5~~ | ✅ **done** — King Abdullah Sports City, badged via `tools/build-sector-thumbs.py`. Source is only 1024×713, so it is upscaled ~26% to the 1200×900 slot; a larger original would be better if Martyn has one. | `assets/sectors/sports.webp` + `base/sports.webp` |
| ~~5.6~~ | ✅ **done** — added as the 4th Sports tour, count updated to "4 tours". ❓ It is the only tour with no `data-note`; the others all carry one line. Martyn needs to supply it. | `works.html` |
| ~~5.7~~ | ✅ **done** — added as the tenth sector at 324°. The tour viewer already iframes a tour's `href`, so the three Street View embeds needed no script change and remain plain links without JS. Adding a tenth sector renumbered every bearing from 40° to 36° steps. The supplied thumbnail was a raw capture with the Google info card, mini-map and zoom controls on it, so it is cropped to the clean centre (the Prime Estate shopfront) and badged through the usual tool — **that crop is ours, not the client's**. | `works.html`, `assets/sectors/google-street-view.webp` |
| **5.8** | **New Photograph section.** Drive folder holds six sub-folders: Yacht, Penthouse, Venues, Apartment, Villa, Locations. | new section in `works.html`, new `assets/photography/` |
| ~~5.9~~ | ✅ **done** — a Video band between the sector list and the contact CTA. Two up, one up below 860px, players lazy. The client gave a section name and four titles and no heading copy, so the band carries his labels and nothing of ours; it wants a heading when he supplies one. | `works.html`, `assets/works.css` |

### Sector names — the open question

Martyn's list, verbatim:

```
LUXURY CAR
CHATEAUS & EVENT VENUES
EXCLUSIVE MEMBERS CLUBS & CLUB HOUSES
LUXURY HOTELS & RESORTS
BARS • CAFES & RESTAURANTS
SPORTS: ACADEMY'S • GOLF COURSES • STADIUMS
HERITAGE SITES & TOURISM
SUPER YACHTS
GOOGLE MY BUSINESS & GOOGLE STREET VIEW
```

Current nine on the page: Luxury Real Estate · Super Yachts · Automobiles ·
Event Venues · Exclusive Members Clubs · Hotels & Resorts · Bars, Cafés &
Restaurants · Sports · Heritage & Tourism.

❓ **5.10 — "Luxury Real Estate" is missing from Martyn's list**, yet it is the
largest sector on the page (7 tours: Château Périgord, Villa Dilecta, Hersilia
Monte-Carlo, Le Titien Penthouse, Off-Market Monte-Carlo, Luxury Apartment,
Luxury Villa). His list is also nine long, which suggests GMB/Street View was
meant to *replace* it rather than be added. Those seven tours have to go somewhere.
Is Luxury Real Estate staying (making ten sectors), or were those tours meant to
move into CHATEAUS & EVENT VENUES?

❓ **5.11 — Sector-name casing.** His list is all-caps with trailing colons, which
reads like a plain-text list rather than a styling instruction. The page renders
sector names in title case in the display font. Keep title case
("Chateaus & Event Venues") or switch to all-caps?

❓ **5.12 — "LUXURY CAR" singular** replacing "Automobiles" — confirm, given both
tours under it are Bentleys.

❓ **5.13 — Photograph section.** The Drive folder is six sub-folders of source
photographs, with no brief attached. How many images per sub-folder, what layout
(gallery grid, lightbox, horizontal strip), and do the six sub-folder names become
the on-page categories? Nothing in the email says.

❓ **5.14 — Where do the three new sections sit?** Video and Photograph are new
top-level sections on /works. Order relative to the sector list, and does the page
need in-page navigation once it is this long?

❓ **5.15** The WORKS email ends mid-tag inside the fourth Vimeo iframe, with no
sign-off — unusual for Martyn, whose other four emails all carry his signature.
Worth checking nothing was cut after "Le Palais Heracles".

---

## 7. Found while implementing

**7.1 — the carousel was never running at its authored speed.** `assets/site.js`
sized the loop from `track.scrollWidth` once, at DOMContentLoaded. All 51 logos
are `loading="lazy"` and the band sits well below the fold, so at that moment the
track measured ~3,670px against an eventual ~10,460px. The duration was therefore
set for a third of the real distance and the band ran at roughly **73–85 px/s**
against an authored 30. Enlarging the logos for 3.12 would have made it worse, not
better, so the measurement is now kept in step by a `ResizeObserver` on the track.
At 24 px/s the band is now about **three times slower** than what Martyn saw.

**7.3 — two points of the client's copy differ from his email.** His caption read
"Villa Bayview, Villefrance-sur-Mer"; the town is Villefranche-sur-Mer, and the
spelling was corrected on Cameron's instruction — the one place the page departs
from his wording, so worth mentioning when the amendments are signed off.
Separately, "Little Zoe - Super Yachts Monaco" took the house spaced-em-dash
rule, while the Vimeo player's own title is "Little Zoe - Yacht".

**7.2 — `tools/build-sector-thumbs.py` rebuilds all nine thumbnails.** Running it
for Sports also re-encoded `super-yachts.webp` from its (already-updated) base at
the tool's quality 82, so that file dropped 212 KB → 187 KB. Same photograph, same
badge — encoding only.

---

## 6. Suggested order of work

1. Decide where the work happens (section 0) — commit or stash the main checkout's
   uncommitted work before anything else, so the font changes are not lost.
2. ~~**3.12** logo size + carousel speed~~ — done.
3. ~~**5.3, 5.5, 5.6**~~ — done.
4. **4.3, 4.4** — Studio label alignment and full verbatim copy (pending 4.5/4.6).
5. **5.4** — sector renames, once 5.10–5.12 are answered. Touches /works, /index and asset filenames.
6. ~~**5.7, 5.9**~~ — done.
7. **5.8** — Photograph section, once the brief exists.
8. **2.2** — type/overflow pass across all six pages at the four breakpoints.

---

# 8. Open points awaiting Martyn

Left out of the client-facing document at Cameron's instruction, recorded here so
they are not lost.

1. **Studio hero against the home page.** `/studio` reads “BORN IN MONACO.
   CREATED AROUND EXPERIENCE”, following his Drive document. `index.html:264`
   still reads “Born in Monaco. *Built around experience.*” Both are live and
   they disagree.
2. **Home taster against the Works names.** The home page reads Event Venues and
   Hotels & Resorts, the wording his landing-page email specified; Works now
   reads Chateaus & Event Venues and Luxury Hotels & Resorts.
3. **Two corrections to his sector list** — Academies for “ACADEMY’S”, Courses
   for “COURES”. Made, not yet confirmed by him.
4. **The Video band has no heading.** He supplied a section name and four film
   titles and no heading copy.
5. **Header font.** He sent two to try and asked which suited the site best.
   Posterama 1933 Light is live; Julius Sans One is installed and is a one-line
   swap.
6. **Pikup Padel has no `data-note`** — the only tour without the one-line
   description every other one carries.
7. **The photograph section (5.8).** No brief, and the Drive folder holds about
   45 camera originals of 10–45MB, one of 230MB, which need to come down by some
   route other than the Drive connector.
