import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.modules.config_manager.excel_scanner import scan_config_folder
from app.schemas.configs import (
    ConfigOpenRequest,
    ConfigOpenResponse,
    ConfigScanRequest,
    ConfigScanResponse,
)


router = APIRouter(prefix="/api/configs", tags=["Config Manager"])


@router.post("/scan", response_model=ConfigScanResponse)
def scan_configs(request: ConfigScanRequest):
    try:
        return scan_config_folder(request.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/open", response_model=ConfigOpenResponse)
def open_config_file(request: ConfigOpenRequest):
    path = Path(request.path).expanduser().resolve()
    if not path.exists():
        raise HTTPException(status_code=404, detail="Excel file does not exist.")
    if not path.is_file() or path.suffix.lower() != ".xlsx":
        raise HTTPException(status_code=400, detail="Only .xlsx files can be opened.")

    try:
        if os.name != "nt":
            raise RuntimeError("Opening files is currently supported on Windows only.")
        os.startfile(path)  # type: ignore[attr-defined]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to open Excel file: {exc}") from exc

    return ConfigOpenResponse(ok=True, message="Excel file opened.")


@router.get("/status")
def configs_status():
    return {
        "module": "Config Manager",
        "status": "ready",
        "mode": "read_only",
    }
