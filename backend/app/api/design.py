from fastapi import APIRouter

from app.schemas.design import DesignGenerateRequest, DesignGenerateResponse
from app.modules.design_generator.mock_generator import generate_mock_design
from app.modules.design_generator.exporter import save_design_outputs

router = APIRouter(prefix="/api/design", tags=["Design Generator"])


@router.post("/generate", response_model=DesignGenerateResponse)
def generate_design(request: DesignGenerateRequest):
    design_data = generate_mock_design(request.idea, request.template)
    output_info = save_design_outputs(design_data)

    return DesignGenerateResponse(
        output_id=output_info["output_id"],
        json_path=output_info["json_path"],
        markdown_path=output_info["markdown_path"],
        data=design_data,
    )