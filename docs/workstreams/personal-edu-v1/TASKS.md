# Personal Edu V1 — tasks

Updated: 2026-11-06 KST
Branch: `feat/personal-edu-subjects-v1`
Baseline main: `16669aca400a343d772680e47e08a2a48ca708e7`
PR: https://github.com/ydh1121/Photo-eBook/pull/57
Last verified push: `f37fd524a5eb0cef9b2ccd66dab7207f0b158536`
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
- [-] Final source build complete with both v3 image URLs; push this revision and inspect actual desktop/mobile crops. Layout remains pending until the new screenshots are reviewed.
- [x] Preserve the seven-file real-estate reference archive and local viewing handoff in Drive; all seven full-byte/SHA readbacks passed.
- [x] Cancel local Dot reference viewing as requested; retain previous instructions only as superseded history. No new polling or recurring task is configured.
- [ ] Deferred follow-up: analyze actual video files after the user uploads them to the designated Drive folder. Instagram/YouTube playback remains unverified; existing product work continues independently.
- [x] Apply the six-chapter filming exercise update through the two native Sheets, verify all 1,500 changed-source rows and 212 dependent formulas, then restore snapshots and provenance. Five sources now contain 3,731 rows; content is 45 chapters / 194 blocks / 48 sources.
- [ ] Record ten image layout passes and applied status after visual review.
- [ ] Confirm required checks on the final implementation revision; update PR and review record.
- [ ] Merge tested revision and verify actual production deployment and all six routes.
- [ ] Finalize repository and Drive restart records with exact revision, evidence and next action.

## Current checkpoint

- Remote PR #57 is open and draft at `f37fd524a5eb0cef9b2ccd66dab7207f0b158536`. Remote `main` remains `16669aca400a343d772680e47e08a2a48ca708e7`; no production merge has happened.
- The verified preview is https://4ec750a5.photo-ebook.pages.dev/. Its successful checks apply to the pushed revision, not to later local edits.
- Current local changes include two v3 images, accepted native-Sheet filming exercises, generated packs and live-deploy check contract updates. The two v3 slots remain `generated_pending_layout` until actual page review.
- The other eight learning images and the original photography assets are preserved. Private asset IDs, source records and viewing instructions are located through Drive `PROJECT_INDEX.json`.
- The accepted manuscript is a proposed filming exercise, not an observed channel pattern. Native Sheet readback is complete; this source revision still needs its own CI and deployment. Actual video playback remains unverified.
- This checkpoint records no login values, account credentials or authentication content. CODE1/Order remains read-only.

- Current local verification: 15,504 static assertions, 40 video parser checks, 77 official-notice checks, canonical module boundaries, syntax, deterministic rebuild and diff whitespace pass. The final revision still needs CI.

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
