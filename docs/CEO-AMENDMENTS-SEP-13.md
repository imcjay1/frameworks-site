# CEO amendments — 13 Sep 2026 (Martyn Fairbairn, 5 emails)

Source: 5 emails from martyn@frameworksstudios.com, 13 Sep 2026, with 18 annotated
screenshots, 3 font archives, 6 Google Drive links and 2 Pages documents.

Everything below was read from the emails, the annotated screenshots, the Drive
folders and the two Pages docs (`02 Landing Page.pages`, `03. the STUDIO.pages`).

**Status key:** ✅ already done in the uncommitted work on `Frameworks-Site` ·
🔲 outstanding · ❓ needs a decision from Martyn or Cameron.

---

## 0. Where the work actually lives — read this first

The main checkout `/Users/cam77/Documents/FRAMEWORK/frameworks-site` is on branch
`Frameworks-Site` with **~300 lines of uncommitted changes across 17 files**, plus an
untracked `assets/fonts/` directory holding the new Posterama / Julius / Avenir
web fonts. That uncommitted work already implements most of emails 01, 02 and 04.

This worktree (`claude/ceo-site-amendments-review-a4fefb`) sits at commit `4801b5c`
and has **none** of it. Any edit made here would duplicate or conflict with it.

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
| **4.3** | **"01, 02, 03 etc should be in a line"** — the three tile labels in row 1 currently sit at three different heights because each tile's copy block is bottom-aligned to a different length. They must align on one horizontal baseline across the row. | `assets/studio.css` — give `.tile-label` a fixed row position (grid row / `align-self`) rather than letting it float above variable-length copy | 🔲 **outstanding** |
| **4.4** | **"add in FULL text from Google Drive page"** — all five tiles currently carry an abridged précis. Replace with the verbatim copy from `03. the STUDIO.pages` (reproduced in `docs/PENDING-REBUILDS.md` TASK 4, which matches the Drive doc word for word). | `studio.html` tiles 01–05 | 🔲 **outstanding** |

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
| **5.4** | **"Wrong sector names"** — rename all nine (see the open question below) | `works.html` `.sector-name` × 9, plus `id`s, the `/works#…` anchors on `index.html`, and `assets/sectors/*.webp` filenames |
| ~~5.5~~ | ✅ **done** — King Abdullah Sports City, badged via `tools/build-sector-thumbs.py`. Source is only 1024×713, so it is upscaled ~26% to the 1200×900 slot; a larger original would be better if Martyn has one. | `assets/sectors/sports.webp` + `base/sports.webp` |
| ~~5.6~~ | ✅ **done** — added as the 4th Sports tour, count updated to "4 tours". ❓ It is the only tour with no `data-note`; the others all carry one line. Martyn needs to supply it. | `works.html` |
| **5.7** | **New sector: "GOOGLE MY BUSINESS & GOOGLE STREET VIEW"** with three Street View embeds — Prime Estate Monaco, Quiet Coffee Riyadh, Balkin Estates Monaco. Thumbnail supplied in Drive (`Screenshot 2026-09-02 at 23.26.41.png`, 6.7 MB — needs resizing to the 1200×900 webp the other sector thumbs use). | `works.html` + new `assets/sectors/google-street-view.webp` |
| **5.8** | **New Photograph section.** Drive folder holds six sub-folders: Yacht, Penthouse, Venues, Apartment, Villa, Locations. | new section in `works.html`, new `assets/photography/` |
| **5.9** | **New Video section** — four Vimeo embeds: Villa Lola (805149434), Villa Bayview (805115453), Little Zoe (816077202), Le Palais Heracles (805172489) | new section in `works.html` |

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
6. **5.7, 5.9** — GMB/Street View sector and Video section; both have all their content.
7. **5.8** — Photograph section, once the brief exists.
8. **2.2** — type/overflow pass across all six pages at the four breakpoints.
