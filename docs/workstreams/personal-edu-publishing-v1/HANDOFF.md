# Personal Edu publishing — current handoff

Updated: 2026-11-06 KST
Phase: WO01 complete; WO02 active
Baseline/main: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Current branch: `feat/personal-edu-reader-wo02-20261106`
Current baseline: `983500848d50f9cf8a4290b348e47866515229e5`

The preceding uploaded-media WO is complete (PR #58, deployed code `755ff19188e746ac33282063f91a2cab28da3625`). Continue the new publishing programme from `TASKS.md`; do not reopen its completed analysis or unrelated platform backlog.

The user requests a reference-case horizontal rail with detailed popups, an SNS subject, an eighteen-volume textbook programme (three subjects × six levels, minimum 400 pages each), shared reader with saved text questions and reading position, original visuals preserved in Drive and compressed WebP served from D1 within free allowances, and substantial Korean editorial improvements. Work is explicitly split into quality-focused WOs.

WO01 produces the research/edition contracts and the reference/SNS foundation. Textbook production and reader implementation follow the research stage. Do not publish placeholder books as regular editions or count screen height as authored pages.

Read `docs/spec-v1/20-korean-copywriting-skill.md`, `22-personal-edu-content.md`, `23-learning-discovery-rails.md` and `docs/library/editorial/` before editing. The live COPY_GUIDE has been read. Native Sheet originals and the selected-skill archive are managed through the private project index; no private source IDs enter this repository.

WO01 is deployed and verified. PR #59 implementation `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` merged as `b261ab21dba65b8cbb5876960c9cd27a55870a7c`. Cloudflare production deployment `eaf07711-7bc4-4bf4-a807-9932b39ea3f3` completed at 2026-11-06T09:12:00.831164Z. Candidate and post-merge checks both pass; runtime 69/69, reference cases 12/12, live module gate 11/11. The live-check automation recorded `964f4b515f2c3d6d1e5f8c54f3d7b40632cc83bf`, a documentation-only commit separate from the product release.

SNS has 9 chapters / 38 blocks / 21 sources. Real estate has 10 chapters / 45 blocks, including 11 detailed cases and 12 supplied profiles. Final native readback covers all 1,008 SNS and 2,128 real-estate rows. Production routes, changed snapshots and new SNS images match the verified files. Manual mobile-width public UI inspection confirmed dialog focus/scroll restoration and SNS video pagination 24 → 49 unique watch links. See `REVIEW.md` and `qa/foundation-release-v1.json` for scope and limitations.

Recovered research, eighteen-volume blueprints, reader/storage designs, source readbacks and selected-skill originals are preserved through the private project index. Do not rerun completed media analysis or recreate the recovered research. Regular textbook manuscripts/published books: 0/18. Next action: start WO02 from the saved reader/publication specification, reconcile book/page IDs, implement the common reader and D1 safeguards, and author actual entry-level sample chapters before producing a regular volume.

D1 inspection found no binding in this Pages project. Billing subscription read is unavailable to the current OAuth connection; do not claim that account-wide usage/plan has been verified. No database or paid plan has been created by WO01. WO02 must reconcile the blueprint and reader specification's example volume/page IDs into one explicit contract before implementation.

## WO02 active checkpoint

The canonical `ebook-reader` owner, stable-ID data model, source builder, guarded D1 service/publisher and local SQLite preview are implemented. Stable IDs: `sns-entry`, `video-entry`, `ai-entry`; edition `sample-20261106-v1`. Three real sample chapters contain 24 body pages each and 329 blocks total. Six JSON/Markdown source files were preserved in Drive and fully byte-readback verified before repository publication. Thirteen original WebP visuals total 1,309,798 bytes; all delivery bytes, five PNG masters and the 16-file diagram archive were also verified. PDF review editions are undergoing 78-page rendering/QA.

Local checks pass: 38 actual SQLite asset cases, four reader model/storage groups, all 13 HTTP image hashes and 72 exact page payloads, canonical boundaries and 24,900 existing Personal Edu static assertions. `scripts/check-ebook-reader.mjs --runtime` and `scripts/check-ebook-samples.mjs --runtime` must run in the new Chromium workflow. The local environment has no Chromium binary; this is not a browser-runtime pass.

`scripts/build-ebook-review.mjs` creates an explicitly labelled review/offline bundle under `/staging/ebook-reader-preview/`, consuming the same owner files and reviewed asset bytes. Its copied-image adapter is for inspection; production `/reader/` manifests still use D1. No production deployment, database, binding or image import has been performed for WO02.

Account usage reads have recovered, but the actual Workers plan remains unverified because the Cloudflare connection lacks Billing Read. Do not infer plan from `usage_model: standard` or a website zone's Free tier. Free-plan verification and a reliable daily proof-renewal process are activation gates. Next: complete exact-candidate Chromium/PDF review, preserve the reviewable artifacts and PR, then update CURRENT/PROJECT_INDEX with this blocker and the exact remote activation steps. Physical Android tool menus remain unexecuted, and regular textbooks completed/published remain 0/18.
