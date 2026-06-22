from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.design import (
    DesignGenerateRequest,
    DesignGenerateResponse,
    DesignTemplateInfo,
)

from app.core.config import LLM_API_BASE_URL, LLM_API_KEY, LLM_ENABLED, LLM_MODEL
from app.modules.design_generator.llm_generator import generate_design_with_llm
from app.modules.design_generator.exporter import save_design_outputs
from app.modules.design_generator.template_loader import list_templates, load_template
from app.modules.shared.settings_store import load_settings


router = APIRouter(prefix="/api/design", tags=["Design Generator"])


@router.get("/status")
def design_generator_status():
    settings = load_settings()
    local_llm_enabled = settings.llm.enabled and bool(settings.llm.api_base_url and settings.llm.api_key)
    env_llm_enabled = LLM_ENABLED and bool(LLM_API_BASE_URL and LLM_API_KEY and LLM_MODEL)
    return {
        "module": "Design Generator",
        "status": "ready" if local_llm_enabled or env_llm_enabled else "needs_llm_config",
        "message": "Real LLM design generation and JSON / Markdown / Excel export are available when LLM settings are configured.",
        "llm_enabled": local_llm_enabled or env_llm_enabled,
    }


@router.get("/templates", response_model=List[DesignTemplateInfo])
def get_design_templates():
    return list_templates()


@router.post("/generate", response_model=DesignGenerateResponse)
def generate_design(request: DesignGenerateRequest):
    template_info = load_template(request.template)
    settings = load_settings()
    local_llm_enabled = settings.llm.enabled and bool(settings.llm.api_base_url and settings.llm.api_key)

    if local_llm_enabled:
        try:
            design_data = generate_design_with_llm(request.idea, template_info.id, settings.llm)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"LLM generation failed: {exc}") from exc
    elif LLM_ENABLED and LLM_API_BASE_URL and LLM_API_KEY and LLM_MODEL:
        try:
            design_data = generate_design_with_llm(request.idea, template_info.id)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"LLM generation failed: {exc}") from exc
    else:
        raise HTTPException(
            status_code=400,
            detail="Design Generator requires a configured LLM. Enable LLM in Settings or configure backend .env.",
        )

    output_info = save_design_outputs(design_data)

    return DesignGenerateResponse(
        output_id=output_info["output_id"],
        json_path=output_info["json_path"],
        markdown_path=output_info["markdown_path"],
        excel_path=output_info["excel_path"],
        data=design_data,
    )
