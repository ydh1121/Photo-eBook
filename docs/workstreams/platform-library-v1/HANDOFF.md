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

`/ui-dashboard/` is a Visual Builder, but it must not use the live `/photography/` page as its editing canvas.

Canonical editing surface:
- `/ui-dashboard/sandbox/`
- static dummy content only
- no production API / Google Sheet user-data dependency
- same common UI class names and production CSS owners wherever possible

Photography production remains the parity/reference source in code and final QA. It is not the builder iframe source.

PC inspector:
- hover capability → gear
- gear → independent floating inspector
- multiple inspectors can stay open
- panel header drag
- explicit close only

Mobile inspector:
- edit mode + tap capability
- bottom inspector
- open inspector state stays in bottom dock
- preserve native horizontal scroll

Top management shell:
- Visual Builder
- UI Library
- Block Lab
- Page Editor
- QA

## Dummy canvas

Current dummy page contains:
- hero / content sections with static copy
- actual nav class structure: `.nav-shell`, `.nav-scroll`, `.nav-chip`
- actual horizontal rail class: `.scroll-row`
- collection FAB: `#collectionFab`, `.collection-fab`
- bottom sheet: `#collectionSheet`, `.collection-sheet`
- category chips: `#collectionFilters`, `.collection-filters`, `.collection-filter`
- device handoff accordion: `.collection-device-accordion`, `#collectionDeviceLink`
- reading progress owner created by actual `chapter-navigation.js`

The sandbox loads actual common CSS modules and actual navigation / desktop rail JS where safe. Collection state itself is dummy-only and uses a sandbox interaction file so it never calls production data APIs.

## UI Library

UI Library clones capability DOM from the dummy page after it has been rendered with production-equivalent class/CSS owners. Clones are placed on a bare white floor without showcase cards or tables.

Photography parity is checked by source owner/selector comparison and final production QA, not by embedding the production page in the builder.

## Block composition

The sandbox `#app` is the only page composition surface used by Visual Builder. Meaningful dummy page blocks can be reordered with drag/drop and saved as a browser-local builder draft.

Block Registry palette remains available. Candidate blocks may be tested but never auto-publish or auto-approve.

## Advertisement

`advertisement` remains a candidate block family.

Variants:
- inline-banner
- native-card
- desktop-side-rail
- sticky-bottom

Current builder supports:
- inline body advertisement insertion
- dedicated PC left floating advertisement slot
- dedicated PC right floating advertisement slot

Left/right floating slots live in the outer page margins and are independent. Each has local controls for:
- enabled
- width
- height
- top offset
- content gap
- follow scroll on/off

Disabled side slots remain faintly visible in edit mode so their reserved area can be reviewed. When edit mode is off, disabled slots are hidden. The side slots do not connect to an ad network.

## UI change notes

Each UI inspector has a `수정 요청 메모` field.

Local draft is stored immediately. With the existing admin server connection, the note is stored in `UI_PRESETS.notes` with current capability config.

GPT workflow expectation:
1. read open/draft UI preset notes from Sheet,
2. inspect the shared source owner and current implementation,
3. apply requested source change,
4. update QA/handoff,
5. never treat the note itself as approval.

## Actual photography reference targets

- top nav: `.nav-shell`, `.nav-scroll`, `.nav-chip`
- horizontal rails: `.desktop-rail-window`, `.scroll-row`
- filter chips: `.collection-filters`, `#collectionFilters`, `.collection-filter`
- bottom sheet: `#collectionSheet`, `.collection-sheet`
- device handoff: `.collection-device-accordion`, `#collectionDeviceLink`
- progress: `.nav-chapter-progress`, `.read-progress`
- FAB: `#collectionFab`, `.collection-fab`

The filter chip reference is the small independent `.collection-filter` pill, not the upper `.collection-tabs` segmented control.

## Safety contracts

- do not use live `/photography/` as Visual Builder canvas
- do not load production user data into sandbox
- do not replace photography renderer with candidate/shared renderer before approval + regression QA
- do not mutate production state from Visual Builder
- preserve mobile native horizontal scroll owner
- preserve Safari deferred sticky safety
- no automatic preset/block/variant approval
- labs/dashboard/QA/staging remain noindex

## Work completed in current branch

- Visual Builder shell for `/ui-dashboard/`
- isolated `/ui-dashboard/sandbox/` dummy page
- actual common CSS/class-based dummy UI surface
- production iframe removed from builder route
- capability gear/inspector mapping on dummy DOM
- multiple draggable PC inspector windows
- mobile bottom inspector/dock model
- live capability override application
- dummy block reorder sandbox
- Block Registry palette
- inline advertisement sandbox insertion
- left/right PC floating advertisement slots and controls
- bare-surface UI library mode
- integrated admin navigation
- UI change memo → existing `UI_PRESETS.notes` flow
- advertisement registry candidate and Block Lab sample

## Exact next action

Run the branch in an actual Cloudflare preview and validate:
1. `/ui-dashboard/` iframe source is only `/ui-dashboard/sandbox/`,
2. sandbox Network activity does not hit production data APIs,
3. all seven capability targets are found,
4. PC multi-inspector drag/live editing,
5. PC left/right floating ads at common desktop widths,
6. mobile tap/dock/native-scroll behavior,
7. dummy page block boundary quality,
8. advertisement variants in Block Lab.

After user review, record only explicit decisions as approved/redesign/deprecated and connect approved Block Lab renderers to the Visual Builder palette.
