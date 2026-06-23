from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import OUTPUTS_DIR
from app.modules.art_pipeline.image_analyzer import analyze_image_style
from app.modules.art_pipeline.image_provider_client import ImageProviderError, generate_images
from app.modules.art_pipeline.style_profile_store import (
    create_style_profile,
    delete_style_profile,
    get_style_profile,
    list_style_profiles,
)
from app.modules.art_pipeline.comfyui_client import ComfyUIError, submit_workflow
from app.modules.art_pipeline.comfyui_workflow import build_basic_txt2img_workflow
from app.modules.art_pipeline.prompt_generator import generate_art_prompt
from app.modules.shared.llm_client import LLMError
from app.modules.shared.settings_store import load_settings
from app.schemas.art import (
    ArtImageAnalyzeResponse,
    ArtImageGenerateRequest,
    ArtImageGenerateResponse,
    ArtPromptGenerateRequest,
    ArtPromptGenerateResponse,
    ArtStyleProfile,
    ArtStyleProfileCreate,
    ArtStyleProfileListResponse,
    ComfyUISubmitResponse,
)

router = APIRouter(prefix="/api/art", tags=["Art Pipeline"])


@router.get("/status")
def art_pipeline_status():
    settings = load_settings()
    return {
        "module": "Art Pipeline",
        "status": "ready",
        "message": "Prompt generator, optional ComfyUI submission, style profiles, and optional online image generation are available.",
        "comfyui_enabled": settings.comfyui.enabled,
        "image_provider_enabled": settings.image_provider.enabled,
    }


@router.post("/generate", response_model=ArtPromptGenerateResponse)
def generate_art_pipeline_prompt(request: ArtPromptGenerateRequest):
    return generate_art_prompt(request)


@router.post("/comfyui/submit", response_model=ComfyUISubmitResponse)
def submit_art_pipeline_to_comfyui(request: ArtPromptGenerateRequest):
    settings = load_settings()
    if not settings.comfyui.enabled:
        return ComfyUISubmitResponse(
            enabled=False,
            submitted=False,
            message="ComfyUI is disabled.",
        )

    art_result = generate_art_prompt(request)
    workflow = build_basic_txt2img_workflow(
        request,
        art_result.positive_prompt,
        art_result.negative_prompt,
        settings.comfyui,
    )

    try:
        prompt_id = submit_workflow(settings.comfyui, workflow)
    except ComfyUIError as exc:
        return ComfyUISubmitResponse(
            enabled=True,
            submitted=False,
            message=str(exc),
        )

    return ComfyUISubmitResponse(
        enabled=True,
        submitted=True,
        prompt_id=prompt_id,
        message="ComfyUI prompt submitted.",
    )


@router.post("/images/generate", response_model=ArtImageGenerateResponse)
def generate_art_image(request: ArtImageGenerateRequest):
    settings = load_settings()
    style_prompt = ""
    if request.style_profile_id:
        profile = get_style_profile(request.style_profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Style profile not found.")
        style_prompt = profile.style_spec_prompt

    try:
        output_id, images = generate_images(settings.image_provider, request, style_prompt)
    except ImageProviderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ArtImageGenerateResponse(
        output_id=output_id,
        provider=settings.image_provider.provider,
        model=settings.image_provider.model,
        images=images,
        message="Image generation completed.",
    )


@router.post("/images/analyze", response_model=ArtImageAnalyzeResponse)
async def analyze_art_image(image: UploadFile = File(...)):
    settings = load_settings()
    if not settings.llm.enabled:
        raise HTTPException(status_code=400, detail="LLM is disabled. Configure a vision-capable LLM first.")
    if not settings.llm.api_base_url or not settings.llm.api_key or not settings.llm.model:
        raise HTTPException(status_code=400, detail="LLM settings are incomplete.")

    suffix = Path(image.filename or "image.png").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG, or WebP images are supported.")

    output_id = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"
    output_dir = OUTPUTS_DIR / "art" / output_id
    output_dir.mkdir(parents=True, exist_ok=True)
    image_path = output_dir / f"source{suffix}"

    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    image_path.write_bytes(content)

    try:
        analysis = analyze_image_style(image_path, settings.llm)
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ArtImageAnalyzeResponse(analysis=analysis)


@router.get("/style-profiles", response_model=ArtStyleProfileListResponse)
def get_art_style_profiles():
    return list_style_profiles()


@router.post("/style-profiles", response_model=ArtStyleProfile)
def save_art_style_profile(request: ArtStyleProfileCreate):
    return create_style_profile(request)


@router.delete("/style-profiles/{profile_id}")
def remove_art_style_profile(profile_id: str):
    deleted = delete_style_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Style profile not found.")
    return {"deleted": True}
