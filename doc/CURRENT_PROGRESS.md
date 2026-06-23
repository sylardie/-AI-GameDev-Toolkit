# Current Progress

## Completed

### Platform Skeleton

* Created local web platform structure.
* Backend uses FastAPI.
* Frontend uses React + Vite + React Router.
* Added Windows one-click dev scripts:

  * `scripts/start-dev.cmd`
  * `scripts/stop-dev.cmd`
  * `scripts/dev-backend.cmd`
  * `scripts/dev-frontend.cmd`

* Sidebar navigation includes:

  * Dashboard
  * Design Generator
  * Code Agent
  * Art Pipeline
  * Settings

### Design Generator

Implemented:

* Game idea input
* Game type template selector
* Template configuration files in backend
* Generic design schema
* Real LLM generation through local Settings or backend `.env`
* JSON export
* Markdown export
* Excel export
* File download API
* LLM client foundation
* Trace logger foundation

Current Design Generator output schema:

* title
* template
* genre
* target_audience
* pitch
* core_loop
* systems
* resources
* items
* entities
* progression
* tasks
* levels
* balance_notes

Templates implemented:

* general
* idle
* rpg
* card
* roguelike
* simulation
* tower_defense
* action_2d

Exported file types:

* `.json`
* `.md`
* `.xlsx`

### File Download

Implemented a safe file download endpoint for generated files.

Files are downloaded only from:

```text
backend/app/data/outputs/
```

### Code Agent MVP

Implemented:

* Godot project detection by `project.godot`.
* Unity project detection by `Assets/` and `ProjectSettings/`.
* Read-only project scan API.
* File classification for:

  * scripts
  * scenes
  * resources
  * configs
  * others

* Project scan summary:

  * project type
  * total files
  * script count
  * scene count
  * resource count
  * config count
  * total scanned size
  * skipped directories

* Frontend Code Agent page:

  * local project path input
  * scan button
  * project summary cards
  * categorized file list tabs
  * selected file preview panel

### Code Agent v0.2

Implemented:

* Safe read-only file preview API.
* File preview request schema and response schema.
* Project-root path boundary validation.
* Ignored-directory protection for previews.
* Text preview for common Godot / Unity files:

  * `.gd`
  * `.cs`
  * `.tscn`
  * `.tres`
  * `.unity`
  * `.prefab`
  * `.shader`
  * `.json`
  * `.yaml`
  * `.xml`
  * `.md`
  * `.txt`

* Preview size limit of 256KB.
* Binary and unsupported file types return metadata and a clear message instead of content.
* Frontend file rows are clickable and show the selected file content below the list.

### Code Agent v0.3

Implemented:

* Safe read-only project search API.
* Search query schema and response schema.
* Case-insensitive text search across previewable text files.
* Search keeps project-root boundary protection.
* Search skips ignored/generated folders.
* Search ignores unsupported, binary, and oversized files.
* Search results include:

  * relative file path
  * file name
  * extension
  * line number
  * matched line preview

* Search summary includes:

  * scanned file count
  * skipped file count
  * match count
  * truncated result flag

* Frontend Code Agent page now has:

  * search input
  * search button
  * match summary
  * clickable search results
  * search-result-to-file-preview flow

### Code Agent v0.4

Implemented:

* Safe read-only script structure extraction API.
* Structure request schema and response schema.
* GDScript structure extraction for:

  * `class_name`
  * `signal`
  * `@export var`
  * `var`
  * `func`

* C# structure extraction for common Unity script patterns:

  * `class`
  * `struct`
  * `interface`
  * `enum`
  * fields
  * methods

* Frontend Structure Outline under file preview.
* Clickable structure rows.
* Clickable search results and structure rows highlight the related preview line.
* Unsupported files show a clear message instead of failing.

### Code Agent v0.5

Implemented:

* Safe read-only error-log analysis API.
* Error-log request schema and response schema.
* Unity-style file reference parsing:

  * `Assets/.../File.cs(12,34)`
  * `Packages/...`

* Godot-style file reference parsing:

  * `res://path/file.gd:12`
  * `res://path/file.tscn:12`

* Generic `path:line` reference parsing for common script and scene files.
* Error keyword extraction for common Unity / C# and Godot log markers.
* Related project file matching by:

  * exact path
  * path suffix
  * file name

* Frontend Error Log Analysis panel:

  * log textarea
  * analyze button
  * clear button
  * engine / reference / related file summary
  * keyword chips
  * clickable related file results
  * parsed reference list

