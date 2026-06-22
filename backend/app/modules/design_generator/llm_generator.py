import json

from pydantic import ValidationError

from app.modules.design_generator.template_loader import load_template
from app.modules.shared.llm_client import chat_completion_json
from app.schemas.design import DesignData
from app.schemas.settings import LLMSettings


def generate_design_with_llm(
    idea: str,
    template_id: str,
    settings: LLMSettings | None = None,
) -> DesignData:
    template = load_template(template_id)

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(idea, template)

    raw_content = chat_completion_json(system_prompt, user_prompt, settings=settings)

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON: {raw_content}") from exc

    try:
        return DesignData(**data)
    except ValidationError as exc:
        raise ValueError(f"LLM JSON does not match DesignData schema: {exc}") from exc


def build_system_prompt() -> str:
    return """
你是一个资深游戏系统策划和 AI 游戏开发工具助手。
你的任务是根据用户的游戏想法，生成结构化的游戏设计数据。

严格要求：
1. 只返回 JSON，不要返回 Markdown，不要解释。
2. JSON 必须完全符合指定字段。
3. 所有字段都必须存在。
4. 不要使用 null 代替数组。
5. id 使用英文小写 snake_case。
6. properties 字段必须是对象。
7. unlocks 字段必须是字符串数组。
8. 内容要尽量通用、可配置、可导出，不要只写一段文案。
""".strip()


def build_user_prompt(idea: str, template) -> str:
    return f"""
请基于以下游戏想法生成一份结构化游戏设计数据。

游戏想法：
{idea}

游戏类型模板：
{template.name}

模板说明：
{template.description}

模板重点：
{", ".join(template.focus)}

生成指引：
{template.prompt_guidance}

请严格返回以下 JSON 结构：

{{
  "title": "游戏标题",
  "template": "{template.id}",
  "genre": ["类型1", "类型2"],
  "target_audience": "目标用户描述",
  "pitch": "一句话概念",
  "core_loop": [
    "核心循环步骤1",
    "核心循环步骤2",
    "核心循环步骤3"
  ],
  "systems": [
    {{
      "id": "system_id",
      "name": "系统名称",
      "category": "core/progression/economy/secondary等",
      "description": "系统描述"
    }}
  ],
  "resources": [
    {{
      "id": "resource_id",
      "name": "资源名称",
      "resource_type": "currency/material/energy/premium等",
      "description": "资源描述"
    }}
  ],
  "items": [
    {{
      "id": "item_id",
      "name": "道具名称",
      "item_type": "equipment/consumable/facility/card等",
      "category": "分类",
      "effect": "效果",
      "properties": {{}}
    }}
  ],
  "entities": [
    {{
      "id": "entity_id",
      "name": "实体名称",
      "entity_type": "character/enemy/card/building/tower/collectible等",
      "category": "分类",
      "rarity": "common/uncommon/rare/epic 或空字符串",
      "description": "实体描述",
      "properties": {{}}
    }}
  ],
  "progression": [
    {{
      "id": "progression_id",
      "name": "成长或解锁名称",
      "progression_type": "level/feature_unlock/skill_unlock/stage等",
      "order": 1,
      "requirement": "解锁条件",
      "unlocks": ["unlock_id_1"],
      "description": "描述"
    }}
  ],
  "tasks": [
    {{
      "id": "task_id",
      "name": "任务名称",
      "task_type": "tutorial/main/daily/challenge等",
      "objective": "目标",
      "reward": "奖励",
      "unlock_condition": "解锁条件"
    }}
  ],
  "levels": [
    {{
      "id": "level_id",
      "name": "关卡、章节或区域名称",
      "level_type": "stage/chapter/area/dungeon/node等",
      "order": 1,
      "goal": "关卡目标",
      "unlock_condition": "解锁条件",
      "description": "描述"
    }}
  ],
  "balance_notes": [
    {{
      "target": "目标模块",
      "note": "平衡性建议"
    }}
  ]
}}

数量要求：
- systems 至少 3 个
- resources 至少 3 个
- items 至少 3 个
- entities 至少 3 个
- progression 至少 3 个
- tasks 至少 3 个
- levels 至少 2 个
- balance_notes 至少 2 个
""".strip()
