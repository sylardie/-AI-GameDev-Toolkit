from pathlib import Path

from app.modules.code_agent.project_scanner import IGNORED_DIRECTORY_NAMES
from app.schemas.code import ProjectFileReadResponse


MAX_PREVIEW_BYTES = 256 * 1024

TEXT_EXTENSIONS = {
    ".asmdef",
    ".asset",
    ".boo",
    ".cfg",
    ".config",
    ".cs",
    ".csproj",
    ".gd",
    ".godot",
    ".import",
    ".ini",
    ".js",
    ".json",
    ".md",
    ".meta",
    ".prefab",
    ".py",
    ".shader",
    ".sln",
    ".tres",
    ".tscn",
    ".txt",
    ".unity",
    ".xml",
    ".yaml",
    ".yml",
}

TEXT_FILENAMES = {
    ".gitignore",
    "manifest.json",
    "packages-lock.json",
    "project.godot",
    "readme",
}


def read_project_file(project_path: Path, relative_path: str) -> ProjectFileReadResponse:
    project_root = project_path.expanduser().resolve()
    target_path = (project_root / relative_path).resolve()

    _validate_path(project_root, target_path)

    size_bytes = target_path.stat().st_size
    extension = target_path.suffix.lower()

    if size_bytes > MAX_PREVIEW_BYTES:
        return _metadata_response(
            project_root,
            target_path,
            is_text=False,
            message=f"File is larger than {MAX_PREVIEW_BYTES // 1024}KB and was not loaded.",
        )

    if not _is_text_file(target_path):
        return _metadata_response(
            project_root,
            target_path,
            is_text=False,
            message="This file type is not available for text preview.",
        )

    raw_bytes = target_path.read_bytes()

    if b"\x00" in raw_bytes:
        return _metadata_response(
            project_root,
            target_path,
            is_text=False,
            message="This file appears to be binary and was not loaded.",
        )

    content = _decode_text(raw_bytes)

    return ProjectFileReadResponse(
        project_path=str(project_root),
        relative_path=target_path.relative_to(project_root).as_posix(),
        name=target_path.name,
        extension=extension,
        size_bytes=size_bytes,
        is_text=True,
        content=content,
    )


def _validate_path(project_root: Path, target_path: Path) -> None:
    try:
        relative_parts = target_path.relative_to(project_root).parts
    except ValueError as exc:
        raise PermissionError("File must be inside the project path.") from exc

    if not target_path.is_file():
        raise FileNotFoundError("File does not exist.")

    for part in relative_parts[:-1]:
        if part.lower() in IGNORED_DIRECTORY_NAMES:
            raise PermissionError("Files inside ignored directories cannot be previewed.")


def _is_text_file(file_path: Path) -> bool:
    extension = file_path.suffix.lower()
    file_name = file_path.name.lower()

    return extension in TEXT_EXTENSIONS or file_name in TEXT_FILENAMES


def _decode_text(raw_bytes: bytes) -> str:
    for encoding in ["utf-8-sig", "utf-8", "gb18030", "latin-1"]:
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue

    return raw_bytes.decode("utf-8", errors="replace")


def _metadata_response(
    project_root: Path,
    target_path: Path,
    is_text: bool,
    message: str,
) -> ProjectFileReadResponse:
    return ProjectFileReadResponse(
        project_path=str(project_root),
        relative_path=target_path.relative_to(project_root).as_posix(),
        name=target_path.name,
        extension=target_path.suffix.lower(),
        size_bytes=target_path.stat().st_size,
        is_text=is_text,
        message=message,
    )
