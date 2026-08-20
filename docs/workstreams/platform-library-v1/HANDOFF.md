# Platform Library V1 Handoff

Updated: 2026-08-20 KST
Active branch: `feat/visual-builder-dashboard`
Base main at branch creation: `dbed99e92d0583a8a1782ea77a0f5d2a0767597a`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
5. current branch HEAD

Do not resume this workstream from conversation memory alone.

## Current architecture decision

The old `/ui-dashboard/` specimen/catalogue UI is being replaced by a Visual Builder.

The actual photography page is the canvas. Reusable UI is identified from the actual production DOM and edited in place with Dashboard-only overrides. Do not rebuild fake versions of production UI for parity review.

PC:
- hover capability → gear
- gear → independent floating inspector
- multiple inspectors can remain open
- inspector windows are draggable and close only by explicit user action

Mobile:
- edit mode + tap capability
- bottom inspector
- open inspectors remain in a bottom dock
- preserve native mobile horizontal scroll

The same top management shell links:
- Visual Builder
- UI Library
- Block Lab
- Page Editor
- QA

## UI Library

UI Library uses actual source DOM cloned from the real page and placed directly on a bare white platform floor. Do not wrap every module in showcase cards/tables because that changes layout context.

Capability filters currently cover navigation / horizontal content / selector / overlay / interaction / status / action.

If an actual production element does not exist in the current data state, do not fabricate it just to fill the library.

## Block composition

Visual Builder marks live page block candidates and allows drag/drop reorder in a sandbox draft. Saved order is not production publish state.

Block Registry palette is visible from the builder. Candidate blocks may be tested but must not auto-publish or auto-approve.

Existing Page Editor block drag/reorder remains available; the long-term goal is to connect approved shared renderers to both the Page Editor and the Visual Builder.

## Advertisement block

New candidate block family: `advertisement`

Variants:
- inline-banner
- native-card
- desktop-side-rail
- sticky-bottom

The first Block Lab implementation is a neutral placeholder for layout review. It is not an ad network integration and is not approved for production.

## UI change notes

Each UI inspector has a `수정 요청 메모` field.

Local draft is stored immediately. If the existing admin server connection is active, the note is saved as a stable draft record in the existing `UI_PRESETS` Sheet using the `notes` column, along with the current capability config.

GPT workflow expectation:
1. read open/draft UI preset notes from Sheet,
2. inspect the source owner and current implementation,
3. apply requested source change,
4. update QA/handoff,
5. never treat the note itself as user approval.

## Actual photography UI source targets

- top nav: `.nav-shell`, `.nav-scroll`, `.nav-chip`
- horizontal rails: `.desktop-rail-window`, `.scroll-row`
- filter chips: `.collection-filters`, `#collectionFilters`, `.collection-filter`
- bottom sheet: `#collectionSheet`, `.collection-sheet`
- device handoff: `.collection-device-accordion`, `#collectionDeviceLink`
- progress: `.nav-chapter-progress`, `.read-progress`
- FAB: `#collectionFab`, `.collection-fab`

The actual photography filter chip is the small independent `.collection-filter` pill. Do not substitute the upper `.collection-tabs` segmented control.

## Safety contracts

- do not replace photography production renderer with a candidate/shared renderer before approval + regression QA
- do not mutate production state from Visual Builder
- preserve mobile native horizontal scroll owner
- preserve Safari deferred sticky safety
- no automatic preset/block/variant approval
- labs/dashboard/QA/staging remain noindex

## Work completed in the current branch unit

- new Visual Builder shell for `/ui-dashboard/`
- actual photography iframe canvas
- actual capability gear/inspector mapping
- multiple draggable PC inspector windows
- mobile bottom inspector/dock model
- live capability override application
- live block reorder sandbox
- block palette
- advertisement sandbox insertion
- bare-surface UI library mode
- integrated admin navigation
- UI change memo → existing UI_PRESETS notes flow
- advertisement registry candidate and Block Lab sample

## Exact next action

Run the branch in an actual deployment preview and validate:
1. same-origin photography iframe load,
2. all seven capability target discovery after dynamic UI opens,
3. PC multi-inspector drag/live editing,
4. mobile tap/dock/native-scroll behavior,
5. page block boundary quality for drag/drop,
6. advertisement variants inside real reading flow.

After user review, record only explicit decisions as approved/redesign/deprecated and connect approved Block Lab renderers to the Visual Builder palette.
