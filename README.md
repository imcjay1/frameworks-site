# Frameworks Studios — Website

Six-page static site for Frameworks Studios (luxury 360° VR tours, Monaco).
No build step: the HTML, CSS and JS ship as written.

## Structure

```
index.html               /                  scroll-scrubbed showreel hero, trusted-by, teasers
craft.html               /craft
sectors.html             /sectors
studio.html              /studio            studio copy + results + global presence
digital-services.html    /digital-services
contact.html             /contact           enquiry form
api/contact.js                              serverless endpoint for the form
assets/
  site.css                                  every page
  site.js                                   every page — owns the single rAF loop
  home.js                                   index.html only — the scrub hero
  digital.css / digital.js                  digital-services.html only — dark theme,
                                            reactive field, animated text, accordion
  showreel.mp4                              the scrub film (~18 MB)
  backdrop.mp4 / backdrop-poster.jpg        digital-services backdrop (~11 MB / 83 KB)
  brand/                                    logo assets, generated (see below)
  sectors/                                  sector hover previews
  clients/                                  trusted-by logos (empty until supplied)
tools/build-logo.py                         regenerates assets/brand/
tools/sync-partials.py                      keeps the shared header/footer in sync
```

Extensionless URLs come from `"cleanUrls": true` in `vercel.json`; `/craft/`
redirects to `/craft` via `"trailingSlash": false`.

## Shared header and footer

Each page holds its own copy of the nav and footer so the site is navigable with
JavaScript disabled and fully crawlable. **`index.html` is the source of truth.**
The blocks are delimited by markers:

```
<!-- #region SHARED:head -->   … <!-- #endregion SHARED:head -->
<!-- #region SHARED:nav -->    … <!-- #endregion SHARED:nav -->
<!-- #region SHARED:cta -->    … <!-- #endregion SHARED:cta -->   (not on /contact)
<!-- #region SHARED:foot -->   … <!-- #endregion SHARED:foot -->
```

After editing any of them in `index.html`:

```sh
python3 tools/sync-partials.py           # rewrite the other five pages
python3 tools/sync-partials.py --check   # report drift only; exits 1 if any
```

`aria-current="page"` is the one attribute allowed to differ per page, and the
script reapplies it from each file's `<body data-page="…">`. Run `--check` before
deploying.

## The logo

The client artwork is a square lockup with the wordmark set *inside* the
spirograph ring, where it is illegible below about 100px. `tools/build-logo.py`
separates the two by connected component — the 19 glyph shapes sit in the ring's
open centre and touch nothing, and the script asserts that no ring coverage is
lost before it cuts. It emits transparent, tinted PNGs:

| file | used for |
|---|---|
| `mark-{ink,ivory}.png` | the ring alone — header, 34px (26px scrolled) |
| `wordmark-{ink,ivory}.png` | the wordmark alone — header, beside the ring |
| `lockup-{ink,ivory}.png` | the full artwork — footer, 112px |
| `favicon-48.png`, `apple-touch-icon.png` | icons |

To regenerate from new artwork (needs Pillow + numpy, no ImageMagick):

```sh
python3 tools/build-logo.py "path/to/black-on-white.jpeg"
```

`ink` variants are for the ivory background, `ivory` variants for the dark bands.

## Adding a client logo ("Trusted by")

The banner on the home page currently shows **placeholder names** — `Client One`
… `Client Ten`. Replacing one with a real logo is a single-line edit inside the
one `<ul class="marquee-track">`:

```html
<li class="client">
  <img src="/assets/clients/acme-group.svg" alt="Acme Group"
       width="160" height="44" loading="lazy" decoding="async">
</li>
```

- SVG preferred, or transparent PNG at least 92px tall; trim the whitespace so
  the mark, not the canvas, fills the 46px row.
- `/assets/clients/*` is served `immutable` for a year — **never overwrite a
  file**, publish a new name (`acme-group-v2.svg`).
- Aim for 8–14 items. Logos are greyscaled until hover.
- Only the first track is authored; `site.js` clones it for the seamless loop,
  so the list is maintained in one place.

## The page transition

Navigating **into or out of `/digital-services`** drops seven black bars down the
screen, one after the other, then navigates. The incoming page finishes the move
— the bars keep falling and clear off the bottom. Links between the ivory pages
navigate plainly. The two halves are separate page loads, so `site.js` leaves a
`sessionStorage` flag on the way out and the arriving page plays the second half
only if it finds one; a bookmarked URL or a cold load never starts underneath a
black cover.

