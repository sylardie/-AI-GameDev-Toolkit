from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.modules.code_agent.file_reader import read_project_file
from app.modules.code_agent.error_log_analyzer import analyze_error_log
from app.modules.code_agent.project_searcher import search_project
from app.modules.code_agent.project_scanner import scan_project
from app.modules.code_agent.script_analyzer import analyze_script_structure
from app.schemas.code import (
    ProjectFileReadRequest,
    ProjectFileReadResponse,
    ProjectErrorLogAnalyzeRequest,
    ProjectErrorLogAnalyzeResponse,
    ProjectSearchRequest,
    ProjectSearchResponse,
    ProjectScanRequest,
    ProjectScanResponse,
    ProjectStructureRequest,
    ProjectStructureResponse,
)

router = APIRouter(prefix="/api/code", tags=["Code Agent"])


@router.get("/status")
def code_agent_status():
    return {
        "module": "Code Agent",
        "status": "ready",
        "message": "Godot / Unity scanning, file preview, search, structure extraction, and error-log analysis are available.",
    }


@router.post("/scan", response_model=ProjectScanResponse)
def scan_game_project(request: ProjectScanRequest):
    project_path = Path(request.project_path).expanduser()

    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project path does not exist.")

    if not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Project path must be a directory.")

    try:
        return scan_project(project_path)
    except OSError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to scan project path: {exc}") from exc


@router.post("/file", response_model=ProjectFileReadResponse)
def read_game_project_file(request: ProjectFileReadRequest):
    project_path = Path(request.project_path).expanduser()

    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project path does not exist.")

    if not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Project path must be a directory.")

    try:
        return read_project_file(project_path, request.relative_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read file: {exc}") from exc


@router.post("/search", response_model=ProjectSearchResponse)
def search_game_project(request: ProjectSearchRequest):
    project_path = Path(request.project_path).expanduser()

    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project path does not exist.")

    if not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Project path must be a directory.")

    query = request.query.strip()
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Search query must contain at least 2 characters.")

    try:
        return search_project(project_path, query, request.max_results)
    except OSError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to search project: {exc}") from exc


@router.post("/structure", response_model=ProjectStructureResponse)
def analyze_game_project_script(request: ProjectStructureRequest):
    project_path = Path(request.project_path).expanduser()

    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project path does not exist.")

    if not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Project path must be a directory.")

    try:
        return analyze_script_structure(project_path, request.relative_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to analyze script: {exc}") from exc


@router.post("/errors/analyze", response_model=ProjectErrorLogAnalyzeResponse)
def analyze_game_project_error_log(request: ProjectErrorLogAnalyzeRequest):
    project_path = Path(request.project_path).expanduser()

    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project path does not exist.")

    if not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Project path must be a directory.")

    try:
        return analyze_error_log(project_path, request.log_text)
    except OSError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to analyze error log: {exc}") from exc
