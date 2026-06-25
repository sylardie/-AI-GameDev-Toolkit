# Privacy

AI GameDev Toolkit is local-first and does not include analytics or telemetry.

## Data stored locally

The backend stores generated outputs, traces, style profiles, and provider settings under its local data directory. In a packaged Windows build this is placed under Electron's per-user application data directory.

API keys are stored as plain text in the local settings JSON file. They are masked in API responses and the frontend, but they are not stored in the operating-system credential vault. Do not share or commit the local data directory.

Saved project and configuration-folder paths are stored in browser or Electron local storage.

## Data sent to external services

When an online LLM, vision model, image provider, or remote ComfyUI endpoint is configured, prompts and required input files are sent to that provider:

- Config Generator and Art Prompt generation send text prompts to the configured LLM.
- Reference Image Analysis sends the uploaded image to the configured vision-capable LLM.
- Online Image Generation sends prompts to the configured image provider.
- ComfyUI generation sends workflow payloads to the configured ComfyUI endpoint.

Review the privacy policy and data-use terms of every provider you configure. For fully local processing, use local endpoints such as Ollama and a local ComfyUI instance.

## Local project access

Config Manager and Project Assistant read user-selected local folders. They do not write into Godot or Unity projects. Generated outputs are written only to the toolkit's output directory.

## Deleting local data

Close the application, then delete its data directory to remove settings, API keys, profiles, traces, and generated outputs. In source/development mode the default location is `backend/app/data/`.
