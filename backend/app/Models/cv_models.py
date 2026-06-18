from pydantic import BaseModel, Field


class SuggestedBullet(BaseModel):
    # One before/after pair — original weak bullet and the improved rewrite
    original: str
    improved: str


class CategoryScores(BaseModel):
    role_alignment: int = Field(ge=0, le=100)
    skills_match: int = Field(ge=0, le=100)
    experience_relevance: int = Field(ge=0, le=100)
    ats_keyword_match: int = Field(ge=0, le=100)
    bullet_point_quality: int = Field(ge=0, le=100)
    structure_readability: int = Field(ge=0, le=100)
    missing_evidence: int = Field(ge=0, le=100)


class ReviewResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    ats_score: int = Field(ge=0, le=100)
    recruiter_score: int = Field(ge=0, le=10)
    category_scores: CategoryScores
    role_alignment: str
    missing_keywords: list[str]
    strengths: list[str]
    weaknesses: list[str]
    section_recommendations: list[str]
    suggested_bullets: list[SuggestedBullet]
