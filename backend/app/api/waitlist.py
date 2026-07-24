import resend
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client

from app.core.config import settings

router = APIRouter()


def _get_supabase():
    if not settings.supabase_url or not settings.supabase_service_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_key)


class WaitlistEntry(BaseModel):
    email: EmailStr
    source: str = "unknown"


@router.post("/waitlist", status_code=201)
async def join_waitlist(body: WaitlistEntry):
    supabase = _get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Service not configured.")

    try:
        supabase.table("waitlist").insert({
            "email": body.email,
            "source": body.source,
        }).execute()
    except Exception as e:
        if any(code in str(e) for code in ("duplicate", "unique", "23505")):
            return {"status": "already_registered"}
        raise HTTPException(status_code=500, detail="Failed to register.")

    _send_confirmation(body.email)
    return {"status": "registered"}


def _send_confirmation(email: str) -> None:
    if not settings.resend_api_key:
        return
    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": "CVIQ <noreply@getcviq.com>",
            "to": email,
            "subject": "You're on the CVIQ waitlist",
            "html": (
                '<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#0a1628;">'
                '<h1 style="font-size:24px;font-weight:700;margin-bottom:12px;">You\'re on the list</h1>'
                '<p style="font-size:15px;color:#6b7280;line-height:1.6;margin-bottom:24px;">'
                "Thanks for signing up. We'll reach out as soon as a spot opens up for you."
                "</p>"
                '<p style="font-size:13px;color:#9ca3af;">The CVIQ team</p>'
                "</div>"
            ),
        })
    except Exception as e:
        print(f"[waitlist] confirmation email failed: {e}")
