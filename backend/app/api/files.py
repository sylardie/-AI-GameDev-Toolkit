from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.core.config import OUTPUTS_DIR


router = APIRouter(prefix="/api/files", tags=["Files"])


@router.get("/download")
def download_file(path: str = Query(..., description="Relative output file path")):
    """
    Download a generated output file.

    Example:
      /api/files/download?path=outputs/design/design_20260616_120000.xlsx
    """
    safe_path = resolve_output_file(path)

    if not safe_path.exists() or not safe_path.is_file():
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(
        path=safe_path,
        filename=safe_path.name,
        media_type="application/octet-stream",
    )


def resolve_output_file(relative_path: str) -> Path:
    """
    Resolve and validate output file path.

    Only allow files inside backend/app/data/outputs.
    This prevents path traversal such as ../../secret.env.
    """
    normalized = relative_path.replace("\\", "/").strip()

    if normalized.startswith("/"):
        raise HTTPException(status_code=400, detail="Absolute path is not allowed.")

    if not normalized.startswith("outputs/"):
        raise HTTPException(
            status_code=400,
            detail="Only files under outputs/ can be downloaded.",
        )

    # Remove leading "outputs/" because OUTPUTS_DIR already points to data/outputs
    inner_path = normalized.removeprefix("outputs/")
    target_path = (OUTPUTS_DIR / inner_path).resolve()
    outputs_root = OUTPUTS_DIR.resolve()

    if outputs_root not in target_path.parents and target_path != outputs_root:
        raise HTTPException(status_code=400, detail="Invalid file path.")

    return target_path