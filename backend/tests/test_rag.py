"""
Tests for the RAG components: ingestion, chunking, and scoring.

These tests are pure Python — no HTTP requests, no OpenAI calls, no ChromaDB.
They test individual functions in isolation.
"""
import pytest

from app.ingestion.chunker import chunk_text
from app.ingestion.loader import load_text_from_bytes
from app.review.scorer import validate_and_clean
from app.core.exceptions import InvalidFileTypeError, EmptyDocumentError


# --- Chunker ---

def test_chunk_text_splits_long_text():
    """A text longer than chunk_size should be split into multiple chunks."""
    text = "word " * 300          # 1500 characters — longer than default chunk_size of 500
    chunks = chunk_text(text)
    assert len(chunks) > 1


def test_chunk_text_short_text_is_one_chunk():
    """A short text should stay as a single chunk."""
    text = "This is a short CV."
    chunks = chunk_text(text)
    assert len(chunks) == 1


def test_chunk_text_no_empty_chunks():
    """No chunk in the output should be blank or whitespace-only."""
    text = "word " * 200
    chunks = chunk_text(text)
    for chunk in chunks:
        assert chunk.strip() != ""


def test_chunk_text_overlap_means_chunks_share_content():
    """With overlap > 0, consecutive chunks should share some characters."""
    text = "a" * 1000
    chunks = chunk_text(text, chunk_size=100, overlap=20)
    # chunk[0] ends at index 100, chunk[1] starts at index 80 — they share chars 80–100
    assert chunks[0][-20:] == chunks[1][:20]


# --- Loader ---

def test_load_txt_file_returns_text():
    """A valid .txt file should return its content as a string."""
    content = b"John Smith\nSoftware Engineer\nPython, FastAPI, Docker"
    result = load_text_from_bytes(content, "cv.txt")
    assert "John Smith" in result


def test_load_unsupported_file_type_raises_error():
    """Uploading a .jpg should raise InvalidFileTypeError."""
    with pytest.raises(InvalidFileTypeError):
        load_text_from_bytes(b"fake image", "photo.jpg")


def test_load_empty_txt_raises_error():
    """A .txt file with no content should raise EmptyDocumentError."""
    with pytest.raises(EmptyDocumentError):
        load_text_from_bytes(b"   ", "empty.txt")


def test_load_unsupported_extension_jpg_raises_error():
    """.jpg files are not supported and should raise InvalidFileTypeError."""
    with pytest.raises(InvalidFileTypeError):
        load_text_from_bytes(b"fake image bytes", "photo.jpg")


# --- Scorer ---

def test_scorer_clamps_score_above_100():
    """A score above 100 from GPT should be clamped to 100."""
    raw = {
        "overall_score": 150,
        "ats_score": 110,
        "recruiter_score": 5,
        "role_alignment": "Strong",
        "missing_keywords": [],
        "strengths": [],
        "weaknesses": [],
        "suggested_bullets": [],
    }
    result = validate_and_clean(raw)
    assert result["overall_score"] == 100
    assert result["ats_score"] == 100


def test_scorer_clamps_score_below_0():
    """A negative score from GPT should be clamped to 0."""
    raw = {
        "overall_score": -10,
        "ats_score": -5,
        "recruiter_score": 5,
        "role_alignment": "Weak",
        "missing_keywords": [],
        "strengths": [],
        "weaknesses": [],
        "suggested_bullets": [],
    }
    result = validate_and_clean(raw)
    assert result["overall_score"] == 0
    assert result["ats_score"] == 0


def test_scorer_fixes_invalid_role_alignment():
    """An unrecognised role_alignment value should be replaced with 'Moderate'."""
    raw = {
        "overall_score": 70,
        "ats_score": 65,
        "recruiter_score": 5,
        "role_alignment": "Very Strong",   # not a valid label
        "missing_keywords": [],
        "strengths": [],
        "weaknesses": [],
        "suggested_bullets": [],
    }
    result = validate_and_clean(raw)
    assert result["role_alignment"] == "Moderate"


def test_scorer_accepts_valid_role_alignment_labels():
    """All four valid labels should pass through unchanged."""
    for label in ["Strong", "Good", "Moderate", "Weak"]:
        raw = {
            "overall_score": 70,
            "ats_score": 65,
            "recruiter_score": 5,
            "role_alignment": label,
            "missing_keywords": [],
            "strengths": [],
            "weaknesses": [],
            "suggested_bullets": [],
        }
        result = validate_and_clean(raw)
        assert result["role_alignment"] == label


def test_scorer_fills_missing_list_fields():
    """If GPT omits list fields entirely, they should default to empty lists."""
    raw = {
        "overall_score": 70,
        "ats_score": 65,
        "recruiter_score": 5,
        "role_alignment": "Good",
        # missing_keywords, strengths, weaknesses, section_recommendations, suggested_bullets all absent
    }
    result = validate_and_clean(raw)
    assert result["missing_keywords"] == []
    assert result["strengths"] == []
    assert result["weaknesses"] == []
    assert result["section_recommendations"] == []
    assert result["suggested_bullets"] == []


def test_scorer_fills_missing_category_scores():
    """If GPT omits category_scores entirely, all keys should default to 0."""
    raw = {
        "overall_score": 70,
        "ats_score": 65,
        "recruiter_score": 5,
        "role_alignment": "Good",
        "missing_keywords": [],
        "strengths": [],
        "weaknesses": [],
        "suggested_bullets": [],
        # category_scores absent
    }
    result = validate_and_clean(raw)
    assert "category_scores" in result
    assert all(v == 0 for v in result["category_scores"].values())


def test_scorer_clamps_category_scores():
    """Category scores outside 0-100 should be clamped."""
    raw = {
        "overall_score": 70,
        "ats_score": 65,
        "recruiter_score": 5,
        "role_alignment": "Good",
        "category_scores": {
            "role_alignment": 150,
            "skills_match": -10,
            "experience_relevance": 80,
            "ats_keyword_match": 70,
            "bullet_point_quality": 60,
            "structure_readability": 75,
            "missing_evidence": 50,
        },
        "missing_keywords": [],
        "strengths": [],
        "weaknesses": [],
        "suggested_bullets": [],
    }
    result = validate_and_clean(raw)
    assert result["category_scores"]["role_alignment"] == 100
    assert result["category_scores"]["skills_match"] == 0
