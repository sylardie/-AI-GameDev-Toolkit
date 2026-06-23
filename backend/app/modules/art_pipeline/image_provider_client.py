import base64
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests

from app.core.config import OUTPUTS_DIR
from app.schemas.art import ArtImageGenerateRequest, GeneratedImageItem
from app.schemas.settings import ImageProviderSettings


class ImageProviderError(Exception):
    pass


GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com"


def test_image_provider_connection(settings: ImageProviderSettings) -> None:
    _validate_settings(settings)

    if settings.provider == "gemini":
        _test_gemini_connection(settings)
        return

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

    if settings.provider == "gemini":
        return _generate_gemini_images(settings, request, prompt, output_id, output_dir)

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


def _test_gemini_connection(settings: ImageProviderSettings) -> None:
    url = f"{_provider_base_url(settings)}/v1beta/models"
    headers = {"x-goog-api-key": settings.api_key}

    try:
        response = requests.get(url, headers=headers, timeout=settings.timeout)
    except requests.RequestException as exc:
        raise ImageProviderError(f"Gemini image provider request failed: {exc}") from exc

    if response.status_code >= 400:
        raise ImageProviderError(f"Gemini image provider API error {response.status_code}: {response.text}")


def _generate_gemini_images(
    settings: ImageProviderSettings,
    request: ArtImageGenerateRequest,
    prompt: str,
    output_id: str,
    output_dir: Path,
) -> tuple[str, list[GeneratedImageItem]]:
    url = f"{_provider_base_url(settings)}/v1beta/interactions"
    headers = {
        "x-goog-api-key": settings.api_key,
        "Content-Type": "application/json",
    }
    generated: list[GeneratedImageItem] = []
    aspect_ratio = _size_to_aspect_ratio(request.size)

    for index in range(1, request.count + 1):
        payload: dict[str, Any] = {
            "model": settings.model,
            "input": [{"type": "text", "text": prompt}],
            "response_format": {
                "type": "image",
                "mime_type": "image/png",
                "aspect_ratio": aspect_ratio,
            },
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=settings.timeout)
        except requests.RequestException as exc:
            raise ImageProviderError(f"Gemini image generation request failed: {exc}") from exc

        if response.status_code >= 400:
            raise ImageProviderError(f"Gemini image generation API error {response.status_code}: {response.text}")

        image_bytes = _extract_gemini_image_bytes(response.json())
        file_name = f"image_{index:02d}.png"
        output_path = output_dir / file_name
        output_path.write_bytes(image_bytes)
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
    if settings.provider not in {"openai", "gemini", "custom"}:
        raise ImageProviderError("Unsupported Image Provider.")
    if settings.provider != "gemini" and not settings.api_base_url:
        raise ImageProviderError("Image Provider Base URL is not configured.")
    if not settings.api_key:
        raise ImageProviderError("Image Provider API Key is not configured.")
    if not settings.model:
        raise ImageProviderError("Image Provider model is not configured.")


def _provider_base_url(settings: ImageProviderSettings) -> str:
    if settings.api_base_url:
        return settings.api_base_url.rstrip("/")
    if settings.provider == "gemini":
        return GEMINI_DEFAULT_BASE_URL
    return settings.api_base_url.rstrip("/")


def _size_to_aspect_ratio(size: str) -> str:
    try:
        width_text, height_text = size.lower().split("x", maxsplit=1)
        width = int(width_text)
        height = int(height_text)
    except (ValueError, AttributeError):
        return "1:1"

    if width == height:
        return "1:1"
    if width > height:
        return "16:9" if width / height > 1.4 else "4:3"
    return "9:16" if height / width > 1.4 else "3:4"


def _extract_gemini_image_bytes(payload: Any) -> bytes:
    for encoded in _find_base64_images(payload):
        try:
            return base64.b64decode(encoded)
        except (ValueError, TypeError):
            continue
    raise ImageProviderError(f"Gemini image generation response did not contain image data: {payload}")


def _find_base64_images(value: Any) -> list[str]:
    found: list[str] = []
    if isinstance(value, list):
        for item in value:
            found.extend(_find_base64_images(item))
        return found

    if not isinstance(value, dict):
        return found

    mime_type = (
        value.get("mime_type")
        or value.get("mimeType")
        or value.get("media_type")
        or value.get("mediaType")
        or ""
    )
    item_type = value.get("type") or ""

    if ("image" in str(mime_type).lower() or item_type == "image") and isinstance(value.get("data"), str):
        found.append(value["data"])

    output_image = value.get("output_image") or value.get("outputImage")
    if isinstance(output_image, dict):
        found.extend(_find_base64_images(output_image))

    inline_data = value.get("inlineData") or value.get("inline_data")
    if isinstance(inline_data, dict):
        found.extend(_find_base64_images(inline_data))

    for child in value.values():
        if isinstance(child, (dict, list)):
            found.extend(_find_base64_images(child))

    return found
