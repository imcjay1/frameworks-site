# Frameworks Studios — Website

Scroll-driven single-page site for Frameworks Studios (luxury 360° VR tours, Monaco).

## Structure
- `index.html` — the entire site (styles + script inline). The scroll hero scrubs
  `assets/showreel.mp4` (four stitched films: liquid chrome → glass transformation →
  camera reveal → exploded view → rebuild). Encoded 1080p / 12fps / all-intra for
  smooth scrubbing — re-encode any replacement footage the same way:
  `ffmpeg -i in.mp4 -vf scale=1920:1080,fps=12 -c:v libx264 -preset slow -crf 28 -g 1 -movflags +faststart -an out.mp4`
- `assets/showreel.mp4` — the scrub film (~9 MB).
- `vercel.json` — long-cache headers for /assets.

## Key tunables (in index.html)
- `.scrub-track{height:1380vh}` — total scroll length of the film.
- `.cap` / `.tcap` elements — `data-start` / `data-end` are scroll fractions (0–1).
- Smooth scroll feel: the `0.07` lerp in the smooth-scroll block.
- Scrub lerp: `0.18`; seek threshold `0.042` (matched to 12fps source).

## TODO before launch
- Sector hover previews (`data-img` on `.sector-row`) currently hotlink Higgsfield's
  CDN — download the 7 PNGs into `assets/` and update the paths. Ideally replace
  with real Frameworks portfolio photography.
- "Start a project" buttons point at `#` — wire to the contact form / booking email.
- Confirm copy with client: team size (About doc says 60+ long / 40+ short version),
  and the caption lines "High-resolution sensors" / "Cinema-grade" phrasing.

## Deploy
Static site, no build step. `npx vercel` from this folder, or import the GitHub
repo in the Vercel dashboard (Framework preset: Other, no build command,
output directory: ./).
