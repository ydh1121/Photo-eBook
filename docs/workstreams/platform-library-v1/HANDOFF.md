# Platform Library V1 Handoff

Updated: 2026-08-27 KST
Active implementation branch: `refactor/module-dependency-screen-mode-filter-v1`
Production branch: `main`
Production baseline before this branch: `2fb2ec220c5515c096520ff1e0ed2ee8b1f419b8`
Status: `screen-mode → filter-chip canonical dependency refactor in PR QA preparation`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/library/platform-modules/MODULE-DEPENDENCY-CONTRACT-V1.md`
4. `docs/workstreams/platform-library-v1/ARCHITECTURE-COMPLIANCE-AUDIT-V1.md`
5. `docs/workstreams/platform-library-v1/TASKS.md`
6. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
7. this file
8. confirm current branch/PR CI before merge

## Architecture invariant

Photography is NOT the permanent source/upstream for the UI Library.

Correct final model:

`Canonical Module Registry → UI Library → Block Editor → Completed Page → Public/Portable Export`

A reusable module must not visually imitate another canonical module. If it consumes another module's structure or behavior, the relation is declared in `PlatformModuleRegistry.dependencies` and the child is rendered/hydrated through Registry dependency APIs.

Module dependency and file ownership are separate:

- `dependencies`: canonical module-to-module relation
- `ownerFiles`: JS/CSS/assets owned by a module/runtime

Portable Export must follow the Registry dependency closure instead of guessing transitive files.

## Current production baseline

The previous production line completed the canonical/admin parity and live deploy QA fixes through PR #52.

Current `main` before this branch:
`2fb2ec220c5515c096520ff1e0ed2ee8b1f419b8`

That SHA is the live verification record commit after merge `5026da99dbb17b02730bbfa578fcf64cd2cc07a6`.

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

Current required dependency:

`screen-mode-selector --composition/required--> filter-chip-rail`

Do not connect portable/new modules to the current Photography final Public experience without explicit approval. The existing Photography collection settings may mount `screen-mode-selector` because that module is already an approved public-capable composition.

## Current branch changes

1. Registry dependency graph
- Add normalized `dependencies` to module definitions.
- Supported kinds: `composition`, `behavior`, `data`.
- Reject self-dependency and duplicate dependency IDs.
- Add `resolveDependency()`, `renderDependency()`, `hydrateDependency()`.
- Add `dependencyClosure()` for dependency-first transitive resolution.
- Add `validateDependencyGraph()`.
- Reject missing required dependencies, consumer-boundary violations, and circular dependency graphs.
- Include dependency provenance in `provenance()`.

2. Screen mode canonical composition
- Remove the duplicate Screen Mode chip renderer/hydrator from `portable-primitives-extension-v2.js`.
- Register Screen Mode in `portable-primitives-composition-v3.js`.
- Screen Mode owns only title/description and `light | dark | system` semantic state.
- Actual chips are rendered by canonical `filter-chip-rail` through `renderDependency()`.
- Actual filter interaction is hydrated through `hydrateDependency()`.
- `data-screen-mode-value` remains a non-visual compatibility alias only.

3. Filter motion ownership
- `public/assets/js/ui/liquid-controller.js` exposes `PhotoLiquidController.attachFilterRail()`.
- The canonical filter module attaches the same liquid controller when mounted standalone or inside Screen Mode.
- Moving indicator, Breeze overshoot, active geometry and remount repair stay in the shared motion owner.
- Screen Mode CSS may control composition geometry only; it must not paint its own active pill or motion.

4. Collection settings composition
- Photography collection settings bridge mounts the same `screen-mode-selector` through Registry with `consumer:'public'`.
- The bridge validates the public dependency closure before mount.
- Legacy `.theme-setting-card` nodes are placement/migration debris only and are pruned.
- `collection-bottom-sheet.themeSelector` now targets the actual `[data-collection-screen-mode-slot]` through `module-style-runtime-composition-v1.js`.

5. Consumer generation alignment
- Library, shared preview, Editor and Photography Public now load the same transitive dependency-aware Registry generation.
- Editor validates the dependency graph before exposing `ui-module` variants.
- Cache versions were bumped for Registry/extension/bridge loader paths changed by this refactor.

6. QA contracts
- `scripts/check-platform-module-boundaries.mjs` now checks dependency graph APIs, composition ownership, style-owner separation, cache generation alignment and Editor graph validation.
- `scripts/check-canonical-admin-parity-v1.mjs` checks Screen Mode's real nested `filter-chip-rail`, moving liquid indicator and Breeze easing.
- `scripts/check-live-ui-dashboard-deploy.mjs` checks the same dependency graph and runtime behavior on deployed Pages.
- Existing Library exhaustive QA already targets `[data-collection-screen-mode-slot]` for `themeSelector`.

## Current branch QA requirement

Before merge, all triggered checks must be green. At minimum:

- `Canonical Admin Parity`
- `Platform Library Architecture Checks`
- `Platform Library Generalization Checks`
- `Platform Library Checks`

Required behavior assertions:

- standalone Screen Mode contains exactly one canonical `filter-chip-rail` child.
- collection popup Screen Mode contains the same canonical child.
- selecting Dark moves `.collection-v33-indicator` with non-zero duration and canonical Breeze overshoot.
- Screen Mode CSS does not recreate active-chip paint/state/motion.
- `dependencyClosure('screen-mode-selector', consumer)` includes `filter-chip-rail`.
- Library / Editor / Public consumer boundaries remain valid.
- `themeSelector=false` hides the actual canonical collection Screen Mode slot.
- no mobile behavior regression is introduced.

## Exact next action

1. Open a PR from `refactor/module-dependency-screen-mode-filter-v1` to `main`.
2. Run all triggered GitHub Actions.
3. Do not merge while any gate is failing.
4. Fix genuine product/contract regressions on the same branch and rerun.
5. When all PR gates are green, merge with the verified head SHA.
6. Verify `main` Actions and Cloudflare Pages deployment.
7. Confirm live `/ui-dashboard/?ui=screen-mode-selector` and collection settings use the same nested filter module and motion owner.
8. After this refactor is complete, continue the remaining PC/mobile × light/dark module matrix and then Completed Page work.
