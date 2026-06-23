from typing import Any, Dict, List

from pydantic import BaseModel, Field


class DesignGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=2, description="Gameplay idea")
    template: str = Field(default="general", description="Compatibility field")


class DesignTemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    focus: List[str]
    recommended_tables: List[str]
    prompt_guidance: str


class ConfigFieldSpec(BaseModel):
    name: str
    type: str
    required: bool = True
    default: Any = ""
    enum: List[str] = Field(default_factory=list)
    reference: str = ""
    description: str


class ConfigTableSpec(BaseModel):
    name: str
    display_name: str
    purpose: str
    engine_usage: str
    fields: List[ConfigFieldSpec]
    rows: List[Dict[str, Any]]
    notes: List[str] = Field(default_factory=list)


class DesignData(BaseModel):
    title: str
    gameplay_summary: str
    tables: List[ConfigTableSpec]
    export_notes: List[str] = Field(default_factory=list)


class DesignGenerateResponse(BaseModel):
    output_id: str
    json_path: str
    excel_path: str
    excel_zip_path: str
    godot_zip_path: str
    data: DesignData
