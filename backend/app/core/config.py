import os
import json
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = BASE_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

DEFAULT_DATA_DIR = Path(
    os.getenv("AI_GAMEDEV_DEFAULT_DATA_DIR", str(BASE_DIR / "data"))
).expanduser().resolve()
BOOTSTRAP_CONFIG_DIR = DEFAULT_DATA_DIR / "config"
STORAGE_SETTINGS_PATH = BOOTSTRAP_CONFIG_DIR / "storage_settings.json"


def _resolve_data_root() -> Path:
    env_path = os.getenv("AI_GAMEDEV_DATA_DIR", "").strip()
    if env_path:
        return Path(env_path).expanduser().resolve()

    if STORAGE_SETTINGS_PATH.exists():
        try:
            with STORAGE_SETTINGS_PATH.open("r", encoding="utf-8") as file:
                data = json.load(file)
            configured = str(data.get("data_root", "")).strip()
            if configured:
                return Path(configured).expanduser().resolve()
        except (OSError, json.JSONDecodeError):
            pass

    return DEFAULT_DATA_DIR


def get_data_root() -> Path:
    return _resolve_data_root()


def set_configured_data_root(data_root: str) -> Path:
    target = Path(data_root).expanduser().resolve()
    BOOTSTRAP_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with STORAGE_SETTINGS_PATH.open("w", encoding="utf-8") as file:
        json.dump({"data_root": str(target)}, file, ensure_ascii=False, indent=2)
    return target


class DynamicDataPath:
    def __init__(self, *parts: str):
        self.parts = parts

    def resolve(self) -> Path:
        path = get_data_root()
        for part in self.parts:
            path = path / part
        return path.resolve()

    def __truediv__(self, value: str | Path) -> "DynamicDataPath":
        return DynamicDataPath(*self.parts, str(value))

    def __fspath__(self) -> str:
        return str(self.resolve())

    def __str__(self) -> str:
        return str(self.resolve())

    def __repr__(self) -> str:
        return repr(self.resolve())

    def __getattr__(self, name: str):
        return getattr(self.resolve(), name)


DATA_DIR = DynamicDataPath()
OUTPUTS_DIR = DynamicDataPath("outputs")
TRACES_DIR = DynamicDataPath("traces")
CONFIG_DIR = DynamicDataPath("config")
PROMPTS_DIR = DynamicDataPath("prompts")


LLM_ENABLED = os.getenv("LLM_ENABLED", "false").lower() == "true"
LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "60"))


def ensure_app_dirs() -> None:
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    TRACES_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
