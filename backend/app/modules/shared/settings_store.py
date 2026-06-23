import json
from pathlib import Path

from app.core.config import DATA_DIR
from app.schemas.settings import (
    ImageProviderSettings,
    ImageProviderSettingsPublic,
    LLMSettings,
    LLMSettingsPublic,
    LocalSettings,
    LocalSettingsPublic,
    LocalSettingsUpdate,
    SecretState,
)


CONFIG_DIR = DATA_DIR / "config"
SETTINGS_PATH = CONFIG_DIR / "local_settings.json"


def load_settings() -> LocalSettings:
    if not SETTINGS_PATH.exists():
        return LocalSettings()

    with SETTINGS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    image_provider = data.get("image_provider")
    if isinstance(image_provider, dict) and image_provider.get("provider") not in {
        "none",
        "openai",
        "gemini",
        "custom",
    }:
        image_provider["provider"] = "custom"

    return LocalSettings.model_validate(data)


def save_settings(update: LocalSettingsUpdate) -> LocalSettings:
    current = load_settings()
    llm_api_key = update.llm.api_key.strip()
    image_api_key = update.image_provider.api_key.strip()

    if not llm_api_key and update.llm.keep_existing_api_key:
        llm_api_key = current.llm.api_key
    if not image_api_key and update.image_provider.keep_existing_api_key:
        image_api_key = current.image_provider.api_key

    settings = LocalSettings(
        llm=LLMSettings(
            enabled=update.llm.enabled,
            provider=update.llm.provider,
            api_base_url=update.llm.api_base_url.strip().rstrip("/"),
            model=update.llm.model.strip(),
            api_key=llm_api_key,
            timeout=update.llm.timeout,
        ),
        comfyui=update.comfyui,
        image_provider=ImageProviderSettings(
            enabled=update.image_provider.enabled,
            provider=update.image_provider.provider,
            api_base_url=update.image_provider.api_base_url.strip().rstrip("/"),
            model=update.image_provider.model.strip(),
            api_key=image_api_key,
            timeout=update.image_provider.timeout,
        ),
    )

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with SETTINGS_PATH.open("w", encoding="utf-8") as file:
        json.dump(settings.model_dump(), file, ensure_ascii=False, indent=2)

    return settings


def public_settings(settings: LocalSettings | None = None) -> LocalSettingsPublic:
    settings = settings or load_settings()
    return LocalSettingsPublic(
        llm=LLMSettingsPublic(
            enabled=settings.llm.enabled,
            provider=settings.llm.provider,
            api_base_url=settings.llm.api_base_url,
            model=settings.llm.model,
            timeout=settings.llm.timeout,
            api_key=SecretState(
                configured=bool(settings.llm.api_key),
                preview=_secret_preview(settings.llm.api_key),
            ),
        ),
        comfyui=settings.comfyui,
        image_provider=ImageProviderSettingsPublic(
            enabled=settings.image_provider.enabled,
            provider=settings.image_provider.provider,
            api_base_url=settings.image_provider.api_base_url,
            model=settings.image_provider.model,
            timeout=settings.image_provider.timeout,
            api_key=SecretState(
                configured=bool(settings.image_provider.api_key),
                preview=_secret_preview(settings.image_provider.api_key),
            ),
        ),
    )


def _secret_preview(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"
