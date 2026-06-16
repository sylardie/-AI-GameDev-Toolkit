from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
OUTPUTS_DIR = DATA_DIR / "outputs"
TRACES_DIR = DATA_DIR / "traces"


# 统一管理后端数据目录。
def ensure_app_dirs() -> None:
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    TRACES_DIR.mkdir(parents=True, exist_ok=True)