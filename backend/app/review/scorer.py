from app.review.rubric import VALID_ROLE_ALIGNMENT_LABELS


def validate_and_clean(raw: dict) -> dict:
    """Clamp scores to 0–100 and normalise any fields GPT may have returned incorrectly."""

    # Clamp scores to their valid ranges
    raw["overall_score"] = max(0, min(100, int(raw.get("overall_score", 0))))
    raw["ats_score"] = max(0, min(100, int(raw.get("ats_score", 0))))
    raw["recruiter_score"] = max(0, min(10, int(raw.get("recruiter_score", 0))))

    # If GPT returned an unexpected label, default to "Moderate"
    if raw.get("role_alignment") not in VALID_ROLE_ALIGNMENT_LABELS:
        raw["role_alignment"] = "Moderate"

    # Ensure these fields are always lists, never None or missing
    raw["missing_keywords"] = raw.get("missing_keywords") or []
    raw["strengths"] = raw.get("strengths") or []
    raw["weaknesses"] = raw.get("weaknesses") or []
    raw["suggested_bullets"] = raw.get("suggested_bullets") or []

    return raw
