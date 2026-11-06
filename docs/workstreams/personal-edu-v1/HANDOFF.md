# Personal Edu V1 — handoff

Updated: 2026-11-06 KST
Phase: implementation complete; final runtime and visual verification
Branch: `feat/personal-edu-subjects-v1`
PR: https://github.com/ydh1121/Photo-eBook/pull/57
Baseline: `16669aca400a343d772680e47e08a2a48ca708e7`
Last pushed checkpoint: `215ed05c25f4bd2fda4469e0f6f8695b959b0c05`

## Read on resume

1. `AGENTS.md`, this file and `TASKS.md`.
2. `UI_REGRESSION_SPEC.md` and `docs/spec-v1/20-korean-copywriting-skill.md`.
3. `docs/spec-v1/21-content-pack-architecture.md` and `22-personal-edu-content.md`.
4. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md` and `MODULE-DEPENDENCY-CONTRACT-V1.md`.
5. `REVIEW.md`, current branch status, actual remote main, PR checks and uncommitted changes. Do not infer deployment from this checkpoint alone.

The older platform-library workstream is unrelated. Its stale active marker is not an instruction to resume it.

## Implemented

- `/` remains photography. Added `/video/`, `/ai/`, `/community/`, `/real-estate/` and `/auction/`; no new homepage.
- Non-sticky six-subject hero menu and a separate subject picker above the existing collection FAB. Original photography chapter-navigation owners and motion remain intact.
- Canonical `learning-guide-hero`, `learning-guide-section` and `subject-navigation` modules serve Library, Editor, Public and dependency-based export consumers. Editor duplication assigns independent instance IDs.
- Five course packs contain 45 chapters, 192 learning blocks and 48 source records. Eight reusable block types cover prose, cards, steps, checklists, templates, tables, callouts and related subjects.
- All five native Sheet sources were read back: 3,655 path/type/value rows round-trip losslessly. Twenty native exported tabs were rendered and checked. Public snapshots and provenance hashes match the restored source.
- Ten generated images have inspected PNG masters and deterministic quality-82 WebP deliveries; all 20 Drive files were downloaded and their SHA values verified. Original 48 photo image slots are unchanged. New image layout status remains pending final mobile/desktop review.
- Existing photography folders were moved intact into the integrated project folder. New subject folders, source Sheets, content notes and operational manifests are present. Private identifiers belong in Drive `PROJECT_INDEX.json`, not Git.
- Saved sources use the existing collection and storage keys with subject-prefixed IDs. Practice state is separated by subject/instance and merges the latest stored state on each change.
- New learning pages allow pinch zoom. Photography retains its original gesture behavior. Source bookmark state refreshes on `pageshow` for browser-history restoration.

## Verification checkpoint

- `node scripts/check-personal-edu.mjs`: PASS, 15,075 assertions covering content, source hashes, routes, assets, privacy guards and 20 unchanged photography owner files.
- `node scripts/check-platform-module-boundaries.mjs`: PASS. Deterministic rebuild, JS syntax and `git diff --check`: PASS.
- At `215ed05`, the six pre-existing Cloudflare / module pipeline / architecture / generalization / parity / visual matrix checks passed.
- First new Personal Edu runtime run: https://github.com/ydh1121/Photo-eBook/actions/runs/42136709691. Fourteen checks passed and 33 failed. Primary failures were dialog keyboard focus leaving the modal, cascading blocked clicks, and a Library selector matching both preview HTML and the actual module root. This is not a release pass.
- The runtime runner now isolates failed navigation state and strengthens clipboard, active-tab, Editor bridge, real JSON export/import and cross-subject history checks. Modal focus and Library selection are being corrected before the next run.
- Live preview desktop verification confirmed page loading, non-sticky menu, chapter scrolling, generated images and subject switching. Final mobile screenshot and portable-consumer verification remain open.
- No production merge or deployment has been completed at this checkpoint.

## Exact next action

1. Inspect pending corrections in subject-navigation and runtime runner; commit coherent changes and update the branch without force-push.
2. Re-run PR checks. Inspect `personal-edu-runtime-qa` reports and screenshots; fix concrete failures. Required static boundary and Chromium module pipeline must pass before merge.
3. Visually verify all ten images in actual hero/practice layouts, then mark only the new slots applied and record layout QA.
4. Update PR and workstream records with actual results. Merge the tested revision, verify production and six public routes, then update Drive `CURRENT.md` and `PROJECT_INDEX.json` with deployed SHA and evidence.

## Source editing and restart contract

Use the private project Drive index to locate five native Sheets. Edit canonical `콘텐츠` values, read back and validate with `scripts/content/learning-sheet-codec.mjs`, then run `node scripts/build-personal-edu.mjs` and static/runtime gates. Sheet edits do not publish automatically. See spec 22 for the detailed codec/source contract. Keep CODE1/Order read-only.
