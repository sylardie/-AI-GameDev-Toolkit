from fastapi import APIRouter

from app.modules.art_pipeline.comfyui_client import ComfyUIError, submit_workflow
from app.modules.art_pipeline.comfyui_workflow import build_basic_txt2img_workflow
from app.modules.art_pipeline.prompt_generator import generate_art_prompt
from app.modules.shared.settings_store import load_settings
from app.schemas.art import (
    ArtPromptGenerateRequest,
    ArtPromptGenerateResponse,
    ComfyUISubmitResponse,
)

router = APIRouter(prefix="/api/art", tags=["Art Pipeline"])


@router.get("/status")
def art_pipeline_status():
    settings = load_settings()
    return {
        "module": "Art Pipeline",
        "status": "ready",
        "message": "Prompt generator and optional ComfyUI submission are available.",
        "comfyui_enabled": settings.comfyui.enabled,
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
