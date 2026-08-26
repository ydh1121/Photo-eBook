# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/library-complete-runtime-controls-v1`
Production branch: `main`
Current PR: `#39`
Status: `canonical Library runtime completeness + portable primitive content completeness`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
5. this file
6. compare active branch against `main`

Private business context remains Drive-only per `AGENTS.md`. Do not copy strategy text, Drive IDs, or private document URLs into Git.

## Production baseline before PR #39

`main`: `70a338bc5d52eb965e50faae8ebd7a5831ce391d`.

PR #38 is already merged. It promoted three shared portable primitives:
- `horizontal-rail`
- `accordion`
- `bottom-sheet`

They are approved for Library + Editor and intentionally not connected to Photography final Public. Their `public` consumer remains closed until explicit user approval.

## User runtime feedback reproduced in code

1. Top navigation `chipFamily` changed the dataset but non-liquid visual rules could be repainted by later Photography liquid `!important` CSS.
2. `filter-chip-rail` had `overflow-x:auto` but no canonical PC mouse-drag owner; mobile native scrolling alone was insufficient.
3. The faint rectangle around previews came from Library iframe-shell `box-shadow`, not the component.
4. `horizontal-rail` Library editor normalized items down to eyebrow/title/description, dropping tags/meta/image/action fields during reorder.
5. Portable primitive Registry props exposed additional state/action fields that were not all editable from Library.

These are confirmed implementation issues, not guessed UI observations.

## PR #39 changes

### Top navigation families

- New canonical owner: `public/assets/styles/platform-modules/top-nav-style-families-v1.css`.
- iOS Liquid stays owned by Photography canonical liquid CSS/controller.
- iOS Flat and Material now change actual nav chip surface/shape/active state.
- selectors are scoped through `.nav-shell[data-platform-module="top-chapter-navigation"]` so later liquid baseline CSS cannot override non-liquid families.
- liquid indicator is explicitly hidden for non-liquid families.
- owner is included in Registry `ownerFiles`, so a Public Snapshot using the module can load the same CSS dependency rather than a preview copy.

### Filter horizontal scrolling

- `filter-chip-rail` keeps native horizontal overflow and mobile `touch-action:pan-x`.
- canonical `hydrateGenericFilterRail()` binds PC pointer drag to each actual family rail.
- drag completion suppresses accidental chip click briefly.
- this is shared module behavior, not Library-only JS.

### Library preview frame

- decorative iframe-shell shadow removed from Library UI.
- component-owned shadows remain visible.

### Portable horizontal rail content

Library content editor v2 preserves/edits canonical fields:
- eyebrow
- title
- description
- tags
- meta
- image
- imageAlt
- actionLabel
- actionUrl

Reordering moves the whole canonical item object, so badges/meta/image/action are not dropped.

### Portable accordion / bottom sheet controls

Accordion Library controls now expose:
- `singleOpen`
- `openFirst`
- `openIds`
- item `meta`

Bottom sheet Library controls now expose:
- initial `open`
- `showLauncher`
- `launcherLabel`
- `dismissOnBackdrop`
- primary action
- secondary action

## Canonical ownership status

Photography extracted modules continue to use the same `PlatformModuleRegistry` definition/render/hydrate across Library/Editor/Public.

The three portable primitives also use one Registry render/hydrate owner across Library/Editor. They do not import Block Lab runtime. They are not yet complete Portable Export products because dependency-manifest/export-bundle work is still pending.

Do not describe the entire Library as feature-complete yet. Full PC/mobile/light/dark visual matrix and ongoing content/state completeness audit remain active.

## QA status

PR #39 first focused run correctly failed on `iOS Flat still shows liquid indicator`, proving the new gate measured actual rendering instead of only dataset state.

The CSS specificity issue was fixed in the shared canonical owner.

Current passing head before this documentation commit: `ba718fda057f0c3b4b9e43e4507b0e36deccc73c`.
- `Platform Library Generalization Checks` run #11: PASS
- `Platform Library Checks` run #426: PASS

Focused browser gate verifies:
- no artificial preview-frame shadow
- top-nav liquid / iOS Flat / Material have measurable computed-style differences
- non-liquid family hides liquid indicator
- filter long menu overflows and PC pointer drag moves it
- mobile filter rail exposes native pan-x
- horizontal-rail tags/meta/action survive live edit + reorder + saved defaults
- accordion missing state/meta controls are present
- bottom-sheet missing state/action controls are present
- portable primitives remain isolated from Photography final Public

## Exact next action

1. Wait for CI on the TASKS/HANDOFF documentation commit and ensure both Library workflows remain green.
2. Merge PR #39.
3. Verify main `Platform Library Checks`, `Platform Library Generalization Checks`, and `Platform Live Deploy Check`.
4. Verify live `/ui-dashboard/` behavior for the four user-reported issues.
5. If live green, continue all-approved-module PC/mobile/light/dark visual matrix and no-op/content-state audit.
6. Next major product layer after Library runtime stabilization: SEO/GEO page metadata wiring, then completed-page registry/duplicate, then dependency-aware Portable Export.

Do not connect new portable primitives or otherwise change the Photography final Public experience without explicit user approval.
