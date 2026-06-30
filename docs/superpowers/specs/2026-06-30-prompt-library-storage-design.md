# Prompt Library and Storage Root Design

## Goal

Add a Prompt Library module where users can store reusable prompts locally, and add one configurable application data root for modules that write local data.

## Storage Model

The app uses one active data root. Under that root it creates:

- `outputs/` for generated files and downloadable packages.
- `traces/` for trace logs.
- `config/` for app configuration and local libraries.
- `prompts/` for the Prompt Library JSON store.

`AI_GAMEDEV_DATA_DIR` remains the highest-priority override for explicit environment-controlled deployments. Electron provides `AI_GAMEDEV_DEFAULT_DATA_DIR` as the default root instead, so users can still change the active data root from Settings. When no hard override is set, the backend reads a small bootstrap file under the default app data directory to find the configured data root. This avoids storing the data root preference only inside a directory that may later move.

Changing the data root does not migrate old data automatically. New writes use the new root after saving the setting, and old files stay where they are.

## Prompt Library

The Prompt Library is a local-only module with CRUD operations over `prompts/prompt_library.json`. Each prompt has an id, title, category, tags, body, notes, and created/updated timestamps.

The first version is intentionally standalone: users can search, edit, and copy prompts. Later modules can add "insert from prompt library" controls once the core library is stable.

## Safety

The backend creates only the expected subdirectories under the selected data root. Download APIs remain restricted to the active `outputs/` directory. The Code Agent remains read-only for external game projects.