Timings live at the top of that block in `site.js` (`BARS`, `STAGGER`, `COVER`,
`REVEAL`). Under `prefers-reduced-motion` no curtain is built at all and links
navigate normally.

Two things there are load-bearing and easy to undo by accident:

- The bars' stagger is a `transition-delay` set in CSS from a `--i` custom
  property, and the duration is set with **longhands, never the `transition`
  shorthand**. The shorthand resets `transition-delay` to zero, which lands every
  bar at once — the whole effect is the offset.
- The state classes are `is-covering` / `is-revealing` / `is-instant`. They must
  not be called `reveal`: that is the site's scroll-reveal class, whose
  `opacity:0` would hide the bars entirely.

## Digital Services — the dark page

`/digital-services` is the only dark page. It carries `data-theme="dark"` on
`<body>`, which `assets/digital.css` scopes everything to, and it loads two extra
files.

- **The backdrop** is `assets/backdrop.mp4` (1920×1080, 6s loop, 11 MB) fixed
  behind the whole page, with `assets/backdrop-poster.jpg` (83 KB) standing in
  until it is ready. The `<video>` ships with **no `src`**; `digital.js` adds one
  only on a screen wider than 820px, on a connection that has not asked to save
  data, and when motion is not suppressed. Everyone else — including anyone
  without JavaScript — keeps the poster, so a phone never pulls 11 MB.

  **`.backdrop` must stay at `z-index:-1`.** At `0` this fixed layer composited
  *over* content further down the page even though `<main>` was lifted above it:
  the last section's heading painted and was then hidden by the veil. Sitting
  genuinely behind everything removes the ordering question, and a negative
  z-index still paints above the body background, so the film is unaffected.
- **The field** is a canvas of scan lines that bend away from the pointer and
  drift with the scroll, kept deliberately faint now that the film sits behind
  it — it is there for the pointer to push against, not to be looked at.
  Tunables are `RADIUS`, `PUSH`, `ROWS`, `COLS` in `digital.js`. Without a
  pointer (touch, or before the first move) it wanders on its own.
- **Text** is animated by attribute: `data-split` splits a heading into masked
  words that rise in sequence (`data-step` sets the stagger), `data-fade` fades a
  block up (its value is a delay in ms), and `data-decode` scrambles a monospace
  label into place. All three are triggered by an IntersectionObserver.
- **The services accordion** opens one panel at a time. Collapsed panels are made
  `inert` so their content stays out of the tab order, and a `<noscript>` rule in
  the page opens every panel when JS is unavailable.
- **Glass.** One recipe in `digital.css` covers every card — the pillars, the
  eight service panes, the method steps and the hero pills: a blurred pane, a
  bright top rim, a chromatic refracted edge, and a specular highlight that
  tracks the pointer via `--mx` / `--my`. The `.aurora` layer of slow drifting
  colour blobs is what makes any of it visible: `backdrop-filter` over flat black
  has nothing to refract. Movement is split across independent properties on
  purpose — the reveal owns `transform`, the hover lift and the pillars' float
  own `translate` — because an animation on the same property wins over both.
- Tokens are deliberately **not** inverted on this page — the nav's `.on-dark`
  rules and the shared contact band already treat ink as dark and ivory as light,
  and swapping the meanings underneath them turns the current-page pill inside
  out. Only the surfaces this page paints are overridden.

## Forms

