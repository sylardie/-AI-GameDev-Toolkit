# AI GameDev Toolkit - Project Design

## 1. Product Positioning

AI GameDev Toolkit is a local web-based AI workflow platform for game developers.

It is designed as a portfolio project for AI application engineering. The goal is to show practical engineering ability, not just prompt writing.

The platform covers three workflows:

1. Game design generation
2. Game project code assistance
3. Game art production pipeline

## 2. Core Product Idea

The tool should support a full game development workflow:

```text
Game idea
↓
Structured GDD and configuration data
↓
Export JSON / Markdown / Excel
↓
Generate art prompts and asset guides
↓
Scan Godot / Unity project
↓
Assist with code search, error analysis, and implementation suggestions
```

## 3. Modules

### 3.1 Design Generator

Purpose:

Generate structured game design data from a short game idea and a selected game type template.

Implemented features:

* Game idea input
* Game type template selection
* Template JSON configuration
* Generic schema:

  * systems
  * resources
  * items
  * entities
  * progression
  * tasks
  * levels
  * balance_notes
* JSON export
* Markdown export
* Excel export
* File download API
* LLM client foundation
* Trace logging foundation

Design principle:

The schema must stay generic. Do not hardcode one specific game concept such as planets, stars, lighthouse, cards, or RPG characters at the schema level. Specific game concepts should only appear in generated content, not in core schema names.

### 3.2 Code Agent

Purpose:

Help developers understand and inspect Godot / Unity projects.

MVP features:

* Input local project path
* Detect Godot or Unity project
* Scan file tree
* Classify:

  * scripts
  * scenes
  * resources
  * configs
  * others
* Show project summary
* Show file lists

Future features:

* Read selected script file
* Extract classes and functions
* Code search
* Error analysis
* Generate implementation suggestions
* Generate README / resource manifest
* Optional diff generation with user confirmation

Safety principle:

The first version must only read files. It must not modify external game project files.

### 3.3 Art Pipeline

Purpose:

Support AI-assisted game art production.

Future MVP features:

* Input character / item / scene description
* Generate positive prompt
* Generate negative prompt
* Generate style tags
* Generate naming rules
* Generate Godot / Unity import guide

Future advanced features:

* ComfyUI API integration
* Workflow template management
* Batch image generation
* Asset metadata
* Sprite sheet processing

## 4. Architecture

### Frontend

React + Vite + React Router.

Pages:

* Dashboard
* Design Generator
* Code Agent
* Art Pipeline
* Settings

### Backend

FastAPI.

Current API groups:

* `/api/design`
* `/api/code`
* `/api/art`
* `/api/files`

Future API groups may include:

* `/api/settings`
* `/api/traces`

### Storage

Local files:

```text
backend/app/data/outputs/
backend/app/data/traces/
```

Generated files should not be committed to Git by default.

## 5. Design Generator Current Data Flow

```text
User idea + selected template
↓
Load template config
↓
Generate design data through a configured LLM
↓
Validate with Pydantic
↓
Export JSON / Markdown / Excel
↓
Return file paths to frontend
↓
Allow user to download generated files
```

## 6. Code Agent Expected Data Flow

```text
User enters local project path
↓
Backend validates path
↓
Detect project type
↓
Scan files and ignore heavy/generated folders
↓
Classify files
↓
Return project summary and file lists
↓
Frontend displays project overview
```

## 7. Important Constraints

* This is a local tool. Do not upload user project files to a server.
* API keys must stay in backend `.env`.
* Frontend must never contain API keys.
* Code Agent must not modify files in MVP.
* File downloads must be limited to generated output files.
* Keep schemas generic and reusable.

## 8. Recommended Next Milestone

Implement Code Agent MVP.

Expected backend files:

```text
backend/app/schemas/code.py
backend/app/modules/code_agent/project_detector.py
backend/app/modules/code_agent/project_scanner.py
backend/app/api/code.py
```

Expected frontend files:

```text
frontend/src/api/codeApi.js
frontend/src/pages/CodeAgentPage.jsx
```

Acceptance criteria:

* User can input a Godot project root path and scan it.
* User can input a Unity project root path and scan it.
* Backend returns project type and categorized files.
* Frontend displays summary and file lists.
* Existing Design Generator still works.
