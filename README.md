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
  showreel.mp4                              the scrub film (~18 MB)
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

## Contact form

`contact.html` posts natively to `api/contact.js`, which emails the enquiry via
[Resend](https://resend.com) and redirects back to `/contact?sent=1`. `site.js`
upgrades it to submit in place when JavaScript is available. It works either way.

**It needs two environment variables in the Vercel dashboard before it will
send:**

| variable | value |
|---|---|
| `RESEND_API_KEY` | an API key from resend.com |
| `CONTACT_TO` | the address enquiries should reach |
| `CONTACT_FROM` | optional; a verified sender on your own domain |

Until they are set the endpoint returns a clear message rather than failing
silently. A hidden `_gotcha` honeypot field absorbs bots.

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
