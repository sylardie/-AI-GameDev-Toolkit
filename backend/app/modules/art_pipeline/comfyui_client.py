import requests

from app.schemas.settings import ComfyUISettings


class ComfyUIError(Exception):
    pass


def test_comfyui_connection(settings: ComfyUISettings) -> dict:
    base_url = settings.base_url.rstrip("/")
    try:
        response = requests.get(f"{base_url}/system_stats", timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ComfyUIError(f"ComfyUI connection failed: {exc}") from exc

    if response.status_code >= 400:
        raise ComfyUIError(f"ComfyUI returned HTTP {response.status_code}: {response.text}")

    return response.json()


def submit_workflow(settings: ComfyUISettings, workflow: dict) -> str:
    base_url = settings.base_url.rstrip("/")
    payload = {"prompt": workflow}

    try:
        response = requests.post(f"{base_url}/prompt", json=payload, timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ComfyUIError(f"ComfyUI prompt submission failed: {exc}") from exc

    if response.status_code >= 400:
        raise ComfyUIError(f"ComfyUI returned HTTP {response.status_code}: {response.text}")

    data = response.json()
    prompt_id = data.get("prompt_id")
    if not prompt_id:
        raise ComfyUIError(f"ComfyUI response did not include prompt_id: {data}")

    return prompt_id
