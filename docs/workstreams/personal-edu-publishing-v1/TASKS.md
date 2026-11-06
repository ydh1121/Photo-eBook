# Personal Edu — publishing programme

Started: 2026-11-06 KST
Baseline: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Branch: `feat/personal-edu-publishing-foundation-20261106`

## Scope and sequencing

The new request is a staged programme. Do not claim that the complete multi-volume textbooks or viewer are delivered by the foundation WO. The previous media-analysis release remains complete.

1. **WO01 — research and foundation:** official publishing/course research, level and editorial contracts, selected licensed skill originals in the private project folder, reference-case rail/dialog, and the SNS subject route.
2. **WO02 — shared reader and asset delivery:** canonical reader, stable edition/page anchors, selection-to-question storage, reading-position restoration, accessible controls, D1-backed WebP delivery and enforced resource budgets. Exercise authored sample chapters before any regular textbook release.
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
- D1 is the requested WebP origin. Do not silently replace it with another storage product or enable a paid subscription. Current plan/usage uncertainty must remain explicit until verified.
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

## Current WO — WO02 active

- [x] Resolve IDs: `sns-entry`, `video-entry`, `ai-entry`; sample edition `sample-20261106-v1`. Page and block IDs are semantic and stable; page numbers are editorial positions.
- [x] Implement the common reader with selection-to-question saving and last-position restoration across page/edition changes; canonical ownership and static model checks pass.
- [-] D1 serving/publisher and enforced budgets implemented; actual local SQLite integration passes 38 cases. Actual Workers plan verification, remote binding/import and production activation remain gated by unavailable Billing Read.
- [-] Author three real sample chapters (24 body pages each), preserve/read back all sources and original visuals, then complete fixed-page PDF and Chromium validation.
- [x] Record official mobile-tool evidence separately. Physical Android menu execution is explicitly unverified and remains a regular-volume release gate.

Regular textbooks completed/published: **0/18**. The foundation closes WO01 only. WO03–20 and the final subject-page editorial integration remain planned work.

## WO02 working checkpoint

- Branch: `feat/personal-edu-reader-wo02-20261106`, baseline `983500848d50f9cf8a4290b348e47866515229e5`.
- Three sample chapters target 24 substantive pages each; cover/contents excluded; not regular textbooks.
- Shared example: a fictional local bookmark workshop, explicitly labelled as an independent learning exercise.
- Reader owner: `ebook-reader` canonical module plus explicit publication adapter.
- Initial D1 account read: no project binding; Billing Read unavailable through current OAuth connection; analytics initially rate limited. Keep remote image activation gated until account conditions are verified.
- Authored samples: SNS 104 blocks, video 113 blocks, AI 112 blocks; 72 substantive body pages total. Cover/contents excluded. Final JSON and Markdown files (six) were preserved and byte-readback verified before snapshots were copied.
- Visuals: five generated photographs and eight original diagrams; 13 WebP files total 1,309,798 bytes. Full readback verifies 13 delivery files, five PNG masters and the 16-file SVG/PNG diagram archive. No D1 production upload is claimed.
- Exact-byte local HTTP verification covers every WebP and all 72 page payloads. Local actual SQLite allocation is 1,343,488 bytes. Existing Personal Edu static checks pass (24,900 assertions).
- Added a clearly labelled offline/review adapter with the same Registry owner. Production manifests retain D1 asset URLs; the review bundle supplies its own copied images for inspection while activation is gated.
- Next: run the Chromium reader and sample-page workflow, review PDF pages, preserve evidence and update same-ID operational records. Do not mark WO02 production-complete without the remaining account and remote D1 evidence.
