import re
from pathlib import Path

from app.modules.code_agent.file_reader import read_project_file
from app.schemas.code import ProjectStructureResponse, ProjectStructureSymbol


SUPPORTED_EXTENSIONS = {".gd", ".cs"}

GD_FUNC_PATTERN = re.compile(r"^\s*(?:static\s+)?func\s+([A-Za-z_]\w*)\s*\(([^)]*)\)")
GD_VAR_PATTERN = re.compile(r"^\s*(?:@export\s+)?var\s+([A-Za-z_]\w*)")
GD_SIGNAL_PATTERN = re.compile(r"^\s*signal\s+([A-Za-z_]\w*)")
GD_CLASS_PATTERN = re.compile(r"^\s*class_name\s+([A-Za-z_]\w*)")

CS_TYPE_PATTERN = re.compile(
    r"^\s*(?:\[[^\]]+\]\s*)*(?:public|private|protected|internal|static|sealed|abstract|partial|\s)+\s*"
    r"(class|struct|interface|enum)\s+([A-Za-z_]\w*)"
)
CS_METHOD_PATTERN = re.compile(
    r"^\s*(?:\[[^\]]+\]\s*)*(?:public|private|protected|internal|static|virtual|override|async|sealed|partial|extern|\s)+\s*"
    r"[A-Za-z_][\w<>\[\],\s?]*\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:where\s+.+)?[{;]?\s*$"
)
CS_FIELD_PATTERN = re.compile(
    r"^\s*(?:\[[^\]]+\]\s*)*(?:public|private|protected|internal|static|readonly|const|serializedfield|SerializeField|\s)+\s*"
    r"[A-Za-z_][\w<>\[\],\s?]*\s+([A-Za-z_]\w*)\s*(?:=|;)"
)


def analyze_script_structure(project_path: Path, relative_path: str) -> ProjectStructureResponse:
    file_preview = read_project_file(project_path, relative_path)
    extension = file_preview.extension.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        return ProjectStructureResponse(
            project_path=file_preview.project_path,
            relative_path=file_preview.relative_path,
            name=file_preview.name,
            extension=file_preview.extension,
            supported=False,
            message="Structure extraction is available for .gd and .cs files.",
        )

    if not file_preview.is_text:
        return ProjectStructureResponse(
            project_path=file_preview.project_path,
            relative_path=file_preview.relative_path,
            name=file_preview.name,
            extension=file_preview.extension,
            supported=False,
            message=file_preview.message or "File cannot be analyzed.",
        )

    if extension == ".gd":
        symbols = _analyze_gdscript(file_preview.content)
    else:
        symbols = _analyze_csharp(file_preview.content)

    return ProjectStructureResponse(
        project_path=file_preview.project_path,
        relative_path=file_preview.relative_path,
        name=file_preview.name,
        extension=file_preview.extension,
        supported=True,
        symbols=symbols,
        message="" if symbols else "No structure symbols were found.",
    )


def _analyze_gdscript(content: str) -> list[ProjectStructureSymbol]:
    symbols: list[ProjectStructureSymbol] = []

    for line_number, line in enumerate(content.splitlines(), start=1):
        class_match = GD_CLASS_PATTERN.match(line)
        if class_match:
            symbols.append(_symbol("class", class_match.group(1), line_number, line))
            continue

        signal_match = GD_SIGNAL_PATTERN.match(line)
        if signal_match:
            symbols.append(_symbol("signal", signal_match.group(1), line_number, line))
            continue

        func_match = GD_FUNC_PATTERN.match(line)
        if func_match:
            symbols.append(_symbol("function", func_match.group(1), line_number, line))
            continue

        var_match = GD_VAR_PATTERN.match(line)
        if var_match:
            kind = "export" if "@export" in line else "variable"
            symbols.append(_symbol(kind, var_match.group(1), line_number, line))

    return symbols


def _analyze_csharp(content: str) -> list[ProjectStructureSymbol]:
    symbols: list[ProjectStructureSymbol] = []

    for line_number, line in enumerate(content.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//"):
            continue

        type_match = CS_TYPE_PATTERN.match(line)
        if type_match:
            symbols.append(_symbol(type_match.group(1), type_match.group(2), line_number, line))
            continue

        method_match = CS_METHOD_PATTERN.match(line)
        if method_match and method_match.group(1) not in {"if", "for", "foreach", "while", "switch", "catch"}:
            symbols.append(_symbol("method", method_match.group(1), line_number, line))
            continue

        field_match = CS_FIELD_PATTERN.match(line)
        if field_match:
            symbols.append(_symbol("field", field_match.group(1), line_number, line))

    return symbols


def _symbol(kind: str, name: str, line_number: int, line: str) -> ProjectStructureSymbol:
    return ProjectStructureSymbol(
        kind=kind,
        name=name,
        line_number=line_number,
        signature=line.strip(),
    )
