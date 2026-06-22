# AGENTS.md

## Project Name

AI GameDev Toolkit

## Project Goal

This project is a local web-based AI toolkit for game developers. It aims to support three workflows:

1. Design Generator: generate structured game design data, GDD, JSON, Markdown, and Excel configuration files.
2. Code Agent: scan and understand Godot / Unity projects, support code search, error analysis, and implementation suggestions.
3. Art Pipeline: generate game art prompts, ComfyUI workflow payloads, asset naming rules, and Godot / Unity import guides.

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
      code.py
      art.py
      files.py
    schemas/
      design.py
      code.py
      art.py
    modules/
      design_generator/
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

### Design Generator

Already implemented:

* Game idea input
* Game template selection
* Template configuration files
* Generic design schema
* Real LLM generation through local settings or backend environment configuration
* JSON export
* Markdown export
* Excel export
* File download API
* Trace logging foundation

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

Expected future module:

* ComfyUI workflow payload generation
* Optional ComfyUI API integration
* Asset metadata export
* Batch prompt variants

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

Perform a broad MVP integration pass:

1. Backend:

   * Review API status endpoints for all modules
   * Keep local-only behavior documented
   * Avoid adding external services during this pass

2. Frontend:

   * Update Dashboard copy to reflect the three working workflows
   * Ensure module descriptions are current
   * Keep changes broad and practical

3. Safety:

   * No deep UI polish yet
   * No automatic writes to external projects
   * No new external image generation dependency
