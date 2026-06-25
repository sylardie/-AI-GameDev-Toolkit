from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.modules.art_pipeline.spritesheet_generator import (
    apply_transparency_to_frames,
    export_spritesheet,
    generate_spritesheet_from_video,
    remove_image_background,
)
from app.schemas.assets import (
    ExtractionMode,
    FrameTransparencyRequest,
    ImageTransparencyResponse,
    MetadataTarget,
    SpriteSheetExportRequest,
    SpriteSheetResponse,
)
from app.modules.shared.uploads import (
    UploadTooLargeError,
    copy_upload_with_limit,
)


router = APIRouter(prefix="/api/assets", tags=["Asset Tools"])
MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024
MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024


@router.post("/spritesheet", response_model=SpriteSheetResponse)
def create_spritesheet(
    video: UploadFile = File(...),
    fps: float = Form(default=16.0),
    max_frames: int = Form(default=16),
    target_frame_count: int = Form(default=16),
    columns: int = Form(default=4),
    frame_width: int = Form(default=128),
    frame_height: int = Form(default=128),
    metadata_target: MetadataTarget = Form(default="godot"),
    start_time: float = Form(default=0.0),
    end_time: float = Form(default=0.0),
    extraction_mode: ExtractionMode = Form(default="fps"),
    frame_interval: int = Form(default=1),
    dedupe_enabled: bool = Form(default=False),
    dedupe_threshold: float = Form(default=96.0),
    transparent_enabled: bool = Form(default=False),
    transparent_color: str = Form(default="#000000"),
    transparent_tolerance: int = Form(default=24),
    transparent_feather: int = Form(default=16),
    export_gif: bool = Form(default=False),
):
    if fps <= 0 or fps > 60:
        raise HTTPException(status_code=400, detail="FPS must be between 0 and 60.")
    if max_frames <= 0 or max_frames > 512:
        raise HTTPException(status_code=400, detail="Max frames must be between 1 and 512.")
    if target_frame_count <= 0 or target_frame_count > 512:
        raise HTTPException(status_code=400, detail="Target frame count must be between 1 and 512.")
    if columns <= 0 or columns > 64:
        raise HTTPException(status_code=400, detail="Columns must be between 1 and 64.")
    if frame_width <= 0 or frame_width > 2048 or frame_height <= 0 or frame_height > 2048:
        raise HTTPException(status_code=400, detail="Frame size must be between 1 and 2048.")
    if start_time < 0 or end_time < 0:
        raise HTTPException(status_code=400, detail="Start and end time must be non-negative.")
    if end_time > 0 and end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be greater than start time.")
    if frame_interval <= 0 or frame_interval > 1000:
        raise HTTPException(status_code=400, detail="Frame interval must be between 1 and 1000.")
    if dedupe_threshold < 0 or dedupe_threshold > 100:
        raise HTTPException(status_code=400, detail="Dedupe threshold must be between 0 and 100.")
    if transparent_tolerance < 0 or transparent_tolerance > 255:
        raise HTTPException(status_code=400, detail="Transparency tolerance must be between 0 and 255.")
    if transparent_feather < 0 or transparent_feather > 255:
        raise HTTPException(status_code=400, detail="Transparency feather must be between 0 and 255.")

    suffix = _safe_suffix(video.filename or "")
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            copy_upload_with_limit(video.file, temp_file, MAX_VIDEO_UPLOAD_BYTES)
    except UploadTooLargeError as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail=str(exc)) from exc

    try:
        return generate_spritesheet_from_video(
            video_path=Path(temp_path),
            filename=video.filename or "video",
            fps=fps,
            max_frames=max_frames,
            target_frame_count=target_frame_count,
            columns=columns,
            frame_width=frame_width,
            frame_height=frame_height,
            metadata_target=metadata_target,
            start_time=start_time,
            end_time=end_time,
            extraction_mode=extraction_mode,
            frame_interval=frame_interval,
            dedupe_enabled=dedupe_enabled,
            dedupe_threshold=dedupe_threshold,
            transparent_enabled=transparent_enabled,
            transparent_color=transparent_color,
            transparent_tolerance=transparent_tolerance,
            transparent_feather=transparent_feather,
            export_gif=export_gif,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to generate spritesheet: {exc}") from exc
    finally:
        Path(temp_path).unlink(missing_ok=True)


def _safe_suffix(filename: str) -> str:
    lowered = filename.lower()
    for suffix in [".mp4", ".mov", ".webm", ".avi", ".mkv"]:
        if lowered.endswith(suffix):
            return suffix
    return ".mp4"


def _safe_image_suffix(filename: str) -> str:
    lowered = filename.lower()
    for suffix in [".png", ".jpg", ".jpeg", ".webp"]:
        if lowered.endswith(suffix):
            return suffix
    return ".png"


@router.post("/spritesheet/export", response_model=SpriteSheetResponse)
def export_selected_spritesheet(request: SpriteSheetExportRequest):
    try:
        return export_spritesheet(
            output_id=request.output_id,
            selected_indices=request.selected_indices,
            columns=request.columns,
            frame_width=request.frame_width,
            frame_height=request.frame_height,
            metadata_target=request.metadata_target,
            export_gif=request.export_gif,
            gif_fps=request.gif_fps,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to export spritesheet: {exc}") from exc


@router.post("/spritesheet/transparent", response_model=SpriteSheetResponse)
def apply_spritesheet_transparency(request: FrameTransparencyRequest):
    try:
        return apply_transparency_to_frames(
            output_id=request.output_id,
            selected_indices=request.selected_indices,
            apply_to_all=request.apply_to_all,
            transparent_color=request.transparent_color,
            transparent_tolerance=request.transparent_tolerance,
            transparent_feather=request.transparent_feather,
            columns=request.columns,
            frame_width=request.frame_width,
            frame_height=request.frame_height,
            metadata_target=request.metadata_target,
            export_gif=request.export_gif,
            gif_fps=request.gif_fps,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to apply transparency: {exc}") from exc


@router.post("/image/transparent", response_model=ImageTransparencyResponse)
def create_transparent_image(
    image: UploadFile = File(...),
    transparent_color: str = Form(default="#000000"),
    transparent_tolerance: int = Form(default=24),
    transparent_feather: int = Form(default=16),
):
    if transparent_tolerance < 0 or transparent_tolerance > 255:
        raise HTTPException(status_code=400, detail="Transparency tolerance must be between 0 and 255.")
    if transparent_feather < 0 or transparent_feather > 255:
        raise HTTPException(status_code=400, detail="Transparency feather must be between 0 and 255.")

    suffix = _safe_image_suffix(image.filename or "")
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            copy_upload_with_limit(image.file, temp_file, MAX_IMAGE_UPLOAD_BYTES)
    except UploadTooLargeError as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail=str(exc)) from exc

    try:
        return remove_image_background(
            image_path=Path(temp_path),
            filename=image.filename or "image",
            transparent_color=transparent_color,
            transparent_tolerance=transparent_tolerance,
            transparent_feather=transparent_feather,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to remove image background: {exc}") from exc
    finally:
        Path(temp_path).unlink(missing_ok=True)
