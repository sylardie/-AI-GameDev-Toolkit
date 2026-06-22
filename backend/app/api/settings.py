from fastapi import APIRouter

from app.modules.art_pipeline.comfyui_client import ComfyUIError, test_comfyui_connection
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
