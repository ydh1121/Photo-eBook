# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `main`
Production branch: `main`
Status: `runtime feedback fixes merged + Cloudflare live green`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
5. this file
6. confirm current `main` against the live status record

Private business context remains Drive-only per `AGENTS.md`. Do not copy strategy text, Drive IDs, or private document URLs into Git.

## Current production state

PR #39 `Fix Library runtime controls and preserve rail content` merged as:
`12e3deb7996c46647a589e9bc7bb7ff43683cd44`.

PR #40 `Align live Library gate with portable modules and feedback QA` merged as:
`7153464f7acbefdc49d67bb4cb243f38577a3138`.

Cloudflare live status bot then committed:
`a0383b91aeda69d0386a1422915b47cb65227f09`.

The final live run for this unit is:
- workflow: `Platform Live Deploy Check`
- run number: `37`
- run ID: `32949387548`
- result: PASS

Main regression runs are also green:
- `Platform Library Generalization Checks` run #14: PASS
- `Platform Library Checks` run #429 after PR #39: PASS
- `Platform Library Checks` run #431 after PR #40: PASS

## Approved module boundary

Photography / Public-capable canonical set:
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

The portable 3 remain intentionally excluded from the Photography final Public consumer. Do not connect them to final Public without explicit user approval.

## User feedback issues fixed and live-proven

### Top navigation family

The old exhaustive test only proved a family dataset changed. The actual iOS Flat skin could be repainted by later Photography liquid `!important` CSS.

Shared canonical fix:
`public/assets/styles/platform-modules/top-nav-style-families-v1.css`.

- iOS Liquid stays the Photography canonical/BREEZE default.
- iOS Flat and Material have real shared surface/shape/active-state CSS.
- module-scoped selectors outrank later liquid baseline rules.
- the liquid indicator is hidden for non-liquid families.
- the CSS is listed in Registry `ownerFiles` so Public Snapshot can resolve the same owner when that module is used.

Live Chromium proof:
`liquid → iOS Flat → Material have measurable skin differences`.

### Filter rail horizontal interaction

`filter-chip-rail` already had native `overflow-x:auto`, but PC mouse drag was missing.

Canonical fix lives in `hydrateGenericFilterRail()` inside:
`public/assets/js/platform-modules/photo-core-modules-v1.js`.

- mobile: browser-native `pan-x`
- PC: pointer mouse drag
- drag completion: temporary click suppression to avoid accidental selection

Live Chromium proof:
`PC mouse drag 190px + mobile native pan-x`.

### Preview ghost rectangle

The faint rectangle was the Library iframe shell's decorative `box-shadow`, not a module border.

The Library preview frame decoration was removed while component-owned shadows remain.

Live Chromium proof:
`no artificial iframe shadow`.

### Portable horizontal rail content loss

The v1 Library primitive editor dropped fields while normalizing/reordering items.

Current editor:
`public/assets/js/ui-dashboard/library-primitive-content-editor-v2.js`.

It preserves and edits:
- eyebrow
- title
- description
- tags / badges
- meta
- image / imageAlt
- actionLabel / actionUrl

Live Chromium proof:
`badges/meta/action survive live editing and reorder`.

### Missing primitive functional controls

Accordion Library UI now exposes:
- `singleOpen`
- `openFirst`
- `openIds`
- item meta

Bottom sheet Library UI now exposes:
- initial open state
- launcher visibility/label
- backdrop dismiss
- primary action
- secondary action

Both passed live Chromium checks.

## Canonical ownership conclusion

The current Library work is not a visual imitation architecture.

Photography modules are mounted from the same `PlatformModuleRegistry` render/hydrate definitions across Library/Editor/Public.

The three portable primitives are mounted from one shared Registry render/hydrate owner across Library/Editor and do not import Block Lab runtime.

However, the Library must not yet be described as fully complete. Remaining work includes full responsive/theme visual matrix, continued content/state completeness audit, and Portable Export dependency packaging.

## Live QA contract updated in PR #40

The old live checker incorrectly assumed the whole Library still contained only the 6 Photography modules. It now separately verifies:
- 6 Photography/Public modules
- 3 portable Library/Editor modules
- portable Public consumer remains closed

The live workflow also directly runs `scripts/check-library-runtime-feedback-v1.mjs` against `https://photo-ebook.pages.dev`.

The live focused feedback gate passed all 7 checks.

## Exact next action

1. Run the full 9-module visual matrix: PC/mobile × light/dark, with top-nav/filter family variants included.
2. During that pass, compare every Registry content/state/style field with the Library inspector and record any remaining missing control or no-op.
3. Fix findings only in canonical shared owners or remove/disable invalid Library controls; do not add preview-only implementations.
4. After Library visual/runtime stabilization, begin SEO/GEO page metadata wiring in Editor/page model/runtime.
5. Then proceed to completed-page registry/edit/duplicate and dependency-aware Portable Export/new-project smoke test.

Do not connect new portable primitives or otherwise change the Photography final Public experience without explicit user approval.
