# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/canonical-top-nav-liquid-motion-v1`
Production branch: `main`
Status: `Photography top-nav canonical motion parity green / merge pending`

## Resume order

1. `AGENTS.md` — especially `Reusable UI module contract`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. this file
5. branch `fix/canonical-top-nav-liquid-motion-v1`

## Product source of truth

Photography Public page `/` is the completed reference for `top-chapter-navigation`.

The Library must not merely reproduce its appearance. The accepted top-nav runtime includes:
- shared `PhotoPublicModuleSource.navigation.render`
- `chapter-navigation.js` active chapter/navigation behavior
- `liquid-controller.js` canonical BREEZE liquid indicator motion
- mobile/native pan behavior from navigation CSS
- desktop nav rail geometry/surface CSS

Library, Editor and Public must use those same owners. Preview-only interaction code is forbidden.

## Regression found and fixed

The Library already used the shared renderer, but two runtime parity defects made the result behave like a visual-only approximation:

1. `module-preview-v1.js` can remount the module after parent props sync. The old `liquid-controller.js` did not reliably attach to the replacement `.nav-scroll`, so the Library could lose the real liquid/BREEZE owner.
2. `PlatformModuleStyleRuntime` applied generic motion variables even when the Library controls were at their defaults, overriding Photography Public's distance-aware BREEZE transition.

Registry provenance also omitted the liquid/native-pan owners, and CI coverage omitted the relevant UI/navigation/desktop runtime paths.

## Changes

- `public/assets/js/ui/liquid-controller.js`
  - watches newly mounted `.nav-scroll` nodes across the shared runtime
  - reattaches the same canonical controller after Library/Editor remounts
  - no Library-only motion implementation added
- `public/assets/js/platform-modules/module-style-runtime-v1.js`
  - default top-nav motion preserves Photography Public BREEZE
  - motion override applies only after response/overshoot/durationScale is changed
  - explicit typography edits now override Photography `!important` baseline correctly
- `public/assets/js/platform-modules/photo-core-modules-v1.js`
  - complete top-nav ownerFiles include liquid controller, native pan, mobile nav and desktop nav runtime
- Public and module-preview cache markers load `liquid-controller.js?v=2`
- focused `scripts/check-top-nav-runtime-parity.mjs` added
- static boundary and Actions path/syntax coverage expanded to the complete interaction owner set
- stale full-pipeline selectors corrected; Editor interaction QA now uses actual Preview mode because Edit mode intentionally disables iframe pointer events

## Verified in PR #27

`Platform Library Checks` run #363 is green at code head `fc5b25b7a15d4d7daf205e64aa165644fb625685` before this documentation-only update.

Verified behavior:
- Photography Public and Library both have live canonical liquid controllers
- Library remount recovers the same controller
- native pan behavior matches
- default Library easing matches Photography BREEZE
- top-nav typography/progress controls affect canonical nodes
- filter families, card controls and bottom-sheet controls affect canonical nodes
- Block Editor snapshots Library defaults and canonical interaction works in Editor Preview mode
- full `Compare Library against actual public runtime` passed

## Exact next action

1. Confirm the documentation-only head rerun remains green.
2. Merge PR #27 into `main`.
3. Confirm main `Platform Library Checks` and `Platform Live Deploy Check`.
4. Verify Cloudflare live Photography/Public and Library top-nav BREEZE/native-pan behavior.
5. Continue PC/mobile/light/dark visual QA and remaining no-op control audit.
