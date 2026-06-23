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


class ComfyUIImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    negative_prompt: str = Field(default="", max_length=1200)
    size: Literal["512x512", "768x768", "1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    count: int = Field(default=1, ge=1, le=4)
    seed: int = Field(default=-1, ge=-1)


class ArtImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    negative_prompt: str = Field(default="", max_length=1200)
    style_profile_id: str = Field(default="", max_length=120)
    size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    count: int = Field(default=1, ge=1, le=4)


class GeneratedImageItem(BaseModel):
    path: str
    file_name: str
    prompt: str


class ArtImageGenerateResponse(BaseModel):
    output_id: str
    provider: str
    model: str
    images: List[GeneratedImageItem]
    message: str


class ComfyUIImageGenerateResponse(BaseModel):
    output_id: str
    prompt_id: str
    images: List[GeneratedImageItem]
    message: str


class ArtImageAnalysis(BaseModel):
    content_prompt: str
    style_spec_prompt: str
    negative_prompt: str
    palette: List[str] = Field(default_factory=list)
    camera_view: str = ""
    resolution_advice: str = ""
    naming_advice: str = ""
    suitable_asset_types: List[str] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class ArtImageAnalyzeResponse(BaseModel):
    analysis: ArtImageAnalysis


class ArtStyleProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    content_prompt: str = Field(default="", max_length=2000)
    style_spec_prompt: str = Field(default="", max_length=2000)
    negative_prompt: str = Field(default="", max_length=1200)
    palette: List[str] = Field(default_factory=list)
    camera_view: str = ""
    resolution_advice: str = ""
    naming_advice: str = ""
    suitable_asset_types: List[str] = Field(default_factory=list)
    source_image_path: str = ""


class ArtStyleProfile(ArtStyleProfileCreate):
    id: str
    created_at: str
    updated_at: str


class ArtStyleProfileListResponse(BaseModel):
    profiles: List[ArtStyleProfile] = Field(default_factory=list)
