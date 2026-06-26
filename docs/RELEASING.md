# Releasing AI GameDev Toolkit

## Release checklist

1. Confirm the working tree contains only intended changes.
2. Update `frontend/package.json` version using semantic versioning.
3. Run all checks from `CONTRIBUTING.md`.
4. Confirm `backend/app/data/`, `.env`, build folders, and API keys are not staged.
5. Build and smoke-test the Windows packages:

```powershell
cd frontend
npm.cmd run dist:win
```

Artifacts are written to `frontend/artifacts/`.

The build process:

1. Builds the React frontend.
2. Runs backend tests.
3. Bundles the FastAPI backend and Python runtime with PyInstaller.
4. Packages Electron with the frontend and backend using electron-builder.
5. Produces an NSIS installer and portable executable.

## Local data in packaged builds

Packaged builds store settings, outputs, profiles, and traces under Electron's per-user application data directory. They do not write user data into the installation folder.

Packaged builds also:

* Require a random per-session token for local `/api/*` requests.
* Protect provider API keys with AES-GCM using a master key protected by Windows DPAPI through Electron `safeStorage`.
* Automatically migrate legacy plaintext provider keys on first secure startup.
* Apply a restrictive renderer Content Security Policy and deny Electron permission requests.

Generated outputs, uploaded reference images, style profiles, and traces remain ordinary local files. They are not encrypted. Prompts and reference images may be sent to the external providers configured by the user.

Standalone browser development does not use Electron's DPAPI-backed credential protection. Keep it bound to `127.0.0.1` and use development-only credentials.

## Git and GitHub release

If the current repository only has a Gitee remote, keep it as a mirror and add GitHub as the primary remote:

```powershell
git branch -M main
git remote rename origin gitee
git remote add origin https://github.com/<your-account>/ai-game-dev-toolkit.git
git push -u origin main
```

For each release:

```powershell
git status
git add <reviewed files>
git commit -m "Release v0.1.0"
git tag -a v0.1.0 -m "AI GameDev Toolkit v0.1.0"
git push origin main
git push origin v0.1.0
```

On GitHub:

1. Open **Releases** and choose **Draft a new release**.
2. Select the version tag.
3. Add release notes and known limitations.
4. Upload the NSIS installer and portable executable from `frontend/artifacts/`.
5. Publish as a pre-release for the first public build.

## Signing

Unsigned Windows applications can trigger SmartScreen warnings. A public production release should use an Authenticode code-signing certificate. Configure electron-builder signing secrets only in local environment variables or GitHub Actions secrets; never commit certificate files or passwords.

## Cross-platform builds

PyInstaller bundles are platform-specific. Build Windows artifacts on Windows, macOS artifacts on macOS, and Linux artifacts on Linux.
