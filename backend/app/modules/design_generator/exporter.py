import json
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from app.core.config import OUTPUTS_DIR
from app.schemas.design import DesignData


def create_design_output_id() -> str:
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"design_{now}"


def get_design_output_dir() -> Path:
    output_dir = OUTPUTS_DIR / "design"
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def save_design_outputs(design_data: DesignData) -> dict:
    """
    Save generated design data into JSON, Markdown and Excel files.
    """
    output_id = create_design_output_id()
    output_dir = get_design_output_dir()

    json_filename = f"{output_id}.json"
    markdown_filename = f"{output_id}.md"
    excel_filename = f"{output_id}.xlsx"

    json_path = output_dir / json_filename
    markdown_path = output_dir / markdown_filename
    excel_path = output_dir / excel_filename

    save_design_json(design_data, json_path)
    save_design_markdown(design_data, markdown_path)
    save_design_excel(design_data, excel_path)

    return {
        "output_id": output_id,
        "json_path": f"outputs/design/{json_filename}",
        "markdown_path": f"outputs/design/{markdown_filename}",
        "excel_path": f"outputs/design/{excel_filename}",
    }


def save_design_json(design_data: DesignData, json_path: Path) -> None:
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(
            design_data.model_dump(),
            f,
            ensure_ascii=False,
            indent=2,
        )


def save_design_markdown(design_data: DesignData, markdown_path: Path) -> None:
    markdown = render_design_markdown(design_data)

    with markdown_path.open("w", encoding="utf-8") as f:
        f.write(markdown)

def save_design_excel(design_data: DesignData, excel_path: Path) -> None:
    workbook = Workbook()

    # Remove default sheet
    default_sheet = workbook.active
    workbook.remove(default_sheet)

    add_overview_sheet(workbook, design_data)
    add_table_sheet(
        workbook,
        "Systems",
        ["id", "name", "category", "description"],
        [item.model_dump() for item in design_data.systems],
    )
    add_table_sheet(
        workbook,
        "Resources",
        ["id", "name", "resource_type", "description"],
        [item.model_dump() for item in design_data.resources],
    )
    add_table_sheet(
        workbook,
        "Items",
        ["id", "name", "item_type", "category", "effect", "properties"],
        [item.model_dump() for item in design_data.items],
    )
    add_table_sheet(
        workbook,
        "Entities",
        ["id", "name", "entity_type", "category", "rarity", "description", "properties"],
        [item.model_dump() for item in design_data.entities],
    )
    add_table_sheet(
        workbook,
        "Progression",
        ["id", "name", "progression_type", "order", "requirement", "unlocks", "description"],
        [item.model_dump() for item in design_data.progression],
    )
    add_table_sheet(
        workbook,
        "Tasks",
        ["id", "name", "task_type", "objective", "reward", "unlock_condition"],
        [item.model_dump() for item in design_data.tasks],
    )
    add_table_sheet(
        workbook,
        "Levels",
        ["id", "name", "level_type", "order", "goal", "unlock_condition", "description"],
        [item.model_dump() for item in design_data.levels],
    )
    add_table_sheet(
        workbook,
        "BalanceNotes",
        ["target", "note"],
        [item.model_dump() for item in design_data.balance_notes],
    )

    workbook.save(excel_path)


def add_overview_sheet(workbook: Workbook, design_data: DesignData) -> None:
    sheet = workbook.create_sheet("Overview")

    rows = [
        ["Field", "Value"],
        ["Title", design_data.title],
        ["Template", design_data.template],
        ["Genre", " / ".join(design_data.genre)],
        ["Target Audience", design_data.target_audience],
        ["Pitch", design_data.pitch],
        ["Core Loop", "\n".join(design_data.core_loop)],
    ]

    for row in rows:
        sheet.append(row)

    style_sheet(sheet)
    sheet.column_dimensions["A"].width = 24
    sheet.column_dimensions["B"].width = 100

    for cell in sheet["B"]:
        cell.alignment = Alignment(wrap_text=True, vertical="top")


def add_table_sheet(workbook: Workbook, sheet_name: str, headers: list[str], rows: list[dict]) -> None:
    sheet = workbook.create_sheet(sheet_name)
    sheet.append(headers)

    for row in rows:
        values = []
        for header in headers:
            value = row.get(header, "")

            if isinstance(value, list):
                value = ", ".join(str(item) for item in value)
            elif isinstance(value, dict):
                value = json.dumps(value, ensure_ascii=False)

            values.append(value)

        sheet.append(values)

    style_sheet(sheet)

    for column_cells in sheet.columns:
        column_letter = column_cells[0].column_letter
        sheet.column_dimensions[column_letter].width = 22

    for row_cells in sheet.iter_rows():
        for cell in row_cells:
            cell.alignment = Alignment(wrap_text=True, vertical="top")


