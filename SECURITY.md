# Security Policy

## Supported versions

Security fixes are provided for the latest release on the default branch.

## Reporting a vulnerability

Please do not publish exploitable details in a public issue. Use GitHub's private vulnerability reporting feature when enabled, or contact the repository owner privately.

Include:

- Affected version or commit
- Reproduction steps
- Impact
- Suggested mitigation, if known

## Security model

- Backend services bind to `127.0.0.1` by default.
- The application has no remote authentication layer and must not be exposed directly to a LAN or the public internet.
- Local folder scanning is read-only.
- Downloads are restricted to the toolkit output directory.
- Provider URLs are user-configurable and can intentionally connect to local or remote services.
- API keys are stored locally in plain text; see [PRIVACY.md](PRIVACY.md).

Do not run untrusted modified frontend code against a backend containing sensitive API keys.
