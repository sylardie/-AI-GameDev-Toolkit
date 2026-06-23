# Roadmap

## Development Principle

Build the broad product direction first, then refine details and user experience.

In practice:

* Complete usable MVP coverage for the three main workflows:
  * Design Generator
  * Code Agent
  * Art Pipeline
* Avoid spending too long polishing one module while another main module is still missing.
* After all three workflows are usable, return to UX polish, robustness, visual refinement, and deeper AI assistance.

## Current Direction

The product direction is now narrower and more practical:

* Convert generic AI answers into game-development deliverables.
* Prioritize configuration tables, Excel folder management, project diagnostics, asset specifications, and import parameters.
* Keep every external integration optional and configurable.

### Completed Broad Workflow

* Config Generator / Design Generator MVP
* Config Manager MVP
* Code Agent MVP through v0.5
* Art Pipeline MVP
* Asset Tools spritesheet / cleanup workflow

### Next Broad Step

* Make Config Generator schema-first for Unity / Godot config tables.
* Deepen Config Manager with JSON export, field validation, and cross-table reference checks.
* Shape Art Pipeline around Art Style Profiles instead of generic prompt display.

## Broad MVP Integration Scope

Backend:

* Review status endpoints
* Keep local-only behavior documented
* Avoid external service integration

Frontend:

* Update Dashboard text
* Make module descriptions current
* Light consistency pass across the three main pages

Out of scope until explicit confirmation:

* Writing files into external projects
* Binding to one online image API provider without a concrete production workflow
* Long-form generic AI answers as primary output
