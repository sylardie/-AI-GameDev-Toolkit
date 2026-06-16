from fastapi import APIRouter

router = APIRouter(prefix="/api/code", tags=["Code Agent"])


@router.get("/status")
def code_agent_status():
    return {
        "module": "Code Agent",
        "status": "placeholder",
        "message": "Godot / Unity project scanner will be implemented in Phase 2.",
    }