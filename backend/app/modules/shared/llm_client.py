from urllib.parse import urlparse

import requests

from app.core.config import (
    LLM_API_BASE_URL,
    LLM_API_KEY,
    LLM_MODEL,
    LLM_TIMEOUT,
)
from app.schemas.settings import LLMSettings


class LLMError(Exception):
    pass


def chat_completion_json(
    system_prompt: str,
    user_prompt: str,
    settings: LLMSettings | None = None,
) -> str:
    """
    Call an OpenAI-compatible chat completions API and return raw text content.

    The model is instructed to return JSON, but JSON parsing is handled outside.
    """
    api_base_url = (settings.api_base_url if settings else LLM_API_BASE_URL).rstrip("/")
    api_key = settings.api_key if settings else LLM_API_KEY
    model = settings.model if settings else LLM_MODEL
    timeout = settings.timeout if settings else LLM_TIMEOUT

    if not api_base_url:
        raise LLMError("LLM_API_BASE_URL is not configured.")

    if not api_key:
        raise LLMError("LLM_API_KEY is not configured.")

    url = _build_chat_completions_url(api_base_url)

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise LLMError(f"LLM request failed: {exc}") from exc

    if response.status_code >= 400:
        raise LLMError(f"LLM API error {response.status_code}: {response.text}")

    data = response.json()

    try:
        return _normalize_json_content(data["choices"][0]["message"]["content"])
    except Exception as exc:
        raise LLMError(f"Invalid LLM response format: {data}") from exc


def chat_completion_json_with_image(
    system_prompt: str,
    user_prompt: str,
    image_data_url: str,
    settings: LLMSettings | None = None,
) -> str:
    api_base_url = (settings.api_base_url if settings else LLM_API_BASE_URL).rstrip("/")
    api_key = settings.api_key if settings else LLM_API_KEY
    model = settings.model if settings else LLM_MODEL
    timeout = settings.timeout if settings else LLM_TIMEOUT

    if not api_base_url:
        raise LLMError("LLM_API_BASE_URL is not configured.")

    if not api_key:
        raise LLMError("LLM_API_KEY is not configured.")

    if _is_local_ollama(api_base_url):
        return _ollama_chat_completion_json_with_image(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_data_url=image_data_url,
            api_base_url=api_base_url,
            model=model,
            timeout=timeout,
        )

    url = _build_chat_completions_url(api_base_url)
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            },
        ],
        "temperature": 0.4,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
    except requests.RequestException as exc:
        raise LLMError(f"Vision LLM request failed: {exc}") from exc

    if response.status_code >= 400:
        raise LLMError(
            f"Vision LLM API error {response.status_code}: {response.text}. "
            "Make sure the configured model supports image input."
        )

    data = response.json()

    try:
        return _normalize_json_content(data["choices"][0]["message"]["content"])
    except Exception as exc:
        raise LLMError(f"Invalid vision LLM response format: {data}") from exc


def _ollama_chat_completion_json_with_image(
    system_prompt: str,
    user_prompt: str,
    image_data_url: str,
    api_base_url: str,
    model: str,
    timeout: int,
) -> str:
    image_base64 = image_data_url.split(",", 1)[-1]
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": user_prompt,
                "images": [image_base64],
            },
        ],
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.4},
    }

    try:
        response = requests.post(
            f"{api_base_url}/api/chat",
            json=payload,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise LLMError(f"Ollama vision request failed: {exc}") from exc

    if response.status_code >= 400:
        raise LLMError(
            f"Ollama vision API error {response.status_code}: {response.text}. "
            "Make sure the configured Ollama model supports vision."
        )

    data = response.json()
    try:
        return _normalize_json_content(data["message"]["content"])
    except Exception as exc:
        raise LLMError(f"Invalid Ollama vision response format: {data}") from exc


def _is_local_ollama(api_base_url: str) -> bool:
    parsed = urlparse(api_base_url)
    return parsed.hostname in {"127.0.0.1", "localhost", "::1"} and parsed.port == 11434


def _build_chat_completions_url(api_base_url: str) -> str:
    base_url = api_base_url.strip().rstrip("/")
    parsed = urlparse(base_url)
    path_segments = [segment for segment in parsed.path.split("/") if segment]
    endpoint = "chat/completions" if path_segments and path_segments[-1] == "v1" else "v1/chat/completions"
    return f"{base_url}/{endpoint}"


def _normalize_json_content(content: str) -> str:
    value = content.strip()
    if value.startswith("```") and value.endswith("```"):
        value = value[3:-3].strip()
        if value.lower().startswith("json"):
            value = value[4:].lstrip()
    return value
