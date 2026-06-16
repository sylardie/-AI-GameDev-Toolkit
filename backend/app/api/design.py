from fastapi import APIRouter

from app.schemas.design import DesignGenerateRequest, DesignGenerateResponse
from app.modules.design_generator.mock_generator import generate_mock_design

router = APIRouter(prefix="/api/design", tags=["Design Generator"])


@router.post("/generate", response_model=DesignGenerateResponse)
def generate_design(request: DesignGenerateRequest):
    return generate_mock_design(request.idea)