# AI GameDev Toolkit

AI GameDev Toolkit is a local web-based workflow platform for game developers.

The MVP covers practical local workflows:

* Design Generator: generate structured GDD data with a configured LLM and export JSON / Markdown / Excel.
* Code Agent: inspect local Godot / Unity projects with scanning, preview, search, structure extraction, and error-log analysis.
* Art Pipeline: generate art prompts, ComfyUI workflow payloads, style tags, naming rules, and Godot / Unity import guides.
* Asset Tools: convert videos into downloadable spritesheet PNG + metadata JSON outputs.

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
Design Generator: http://127.0.0.1:5173/design
Code Agent:       http://127.0.0.1:5173/code
Art Pipeline:     http://127.0.0.1:5173/art
Asset Tools:      http://127.0.0.1:5173/assets
Settings:         http://127.0.0.1:5173/settings
Backend docs:     http://127.0.0.1:8010/docs
```

## Optional Integrations

Settings supports local configuration for:

* OpenAI-compatible LLM providers such as OpenAI, DeepSeek, Qwen, or a custom endpoint.
* ComfyUI running locally or on a reachable endpoint.

Design generation requires a configured LLM. ComfyUI remains optional; when it is disabled, Art Pipeline still produces local prompts and workflow payload previews.

## Current Development Principle

Build the broad product direction first, then refine details and user experience.

The current broad MVP now has usable coverage for Design Generator, Code Agent, Art Pipeline, configurable integrations, and Asset Tools. The next pass should deepen practical workflows before visual polish.
