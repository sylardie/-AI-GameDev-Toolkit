import base64
import json
import mimetypes
import random
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from uuid import uuid4

import requests

from app.core.config import OUTPUTS_DIR
from app.modules.art_pipeline.comfyui_client import (
    ComfyUIError,
    submit_workflow,
    wait_for_history,
)
from app.modules.art_pipeline.comfyui_workflow import (
    ComfyUIWorkflowError,
    build_audio_workflow,
)
from app.schemas.audio import AudioGenerateRequest, AudioGenerateResponse
from app.schemas.settings import AudioProviderSettings, ComfyUISettings


class AudioGenerateError(Exception):
    pass


@dataclass
class GeneratedAudioFile:
    path: Path
    response_mode: str


SUPPORTED_AUDIO_SUFFIXES = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"}


def generate_audio(
    request: AudioGenerateRequest,
    audio_settings: AudioProviderSettings,
    comfyui_settings: ComfyUISettings,
) -> AudioGenerateResponse:
    _validate_request(request)
    output_id = f"audio_gen_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"
    output_dir = OUTPUTS_DIR / "audio" / "generated" / output_id
    output_dir.mkdir(parents=True, exist_ok=True)

    if request.engine == "custom_api":
        generated = _generate_custom_api(request, audio_settings, output_dir)
        provider_name = audio_settings.provider
        model = audio_settings.model
    else:
        generated = _generate_comfyui(request, comfyui_settings, output_dir)
        provider_name = "comfyui"
        model = request.kind

    metadata_path = output_dir / "metadata.json"
    zip_path = output_dir / f"{output_id}.zip"
    suffix = generated.path.suffix.lower().lstrip(".") or request.output_format
    metadata = {
        "output_id": output_id,
        "engine": request.engine,
        "kind": request.kind,
        "prompt": request.prompt,
        "negative_prompt": request.negative_prompt,
        "duration": request.duration,
        "loopable": request.loopable,
        "style": request.style,
        "scene": request.scene,
        "provider": provider_name,
        "model": model,
        "response_mode": generated.response_mode,
        "generated_file": generated.path.name,
        "format": suffix,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as package:
        package.write(generated.path, arcname=generated.path.name)
        package.write(metadata_path, arcname="metadata.json")

    return AudioGenerateResponse(
        output_id=output_id,
        audio_path=_output_path(output_id, generated.path.name),
        metadata_path=_output_path(output_id, "metadata.json"),
        zip_path=_output_path(output_id, zip_path.name),
        duration=request.duration,
        format=suffix,
        engine=request.engine,
        kind=request.kind,
    )


def test_audio_provider_connection(settings: AudioProviderSettings) -> None:
    _validate_audio_provider_settings(settings)
    try:
        response = requests.options(settings.api_base_url, timeout=settings.timeout)
    except requests.RequestException as exc:
        raise AudioGenerateError(f"Audio Provider connection failed: {exc}") from exc
    if response.status_code >= 500:
        raise AudioGenerateError(f"Audio Provider returned HTTP {response.status_code}: {response.text}")


def parse_custom_audio_response(
    response: requests.Response,
    output_dir: Path,
    preferred_format: str,
) -> GeneratedAudioFile:
    content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if content_type.startswith("audio/") or content_type == "application/octet-stream":
        suffix = _suffix_from_content_type(content_type, preferred_format)
        output_path = output_dir / f"generated_audio{suffix}"
        output_path.write_bytes(response.content)
        return GeneratedAudioFile(path=output_path, response_mode="binary")

    try:
        data = response.json()
    except ValueError as exc:
        raise AudioGenerateError("Custom audio API response was not audio or JSON.") from exc

    if not isinstance(data, dict):
        raise AudioGenerateError("Custom audio API JSON response must be an object.")

    audio_url = data.get("audio_url") or data.get("url")
    if isinstance(audio_url, str) and audio_url:
        suffix = _suffix_from_url(audio_url, preferred_format)
        output_path = output_dir / f"generated_audio{suffix}"
        _download_audio(audio_url, output_path)
        return GeneratedAudioFile(path=output_path, response_mode="audio_url")

    audio_base64 = data.get("audio_base64") or data.get("base64") or data.get("data")
    if isinstance(audio_base64, str) and audio_base64:
        suffix = _suffix_from_mime(data.get("mime_type"), preferred_format)
        output_path = output_dir / f"generated_audio{suffix}"
        output_path.write_bytes(_decode_base64_audio(audio_base64))
        return GeneratedAudioFile(path=output_path, response_mode="audio_base64")

    raise AudioGenerateError(
        f"Custom audio API response did not contain audio_url, audio_base64, or binary audio. Keys: {', '.join(data.keys())}"
    )


def _generate_custom_api(
    request: AudioGenerateRequest,
    settings: AudioProviderSettings,
    output_dir: Path,
) -> GeneratedAudioFile:
    _validate_audio_provider_settings(settings)
    payload = {
        "model": settings.model,
        "prompt": request.prompt,
        "duration": request.duration,
        "loopable": request.loopable,
        "kind": request.kind,
        "style": request.style,
        "scene": request.scene,
        "output_format": request.output_format,
    }
    headers = {
        "Authorization": f"Bearer {settings.api_key}",
        "Accept": "application/json, audio/*, application/octet-stream",
    }
    try:
        response = requests.post(
            settings.api_base_url,
            json=payload,
            headers=headers,
            timeout=settings.timeout,
        )
    except requests.RequestException as exc:
        raise AudioGenerateError(f"Audio generation request failed: {exc}") from exc

    if response.status_code >= 400:
        raise AudioGenerateError(f"Audio generation API error {response.status_code}: {response.text}")

    return parse_custom_audio_response(response, output_dir, request.output_format)


def _generate_comfyui(
    request: AudioGenerateRequest,
    settings: ComfyUISettings,
    output_dir: Path,
) -> GeneratedAudioFile:
    if not settings.enabled:
        raise AudioGenerateError("ComfyUI is disabled.")

    profile = settings.audio_workflows.get(request.kind)
    if not profile or not profile.enabled:
        raise AudioGenerateError(f"ComfyUI {request.kind} audio workflow is not configured.")

    try:
        workflow = build_audio_workflow(
            profile=profile,
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            duration=request.duration,
            seed=settings.seed if settings.seed >= 0 else random.randint(1, 2_147_483_647),
        )
        prompt_id = submit_workflow(settings, workflow)
        history = wait_for_history(settings, prompt_id)
    except (ComfyUIError, ComfyUIWorkflowError) as exc:
        raise AudioGenerateError(str(exc)) from exc

    output = _first_history_file(history, profile.output_kind)
    if not output:
        raise AudioGenerateError("ComfyUI history did not contain a downloadable audio output.")

    suffix = Path(str(output.get("filename", "audio.wav"))).suffix or f".{request.output_format}"
    output_path = output_dir / f"generated_audio{suffix}"
    _download_comfyui_file(settings, output, output_path)
    return GeneratedAudioFile(path=output_path, response_mode="comfyui")


def _first_history_file(history: dict, output_kind: str) -> dict | None:
    outputs = history.get("outputs", {})
    if not isinstance(outputs, dict):
        return None
    preferred_keys = ["audio", "audios", "files"] if output_kind == "audio" else ["files", "audio", "audios"]
    for output in outputs.values():
        if not isinstance(output, dict):
            continue
        for key in preferred_keys:
            items = output.get(key)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and item.get("filename"):
                        return item
    return None


def _download_comfyui_file(settings: ComfyUISettings, file_info: dict, output_path: Path) -> None:
    base_url = settings.base_url.rstrip("/")
    query = urlencode(
        {
            "filename": file_info.get("filename", ""),
            "subfolder": file_info.get("subfolder", ""),
            "type": file_info.get("type", "output"),
        }
    )
    try:
        response = requests.get(f"{base_url}/view?{query}", timeout=settings.timeout)
    except requests.RequestException as exc:
        raise AudioGenerateError(f"ComfyUI audio download failed: {exc}") from exc
    if response.status_code >= 400:
        raise AudioGenerateError(f"ComfyUI audio download returned HTTP {response.status_code}: {response.text}")
    output_path.write_bytes(response.content)


def _download_audio(url: str, output_path: Path) -> None:
    try:
        response = requests.get(url, timeout=120)
    except requests.RequestException as exc:
        raise AudioGenerateError(f"Failed to download generated audio: {exc}") from exc
    if response.status_code >= 400:
        raise AudioGenerateError(f"Generated audio download failed {response.status_code}: {response.text}")
    output_path.write_bytes(response.content)


def _decode_base64_audio(value: str) -> bytes:
    encoded = value.split(",", 1)[-1] if value.startswith("data:") else value
    try:
        return base64.b64decode(encoded)
    except ValueError as exc:
        raise AudioGenerateError("Custom audio API returned invalid base64 audio.") from exc


def _validate_request(request: AudioGenerateRequest) -> None:
    if not request.prompt.strip():
        raise AudioGenerateError("Prompt is required.")
    if request.duration <= 0 or request.duration > 600:
        raise AudioGenerateError("Duration must be greater than 0 and no more than 600 seconds.")


def _validate_audio_provider_settings(settings: AudioProviderSettings) -> None:
    if not settings.enabled:
        raise AudioGenerateError("Audio Provider is disabled.")
    if not settings.api_base_url:
        raise AudioGenerateError("Audio Provider Base URL is not configured.")
    if not settings.api_key:
        raise AudioGenerateError("Audio Provider API Key is not configured.")
    if not settings.model:
        raise AudioGenerateError("Audio Provider model is not configured.")


def _suffix_from_content_type(content_type: str, fallback: str) -> str:
    if content_type == "application/octet-stream":
        return f".{fallback}"
    guessed = mimetypes.guess_extension(content_type)
    if guessed:
        return guessed
    return f".{fallback}"


def _suffix_from_url(url: str, fallback: str) -> str:
    suffix = Path(url.split("?", 1)[0]).suffix.lower()
    return suffix if suffix in SUPPORTED_AUDIO_SUFFIXES else f".{fallback}"


def _suffix_from_mime(mime_type: Any, fallback: str) -> str:
    if isinstance(mime_type, str):
        return _suffix_from_content_type(mime_type.split(";", 1)[0].strip().lower(), fallback)
    return f".{fallback}"


def _output_path(output_id: str, file_name: str) -> str:
    return f"outputs/audio/generated/{output_id}/{file_name}"
