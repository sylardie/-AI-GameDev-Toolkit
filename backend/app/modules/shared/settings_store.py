import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile

from app.core.config import (
    CONFIG_DIR,
    DEFAULT_DATA_DIR,
    ensure_app_dirs,
    get_data_root,
    set_configured_data_root,
)
from app.modules.shared.credential_crypto import (
    CredentialEncryptionError,
    decrypt_credential,
    encrypt_credential,
    load_settings_key,
)
from app.schemas.settings import (
    AudioProviderSettings,
    AudioProviderSettingsPublic,
    ImageProviderSettings,
    ImageProviderSettingsPublic,
    LLMSettings,
    LLMSettingsPublic,
    LocalSettings,
    LocalSettingsPublic,
    LocalSettingsUpdate,
    SecretState,
    StorageSettings,
)


SETTINGS_PATH = CONFIG_DIR / "local_settings.json"
SECRET_PROVIDER_NAMES = ("llm", "image_provider", "audio_provider")


def load_settings() -> LocalSettings:
    if not SETTINGS_PATH.exists():
        return LocalSettings(storage=StorageSettings(data_root=str(get_data_root())))

    with SETTINGS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    data.setdefault("storage", {})
    if not str(data["storage"].get("data_root", "")).strip():
        data["storage"]["data_root"] = str(get_data_root())

    settings_key = load_settings_key()
    if settings_key:
        migrated = _decrypt_or_migrate_provider_keys(data, settings_key)
        if migrated:
            _write_settings_data(data)
            _verify_secure_settings_file(settings_key)
            for provider_name in SECRET_PROVIDER_NAMES:
                encrypted = data.get(provider_name, {}).get("api_key_encrypted")
                if isinstance(encrypted, dict):
                    data[provider_name]["api_key"] = decrypt_credential(
                        encrypted,
                        settings_key,
                    )
    elif _contains_encrypted_keys(data):
        raise CredentialEncryptionError(
            "Encrypted settings require the Electron secure runtime."
        )

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
    audio_api_key = update.audio_provider.api_key.strip()
    requested_data_root = update.storage.data_root.strip() or str(get_data_root())

    if not llm_api_key and update.llm.keep_existing_api_key:
        llm_api_key = current.llm.api_key
    if not image_api_key and update.image_provider.keep_existing_api_key:
        image_api_key = current.image_provider.api_key
    if not audio_api_key and update.audio_provider.keep_existing_api_key:
        audio_api_key = current.audio_provider.api_key

    if not os.getenv("AI_GAMEDEV_DATA_DIR", "").strip():
        set_configured_data_root(requested_data_root)
        ensure_app_dirs()

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
        audio_provider=AudioProviderSettings(
            enabled=update.audio_provider.enabled,
            provider=update.audio_provider.provider,
            api_base_url=update.audio_provider.api_base_url.strip().rstrip("/"),
            model=update.audio_provider.model.strip(),
            api_key=audio_api_key,
            timeout=update.audio_provider.timeout,
        ),
        storage=StorageSettings(data_root=str(get_data_root())),
    )

    data = settings.model_dump()
    settings_key = load_settings_key()
    if settings_key:
        for provider_name in SECRET_PROVIDER_NAMES:
            _encrypt_provider_key(data[provider_name], settings_key)
    _write_settings_data(data)

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
        audio_provider=AudioProviderSettingsPublic(
            enabled=settings.audio_provider.enabled,
            provider=settings.audio_provider.provider,
            api_base_url=settings.audio_provider.api_base_url,
            model=settings.audio_provider.model,
            timeout=settings.audio_provider.timeout,
            api_key=SecretState(
                configured=bool(settings.audio_provider.api_key),
                preview=_secret_preview(settings.audio_provider.api_key),
            ),
        ),
        storage=StorageSettings(data_root=str(get_data_root())),
        default_data_root=str(DEFAULT_DATA_DIR),
        active_data_root=str(get_data_root()),
        storage_env_override=bool(os.getenv("AI_GAMEDEV_DATA_DIR", "").strip()),
    )


def _secret_preview(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"


def _decrypt_or_migrate_provider_keys(data: dict, settings_key: bytes) -> bool:
    migrated = False
    for provider_name in SECRET_PROVIDER_NAMES:
        provider = data.setdefault(provider_name, {})
        encrypted = provider.get("api_key_encrypted")
        plaintext = str(provider.get("api_key", ""))

        if isinstance(encrypted, dict):
            provider["api_key"] = decrypt_credential(encrypted, settings_key)
            continue

        if plaintext:
            provider["api_key_encrypted"] = encrypt_credential(plaintext, settings_key)
            provider.pop("api_key", None)
            migrated = True
        else:
            provider["api_key"] = ""
    return migrated


def _encrypt_provider_key(provider: dict, settings_key: bytes) -> None:
    plaintext = str(provider.pop("api_key", ""))
    if plaintext:
        provider["api_key_encrypted"] = encrypt_credential(plaintext, settings_key)
    else:
        provider.pop("api_key_encrypted", None)


def _contains_encrypted_keys(data: dict) -> bool:
    return any(
        isinstance(data.get(provider_name), dict)
        and isinstance(data[provider_name].get("api_key_encrypted"), dict)
        for provider_name in SECRET_PROVIDER_NAMES
    )


def _write_settings_data(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=CONFIG_DIR,
            prefix="local_settings.",
            suffix=".tmp",
            delete=False,
        ) as file:
            temporary_path = Path(file.name)
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.flush()
            os.fsync(file.fileno())
        temporary_path.replace(SETTINGS_PATH)
    finally:
        if temporary_path:
            temporary_path.unlink(missing_ok=True)

    try:
        os.chmod(SETTINGS_PATH, 0o600)
    except OSError:
        pass


def _verify_secure_settings_file(settings_key: bytes) -> None:
    with SETTINGS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    for provider_name in SECRET_PROVIDER_NAMES:
        encrypted = data.get(provider_name, {}).get("api_key_encrypted")
        if isinstance(encrypted, dict):
            decrypt_credential(encrypted, settings_key)
