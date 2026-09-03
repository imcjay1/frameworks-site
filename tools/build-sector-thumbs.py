#!/usr/bin/env python3
"""Badge the sector hover thumbnails with the client's 360° mark.

Every row in the sector list on / and /works opens a 360° tour, so every hover
thumbnail carries the same mark. The un-badged photographs live in
assets/sectors/base/; this script writes the badged versions one level up, to
assets/sectors/, which is what the pages actually reference. Keeping the two
apart makes the build idempotent — re-running never badges a badged image.

The mark is white, and several of the photographs are bright, so it is laid over
a soft radial scrim and given a blurred shadow. Neither is heavy enough to read
as a plate; at the 360px the preview card renders at, the mark simply sits on
the image.

A base file whose name starts with an underscore is a spare — a photograph kept
for a sector that ended up using a different frame. It is skipped, so parking one
never leaves an orphan image in the deployed folder.

Usage:  python3 tools/build-sector-thumbs.py [path-to-360-icon.png]
Requires Pillow. Reads assets/sectors/base/*.webp, writes assets/sectors/*.webp.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "assets" / "sectors" / "base"
OUT = ROOT / "assets" / "sectors"
ICON = Path(sys.argv[1] if len(sys.argv) > 1
            else Path.home() / "Downloads" / "360-icon.png")

SIZE = (1200, 900)          # 4:3 — the ratio .sector-preview reserves
BADGE_W = 0.24              # mark width as a fraction of the frame
SCRIM = 0.34                # peak darkening under the mark
SCRIM_R = 0.62              # scrim reaches zero at this fraction of the half-diagonal
QUALITY = 82


def cover(im, size):
    """Resize to fill `size`, cropping the overflowing axis evenly."""
    tw, th = size
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    rw, rh = round(sw * scale), round(sh * scale)
    im = im.resize((rw, rh), Image.LANCZOS)
    left, top = (rw - tw) // 2, (rh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def scrim(size):
    """A centred radial darkening, drawn small and scaled up so it stays smooth."""
    w, h = size
    small = (w // 8, h // 8)
    mask = Image.new("L", small, 0)
    d = ImageDraw.Draw(mask)
    cx, cy = small[0] / 2, small[1] / 2
    reach = ((cx ** 2 + cy ** 2) ** 0.5) * SCRIM_R
    steps = 48
    for i in range(steps, 0, -1):
        t = i / steps
        r = reach * t
        # falls off as the square of the distance — no visible edge to the scrim
        d.ellipse((cx - r, cy - r, cx + r, cy + r),
                  fill=round(255 * SCRIM * (1 - t) ** 2))
    mask = mask.resize(size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(w / 60))
    return mask


def load_mark():
    im = Image.open(ICON).convert("RGBA")
    box = im.getchannel("A").getbbox()      # the supplied file is padded; cut it tight
    if box:
        im = im.crop(box)
    return im


def badge(photo, mark, dark):
    w, h = photo.size
    photo = photo.convert("RGBA")
    photo.paste(Image.new("RGBA", photo.size, (0, 0, 0, 255)), (0, 0), dark)

    mw = round(w * BADGE_W)
    mh = round(mark.height * mw / mark.width)
    m = mark.resize((mw, mh), Image.LANCZOS)
    x, y = (w - mw) // 2, (h - mh) // 2

    # shadow first, so the white mark reads over the pale frames too
    shadow = Image.new("RGBA", photo.size, (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", m.size, (0, 0, 0, 140)), (x, y + round(h * 0.006)), m)
    photo.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(w / 110)))
    photo.alpha_composite(m, (x, y))
    return photo.convert("RGB")


def main():
    if not ICON.exists():
        sys.exit("360° mark not found: %s" % ICON)
    sources = [p for p in sorted(BASE.glob("*.webp")) if not p.name.startswith("_")]
    if not sources:
        sys.exit("no base photographs in %s" % BASE)

    mark = load_mark()
    dark = scrim(SIZE)
    for src in sources:
        photo = cover(Image.open(src).convert("RGB"), SIZE)
        out = OUT / src.name
        badge(photo, mark, dark).save(out, "WEBP", quality=QUALITY, method=6)
        print("%-28s %6.1f kB" % (out.name, out.stat().st_size / 1024))


if __name__ == "__main__":
    main()
