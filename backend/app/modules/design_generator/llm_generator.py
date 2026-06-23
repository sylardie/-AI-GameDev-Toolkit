import json

from pydantic import ValidationError

from app.modules.shared.llm_client import chat_completion_json
from app.schemas.design import DesignData
from app.schemas.settings import LLMSettings


RECOMMENDED_TABLES = [
    "Items",
    "Monsters",
    "Skills",
    "Quests",
    "Levels",
    "Rewards",
    "Economy",
]


def generate_design_with_llm(
    idea: str,
    template_id: str,
    settings: LLMSettings | None = None,
) -> DesignData:
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(idea)

    raw_content = chat_completion_json(system_prompt, user_prompt, settings=settings)

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON: {raw_content}") from exc

    try:
        return DesignData(**data)
    except ValidationError as exc:
        raise ValueError(f"LLM JSON does not match config table schema: {exc}") from exc


def build_system_prompt() -> str:
    return """
You are a senior Unity and Godot game configuration designer.
Your task is to turn a short gameplay idea into engine-friendly configuration tables.

Strict rules:
1. Return JSON only. Do not return Markdown or explanations outside JSON.
2. The JSON must match the requested schema exactly.
3. Focus on reusable config tables, not long-form GDD prose.
4. Prefer fields that can be used directly in Unity / Godot runtime data loading.
5. Every table must include an id field.
6. Use English snake_case ids and field names.
7. Field types should be simple: string, int, float, bool, enum, string[], int[], float[].
8. References should name another table and field, for example Items.id.
9. Include practical example rows, not placeholders.
""".strip()


def build_user_prompt(idea: str) -> str:
    tables = ", ".join(RECOMMENDED_TABLES)
    return f"""
Gameplay idea:
{idea}

Generate a structured configuration-table package for Unity / Godot.

Recommended table coverage:
{tables}

Return this JSON shape:

{{
  "title": "short project/config package title",
  "gameplay_summary": "one concise sentence describing the playable loop",
  "tables": [
    {{
      "name": "Items",
      "display_name": "Items",
      "purpose": "what this table controls in the game",
      "engine_usage": "how Unity/Godot should use this table at runtime",
      "fields": [
        {{
          "name": "id",
          "type": "string",
          "required": true,
          "default": "",
          "enum": [],
          "reference": "",
          "description": "Unique stable config id."
        }}
      ],
      "rows": [
        {{
          "id": "example_id"
        }}
      ],
      "notes": [
        "implementation or balancing note"
      ]
    }}
  ],
  "export_notes": [
    "Unity / Godot import or runtime-loading note"
  ]
}}

Quantity requirements:
- Generate at least 6 tables.
- Generate at least 4 fields per table.
- Generate at least 3 practical rows per table.
- Include references between related tables when useful.
""".strip()
