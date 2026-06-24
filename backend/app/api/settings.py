from fastapi import APIRouter

from app.modules.art_pipeline.comfyui_client import ComfyUIError, test_comfyui_connection
from app.modules.art_pipeline.comfyui_workflow import (
    ComfyUIWorkflowError,
    build_template_txt2img_workflow,
)
from app.modules.art_pipeline.image_provider_client import (
    ImageProviderError,
    test_image_provider_connection,
)
from app.modules.shared.llm_client import LLMError, chat_completion_json
from app.modules.shared.settings_store import load_settings, public_settings, save_settings
from app.schemas.settings import (
    ConnectionTestResponse,
    LocalSettingsPublic,
    LocalSettingsUpdate,
)


router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=LocalSettingsPublic)
def get_settings():
    return public_settings()


@router.put("", response_model=LocalSettingsPublic)
def update_settings(request: LocalSettingsUpdate):
    return public_settings(save_settings(request))


@router.post("/llm/test", response_model=ConnectionTestResponse)
def test_llm():
    settings = load_settings()
    if not settings.llm.enabled:
        return ConnectionTestResponse(ok=False, message="LLM is disabled.")

    try:
        chat_completion_json(
            "Return JSON only.",
            '{"ping":"Return {\"ok\": true} as JSON."}',
            settings=settings.llm,
        )
    except LLMError as exc:
        return ConnectionTestResponse(ok=False, message=str(exc))

    return ConnectionTestResponse(ok=True, message="LLM connection succeeded.")


@router.post("/comfyui/test", response_model=ConnectionTestResponse)
def test_comfyui():
    settings = load_settings()
    if not settings.comfyui.enabled:
        return ConnectionTestResponse(ok=False, message="ComfyUI is disabled.")

    try:
        test_comfyui_connection(settings.comfyui)
    except ComfyUIError as exc:
        return ConnectionTestResponse(ok=False, message=str(exc))

    return ConnectionTestResponse(ok=True, message="ComfyUI connection succeeded.")


@router.post("/comfyui/workflow/test", response_model=ConnectionTestResponse)
def test_comfyui_workflow():
    settings = load_settings()

    try:
        workflow = build_template_txt2img_workflow(
            positive_prompt="workflow validation prompt",
            negative_prompt="workflow validation negative prompt",
            width=settings.comfyui.width,
            height=settings.comfyui.height,
            seed=1,
            settings=settings.comfyui,
        )
    except ComfyUIWorkflowError as exc:
        return ConnectionTestResponse(ok=False, message=str(exc))

    return ConnectionTestResponse(
        ok=True,
        message=f"ComfyUI workflow mapping is valid ({len(workflow)} nodes).",
    )


@router.post("/image-provider/test", response_model=ConnectionTestResponse)
def test_image_provider():
    settings = load_settings()
    if not settings.image_provider.enabled:
        return ConnectionTestResponse(ok=False, message="Image Provider is disabled.")

    try:
        test_image_provider_connection(settings.image_provider)
    except ImageProviderError as exc:
        return ConnectionTestResponse(ok=False, message=str(exc))

    return ConnectionTestResponse(ok=True, message="Image Provider connection succeeded.")
