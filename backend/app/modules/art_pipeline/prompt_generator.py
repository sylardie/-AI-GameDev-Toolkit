import json

from pydantic import ValidationError

from app.schemas.art import (
    ArtImageAnalysis,
    ArtPromptGenerateRequest,
    ArtPromptGenerateResponse,
    AssetNamingRule,
    ImportGuideStep,
)
from app.modules.art_pipeline.comfyui_workflow import (
    ComfyUIWorkflowError,
    build_basic_txt2img_workflow,
)
from app.modules.shared.llm_client import LLMError, chat_completion_json
from app.modules.shared.settings_store import load_settings


STYLE_TAGS = {
    "pixel_art": ["pixel art", "clean silhouette", "limited palette", "crisp edges", "game sprite"],
    "hand_painted": ["hand-painted", "painterly texture", "soft brushwork", "fantasy game art"],
    "low_poly": ["low poly", "stylized geometry", "clean topology", "game-ready asset"],
    "anime": ["anime style", "expressive shape language", "clean line art", "cel shading"],
    "realistic": ["realistic", "physically based materials", "high detail", "natural lighting"],
    "flat_vector": ["flat vector", "simple shapes", "clean iconography", "high readability"],
}

ASSET_QUALIFIERS = {
    "character": "full body character design, readable pose, clear personality, production-ready turnaround",
    "item": "single game item, clear silhouette, readable material, centered composition",
    "environment": "game environment concept, layered depth, strong focal point, playable space clarity",
    "ui_icon": "game UI icon, centered object, transparent-background friendly, readable at small size",
    "sprite": "2D sprite, animation-ready proportions, clean outline, game asset sheet friendly",
    "tileset": "seamless tileset elements, modular game environment pieces, consistent scale",
    "concept_art": "concept art sheet, visual exploration, mood and design language clarity",
}

NEGATIVE_BASE = [
    "low quality",
    "blurry",
    "messy silhouette",
    "inconsistent perspective",
    "extra limbs",
    "bad anatomy",
    "text artifacts",
    "watermark",
    "logo",
    "cropped subject",
]


def generate_art_prompt(request: ArtPromptGenerateRequest) -> ArtPromptGenerateResponse:
    settings = load_settings()
    if not settings.llm.enabled:
        raise LLMError("LLM is disabled. Configure a local or OpenAI-compatible LLM first.")
    if not settings.llm.api_base_url or not settings.llm.api_key or not settings.llm.model:
        raise LLMError("LLM settings are incomplete.")

    analysis = _generate_english_style_prompt(request, settings.llm)
    style_tags = analysis.palette or STYLE_TAGS[request.style]
    title = _build_title(request)
    title = analysis.title.strip() or _title_from_prompt(analysis.content_prompt, title)
    positive_prompt = _combine_prompts(analysis.content_prompt, analysis.style_spec_prompt)
    negative_prompt = analysis.negative_prompt or ", ".join(_negative_prompt_terms(request))
    comfyui_workflow = {}
    if settings.comfyui.workflow:
        try:
            comfyui_workflow = build_basic_txt2img_workflow(
                request,
                positive_prompt,
                negative_prompt,
                settings.comfyui,
            )
        except ComfyUIWorkflowError:
            comfyui_workflow = {}

    return ArtPromptGenerateResponse(
        title=title,
        asset_type=request.asset_type,
        style=request.style,
        engine_target=request.engine_target,
        content_prompt=analysis.content_prompt,
        style_spec_prompt=analysis.style_spec_prompt,
        positive_prompt=positive_prompt,
        negative_prompt=negative_prompt,
        palette=analysis.palette,
        notes=analysis.notes,
        style_tags=style_tags,
        asset_naming_rules=_naming_rules(request),
        import_guide=_import_guide(request),
        production_notes=_production_notes(request),
        comfyui_workflow=comfyui_workflow,
        comfyui_enabled=settings.comfyui.enabled,
    )


def _generate_english_style_prompt(request: ArtPromptGenerateRequest, llm_settings) -> ArtImageAnalysis:
    raw_content = chat_completion_json(
        _build_llm_system_prompt(),
        _build_llm_user_prompt(request),
        settings=llm_settings,
    )

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Art style LLM returned invalid JSON: {raw_content}") from exc

    try:
        return ArtImageAnalysis(**data)
    except ValidationError as exc:
        raise LLMError(f"Art style LLM JSON does not match the expected schema: {exc}") from exc


def _build_llm_system_prompt() -> str:
    return """
You are a senior game art director for Unity and Godot asset production.
Turn any user language into concise English image-generation prompts.
Return JSON only.
Separate the concrete subject/content from the reusable style specification.
The style specification should be reusable across future assets to keep visual consistency.
Do not include import instructions, naming rules, workflow payloads, markdown, or prose outside JSON.
""".strip()


def _build_llm_user_prompt(request: ArtPromptGenerateRequest) -> str:
    return f"""
Create an English prompt package for a game art asset.

User asset description:
{request.description.strip()}

Asset type: {request.asset_type}
Target visual style: {request.style}
Engine target: {request.engine_target}
Mood: {request.mood.strip() or "not specified"}
Color palette: {request.color_palette.strip() or "not specified"}

Return exactly this JSON shape:
{{
  "content_prompt": "English prompt describing only the specific asset/content requested",
  "title": "short English title for this style prompt package",
  "style_spec_prompt": "English reusable style specification for consistent future assets",
  "negative_prompt": "English comma-separated things to avoid",
  "palette": ["short English color names or #RRGGBB values"],
  "camera_view": "short English view/projection guidance",
  "resolution_advice": "short English export/transparency guidance",
  "naming_advice": "",
  "suitable_asset_types": ["{request.asset_type}"],
  "notes": ["short English production note"]
}}
""".strip()


