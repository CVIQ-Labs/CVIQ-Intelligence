import json
import time
from openai import OpenAI
from app.core.config import settings
from app.core.exceptions import LLMError
from app.rag.prompts import SYSTEM_PROMPT, build_review_prompt

client = OpenAI(api_key=settings.openai_api_key)

_COST_PER_INPUT_TOKEN = 0.15 / 1_000_000
_COST_PER_OUTPUT_TOKEN = 0.60 / 1_000_000

_HALLUCINATION_MARKERS = [
    "as an ai",
    "i cannot",
    "i'm not able",
    "i don't know",
    "i believe",
    "i think",
    "i'm not sure",
    "as a language model",
]


def _check_output_gate(review: dict) -> dict:
    text = json.dumps(review).lower()
    triggered = [m for m in _HALLUCINATION_MARKERS if m in text]
    if triggered:
        print(f"[guardrail] gate=output reason=hallucination_marker markers={triggered}")
        review["_output_gate_warning"] = triggered
    return review


def generate_review(cv_text: str, job_description: str, context_chunks: list[str], trace=None) -> dict:
    user_prompt = build_review_prompt(cv_text, job_description, context_chunks)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    generation = None
    try:
        if trace:
            generation = trace.generation(
                name="gpt-review",
                model=settings.openai_model,
                input=messages,
            )
    except Exception:
        generation = None

    t0 = time.perf_counter()
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        try:
            if generation:
                generation.end(level="ERROR", status_message=str(e))
        except Exception:
            pass
        raise LLMError(f"GPT call failed: {e}") from e

    elapsed_ms = (time.perf_counter() - t0) * 1000
    usage = response.usage
    cost = (usage.prompt_tokens * _COST_PER_INPUT_TOKEN) + (usage.completion_tokens * _COST_PER_OUTPUT_TOKEN)
    print(
        f"[llm] prompt={usage.prompt_tokens} completion={usage.completion_tokens} "
        f"total={usage.total_tokens} cost=${cost:.4f} latency={elapsed_ms:.0f}ms"
    )

    try:
        if generation:
            generation.end(
                output=response.choices[0].message.content,
                usage={
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                },
                metadata={
                    "estimated_cost_usd": round(cost, 6),
                    "latency_ms": round(elapsed_ms),
                },
            )
    except Exception:
        pass

    raw = response.choices[0].message.content
    try:
        review = json.loads(raw)
    except json.JSONDecodeError as e:
        raise LLMError(f"GPT returned invalid JSON: {e}\nRaw response: {raw}") from e

    return _check_output_gate(review)
