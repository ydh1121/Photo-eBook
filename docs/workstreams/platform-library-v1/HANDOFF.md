# Platform Library V1 Handoff

Updated: 2026-08-24 KST
Active branch: `refactor/admin-ui-component-runtime-v1`
Production branch: `main`
Current PR: `#13`
Status: `admin UI architecture cleanup / production connection deferred`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current branch HEAD

## Why this refactor exists

The user's 2026-08-24 browser recording exposed an architectural failure in the previous UI Library.

Previous flow:
`full sandbox page → execute collection runtime → open UI → extract/reparent DOM → close original UI → apply repair patches`

This produced:
- full-page/hero flashes while switching UI components;
- bottom sheet disappearing after tab changes;
- filter rail, floating selector and legacy indicator competing for ownership;
- multiple mutation/state repair scripts reacting to one another;
- management code drifting away from the original goal of a simple reusable UI editor.

Do not fix those symptoms by restoring another patch layer.

## New architecture

UI Library:
`builder-library-kit-v3.js → /ui-dashboard/component-preview/ → component-preview-v1.js`

The management parent owns:
- selected component;
- theme and viewport;
- management config storage;
- component state;
- filter sample items and per-item overrides;
- inspector controls.

The component-preview iframe owns:
- direct preview DOM rendering;
- component-local interaction;
- state feedback to the parent.

It does NOT load the full sandbox page and does NOT extract/reparent production-like DOM.

## New files

- `public/ui-dashboard/component-preview/index.html`
- `public/ui-dashboard/component-preview/component-preview-v1.js`
- `public/assets/styles/ui-dashboard/component-preview-v1.css`
- `public/assets/js/ui-dashboard/builder-library-kit-v3.js`
- `public/assets/styles/ui-dashboard/builder-kit-v3.css`
- `scripts/check-ui-dashboard-browser-v5.mjs`

## Removed library patch stack

Removed on PR #13:
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

`builder-entry-audit-v1.js` library mode now boots only:
1. `builder-global-chip-manifest-v1.js`
2. `builder-library-kit-v3.js`

## Filter chip ownership

Filter preview structure:
- `.collection-filters` = horizontal scroll owner
- `.component-chip-active` = sibling overlay above the rail
- no in-rail active indicator owner
- no preview drag-momentum patch

Shared defaults currently normalized by `builder-global-chip-manifest-v1.js`:
- family: iOS Flat
- accent: `#437ce7`
- gap: `9px`
- rail inset: `5.5px` each side
- chip Y: `7px`
- chip X: `10px`

Filter sample controls:
- add chip
- delete last chip
- restore defaults
- click a chip to select it
- per-chip family: inherit / Material / iOS Flat / iOS Liquid

Top navigation receives the shared filter-chip family/accent via the parent preview config. It does not own a second common Chip style setting.

## Bottom sheet ownership

The preview directly renders one stable sheet.

States:
- all
- video
- article
- question
- settings

Tab change rule:
- do not open/close the production-like collection hub;
- do not move `#collectionLayer` between parents;
- keep one `.collection-sheet` and replace its internal state/content only.

Internal preview tab clicks send `platform-preview-state-change` so the parent buttons stay in sync.

## Sandbox page mode

`public/ui-dashboard/sandbox/` remains the page-builder dummy canvas only.

`sandbox-kit-v4.js` was stripped down to page-only behavior:
- inline collection open helper;
- editor nav pin fallback.

It no longer has `?preview=` component extraction logic.

`builder-runtime-audit-loader-v1.js` no longer injects filter-preview or bottom-sheet-preview repair scripts.

## Page builder / ads

PR #12 page-mode work remains:
- PC side ads based on outer content gutter rather than currently visible chapter;
- no hero-dependent hide/show intent;
- `캔버스 넓게` for hiding the admin sidebar while inspecting the page.

The current refactor is primarily UI Library architecture. Do not mix production publish work into it.

## QA

`check-ui-dashboard-browser-v5.mjs` is the canonical library browser suite for this architecture.

It checks:
- component preview contains no full sandbox `#app` or hero;
- no sandbox extraction/filter/bottom-sheet repair runtime is loaded;
- six components across White/Dark/System and PC/Mobile;
- filter rail and active overlay ownership;
- sample filter insertion;
- per-chip override inheritance;
- stable bottom sheet across all states;
- internal state → parent state sync;
- device accordion state sync;
- real horizontal card overflow.

The old `check-admin-ui-parity-v3.mjs` is no longer run by the main Platform Library workflow because it asserted the retired DOM-extraction architecture.

Current PR #13 final validation may be superseded by newer commits. Always fetch the latest PR head SHA and its latest `Platform Library Checks` run before merging.

## Live deployment checker

`scripts/check-live-ui-dashboard-deploy.mjs` now expects:
- dashboard entry `builder-entry-audit-v1.js?v=12`;
- live asset marker `__platformComponentPreviewV1`;
- isolated filter preview without full sandbox/repair scripts;
- filter rail + sibling active overlay;
- per-chip override;
- stable bottom sheet through all five tabs.

## Production connection boundary

The user explicitly set public-site connection as the final task.

Until final management approval:
- do not make public `photo-ebook.pages.dev` runtime read management config;
- do not publish unapproved presets/configs;
- do not replace the production photography renderer.

After explicit final approval only:
- add a publish boundary for approved config;
- connect approved UI settings to production;
- rerun public PC/mobile/theme regression QA.

## Exact next action

1. Fetch PR #13 latest head and latest Platform Library Checks.
2. Fix only failures in the new isolated component architecture; do not resurrect removed patch owners.
3. When green, merge PR #13 to `main`.
4. Wait for Cloudflare Pages and verify the management route with the v12 live checker.
5. Have the user re-check the real browser before moving on to the Lego/page-builder UX phase.
