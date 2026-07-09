from pathlib import Path
from app.core.config import settings

_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

PROMPT_VERSION = settings.prompt_version

def _load_system_prompt() -> str:
    path = _PROMPTS_DIR / f"system_{PROMPT_VERSION}.txt"
    return path.read_text(encoding="utf-8").strip()

SYSTEM_PROMPT = _load_system_prompt()


def build_review_prompt(cv_text: str, job_description: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)

    return f"""## Knowledge Base Context

{context}

---

## CV Submitted for Review

{cv_text}

---
## Job Description

{job_description}

---

## Task

Review the CV against the job description using the rubric and guidelines above.

Return ONLY a JSON object with this exact structure:

{{
  "overall_score": <integer 0-100>,
  "ats_score": <integer 0-100>,
  "recruiter_score": <integer 0-10>,
  "category_scores": {{
    "role_alignment": <integer 0-100>,
    "skills_match": <integer 0-100>,
    "experience_relevance": <integer 0-100>,
    "ats_keyword_match": <integer 0-100>,
    "bullet_point_quality": <integer 0-100>,
    "structure_readability": <integer 0-100>,
    "missing_evidence": <integer 0-100>
  }},
  "category_breakdowns": {{
    "role_alignment": {{
      "explanation": "<why this score — reference specific CV content>",
      "what_is_weak": "<what specifically lets this category down>",
      "how_to_improve": "<concrete action to raise the score>",
      "subscores": {{
        "title_match": <integer 0-100>,
        "seniority_match": <integer 0-100>,
        "industry_fit": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "skills_match": {{
      "explanation": "<why this score — reference specific skills listed or absent>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "technical_skills": <integer 0-100>,
        "tools_and_platforms": <integer 0-100>,
        "soft_skills": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "experience_relevance": {{
      "explanation": "<why this score>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "domain_relevance": <integer 0-100>,
        "scope_and_scale": <integer 0-100>,
        "career_progression": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "ats_keyword_match": {{
      "explanation": "<why this score>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "keyword_coverage": <integer 0-100>,
        "exact_phrase_matches": <integer 0-100>,
        "keyword_density": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "bullet_point_quality": {{
      "explanation": "<why this score>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "action_verbs": <integer 0-100>,
        "quantified_achievements": <integer 0-100>,
        "impact_statements": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "structure_readability": {{
      "explanation": "<why this score>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "formatting_clarity": <integer 0-100>,
        "section_completeness": <integer 0-100>,
        "length_appropriateness": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }},
    "missing_evidence": {{
      "explanation": "<why this score>",
      "what_is_weak": "<what is weak>",
      "how_to_improve": "<how to improve>",
      "subscores": {{
        "metrics_and_numbers": <integer 0-100>,
        "technical_depth": <integer 0-100>,
        "leadership_or_ownership": <integer 0-100>
      }},
      "missing_points": ["<specific gap 1>", "<specific gap 2>"]
    }}
  }},
  "recruiter_reasoning": "<2-3 sentences written as a recruiter explaining your overall impression, referencing specific CV content. Be direct — would you shortlist this candidate and why?>",
  "recruiter_commentary": "<2-3 sentences written in first person as a recruiter. State your gut reaction: what stood out, what concerned you, and whether you would move this candidate forward. Reference specific sections or lines from the CV.>",
  "role_alignment": <"Strong" | "Good" | "Moderate" | "Weak">,
  "missing_keywords": [<list of strings>],
  "strengths": [<list of strings, max 4>],
  "weaknesses": [<list of strings, max 4>],
  "section_recommendations": [<list of strings>],
  "suggested_bullets": [
    {{
      "original": "<exact text of a weak bullet from the CV>",
      "improved": "<best rewrite following Action + Result format>",
      "alternatives": [
        "<rewrite option 1 — different angle or emphasis>",
        "<rewrite option 2 — different phrasing or metric focus>",
        "<rewrite option 3 — optional third variation>"
      ]
    }}
  ],
  "line_feedback": [
    {{
      "cv_line": "<quote the exact line or phrase from the CV>",
      "issue": "<what is wrong: passive voice / no metric / vague / etc.>",
      "suggestion": "<specific improved version of that line>"
    }}
  ],
  "summary_improvement": "<if the CV has a summary or profile section, rewrite it to be more targeted, quantified, and recruiter-facing. If there is no summary section, write one that would strengthen this CV for this specific job.>"
}}

Rules:
- overall_score is the weighted average across all 7 rubric categories
- ats_score is specifically the ATS keyword match score
- recruiter_score is how likely a recruiter is to shortlist this CV in a 6-second scan (0-10)
- category_scores contains the raw score (0-100) for each of the 7 rubric categories
- category_breakdowns must reference specific content from the CV — never give generic advice
- subscores within each breakdown must be consistent with the parent category score
- missing_points must name the specific gap (e.g. "No metrics in 3 of 5 bullets" not "add numbers")
- recruiter_reasoning must be written in first person as a recruiter, referencing specific CV lines
- recruiter_commentary is a separate gut-reaction paragraph — more personal and direct than recruiter_reasoning
- missing_keywords must be exact terms from the job description that are absent from the CV
- section_recommendations lists specific sections to add or remove. Return empty list if structure is appropriate.
- suggested_bullets must quote exact text from the CV — do not invent bullets
- suggested_bullets count: 4-6 for overall_score below 50, 2-3 for 50-74, 0-1 for 75 and above
- each suggested_bullet must have at least 2 alternatives
- line_feedback: pick the 3-5 most impactful lines in the CV that need fixing. Quote exactly.
- summary_improvement must be written for this specific job, not generic
- Return valid JSON only. No markdown, no explanation, no extra text."""
