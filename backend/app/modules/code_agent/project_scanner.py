import os
from pathlib import Path

from app.modules.code_agent.project_detector import detect_project_type
from app.schemas.code import (
    FileCategory,
    ProjectFileGroups,
    ProjectFileItem,
    ProjectScanResponse,
    ProjectScanSummary,
)


IGNORED_DIRECTORY_NAMES = {
    ".git",
    ".godot",
    ".idea",
    ".venv",
    ".vscode",
    "__pycache__",
    "bin",
    "build",
    "builds",
    "cache",
    "dist",
    "library",
    "logs",
    "node_modules",
    "obj",
    "temp",
    "tmp",
    "user",
    "venv",
}

SCRIPT_EXTENSIONS = {".gd", ".cs", ".js", ".boo"}
SCENE_EXTENSIONS = {".tscn", ".scn", ".unity", ".prefab"}
RESOURCE_EXTENSIONS = {
    ".anim",
    ".asset",
    ".controller",
    ".fbx",
    ".glb",
    ".gltf",
    ".import",
    ".jpeg",
    ".jpg",
    ".mat",
    ".mp3",
    ".obj",
    ".ogg",
    ".otf",
    ".png",
    ".res",
    ".shader",
    ".svg",
    ".tres",
    ".ttf",
    ".wav",
    ".webp",
}
CONFIG_EXTENSIONS = {
    ".asmdef",
    ".cfg",
    ".config",
    ".csproj",
    ".godot",
    ".ini",
    ".json",
    ".sln",
    ".toml",
    ".xml",
    ".yaml",
    ".yml",
}
CONFIG_FILENAMES = {
    "project.godot",
    "packages-lock.json",
    "manifest.json",
}


def scan_project(project_path: Path) -> ProjectScanResponse:
    resolved_path = project_path.expanduser().resolve()
    project_type = detect_project_type(resolved_path)
    file_groups = ProjectFileGroups()
    skipped_directories = set()
    total_size_bytes = 0

    for current_root, dir_names, file_names in os.walk(resolved_path):
        dir_names[:] = [
            name
            for name in dir_names
            if not _should_ignore_directory(
                name,
                current_root,
                skipped_directories,
                resolved_path,
            )
        ]

        for file_name in file_names:
            file_path = Path(current_root) / file_name

            try:
                size_bytes = file_path.stat().st_size
            except OSError:
                continue

            relative_path = file_path.relative_to(resolved_path).as_posix()
            category = classify_file(file_path, resolved_path)
            item = ProjectFileItem(
                name=file_name,
                relative_path=relative_path,
                extension=file_path.suffix.lower(),
                category=category,
                size_bytes=size_bytes,
            )

            getattr(file_groups, category).append(item)
            total_size_bytes += size_bytes

    for category in ["scripts", "scenes", "resources", "configs", "others"]:
        getattr(file_groups, category).sort(key=lambda item: item.relative_path.lower())

    summary = ProjectScanSummary(
        total_files=sum(len(getattr(file_groups, category)) for category in ["scripts", "scenes", "resources", "configs", "others"]),
        script_count=len(file_groups.scripts),
        scene_count=len(file_groups.scenes),
        resource_count=len(file_groups.resources),
        config_count=len(file_groups.configs),
        other_count=len(file_groups.others),
        total_size_bytes=total_size_bytes,
        skipped_directories=sorted(skipped_directories),
    )

    return ProjectScanResponse(
        project_path=str(resolved_path),
        project_name=resolved_path.name,
        project_type=project_type,
        files=file_groups,
        summary=summary,
    )


def classify_file(file_path: Path, project_root: Path | None = None) -> FileCategory:
    suffix = file_path.suffix.lower()
    file_name = file_path.name.lower()

    if project_root:
        relative_parts = [part.lower() for part in file_path.relative_to(project_root).parts]
        if relative_parts and relative_parts[0] in {"projectsettings", "packages"}:
            return "configs"

    if suffix in SCRIPT_EXTENSIONS:
        return "scripts"
    if suffix in SCENE_EXTENSIONS:
        return "scenes"
    if suffix in RESOURCE_EXTENSIONS:
        return "resources"
    if suffix in CONFIG_EXTENSIONS or file_name in CONFIG_FILENAMES:
        return "configs"

    return "others"


def _should_ignore_directory(
    dir_name: str,
    current_root: str,
    skipped_directories: set[str],
    project_root: Path,
) -> bool:
    if dir_name.lower() not in IGNORED_DIRECTORY_NAMES:
        return False

    ignored_path = Path(current_root) / dir_name
    try:
        skipped_directories.add(ignored_path.relative_to(project_root).as_posix())
    except ValueError:
        skipped_directories.add(dir_name)

    return True
