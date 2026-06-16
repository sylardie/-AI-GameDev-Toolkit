import json
from datetime import datetime
from pathlib import Path

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
    Save generated design data into JSON and Markdown files.
    """
    output_id = create_design_output_id()
    output_dir = get_design_output_dir()

    json_filename = f"{output_id}.json"
    markdown_filename = f"{output_id}.md"

    json_path = output_dir / json_filename
    markdown_path = output_dir / markdown_filename

    save_design_json(design_data, json_path)
    save_design_markdown(design_data, markdown_path)

    return {
        "output_id": output_id,
        "json_path": f"outputs/design/{json_filename}",
        "markdown_path": f"outputs/design/{markdown_filename}",
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