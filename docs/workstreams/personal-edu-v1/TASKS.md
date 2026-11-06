# Personal Edu V1 — tasks

Updated: 2026-11-06 KST
Branch: `feat/personal-edu-subjects-v1`
Baseline main: `16669aca400a343d772680e47e08a2a48ca708e7`
PR: https://github.com/ydh1121/Photo-eBook/pull/57
Last verified implementation: `a769a098c024ff45c47c9eff24286da90a479565`
Release state: open draft PR; not merged; `main` still matches the baseline above.

This is an independent workstream. Do not resume or modify the older platform-library workstream merely because its handoff still says active.

## Accepted scope

- [x] Inspect repository, content-pack contract, copy rules, image pipeline and regression specification.
- [x] Pin baseline main, keep photography at `/`, and establish an implementation branch.
- [x] Organize the project Drive folder; preserve both photography folder names and IDs.
- [x] Author five subject packs: 45 chapters, 194 learning blocks and 48 source records.
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
- [x] Resolve runtime CI findings and verify interactions at `f37fd52`: all 7 commit checks and all 57 Personal Edu runtime checks passed.
- [x] Follow-up WO: one-row mobile navigation, aligned FAB centers, filled active subject card, simplified picker and centered SVG close button.
- [x] Compose comparison/source cards with canonical horizontal rails; add a reusable discovery rail for subject videos and official education/support notices.
- [x] Parse verified YouTube recommendations and official notices with region/type filters, source checks, deadline closure and partial-failure states.
- [x] Replace ten learning images with v2 adult/work scenes; preserve originals, verify all 20 mirrored files and inspect desktop/mobile crops. The community hero 68% mobile crop passed at `f37fd52`.
- [x] Prepare two targeted v3 image edits: AI hero and community practice. Scene/WebP QA and all four Drive byte readbacks passed; v1/v2 history is preserved.
- [x] Push final source revision `a769a09`; all seven checks and 57/57 runtime cases pass. Inspect both v3 images in actual desktop/mobile page screenshots.
- [x] Preserve the seven-file real-estate reference archive and local viewing handoff in Drive; all seven full-byte/SHA readbacks passed.
- [x] Cancel local Dot reference viewing as requested; retain previous instructions only as superseded history. No new polling or recurring task is configured.
- [ ] Deferred follow-up: analyze actual video files after the user uploads them to the designated Drive folder. Instagram/YouTube playback remains unverified; existing product work continues independently.
- [x] Apply the six-chapter filming exercise update through the two native Sheets, verify all 1,500 changed-source rows and 212 dependent formulas, then restore snapshots and provenance. Five sources now contain 3,731 rows; content is 45 chapters / 194 blocks / 48 sources.
- [x] Record ten image layout passes and repository-applied status after visual review; production verification follows deployment.
- [-] Final implementation checks passed at `a769a09`; update PR/review evidence and confirm checks on the metadata-only release checkpoint.
- [ ] Merge tested revision and verify actual production deployment and all six routes.
- [ ] Finalize repository and Drive restart records with exact revision, evidence and next action.

## Current checkpoint

- PR #57 remains unmerged. Implementation `a769a098c024ff45c47c9eff24286da90a479565` passed all seven checks and 57/57 runtime cases; evidence is in `qa/release-qa.json`.
- Verified preview: https://f082425a.photo-ebook.pages.dev/. The metadata-only release checkpoint records completed image layout QA and is the next expected merge candidate after required checks.
- All ten learning image layouts passed. Two v3 images were inspected from the new runtime artifact; the other eight retain the accepted v2 layouts. Original photography image slots and chapter-navigation owners are preserved.
- Native source revision is verified and built: 45 chapters / 194 blocks / 48 sources, 3,731 source rows, 212 dependent formulas. These are authored filming exercises; no claim of actual channel viewing is made.
- Local Dot is cancelled. Actual video analysis resumes only from user-uploaded files. No automatic folder monitoring or new recurring task is configured.
- Production remains pending merge, actual deployment identity, six-route checks, live discovery responses and image hashes. Do not infer production status from preview checks.
- Private source/asset IDs and video-upload instructions remain in the Drive index. CODE1/Order remains read-only.

## Invariants

1. No new homepage. `/` remains photography.
2. Photography chapter navigation keeps existing behavior, motion and sticky lifecycle.
3. Subject navigation scrolls away. Its floating button is separate from `내 모음`.
4. Existing storage keys and saved photography data are preserved. New resource/checklist IDs include a subject namespace.
5. Improvements specific to learning pages remain scoped to those pages.
6. No family details or private commercial strategy enter Git, public content, commits or PRs.
7. CODE1/Order is read-only. Operational documents belong to this workstream.
8. Do not report production deployment until the deployed revision and behavior have been verified.
9. A notice fetch failure is never proof of closure. Apply source/deadline evidence, retain successful data and show verification state.
10. Resource rails compose the canonical horizontal-rail/filter-chip-rail owners across all consumers.
