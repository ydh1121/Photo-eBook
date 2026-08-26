# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/library-tree-shared-primitives-audit-v1`
Production branch: `main`
Status: `Library tree/shared primitive remediation merge candidate`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/ARCHITECTURE-COMPLIANCE-AUDIT-V1.md`
4. `docs/workstreams/platform-library-v1/TASKS.md`
5. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
6. this file
7. confirm current branch/PR CI before merge

## Architecture correction confirmed 2026-08-26

Photography is NOT the permanent source/upstream for the UI Library.

Correct final model:

`Canonical Module Registry → UI Library → Block Editor → Completed Page → Public/Portable Export`

Photography is only an initial bootstrap extraction/parity reference. `source: public-extracted` records historical provenance, not a live dependency.

Final Photography state:

`Photography legacy page → canonical extraction/parity complete → first Completed Page snapshot → visible/editable/duplicable from Block Editor completed-page list`

After that migration, Library must not reread Photography page DOM/CSS/runtime as its source of truth.

## Current production baseline

PR #39 `Fix Library runtime controls and preserve rail content` merged:
`12e3deb7996c46647a589e9bc7bb7ff43683cd44`.

PR #40 `Align live Library gate with portable modules and feedback QA` merged:
`7153464f7acbefdc49d67bb4cb243f38577a3138`.

Last known production live check before this branch:
- `Platform Live Deploy Check` run #37 (`32949387548`): PASS
- main `Platform Library Generalization Checks` run #14: PASS
- main `Platform Library Checks` run #431: PASS

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

1. Library module navigation
- Replace top horizontal module chip catalog with Registry-driven hierarchical sidebar tree.
- Move/reconcile the actual `[data-kit-ui]` selector buttons rather than cloning module implementations.
- Add group hierarchy for navigation, horizontal content, accordion, bottom popup, action and display.
- Add desktop collapse/reopen and drag resize/collapse.
- Add narrow-screen drawer path.

2. Bottom popup ownership
- Add shared bottom-popup shell owner derived from the finished collection-sheet shell.
- Make `collection-bottom-sheet` and generic `bottom-sheet` consume the shared shell contract.
- Remove generic bottom-sheet duplicate lookalike shell CSS.
- Generic default primary action closes the sheet when no custom action is configured.

3. Screen mode ownership
- Remove standalone segmented-control skin ownership.
- `screen-mode-selector` composes the canonical `filter-chip-rail` Registry module for White/Dark/System selection.

4. Horizontal rail paint
- Add canonical vertical paint runway so card shadow is not clipped at the bottom of the scroller.

5. Preview isolation
- Hide unrelated Photography page-context screen-mode UI from device-handoff module preview.
- Long-term remaining work: make shared preview dependency-driven from module `ownerFiles` instead of broadly preloading Photography runtime.

6. Architecture contract
- Added `ARCHITECTURE-COMPLIANCE-AUDIT-V1.md`.
- Updated canonical pipeline so Photography is bootstrap-only and Completed Page migration is the final state.
- Saved module/preset contract stores module id/version + content/style/state snapshots, never copied rendered HTML/CSS.

## Current branch QA requirement

Before merge:
- focused Library family/architecture Chromium check must pass.
- existing module pipeline/settings/runtime regression workflows must pass.
- Library and Editor approved module IDs must remain aligned.
- no new Block Lab direct runtime import is allowed.

After merge:
- verify Cloudflare live deployment.
- continue full 10-module PC/mobile × light/dark matrix.

## Exact next action after this branch is merged

1. Run full 10-module visual matrix and exhaustive content/state/style control audit.
2. Implement Completed Page registry data model and Block Editor completed-page list.
3. Convert Photography to the first non-destructive canonical Completed Page snapshot.
4. Verify Photography from the completed-page list using the same canonical module owners.
5. Once migration parity is proven, remove any remaining assumption that Photography is Library source/long-term QA upstream.
6. Implement reusable completed module/preset storage.
7. Continue SEO/GEO/page hierarchy and dependency-aware Portable Export/new-project smoke test.

Do not change the current Photography final public experience without explicit user approval.
