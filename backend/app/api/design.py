from typing import List

from fastapi import APIRouter

from app.schemas.design import (
    DesignGenerateRequest,
    DesignGenerateResponse,
    DesignTemplateInfo,
)
from app.modules.design_generator.mock_generator import generate_mock_design
from app.modules.design_generator.exporter import save_design_outputs
from app.modules.design_generator.template_loader import list_templates, load_template

router = APIRouter(prefix="/api/design", tags=["Design Generator"])


@router.get("/templates", response_model=List[DesignTemplateInfo])
def get_design_templates():
    return list_templates()


@router.post("/generate", response_model=DesignGenerateResponse)
def generate_design(request: DesignGenerateRequest):
    template_info = load_template(request.template)
    design_data = generate_mock_design(request.idea, template_info.id)
    output_info = save_design_outputs(design_data)

    return DesignGenerateResponse(
        output_id=output_info["output_id"],
        json_path=output_info["json_path"],
        markdown_path=output_info["markdown_path"],
        excel_path=output_info["excel_path"],
        data=design_data,
    )