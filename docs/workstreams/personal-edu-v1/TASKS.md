# Personal Edu V1 — tasks

Updated: 2026-11-06 KST
Branch: `feat/personal-edu-subjects-v1`
Baseline main: `16669aca400a343d772680e47e08a2a48ca708e7`
PR: https://github.com/ydh1121/Photo-eBook/pull/57
Last verified implementation: `a769a098c024ff45c47c9eff24286da90a479565`
Release state: PR #57 merged; production code `7ce547910893eb819e712df3620063edc2980e5d` verified.

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
- [x] Final release checkpoint `9834faf` passed all seven checks and 57/57 runtime cases; PR/review evidence updated.
- [x] Merge tested revision and verify production deployment `7d9fd907`, six routes, 11/11 live module checks, four notice providers, five video responses and ten image hashes.
- [x] Finalize repository and same-ID Drive restart records with exact revision, evidence and next action; complete-byte readbacks pass. Actual video analysis remains deferred.

## Current checkpoint

- PR #57 merged after all seven checks passed on `9834fafc020d65375f736571ebc06a61b22a1353`.
- Production code `7ce547910893eb819e712df3620063edc2980e5d` is deployed at https://photo-ebook.pages.dev/ in Cloudflare deployment `7d9fd907-9144-4b1d-8531-59e705a51981`.
- The production module gate passed 11/11; six subject routes and all ten deployed learning image bytes were independently checked. Detailed results are in `qa/production-verification.json`.
- Live official-notice providers all responded normally. Video discovery currently returns the verified metadata recommendation fallback; no successful upstream search or actual video viewing is claimed.
- Source Sheets, snapshots and generated pages match: 45 chapters / 194 blocks / 48 sources, 3,731 rows and 212 verified dependent formula ranges.
- Actual video analysis is the only deferred content task. Local Dot is cancelled. The user will upload files; no automatic monitoring or recurring task exists.
- Private source/asset IDs and upload instructions remain in the Drive index. CODE1/Order remains read-only.

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
