# AI GameDev Toolkit

AI GameDev Toolkit is a local web-based workflow platform for game developers.

The MVP is being narrowed toward practical Godot / Unity game-development agent workflows:

* Config Generator: generate structured Unity / Godot configuration table packages with a configured LLM and export JSON / Excel / Godot `.tres` resources.
* Config Manager: scan local Excel configuration folders, inspect workbooks / sheets, and report basic table issues.
* Code Agent: inspect local Godot / Unity projects with scanning, preview, search, structure extraction, and error-log analysis.
* Art Pipeline: generate art style specifications, prompt payloads, naming rules, Godot / Unity import guides, optional online images, and reusable style profiles.
* Asset Tools: convert videos into downloadable spritesheet PNG + metadata JSON outputs and remove simple solid-color image backgrounds.
* Audio Tools: locally preview, clip, normalize, and export game audio files.

The app is local-first. API keys can be configured in local backend settings, and the current MVP does not write into external Godot / Unity projects.

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
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8010
```

Frontend:

```bat
cd frontend
npm.cmd run dev
```

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
* OpenAI-compatible online image provider settings for Art Pipeline image generation.
* ComfyUI running locally or on a reachable endpoint.

Config generation requires a configured LLM. ComfyUI remains optional; when it is disabled, Art Pipeline still produces local prompts and workflow payload previews. Online image generation is optional and uses the configured OpenAI-compatible Image Provider when enabled.

Free / low-cost multimodal API notes:

* Gemini API has an official free tier for some models and can be useful for LLM and image-understanding experiments. Check the current limits and data-use terms before relying on it: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/rate-limits
* Hugging Face Inference Providers include small monthly free credits across LLM, vision-language, and image generation tasks. It is useful for experiments, but not a stable default backend for production-sized use: https://huggingface.co/docs/inference-providers/pricing and https://huggingface.co/docs/inference-providers/index
* Pollinations is an open generation platform with text / image / audio / video endpoints, but it has moved toward credits / API key usage, so treat it as an optional experimental provider rather than a guaranteed long-term free backend: https://github.com/pollinations/pollinations

The recommended direction is to keep OpenAI-compatible custom endpoints for image generation, then add concrete Gemini / Hugging Face providers only when the surrounding workflow is stable.

## Current Development Principle

Build the broad product direction first, then refine details and user experience.

All new work should serve concrete game-development outputs: configuration tables, validation reports, project diagnostics, import settings, asset specifications, and structured implementation guidance.
