# AI GameDev Toolkit - Project Design

## 1. Product Positioning

AI GameDev Toolkit is a local web-based AI workflow platform for Godot / Unity developers.

The project is being narrowed from a generic AI toolbox into a practical game-development agent workflow. The product should convert broad AI answers into structured, engine-ready outputs: configuration tables, validation reports, project diagnostics, import settings, asset specifications, and implementation guidance.

## 2. Core Workflow

```text
Game idea
-> schema-first configuration table proposal
-> JSON / Excel export
-> scan existing Excel config folder
-> scan Godot / Unity project
-> prepare art style profiles and engine-ready assets
-> produce structured, developer-actionable guidance
```

## 3. Modules

### 3.1 Config Generator

Formerly Design Generator.

Purpose:

Generate structured Unity / Godot configuration table proposals from a short game idea and a selected template.

Current behavior:

* Uses a configured LLM.
* Validates model output through Pydantic.
* Exports JSON, Markdown, and Excel.
* Keeps the previous design notes view for continuity.

Direction:

* Make configuration tables the primary result.
* Prefer table schema, field type, default value, enum, reference, and note fields over long design prose.
* Keep GDD-style text as supporting context, not the main output.

Recommended default table families:

* Items
* Entities
* Levels
* Skills
* Rewards
* Quests
* Economy

### 3.2 Config Manager

Purpose:

Help Unity / Godot developers understand and audit local Excel configuration folders.

MVP features:

* Input local Excel folder path.
* Recursively scan `.xlsx` files.
* Ignore temporary Excel files such as `~$*.xlsx`.
* Return workbook list, sheet list, row count, column count, headers, and diagnostics.
* Detect basic issues:
  * empty sheet / missing usable header row
  * missing `id` column
  * blank header cells
  * duplicate headers
* Read-only. It does not modify Excel files.

Future features:

* Export selected sheets to JSON.
* Field type validation.
* Cross-table reference checks.
* Enum consistency checks.
* Confirmed write-back or generated fixes only after explicit user confirmation.

### 3.3 Code Agent

Purpose:

Help developers understand and inspect Godot / Unity projects.

Implemented:

* Project type detection.
* Read-only file scan.
* File preview.
* Project search.
* Script structure extraction.
* Error-log analysis.

Direction:

AI output should be structured as executable developer guidance: suspected cause, related file, exact location, recommended fix steps, and risk notes.

Safety principle:

The MVP only reads files. It must not modify external game project files.

### 3.4 Art Pipeline

Purpose:

Support consistent game art production.

Current behavior:

* Generates prompt payloads, naming rules, import notes, and ComfyUI workflow payloads.
* ComfyUI is optional.

Direction:

Add an Art Style Profile concept:

* style summary
* palette
* line / rendering rules
* camera / perspective
* resolution and transparency rules
* naming convention
* negative constraints
* asset-type-specific notes for characters, icons, items, tilesets, UI, and sprites

Online image provider configuration is allowed, but actual provider integration should remain abstract until a concrete workflow is chosen.

### 3.5 Asset Tools

Purpose:

Prepare source media into engine-ready assets.

Implemented:

* Video to spritesheet.
* Frame preview and selected-frame export.
* Post-extraction transparent background processing.
* Single image solid-color background removal.
* Spritesheet preview and Godot / Unity import settings.

Current direction:

* Keep FPS, max frames, columns, frame size, transparent background, edge softness, preview, and import parameters.
* Remove low-value similar-frame dedupe UI from the first practical workflow.
* Use intuitive time-range controls instead of raw start/end number fields.

## 4. Architecture

Frontend:

* React
* Vite
* React Router
* Native CSS
* Lightweight local i18n

Backend:

* FastAPI
* Pydantic
* openpyxl
* requests
* Pillow / imageio for local asset tools

API groups:

* `/api/design`
* `/api/configs`
* `/api/code`
* `/api/art`
* `/api/assets`
* `/api/files`
* `/api/settings`

Storage:

```text
backend/app/data/config/
backend/app/data/outputs/
backend/app/data/traces/
```

Generated files, traces, local settings, and API keys should not be committed.

## 5. Constraints

* This is a local tool.
* API keys must stay in backend local settings or backend environment variables.
* Frontend must never contain API keys.
* Code Agent and Config Manager are read-only in the MVP.
* File downloads must be limited to generated output files.
* Do not write into external Godot / Unity projects without explicit user confirmation.
* Define target output schemas before calling AI.
