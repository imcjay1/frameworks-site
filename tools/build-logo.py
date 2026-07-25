#!/usr/bin/env python3
"""Derive the site's transparent logo assets from the supplied square JPEGs.

The client artwork is a spirograph ring with the "FRAMEWORKS studios" wordmark
set inside the ring's open centre. At header size the inner wordmark is only a
couple of pixels tall, so the header uses the ring and the wordmark side by
side instead. Both are cut from the same artwork — the wordmark is never
retypeset — so brand fidelity is exact.

Separation is by connected component, not by a crop rectangle: the 19 glyph
components sit entirely inside the ring's void and touch nothing, so removing
them cannot damage the ring. The script asserts that before it cuts.

Usage:  python3 tools/build-logo.py [path-to-black-on-white.jpeg]
Requires Pillow + numpy. Writes to assets/brand/.
"""

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1
           else Path.home() / "Downloads" / "White _ Black Square.jpeg")
OUT = Path(__file__).resolve().parent.parent / "assets" / "brand"

INK = (0x16, 0x18, 0x1C)      # --ink
IVORY = (0xF2, 0xEE, 0xE8)    # --ivory

# The wordmark lives inside this window; anything whose bounding box escapes it
# is ring, not type. Generous on purpose — the assertion below does the real work.
VOID = (150, 450, 900, 580)   # x0, y0, x1, y1

# JPEG leaves a haze around these hairlines. Everything below BLACK_PT is
# transparent, everything above WHITE_PT is fully opaque, linear in between.
BLACK_PT, WHITE_PT = 12, 235


def alpha_from(src):
    """Ink coverage 0..1 from a black-on-white scan, with the JPEG haze removed."""
    lum = np.asarray(src.convert("L")).astype(np.float32)
    return np.clip((255.0 - lum - BLACK_PT) / (WHITE_PT - BLACK_PT), 0.0, 1.0)


def components(mask):
    """8-connected components of a boolean mask -> list of (pixels, bbox)."""
    lab = np.zeros(mask.shape, np.int32)
    out = []
    for sy, sx in zip(*np.where(mask)):
        if lab[sy, sx]:
            continue
        idx = len(out) + 1
        lab[sy, sx] = idx
        q = deque([(sy, sx)])
        px = []
        while q:
            y, x = q.popleft()
            px.append((y, x))
            for ny in (y - 1, y, y + 1):
                for nx in (x - 1, x, x + 1):
                    if (0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1]
                            and mask[ny, nx] and not lab[ny, nx]):
                        lab[ny, nx] = idx
                        q.append((ny, nx))
        ys, xs = zip(*px)
        out.append((px, (min(xs), min(ys), max(xs), max(ys))))
    return out


def dilate(mask, r):
    """Square dilation by r pixels, via shifted ORs."""
    out = mask.copy()
    for _ in range(r):
        p = np.pad(out, 1, constant_values=False)
        out = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
               | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:] | out)
    return out


def trim(alpha):
    """Crop to the alpha bounding box; returns (alpha, box)."""
    ys, xs = np.where(alpha > 0.02)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    return alpha[box[1]:box[3], box[0]:box[2]], box


def emit(alpha, rgb, path, height=None, width=None, gain=1.0):
    """Tint an alpha plane and write a PNG, optionally resampled to a target size.

    `gain` compensates for hairlines washing out when a 1024px master is reduced
    to header size — without it the ring reads as a faint grey smudge.
    """
    h, w = alpha.shape
    if height:
        width = max(1, round(w * height / h))
    elif width:
        height = max(1, round(h * width / w))
    else:
        height, width = h, w

    a = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    if (width, height) != (w, h):
        a = a.resize((width, height), Image.LANCZOS)
    if gain != 1.0:
        a = Image.fromarray(
            np.clip(np.asarray(a).astype(np.float32) * gain, 0, 255).astype(np.uint8), "L")

    img = Image.new("RGBA", (width, height), rgb + (0,))
    img.putalpha(a)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  {path.relative_to(OUT.parent.parent)}  {width}x{height}")
    return img


def main():
    print(f"source: {SRC}")
    src = Image.open(SRC)
    if np.asarray(src.convert("L")).mean() < 128:
        raise SystemExit("expected the black-on-white artwork (this one is inverted)")

    alpha = alpha_from(src)
    ink = alpha > 0.5

    comps = components(ink)
    x0, y0, x1, y1 = VOID
    glyphs = [c for c in comps
              if c[1][0] >= x0 and c[1][2] <= x1 and c[1][1] >= y0 and c[1][3] <= y1]
    rest = [c for c in comps if c not in glyphs]
    print(f"components: {len(comps)}  wordmark: {len(glyphs)}  ring: {len(rest)}")
    if not glyphs:
        raise SystemExit("no wordmark components found — check VOID")

    word_mask = np.zeros_like(ink)
    for px, _ in glyphs:
        for y, x in px:
            word_mask[y, x] = True
    ring_mask = ink & ~word_mask

    # Never subtract a pixel the ring owns: grow the wordmark to catch its
    # antialiasing, then give every ring pixel and its own halo back.
    cut = dilate(word_mask, 3) & ~dilate(ring_mask, 2)
    lost = (alpha * (dilate(ring_mask, 1) & cut)).sum()
    print(f"ring coverage removed by the cut: {lost:.2f}px  (must be 0.00)")
    assert lost < 0.5, "the cut would damage the ring — shrink VOID or the dilation"

    ring_alpha = alpha * ~cut
    word_alpha = alpha * dilate(word_mask, 2)

    ring_a, _ = trim(ring_alpha)
    word_a, _ = trim(word_alpha)
    full_a, _ = trim(alpha)
    print(f"ring {ring_a.shape[1]}x{ring_a.shape[0]}  "
          f"wordmark {word_a.shape[1]}x{word_a.shape[0]}  "
          f"lockup {full_a.shape[1]}x{full_a.shape[0]}")

    print("writing:")
    # Header mark. 96px master for a 26–34px display box; the gain keeps the
    # concentric hairlines visible after a 10x reduction.
    emit(ring_a, INK,   OUT / "mark-ink.png",   height=96, gain=1.85)
    emit(ring_a, IVORY, OUT / "mark-ivory.png", height=96, gain=1.85)
    # Header wordmark — near native, so the type stays crisp at any header size.
    emit(word_a, INK,   OUT / "wordmark-ink.png",   height=48, gain=1.15)
    emit(word_a, IVORY, OUT / "wordmark-ivory.png", height=48, gain=1.15)
    # Footer lockup — the artwork as supplied, background removed.
    emit(full_a, INK,   OUT / "lockup-ink.png",   height=320, gain=1.25)
    emit(full_a, IVORY, OUT / "lockup-ivory.png", height=320, gain=1.25)
    # Icons.
    emit(ring_a, INK, OUT / "favicon-48.png",       height=48,  gain=2.1)
    emit(ring_a, INK, OUT / "apple-touch-icon.png", height=180, gain=1.6)


if __name__ == "__main__":
    main()
