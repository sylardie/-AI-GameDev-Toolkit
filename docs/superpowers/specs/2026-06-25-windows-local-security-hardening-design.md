# Windows Local Security Hardening Design

## Goal

Harden the packaged Windows application against unauthorized localhost API
access, plaintext provider credential storage, and unrestricted renderer
content loading while preserving the current local development workflow.

## Scope

This change covers:

- authentication for local FastAPI endpoints;
- encrypted storage and migration of LLM and image-provider API keys;
- Electron renderer Content Security Policy and permission restrictions;
- authenticated file downloads;
- tests and release documentation.

It does not add user accounts, remote access, cloud synchronization, code
signing, or encryption for generated output files and style profiles.

## Runtime Modes

### Packaged Electron and Electron development

Security hardening is enabled when Electron launches the backend:

- Electron generates a fresh random API token for every application run.
- Electron loads or creates a persistent encryption master key.
- Both secrets are passed only to the child backend process through its
  environment.
- The API token is exposed to the isolated renderer through a minimal preload
  method.

### Standalone browser development

When the backend is started manually without security environment variables:

- API authentication remains disabled;
- provider keys keep the existing plaintext development storage behavior;
- the backend remains bound to `127.0.0.1`.

This fallback is explicitly development-only and will be documented.

## Local API Authentication

Electron generates at least 32 random bytes and encodes them as a URL-safe
token. It passes the value to the backend as `AI_GAMEDEV_API_TOKEN`.

FastAPI middleware protects every `/api/*` route except `/api/health` when the
environment token is configured. Requests must include:

```text
X-AI-Toolkit-Token: <token>
```

The middleware compares tokens using a constant-time comparison and returns
HTTP 401 without identifying whether a candidate token was close or malformed.
Health remains unauthenticated so Electron can detect an existing or stale
backend on port 8010. It returns only product/version compatibility status.

The preload bridge exposes an asynchronous `getApiToken()` method rather than
placing the token directly in static HTML or a URL. A shared frontend API
helper adds the header to JSON, multipart, and health-compatible requests.

## Authenticated Downloads

Download URLs will no longer be opened directly in a new window. The frontend
will fetch the file with the authentication header, convert the response to a
Blob, and trigger a browser download using a temporary object URL.

Generated image previews will also use authenticated Blob URLs. Object URLs
must be revoked when replaced or when their component unmounts.

The API token must never appear in query strings, filenames, error messages,
logs, or saved settings.

## Credential Encryption

### Master key

Electron creates a random 256-bit master key on first secure startup. It uses
Electron `safeStorage.encryptString()` to protect the base64-encoded master
key with Windows DPAPI and stores only the encrypted bytes under Electron's
per-user application data directory.

On later starts Electron decrypts the master key with
`safeStorage.decryptString()`. The plaintext key exists only in process memory
and the backend child environment.

If `safeStorage.isEncryptionAvailable()` is false, secure Electron startup
fails with an actionable error. The application must not silently fall back to
plaintext storage in packaged mode.

### Provider keys

Electron passes the master key to the backend as
`AI_GAMEDEV_SETTINGS_KEY`. Python encrypts each provider API key independently
using AES-256-GCM with:

- a fresh 96-bit nonce;
- authenticated encryption;
- a versioned serialized value containing algorithm, nonce, and ciphertext.

The Python `cryptography` package will be added as a pinned dependency.
Runtime settings expose decrypted keys only in memory to existing LLM and image
provider clients. Public settings responses continue to expose only configured
state and a masked preview.

### Storage format

In secure mode, `local_settings.json` contains no plaintext provider keys.
Encrypted values use explicit fields such as:

```json
{
  "api_key_encrypted": {
    "version": 1,
    "algorithm": "AES-256-GCM",
    "nonce": "...",
    "ciphertext": "..."
  }
}
```

Plaintext `api_key` fields are omitted after successful secure writes.

## Automatic Plaintext Migration

On the first secure load:

1. Read and validate the existing settings file.
2. Detect non-empty legacy plaintext API keys.
3. Encrypt each key with a new nonce.
4. Write the complete migrated settings to a temporary file in the same
   directory.
5. Flush and atomically replace the original settings file.
6. Reload and decrypt the new file to verify it before continuing.

Migration never logs keys or serialized encrypted values. If any step fails,
the original file remains unchanged and secure startup/settings loading fails
with an actionable message. The application does not delete or partially
rewrite legacy credentials.

In standalone development mode without a master key, the existing plaintext
format remains readable and writable.

## Content Security Policy

The production renderer receives a restrictive CSP through `index.html`:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
media-src 'self' blob:;
connect-src 'self' http://127.0.0.1:8010;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self'
```

`unsafe-inline` is limited to styles because the current React UI may use
inline style properties. Inline scripts and remote script execution remain
blocked.

Electron will deny all renderer permission requests by default. Existing
navigation restrictions, context isolation, renderer sandboxing, disabled Node
integration, and web security remain enabled.

## Failure Handling

- A stale backend without the expected authentication behavior is rejected.
- Missing or wrong API tokens produce HTTP 401.
- Corrupt encrypted keys do not fall back to plaintext or empty values.
- Missing DPAPI capability prevents packaged startup with a clear error.
- Failed migration leaves the legacy file intact.
- Frontend API helpers turn authentication failures into a clear local backend
  security/session error.

## Testing

Backend tests will cover:

- protected routes with missing, incorrect, and correct tokens;
- public health behavior;
- plaintext development storage;
- AES-GCM round trips and tamper rejection;
- legacy plaintext migration;
- migration failure preserving the original file;
- public responses never returning plaintext keys.

Frontend/Electron checks will cover:

- the shared API helper applying the token to JSON and multipart requests;
- Blob-based authenticated downloads;
- preload exposing only the minimal token method;
- CSP presence in the production build;
- Electron permission requests being denied.

Release verification will include:

- backend unit and compile checks;
- frontend lint and production build;
- packaged backend build;
- packaged Windows application smoke test;
- inspection confirming no plaintext keys or development data are bundled.

## Documentation

Release and settings documentation will state:

- packaged credentials are protected using Windows DPAPI-backed encryption;
- generated outputs and profiles remain ordinary local files;
- prompts and uploaded reference images may be sent to configured providers;
- standalone development mode does not enable packaged credential protection;
- uninstalling the application may leave per-user data unless the user removes
  the application data directory.
