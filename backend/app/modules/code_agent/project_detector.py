from pathlib import Path

from app.schemas.code import ProjectType


def detect_project_type(project_path: Path) -> ProjectType:
    if (project_path / "project.godot").is_file():
        return "godot"

    if (project_path / "Assets").is_dir() and (project_path / "ProjectSettings").is_dir():
        return "unity"

    return "unknown"
