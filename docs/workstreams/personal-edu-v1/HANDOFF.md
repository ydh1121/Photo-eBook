# Personal Edu V1 — handoff

Updated: 2026-11-06 KST
Phase: foundation and content authoring
Branch: `feat/personal-edu-subjects-v1`
Baseline: `16669aca400a343d772680e47e08a2a48ca708e7`

## Read on resume

1. `AGENTS.md`
2. This file and `TASKS.md`
3. `UI_REGRESSION_SPEC.md`
4. `docs/spec-v1/20-korean-copywriting-skill.md`
5. `docs/spec-v1/21-content-pack-architecture.md`
6. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
7. `docs/library/platform-modules/MODULE-DEPENDENCY-CONTRACT-V1.md`
8. Compare the actual branch, working tree and current remote main before continuing.

## Findings and decisions

- The repository already separates common runtime/styles from the photography pack. Extend this structure.
- The current app shell still hardcodes ten photography renderers. Resolve sections through each pack while retaining the photography order and owners.
- Existing collection is the canonical collection-bottom-sheet module. Keep its saved records and storage keys; new source IDs must be unique across packs.
- New subjects have independent routes and chapter lists. Main subject menu is non-sticky, plus a separate picker FAB.
- The source content workflow is private Drive/Sheets authoring followed by checked-in public snapshots.
- Existing photography image and roadmap folders were moved intact into the user-designated integrated project folder and read back successfully. Private folder identifiers stay in the Drive operations index, not this technical handoff.
- The older platform-library handoff predates current main. Its unrelated backlog is not this task.

## In progress

- Five new course drafts with official references and practical assignments.
- Shared learning renderer, pack loading and subject navigation design.

## Exact next action

Implement shared subject/learning modules, then import reviewed authored content into the project Sheets and compile the five pack snapshots. Generate each image slot separately, inspect it, archive the approved master and only then bind the delivery WebP. Continue through functional and visual QA and a reviewable PR.

## Verification

No runtime changes, tests or production deployment have been completed at this checkpoint.
