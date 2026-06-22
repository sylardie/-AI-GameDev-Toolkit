import re
from pathlib import Path

from app.modules.code_agent.project_scanner import scan_project
from app.schemas.code import (
    ProjectErrorLogAnalyzeResponse,
    ProjectErrorLogSummary,
    ProjectErrorReference,
    ProjectErrorRelatedFile,
)


UNITY_PATH_PATTERN = re.compile(
    r"(?P<path>(?:Assets|Packages)[\\/][^:\n\r()]+?\.(?:cs|shader|asmdef|json|asset))"
    r"(?:\((?P<line>\d+)(?:,(?P<column>\d+))?\))?"
)
GODOT_RES_PATTERN = re.compile(
    r"res://(?P<path>[^:\n\r]+?\.(?:gd|tscn|tres|cs|shader))(?:[:\(](?P<line>\d+)\)?)?"
)
GENERIC_PATH_PATTERN = re.compile(
    r"(?P<path>[\w./\\-]+?\.(?:gd|cs|tscn|tres|unity|shader))[:\(](?P<line>\d+)\)?"
)
ERROR_CODE_PATTERN = re.compile(
    r"\b(?:CS\d{4}|NullReferenceException|MissingReferenceException|IndexOutOfRangeException|InvalidOperationException|Parse Error|SCRIPT ERROR|ERROR)\b",
    re.IGNORECASE,
)


def analyze_error_log(project_path: Path, log_text: str) -> ProjectErrorLogAnalyzeResponse:
    project_root = project_path.expanduser().resolve()
    scan = scan_project(project_root)
    known_files = _flatten_files(scan)
    references = _extract_references(log_text)
    related_files = _match_related_files(references, known_files)
    keywords = _extract_keywords(log_text)

    return ProjectErrorLogAnalyzeResponse(
        project_path=str(project_root),
        references=references,
        related_files=related_files,
        summary=ProjectErrorLogSummary(
            detected_engine=_detect_engine(log_text),
            reference_count=len(references),
            related_file_count=len(related_files),
            keywords=keywords,
        ),
    )


def _flatten_files(scan) -> list:
    files = []
    for category in ["scripts", "scenes", "resources", "configs", "others"]:
        files.extend(getattr(scan.files, category))
    return files


def _extract_references(log_text: str) -> list[ProjectErrorReference]:
    references: list[ProjectErrorReference] = []

    for line in log_text.splitlines():
        for pattern in [UNITY_PATH_PATTERN, GODOT_RES_PATTERN, GENERIC_PATH_PATTERN]:
            for match in pattern.finditer(line):
                raw_path = _normalize_path(match.group("path"))
                references.append(
                    ProjectErrorReference(
                        source=raw_path,
                        line_number=_to_int(match.groupdict().get("line")),
                        column_number=_to_int(match.groupdict().get("column")),
                        message=line.strip()[:500],
                    )
                )

    return _dedupe_references(references)


def _match_related_files(
    references: list[ProjectErrorReference],
    known_files: list,
) -> list[ProjectErrorRelatedFile]:
    related: dict[str, ProjectErrorRelatedFile] = {}

    for reference in references:
        ref_path = _normalize_path(reference.source).lower()
        ref_name = Path(ref_path).name.lower()

        for file_item in known_files:
            relative_path = file_item.relative_path
            normalized_file = relative_path.lower()
            file_name = file_item.name.lower()
            score = 0
            reason = ""

            if normalized_file == ref_path:
                score = 100
                reason = "Exact path match"
            elif normalized_file.endswith(ref_path):
                score = 90
                reason = "Path suffix match"
            elif file_name == ref_name:
                score = 70
                reason = "File name match"

            if score == 0:
                continue

            current = related.get(relative_path)
            if current and current.score >= score:
                continue

            reference.matched_file = relative_path
            related[relative_path] = ProjectErrorRelatedFile(
                relative_path=relative_path,
                name=file_item.name,
                extension=file_item.extension,
                score=score,
                reason=reason,
                line_number=reference.line_number,
            )

    return sorted(related.values(), key=lambda item: (-item.score, item.relative_path))[:20]


def _extract_keywords(log_text: str) -> list[str]:
    keywords = []
    seen = set()

    for match in ERROR_CODE_PATTERN.finditer(log_text):
        keyword = match.group(0)
        key = keyword.lower()
        if key in seen:
            continue
        seen.add(key)
        keywords.append(keyword)

    return keywords[:12]


def _detect_engine(log_text: str) -> str:
    lower_text = log_text.lower()
    if "res://" in lower_text or "gdscript" in lower_text or "script error" in lower_text:
        return "godot"
    if "assets/" in lower_text or "cs" in lower_text or "unityengine" in lower_text:
        return "unity"
    return "unknown"


def _dedupe_references(references: list[ProjectErrorReference]) -> list[ProjectErrorReference]:
    deduped = []
    seen = set()

    for reference in references:
        key = (reference.source.lower(), reference.line_number, reference.column_number)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(reference)

    return deduped[:50]


def _normalize_path(path: str) -> str:
    return path.strip().replace("\\", "/").lstrip("./")


def _to_int(value: str | None) -> int | None:
    if not value:
        return None
    return int(value)
