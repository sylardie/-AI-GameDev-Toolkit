# README Bilingual Showcase Design

## Goal

Make the GitHub project README easier to read for both Chinese and English audiences while keeping the content maintainable and accurate for the current v0.1.0 public preview.

## Constraints

GitHub README files do not support JavaScript-driven tabs, so the language switch should use static Markdown and HTML that GitHub renders reliably. The README should avoid external image dependencies when a repository asset is available.

## Design

Use a polished top section with centered title, badges, language anchor links, and the existing repository hero image. Provide two same-structure language sections:

1. Chinese section anchored as `#zh`
2. English section anchored as `#english`

Each section contains the same core information:

- project positioning
- feature highlights
- visual workflow overview
- quick start
- desktop build
- release download
- page routes
- integrations and privacy notes
- quality checks
- links to security, contributing, release guide, and license

The visual layer uses `frontend/src/assets/hero.png` and a Markdown table that reads like feature cards. This keeps the README attractive without adding generated assets or external hosting.

## Validation

Review the rendered Markdown structure, ensure all local links are valid, and run a basic diff/status check before committing.
