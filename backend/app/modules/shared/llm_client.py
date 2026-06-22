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

    url = f"{api_base_url}/v1/chat/completions"

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
        "response_format": {
            "type": "json_object",
        },
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
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        raise LLMError(f"Invalid LLM response format: {data}") from exc