* Clicking a related file opens the file preview and highlights the referenced line when available.

### Art Pipeline MVP

Implemented:

* Art prompt generation API.
* Explicit Art Pipeline request and response schemas.
* Deterministic local prompt generator.
* Positive prompt generation.
* Negative prompt generation.
* Style tag generation.
* Asset naming rule generation.
* Godot / Unity / generic import guide generation.
* Production notes generation.
* Frontend Art Pipeline page with:

  * asset description input
  * asset type selector
  * style selector
  * engine target selector
  * mood input
  * color palette input
  * generated prompt panels
  * naming rules panel
  * import guide panel
  * copy buttons

Current Art Pipeline asset types:

* character
* item
* environment
* ui_icon
* sprite
* tileset
* concept_art

Current Art Pipeline styles:

* pixel_art
* hand_painted
* low_poly
* anime
* realistic
* flat_vector

### Broad MVP Integration Pass

Implemented:

* Updated Dashboard to reflect the three working MVP workflows.
* Updated Sidebar module descriptions.
* Replaced Settings placeholder copy with current local configuration notes.
* Added `GET /api/design/status`.
* Updated `GET /api/code/status` message to reflect scan, preview, search, structure, and error-log capabilities.
* Expanded README with:

  * MVP workflow summary
  * local-first safety note
  * quick start
  * manual start
  * page URLs
  * current development principle

* Confirmed current broad MVP direction in `AGENTS.md` and `doc/ROADMAP.md`.

### Post-MVP Refinement: Design Generator Copy Cleanup

Implemented:

* Replaced visible mojibake / corrupted copy in `DesignGeneratorPage.jsx`.
* Kept the existing Design Generator behavior:

  * template loading
  * design generation
  * JSON / Markdown / Excel download
  * GDD overview
  * systems view
  * config table preview
  * JSON preview

* Updated visible labels, buttons, tabs, error messages, placeholders, and section headings.
* Confirmed the updated page builds successfully.
* Confirmed the updated page builds successfully.

### Post-MVP Refinement: Bilingual Localization

Implemented:

* Added a lightweight frontend i18n provider.
* Added English / Chinese translation dictionaries.
* Added a top-right language toggle in the shared layout.
* Persisted the selected language in browser local storage.
* Localized static UI copy for:

  * Sidebar
  * Dashboard
  * Design Generator
  * Code Agent
  * Art Pipeline
  * Settings

* Kept generated backend content unchanged for now. Generated prompts, design content, and analysis details still use the language/content returned by the backend module.
* Cleaned remaining visible encoding artifacts in the localized frontend text.
* Confirmed the frontend production build succeeds.
* Confirmed backend Python modules compile successfully.

### Configurable AI / ComfyUI / Asset Tools Pass

Implemented:

* Added local backend settings storage at `backend/app/data/config/local_settings.json`.
* Upgraded Settings into an editable configuration page for LLM and ComfyUI.
* Added settings APIs for read, save, LLM test, and ComfyUI test.
* API keys are stored locally on the backend and only returned to the frontend as configured / masked state.
* Design Generator now prefers frontend-configured LLM settings and keeps `.env` as a compatibility configuration source.
* Art Pipeline now returns a basic text-to-image ComfyUI workflow payload.
* Added real ComfyUI submission through `/api/art/comfyui/submit`, calling ComfyUI `/prompt` and returning `prompt_id`.
* Added ComfyUI connection testing through `/system_stats`.
* Added Asset Tools page at `/assets`.
* Added video-to-spritesheet generation through `/api/assets/spritesheet`.
* Spritesheet outputs are written only under `outputs/assets/` and exposed through the existing safe download API.
* Added Godot / Unity / generic metadata hints for generated spritesheets.
* Added `Pillow`, `imageio`, and `imageio-ffmpeg` for video frame extraction and spritesheet generation.

Verification:

* Installed backend requirements.
* Backend app imports successfully.
* Backend compileall passes.
* Frontend production build passes.
* Smoke tested settings read, Art Pipeline workflow generation, disabled ComfyUI submit, and video-to-spritesheet generation.

Safety behavior:

* The MVP only reads and displays project files.
* It does not modify external Godot / Unity project files.
* Heavy/generated folders are ignored during scan, including `.git`, `.godot`, `Library`, `Temp`, `Build`, `node_modules`, `.venv`, `venv`, and related cache/output directories.

Modified files:

