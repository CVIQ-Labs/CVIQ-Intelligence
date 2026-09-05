"""
One-time script to push the system prompt to Langfuse Prompt Management.
Run from the backend/ directory:

    python scripts/push_prompts.py

Re-run whenever you want to create a new version in Langfuse.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

if not settings.langfuse_public_key:
    print("ERROR: LANGFUSE_PUBLIC_KEY not set in environment.")
    sys.exit(1)

from langfuse import Langfuse

langfuse = Langfuse(
    public_key=settings.langfuse_public_key,
    secret_key=settings.langfuse_secret_key,
    host=settings.langfuse_host,
)

prompts_dir = Path(__file__).parent.parent / "prompts"
system_prompt_path = prompts_dir / f"system_{settings.prompt_version}.txt"
system_prompt_text = system_prompt_path.read_text(encoding="utf-8").strip()

prompt = langfuse.create_prompt(
    name="cv-review-system",
    prompt=system_prompt_text,
    labels=["production"],
    type="text",
)

print(f"Pushed 'cv-review-system' version {prompt.version} with label 'production'")
print(f"View it at: {settings.langfuse_host}/prompts/cv-review-system")
