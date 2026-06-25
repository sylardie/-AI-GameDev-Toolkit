# AI GameDev Toolkit

AI GameDev Toolkit is a local web-based workflow platform for game developers.

> Current release target: **v0.1.0 public preview**. The project is usable, but AI provider behavior and generated game-development output should still be reviewed by a human.

The MVP is being narrowed toward practical Godot / Unity game-development agent workflows:

* Config Generator: generate structured Unity / Godot configuration table packages with a configured LLM and export JSON / Excel / Godot `.tres` resources.
* Config Manager: scan local Excel configuration folders, inspect workbooks / sheets, and report basic table issues.
* Code Agent: inspect local Godot / Unity projects with scanning, preview, search, structure extraction, and error-log analysis.
* Art Pipeline: generate art style specifications, prompt payloads, naming rules, Godot / Unity import guides, optional online images, and reusable style profiles.
* Asset Tools: convert videos into downloadable spritesheet PNG + metadata JSON outputs and remove simple solid-color image backgrounds.
* Audio Tools: locally preview, clip, normalize, and export game audio files.

The app is local-first. API keys can be configured in local backend settings, and the current MVP does not write into external Godot / Unity projects. API keys are stored locally in plain text; read [PRIVACY.md](PRIVACY.md) before use.

The frontend currently supports English and Chinese. Use the language toggle in the top-right corner to switch the UI language.

## Quick Start

On Windows, from the project root:

```bat
scripts\start-dev.cmd
```

This starts:

```text
Backend:  http://127.0.0.1:8010
Frontend: http://127.0.0.1:5173
```

To stop both dev servers:

```bat
scripts\stop-dev.cmd
```

## Manual Start

Backend:

```bat
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8010
```

Frontend:

```bat
cd frontend
npm.cmd run dev
```

## Electron Desktop

Requirements:

* `backend\.venv\Scripts\python.exe` exists and has `backend\requirements.txt` installed.
* Frontend dependencies are installed with `npm.cmd install`.

Start the desktop shell:

```bat
cd frontend
npm.cmd run electron:dev
```

Electron will:

* Start the Vite frontend at `http://127.0.0.1:5173`.
* Reuse an existing healthy backend at `http://127.0.0.1:8010`, or start `backend\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8010`.
* Stop only the backend process it started when the desktop window exits.

The browser workflow still works through `scripts\start-dev.cmd` or the manual backend/frontend commands above.

Build a Windows installer and portable executable:

```bat
cd frontend
npm.cmd run dist:win
```

Build artifacts are written to `frontend/artifacts/`. See [docs/RELEASING.md](docs/RELEASING.md) for the complete release process.

## Main Pages

```text
Dashboard:        http://127.0.0.1:5173/
Config Generator: http://127.0.0.1:5173/design
Config Manager:   http://127.0.0.1:5173/configs
Code Agent:       http://127.0.0.1:5173/code
Art Pipeline:     http://127.0.0.1:5173/art
Asset Tools:      http://127.0.0.1:5173/assets
Audio Tools:      http://127.0.0.1:5173/audio
Settings:         http://127.0.0.1:5173/settings
Backend docs:     http://127.0.0.1:8010/docs
```

## Optional Integrations

Settings supports local configuration for:

* OpenAI-compatible LLM providers such as OpenAI, DeepSeek, Qwen, or a custom endpoint.
* Online image provider settings for Art Pipeline image generation:
  * OpenAI-compatible providers such as OpenAI Images or a custom endpoint.
  * Google Gemini / Gemma entry backed by the Gemini image-generation API.
* ComfyUI running locally or on a reachable endpoint.

Config generation requires a configured LLM. ComfyUI remains optional and requires a user-supplied API-format workflow. Online image generation is optional and uses the configured image provider when enabled.

Reference images are sent to the configured vision model. Use Ollama or another local endpoint if images must stay on the machine.

Free / low-cost multimodal API notes:

* Gemini API has an official free tier for some models and can be useful for LLM and image-understanding experiments. Check the current limits and data-use terms before relying on it: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/rate-limits
* Hugging Face Inference Providers include small monthly free credits across LLM, vision-language, and image generation tasks. It is useful for experiments, but not a stable default backend for production-sized use: https://huggingface.co/docs/inference-providers/pricing and https://huggingface.co/docs/inference-providers/index
* Pollinations is an open generation platform with text / image / audio / video endpoints, but it has moved toward credits / API key usage, so treat it as an optional experimental provider rather than a guaranteed long-term free backend: https://github.com/pollinations/pollinations

The recommended direction is to keep OpenAI-compatible custom endpoints for image generation while adding concrete providers only when the surrounding workflow is stable. Gemini / Gemma is currently supported through the Google Gemini image-generation API; Gemma itself is not treated as a standalone image-generation API.

## Current Development Principle

Build the broad product direction first, then refine details and user experience.

All new work should serve concrete game-development outputs: configuration tables, validation reports, project diagnostics, import settings, asset specifications, and structured implementation guidance.

## Quality checks

```bat
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high

cd ..\backend
.venv\Scripts\python.exe -m pip check
.venv\Scripts\python.exe -m unittest discover -s tests -v
.venv\Scripts\python.exe -m compileall app
```

## Security and contributing

- [Privacy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Release guide](docs/RELEASING.md)

Licensed under the [MIT License](LICENSE).
