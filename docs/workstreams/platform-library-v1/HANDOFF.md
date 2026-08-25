# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `main`
Production branch: `main`
Status: `Photography top-nav canonical motion parity + Cloudflare live green`

## Resume order

1. `AGENTS.md` — especially `Reusable UI module contract`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. this file
5. production `main`

## Product source of truth

Photography Public page `/` is the completed reference for `top-chapter-navigation`.

The Library must not merely reproduce its appearance. The accepted top-nav runtime includes:
- shared `PhotoPublicModuleSource.navigation.render`
- `chapter-navigation.js` active chapter/navigation behavior
- `liquid-controller.js` canonical BREEZE liquid indicator motion
- mobile/native pan behavior from navigation CSS
- desktop nav rail geometry/surface CSS

Library, Editor and Public must use those same owners. Preview-only interaction code is forbidden.

## Regression fixed

The Library already used the shared renderer, but two runtime parity defects had made the result behave like a visual-only approximation:

1. `module-preview-v1.js` can remount the module after parent props sync. The old `liquid-controller.js` did not reliably attach to the replacement `.nav-scroll`, so the Library could lose the real liquid/BREEZE owner.
2. `PlatformModuleStyleRuntime` applied generic motion variables even when Library controls were at defaults, overriding Photography Public's distance-aware BREEZE transition.

Registry provenance also omitted liquid/native-pan owners and CI coverage omitted relevant UI/navigation/desktop paths.

These defects are now fixed in production `main`.

## Production changes

### PR #27 — canonical motion repair

- `public/assets/js/ui/liquid-controller.js`
  - watches newly mounted `.nav-scroll` nodes across shared runtime
  - reattaches the same canonical controller after Library/Editor remounts
  - no Library-only motion implementation added
- `public/assets/js/platform-modules/module-style-runtime-v1.js`
  - default top-nav motion preserves Photography Public BREEZE
  - motion override applies only after response/overshoot/durationScale is changed
  - explicit typography edits override Photography `!important` baseline correctly
- `public/assets/js/platform-modules/photo-core-modules-v1.js`
  - complete top-nav `ownerFiles` include liquid controller, native pan, mobile nav and desktop nav runtime
- Public and module-preview cache markers load `liquid-controller.js?v=2`
- focused `scripts/check-top-nav-runtime-parity.mjs` added
- static boundary and Actions path/syntax coverage expanded to the complete interaction owner set

### PR #28 — live parity gate

- live deploy entry marker made version-independent
- live workflow trigger expanded to actual `ui/navigation/desktop` JS/CSS owners
- Cloudflare live workflow executes the same focused Public ↔ Library top-nav parity script
- parity result is persisted in live QA report

### PR #29~#32 — stale live QA repair

The product runtime was not changed to satisfy old tests. Only stale live QA assumptions were corrected:
- legacy filter selector → current canonical filter module DOM
- Editor root → `.editor-lab`
- Editor live verification route → canonical `/editor-lab/`
- hydrated admin-shell runtime title → `블록 에디터`

## Final verification

Final Cloudflare verification:
- workflow: `Platform Live Deploy Check`
- run number: `30`
- run id: `32875297085`
- source code SHA: `a77195ba5d4222d32f0a0eefb2275642201e14cb`
- result: `success`

Live checks passed:
- canonical UI Library entry
- 6 approved canonical module assets
- registry-driven UI Library
- dark/mobile shared preview
- Block Lab research-only boundary
- Editor approved-module boundary
- Public top navigation canonical module migration
- focused top-nav runtime parity

Focused live parity result:
`Photography/Public and Library share canonical liquid owner, native pan, remount recovery, and Breeze easing.`

The workflow recorded the final `pass` result under:
`docs/workstreams/platform-library-v1/qa/live-deploy-status.json`

Main `Platform Library Checks` after the final runtime-title correction also completed green, including the static boundary, JavaScript syntax and Chromium `Compare Library against actual public runtime` steps.

The latest `main` may be one bot status commit ahead of the verified source SHA because the live workflow writes `live-deploy-status.json` back with `[skip ci]`. That status-only commit does not change product runtime.

## Exact next action

1. Continue PC/mobile/light/dark visual QA across all approved modules.
2. Audit every remaining visible Library setting for a measurable canonical runtime effect; implement or remove/disable any no-op control.
3. Keep Photography Public as the completion standard whenever an extracted Photography module differs in behavior or appearance.
4. After the whole Library → Editor → Public flow is usable and user-approved, archive workstream QA records to Drive while permanent specs/runtime remain in Git.
