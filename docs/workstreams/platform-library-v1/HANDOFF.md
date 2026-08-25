# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/canonical-top-nav-liquid-motion-v1`
Production branch: `main`
Status: `Photography top-nav canonical motion parity repair / PR QA pending`

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

## Regression found

The Library top-nav used the shared renderer, so it was not a second HTML design copy. Two runtime parity defects still made it behave like a visual-only approximation:

1. `liquid-controller.js` bootstrapped the first nav and then stopped watching. `module-preview-v1.js` can remount the module after parent props sync, replacing that nav DOM. The replacement `.nav-scroll` could therefore lose `__photoLiquidController` and the moving liquid indicator owner.
2. `PlatformModuleStyleRuntime` applied generic motion variables even when Library controls were still at their defaults. Those defaults overrode Photography Public's distance-aware BREEZE transition.

Registry provenance also omitted the liquid/native-pan owners, and CI path coverage omitted `assets/js/ui`, `navigation`, and `desktop`, so the complete interaction owner was not being guarded.

## Changes on current branch

- `public/assets/js/ui/liquid-controller.js`
  - canonical owner now watches for newly mounted `.nav-scroll` nodes anywhere in the shared runtime DOM
  - same controller reattaches after Library/Editor module remounts
  - no Library-specific selector or imitation motion was added
- `public/assets/js/platform-modules/module-style-runtime-v1.js`
  - default top-nav motion preserves Photography Public BREEZE
  - response/overshoot/durationScale override only after the user changes a motion control
  - typography settings now use canonical inline `!important` values so they can override Photography baseline CSS when explicitly edited
- `public/assets/js/platform-modules/photo-core-modules-v1.js`
  - top-nav `ownerFiles` now records liquid controller, native pan, mobile nav, desktop nav rails/corrections
- `public/index.html`
  - canonical liquid owner cache marker -> `v=2`
- `public/ui-dashboard/module-preview/index.html`
  - canonical liquid owner -> `v=2`
  - module definitions -> `v=9`
  - style runtime -> `v=6`
- `public/ui-dashboard/index.html`
  - module definitions -> `v=9`
- `scripts/check-top-nav-runtime-parity.mjs`
  - Photography Public and Library both must own a live canonical liquid controller
  - native pan must match
  - Library remount must recover the same controller
  - default Library easing must match Photography BREEZE
- `scripts/check-platform-module-boundaries.mjs`
  - complete top-nav owner set is now statically required
- `.github/workflows/platform-library-checks.yml`
  - UI/navigation/desktop JS and CSS owners now trigger checks
  - those JS directories are included in syntax checks
  - focused top-nav parity runs before the full v3 module pipeline

## Existing CI blocker being repaired in same branch

The last main `Platform Library Checks` failed before reaching later assertions with:

`top-nav font size is a no-op`

The reason was Photography CSS using `!important` while `PlatformModuleStyleRuntime.applyTypography()` wrote normal inline declarations. The current branch changes those explicit Library/Editor style overrides to inline important declarations. Reset still removes the inline properties and returns to the Photography baseline.

## Exact next action

1. Create a PR from `fix/canonical-top-nav-liquid-motion-v1` to `main`.
2. Run `Platform Library Checks`.
3. Fix focused top-nav parity first if it fails.
4. Continue through the existing full v3 module pipeline until green.
5. Merge only after static + Chromium checks are green, then verify Cloudflare live behavior.
