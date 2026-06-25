# Contributing

Thank you for contributing to AI GameDev Toolkit.

## Development setup

1. Create `backend/.venv`.
2. Install `backend/requirements.txt`.
3. Run `npm install` in `frontend/`.
4. Start with `scripts/start-dev.cmd`.

## Required checks

Run before opening a pull request:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high

cd ..\backend
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall app
```

## Project rules

- Keep local project access read-only unless a feature explicitly requires otherwise.
- Never commit API keys, generated outputs, traces, or local profile/settings files.
- Add English and Chinese strings together.
- Keep schemas explicit and update documentation for completed workflows.
- Prefer small, focused changes.