```text
backend/app/api/code.py
backend/app/api/art.py
backend/app/api/assets.py
backend/app/api/settings.py
backend/app/core/config.py
backend/app/main.py
backend/app/schemas/code.py
backend/app/schemas/art.py
backend/app/schemas/assets.py
backend/app/schemas/settings.py
backend/app/modules/code_agent/project_detector.py
backend/app/modules/code_agent/project_scanner.py
backend/app/modules/code_agent/file_reader.py
backend/app/modules/code_agent/project_searcher.py
backend/app/modules/code_agent/script_analyzer.py
backend/app/modules/code_agent/error_log_analyzer.py
backend/app/modules/shared/llm_client.py
backend/app/modules/shared/settings_store.py
backend/app/modules/design_generator/llm_generator.py
backend/app/modules/art_pipeline/comfyui_client.py
backend/app/modules/art_pipeline/comfyui_workflow.py
backend/app/modules/art_pipeline/spritesheet_generator.py
backend/requirements.txt
frontend/src/api/codeApi.js
frontend/src/api/artApi.js
frontend/src/api/assetsApi.js
frontend/src/api/settingsApi.js
frontend/src/pages/CodeAgentPage.jsx
frontend/src/pages/ArtPipelinePage.jsx
frontend/src/pages/AssetToolsPage.jsx
frontend/src/pages/DesignGeneratorPage.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/SettingsPage.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/Layout.jsx
frontend/src/components/LanguageToggle.jsx
frontend/src/i18n/I18nContext.jsx
frontend/src/i18n/translations.js
frontend/src/main.jsx
frontend/src/styles/app.css
README.md
AGENTS.md
doc/ROADMAP.md
doc/CURRENT_PROGRESS.md
```

## In Progress

### Development Principle

Current working principle:

* Build broad product direction first.
* Prefer completing the main workflow coverage across Design Generator, Code Agent, and Art Pipeline before deep polish.
* After the three major workflows are usable, return to details, UX improvements, robustness, and visual refinement.

### LLM Integration

Added foundation for OpenAI-compatible LLM API usage.

Environment variables:

```env
LLM_ENABLED=false
LLM_API_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
LLM_TIMEOUT=60
```

Current behavior:

* Design Generator requires a configured LLM.
* If LLM is disabled, incomplete, or fails, the API returns a clear error.
* No placeholder design content is generated in the current runtime path.

## Not Yet Implemented

### Code Agent

MVP, file preview, project search, script structure extraction, and error-log analysis completed. Recommended next steps:

* Add AI explanation for the selected file.
* Add AI-assisted error explanation using the selected file and parsed log.
* Later, add diff proposal generation with explicit user confirmation before any write.

### Art Pipeline

MVP and first ComfyUI integration completed. Need to implement later:

* ComfyUI result polling and output image retrieval
* Configurable ComfyUI checkpoint / workflow templates
* Batch prompt variants
* Asset metadata export
* Better workflow templates by asset type

### Asset Tools

First spritesheet tool completed.

### Asset Tools v0.2

Implemented:

* Added video source preview metadata in the frontend:

  * file name
  * resolution
  * duration
  * estimated output frame count

* Added extraction controls:

  * start time
  * end time
  * target FPS mode
  * every-N-frames interval mode
  * max frame count

* Added frame cleanup controls:

  * optional similar-frame dedupe
  * similarity threshold
  * post-extraction background transparency workflow
  * background color quick picks
  * color tolerance slider

* Added output controls:

  * Godot / Unity / generic metadata target
  * ZIP package export

* Backend spritesheet generation now stores individual extracted PNG frames under `outputs/assets/{output_id}/frames/`.
* Added frame preview grid in the frontend.
* Added select all, invert selection, clear selection, and selected-frame export.
* Added simple animation preview from selected frames.
* Added `POST /api/assets/spritesheet/export` for rebuilding outputs from selected frames.
* Added `POST /api/assets/spritesheet/transparent` for applying transparent background processing after frames are visible.
* Moved transparent background processing out of the initial extraction form and into the frame preview / cleanup stage.

Verification:

* Backend compileall passes.
* Frontend production build passes.
* Smoke tested video extraction with time range, ZIP, selected-frame re-export, and post-extraction transparent background processing.

### Asset Tools v0.3 and LLM Runtime Cleanup

Implemented:

* Video-to-spritesheet defaults now target a 4x4 workflow:

  * FPS defaults to `16`
  * max frames defaults to `16`
  * columns default to `4`

