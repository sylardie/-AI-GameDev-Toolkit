import json
from datetime import datetime
from uuid import uuid4

from app.core.config import PROMPTS_DIR
from app.schemas.prompts import PromptEntry, PromptEntryCreate, PromptLibraryResponse


PROMPT_LIBRARY_PATH = PROMPTS_DIR / "prompt_library.json"


def list_prompts() -> PromptLibraryResponse:
    return PromptLibraryResponse(prompts=_load_prompts())


def create_prompt(request: PromptEntryCreate) -> PromptEntry:
    now = datetime.now().isoformat(timespec="seconds")
    prompt = PromptEntry(
        id=f"prompt_{uuid4().hex[:10]}",
        created_at=now,
        updated_at=now,
        **_clean_prompt_payload(request),
    )
    prompts = _load_prompts()
    prompts.insert(0, prompt)
    _save_prompts(prompts)
    return prompt


def update_prompt(prompt_id: str, request: PromptEntryCreate) -> PromptEntry | None:
    prompts = _load_prompts()
    for index, prompt in enumerate(prompts):
        if prompt.id != prompt_id:
            continue
        updated = PromptEntry(
            id=prompt.id,
            created_at=prompt.created_at,
            updated_at=datetime.now().isoformat(timespec="seconds"),
            **_clean_prompt_payload(request),
        )
        prompts[index] = updated
        _save_prompts(prompts)
        return updated
    return None


def delete_prompt(prompt_id: str) -> bool:
    prompts = _load_prompts()
    kept = [prompt for prompt in prompts if prompt.id != prompt_id]
    if len(kept) == len(prompts):
        return False
    _save_prompts(kept)
    return True


def _clean_prompt_payload(request: PromptEntryCreate) -> dict:
    data = request.model_dump()
    data["title"] = data["title"].strip()
    data["category"] = data["category"].strip() or "General"
    data["tags"] = [tag.strip() for tag in data["tags"] if tag.strip()]
    data["body"] = data["body"].strip()
    data["notes"] = data["notes"].strip()
    return data


def _load_prompts() -> list[PromptEntry]:
    if not PROMPT_LIBRARY_PATH.exists():
        return []

    with PROMPT_LIBRARY_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return [PromptEntry(**item) for item in data.get("prompts", [])]


def _save_prompts(prompts: list[PromptEntry]) -> None:
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    with PROMPT_LIBRARY_PATH.open("w", encoding="utf-8") as file:
        json.dump(
            {"prompts": [prompt.model_dump() for prompt in prompts]},
            file,
            ensure_ascii=False,
            indent=2,
        )
