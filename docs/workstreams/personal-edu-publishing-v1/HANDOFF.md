# Personal Edu publishing — current handoff

Updated: 2026-11-07 KST
Phase: WO01 and WO02 production releases complete; next WO03 — SNS entry regular volume
Programme baseline: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Documentation branch: `docs/personal-edu-wo02-closeout-20261107`
WO02 baseline: `983500848d50f9cf8a4290b348e47866515229e5`
Released implementation: `bd03c5ded77946a95d720800771a8a4df026a1af`, [PR #60](https://github.com/ydh1121/Photo-eBook/pull/60)
Tested candidate: `08ceb4da5ee177f99a0ba3190fcca889a2d47ad3`; identical tree `9224e9828bba61b88c8df31976a985d5538d4532`
Latest recorded live-proof commit: `2779ed6ef87680ffde78bc191fc2a317e88f6c7f` (documentation only)

## Resume here

WO02 is released on production: the SNS, video and AI subject pages link to their explicitly labelled 24-body-page samples through the canonical learning hero, and the shared reader serves the approved page JSON and immutable WebP from Pages static paths. Regular textbooks completed/published remain **0/18**. The next content WO is **WO03 — SNS entry**, at least 400 substantive body pages with a 420-page target.

The user-supplied Workers **Free / Current plan** screen and storage clarification superseded the earlier D1-only choice. Original manuscripts and image masters remain in Drive. Saved questions and reading positions remain local to this browser. The ebook-only D1 service was never activated and has been removed from the released route; no daily D1 attestation, Billing Read permission, database provisioning or new paid service is needed for this publication path. Follow [EBOOK-PUBLICATION-V1.md](../../library/platform-modules/EBOOK-PUBLICATION-V1.md).

### Current release evidence

- Candidate `08ceb4` passed all seven workflows; merge `bd03c5d` has the same tested tree. Preview `3874107d-669a-48f8-93cd-e38e622a0232` and production `3eeabb99-68e3-4bc9-a8fe-f2c6f7d197fb` succeeded. Six post-merge push workflows plus the live workflow pass. The UI Visual Matrix workflow is PR-only; the production live workflow also ran its live matrix.
- Current static checks: reader 17/17, assets 33/33 and sample groups 7/7. All 72 candidate mobile pages at 375 × 812 have no overflow. Existing Personal Edu and reference-case browser fixtures pass 69/69 and 12/12; those fixture results are not additional manual production observations.
- Actual production HTTP passes 23/23, including all 13 image hashes and 72 exact page payloads. The persisted [live report](../platform-library-v1/qa/live-deploy-status.json) records source `bd03c5d` and 12/12 overall checks: the prior 11 plus the ebook gate.
- Production cloud Chromium at 1363 × 936 verified SNS/video/AI entry links and the reader. A saved 135-character quote remained after reload; page 4 and scroll position 936 restored after reload and returning through the generic subject reader link. Actual production mobile-width, physical Android/Galaxy and Safari execution are not claimed. Mobile-width evidence comes from the exact candidate and the production byte comparison.
- All 81 files in the source/body preservation baseline and 13 WebP hashes are preserved; semantic IDs and question anchors are unchanged. The six JSON/Markdown originals, image originals and all three 26-page review PDFs retain their completed preservation/readback evidence.
- The public tree contains 522 files / 13,030,546 bytes with no publication-budget warning or failure. Free limits are 20,000 files and 25 MiB per file; future full-volume projections remain estimates.

The structured release record is [qa/wo02-static-release.json](qa/wo02-static-release.json). The older D1/SQLite results below are historical evidence only.

### Next action

The final report and evidence archive are preserved and completely byte-readback verified. The same-ID CURRENT/PROJECT_INDEX updates also passed full-byte readback, with source/folder identities and prior checkpoints preserved. Final operational IDs, hashes and the separate integrity receipt belong in the private project records. Production verification, PR #60 merge and the operational readbacks are complete.

Begin WO03 from the preserved SNS entry blueprint and approved editorial contracts. Set the body-page budget to 420 with a hard editorial minimum of 400; write the complete exercises, independent tasks and solutions, create the required teaching visuals, and verify current menus and full-edition reading quality. Keep `sample-20261106-v1` intact and increment the regular count only when the completed regular edition passes its release gates.

## Preserved programme and release history

The preceding uploaded-media WO is complete (PR #58, deployed code `755ff19188e746ac33282063f91a2cab28da3625`). Continue the new publishing programme from `TASKS.md`; do not reopen its completed analysis or unrelated platform backlog.

The user requests a reference-case horizontal rail with detailed popups, an SNS subject, an eighteen-volume textbook programme (three subjects × six levels, minimum 400 pages each), shared reader with saved text questions and reading position, original visuals preserved in Drive and compressed WebP served within free allowances (the original D1 choice was superseded by the 2026-11-07 clarification), and substantial Korean editorial improvements. Work is explicitly split into quality-focused WOs.

WO01 produces the research/edition contracts and the reference/SNS foundation. Textbook production and reader implementation follow the research stage. Do not publish placeholder books as regular editions or count screen height as authored pages.

Read `docs/spec-v1/20-korean-copywriting-skill.md`, `22-personal-edu-content.md`, `23-learning-discovery-rails.md` and `docs/library/editorial/` before editing. The live COPY_GUIDE has been read. Native Sheet originals and the selected-skill archive are managed through the private project index; no private source IDs enter this repository.

WO01 is deployed and verified. PR #59 implementation `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` merged as `b261ab21dba65b8cbb5876960c9cd27a55870a7c`. Cloudflare production deployment `eaf07711-7bc4-4bf4-a807-9932b39ea3f3` completed at 2026-11-06T09:12:00.831164Z. Candidate and post-merge checks both pass; runtime 69/69, reference cases 12/12, live module gate 11/11. The live-check automation recorded `964f4b515f2c3d6d1e5f8c54f3d7b40632cc83bf`, a documentation-only commit separate from the product release.

SNS has 9 chapters / 38 blocks / 21 sources. Real estate has 10 chapters / 45 blocks, including 11 detailed cases and 12 supplied profiles. Final native readback covers all 1,008 SNS and 2,128 real-estate rows. Production routes, changed snapshots and new SNS images match the verified files. Manual mobile-width public UI inspection confirmed dialog focus/scroll restoration and SNS video pagination 24 → 49 unique watch links. See `REVIEW.md` and `qa/foundation-release-v1.json` for scope and limitations.

Recovered research, eighteen-volume blueprints, reader/storage designs, source readbacks and selected-skill originals are preserved through the private project index. Do not rerun completed media analysis or recreate the recovered research. WO02 reconciled the book/page contract, implemented the common reader and authored the entry-level sample chapters described below. Its earlier local D1 safeguards belong to the superseded checkpoint. These samples do not increment the regular-volume count.

WO01's D1 inspection found no binding in this Pages project, and Billing subscription reads were unavailable to that OAuth connection. WO01 did not create a database or change a paid plan. These account observations are historical; the later Free-plan proof and static-storage decision resolved the former activation path.

## Historical WO02 checkpoint — 2026-11-06

The candidate at this historical checkpoint was `3e0ebd901d33f7fc12f256578ee4b842ce9f3f08`. The canonical `ebook-reader` owner, stable-ID data model, source builder, guarded D1 service/publisher and local SQLite preview were implemented. The D1 delivery path was later superseded. Stable IDs are `sns-entry`, `video-entry` and `ai-entry`; the sample edition is `sample-20261106-v1`. Semantic page/block IDs are distinct from authored page numbers and viewport reflow.

| Book | Body pages | Blocks | Review PDF physical pages |
| --- | ---: | ---: | ---: |
| SNS entry | 24 | 104 | 26 |
| Video entry | 24 | 113 | 26 |
| AI entry | 24 | 112 | 26 |
| Total | 72 | 329 | 78 |

Each PDF contains one cover, one contents page and 24 numbered body pages. A4 preserves the authored text, tables and diagrams for review; it does not settle the regular-volume trim size. PDF QA compared 1,449 source items with no missing item, checked 50 source links and 72 contents links, and rendered all 78 pages. Visual review covered every page through contact sheets and recorded full-size spot checks. All three PDFs are preserved in their subject folders; complete downloaded bytes match the approved originals.

Six JSON/Markdown source originals were preserved in Drive and fully byte-readback verified before repository publication. Five original photographs and eight original diagrams produce 13 WebP files totalling 1,309,798 bytes. Full readback covers all delivery files, five PNG masters and the 16-file diagram archive. Private identifiers and receipts remain in the private project record.

Local checks pass: 38 actual SQLite asset cases, four reader model/storage groups, all 13 HTTP image hashes and 72 exact page payloads, canonical boundaries and 24,900 existing Personal Edu static assertions. The local reader runtime attempt stopped because Chromium was unavailable; its four model passes are not browser-runtime evidence. The final candidate's CI separately ran both `scripts/check-ebook-reader.mjs --runtime` and `scripts/check-ebook-samples.mjs --runtime` successfully: 17 reader checks and seven sample groups, including 72 mobile pages and the portable image. The complete final reader artifact has been preserved and byte-readback verified. Earlier failed CI attempts remain historical evidence, not final passes.

At that checkpoint, `scripts/build-ebook-review.mjs` produced `/staging/ebook-reader-preview/` with the same owner files, exact page JSON and its own reviewed image copies. The then-verified PR preview was evidence for that review adapter. No WO02 production deployment or remote D1 database creation, migration, binding, image import or activation had been performed then. The local SQLite fixture's synthetic proof must never be reused as account evidence.

## Static publication — completed release sequence

1. The source-preserving static adapter, catalog-driven entries and complete `public/` inventory passed. `/assets/*`, `/books/*` and reader routes bypass Functions; only hash-named images use immutable caching.
2. The exact candidate passed source, asset, reader, sample and shared-module checks with all 72 page hashes and 13 image hashes preserved. Existing PDF/source receipts remain valid because those bytes did not change.
3. Actual Cloudflare preview and production delivery were verified after the passing candidate was merged as PR #60. Image bytes, page payloads, cache responses and SNS/video/AI reader entry behaviour passed. No paid upgrade, D1 binding, R2 bucket or new media subscription was activated for this release.
4. The production result is recorded in Git by live-proof commit `2779ed6`. Final private operational record/receipt handling remains separate, as stated in **Next action**.

The current implementation contract is [EBOOK-PUBLICATION-V1.md](../../library/platform-modules/EBOOK-PUBLICATION-V1.md). Historical D1 budget logic and synthetic SQLite proofs are neither required nor valid evidence for static delivery.

## WO03 acceptance criteria

WO03 produces the SNS entry regular volume from the preserved eighteen-volume blueprints, targeting 420 substantive body pages with a minimum of 400. Complete worked exercises, independent tasks and solutions, original teaching visuals, current tool/menu evidence and full-edition review are required. Physical Android menu execution is still unperformed and must be addressed before a regular volume claims a verified mobile walkthrough. The current 24-page chapters remain samples; regular volumes completed/published remain **0/18**.
