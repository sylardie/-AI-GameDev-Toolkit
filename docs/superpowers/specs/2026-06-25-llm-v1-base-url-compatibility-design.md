# LLM `/v1` Base URL Compatibility Design

## Problem

The shared LLM client always appends `/v1/chat/completions` to the configured
Base URL. If a user enters an OpenAI-compatible Base URL that already ends in
`/v1`, the generated endpoint contains `/v1/v1/chat/completions` and the
request fails.

## Scope

Change only the shared LLM chat-completions endpoint construction. The setting
value remains unchanged so the application preserves the user's configured
URL. Image-provider endpoint handling and Ollama's `/api/chat` endpoint are
outside this change.

## Design

Add a small endpoint builder in `backend/app/modules/shared/llm_client.py`.
It will trim whitespace and trailing slashes, inspect the final URL path
segment, and:

- append `/chat/completions` when the path already ends in `/v1`;
- otherwise append `/v1/chat/completions`.

Both text and vision OpenAI-compatible chat requests will use this builder.
Ollama detection and request construction remain unchanged.

Examples:

| Configured Base URL | Request endpoint |
| --- | --- |
| `https://example.com` | `https://example.com/v1/chat/completions` |
| `https://example.com/` | `https://example.com/v1/chat/completions` |
| `https://example.com/v1` | `https://example.com/v1/chat/completions` |
| `https://example.com/v1/` | `https://example.com/v1/chat/completions` |
| `https://example.com/proxy` | `https://example.com/proxy/v1/chat/completions` |

Only a terminal path segment exactly equal to `v1` is treated as the API
version. Paths such as `/proxy-v1` retain the existing append behavior.

## Error Handling

Existing validation and request errors remain unchanged. The builder will not
perform network calls or silently retry malformed endpoints.

## Testing

Add unit tests for root URLs, trailing slashes, existing `/v1`, proxy paths,
and paths whose names merely end with the characters `v1`. Run the backend
unit test suite and an import/compile check before completion.
