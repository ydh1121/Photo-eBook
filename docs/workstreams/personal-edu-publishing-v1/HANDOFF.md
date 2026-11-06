# Personal Edu publishing — current handoff

Updated: 2026-11-06 KST
Phase: WO01 complete; WO02 active
Programme baseline: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Current branch: `feat/personal-edu-reader-wo02-20261106`
WO02 baseline: `983500848d50f9cf8a4290b348e47866515229e5`
Reviewed checkpoint: `3e0ebd901d33f7fc12f256578ee4b842ce9f3f08`, [PR #60](https://github.com/ydh1121/Photo-eBook/pull/60)

## Resume here

The WO02 candidate contains the shared reader, three actual 24-body-page sample chapters, original visuals, fixed-page review PDFs and guarded D1 code. The [review preview](https://03b475ac.photo-ebook.pages.dev/staging/ebook-reader-preview/) has been verified. It is an explicitly labelled copied-image adapter using the canonical reader; production manifests still point to D1.

The new reader workflow passes on the exact implementation candidate: 17 reader checks, 38 SQLite asset checks and seven sample groups, including all 72 mobile body pages and portable image delivery. All seven workflow runs pass, including existing Personal Edu runtime 69/69 and reference-case browser checks 12/12. Production verification remains pending. PDF creation and review are complete; all three final PDFs are preserved and full-byte readback matches the approved originals. The actual Workers plan remains unknown because subscription reads return 403 without Billing Read, so remote D1 activation remains blocked. Regular textbooks completed/published: **0/18**.

Candidate CI and artifact preservation are complete. Follow the remote activation steps below. Do not report this preview checkpoint as WO02 production completion.

## Preserved programme and release history

The preceding uploaded-media WO is complete (PR #58, deployed code `755ff19188e746ac33282063f91a2cab28da3625`). Continue the new publishing programme from `TASKS.md`; do not reopen its completed analysis or unrelated platform backlog.

The user requests a reference-case horizontal rail with detailed popups, an SNS subject, an eighteen-volume textbook programme (three subjects × six levels, minimum 400 pages each), shared reader with saved text questions and reading position, original visuals preserved in Drive and compressed WebP served from D1 within free allowances, and substantial Korean editorial improvements. Work is explicitly split into quality-focused WOs.

WO01 produces the research/edition contracts and the reference/SNS foundation. Textbook production and reader implementation follow the research stage. Do not publish placeholder books as regular editions or count screen height as authored pages.

Read `docs/spec-v1/20-korean-copywriting-skill.md`, `22-personal-edu-content.md`, `23-learning-discovery-rails.md` and `docs/library/editorial/` before editing. The live COPY_GUIDE has been read. Native Sheet originals and the selected-skill archive are managed through the private project index; no private source IDs enter this repository.

WO01 is deployed and verified. PR #59 implementation `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` merged as `b261ab21dba65b8cbb5876960c9cd27a55870a7c`. Cloudflare production deployment `eaf07711-7bc4-4bf4-a807-9932b39ea3f3` completed at 2026-11-06T09:12:00.831164Z. Candidate and post-merge checks both pass; runtime 69/69, reference cases 12/12, live module gate 11/11. The live-check automation recorded `964f4b515f2c3d6d1e5f8c54f3d7b40632cc83bf`, a documentation-only commit separate from the product release.

SNS has 9 chapters / 38 blocks / 21 sources. Real estate has 10 chapters / 45 blocks, including 11 detailed cases and 12 supplied profiles. Final native readback covers all 1,008 SNS and 2,128 real-estate rows. Production routes, changed snapshots and new SNS images match the verified files. Manual mobile-width public UI inspection confirmed dialog focus/scroll restoration and SNS video pagination 24 → 49 unique watch links. See `REVIEW.md` and `qa/foundation-release-v1.json` for scope and limitations.

Recovered research, eighteen-volume blueprints, reader/storage designs, source readbacks and selected-skill originals are preserved through the private project index. Do not rerun completed media analysis or recreate the recovered research. WO02 has now reconciled the book/page contract, implemented the common reader and local D1 safeguards, and authored the entry-level sample chapters described below. These samples do not increment the regular-volume count.

WO01's D1 inspection found no binding in this Pages project, and Billing subscription reads were unavailable to that OAuth connection. WO01 did not create a database or change a paid plan. The current account gate is recorded below; recovered design observations are not a fresh account attestation.

## WO02 active checkpoint

The canonical `ebook-reader` owner, stable-ID data model, source builder, guarded D1 service/publisher and local SQLite preview are implemented. Stable IDs are `sns-entry`, `video-entry` and `ai-entry`; the sample edition is `sample-20261106-v1`. Semantic page/block IDs are distinct from authored page numbers and viewport reflow.

| Book | Body pages | Blocks | Review PDF physical pages |
| --- | ---: | ---: | ---: |
| SNS entry | 24 | 104 | 26 |
| Video entry | 24 | 113 | 26 |
| AI entry | 24 | 112 | 26 |
| Total | 72 | 329 | 78 |

Each PDF contains one cover, one contents page and 24 numbered body pages. A4 preserves the authored text, tables and diagrams for review; it does not settle the regular-volume trim size. PDF QA compared 1,449 source items with no missing item, checked 50 source links and 72 contents links, and rendered all 78 pages. Visual review covered every page through contact sheets and recorded full-size spot checks. All three PDFs are preserved in their subject folders; complete downloaded bytes match the approved originals.

Six JSON/Markdown source originals were preserved in Drive and fully byte-readback verified before repository publication. Five original photographs and eight original diagrams produce 13 WebP files totalling 1,309,798 bytes. Full readback covers all delivery files, five PNG masters and the 16-file diagram archive. Private identifiers and receipts remain in the private project record.

Local checks pass: 38 actual SQLite asset cases, four reader model/storage groups, all 13 HTTP image hashes and 72 exact page payloads, canonical boundaries and 24,900 existing Personal Edu static assertions. The local reader runtime attempt stopped because Chromium was unavailable; its four model passes are not browser-runtime evidence. The final candidate's CI separately ran both `scripts/check-ebook-reader.mjs --runtime` and `scripts/check-ebook-samples.mjs --runtime` successfully: 17 reader checks and seven sample groups, including 72 mobile pages and the portable image. The complete final reader artifact has been preserved and byte-readback verified. Earlier failed CI attempts remain historical evidence, not final passes.

`scripts/build-ebook-review.mjs` produces `/staging/ebook-reader-preview/` with the same owner files, exact page JSON and its own reviewed image copies. The verified PR preview is evidence for this review adapter. No WO02 production deployment or remote D1 database creation, migration, binding, image import or activation has been performed. The local SQLite fixture's synthetic proof must never be reused as account evidence.

## Remote D1 activation — ordered remaining steps

1. **Close candidate evidence.** The exact `3e0ebd9` reader/asset/sample CI, three PDFs and full artifact readbacks are complete. All seven final-candidate workflows now pass; existing runtime 69/69 and reference cases 12/12. Preserve those exact-candidate results. Documentation-only follow-ups do not replace the tested implementation SHA.
2. **Verify the real account plan.** Obtain read access that can establish the current Workers plan. Subscription reads currently return 403 because OAuth cannot cover that endpoint; an authorized API token with Billing Read or an independently supplied current Workers plan record is needed. Reconnecting the same OAuth scope does not resolve this limitation. `usage_model: standard`, a website zone's Free label and small observed usage do not establish Workers Free. Keep activation disabled while the plan is unknown or fails the existing gate; do not change subscriptions to make the gate pass.
3. **Collect complete, current account usage.** Record the intended project environment, existing bindings, database count and allocation, all-account D1 storage/read/write usage, and combined Workers/Pages Functions requests. Include other projects and retained editions. Check the current constants in `functions/lib/ebook-asset-budget.js`; the publisher requires explicit observed database size and reserves its own reads/writes.
4. **Prove daily renewal before enabling delivery.** Create `EBOOK_BUDGET_ATTESTATION` only from real plan and complete usage observations. It must be on the same UTC day as the request and no more than 24 hours old. The previous proof becomes invalid at 00:00 UTC (09:00 KST), even if recently issued. Establish and test renewal, application to the serving environment and monitoring of expiry/failure. A missing renewal must leave delivery disabled rather than reuse yesterday's proof. A one-time environment value is not a durable renewal process.
5. **Prepare the dedicated remote database after the gates pass.** Use only this project's intended D1 database, apply `migrations/ebook-assets/0001-assets.sql`, and configure the dedicated `EBOOK_ASSETS_DB` binding in the intended environment. Keep `EBOOK_ASSETS_ENABLED` off while preparing and importing. Do not use another project's database or modify CODE1/Order.
6. **Import and verify real bytes.** Use `publishEbookAssets()` with current attestation and measured allocation, at most 20 input records per call. Verify metadata and every stored SHA-256, then remeasure actual database/account use. Unchanged published assets perform no writes; staged-to-published assets consume the reserved write budget. Local SQLite results do not substitute for these remote checks.
7. **Enable a verified candidate and then validate production.** With a valid binding and fresh proof, enable image serving in the intended review environment, verify all 13 hashes over HTTP plus HEAD/conditional and failure behaviour, and complete the reader/image review. Promote only the verified final revision. Record actual production deployment and byte/UI evidence before marking remote D1 delivery or WO02 complete.
8. **Close the operational record.** Update the private CURRENT/PROJECT_INDEX and release receipts with the final candidate, CI, PDFs, source preservation, account evidence, renewal process and actual deployment result. Keep private IDs and account data outside Git.

The implementation contract is [EBOOK-PUBLICATION-V1.md](../../library/platform-modules/EBOOK-PUBLICATION-V1.md). No account permission, resource, billing or remote activation change is implied by these planned steps.

## WO03 entry condition

After the WO02 quality, preservation and remote-delivery gates are resolved, start the first approved regular volume from the preserved eighteen-volume blueprints. WO03 must produce at least 400 substantive authored body pages with complete worked exercises, independent tasks and solutions, original teaching visuals, current tool/menu evidence and full-edition review. Physical Android menu execution is still unperformed and must be addressed before a regular volume claims a verified mobile walkthrough. The current 24-page chapters remain samples; regular volumes completed/published remain **0/18**.
