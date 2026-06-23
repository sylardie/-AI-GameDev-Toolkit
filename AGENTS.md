# AGENTS.md

## Project Name

AI GameDev Toolkit

## Project Goal

This project is a local web-based AI toolkit for game developers. It aims to support practical workflows:

1. Config Generator: generate Unity / Godot friendly configuration table proposals, JSON, and Excel configuration files.
2. Config Manager: scan and diagnose local Excel configuration folders.
3. Code Agent: scan and understand Godot / Unity projects, support code search, error analysis, and implementation suggestions.
4. Art Pipeline: generate game art style specifications, ComfyUI workflow payloads, asset naming rules, and Godot / Unity import guides.
5. Asset Tools and Audio Tools: convert, inspect, and package common game assets locally without writing into external projects.

This is a portfolio-quality AI application engineering project. The goal is not to build a generic chatbot, but to build a practical AI workflow platform for game development.

## Tech Stack

Frontend:

* React
* Vite
* React Router
* Native CSS

Backend:

* Python
* FastAPI
* Pydantic
* openpyxl
* requests
* python-dotenv

Current storage:

* Local JSON / Markdown / Excel output files
* Local trace JSON files

## Project Structure

```text
backend/
  app/
    main.py
    core/
      config.py
    api/
      design.py
      configs.py
      code.py
      art.py
      audio.py
      files.py
    schemas/
      design.py
      configs.py
      code.py
      art.py
      audio.py
    modules/
      design_generator/
      config_manager/
      code_agent/
      art_pipeline/
      shared/
    data/
      outputs/
      traces/

frontend/
  src/
    api/
    components/
    pages/
    styles/

docs/
```

## Current Module Status

### Config Generator

Already implemented:

* Game idea input
* Schema-first configuration table generation
* Real LLM generation through local settings or backend environment configuration
* JSON export
* Excel export
* Godot `.tres` resource ZIP export
* File download API
* Trace logging foundation

Current direction:

* Make Unity / Godot configuration tables the primary output.
* Prefer structured table schemas and engine-ready exports over long-form GDD prose.

### Config Manager

MVP implemented:

* Input a local Excel configuration folder path
* Read-only recursive `.xlsx` scan
* Ignore Excel temp files such as `~$*.xlsx`
* Return workbook list, sheet list, row/column counts, headers, and diagnostics
* Detect empty sheets, missing `id`, blank headers, and duplicate headers
* Display scan summary, workbook list, sheet tabs, headers, and diagnostics in frontend
* Do not modify Excel files

### Code Agent

Implemented through v0.5.

Implemented:

* Input a local Godot / Unity project path
* Detect project type
* Scan project files
* Classify scripts, scenes, resources, configs, and others
* Display summary and file list in frontend
* Preview selected text files safely
* Search project text files
* Extract basic `.gd` / `.cs` script structure
* Analyze pasted Godot / Unity error logs
* Do not modify project files

### Art Pipeline

MVP implemented.

Implemented:

* Prompt generation
* Negative prompt generation
* Style tags
* Asset naming rules
* Godot / Unity import guide
* Optional OpenAI-compatible image generation
* Upload image and analyze reusable content / style prompts through a vision-capable LLM
* Local Art Style Profile storage and reuse

Expected future module:

* ComfyUI workflow payload generation
* Optional ComfyUI API integration
* Asset metadata export
* Batch prompt variants

### Asset Tools

Implemented:

* Video to spritesheet
* Time range selection by manual seconds input
* Video and image drag/drop upload
* Frame preview and selected-frame export
* Transparent background cleanup with edge softness
* Single image solid-color background removal
* Spritesheet preview
* Godot / Unity import parameter display

### Audio Tools

MVP implemented:

* Local audio upload with drag/drop
* Browser audio preview
* Start / end seconds clipping
* Optional ffmpeg loudness normalization
* WAV / OGG / MP3 export
* Metadata JSON and ZIP download
* Output only writes to `outputs/audio/`

## Development Rules

1. Do not rewrite the entire project unless explicitly requested.
2. Preserve the current folder structure and coding style.
3. Prefer small, incremental changes.
4. Do not remove existing Design Generator functionality.
5. Do not expose API keys in frontend code.
6. Do not hardcode user-specific absolute paths.
7. Do not allow unsafe arbitrary file download or project file modification.
8. For Code Agent MVP, only read and scan files. Do not write to external game projects.
9. Keep schemas explicit with Pydantic.
10. Add or update docs when completing a phase.
11. Build the broad product direction first, then do detailed polish and experience optimization. Prefer completing the main workflow coverage across Design Generator, Code Agent, and Art Pipeline before spending a long time refining one module.

## Backend Commands

From `backend/`:

```bash
.venv\Scripts\activate
uvicorn app.main:app --port 8010
```

Backend API docs:

```text
http://127.0.0.1:8010/docs
```

## Frontend Commands

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Testing Expectations

Before reporting completion:

1. Backend starts without import errors.
2. Frontend starts without compile errors.
3. Existing Design Generator still works.
4. New APIs appear in FastAPI `/docs`.
5. New frontend page functions can be manually tested.
6. No generated output folder or trace folder should be committed unless explicitly requested.

## Current Recommended Next Task

Continue product convergence toward practical game-development agent workflows:

1. Backend:

   * Make Config Generator schema-first for Unity / Godot configuration tables
   * Extend Config Manager with JSON export planning, field validation, and cross-table reference checks
   * Keep local-only and read-only behavior documented

2. Frontend:

   * Keep Config Manager usable and close to Code Agent interaction patterns
   * Shape Art Pipeline around Art Style Profiles and asset production specifications
   * Prefer tables, reports, cards, and import parameters over long text

3. Safety:

   * No automatic writes to external projects
   * No binding to a specific online image API until the workflow is concrete
