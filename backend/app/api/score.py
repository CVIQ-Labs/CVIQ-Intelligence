from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_langfuse = None
try:
    from app.core.config import settings
    if settings.langfuse_public_key:
        from langfuse import Langfuse
        _langfuse = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
except Exception:
    pass


class FeedbackRequest(BaseModel):
    trace_id: str
    value: int  # 1 = thumbs up, 0 = thumbs down


@router.post("/score")
async def submit_score(body: FeedbackRequest):
    if body.value not in (0, 1):
        raise HTTPException(status_code=400, detail="value must be 0 or 1")
    if not _langfuse:
        return {"ok": True, "langfuse": False}
    try:
        _langfuse.score(
            trace_id=body.trace_id,
            name="user-feedback",
            value=body.value,
            data_type="BOOLEAN",
            comment="thumbs up" if body.value == 1 else "thumbs down",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Score submission failed: {e}")
    return {"ok": True}