* Selecting a video now auto-fills frame width and height from the source video, capped to the backend's safe size limit.
* Removed GIF export from the frontend Asset Tools workflow.
* Frame transparent-background processing now applies to all extracted frames from a single simple action.
* Added single-image local background removal:

  * upload PNG / JPG / WebP
  * choose background color
  * adjust tolerance
  * output transparent PNG and ZIP under `outputs/assets/`

* Removed placeholder-generation fallback from Settings and Design Generator runtime behavior.
* Design Generator now returns a clear error when LLM is not configured or generation fails.
* Replaced lighthouse-girl default prompts with more general game-development examples.
* Rebuilt frontend translation text to remove visible encoding artifacts.

### Asset Tools v0.4 Transparent Edge Cleanup

Implemented:

* Added edge softness controls to transparent background processing.
* Video frame background removal and single-image background removal now share the same soft-edge algorithm.
* Transparency processing now uses:

  * tolerance for fully transparent background pixels
  * edge softness for semi-transparent edge pixels
  * simple background tint removal on softened edge pixels

* This reduces visible black / white / colored residue around extracted sprites without adding external AI dependencies.

### Asset Tools v0.5 Spritesheet Output Preview

Implemented:

* Added a generated spritesheet preview panel with checkerboard background.
* Added output summary cards for:

  * output id
  * frame count
  * grid size
  * frame size
  * sheet size
  * metadata target

* Added Godot / Unity / generic import settings display.
* Added import-settings copy button.
* Kept outputs download-only and did not write into external Godot / Unity project folders.
* Cleaned Asset Tools page copy to remove remaining visible encoding artifacts.
* Added local video preview after selecting a video file.
* Video preview uses a browser object URL and does not upload the video before extraction.
* Old preview object URLs are released when the selected video changes.

### Product Direction Convergence: Config Manager MVP

Implemented:

* Added a new read-only Config Manager workflow for Excel configuration folders.
* Added backend `/api/configs/status`.
* Added backend `/api/configs/scan`.
* Added explicit Config Manager schemas:

  * `ConfigScanRequest`
  * `ConfigWorkbookItem`
  * `ConfigSheetSummary`
  * `ConfigIssue`
  * `ConfigScanResponse`

* Added a local Excel scanner using `openpyxl`.
* The scanner recursively reads `.xlsx` files and skips temporary Excel files such as `~$*.xlsx`.
* The scanner ignores heavy/generated folders such as `.git`, `.godot`, `Library`, `Temp`, `Build`, `node_modules`, `.venv`, and related output/cache folders.
* The scanner returns:

  * workbook list
  * sheet list
  * row count
  * column count
  * header list
  * issue summary

* Basic diagnostics implemented:

  * empty sheet / missing usable header row
  * missing `id` column
  * blank header cells
  * duplicate headers

* Added frontend Config Manager page at `/configs`.
* Added sidebar navigation entry for Config Manager.
* Added path input, scan button, summary cards, workbook list, sheet tabs, header chips, and diagnostic cards.
* Config Manager is read-only and does not modify Excel files.
* Removed browser file / folder upload scanning from Config Manager.
* Config Manager now uses local Excel folder paths as the main workflow.
* Added saved local Excel folder paths in the frontend.
* Saved paths are stored in browser local storage for quick switching between multiple projects.
* Added workbook search in Config Manager.
* Workbook search matches file names, relative paths, sheet names, and headers.
* Improved workbook search ordering with weighted matching:

  * exact file name match
  * file name prefix match
  * file name contains match
  * relative path match
  * sheet/header match

* This makes direct file matches such as `Pet.xlsx` appear before weaker sheet/header matches when searching `pet`.
* Added `POST /api/configs/open` for opening local `.xlsx` files with the system default app.
* The open-in-Excel button opens files from scanned local paths.
* Added favorite Excel files in Config Manager.
* Favorite Excel files are stored in browser local storage and can be opened quickly.
* Improved sheet selection for workbooks with many sheets:

  * sheet tabs now wrap
  * sheet tab area has a max height and scrolls
  * added sheet-name search
  * long sheet names are truncated inside tabs

* Removed the Excel preview table after review to keep Config Manager focused on scanning, diagnostics, search, and opening local files.

### Product Direction Convergence: Settings / Art Provider Abstraction

Implemented:

* Added a local `image_provider` settings schema.
* Added Settings UI for optional online image Provider configuration:

  * enabled
  * provider
  * Base URL
  * model
  * API key
  * timeout

