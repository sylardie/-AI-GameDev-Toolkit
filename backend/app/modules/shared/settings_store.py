import json
from pathlib import Path

from app.core.config import DATA_DIR
from app.schemas.settings import (
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
        return LocalSettings.model_validate(json.load(file))


def save_settings(update: LocalSettingsUpdate) -> LocalSettings:
    current = load_settings()
    api_key = update.llm.api_key.strip()

    if not api_key and update.llm.keep_existing_api_key:
        api_key = current.llm.api_key

    settings = LocalSettings(
        llm=LLMSettings(
            enabled=update.llm.enabled,
            provider=update.llm.provider,
            api_base_url=update.llm.api_base_url.strip().rstrip("/"),
            model=update.llm.model.strip(),
            api_key=api_key,
            timeout=update.llm.timeout,
        ),
        comfyui=update.comfyui,
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
    )


def _secret_preview(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"
