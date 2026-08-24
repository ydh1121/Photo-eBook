# Platform Library V1 Handoff

Updated: 2026-08-24 KST
Active implementation branch: `refactor/canonical-library-pipeline-v1`
Production branch: `main`
Branch base main: `721dcc2cd2f0802a9a231ade5f007d973ae31d36`
Status: `canonical module pipeline implemented / PR + branch QA pending`

## Resume order

1. `AGENTS.md`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/library/admin-ui/ADMIN-SHELL.md`
4. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
5. `docs/workstreams/platform-library-v1/TASKS.md`
6. this file
7. branch `refactor/canonical-library-pipeline-v1`

## User-confirmed architecture

The prior architecture was based on a wrong assumption that `/ui-dashboard/` should be a broad sandbox/page-composer product.

The user clarified the actual product flow:

- Public page = source/reference of modules already completed in production.
- UI Library = approved reusable UI Kit.
- `/block-lab/` = the only research lab.
- Block Editor = creates, classifies and stores pages using approved modules.

Flows:

`Public complete module → common module extraction → Library → Block Editor → Public`

`Block Lab → user + GPT discussion → common module promotion → Library → Block Editor → Public`

Do not restore the old `화면 구성 → sandbox extraction` concept as a first-class product workflow.

## Implemented architecture

### PlatformModuleRegistry

New owner:
`public/assets/js/platform-modules/module-registry-v1.js`

It records:
- `approved / candidate / deprecated`
- `public-extracted / block-lab-approved / platform-core`
- allowed consumers
- owner files and version
- shared render/hydrate implementation

Normal Library/Editor/Public consumption is approved-only.

### First public-extracted module set

Owner:
`public/assets/js/platform-modules/photo-core-modules-v1.js`

Six modules:
- top-chapter-navigation
- filter-chip-rail
- horizontal-card-rail
- collection-bottom-sheet
- device-handoff-accordion
- floating-action

They preserve the public Photography DOM/class vocabulary and existing CSS/interaction owners.

Public top navigation is already routed through `public-module-adapters-v1.js`. Do not claim the other five public render paths have already migrated; those can move incrementally after the common pipeline is stable.

### UI Library

`/ui-dashboard/` is now Library-only.

- no screen-composer toolbar
- no sandbox boot
- no `?view=library` requirement
- catalog comes from `PlatformModuleRegistry.listFor('library')`
- shared preview route is `/ui-dashboard/module-preview/`
- Library and Editor use the same preview/render owner
- filter sample migration still prevents `[object Object]`

### Block Lab

`/block-lab/` is explicitly `블록 연구실 / RESEARCH ONLY`.

It keeps candidate research runtime internally. Library/Editor must not import its JS/CSS/data.

Promotion means extracting an approved canonical module with source `block-lab-approved`, not sharing the research renderer.

### Block Editor

Canonical route: `/block-editor/`
Compatibility route: `/editor-lab/`

- insertion list from `PlatformModuleRegistry.listFor('editor')`
- no Block Lab JS/CSS/sample data
- saved instance shape: `type: ui-module`, `variant: module id`, `content: props`
- module rendering uses the same `/ui-dashboard/module-preview/?embed=editor` host as Library

### Admin shell

Four roles only:
1. UI 라이브러리
2. 블록 연구실
3. 블록 에디터
4. QA

Legacy `화면 구성` role is removed.

## QA state

New static check:
`scripts/check-platform-module-boundaries.mjs`

New browser check:
`scripts/check-platform-module-pipeline-v1.mjs`

PR workflow has been rewritten to run the canonical module checks instead of the old reference-fixture/browser suite.

Live checker and live workflow have also been rewritten for:
- canonical `/ui-dashboard/`
- shared module preview
- Block Lab research boundary
- Block Editor approved-only boundary
- public canonical top navigation

These checks have not yet run in a PR at the time of this handoff. Do not call the branch green until Actions proves it.

## Legacy cleanup

Old `reference-preview` and obsolete reference QA files may still exist physically. They are no longer active product dependencies.

Before deleting:
1. search active source/workflow references;
2. delete only files with no active dependency;
3. keep the old `/ui-dashboard/sandbox/` files until their remaining QA/staging dependencies are classified. The sandbox is no longer a product role even if some historical fixtures remain.

## Exact next action

1. Search for `reference-preview` and old reference QA active references.
2. Delete safe dead reference-preview files and remove dead workflow/path references if any.
3. Create a PR from `refactor/canonical-library-pipeline-v1` to `main`.
4. Inspect `Platform Library Checks` jobs/logs and fix every failure on the branch.
5. Review browser QA screenshots/artifacts.
6. Merge only after green QA and no visible regression.
7. Confirm the rewritten Cloudflare live deployment check records `pass` on main.
