# Platform Library V1 Handoff

Updated: 2026-08-24 KST
Production branch: `main`
Architecture reset merge: `80dc5a835b3515e07c7b53b2f69164664d7dfc82`
Live verification: `pass`
Status: `isolated admin component runtime deployed / user browser review`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current `main`

## Why the architecture was reset

The 2026-08-24 user recording showed that the previous UI Library had become a patch stack.

Retired flow:
`full sandbox page → execute collection runtime → open UI → extract/reparent DOM → close original UI → repair with patches`

Observed failures:
- hero/full-page flash while changing UI component;
- bottom sheet disappeared after tab changes;
- filter rail, floating selector and legacy indicator competed for ownership;
- Mutation/state repair scripts reacted to each other;
- management UI drifted away from the original reusable-editor goal.

Do not restore this extraction flow.

## Current UI Library architecture

`builder-library-kit-v3.js → /ui-dashboard/component-preview/ → component-preview-v1.js`

Parent management owner:
- component selection;
- theme / viewport;
- management config storage;
- component state;
- filter sample items and per-item overrides;
- inspector controls.

Preview owner:
- direct component DOM rendering;
- component-local interaction;
- state feedback to parent.

The preview does not load the full sandbox page and does not extract or reparent page DOM.

## Current files

- `public/ui-dashboard/component-preview/index.html`
- `public/ui-dashboard/component-preview/component-preview-v1.js`
- `public/assets/styles/ui-dashboard/component-preview-v1.css`
- `public/assets/js/ui-dashboard/builder-library-kit-v3.js`
- `public/assets/styles/ui-dashboard/builder-kit-v3.css`
- `scripts/check-ui-dashboard-browser-v5.mjs`

`builder-entry-audit-v1.js` library mode boots only:
1. `builder-global-chip-manifest-v1.js`
2. `builder-library-kit-v3.js`

## Removed patch stack

Removed by PR #13:
- `builder-library-kit-v2.js`
- `builder-global-chip-kit-v1.js`
- `builder-library-canonical-state-v1.js`
- `builder-library-state-sync-v1.js`
- `builder-library-notes-v1.js`
- `builder-kit-v2.css`
- `builder-filter-chip-live-v2.css`
- `bottom-sheet-parity-v1.js`
- `filter-chip-legacy-guard-v1.js`
- `filter-chip-live-runtime-v2.js`
- `filter-chip-live-runtime-v3.js`

## Filter chip ownership

- `.collection-filters` = horizontal scroll owner
- `.component-chip-active` = sibling active overlay above the rail
- no in-rail active indicator owner
- no preview drag momentum patch

Management controls:
- add sample chip
- delete last sample chip
- restore defaults
- click chip to select it
- per-chip family: inherit / Material / iOS Flat / iOS Liquid
- rail four-side padding
- chip X/Y padding and gap

Shared defaults normalized by `builder-global-chip-manifest-v1.js`:
- iOS Flat
- `#437ce7`
- gap `9px`
- rail inset `5.5px`
- chip Y `7px`
- chip X `10px`

Top navigation inherits shared filter-chip family/accent through management preview config.

## Bottom sheet ownership

The preview directly renders one stable `.collection-sheet`.

States:
- all
- video
- article
- question
- settings

Tab changes keep the same sheet context and change only internal state/content. There is no production-like collection hub open/close or `#collectionLayer` reparenting.

Internal tab clicks sync parent state through `platform-preview-state-change`.

## Sandbox page mode

`/ui-dashboard/sandbox/` is page-builder dummy canvas only.

`sandbox-kit-v4.js` now contains page-only behavior:
- inline collection open helper;
- editor nav pin fallback.

`builder-runtime-audit-loader-v1.js` no longer injects filter-preview or bottom-sheet-preview repair scripts.

## Page builder / ads

PR #12 work remains in page mode:
- PC side ads use outer content gutter direction;
- hero-dependent slot hide/show was removed by intent;
- `캔버스 넓게` hides the admin sidebar for wider inspection.

The architecture reset did not connect management config to the public site.

## QA result

Canonical library suite: `scripts/check-ui-dashboard-browser-v5.mjs`

PR #13 Platform Library Checks:
- run: `32678705117`
- result: `success`

Coverage:
- no full sandbox `#app` or hero in component preview;
- no extraction/filter/bottom-sheet repair scripts loaded;
- six components × White/Dark/System × PC/Mobile;
- filter rail + sibling active overlay;
- per-chip override inheritance;
- bottom sheet all→video→article→question→settings→all;
- preview state ↔ parent state;
- device accordion state;
- card rail overflow.

## Live deployment

Live deployment source:
- merge SHA: `80dc5a835b3515e07c7b53b2f69164664d7dfc82`
- dashboard entry: `builder-entry-audit-v1.js?v=12`
- preview marker: `__platformComponentPreviewV1`
- workflow run: `32678756008`
- status bot commit: `85fb5577b797d94f8505d7fec68a2c5e8016ab72`
- result: `pass`

Live checker confirmed:
- isolated component preview boot;
- no full-page sandbox/repair patch in preview;
- filter rail scroll + sibling overlay;
- per-chip override;
- stable bottom sheet through all states.

## Production connection boundary

Public-site connection remains the final task by explicit user instruction.

Until final management approval:
- do not make public runtime read management config;
- do not publish unapproved presets;
- do not replace the production photography renderer.

After explicit final approval only:
- define approved-config publish boundary;
- connect approved settings to public runtime;
- rerun public PC/mobile/theme regression QA.

## Exact next action

1. User checks the newly deployed UI Library in a real browser.
2. Any visual/interaction regressions are fixed only inside the V3 owner architecture; do not restore retired patch files.
3. Once UI Library is accepted, continue the Lego/module page-builder UX work in `화면 구성`.
4. Public production connection stays last.
