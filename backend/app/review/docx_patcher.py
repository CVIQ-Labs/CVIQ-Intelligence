"""
DOCX in-place text patcher.

Applies {original → improved} text fixes to a DOCX document while
preserving all surrounding formatting.  Word splits text across multiple
<w:r> (run) elements even for uniformly-styled text, so the algorithm
concatenates run text per paragraph before searching, then rewrites the
matched run(s) in-place rather than rebuilding the document from scratch.
"""

import io
import re
import zipfile

from lxml import etree

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
_W = f"{{{W_NS}}}"


def _wt(runs: list) -> str:
    return "".join(r.findtext(f"{_W}t") or "" for r in runs)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def patch_docx(original_bytes: bytes, fixes: list[dict]) -> tuple[bytes, list[str]]:
    """
    Apply text replacements to a DOCX file in-place, preserving all formatting.

    Args:
        original_bytes: Raw bytes of the original .docx file.
        fixes: Ordered list of {"original": str, "improved": str} dicts.

    Returns:
        (patched_bytes, skipped_originals)
        skipped_originals: originals that could not be located and were left
                           unchanged (logged so the frontend can tell the user).
    """
    with zipfile.ZipFile(io.BytesIO(original_bytes)) as zf:
        names = zf.namelist()
        files = {name: zf.read(name) for name in names}

    doc_xml = files.get("word/document.xml")
    if not doc_xml:
        raise ValueError("Not a valid DOCX file (word/document.xml not found)")

    tree = etree.fromstring(doc_xml)
    skipped: list[str] = []

    for fix in fixes:
        original = (fix.get("original") or "").strip()
        improved = (fix.get("improved") or "").strip()
        if not original or original == improved:
            continue

        orig_norm = _normalize(original)
        applied = False

        for para in tree.iter(f"{_W}p"):
            # Collect all <w:r> runs in document order (handles nested hyperlinks etc.)
            runs = list(para.iter(f"{_W}r"))
            if not runs:
                continue

            full_text = _wt(runs)
            if orig_norm not in _normalize(full_text):
                continue

            # Locate the original text with flexible whitespace matching so
            # differences in how PDF.js vs the backend extracted the text
            # (e.g. single space vs double space) don't block the match.
            escaped = re.escape(original)
            pattern = re.compile(escaped.replace(r"\ ", r"\s+"), re.IGNORECASE)
            m = pattern.search(full_text)

            if not m:
                # Normalised text matched but exact pattern didn't — the text
                # was likely reformatted after extraction.  Log and skip rather
                # than corrupting the document.
                skipped.append(original)
                applied = True  # mark handled so we don't double-report below
                break

            start, end = m.start(), m.end()

            # Build a list of (char_start, char_end, run_element) for each run
            pos = 0
            spans: list[tuple[int, int, etree._Element]] = []
            for r in runs:
                t_text = r.findtext(f"{_W}t") or ""
                spans.append((pos, pos + len(t_text), r))
                pos += len(t_text)

            matched = [(a, b, r) for a, b, r in spans if a < end and b > start]
            if not matched:
                continue

            first_a, _,  first_r = matched[0]
            _,        last_b, last_r  = matched[-1]

            # Preserve text that surrounds the match within the boundary runs
            prefix = full_text[first_a:start]
            suffix = full_text[end:last_b]
            new_text = prefix + improved + suffix

            # Write the replacement into the first matched run's <w:t>
            t_el = first_r.find(f"{_W}t")
            if t_el is None:
                t_el = etree.SubElement(first_r, f"{_W}t")
            t_el.text = new_text
            # xml:space="preserve" is required whenever the text has leading or
            # trailing whitespace, otherwise Word silently trims it.
            if new_text != new_text.strip():
                t_el.set(f"{{{XML_NS}}}space", "preserve")
            else:
                t_el.attrib.pop(f"{{{XML_NS}}}space", None)

            # Zero out text in the remaining matched runs (keep run elements
            # intact to avoid corrupting numbering/list relationships)
            for _, _, r in matched[1:]:
                t2 = r.find(f"{_W}t")
                if t2 is not None:
                    t2.text = ""
                    t2.attrib.pop(f"{{{XML_NS}}}space", None)

            applied = True
            break

        if not applied:
            skipped.append(original)

    # Re-serialise the patched XML back into the zip
    files["word/document.xml"] = etree.tostring(
        tree,
        xml_declaration=True,
        encoding="UTF-8",
        standalone=True,
    )

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in files.items():
            zout.writestr(name, data)

    return out.getvalue(), skipped
