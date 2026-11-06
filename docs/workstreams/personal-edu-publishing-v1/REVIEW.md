# Personal Edu publishing — review record

## WO02 production release complete — 2026-11-07 KST

PR #60 is merged and the three explicitly labelled sample books are available from the SNS, video and AI subject pages. The shared reader, catalog, page JSON and immutable WebP use the existing Pages static deployment. The user-supplied Workers Free proof and storage clarification superseded the never-activated D1 prototype. Manuscript/page bytes and reader anchors are preserved. Regular textbooks completed/published remain **0/18**; WO03 is the SNS entry regular volume, with a 400-body-page minimum and a 420-page target.

| Item | Verified current evidence and boundary |
| --- | --- |
| Exact candidate | `08ceb4da5ee177f99a0ba3190fcca889a2d47ad3`; all seven candidate workflows pass, including the PR-only UI Visual Matrix |
| Merge / released implementation | `bd03c5ded77946a95d720800771a8a4df026a1af`; identical candidate/merge tree `9224e9828bba61b88c8df31976a985d5538d4532` |
| Preview | Successful deployment `3874107d-669a-48f8-93cd-e38e622a0232`, [candidate preview](https://3874107d.photo-ebook.pages.dev/reader/) |
| Production | Successful deployment `3eeabb99-68e3-4bc9-a8fe-f2c6f7d197fb` at 2026-11-06T15:43:14.142258Z, [public reader](https://photo-ebook.pages.dev/reader/) |
| Post-merge workflows | Six normal push workflows plus the live workflow pass. UI Visual Matrix is PR-only; the live workflow separately checks the production UI matrix |
| Reader / static assets / samples | 17/17 reader checks, 33/33 static asset checks and 7/7 sample groups; these replace the old SQLite delivery evidence for the current publication path |
| Candidate mobile coverage | All 72 authored pages at 375 × 812, zero overflow and zero uncaught sample errors; cover, contents, resume, desktop and portable-image paths are included in the sample groups |
| Existing Personal Edu coverage | CI browser fixtures pass 69/69; reference-case contract/browser checks pass 12/12. They are not additional manual production sessions |
| Real production HTTP | 23/23, covering all 13 delivered WebP hashes, 72 exact page payloads, entries and cache/conditional handling |
| Persisted live gate | [Git live report](../platform-library-v1/qa/live-deploy-status.json), source `bd03c5d`, recorded by `2779ed6ef87680ffde78bc191fc2a317e88f6c7f`: prior 11 checks plus the ebook gate, 12/12 total; [live run](https://github.com/ydh1121/Photo-eBook/actions/runs/42245654836) |
| Production interaction | Cloud Chromium at 1363 × 936: SNS/video/AI hero links and reader; 135-character quote saved and retained after reload; page 4 and scroll position 936 restored after reload and generic subject-link reentry |
| Source / anchor integrity | All 81 files in the source/body preservation baseline retain exact byte lengths and SHA-256; 13 original/published WebP pairs match approved hashes; book, edition, page and block IDs remain stable |
| Preserved review originals | Six JSON/Markdown originals, five photo masters, eight teaching diagrams, 13 WebP files (1,309,798 bytes) and three 26-page PDFs retain complete preservation/readback evidence |
| Measured publication budget | 522 files / 13,030,546 bytes; 19,478 file slots remain against the 20,000-file limit; no warning or failure. The per-file limit is 25 MiB, with separate reader/image project budgets |

The current release contains SNS 24 body pages / 104 blocks, video 24 / 113 and AI 24 / 112: **72 body pages / 329 blocks**, excluding covers and contents. All remain `sample-20261106-v1`, not regular editions. See [qa/wo02-static-release.json](qa/wo02-static-release.json) for the structured release record and workflow links.

The current candidate received three direct mobile-PNG spot checks (SNS 13, video 17 and AI 19), with no blocking layout defect observed in those viewports. This is not a claim that every page was manually reread at full size. Production mobile-width execution was not repeated: its exact page/image bytes match the candidate tested at 375 × 812. Physical Android/Galaxy app execution and Safari remain unperformed; current mobile-menu evidence is official documentation plus browser checks.

The final private report/archive and same-ID CURRENT/PROJECT_INDEX updates passed complete-byte readback. Their final IDs and hashes are recorded separately in private project evidence, rather than copied into this public release record. No production merge, daily D1 attestation or database activation remains pending. The next manuscript and its acceptance criteria are in [HANDOFF.md](HANDOFF.md#wo03-acceptance-criteria).

## Historical WO02 — candidate checkpoint, 2026-11-06

Historical status at this checkpoint: implementation, all seven then-final candidate workflows and review artifacts verified; remote D1 activation was pending. That activation path was later superseded. This section is not the current production-completion record. Regular textbooks completed/published at the checkpoint: **0/18**.

| Item | Recorded evidence and boundary |
| --- | --- |
| Candidate | `3e0ebd901d33f7fc12f256578ee4b842ce9f3f08`, [PR #60](https://github.com/ydh1121/Photo-eBook/pull/60), based on `983500848d50f9cf8a4290b348e47866515229e5` |
| Review preview | [Verified candidate preview](https://03b475ac.photo-ebook.pages.dev/staging/ebook-reader-preview/); canonical reader with an explicitly labelled copied-image adapter |
| Authored sample bodies | SNS 24 pages / 104 blocks; video 24 / 113; AI 24 / 112. Total: 72 body pages / 329 blocks, excluding covers and contents |
| Edition contract | `sns-entry`, `video-entry`, `ai-entry`; `sample-20261106-v1`; all three remain `sample` editions |
| Source preservation | Six JSON/Markdown originals saved to Drive and fully downloaded/byte-compared before repository publication |
| Original visuals | Five photographs and eight diagrams; 13 delivery WebP files, 1,309,798 bytes. All WebPs, five PNG masters and the 16-file diagram archive have completed preservation/readback |
| Local asset integration | 38 actual SQLite cases pass, including unchanged-publication write avoidance, staged-publication budget accounting, read reservations, SHA-256 readback and missing/unpublished HEAD/conditional handling |
| Local reader/model checks | Four model/storage groups pass; exact page integrity, semantic IDs, saved positions, edition-specific questions and import validation are covered within the recorded model scope |
| Local sample delivery | All 13 image hashes verified through SQLite/HTTP and all 72 exact page payloads verified; measured SQLite allocation 1,343,488 bytes |
| Existing static boundaries | Canonical owner/dependency boundaries and 24,900 existing Personal Edu static assertions pass |
| CI checkpoint | Final implementation candidate: all seven workflow runs pass. New reader workflow: 17/17 reader checks, 38/38 SQLite asset checks and 7/7 sample groups; existing Personal Edu runtime 69/69 and reference-case browser checks 12/12 |
| Final sample browser evidence | All 72 body pages at 375 × 812, three covers/contents/resume flows, desktop 1280 × 900, portable copied-image review and no uncaught reader errors pass |
| Final CI artifact preservation | Full artifact downloaded, ZIP CRC checked, saved in the private project folder and completely byte-readback verified |
| Local browser attempt | Reader runtime stopped because the local Chromium binary was unavailable. Model passes and the separate verified review preview are not a substitute for the final automated browser workflows |
| Review PDFs | Three PDFs, each 26 physical pages: one cover + one contents page + 24 body pages. Total 78 physical pages; A4 review format does not set the regular-volume trim size |
| PDF content/navigation QA | 1,449 source items checked with zero missing items, 50 source links, 72 contents links and no recorded page overflow |
| PDF visual QA | All 78 pages rendered and reviewed through contact sheets, with recorded full-size spot checks. This is not a claim that every page received a full-size visual inspection |
| PDF preservation | All three approved PDFs are preserved in their subject folders and complete downloaded bytes match the originals |
| Remote account gate | Actual Workers plan unknown; subscription reads return 403 because OAuth cannot cover the endpoint and an authorized Billing Read-capable token would be required. `usage_model: standard` and a website zone's Free label are not plan proof |
| Remote delivery state | No WO02 production deployment, dedicated remote D1 creation, migration, binding, image import or activation has been performed |

At that checkpoint, the review preview proved the reviewed adapter and candidate presentation. The then-production manifests addressed `/api/ebook-assets/<sha256>.webp`; image copies in the review bundle did not prove remote D1 service. That API path is retired in the current static release. Local synthetic budget attestations are fixtures and cannot be promoted to real account evidence. Private source identifiers and account observations stay outside Git.

### Historical acceptance gates — superseded

These were the outstanding steps for the old D1 design. They are preserved as history and are not instructions for the current static release.

1. Attach the passing final-candidate CI and artifact evidence to the same-ID operational record. All seven workflow runs, final PDFs and full byte readbacks are complete.
2. Keep the tested implementation SHA separate from documentation-only follow-up commits.
3. Establish the actual Workers Free plan and complete account-wide usage evidence through authorized read access. Keep serving disabled while proof is missing, incomplete or outside the enforced budget.
4. Prove the attestation renewal and serving-environment update process before activation. Proof is valid only on the same UTC day and for at most 24 hours. It expires at the UTC day boundary (00:00 UTC / 09:00 KST) even if issued shortly beforehand; a one-time configuration value does not provide renewal.
5. After those gates pass, prepare the dedicated project database and binding with serving disabled, import verified bytes within the publisher limits, remeasure usage, and verify actual remote hashes and conditional responses. Complete candidate UI checks and actual production verification before closing WO02. This former D1 activation sequence was superseded by the static publication decision; it must not be resumed for this release.

At this checkpoint, mobile/menu evidence came from official documentation and browser-width checks. Physical Android/Galaxy app execution and Safari coverage were unperformed and remain outside current coverage. The planned regular-volume gates required the substantive 400-page minimum, complete practice/solutions and full-edition review. The preserved eighteen-volume blueprints remain the starting material; the three sample chapters do not increment the regular-volume count.

## WO01 — research and foundation review (preserved release history)

Status: deployed and verified, 2026-11-06.

### Delivered

- SNS subject at `/sns/`, using the existing source, navigation, collection, discovery and shared-module contracts.
- Real-estate reference rails with 11 detailed cases and 12 supplied profiles. The shared dialog distinguishes observed material, editorial interpretation, capture-time reactions, practice and source links.
- Canonical `reference-case-rail` and `content-detail-dialog` owners used by Library, Editor, Public and declared portable dependencies.
- Research covering 39 official sources and 14 distinct curricula, eighteen original volume blueprints with 420 substantive pages budgeted per volume, mobile-tool evidence criteria and reader/D1 designs.
- Original licensed skill sources and original research preserved in the private project record. No private Drive identifiers or uploaded media were added to this repository.

### Release evidence

| Item | Evidence |
| --- | --- |
| PR | [#59](https://github.com/ydh1121/Photo-eBook/pull/59) |
| Tested implementation | `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` |
| Merge / deployed code | `b261ab21dba65b8cbb5876960c9cd27a55870a7c` |
| Production deployment | `eaf07711-7bc4-4bf4-a807-9932b39ea3f3`, success at 2026-11-06T09:12:00.831164Z |
| Candidate CI | Seven checks pass; [runtime run](https://github.com/ydh1121/Photo-eBook/actions/runs/42192469635) |
| Post-merge CI | Seven checks pass; [runtime run](https://github.com/ydh1121/Photo-eBook/actions/runs/42193189689) |
| Public/runtime fixtures | 69/69, no uncaught browser diagnostics |
| Reference-case contract and browser checks | 12/12 |
| Production common-module gate | 11/11; [live run](https://github.com/ydh1121/Photo-eBook/actions/runs/42193189662) |
| Additional live reports | Runtime feedback 14 checks, module families 9 checks, visual matrix 76 states |
| Content/static checks | 24,900 assertions; video discovery 58/58; opportunity discovery 79/79 |
| Source round trip | SNS 1,008 rows and real estate 2,128 rows, byte-identical restored snapshots |
| Production HTTP | Seven routes, two changed course snapshots and two new SNS WebP files match verified files |

The old generalization check assumed nine chapters for every course. The added real-estate case chapter correctly made ten. The runner now reads expected counts from the generated course manifest and includes SNS; the corrected candidate and live checks passed.

### Actual public-page observations

Manual inspection used connected Chrome at 375 × 812. SNS showed the correct title and nine chapters with no horizontal document overflow. The real-estate dialog fit inside the viewport, focused its heading, locked background scrolling and closed through Escape. Closing restored both the original trigger and the exact 8,216px reading position.

On SNS, the public recommendation list increased from 24 to 49 cards after scrolling to its end; all 49 watch URLs were distinct. The page merged bundled entries with current external metadata, so its visible count differed from the API-only observation of 17 items. Live counts are time-dependent. An earlier cached notice response displayed eight entries with a stale warning; a separate HTTP observation at 09:14 UTC found all four notice providers healthy and eight unique notices. Neither observation was substituted for the other.

Desktop/mobile candidate screenshots of the new hero, practice section and dialog were visually inspected. The two new SNS WebP files total 207,922 bytes; PNG masters and WebP derivatives remain in the private image folders. Existing image records and photography sources remain preserved.

### Remaining programme scope at the WO01 release

The following scope boundary records the WO01 release. The completed WO02 production release and next WO03 scope are recorded above.

WO01 does not deliver any regular 400-page textbook, the new common ebook reader, selection-to-question reader persistence, or D1 image serving. All eighteen manuscripts remain unproduced. Research covers publicly available contents, descriptions and curricula, not full access to paid books or course videos.

WO02 must reconcile the blueprint/specification's example identifiers, implement the reader, verify actual account plan/usage, enforce D1 budgets and exercise real sample chapters. Billing subscription access was unavailable during design; free-tier safety has not been certified and no paid plan or database was activated.

Automated browser fixtures verify bundled content and shared dependencies; they do not prove third-party availability or a new finished HTML/ZIP export product. Physical Android/Galaxy and Safari tests were not performed. Official help-page checks are not recorded as native app execution.
