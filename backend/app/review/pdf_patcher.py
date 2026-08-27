"""
PDF in-place text patcher using PyMuPDF (fitz).

For each {original → improved} fix:
  1. Locate the text on each page with page.search_for().
  2. Identify the font metadata (name, size, color, baseline) from the nearest span.
  3. Tier-1: improved text fits at original font size → insert as-is.
     Tier-2: too long → reduce font in 0.5pt steps down to 80% of original.
     Tier-3: still doesn't fit → leave original untouched, add to skipped list.
"""

import re

import fitz  # PyMuPDF


_RIGHT_MARGIN_PT = 42  # conservative right-margin assumption for A4/Letter CVs

_BUILTIN_FONT_MAP = {
    "helvetica": "helv",
    "helvetica-bold": "hebo",
    "helvetica-oblique": "heob",
    "helvetica-boldoblique": "hebi",
    "times-roman": "tiro",
    "times": "tiro",
    "times-bold": "tibo",
    "times-italic": "tiit",
    "times-bolditalic": "tibi",
    "courier": "cour",
    "courier-bold": "cobo",
    "courier-oblique": "coit",
    "courier-boldoblique": "cobi",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _int_to_rgb(color) -> tuple[float, float, float]:
    if isinstance(color, (tuple, list)) and len(color) >= 3:
        return (float(color[0]), float(color[1]), float(color[2]))
    if isinstance(color, int):
        return (
            ((color >> 16) & 0xFF) / 255.0,
            ((color >> 8) & 0xFF) / 255.0,
            (color & 0xFF) / 255.0,
        )
    return (0.0, 0.0, 0.0)


def _builtin_font(span_font: str) -> str:
    """Map an embedded font name to the closest PDF built-in for insertion."""
    name = (span_font or "").strip()
    if "+" in name:
        name = name.split("+", 1)[1]
    lname = name.lower().replace(" ", "-")
    for key, builtin in _BUILTIN_FONT_MAP.items():
        if key in lname:
            return builtin
    # Heuristic fallback
    if "bold" in lname and ("italic" in lname or "oblique" in lname):
        return "hebo"
    if "bold" in lname:
        return "hebo"
    if "italic" in lname or "oblique" in lname:
        return "heob"
    return "helv"


def _get_span_info(page: fitz.Page, rect: fitz.Rect) -> dict:
    """Return font name, size, color, and baseline origin for the span covering rect."""
    best_span = None
    best_overlap = 0.0
    for block in page.get_text("dict", flags=0)["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                sr = fitz.Rect(span["bbox"])
                inter = sr & rect
                if not inter.is_empty:
                    area = abs(inter.get_area())
                    if area > best_overlap:
                        best_overlap = area
                        best_span = span
    if best_span is None:
        return {
            "fontname": "helv",
            "fontsize": 11.0,
            "color": (0.0, 0.0, 0.0),
            "origin": (rect.x0, rect.y1 - 1.0),
        }
    return {
        "fontname": _builtin_font(best_span.get("font", "")),
        "fontsize": float(best_span.get("size", 11.0)),
        "color": _int_to_rgb(best_span.get("color", 0)),
        "origin": best_span.get("origin", (rect.x0, rect.y1 - 1.0)),
    }


def _text_width(text: str, fontname: str, fontsize: float) -> float:
    try:
        return fitz.get_textlength(text, fontname=fontname, fontsize=fontsize)
    except Exception:
        return fontsize * len(text) * 0.55


def patch_pdf(original_bytes: bytes, fixes: list[dict]) -> tuple[bytes, list[str]]:
    """
    Apply text replacements to a PDF file in-place.

    Args:
        original_bytes: Raw bytes of the original .pdf file.
        fixes: Ordered list of {"original": str, "improved": str} dicts.

    Returns:
        (patched_bytes, skipped_originals)
    """
    doc = fitz.open(stream=original_bytes, filetype="pdf")
    skipped: list[str] = []

    for fix in fixes:
        original = (fix.get("original") or "").strip()
        improved = (fix.get("improved") or "").strip()
        if not original or original == improved:
            continue

        applied = False

        for page in doc:
            instances = page.search_for(original)
            if not instances:
                continue

            rect = instances[0]
            info = _get_span_info(page, rect)
            fontname = info["fontname"]
            fontsize = info["fontsize"]
            color = info["color"]
            origin_x = rect.x0
            origin_y = info["origin"][1]

            # Available horizontal space: from text start to estimated right margin
            available_width = page.rect.width - origin_x - _RIGHT_MARGIN_PT

            # Tier 1: fits at original font size?
            current_size = fontsize
            fits = _text_width(improved, fontname, current_size) <= available_width

            if not fits:
                # Tier 2: shrink in 0.5pt steps down to 80% of original
                min_size = fontsize * 0.8
                test_size = fontsize - 0.5
                while test_size >= min_size:
                    if _text_width(improved, fontname, test_size) <= available_width:
                        current_size = test_size
                        fits = True
                        break
                    test_size -= 0.5

            if not fits:
                # Tier 3: can't fit — skip
                skipped.append(original)
                applied = True
                break

            try:
                for inst in instances:
                    page.add_redact_annot(inst, fill=(1, 1, 1))
                page.apply_redactions()
                page.insert_text(
                    (origin_x, origin_y),
                    improved,
                    fontname=fontname,
                    fontsize=current_size,
                    color=color,
                )
            except Exception:
                skipped.append(original)
                applied = True
                break

            applied = True
            break

        if not applied:
            skipped.append(original)

    output = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return output, skipped
