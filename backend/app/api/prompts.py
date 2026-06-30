from fastapi import APIRouter, HTTPException

from app.modules.shared.prompt_library_store import (
    create_prompt,
    delete_prompt,
    list_prompts,
    update_prompt,
)
from app.schemas.prompts import PromptEntry, PromptEntryCreate, PromptLibraryResponse


router = APIRouter(prefix="/api/prompts", tags=["Prompt Library"])


@router.get("", response_model=PromptLibraryResponse)
def get_prompts():
    return list_prompts()


@router.post("", response_model=PromptEntry)
def add_prompt(request: PromptEntryCreate):
    return create_prompt(request)


@router.put("/{prompt_id}", response_model=PromptEntry)
def edit_prompt(prompt_id: str, request: PromptEntryCreate):
    prompt = update_prompt(prompt_id, request)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return prompt


@router.delete("/{prompt_id}")
def remove_prompt(prompt_id: str):
    if not delete_prompt(prompt_id):
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return {"deleted": True}
