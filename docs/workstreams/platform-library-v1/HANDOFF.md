# Platform Library V1 Handoff

Updated: 2026-08-25 KST
Active implementation branch: `fix/library-font-style-contract-v1`
Production branch: `main`
Main at branch start: `a14d56707463b16b0ad97e4f7db47390d91eda5e`
Status: `typography + filter redesign + setting-runtime audit implemented / PR QA pending`

## Resume order

1. `AGENTS.md` — especially `Reusable UI module contract`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. this file
5. branch `fix/library-font-style-contract-v1`

## Permanent product rule added

The repository now explicitly requires:

`Library → Editor → Public`

An approved UI module cannot be accepted because it only looks correct in `/ui-dashboard/`.

- Library/Editor/Public use the same module ID and canonical render/hydrate owner.
- Preview-only copies are forbidden.
- Every visible Library setting must have a measurable canonical runtime effect or be removed/disabled.
- New Editor instances snapshot current Library defaults.
- Existing Editor instances do not reread mutable Library defaults.
- Published pages mount `ui-module` through `PlatformModuleRegistry` and `PlatformModuleStyleRuntime`, never through admin preview/sandbox/iframe.
- Interaction and style effects are checked in Chromium.

This rule is in `AGENTS.md`, not only in the workstream.

## Current branch changes

### Typography

Top navigation and generic filter now expose canonical:
- font family
- font size
- font weight
- letter spacing

Font families:
- system sans
- Apple sans
- Korean sans
- rounded sans

The runtime applies these values directly to real `.nav-chip` and filter button nodes.

### Filter families

One canonical `filter-chip-rail` module has three real runtime families:
- `ios-liquid`
- `ios-flat`
- `material-flat`

`filter-chip-rail` provenance is now valid `platform-core` rather than the invalid alias `platform-canonical` or the false claim `public-extracted`.

Design direction:
- iOS Liquid keeps the production liquid controller.
- iOS Flat is a quiet neutral segmented runway with a raised white active segment.
- Material is an independent tonal/outlined chip group with a small accent dot.

All families use the same live selection logic, ARIA state and `platform-filter-select` event.

### Setting runtime audit

`module-style-runtime-v1.js` now implements previously dead or incomplete controls:
- top nav progress enable/mode/color/opacity
- top nav response/overshoot/duration scale
- nav/filter typography
- card left fade
- card visible/hidden scrollbar
- bottom sheet theme selector
- bottom sheet backdrop visibility
- accordion response
- FAB family and motion

Material does not use backdrop blur. The Library control polish runtime disables that setting while Material is selected rather than presenting a no-op control.

### QA

Static owner/consumer contract:
`scripts/check-platform-module-boundaries.mjs`

Browser E2E:
`scripts/check-platform-module-pipeline-v3.mjs`

The v3 browser QA verifies:
- nav typography changes computed styles
- nav progress settings change actual runtime state
- all 3 filter families switch real runtime sources
- filter click updates state + ARIA
- filter typography/accent changes actual nodes
- menu add reaches the canonical renderer
- card scrollbar + left fade change actual rail
- bottom sheet theme selector changes actual UI
- new Editor filter instance snapshots Library family + typography defaults
- Editor filter remains interactive

## Important latest production history

PR #22 merged earlier at `dd19291c20e2958540215c00c9cf3f629927daed`.

PR #23 `Canonicalize filter chip families and restore collection bulk actions` merged at:
`02548083159ee1a9035a11d6c8a151216dd7d579`

The live-deploy status bot then advanced main to:
`a14d56707463b16b0ad97e4f7db47390d91eda5e`

PR #23's old `Platform Library Checks` failed because its static checker still encoded the obsolete two-family/Material-forbidden contract. This branch replaces that stale checker rather than weakening the new architecture.

## Exact next action

1. Create PR from `fix/library-font-style-contract-v1` to `main`.
2. Run `Platform Library Checks`.
3. Fix any static or Chromium failure based on actual reusable runtime behavior.
4. Review screenshots/artifact for top-nav typography, iOS Flat, Material and representative settings.
5. Merge to main when requested/appropriate and verify Cloudflare live deployment.
