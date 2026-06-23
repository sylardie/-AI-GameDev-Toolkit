from typing import Literal

from pydantic import BaseModel, Field


IssueSeverity = Literal["info", "warning", "error"]


class ConfigScanRequest(BaseModel):
    path: str


class ConfigOpenRequest(BaseModel):
    path: str


class ConfigOpenResponse(BaseModel):
    ok: bool
    message: str


class ConfigIssue(BaseModel):
    severity: IssueSeverity
    code: str
    message: str
    workbook: str = ""
    sheet: str = ""
    column: str = ""


class ConfigSheetSummary(BaseModel):
    name: str
    row_count: int
    column_count: int
    headers: list[str]
    issues: list[ConfigIssue] = Field(default_factory=list)


class ConfigWorkbookItem(BaseModel):
    name: str
    path: str
    relative_path: str
    openable: bool = True
    sheet_count: int
    sheets: list[ConfigSheetSummary] = Field(default_factory=list)
    issues: list[ConfigIssue] = Field(default_factory=list)


class ConfigScanSummary(BaseModel):
    workbook_count: int
    sheet_count: int
    issue_count: int
    skipped_temp_files: int


class ConfigScanResponse(BaseModel):
    root_path: str
    summary: ConfigScanSummary
    workbooks: list[ConfigWorkbookItem]
    issues: list[ConfigIssue] = Field(default_factory=list)
