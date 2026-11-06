# Personal Edu publishing — current handoff

Updated: 2026-11-06 KST
Phase: WO01 complete; WO02 planned
Baseline/main: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Implementation branch: `feat/personal-edu-publishing-foundation-20261106`

The preceding uploaded-media WO is complete (PR #58, deployed code `755ff19188e746ac33282063f91a2cab28da3625`). Continue the new publishing programme from `TASKS.md`; do not reopen its completed analysis or unrelated platform backlog.

The user requests a reference-case horizontal rail with detailed popups, an SNS subject, an eighteen-volume textbook programme (three subjects × six levels, minimum 400 pages each), shared reader with saved text questions and reading position, original visuals preserved in Drive and compressed WebP served from D1 within free allowances, and substantial Korean editorial improvements. Work is explicitly split into quality-focused WOs.

WO01 produces the research/edition contracts and the reference/SNS foundation. Textbook production and reader implementation follow the research stage. Do not publish placeholder books as regular editions or count screen height as authored pages.

Read `docs/spec-v1/20-korean-copywriting-skill.md`, `22-personal-edu-content.md`, `23-learning-discovery-rails.md` and `docs/library/editorial/` before editing. The live COPY_GUIDE has been read. Native Sheet originals and the selected-skill archive are managed through the private project index; no private source IDs enter this repository.

WO01 is deployed and verified. PR #59 implementation `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` merged as `b261ab21dba65b8cbb5876960c9cd27a55870a7c`. Cloudflare production deployment `eaf07711-7bc4-4bf4-a807-9932b39ea3f3` completed at 2026-11-06T09:12:00.831164Z. Candidate and post-merge checks both pass; runtime 69/69, reference cases 12/12, live module gate 11/11. The live-check automation recorded `964f4b515f2c3d6d1e5f8c54f3d7b40632cc83bf`, a documentation-only commit separate from the product release.

SNS has 9 chapters / 38 blocks / 21 sources. Real estate has 10 chapters / 45 blocks, including 11 detailed cases and 12 supplied profiles. Final native readback covers all 1,008 SNS and 2,128 real-estate rows. Production routes, changed snapshots and new SNS images match the verified files. Manual mobile-width public UI inspection confirmed dialog focus/scroll restoration and SNS video pagination 24 → 49 unique watch links. See `REVIEW.md` and `qa/foundation-release-v1.json` for scope and limitations.

Recovered research, eighteen-volume blueprints, reader/storage designs, source readbacks and selected-skill originals are preserved through the private project index. Do not rerun completed media analysis or recreate the recovered research. Regular textbook manuscripts/published books: 0/18. Next action: start WO02 from the saved reader/publication specification, reconcile book/page IDs, implement the common reader and D1 safeguards, and author actual entry-level sample chapters before producing a regular volume.

D1 inspection found no binding in this Pages project. Billing subscription read is unavailable to the current OAuth connection; do not claim that account-wide usage/plan has been verified. No database or paid plan has been created by WO01. WO02 must reconcile the blueprint and reader specification's example volume/page IDs into one explicit contract before implementation.
