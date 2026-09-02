import json
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.review.docx_patcher import patch_docx
from app.review.pdf_patcher import patch_pdf

router = APIRouter()


@router.post("/patch-export")
async def patch_export(
    file: UploadFile = File(...),
    fixes: str = Form("[]"),
    filename: str = Form("edited_cv"),
):
    """
    Patch a DOCX or PDF file in-place by applying {original, improved} text fixes
    while preserving all original formatting.

    Returns the patched file bytes.  Any fixes that could not be located in
    the document are reported in the X-Skipped-Fixes response header as a
    JSON array of the original strings, so the frontend can inform the user.
    """
    file_bytes = await file.read()

    try:
        fixes_list = json.loads(fixes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in 'fixes' field.")

    if not isinstance(fixes_list, list):
        raise HTTPException(status_code=400, detail="'fixes' must be a JSON array.")

    is_pdf = (
        (file.content_type or "").startswith("application/pdf")
        or (file.filename or "").lower().endswith(".pdf")
    )

    try:
        if is_pdf:
            patched_bytes, skipped = patch_pdf(file_bytes, fixes_list)
            media_type = "application/pdf"
            safe_name = filename if filename.lower().endswith(".pdf") else filename + ".pdf"
        else:
            patched_bytes, skipped = patch_docx(file_bytes, fixes_list)
            media_type = (
                "application/vnd.openxmlformats-officedocument"
                ".wordprocessingml.document"
            )
            safe_name = filename if filename.lower().endswith(".docx") else filename + ".docx"
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Patch failed: {e}")

    return StreamingResponse(
        BytesIO(patched_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "X-Skipped-Fixes": json.dumps(skipped),
            "Access-Control-Expose-Headers": "X-Skipped-Fixes",
        },
    )
