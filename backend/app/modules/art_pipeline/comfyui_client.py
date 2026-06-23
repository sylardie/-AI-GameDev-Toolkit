from pathlib import Path
import time
from urllib.parse import urlencode
from uuid import uuid4

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
    payload = {"prompt": workflow, "client_id": uuid4().hex}

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


def wait_for_history(settings: ComfyUISettings, prompt_id: str) -> dict:
    deadline = time.monotonic() + settings.timeout

    while time.monotonic() < deadline:
        history = get_history(settings, prompt_id)
        if history:
            return history
        time.sleep(1)

    raise ComfyUIError(f"ComfyUI generation timed out after {settings.timeout} seconds.")


def get_history(settings: ComfyUISettings, prompt_id: str) -> dict:
    base_url = settings.base_url.rstrip("/")

    try:
        response = requests.get(f"{base_url}/history/{prompt_id}", timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ComfyUIError(f"ComfyUI history request failed: {exc}") from exc

    if response.status_code >= 400:
        raise ComfyUIError(f"ComfyUI returned HTTP {response.status_code}: {response.text}")

    data = response.json()
    prompt_history = data.get(prompt_id)
    return prompt_history if isinstance(prompt_history, dict) else {}


def collect_history_images(history: dict) -> list[dict]:
    images: list[dict] = []
    outputs = history.get("outputs", {})
    if not isinstance(outputs, dict):
        return images

    for output in outputs.values():
        if not isinstance(output, dict):
            continue
        output_images = output.get("images", [])
        if not isinstance(output_images, list):
            continue
        for image in output_images:
            if isinstance(image, dict) and image.get("filename"):
                images.append(image)

    return images


def download_history_images(settings: ComfyUISettings, images: list[dict], output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    downloaded: list[Path] = []

    for index, image in enumerate(images, start=1):
        source_name = str(image.get("filename", "image.png"))
        suffix = Path(source_name).suffix or ".png"
        output_path = output_dir / f"image_{index:02d}{suffix}"
        download_image(settings, image, output_path)
        downloaded.append(output_path)

    return downloaded


def download_image(settings: ComfyUISettings, image: dict, output_path: Path) -> None:
    base_url = settings.base_url.rstrip("/")
    query = urlencode(
        {
            "filename": image.get("filename", ""),
            "subfolder": image.get("subfolder", ""),
            "type": image.get("type", "output"),
        }
    )

    try:
        response = requests.get(f"{base_url}/view?{query}", timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ComfyUIError(f"ComfyUI image download failed: {exc}") from exc

    if response.status_code >= 400:
        raise ComfyUIError(f"ComfyUI image download returned HTTP {response.status_code}: {response.text}")

    output_path.write_bytes(response.content)