def style_sheet(sheet) -> None:
    header_fill = PatternFill("solid", fgColor="1F4E78")
    header_font = Font(color="FFFFFF", bold=True)

    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    sheet.freeze_panes = "A2"


def render_design_markdown(design_data: DesignData) -> str:
    lines = []

    lines.append(f"# {design_data.title}")
    lines.append("")
    lines.append("## 模板")
    lines.append("")
    lines.append(design_data.template)
    lines.append("")
    lines.append("## 类型")
    lines.append("")
    lines.append(" / ".join(design_data.genre))
    lines.append("")
    lines.append("## 目标用户")
    lines.append("")
    lines.append(design_data.target_audience)
    lines.append("")
    lines.append("## 一句话概念")
    lines.append("")
    lines.append(design_data.pitch)
    lines.append("")
    lines.append("## 核心循环")
    lines.append("")

    for index, step in enumerate(design_data.core_loop, start=1):
        lines.append(f"{index}. {step}")

    lines.append("")
    lines.append("## 系统拆解")
    lines.append("")
    lines.append("| ID | 名称 | 分类 | 描述 |")
    lines.append("|---|---|---|---|")

    for system in design_data.systems:
        lines.append(
            f"| {system.id} | {system.name} | {system.category} | {system.description} |"
        )

    lines.append("")
    lines.append("## 资源表")
    lines.append("")
    lines.append("| ID | 名称 | 类型 | 描述 |")
    lines.append("|---|---|---|---|")

    for resource in design_data.resources:
        lines.append(
            f"| {resource.id} | {resource.name} | {resource.resource_type} | {resource.description} |"
        )

    lines.append("")
    lines.append("## 道具表")
    lines.append("")
    lines.append("| ID | 名称 | 类型 | 分类 | 效果 | 扩展属性 |")
    lines.append("|---|---|---|---|---|---|")

    for item in design_data.items:
        lines.append(
            f"| {item.id} | {item.name} | {item.item_type} | {item.category} | {item.effect} | {item.properties} |"
        )

    lines.append("")
    lines.append("## 实体表")
    lines.append("")
    lines.append("| ID | 名称 | 实体类型 | 分类 | 稀有度 | 描述 | 扩展属性 |")
    lines.append("|---|---|---|---|---|---|---|")

    for entity in design_data.entities:
        rarity = entity.rarity or ""
        lines.append(
            f"| {entity.id} | {entity.name} | {entity.entity_type} | {entity.category} | {rarity} | {entity.description} | {entity.properties} |"
        )

    lines.append("")
    lines.append("## 成长 / 解锁表")
    lines.append("")
    lines.append("| ID | 名称 | 类型 | 顺序 | 条件 | 解锁内容 | 描述 |")
    lines.append("|---|---|---|---|---|---|---|")

    for progression in design_data.progression:
        unlocks = ", ".join(progression.unlocks)
        lines.append(
            f"| {progression.id} | {progression.name} | {progression.progression_type} | {progression.order} | {progression.requirement} | {unlocks} | {progression.description} |"
        )

    lines.append("")
    lines.append("## 任务 / 目标表")
    lines.append("")
    lines.append("| ID | 名称 | 类型 | 目标 | 奖励 | 解锁条件 |")
    lines.append("|---|---|---|---|---|---|")

    for task in design_data.tasks:
        lines.append(
            f"| {task.id} | {task.name} | {task.task_type} | {task.objective} | {task.reward} | {task.unlock_condition} |"
        )

    lines.append("")
    lines.append("## 关卡 / 区域表")
    lines.append("")
    lines.append("| ID | 名称 | 类型 | 顺序 | 目标 | 解锁条件 | 描述 |")
    lines.append("|---|---|---|---|---|---|---|")

    for level in design_data.levels:
        lines.append(
            f"| {level.id} | {level.name} | {level.level_type} | {level.order} | {level.goal} | {level.unlock_condition} | {level.description} |"
        )

    lines.append("")
    lines.append("## 平衡性建议")
    lines.append("")
    lines.append("| 目标 | 建议 |")
    lines.append("|---|---|")

    for note in design_data.balance_notes:
        lines.append(f"| {note.target} | {note.note} |")

    lines.append("")

    return "\n".join(lines)