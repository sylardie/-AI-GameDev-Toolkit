import json
from pathlib import Path
from typing import List

from app.schemas.design import DesignTemplateInfo


TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def load_template(template_id: str) -> DesignTemplateInfo:
    """
    Load a design template by id.
    Fallback to general if the target template does not exist.
    """
    template_path = TEMPLATES_DIR / f"{template_id}.json"

    if not template_path.exists():
        template_path = TEMPLATES_DIR / "general.json"

    with template_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    return DesignTemplateInfo(**data)


def list_templates() -> List[DesignTemplateInfo]:
    """
    Load all available design templates.
    """
    templates: List[DesignTemplateInfo] = []

    for template_file in sorted(TEMPLATES_DIR.glob("*.json")):
        with template_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        templates.append(DesignTemplateInfo(**data))

    return templates