There are three, all posting to the one endpoint, `api/contact.js`, which emails
via [Resend](https://resend.com). Every form posts natively and works with
JavaScript disabled; the scripts upgrade them to submit in place.

| form | where | handled by |
|---|---|---|
| Enquiry | `/contact` | `site.js` (bound by `#contact-form`) |
| Enquiry | `/digital-services` | `digital.js` |
| Call request | `/digital-services` | `digital.js` |

**Enquiries go to `cameron@frameworksstudios.com`** — set as the default in
`api/contact.js`, overridable with a `CONTACT_TO` environment variable.

**One environment variable is required in the Vercel dashboard before anything
will send:**

| variable | value |
|---|---|
| `RESEND_API_KEY` | an API key from resend.com — **required** |
| `CONTACT_TO` | optional; overrides the destination above |
| `CONTACT_FROM` | optional; a verified sender on your own domain. Without it Resend delivers only to the account owner's address |

Until the key is set the endpoint returns a message telling the visitor to email
directly, rather than failing silently. A hidden `_gotcha` honeypot absorbs bots,
and it answers those as if they succeeded so there is nothing to learn from the
difference.

### The Digital Services conversion panel

One glass panel with two tabs. Both are built for as little friction as possible:
only name and email are required, everything else qualifies the lead.

- **Send an enquiry** — service chips (multi-select, so one visitor can pick
  several), name, email, company, phone, budget, timeline, free-text notes.
  Checkbox groups arrive as repeated keys, which is why the endpoint parses the
  body itself rather than using `Object.fromEntries` — that keeps only the last
  value of a repeated key and would silently drop every service but one.
- **Book a call** — a date picker built in `digital.js` (weekdays only, from
  tomorrow to 90 days out) plus an hourly slot. Worth being clear in any copy
  changes: **this requests a time, it does not confirm one.** There is no
  calendar integration behind it, so the wording says we confirm by email and
  nothing is booked until we do.
- Validation is inline and per-field, with the message appearing under the
  offending input and the first one focused and scrolled to.
- On success the panel swaps to a confirmation with an animated tick. A native
  (JavaScript-off) submit returns to `/digital-services?sent=enquiry|call` and
  the same panel is shown from that flag. The endpoint only honours a `next`
  value that is a same-origin path, so it cannot be turned into an open redirect.

## Key tunables (assets/home.js + assets/site.css)

- `.scrub-track{height:1380vh}` — total scroll length of the film.
- `.cap` / `.tcap` elements — `data-start` / `data-end` are scroll fractions (0–1).
- Smooth scroll feel: the `0.07` lerp in `site.js`.
- Scrub lerp `0.18`; seek threshold `0.042` — matched to the 12fps source.
- `assets/showreel.mp4` is encoded 1080p / 12fps / all-intra for smooth
  scrubbing. Re-encode any replacement the same way:
  `ffmpeg -i in.mp4 -vf scale=1920:1080,fps=12 -c:v libx264 -preset slow -crf 28 -g 1 -movflags +faststart -an out.mp4`

## Running it locally

`python3 -m http.server` **will 404 on `/craft`** — it does not map extensionless
paths to `.html`, and it does not serve byte ranges, so the showreel cannot seek.
Use one of:

```sh
npx serve .        # matches Vercel's cleanUrls behaviour
npx vercel dev     # also runs api/contact.js and applies vercel.json headers
```

## Checks before deploying

There is no test suite; this is the test plan.

1. `python3 tools/sync-partials.py --check` prints `ok:` for all six pages.
2. Every nav link resolves on every page:
   `grep -ohE 'href="[^"]*"' *.html | sort -u`
3. On `/craft`, the network panel shows **no** `showreel.mp4` and **no**
   `home.js` — those belong to the home page alone.
4. Home page: scroll to the midpoint and confirm the viewfinder reads about
   `PAN 180°`, half the transport ticks are lit, captions rise and recede, the
   glitch captions scramble, the island collapses to the ring pill.
5. Trusted-by: the loop seam is invisible over three passes; it pauses on hover
   and on keyboard focus.
6. Widths 375 / 768 / 900 / 1180 / 1440. Below 900px the nav becomes a drawer —
   check Escape closes it and the page behind does not scroll.
7. Console clean on all six pages.

## Deploy

Static, no build step. `npx vercel` from this folder, or import the repo in the
Vercel dashboard (Framework preset: Other, no build command, output `./`).
`api/contact.js` is picked up automatically.

## Outstanding

- **The canonical domain is a guess.** Every page carries
  `<link rel="canonical">` and `og:url` pointing at `https://frameworks-studios.com`.
  Replace it with the real domain before launch:
  `grep -rl frameworks-studios.com *.html`
- **Client logos and names** for the Trusted by banner — placeholders in place.
- **Digital Services copy** — the six-service list is scaffolded from vocabulary
  already used elsewhere on the site and needs the client's own descriptions.
- **Per-sector detail** on `/sectors` — space reserved, copy pending.
- **Team size** — the About document says 40+ in its short version and 60+ in the
  long one; `/studio` currently says 60+.
- **Contact email + Resend key** — see above.
- The sector hover images are AI-generated placeholders; replace with real
  Frameworks portfolio photography when available (drop new files into
  `assets/sectors/` and update the `data-img` attributes on the `.sector-row`s).
