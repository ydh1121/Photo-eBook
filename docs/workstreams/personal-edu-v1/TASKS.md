# Personal Edu V1 — tasks

Updated: 2026-11-06 KST
Branch: `feat/personal-edu-subjects-v1`
Baseline main: `16669aca400a343d772680e47e08a2a48ca708e7`
PR: https://github.com/ydh1121/Photo-eBook/pull/57

This is an independent workstream. Do not resume or modify the older platform-library workstream merely because its handoff still says active.

## Accepted scope

- [x] Inspect repository, content-pack contract, copy rules, image pipeline and regression specification.
- [x] Pin baseline main, keep photography at `/`, and establish an implementation branch.
- [x] Organize the project Drive folder; preserve both photography folder names and IDs.
- [x] Author five subject packs: 45 chapters, 192 learning blocks and 48 source records.
- [x] Preserve authored content/evidence in Drive and five native source Sheets.
- [x] Verify 3,655 native rows, restore exact public snapshots and document the codec/provenance contract.
- [x] Add non-sticky hero subject menu and subject picker above the existing collection FAB.
- [x] Reuse original chapter navigation and collection runtime across subjects.
- [x] Extract shared hero/section rendering and implement learning blocks in canonical modules.
- [x] Wire modules into Library, Editor, Public and portable dependency consumers with independent instance state.
- [x] Generate ten images; preserve PNG/WebP in Drive and verify downloaded hashes.
- [x] Add route metadata, sitemap, deterministic builder, static validation and runtime CI coverage.
- [x] Run static boundary/content/build checks and existing Chromium module pipeline; passed at `215ed05`.
- [x] Push reviewable implementation and open draft PR #57.
- [-] Resolve runtime CI findings, inspect mobile/desktop screenshots and verify actual interactions.
- [ ] Record ten image layout passes and applied status after visual review.
- [ ] Confirm required checks on the final implementation revision; update PR and review record.
- [ ] Merge tested revision and verify actual production deployment and all six routes.
- [ ] Finalize repository and Drive restart records with exact revision, evidence and next action.

## Invariants

1. No new homepage. `/` remains photography.
2. Photography chapter navigation keeps existing behavior, motion and sticky lifecycle.
3. Subject navigation scrolls away. Its floating button is separate from `내 모음`.
4. Existing storage keys and saved photography data are preserved. New resource/checklist IDs include a subject namespace.
5. Improvements specific to learning pages remain scoped to those pages.
6. No family details or private commercial strategy enter Git, public content, commits or PRs.
7. CODE1/Order is read-only. Operational documents belong to this workstream.
8. Do not report production deployment until the deployed revision and behavior have been verified.
