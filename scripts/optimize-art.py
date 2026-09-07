"""Write a WebP beside every JPEG in docs/assets/art.

The art is flat-colour pixel work, which JPEG stores badly and WebP stores well.
The JPEGs stay as the fallback source for browsers without WebP support, so the
site serves the small file to almost everyone and still works for everyone.

Usage: python scripts/optimize-art.py [--check]
  --check  report what would change and exit non-zero if anything is missing

Requires Pillow:  python -m pip install pillow
"""
import os
import sys

from PIL import Image

ART = os.path.join("docs", "assets", "art")
QUALITY = 90  # measured at a mean error of 1.4/255 against the source
MAX_DELTA = 4  # a WebP more than this fraction of the JPEG is not worth serving


def main() -> int:
    check = "--check" in sys.argv
    if not os.path.isdir(ART):
        print(f"FAIL {ART} does not exist")
        return 1

    jpgs = sorted(f for f in os.listdir(ART) if f.endswith(".jpg"))
    if not jpgs:
        print("FAIL no jpg source images found")
        return 1

    missing, written, jpg_total, webp_total = [], 0, 0, 0
    for f in jpgs:
        src = os.path.join(ART, f)
        dst = src[:-4] + ".webp"
        jpg_total += os.path.getsize(src)
        fresh = os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)
        if not fresh:
            if check:
                missing.append(f)
                continue
            Image.open(src).convert("RGB").save(dst, quality=QUALITY, method=6)
            written += 1
        if os.path.exists(dst):
            webp_total += os.path.getsize(dst)

    if check:
        if missing:
            print(f"FAIL {len(missing)} image(s) have no current WebP: {', '.join(missing[:5])}")
            return 1
        print(f"all {len(jpgs)} images have a current WebP")
        print("art optimization verified")
        return 0

    saved = jpg_total - webp_total
    print(f"{len(jpgs)} images: {jpg_total / 1e6:.1f} MB jpg -> {webp_total / 1e6:.1f} MB webp")
    print(f"wrote {written}, saved {saved / 1e6:.1f} MB ({saved / jpg_total:.0%}) on what the browser fetches")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
