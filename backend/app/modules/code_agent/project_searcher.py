import os
from pathlib import Path

from app.modules.code_agent.file_reader import (
    MAX_PREVIEW_BYTES,
    _decode_text,
    _is_text_file,
    _validate_path,
)
from app.modules.code_agent.project_scanner import IGNORED_DIRECTORY_NAMES
from app.schemas.code import (
    ProjectSearchMatch,
    ProjectSearchResponse,
    ProjectSearchSummary,
)


MAX_MATCH_LINE_CHARS = 300


def search_project(
    project_path: Path,
    query: str,
    max_results: int,
) -> ProjectSearchResponse:
    project_root = project_path.expanduser().resolve()
    normalized_query = query.strip()
    query_lower = normalized_query.lower()
    matches: list[ProjectSearchMatch] = []
    scanned_files = 0
    skipped_files = 0
    truncated = False

    for current_root, dir_names, file_names in os.walk(project_root):
        dir_names[:] = [
            name for name in dir_names if name.lower() not in IGNORED_DIRECTORY_NAMES
        ]

        for file_name in file_names:
            file_path = Path(current_root) / file_name

            if len(matches) >= max_results:
                truncated = True
                break

            if not _can_search_file(project_root, file_path):
                skipped_files += 1
                continue

            try:
                content = _decode_text(file_path.read_bytes())
            except OSError:
                skipped_files += 1
                continue

            scanned_files += 1

            for line_number, line_text in enumerate(content.splitlines(), start=1):
                if query_lower not in line_text.lower():
                    continue

                matches.append(
                    ProjectSearchMatch(
                        relative_path=file_path.relative_to(project_root).as_posix(),
                        name=file_path.name,
                        extension=file_path.suffix.lower(),
                        line_number=line_number,
                        line_text=_format_match_line(line_text),
                    )
                )

                if len(matches) >= max_results:
                    truncated = True
                    break

            if truncated:
                break

        if truncated:
            break

    return ProjectSearchResponse(
        project_path=str(project_root),
        matches=matches,
        summary=ProjectSearchSummary(
            query=normalized_query,
            scanned_files=scanned_files,
            skipped_files=skipped_files,
            match_count=len(matches),
            truncated=truncated,
        ),
    )


def _can_search_file(project_root: Path, file_path: Path) -> bool:
    try:
        _validate_path(project_root, file_path.resolve())
    except (FileNotFoundError, PermissionError, OSError):
        return False

    try:
        if file_path.stat().st_size > MAX_PREVIEW_BYTES:
            return False
        raw_bytes = file_path.read_bytes()
    except OSError:
        return False

    return _is_text_file(file_path) and b"\x00" not in raw_bytes


def _format_match_line(line_text: str) -> str:
    stripped = line_text.strip()

    if len(stripped) <= MAX_MATCH_LINE_CHARS:
        return stripped

    return f"{stripped[:MAX_MATCH_LINE_CHARS]}..."
