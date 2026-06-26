# Compact Workspace Layout Design

## Goal

Increase information density across the application while preserving the
current workflow structure, clear labels, direct editing, and local-tool
orientation.

The redesign follows the approved **compact card grid** direction:

- retain panels, tabs, and existing task order;
- reduce unnecessary vertical whitespace;
- size controls according to the amount of information they contain;
- keep long-form editing, previews, file lists, reports, and results spacious.

The target is for common actions to fit within a 1080p desktop viewport with
little or no page-level scrolling.

## Scope

Apply the compact layout system to:

- Dashboard
- Config Manager
- Project Assistant
- Asset Tools
- Audio Tools
- Config Generator
- Art Pipeline
- Settings

The redesign changes presentation and grouping only. It does not change API
contracts, processing behavior, validation rules, saved settings, or output
formats.

## Layout Principles

### 1. Content-sized controls

Controls should reflect expected content length:

- time, count, dimensions, steps, CFG, seed, timeout, LUFS: compact width;
- provider, model, format, engine target: medium width;
- paths, URLs, API keys, search fields: flexible full-row width;
- descriptions, prompts, logs, code previews: full width and intentionally
  spacious.

Short numeric controls must not automatically occupy half of the workspace.

### 2. Compact field grids

Introduce reusable field-grid variants:

- `compact-fields-2`: paired related fields;
- `compact-fields-3`: medium controls;
- `compact-fields-4`: short numeric controls;
- `compact-fields-auto`: responsive fields with practical minimum widths.

At wide desktop sizes, related fields stay on one row. They collapse
progressively at smaller widths without horizontal scrolling.

### 3. Preserve semantic grouping

Related values share one compact card:

- start and end time;
- frame count, columns, width, and height;
- normalization, target LUFS, and output format;
- provider, model, timeout, and Base URL;
- ComfyUI width, height, steps, CFG, and seed.

Cards should represent one user decision, not one individual field.

### 4. Reduce decorative height

Reduce vertical space used by:

- workspace headers;
- panel padding;
- tab bars;
- section headings;
- field label spacing;
- action rows;
- empty states;
- upload drop zones;
- hint and status boxes.

The visual hierarchy remains through typography, border tone, and small gaps
rather than oversized containers.

### 5. Protect high-value space

Do not aggressively shrink:

- Excel workbook and sheet browsers;
- project file lists and previews;
- code and error-log text areas;
- generated configuration tables;
- art prompts and image previews;
- spritesheet frame grids;
- audio/video media previews;
- diagnostics and result reports.

Density improvements must come from controls and chrome, not from making
working content difficult to inspect.

## Shared Component and CSS Changes

### Workspace header

Reduce icon size, title size, vertical padding, and intro spacing. Capability
badges remain visible. The header should communicate page identity without
behaving like a large hero banner.

### Panels

Define normal and compact panel spacing:

- standard panels for lists, previews, and results;
- compact panels for forms, filters, configuration, and actions.

Page-level gaps become smaller and consistent.

### Form controls

Use a common compact control height of approximately 38–42 pixels on desktop.
Labels remain above controls, with reduced label-to-control spacing.

Number inputs may use explicit compact classes but must retain browser keyboard
editing and validation behavior.

### Drop zones

Default upload zones become shorter while retaining:

- click target across the full zone;
- drag-and-drop behavior;
- accepted-format guidance;
- selected-file summary.

After a file is selected, the zone may become a compact file summary rather
than continuing to occupy upload-state height.

### Help and status content

Convert large help blocks into compact inline notes placed directly below the
relevant field group. Important errors and warnings remain visually prominent.

### Actions

Primary actions align with their related card and do not require a separate
large footer area. Destructive and secondary actions remain distinguishable.

## Page Designs

### Dashboard

- reduce header and card padding;
- tighten module card summaries;
- preserve module grouping and status badges;
- avoid large unused space around the module grid.

### Config Manager

- keep path input and scan actions on one responsive row;
- compress saved-path and summary cards;
- preserve workbook and sheet browser height;
- tighten search fields and report controls.

### Project Assistant

- keep project path and scan controls on one row;
- reduce saved-project card height;
- preserve file list, code preview, search results, and log analysis space;
- use compact filters and action bars.

### Asset Tools

- shorten the upload zone;
- group time range in one compact section;
- place target frame count, columns, width, and height in a four-column grid;
- place extraction mode, interval, deduplication, and metadata target in a
  compact secondary grid;
- keep explanatory text as an inline note;
- preserve frame selection, animation preview, cleanup controls, and result
  preview sizes.

### Audio Tools

- shorten the upload card after selection;
- group start, end, target LUFS, and output format in one compact grid;
- align normalization with the parameter group;
- keep the process hint compact;
- preserve source and processed audio controls.

### Config Generator

- reduce workspace header and form panel padding;
- preserve the gameplay idea textarea as the main input;
- move example and generation actions closer to the textarea;
- tighten result metadata and export controls;
- preserve table previews and generated content.

### Art Pipeline

- compact asset type, style, engine target, size, count, seed, and profile
  selection grids;
- preserve prompt and negative-prompt text areas;
- shorten reference-image upload zones;
- keep generated images and profile editing readable;
- use compact action and status rows.

### Settings

- group provider, model, timeout, and Base URL using content-aware widths;
- keep API Key and long URL fields flexible;
- group ComfyUI numeric parameters in compact grids;
- reduce tab, panel, test-result, and save-footer height;
- retain clear security and secret-storage messaging.

## Responsive Behavior

Desktop is the primary target.

- Four-column compact grids collapse to two columns at medium widths.
- Two-column grids collapse to one column when labels or controls would become
  cramped.
- Path, URL, prompt, and search fields always receive full usable width.
- No control may become too narrow to display a practical value.
- Existing minimum desktop window constraints remain supported.

## Accessibility and Usability

- Keep visible labels for every editable field.
- Maintain keyboard navigation and native input behavior.
- Keep click targets at least approximately 36 pixels high.
- Do not communicate state using color alone.
- Preserve focus outlines and error proximity.
- Do not hide common controls behind advanced sections in this phase.

## Implementation Strategy

1. Add shared compact spacing, grid, panel, field, hint, and upload styles.
2. Update `WorkspaceHeader`, shared tabs, and common form presentation.
3. Refactor Asset Tools and Audio Tools first as reference implementations.
4. Apply the same primitives to Settings, Art Pipeline, Config Generator,
   Config Manager, and Project Assistant.
5. Finish with Dashboard spacing and cross-page consistency fixes.

Prefer CSS primitives and small class additions over duplicating page-specific
layout rules.

## Verification

- Frontend lint and production build pass.
- Existing backend and frontend behavior remains unchanged.
- Manually inspect every route at the desktop application viewport.
- Verify common Asset Tools and Audio Tools actions fit substantially higher in
  the first viewport.
- Verify compact grids collapse correctly at the minimum supported window
  width.
- Verify text areas, previews, lists, tables, and reports remain readable.
- Verify English and Chinese labels do not overlap or truncate critical
  information.
- Confirm no new page-level horizontal scrolling is introduced.
