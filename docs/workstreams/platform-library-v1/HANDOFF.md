# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/admin-shell-library-navigation-v2`
Production branch: `main`
Status: `unified admin shell + Library navigation UX in QA`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/ARCHITECTURE-COMPLIANCE-AUDIT-V1.md`
4. `docs/workstreams/platform-library-v1/TASKS.md`
5. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
6. this file
7. confirm current branch/PR CI before merge

## Architecture invariant

Photography is NOT the permanent source/upstream for the UI Library.

Correct final model:

`Canonical Module Registry → UI Library → Block Editor → Completed Page → Public/Portable Export`

Photography is only an initial bootstrap extraction/parity reference. `source: public-extracted` records historical provenance, not a live dependency.

Final Photography state:

`Photography legacy page → canonical extraction/parity complete → first Completed Page snapshot → visible/editable/duplicable from Block Editor completed-page list`

After that migration, Library must not reread Photography page DOM/CSS/runtime as its source of truth.

## Current production baseline

PR #43 `Replace Library top catalog with canonical module tree` merged:
`431ed3360039f3b10662f151587b6ca7c45340a9`.

Live verification bot record after #43:
`444ead0a3ef94855697b147c06aeece1bbd42e38`.

PR #43 delivered:
- Registry-driven left module tree
- shared bottom-popup shell
- screen-mode composition from canonical filter-chip module
- horizontal-rail bottom paint runway
- Photography bootstrap-only / Completed Page architecture correction

## Approved module boundary

Photography bootstrap-origin canonical set (`public-extracted` = provenance only):
- `top-chapter-navigation`
- `filter-chip-rail`
- `horizontal-card-rail`
- `collection-bottom-sheet`
- `device-handoff-accordion`
- `floating-action`

Portable Library + Editor set:
- `horizontal-rail`
- `accordion`
- `bottom-sheet`

Platform composition:
- `screen-mode-selector`

Do not connect portable/new modules to the current Photography final Public experience without explicit user approval.

## Current branch changes

1. Library left navigation UX
- Keep the actual Registry `[data-kit-ui]` selector nodes; no cloned module catalog.
- Redesign hierarchy with category SVG icons, clear active/open/closed states, chevrons and stronger spacing.
- Persist group open/closed state.
- Module tree body owns vertical scrolling so the catalog can grow to many modules.

2. Collapse / resize repair
- Root cause of text leakage: old collapse set `--admin-sidebar-w:0`, which also collapsed the shell width before `translateX(-100%)`.
- New contract separates actual shell width (`--library-admin-sidebar-w`) from page offset (`--admin-sidebar-w`).
- Collapsed shell keeps its real width and fully translates offscreen.
- Reopen control is a fixed left-edge center handle.
- Drag resize/collapse remains; width is shared through `platformAdminSidebarWidthV1` across management routes.
- Old broken Library state key is retired in favor of `platformLibrarySidebarV2`.

3. Preview controls placement
- The real Library `#kitTheme`, `#kitViewport`, and `#kitSettings` nodes are moved into one `.builder-kit-preview-toolbar` directly above the canvas.
- No duplicate preview controls are created.
- These controls remain edit-target state, not admin chrome state.

4. Admin-only theme
- Add `platformAdminThemeV1`: light / dark / system.
- Admin theme changes only `data-admin-theme`, `data-admin-theme-resolved` and admin chrome CSS tokens.
- Library `platformLibraryThemeV3` / iframe theme remain independent.
- Block Lab and Editor `data-theme` preview roots remain independent.
- Admin theme control lives in the shared shell footer and persists across management routes.

5. Shared management chrome
- Add `public/assets/styles/admin/admin-unified-v2.css`.
- Same admin token system and shell state apply to Library, Block Lab, Editor and QA.
- Local tool-specific surfaces remain, but their management chrome uses the shared token layer.
- Block Lab specimen canvas, Editor page canvas and Library iframe keep their own preview theme ownership.

6. QA
- Existing `scripts/check-library-module-family-controls-v1.mjs` now also verifies:
  - icon hierarchy and real Registry button ownership
  - preview toolbar node placement
  - admin-dark / preview-light isolation
  - preview theme cannot mutate admin theme
  - collapsed shell keeps width and fully exits viewport
  - reopen and drag resize
  - shared width persistence
  - admin theme/width continuity across Library → Block Lab → Editor
  - target preview themes remain light across those route changes
- Architecture workflow now watches admin shell/style, Block Lab and QA paths too.

## Current branch QA requirement

Before merge:
- `Platform Library Architecture Checks` must pass with the new admin UX/theme isolation assertions.
- existing `Platform Library Checks` must pass.
- existing `Platform Library Generalization Checks` must pass.
- Library and Editor approved module IDs must remain aligned.
- no canonical module owner or current Photography final Public runtime is changed by this branch.

## Exact next action

1. Open PR for `fix/admin-shell-library-navigation-v2`.
2. Run Architecture + Library + Generalization CI.
3. Fix only genuine product/QA regressions until all required checks are green.
4. Merge to main and verify Cloudflare live Library:
   - left hierarchy visuals
   - no text leakage after collapse
   - reopen/drag behavior
   - preview controls above canvas
   - admin dark independent from preview light/dark
5. Open Block Lab and Block Editor and verify shared admin shell design/theme/width remains consistent.
6. Continue full 10-module PC/mobile × light/dark visual matrix.
7. Then implement Completed Page registry/list and migrate Photography as the first Completed Page.

Do not change the current Photography final public experience without explicit user approval.
