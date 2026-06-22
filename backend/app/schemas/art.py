from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


AssetType = Literal[
    "character",
    "item",
    "environment",
    "ui_icon",
    "sprite",
    "tileset",
    "concept_art",
]
ArtStyle = Literal[
    "pixel_art",
    "hand_painted",
    "low_poly",
    "anime",
    "realistic",
    "flat_vector",
]
EngineTarget = Literal["godot", "unity", "generic"]


class ArtPromptGenerateRequest(BaseModel):
    description: str = Field(..., min_length=3, max_length=1200)
    asset_type: AssetType = "character"
    style: ArtStyle = "pixel_art"
    engine_target: EngineTarget = "godot"
    mood: str = Field(default="", max_length=120)
    color_palette: str = Field(default="", max_length=120)


class AssetNamingRule(BaseModel):
    category: str
    pattern: str
    example: str


class ImportGuideStep(BaseModel):
    title: str
    detail: str


class ArtPromptGenerateResponse(BaseModel):
    title: str
    asset_type: AssetType
    style: ArtStyle
    engine_target: EngineTarget
    positive_prompt: str
    negative_prompt: str
    style_tags: List[str]
    asset_naming_rules: List[AssetNamingRule]
    import_guide: List[ImportGuideStep]
    production_notes: List[str]
    comfyui_workflow: Dict[str, Any]
    comfyui_enabled: bool = False


class ComfyUISubmitResponse(BaseModel):
    enabled: bool
    submitted: bool
    prompt_id: Optional[str] = None
    message: str
