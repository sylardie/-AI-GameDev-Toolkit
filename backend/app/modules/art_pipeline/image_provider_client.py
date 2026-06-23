import base64
import mimetypes
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import requests

from app.core.config import OUTPUTS_DIR
from app.schemas.art import ArtImageGenerateRequest, GeneratedImageItem
from app.schemas.settings import ImageProviderSettings


class ImageProviderError(Exception):
    pass


def test_image_provider_connection(settings: ImageProviderSettings) -> None:
    _validate_settings(settings)
    url = f"{settings.api_base_url.rstrip('/')}/v1/models"
    headers = {"Authorization": f"Bearer {settings.api_key}"}

    try:
        response = requests.get(url, headers=headers, timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ImageProviderError(f"Image Provider request failed: {exc}") from exc

    if response.status_code >= 400:
        raise ImageProviderError(f"Image Provider API error {response.status_code}: {response.text}")


def generate_images(
    settings: ImageProviderSettings,
    request: ArtImageGenerateRequest,
    style_prompt: str = "",
) -> tuple[str, list[GeneratedImageItem]]:
    _validate_settings(settings)

    output_id = f"art_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"
    output_dir = OUTPUTS_DIR / "art" / output_id
    output_dir.mkdir(parents=True, exist_ok=True)

    prompt = request.prompt.strip()
    if style_prompt:
        prompt = f"{prompt}\n\nStyle specification:\n{style_prompt.strip()}"
    if request.negative_prompt.strip():
        prompt = f"{prompt}\n\nAvoid:\n{request.negative_prompt.strip()}"

    url = f"{settings.api_base_url.rstrip('/')}/v1/images/generations"
    payload = {
        "model": settings.model,
        "prompt": prompt,
        "n": request.count,
        "size": request.size,
    }

    headers = {
        "Authorization": f"Bearer {settings.api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ImageProviderError(f"Image generation request failed: {exc}") from exc

    if response.status_code >= 400:
        raise ImageProviderError(f"Image generation API error {response.status_code}: {response.text}")

    data = response.json()
    image_items = data.get("data", [])
    if not isinstance(image_items, list) or not image_items:
        raise ImageProviderError(f"Image generation response did not contain images: {data}")

    generated: list[GeneratedImageItem] = []
    for index, item in enumerate(image_items, start=1):
        file_name = f"image_{index:02d}.png"
        output_path = output_dir / file_name

        if item.get("b64_json"):
            output_path.write_bytes(base64.b64decode(item["b64_json"]))
        elif item.get("url"):
            _download_image(item["url"], output_path, settings.timeout)
        else:
            raise ImageProviderError(f"Unsupported image item response: {item}")

        generated.append(
            GeneratedImageItem(
                path=f"outputs/art/{output_id}/{file_name}",
                file_name=file_name,
                prompt=prompt,
            )
        )

    return output_id, generated


def image_file_to_data_url(path: Path) -> str:
    media_type = mimetypes.guess_type(path.name)[0] or "image/png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{media_type};base64,{encoded}"


def _download_image(url: str, output_path: Path, timeout: int) -> None:
    try:
        response = requests.get(url, timeout=timeout)
    except requests.RequestException as exc:
        raise ImageProviderError(f"Failed to download generated image: {exc}") from exc

    if response.status_code >= 400:
        raise ImageProviderError(f"Generated image download failed {response.status_code}: {response.text}")

    output_path.write_bytes(response.content)


def _validate_settings(settings: ImageProviderSettings) -> None:
    if not settings.enabled:
        raise ImageProviderError("Image Provider is disabled.")
    if settings.provider not in {"openai", "custom"}:
        raise ImageProviderError("Only OpenAI-compatible image providers are supported in this version.")
    if not settings.api_base_url:
        raise ImageProviderError("Image Provider Base URL is not configured.")
    if not settings.api_key:
        raise ImageProviderError("Image Provider API Key is not configured.")
    if not settings.model:
        raise ImageProviderError("Image Provider model is not configured.")
