import requests

from app.core.config import (
    LLM_API_BASE_URL,
    LLM_API_KEY,
    LLM_MODEL,
    LLM_TIMEOUT,
)


class LLMError(Exception):
    pass


def chat_completion_json(system_prompt: str, user_prompt: str) -> str:
    """
    Call an OpenAI-compatible chat completions API and return raw text content.

    The model is instructed to return JSON, but JSON parsing is handled outside.
    """
    if not LLM_API_BASE_URL:
        raise LLMError("LLM_API_BASE_URL is not configured.")

    if not LLM_API_KEY:
        raise LLMError("LLM_API_KEY is not configured.")

    url = f"{LLM_API_BASE_URL}/v1/chat/completions"

    payload = {
        "model": LLM_MODEL,
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
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=LLM_TIMEOUT,
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