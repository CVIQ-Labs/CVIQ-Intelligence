from fastapi import APIRouter, Depends

from app.core.auth import require_user

router = APIRouter(prefix="/auth")


@router.get("/me")
async def me(user: dict = Depends(require_user)):
    """Returns the authenticated user's profile. Used to verify a valid session."""
    return {"id": user["id"], "email": user["email"]}
