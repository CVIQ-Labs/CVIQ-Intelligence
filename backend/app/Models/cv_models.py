from pydantic import BaseModel, Field


class SuggestedBullet(BaseModel):
    # One before/after pair — original weak bullet and the improved rewrite
    original: str
    improved: str


class ReviewResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)   # ge = greater or equal, le = less or equal
    ats_score: int = Field(ge=0, le=100)
    recruiter_score: int = Field(ge=0, le=10)  # pro feature — recruiter shortlist likelihood
    role_alignment: str                         # "Strong", "Good", "Moderate", or "Weak"
    missing_keywords: list[str]
    strengths: list[str]
    weaknesses: list[str]
    suggested_bullets: list[SuggestedBullet]
