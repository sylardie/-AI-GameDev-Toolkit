from typing import List, Literal, Optional

from pydantic import BaseModel, Field


MetadataTarget = Literal["godot", "unity", "generic"]
ExtractionMode = Literal["fps", "interval"]


class VideoSourceInfo(BaseModel):
    filename: str
    width: int
    height: int
    duration: float
    fps: float


class ExtractedFrameInfo(BaseModel):
    index: int
    source_frame: int
    timestamp: float
    path: str


class SpriteSheetResponse(BaseModel):
    output_id: str
    spritesheet_path: str
    metadata_path: str
    gif_path: Optional[str] = None
    zip_path: Optional[str] = None
    frames: List[ExtractedFrameInfo] = Field(default_factory=list)
    source: Optional[VideoSourceInfo] = None
    frame_count: int
    columns: int
    rows: int
    frame_width: int
    frame_height: int


class ImageTransparencyResponse(BaseModel):
    output_id: str
    image_path: str
    zip_path: Optional[str] = None
    width: int
    height: int


class SpriteSheetExportRequest(BaseModel):
    output_id: str
    selected_indices: List[int] = Field(default_factory=list)
    columns: int = Field(default=8, ge=1, le=64)
    frame_width: int = Field(default=128, ge=1, le=2048)
    frame_height: int = Field(default=128, ge=1, le=2048)
    metadata_target: MetadataTarget = "godot"
    export_gif: bool = False
    gif_fps: float = Field(default=8.0, gt=0, le=60)


class FrameTransparencyRequest(SpriteSheetExportRequest):
    transparent_color: str = "#000000"
    transparent_tolerance: int = Field(default=24, ge=0, le=255)
    transparent_feather: int = Field(default=16, ge=0, le=255)
    apply_to_all: bool = False