* Image Provider API keys are saved only in backend local settings and returned to the frontend only as masked configured state.
* No actual online image generation submission is implemented in this pass.

### Product Direction Convergence: Asset Tools Practical Cleanup

Implemented:

* Removed similar-frame dedupe and similarity threshold from the Asset Tools UI.
* Frontend still submits dedupe disabled for backend compatibility.
* Replaced raw start / end time number fields with a browser-side video-duration range slider.
* The time range control shows start time, end time, and selected duration.
* Rebuilt Asset Tools page text to remove visible encoding artifacts.
* Rebuilt frontend translation text to clean visible Chinese / English copy and add Config Manager text.

Verification:

* `python -m compileall app` passes.
* `npm.cmd run build` passes.
* Smoke tested `/api/configs/scan` with a temporary Excel folder:

  * found one workbook
  * found two sheets
  * skipped one `~$` temp workbook
  * detected blank header, duplicate header, and missing id issues

Modified files:

```text
backend/app/api/configs.py
backend/app/main.py
backend/app/modules/config_manager/__init__.py
backend/app/modules/config_manager/excel_scanner.py
backend/app/modules/shared/settings_store.py
backend/app/schemas/configs.py
backend/app/schemas/settings.py
frontend/src/App.jsx
frontend/src/api/assetsApi.js
frontend/src/api/configsApi.js
frontend/src/components/Sidebar.jsx
frontend/src/i18n/translations.js
frontend/src/pages/AssetToolsPage.jsx
frontend/src/pages/ConfigManagerPage.jsx
frontend/src/pages/SettingsPage.jsx
frontend/src/styles/app.css
README.md
doc/PROJECT_DESIGN.md
doc/ROADMAP.md
doc/CURRENT_PROGRESS.md
```

### Workflow Convergence: Config Tables and Real Image Pipeline

Implemented:

* Reworked Config Generator runtime schema from generic design / GDD data to schema-first configuration table packages.
* Config Generator now focuses on:

  * gameplay idea input
  * generated config tables
  * field specs
  * example rows
  * Excel configuration package export
  * Godot `.tres` resource ZIP export

* Removed Markdown / GDD output from the Config Generator frontend workflow.
* Removed separate JSON download, separate Excel download, and copy-config-JSON from the Config Generator frontend workflow.
* Added Excel configuration package export containing:

  * one `.xlsx` workbook
  * one full JSON package
  * per-table JSON files under `tables/`
  * README

* Excel export now writes one table per sheet, including field names, field types, field descriptions, and example rows.
* Godot export now creates a ZIP containing:

  * `config_table_resource.gd`
  * `.tres` files under `tables/`
  * a JSON copy of the generated config package
  * a short Godot usage README

* Code Agent file scan results are now sorted by size descending inside scripts, scenes, resources, configs, and others.
* Global select controls now use custom arrow styling and extra right padding.
* Settings Image Provider options are narrowed to OpenAI-compatible providers:

  * OpenAI Images
  * Custom

* Added Image Provider connection test endpoint.
* Added real Art Pipeline image generation endpoint using OpenAI-compatible `/v1/images/generations`.
* Image generation stores output images under `outputs/art/` and exposes them through the safe download endpoint.
* Added upload-image analysis endpoint using the existing LLM settings with a vision-capable model.
* Image analysis returns structured reusable art data:

  * content prompt
  * style spec prompt
  * negative prompt
  * palette
  * camera view
  * resolution advice
  * naming advice
  * suitable asset types

* Added local Art Style Profile storage:

  * list profiles
  * save profile
  * delete profile
  * reuse profile during image generation

* Updated Art Pipeline frontend with:

  * image generation section
  * uploaded image preview
  * reverse-prompt analysis section
  * style profile library
  * generated image preview and download

Verification:

* `python -m compileall app` passes.
* `npm.cmd run build` passes.
* Smoke tested:

  * image generation with disabled Image Provider returns a clear error
  * sample Config Generator export writes JSON / Excel / Godot ZIP paths
  * sample Excel configuration package contains `.xlsx`, full JSON, per-table JSON, and README
  * current configured LLM endpoint fails with a clear upstream connection error when unreachable

Modified files:

