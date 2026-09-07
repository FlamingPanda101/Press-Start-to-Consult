"""Render the four PDF editions from the designed HTML.

The design tool exports one paginated HTML document holding all three books. This
prints it with headless Chrome, then splits the result into per-book editions.

Usage:
    python scripts/build-pdfs.py <path-to-folder-containing-the-dc-html>

The folder must also contain the art/ directory the HTML references.

Requires: Google Chrome, and pypdf (python -m pip install pypdf).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.request import pathname2url

import pymupdf
from pypdf import PdfReader, PdfWriter

OUT = os.path.join("docs", "downloads")
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

# Each book's first page is found by these two phrases appearing together, which
# only happens on that book's title page.
BOOKS = [
    ("press-start-to-consult-warp-zone.pdf", "the warp zone", "night-before cheat sheet"),
    ("press-start-to-consult-story-mode.pdf", "story mode", "standard strategy guide"),
    ("press-start-to-consult-new-game-plus.pdf", "new game+", "completion tome"),
]

# The export carries a slot annotation over every illustration for the designer
# ("SLOT 07 / 45, Cosmo_..., --AR 4:5"). It is production scaffolding with no
# place in a reader's copy. Hiding it with CSS is unreliable because the page
# script rewrites those elements, so the blocks are removed from the markup.
# The HUD block uses the same element and is real content, so it is kept.
# The export puts counter(page) in an element's ::after, and that counter only
# resolves inside an @page margin box, so every footer printed "0". The footer is
# a single running element that the print engine repeats, so there is nothing per
# page to fix in the DOM. Blank the ::after here and stamp the real numbers onto
# the finished PDF instead, which also lets each book number from its own page 1.
# Leave the placeholder glyph in place: it gives the badge its designed size.
# Painting over it is what keeps the footer looking like the designer drew it.
NUMBER_PAGES = ""

FOOTER_NAVY = (0.0, 0.18039999902248383, 0.36469998955726624)


def stamp_page_numbers(path: str) -> int:
    """Write each page's own number into the footer badge. Returns pages stamped."""
    doc = pymupdf.open(path)
    stamped = 0
    for i, page in enumerate(doc):
        box = None
        for drawing in page.get_drawings():
            r, fill = drawing["rect"], drawing.get("fill")
            near_bottom = r.y0 > page.rect.height - 60
            small = 15 < r.width < 60 and 8 < r.height < 40
            centred = abs((r.x0 + r.x1) / 2 - page.rect.width / 2) < 40
            if near_bottom and small and centred and fill and                     all(abs(a - b) < 0.02 for a, b in zip(fill, FOOTER_NAVY)):
                box = r
                break
        if box is None:
            continue
        # Redact rather than paint: painting leaves the placeholder digit in the
        # text layer, so a copy or a screen reader would still read "01".
        inner = pymupdf.Rect(box.x0 + 1.4, box.y0 + 1.4, box.x1 - 1.4, box.y1 - 1.4)
        page.add_redact_annot(inner, fill=FOOTER_NAVY)
        # Leave images untouched, or redaction re-encodes every illustration and
        # inflates the file by half.
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
        size = 9 if inner.height >= 12 else 7
        # insert_textbox aligns from the top, so nudge down to sit optically centred.
        slot = pymupdf.Rect(inner.x0, inner.y0 + (inner.height - size) / 2 - 1,
                            inner.x1, inner.y1 + size)
        page.insert_textbox(slot, str(i + 1), fontname="cobo", fontsize=size,
                            color=(1, 1, 1), align=pymupdf.TEXT_ALIGN_CENTER)
        stamped += 1
    doc.save(path + ".tmp", garbage=4, deflate=True)
    doc.close()
    os.replace(path + ".tmp", path)
    return stamped

ANNOTATION = re.compile(r'<sc-if[^>]*value="\{\{\s*showGists\s*\}\}"[^>]*>.*?</sc-if>', re.S)


def find_chrome() -> str:
    for c in CHROME_CANDIDATES:
        if os.path.exists(c):
            return c
    found = shutil.which("chrome") or shutil.which("google-chrome")
    if found:
        return found
    raise SystemExit("FAIL could not find Google Chrome")


def main() -> int:
    if len(sys.argv) < 2:
        print("give the folder holding the .dc.html export")
        return 2
    src_dir = os.path.abspath(sys.argv[1])
    html = next((os.path.join(src_dir, f) for f in os.listdir(src_dir) if f.endswith(".dc.html")), None)
    if not html:
        print(f"FAIL no .dc.html found in {src_dir}")
        return 1
    if not os.path.isdir(os.path.join(src_dir, "art")):
        print(f"FAIL {src_dir} has no art/ directory, so the images would be missing")
        return 1

    # Write the print copy beside the source so its relative art paths still resolve.
    print_html = os.path.join(src_dir, "_print.html")
    body = open(html, encoding="utf-8", errors="replace").read()
    body, removed = ANNOTATION.subn("", body)
    if removed == 0:
        print("FAIL found no slot annotations to remove; the export format changed")
        return 1
    print(f"removed {removed} designer slot annotations")
    body = body.replace("</body>", NUMBER_PAGES + "</body>", 1)
    open(print_html, "w", encoding="utf-8").write(body)

    os.makedirs(OUT, exist_ok=True)
    complete = os.path.abspath(os.path.join(OUT, "press-start-to-consult-complete.pdf"))
    url = "file:///" + pathname2url(print_html).lstrip("/")

    with tempfile.TemporaryDirectory() as profile:
        cmd = [
            find_chrome(), "--headless=new", "--disable-gpu", "--no-sandbox",
            f"--user-data-dir={profile}",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=60000",
            "--no-pdf-header-footer",
            f"--print-to-pdf={complete}",
            url,
        ]
        proc = subprocess.run(cmd, capture_output=True, timeout=900, text=True)
    if not os.path.exists(complete):
        print("FAIL Chrome produced no PDF")
        print("  exit:", proc.returncode)
        for line in (proc.stderr or "").strip().splitlines()[-6:]:
            print("  chrome:", line)
        return 1
    os.remove(print_html)

    reader = PdfReader(complete)
    pages = [(p.extract_text() or "").replace("\n", " ").lower() for p in reader.pages]
    total = len(pages)

    starts = []
    for name, a, b in BOOKS:
        hit = next((i for i, t in enumerate(pages) if a in t and b in t), None)
        if hit is None:
            print(f"FAIL could not locate the first page of {name}")
            return 1
        starts.append((name, hit))

    if [s for _, s in starts] != sorted(s for _, s in starts):
        print("FAIL the books are not in the expected order in the document")
        return 1

    bounds = []
    for i, (name, start) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else total
        bounds.append((name, start, end))

    print(f"{total} pages in the complete edition")
    for name, start, end in bounds:
        w = PdfWriter()
        for p in range(start, end):
            w.add_page(reader.pages[p])
        path = os.path.join(OUT, name)
        with open(path, "wb") as fh:
            w.write(fh)
        n = stamp_page_numbers(path)
        if n != end - start:
            print(f"FAIL {name}: numbered {n} of {end - start} pages")
            return 1
        print(f"  {name:44} pages {start + 1:>3} to {end:<3} ({end - start:>2} pages, {os.path.getsize(path) / 1e6:.1f} MB, renumbered from 1)")

    n = stamp_page_numbers(complete)
    if n != total:
        print(f"FAIL the complete edition numbered {n} of {total} pages")
        return 1
    print(f"  {'press-start-to-consult-complete.pdf':44} pages   1 to {total:<3} ({total:>2} pages, {os.path.getsize(complete) / 1e6:.1f} MB, renumbered from 1)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
