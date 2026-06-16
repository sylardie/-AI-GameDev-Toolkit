from fastapi import APIRouter

router = APIRouter(prefix="/api/art", tags=["Art Pipeline"])


@router.get("/status")
def art_pipeline_status():
    return {
        "module": "Art Pipeline",
        "status": "placeholder",
        "message": "Prompt generator and ComfyUI pipeline will be implemented in Phase 3.",
    }