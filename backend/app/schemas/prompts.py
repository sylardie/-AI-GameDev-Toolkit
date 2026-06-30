from typing import List

from pydantic import BaseModel, Field, field_validator


class PromptEntryBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    category: str = Field(default="General", max_length=80)
    tags: List[str] = Field(default_factory=list)
    body: str = Field(min_length=1)
    notes: str = ""

    @field_validator("title", "body")
    @classmethod
    def require_non_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Value cannot be blank.")
        return value


class PromptEntryCreate(PromptEntryBase):
    pass


class PromptEntry(PromptEntryBase):
    id: str
    created_at: str
    updated_at: str


class PromptLibraryResponse(BaseModel):
    prompts: List[PromptEntry] = Field(default_factory=list)
