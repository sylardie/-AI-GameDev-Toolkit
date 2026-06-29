# AI Audio Pipeline Design

Date: 2026-06-29

## Goal

Add an AI audio pipeline to the existing Audio Tools area. The pipeline lets users generate game music and sound effects through either a custom audio generation API or local ComfyUI workflows, then preview and download the generated assets locally.

This feature extends the current local audio clipping/export workflow. It does not replace the existing upload, trim, normalization, WAV/OGG/MP3 export, or ZIP packaging behavior.

## Scope

Included in the MVP:

- Add a second workspace tab inside the existing Audio Tools page: local processing and AI generation.
- Support two generated asset types: music and sound effects.
- Support two generation engines: custom audio API and ComfyUI.
- Add backend-only settings for a custom audio generation provider.
- Extend ComfyUI settings with two audio workflow profiles: music and SFX.
- Save generated files, metadata, and ZIP packages under the app-owned audio output folder.
- Keep API keys and workflow configuration out of frontend code.

Excluded from the MVP:

- Batch generation.
- Asset library management.
- Version comparison.
- Automatic writes into Unity, Godot, or other external project folders.
- Long-running background job queues.

## User Experience

The current `/audio` page gains tabs:

- Local Processing: existing upload, preview, trim, normalize, and export tools.
- AI Generation: new controls for generating music and sound effects.

The AI Generation tab contains:

- Asset type segmented control: Music / SFX.
- Engine selector: Custom Audio API / ComfyUI.
- Prompt field.
- Optional production fields: duration, loopable, style or mood, and in-game usage scene.
- Generate button.
- Result panel with browser audio preview, output summary, audio download, metadata download, and ZIP download.

The page should make it clear whether an engine is unavailable because its settings are disabled or incomplete. Error messages should name the missing configuration instead of failing with a generic generation error.

## Settings

Settings adds an Audio Provider area:

- enabled
- provider: custom
- base URL
- model
- API key
- timeout
- connection test button

The API key follows the same local backend storage pattern used by existing LLM and image provider settings. The frontend receives only configured/preview state, not plaintext credentials.

Settings also extends ComfyUI configuration with audio workflow profiles. Each profile is independent because music and SFX workflows often use different node graphs and input names.

Each audio workflow profile stores:

- enabled
- workflow JSON exported in ComfyUI API format
- prompt node ID and prompt input name
- optional negative prompt node ID and input name
- optional seed node ID and input name
- optional duration node ID and input name
- expected output kind: audio file or generic file

The two built-in profile slots are:

- music
- sfx

The design avoids hardcoding the user's specific workflow node IDs. Users map the fields in Settings, and the backend validates that the mapped nodes and input names exist before submitting the workflow.

## Backend API

Extend the existing `/api/audio` router.

### `POST /api/audio/generate`

Request fields:

- engine: `custom_api` or `comfyui`
- kind: `music` or `sfx`
- prompt
- duration
- loopable
- style
- scene
- output_format preference where applicable

Response fields:

- output_id
- audio_path
- metadata_path
- zip_path
- duration
- sample_rate when known
- format when known
- engine
- kind

Generated outputs are written to:

```text
backend/app/data/outputs/audio/generated/<output_id>/
```

When the app uses a packaged or custom data directory, this resolves through the existing `OUTPUTS_DIR` setting rather than a hardcoded absolute path.

### `POST /api/settings/audio-provider/test`

Tests that the custom audio API settings are enabled and reachable. The test should avoid generating a real paid asset when possible. If the provider does not expose a lightweight status endpoint, the test should make the smallest supported request and return a clear warning in the message.

## Custom Audio API Contract

The MVP supports a simple JSON request to the configured base URL:

```json
{
  "model": "configured-model",
  "prompt": "Generate a short UI click sound.",
  "duration": 3,
  "loopable": false,
  "kind": "sfx",
  "style": "clean sci-fi",
  "scene": "inventory UI"
}
```

The response parser accepts common direct-generation formats:

- `audio_url`: backend downloads the generated audio.
- `audio_base64`: backend decodes and stores the generated audio.
- binary audio response: backend stores the response body directly.

The backend records the original response mode in metadata. If the provider returns a shape that cannot be interpreted, the error should include the unsupported response keys.

## ComfyUI Flow

For ComfyUI generation:

1. Load the selected audio workflow profile by `kind`.
2. Deep-copy the stored API-format workflow.
3. Apply prompt, optional negative prompt, optional seed, and optional duration to the mapped node inputs.
4. Submit the workflow to ComfyUI.
5. Poll history until complete or timeout.
6. Collect audio or generic file outputs from history.
7. Download the first supported generated file into the audio generated output folder.
8. Save metadata and ZIP package.

The existing ComfyUI client already supports submit, history polling, and image download. This feature should extend that client or add focused audio helpers without breaking the image path used by Art Pipeline.

## Data And Safety

All generated assets stay inside the app's output directory. The feature must not write into external Unity/Godot folders.

Metadata should include:

- output ID
- engine
- kind
- prompt
- duration
- loopable
- style
- scene
- provider/model or ComfyUI profile
- source response mode
- generated file name
- created timestamp

Generated audio outputs and traces must not be committed to git.

## Error Handling

Expected error cases:

- Audio provider disabled.
- Audio provider API key missing.
- Audio provider base URL missing.
- Custom API request failed.
- Custom API response did not contain an audio file, URL, or base64 payload.
- ComfyUI disabled.
- ComfyUI workflow profile disabled or missing.
- ComfyUI workflow JSON is UI format rather than API format.
- Mapped ComfyUI node or input name is missing.
- ComfyUI generation timed out.
- ComfyUI history did not contain a downloadable audio output.

Errors should be returned as user-readable messages and displayed in the AI Generation tab.

## Frontend Components

Keep the page structure close to the current local audio page. If the page grows too large, split focused components from `AudioToolsPage.jsx`:

- local processing panel
- AI generation form
- generated audio result panel

Reuse existing controls where possible:

- `PageTabs`
- `WorkspaceHeader`
- `AuthenticatedAudio`
- file download helper

The UI should remain bilingual through `frontend/src/i18n/translations.js`.

## Validation Plan

Backend:

- Import the FastAPI app without errors.
- Verify `/api/settings` still loads old settings files by applying default values for newly added fields.
- Verify audio provider settings save without exposing plaintext API keys in public settings.
- Add focused tests for custom audio response parsing: URL, base64, and binary response modes.
- Add focused tests for ComfyUI workflow profile validation and node input replacement.

Frontend:

- Run lint and production build.
- Verify the existing local processing tab still behaves as before.
- Verify the AI Generation tab shows disabled-state guidance when settings are missing.
- Verify a mocked successful generation can render audio preview and download buttons.

Manual:

- Test the custom API path with the user's configured provider.
- Test the ComfyUI music workflow.
- Test the ComfyUI SFX workflow.

## Implementation Order

1. Extend settings schemas, storage, public settings, and settings API tests for audio provider and audio workflow profiles.
2. Add backend generation schemas and custom audio provider client.
3. Add ComfyUI audio workflow builder and output collection helpers.
4. Extend `/api/audio` with the generate endpoint.
5. Add frontend API methods and Settings controls.
6. Add AI Generation tab to Audio Tools.
7. Add bilingual text and focused styling.
8. Run backend and frontend validation.

