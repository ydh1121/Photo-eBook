# Personal Edu publishing — current handoff

Updated: 2026-11-06 KST
Phase: WO01 research and foundation in progress
Baseline/main: `b26fbad86238c327960ea12cef9a3268cbdd3173`
Implementation branch: `feat/personal-edu-publishing-foundation-20261106`

The preceding uploaded-media WO is complete (PR #58, deployed code `755ff19188e746ac33282063f91a2cab28da3625`). Continue the new publishing programme from `TASKS.md`; do not reopen its completed analysis or unrelated platform backlog.

The user requests a reference-case horizontal rail with detailed popups, an SNS subject, an eighteen-volume textbook programme (three subjects × six levels, minimum 400 pages each), shared reader with saved text questions and reading position, original visuals preserved in Drive and compressed WebP served from D1 within free allowances, and substantial Korean editorial improvements. Work is explicitly split into quality-focused WOs.

WO01 produces the research/edition contracts and the reference/SNS foundation. Textbook production and reader implementation follow the research stage. Do not publish placeholder books as regular editions or count screen height as authored pages.

Read `docs/spec-v1/20-korean-copywriting-skill.md`, `22-personal-edu-content.md`, `23-learning-discovery-rails.md` and `docs/library/editorial/` before editing. The live COPY_GUIDE has been read. Native Sheet originals and the selected-skill archive are managed through the private project index; no private source IDs enter this repository.

Research, source manuscripts and shared reference/SNS integration are implemented. Final editorial review is complete; two small copy fixes were made in native Sheets and all 1,008 SNS / 2,128 real-estate rows were read back before rebuilding. The previous candidate passed public runtime and case-dialog CI but failed a stale generalization assertion that assumed nine chapters for every course. The runner now uses manifest chapter counts and includes SNS. Next action: verify every required CI check on the corrected head, inspect preview/production UI, publish the foundation, and preserve recovered research plus final release evidence in the private project records.

D1 inspection found no binding in this Pages project. Billing subscription read is unavailable to the current OAuth connection; do not claim that account-wide usage/plan has been verified. No database or paid plan has been created by WO01. WO02 must reconcile the blueprint and reader specification's example volume/page IDs into one explicit contract before implementation.
