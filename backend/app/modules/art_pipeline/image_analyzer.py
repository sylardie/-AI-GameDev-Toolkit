import json
from pathlib import Path

from pydantic import ValidationError

from app.modules.art_pipeline.image_provider_client import image_file_to_data_url
from app.modules.shared.llm_client import LLMError, chat_completion_json_with_image
from app.schemas.art import ArtImageAnalysis
from app.schemas.settings import LLMSettings


def analyze_image_style(image_path: Path, settings: LLMSettings) -> ArtImageAnalysis:
    image_data_url = image_file_to_data_url(image_path)
    raw_content = chat_completion_json_with_image(
        build_system_prompt(),
        build_user_prompt(),
        image_data_url,
        settings=settings,
    )

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Vision LLM returned invalid JSON: {raw_content}") from exc

    try:
        return ArtImageAnalysis(**data)
    except ValidationError as exc:
        raise LLMError(f"Vision LLM JSON does not match ArtImageAnalysis schema: {exc}") from exc


def build_system_prompt() -> str:
    return """
You are a senior game art director for Unity and Godot asset production.
Analyze the uploaded reference image and return reusable production prompts and style rules.
Return JSON only.
Focus on practical consistency: style, palette, camera view, line treatment, shape language, material, resolution, transparency, naming, and reusable asset constraints.
""".strip()


def build_user_prompt() -> str:
    return """
Analyze this image for an indie game asset pipeline.

Return this JSON shape:
{
  "content_prompt": "what is depicted in the image, written as a reusable image generation prompt",
  "style_spec_prompt": "the reusable style/spec prompt that should keep future assets consistent",
  "negative_prompt": "things to avoid for this style",
  "palette": ["#RRGGBB or color name"],
  "camera_view": "view angle / perspective / projection",
  "resolution_advice": "recommended export size and transparency advice",
  "naming_advice": "asset naming pattern advice",
  "suitable_asset_types": ["character", "item", "ui_icon"],
  "notes": ["short production notes"]
}
""".strip()
