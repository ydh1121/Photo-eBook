# Personal Edu — publishing programme

Started: 2026-11-06 KST
Programme baseline: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Current phase: WO02 production release complete; next WO03 — SNS entry regular volume
Documentation branch: `docs/personal-edu-wo02-closeout-20261107`
WO02 baseline: `983500848d50f9cf8a4290b348e47866515229e5`
Released implementation: `bd03c5ded77946a95d720800771a8a4df026a1af` ([PR #60](https://github.com/ydh1121/Photo-eBook/pull/60))
Tested candidate: `08ceb4da5ee177f99a0ba3190fcca889a2d47ad3`; identical release tree `9224e9828bba61b88c8df31976a985d5538d4532`
Recorded live-proof commit: `2779ed6ef87680ffde78bc191fc2a317e88f6c7f` (documentation only)

## Scope and sequencing

The new request is a staged programme. Do not claim that the complete multi-volume textbooks or viewer are delivered by the foundation WO. The previous media-analysis release remains complete.

1. **WO01 — research and foundation:** official publishing/course research, level and editorial contracts, selected licensed skill originals in the private project folder, reference-case rail/dialog, and the SNS subject route.
2. **WO02 — shared reader and asset delivery:** canonical reader, stable edition/page anchors, selection-to-question storage, reading-position restoration, accessible controls, Pages static WebP delivery and enforced publication budgets. Exercise authored sample chapters before any regular textbook release.
3. **WO03–WO20 — one volume per WO:** three subjects × six levels, at least 400 substantive editorial pages per volume; complete manuscript, original visuals, worked exercises, solutions, menu evidence and complete edition QA.
4. **WO21 — course-page editorial integration:** improve existing subject prose against the released books; review community/auction copy without silently changing factual conditions.

## WO01 complete

- [x] Read actual repository and same-ID operational records; confirm previous release and clean baseline.
- [x] Read the live COPY_GUIDE and existing editorial contracts.
- [x] Compare primary publisher/course/institution curricula and current mobile-tool documentation.
- [x] Preserve selected source skills with fixed revisions, licences and adoption decisions in the project folder.
- [x] Define eighteen distinct volume outcomes, substantive page accounting, practice and verification criteria.
- [x] Add reference cards with detailed analysis in a reusable, accessible dialog.
- [x] Author the SNS source in a new native Sheet using the established four-tab template; read back before snapshot publication.
- [x] Add SNS to the existing subject catalog, builder, discovery and static routing without a new home page.
- [x] Generate and preserve SNS visuals under the existing image pipeline.
- [x] Validate module boundaries, public/editor/library/export behaviour, source provenance and mobile layout.
- [x] Publish and verify the exact foundation revision; preserve research and final release evidence in durable project records.

## Invariants

- Original photography navigation, content, storage and folder identities remain intact.
- Shared UI uses canonical Registry owners across Library → Editor → Public → portable dependencies.
- Editable site content starts in native source Sheets. Private IDs, raw uploads and business context stay outside Git.
- Authored textbook pages and reflowed device screens are distinct. Front matter and blank/filler pages do not satisfy the substantive 400-page minimum.
- Do not invent tested mobile menu paths, paid-course access, playback, performance or human review.
- The 2026-11-07 user clarification authorizes a better storage design. Pages static delivery supersedes the earlier D1-only request. User-supplied Workers Free plan proof is accepted. Do not enable a paid subscription or exceed Free publication limits.
- CODE1/Order remains read-only. Local Dot and cloud social-media playback retries remain cancelled.

## WO01 verified checkpoint

- Primary research: 39 official source pages covering 14 distinct books/courses; 18 original volume blueprints, each targeting 420 substantive pages. Full textbook manuscripts: 0 published.
- SNS: native-source round trip verified, 9 chapters, 38 blocks, 21 official references.
- Real estate: native-source round trip verified, 10 chapters, 45 blocks, 11 detailed cases and 12 supplied profiles.
- Discovery: SNS adds 129 unique public-metadata videos across 12 topics. Existing five subject catalogs and notice facts preserved.
- Selected skills: six repositories, 35 original files with pinned revisions and licences; private archive saved.
- Two generated SNS images: originals and WebP saved remotely and byte-readback verified; final hero/practice layouts inspected. Both deployed WebP files match the repository byte for byte.
- Final candidate `9a2e6c493cc13d1402e0e0a836a9c3c55776357c`: seven checks pass, including 69 public-runtime checks, 12 reference-case checks and 14 Library runtime-feedback checks. The stale fixed-nine-chapter assertion was replaced with generated manifest counts and SNS coverage.
- PR #59 merged as `b261ab21dba65b8cbb5876960c9cd27a55870a7c`; production deployment `eaf07711-7bc4-4bf4-a807-9932b39ea3f3` succeeded. Seven post-merge checks and the 11-check live module report pass.
- Production HTTP: seven subject routes, both changed course snapshots and both SNS images match the verified files. Public SNS recommendations grew from 24 to 49 unique watch links after scrolling to the horizontal end. These are observed live values, not guaranteed counts.
- Final editorial readback: SNS 1,008 rows and real estate 2,128 rows; one approved wording change in each source, with adjacent cells and formats preserved. The corrected snapshots are byte-identical to the restored source.

## WO02 production release complete — 2026-11-07 KST

- [x] Resolve IDs: `sns-entry`, `video-entry`, `ai-entry`; sample edition `sample-20261106-v1`. Page and block IDs are semantic and stable; page numbers are editorial positions.
- [x] Deliver the canonical reader with selection-to-question saving, last-position restoration and accessible controls across Library, Editor, Public and portable consumers.
- [x] Author three real sample chapters, each with 24 body pages, and preserve/read back the six JSON/Markdown originals before copying repository snapshots.
- [x] Create and preserve five original photographs and eight teaching diagrams, with 13 delivery WebP files and full byte readback.
- [x] Preserve all three review PDFs, each with a cover, contents and 24 body pages; complete text/link/layout checks, the recorded visual review and full byte readback.
- [x] Record official mobile-tool evidence separately. Physical Android menu execution is explicitly unverified and remains a regular-volume release gate.
- [x] Accept the user-supplied Workers Free plan screen and the clarification allowing the appropriate storage product.
- [x] Publish immutable WebP through Pages static files and retire the never-activated ebook-only D1 path. All 81 files in the source/body preservation baseline and 13 WebP source/delivery hashes remain unchanged; stable reader anchors are preserved.
- [x] Enforce the whole-publication budget: 522 files, 13,030,546 bytes, no warnings or failures against the 20,000-file / 25 MiB-per-file Free limits and project reader/image budgets.
- [x] Pass all seven exact-candidate workflows: reader 17/17, static assets 33/33, sample groups 7/7, all 72 mobile pages at 375 × 812 with no overflow. Existing Personal Edu and reference-case CI fixtures pass 69/69 and 12/12.
- [x] Verify preview deployment `3874107d-669a-48f8-93cd-e38e622a0232`, merge PR #60 with the same tested tree, and verify successful production deployment `3eeabb99-68e3-4bc9-a8fe-f2c6f7d197fb`.
- [x] Pass six post-merge push workflows plus the live workflow. The persisted live report contains the existing 11 checks and the ebook gate: 12/12 overall, with ebook HTTP 23/23 covering all 13 image hashes and all 72 page payloads.
- [x] Inspect production SNS/video/AI sample entries and the common reader at 1363 × 936. A 135-character quote survives question save/reload; page 4 and scroll position 936 restore after reload and reentry through the generic subject link.

Regular textbooks completed/published: **0/18**. WO01 and the WO02 production release are complete. The three published sample chapters contain 72 body pages / 329 blocks and do not count as regular volumes. See [current release evidence](qa/wo02-static-release.json) and [REVIEW.md](REVIEW.md).

## Next WO — WO03 SNS entry regular volume

- [-] active: Begin the SNS entry regular volume from the preserved eighteen-volume blueprints and approved editorial contracts; retain the 24-page sample as its own edition.
- [ ] Author at least 400 substantive body pages, targeting 420, with complete worked examples, independent tasks and solutions. Exclude cover, contents, blank pages and filler from the count.
- [ ] Produce the teaching visuals needed by the actual manuscript and preserve reviewed originals before publication.
- [ ] Verify current tool/menu evidence, address physical Android execution before claiming a verified mobile walkthrough, and complete full-edition editorial, source, image, reader and publication-budget QA.
- [ ] Publish the first regular volume only after these gates pass; increment the regular-volume count at that release.

The final release report and evidence archive have been preserved and completely byte-readback verified. CURRENT and PROJECT_INDEX were updated using their existing IDs and their complete bytes were read back successfully. Keep final IDs, hashes and the integrity receipt in the private project records. No production merge, D1 activation or recurring account-attestation step remains pending.

## Historical WO02 candidate checkpoint — 2026-11-06

- PR #60 implementation candidate: `3e0ebd901d33f7fc12f256578ee4b842ce9f3f08`. The new reader workflow passes: 17 reader checks, 38 actual SQLite asset checks and seven sample groups covering all 72 mobile pages, desktop layout and the portable review image. All seven workflow runs pass, including existing Personal Edu runtime 69/69 and reference-case browser checks 12/12.
- Verified review preview: [ebook reader preview](https://03b475ac.photo-ebook.pages.dev/staging/ebook-reader-preview/). This route uses the shared Registry owner and an explicit copied-image review adapter. It does not certify remote D1 delivery or a WO02 production release.
- Authored samples: SNS 24 pages / 104 blocks, video 24 / 113, AI 24 / 112; 72 substantive body pages and 329 blocks total. Cover and contents are excluded. All three use the fictional bookmark workshop and carry the practice/not-recruitment label.
- Six JSON/Markdown source originals were preserved in Drive and fully byte-readback verified before repository publication. Private source identifiers remain outside Git.
- Visuals: five generated photographs and eight original diagrams; 13 WebP files total 1,309,798 bytes. Full readback covers all delivery files, five PNG masters and the 16-file SVG/PNG diagram archive.
- Local evidence: 38 actual SQLite asset cases, four reader model/storage groups, every WebP HTTP hash, all 72 exact page payloads, canonical boundaries and 24,900 existing Personal Edu static assertions. The local SQLite file occupies 1,343,488 bytes. These are local results.
- PDF review editions: three A4 PDFs, 26 physical pages each (cover + contents + 24 body pages), 78 physical pages total. Text comparison covers 1,449 source items with no missing item; link and page-number checks pass. All 78 pages were rendered and reviewed as contact sheets, with recorded full-size spot checks. All three PDFs have durable same-file preservation and complete byte readback evidence. A4 is the review format, not a finalized regular-volume trim size.
- At that checkpoint, remote D1 was blocked. Account usage reads recovered, but subscription reads returned 403: the current OAuth connection cannot cover that endpoint and an authorized Billing Read-capable API token would be required. The actual Workers plan was then unknown. No dedicated remote database, migration, binding, image import, paid-plan change or WO02 production activation had been performed at that checkpoint. The later user-supplied Free screen and storage clarification supersede this activation path.

## Current storage and continuation rules

The user supplied a Workers plan screen showing Free / Current plan and clarified that the earlier D1 instruction was based on unfamiliarity with storage products. Use the existing Pages deployment for book JSON and immutable WebP. Keep original files in Drive and current reading/question records in browser storage. No remote D1 provisioning, daily D1 attestation or Billing Read permission is required for this static route.

The released implementation removes the never-activated ebook-only D1 path, keeps exact source and page bytes, and exposes catalog-driven sample links through the canonical learning hero. Follow the current [publication contract](../../library/platform-modules/EBOOK-PUBLICATION-V1.md). The prior SQLite results remain historical; current static and production evidence is recorded above.

WO03 is the SNS entry regular volume, with a 400-body-page minimum and a 420-page target. Use the saved blueprints and research; do not repeat completed research or relabel a 24-page sample as a regular book. Production cloud Chromium and candidate mobile-width checks do not establish physical Android/Galaxy app execution or Safari coverage.
