"""
Tests for the FastAPI endpoints.

We mock the RAG pipeline so these tests never call OpenAI — they run
instantly and cost nothing. We're testing that the API layer handles
requests and responses correctly, not that GPT works.
"""
import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

# TestClient lets us send fake HTTP requests to the app without a real server
client = TestClient(app)

# A minimal valid PDF in bytes — enough for PyPDF2 to parse without crashing
# (single-page PDF with the text "Test CV content")
MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
    b"/Contents 4 0 R /Resources << /Font << /F1 << /Type /Font "
    b"/Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n"
    b"4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td "
    b"(Test CV content) Tj ET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n"
    b"0000000058 00000 n\n0000000115 00000 n\n0000000274 00000 n\n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n369\n%%EOF"
)

# The fake review dict our mock pipeline will return instead of calling GPT
MOCK_REVIEW = {
    "overall_score": 80,
    "ats_score": 75,
    "recruiter_score": 7,
    "category_scores": {
        "role_alignment": 80,
        "skills_match": 75,
        "experience_relevance": 70,
        "ats_keyword_match": 75,
        "bullet_point_quality": 65,
        "structure_readability": 80,
        "missing_evidence": 60,
    },
    "role_alignment": "Good",
    "missing_keywords": ["Docker", "PostgreSQL"],
    "strengths": ["Strong Python experience"],
    "weaknesses": ["No mention of Docker"],
    "section_recommendations": [],
    "suggested_bullets": [
        {
            "original": "Built a backend service",
            "improved": "Built and deployed a FastAPI backend service handling 10k requests/day",
        }
    ],
}


# --- Health endpoint ---

def test_health_returns_ok():
    """GET /health should always return {"status": "ok"}."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# --- Review endpoint: happy path ---

def test_review_returns_200_with_valid_inputs():
    """POST /review with a valid PDF and job description should return a 200 with the review fields."""
    # patch() replaces run_review_pipeline with a function that returns MOCK_REVIEW
    # This means no OpenAI call is made during this test
    with patch("app.api.review.run_review_pipeline", return_value=MOCK_REVIEW):
        response = client.post(
            "/review",
            files={"cv_file": ("cv.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")},
            data={"job_description": "Python Engineer with Django experience"},
        )

    assert response.status_code == 200
    body = response.json()

    # Check all required fields are present in the response
    assert "overall_score" in body
    assert "ats_score" in body
    assert "role_alignment" in body
    assert "missing_keywords" in body
    assert "strengths" in body
    assert "weaknesses" in body
    assert "suggested_bullets" in body


def test_review_scores_are_within_range():
    """Scores must be between 0 and 100."""
    with patch("app.api.review.run_review_pipeline", return_value=MOCK_REVIEW):
        response = client.post(
            "/review",
            files={"cv_file": ("cv.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")},
            data={"job_description": "Python Engineer"},
        )

    body = response.json()
    assert 0 <= body["overall_score"] <= 100
    assert 0 <= body["ats_score"] <= 100


# --- Review endpoint: error cases ---

def test_review_rejects_non_pdf_file():
    """POST /review with a .jpg file should return 400."""
    with patch("app.api.review.run_review_pipeline", return_value=MOCK_REVIEW):
        response = client.post(
            "/review",
            files={"cv_file": ("photo.jpg", io.BytesIO(b"fake image bytes"), "image/jpeg")},
            data={"job_description": "Python Engineer"},
        )

    assert response.status_code == 400


def test_review_requires_job_description():
    """POST /review without a job_description field should return 422 (validation error)."""
    response = client.post(
        "/review",
        files={"cv_file": ("cv.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")},
        # job_description is intentionally missing
    )
    # 422 = Unprocessable Entity — FastAPI returns this when required fields are absent
    assert response.status_code == 422


def test_review_requires_cv_file():
    """POST /review without a file should return 422."""
    response = client.post(
        "/review",
        data={"job_description": "Python Engineer"},
        # cv_file is intentionally missing
    )
    assert response.status_code == 422
