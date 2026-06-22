from typing import List, Literal

from pydantic import BaseModel, Field


ProjectType = Literal["godot", "unity", "unknown"]
FileCategory = Literal["scripts", "scenes", "resources", "configs", "others"]


class ProjectScanRequest(BaseModel):
    project_path: str = Field(..., min_length=1, description="Local game project root path")


class ProjectFileReadRequest(BaseModel):
    project_path: str = Field(..., min_length=1, description="Local game project root path")
    relative_path: str = Field(..., min_length=1, description="File path relative to the project root")


class ProjectStructureRequest(BaseModel):
    project_path: str = Field(..., min_length=1, description="Local game project root path")
    relative_path: str = Field(..., min_length=1, description="Script path relative to the project root")


class ProjectErrorLogAnalyzeRequest(BaseModel):
    project_path: str = Field(..., min_length=1, description="Local game project root path")
    log_text: str = Field(..., min_length=5, max_length=20000, description="Pasted Godot or Unity error log")


class ProjectSearchRequest(BaseModel):
    project_path: str = Field(..., min_length=1, description="Local game project root path")
    query: str = Field(..., min_length=2, max_length=120, description="Search keyword")
    max_results: int = Field(default=100, ge=1, le=300, description="Maximum matched lines to return")


class ProjectFileItem(BaseModel):
    name: str
    relative_path: str
    extension: str
    category: FileCategory
    size_bytes: int


class ProjectFileGroups(BaseModel):
    scripts: List[ProjectFileItem] = Field(default_factory=list)
    scenes: List[ProjectFileItem] = Field(default_factory=list)
    resources: List[ProjectFileItem] = Field(default_factory=list)
    configs: List[ProjectFileItem] = Field(default_factory=list)
    others: List[ProjectFileItem] = Field(default_factory=list)


class ProjectScanSummary(BaseModel):
    total_files: int
    script_count: int
    scene_count: int
    resource_count: int
    config_count: int
    other_count: int
    total_size_bytes: int
    skipped_directories: List[str] = Field(default_factory=list)


class ProjectScanResponse(BaseModel):
    project_path: str
    project_name: str
    project_type: ProjectType
    files: ProjectFileGroups
    summary: ProjectScanSummary


class ProjectFileReadResponse(BaseModel):
    project_path: str
    relative_path: str
    name: str
    extension: str
    size_bytes: int
    is_text: bool
    content: str = ""
    message: str = ""


class ProjectSearchMatch(BaseModel):
    relative_path: str
    name: str
    extension: str
    line_number: int
    line_text: str


class ProjectSearchSummary(BaseModel):
    query: str
    scanned_files: int
    skipped_files: int
    match_count: int
    truncated: bool


class ProjectSearchResponse(BaseModel):
    project_path: str
    matches: List[ProjectSearchMatch] = Field(default_factory=list)
    summary: ProjectSearchSummary


class ProjectStructureSymbol(BaseModel):
    kind: str
    name: str
    line_number: int
    signature: str = ""


class ProjectStructureResponse(BaseModel):
    project_path: str
    relative_path: str
    name: str
    extension: str
    supported: bool
    symbols: List[ProjectStructureSymbol] = Field(default_factory=list)
    message: str = ""


class ProjectErrorReference(BaseModel):
    source: str
    line_number: int | None = None
    column_number: int | None = None
    message: str = ""
    matched_file: str | None = None


class ProjectErrorRelatedFile(BaseModel):
    relative_path: str
    name: str
    extension: str
    score: int
    reason: str
    line_number: int | None = None


class ProjectErrorLogSummary(BaseModel):
    detected_engine: str
    reference_count: int
    related_file_count: int
    keywords: List[str] = Field(default_factory=list)


class ProjectErrorLogAnalyzeResponse(BaseModel):
    project_path: str
    references: List[ProjectErrorReference] = Field(default_factory=list)
    related_files: List[ProjectErrorRelatedFile] = Field(default_factory=list)
    summary: ProjectErrorLogSummary
