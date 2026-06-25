# LLM Response Format Compatibility Design

## Problem

The shared OpenAI-compatible LLM client sends
`response_format: {"type": "json_object"}` for every text and vision request.
The configured provider rejects that value and only accepts `json_schema` or
`text`, causing requests to fail before generation.

## Scope

Change only the shared OpenAI-compatible chat request payloads. Existing
prompts, JSON cleanup, JSON parsing, Pydantic validation, URL construction,
Ollama handling, and provider settings remain unchanged.

## Design

Remove the `response_format` field from both shared chat-completions payloads:

- `chat_completion_json`
- `chat_completion_json_with_image`

The application will continue requesting JSON through its system and user
prompts. Returned content will still pass through `_normalize_json_content`,
then each consumer will parse JSON and validate it against its existing
Pydantic schema.

This approach is preferred over sending `text` because omitting the optional
field works with a broader range of OpenAI-compatible services. It is preferred
over `json_schema` because the shared client serves several response models and
does not currently receive a schema from callers.

## Error Handling

Existing errors remain unchanged:

- transport and HTTP failures become `LLMError`;
- malformed response envelopes become `LLMError`;
- invalid generated JSON is rejected by the calling module;
- structurally invalid JSON is rejected by existing Pydantic validation.

No automatic retry with alternate response formats will be added.

## Testing

Mock the shared client's HTTP request and verify that:

- text chat payloads omit `response_format`;
- vision chat payloads omit `response_format`;
- the existing response normalization and URL compatibility tests continue to
  pass.

Run the complete backend unit test suite and Python compile check.