def _build_title(request: ArtPromptGenerateRequest) -> str:
    asset_label = request.asset_type.replace("_", " ").title()
    style_label = request.style.replace("_", " ").title()
    return f"{style_label} {asset_label} Prompt"


def _build_positive_prompt(request: ArtPromptGenerateRequest, style_tags: list[str]) -> str:
    parts = [
        request.description.strip(),
        ASSET_QUALIFIERS[request.asset_type],
        ", ".join(style_tags),
    ]

    if request.mood.strip():
        parts.append(f"mood: {request.mood.strip()}")

    if request.color_palette.strip():
        parts.append(f"color palette: {request.color_palette.strip()}")

    parts.extend([
        "clear game production intent",
        "consistent scale",
        "readable from gameplay camera",
    ])

    return ", ".join(parts)


def _combine_prompts(content_prompt: str, style_spec_prompt: str) -> str:
    parts = [content_prompt.strip(), style_spec_prompt.strip()]
    return "\n\n".join(part for part in parts if part)


def _title_from_prompt(content_prompt: str, fallback: str) -> str:
    words = [
        word.strip(" ,.;:!?()[]{}\"'")
        for word in content_prompt.strip().split()
        if word.strip(" ,.;:!?()[]{}\"'")
    ]
    if not words:
        return fallback
    return " ".join(words[:8]).title()


def _negative_prompt_terms(request: ArtPromptGenerateRequest) -> list[str]:
    terms = list(NEGATIVE_BASE)

    if request.asset_type in {"ui_icon", "sprite", "item"}:
        terms.extend(["busy background", "unclear outline", "tiny unreadable details"])

    if request.style == "pixel_art":
        terms.extend(["anti-aliased blur", "overly smooth gradients", "photorealistic rendering"])

    if request.style == "low_poly":
        terms.extend(["dense high-poly mesh", "noisy surface details"])

    return terms


def _naming_rules(request: ArtPromptGenerateRequest) -> list[AssetNamingRule]:
    prefix = {
        "character": "chr",
        "item": "itm",
        "environment": "env",
        "ui_icon": "ui",
        "sprite": "spr",
        "tileset": "tile",
        "concept_art": "concept",
    }[request.asset_type]
    style = request.style.replace("_", "")

    return [
        AssetNamingRule(
            category="Source image",
            pattern=f"{prefix}_{style}_{{asset_name}}_src_v###.png",
            example=f"{prefix}_{style}_moon_guardian_src_v001.png",
        ),
        AssetNamingRule(
            category="Engine-ready texture",
            pattern=f"{prefix}_{style}_{{asset_name}}_game_v###.png",
            example=f"{prefix}_{style}_moon_guardian_game_v001.png",
        ),
        AssetNamingRule(
            category="Metadata",
            pattern=f"{prefix}_{style}_{{asset_name}}_meta_v###.json",
            example=f"{prefix}_{style}_moon_guardian_meta_v001.json",
        ),
    ]


def _import_guide(request: ArtPromptGenerateRequest) -> list[ImportGuideStep]:
    if request.engine_target == "godot":
        return [
            ImportGuideStep(title="Import folder", detail="Place files under res://art/generated/ or a matching feature folder."),
            ImportGuideStep(title="Texture settings", detail="For pixel art, disable filtering. For painterly art, keep filtering enabled and verify compression."),
            ImportGuideStep(title="Scene usage", detail="Create Sprite2D, TextureRect, TileSet, or material resources depending on the asset type."),
            ImportGuideStep(title="Naming", detail="Keep source, game-ready, and metadata files together using the generated naming rules."),
        ]

    if request.engine_target == "unity":
        return [
            ImportGuideStep(title="Import folder", detail="Place files under Assets/Art/Generated/ or a feature-specific art folder."),
            ImportGuideStep(title="Texture type", detail="Use Sprite (2D and UI) for sprites and icons. Use Default for material textures."),
            ImportGuideStep(title="Compression", detail="Use point filtering for pixel art. Check max size and compression per target platform."),
            ImportGuideStep(title="Prefab setup", detail="Create a prefab or UI element after import so the asset can be reused consistently."),
        ]

    return [
        ImportGuideStep(title="Organize output", detail="Keep source prompts, generated images, edited files, and engine-ready exports in separate folders."),
        ImportGuideStep(title="Review readability", detail="Check silhouette, value contrast, scale, and gameplay camera readability before engine import."),
        ImportGuideStep(title="Version assets", detail="Use a version suffix and keep metadata beside exported textures."),
    ]


def _production_notes(request: ArtPromptGenerateRequest) -> list[str]:
    notes = [
        "Generate several variations, then pick one direction before polishing.",
        "Validate the asset at real gameplay size, not only in a large preview.",
        "Keep source prompt text with the exported files for reproducibility.",
    ]

    if request.asset_type in {"sprite", "character"}:
        notes.append("Check whether the silhouette still reads after animation or pose changes.")

    if request.asset_type == "ui_icon":
        notes.append("Test icon readability at the smallest UI size used by the game.")

    return notes