```text
backend/app/api/art.py
backend/app/api/design.py
backend/app/api/settings.py
backend/app/modules/art_pipeline/image_analyzer.py
backend/app/modules/art_pipeline/image_provider_client.py
backend/app/modules/art_pipeline/style_profile_store.py
backend/app/modules/code_agent/project_scanner.py
backend/app/modules/design_generator/exporter.py
backend/app/modules/design_generator/llm_generator.py
backend/app/modules/shared/llm_client.py
backend/app/modules/shared/settings_store.py
backend/app/schemas/art.py
backend/app/schemas/design.py
backend/app/schemas/settings.py
frontend/src/api/artApi.js
frontend/src/api/settingsApi.js
frontend/src/pages/ArtPipelinePage.jsx
frontend/src/pages/DesignGeneratorPage.jsx
frontend/src/pages/SettingsPage.jsx
frontend/src/i18n/translations.js
frontend/src/styles/app.css
README.md
AGENTS.md
doc/CURRENT_PROGRESS.md
```

Need to implement later:

* Optional confirmed write into a selected Godot / Unity project
* Animation row grouping
* More accurate browser-side source FPS detection
* Config Manager JSON export
* Config Manager field type validation
* Config Manager cross-table reference checks
* Config Generator schema-first table output as the primary result

## Recommended Next Task

Continue the first post-MVP refinement pass.

Scope:

1. Product:

   * Continue checking project records, commit history, and docs before each task.
   * Keep refinements scoped and user-visible.
   * Keep external services optional and configurable.

2. Frontend:

   * Continue checking remaining copy consistency after the bilingual UI pass.
   * Improve empty states and loading states.
   * Review layout consistency across the main pages.
   * Improve generated spritesheet preview ergonomics after real-world use.

3. Safety:

   * Keep local-first behavior.
   * Keep external services behind explicit user configuration.
   * Do not write into external projects without explicit user confirmation.

## Current Phase Update: Config Package Completion, Asset UX, Audio Tools

Implemented:

* Config Generator Excel package now includes per-table `.xlsx` files under `tables/` in addition to each table JSON file.
* Excel configuration package still includes the full workbook, full JSON package, and `README.md`.
* Asset Tools video upload and single-image upload now support drag/drop.
* Asset Tools video time range is back to manual seconds input for start / end time.
* Asset Tools shows video local preview after upload.
* Asset Tools background cleanup copy now explains the practical workflow:

  * choose the background color to make transparent
  * raise tolerance to match a wider color range
  * raise edge softness when color residue remains
  * test on a small result before applying broadly

* Rebuilt frontend translation text for this pass and added Audio Tools bilingual copy.
* Added Audio Tools page at `/audio`.
* Added Audio Tools backend endpoint `POST /api/audio/process`.
* Audio Tools supports:

  * local drag/drop audio upload
  * browser preview playback
  * start / end seconds clipping
  * optional ffmpeg `loudnorm` volume normalization
  * WAV / OGG / MP3 output
  * processed audio, metadata JSON, and ZIP downloads

* Audio output is written only under `outputs/audio/`.
* README now records optional free / low-cost multimodal API notes:

  * Gemini API free tier and limits: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/rate-limits
  * Hugging Face Inference Providers free credits: https://huggingface.co/docs/inference-providers/pricing and https://huggingface.co/docs/inference-providers/index
  * Pollinations as an experimental provider: https://github.com/pollinations/pollinations

Modified files:

```text
AGENTS.md
README.md
backend/app/api/audio.py
backend/app/main.py
backend/app/modules/art_pipeline/audio_processor.py
backend/app/modules/design_generator/exporter.py
backend/app/schemas/audio.py
frontend/src/App.jsx
frontend/src/api/audioApi.js
frontend/src/components/Sidebar.jsx
frontend/src/i18n/translations.js
frontend/src/pages/AssetToolsPage.jsx
frontend/src/pages/AudioToolsPage.jsx
frontend/src/styles/app.css
doc/CURRENT_PROGRESS.md
```

Recommended follow-up:

* Add Config Manager JSON export and cross-table reference checks.
* Add audio batch processing after single-file audio workflow is validated.
* Decide whether Gemini or Hugging Face should become a first-class Provider after image generation / image analysis workflows stabilize.

Verification:

* `python -m compileall app` passes.
* `npm.cmd run build` passes.
* Smoke tested Excel package export and confirmed `tables/` contains both per-table `.json` and `.xlsx`.
* Smoke tested Audio Tools processing with a generated short audio file and confirmed processed OGG, metadata JSON, and ZIP outputs exist.
* Confirmed running OpenAPI includes `/api/audio/process`.
