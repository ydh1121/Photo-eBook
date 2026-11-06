# Personal Edu V1 — handoff

Updated: 2026-11-06 UTC
Phase: source rewrite verified; discovery integration and release validation active
PR: https://github.com/ydh1121/Photo-eBook/pull/57 — merged
Tested PR HEAD: `9834fafc020d65375f736571ebc06a61b22a1353`
Deployed code: `7ce547910893eb819e712df3620063edc2980e5d`
Production: https://photo-ebook.pages.dev/
Cloudflare deployment: `7d9fd907-9144-4b1d-8531-59e705a51981`
Deployed at: 2026-11-06T04:47:43.013488Z

## Next action

Uploaded media analysis is complete. The revised real-estate course covers planning, filming, presenter-led tours, AI voice/captions, publication, local content, property basics, education, and inquiry operations. Native Sheet readback restores all 1,016 rows byte-identically to the updated 9-chapter / 41-block snapshot. Detailed media evidence remains in the private project folder.

Continue integration and release verification on `feat/personal-edu-video-evidence-v2`, based on main `2d3eb05a55de303d349ba0c8caadb86dfde3bb09`. Discovery now has an expanded public metadata index, modern YouTube result parsing, source filters, caption/hashtag search, continuation cursors, and end-of-rail loading. Build with the v3 resource-module cache keys, run static/runtime/module gates, inspect actual preview counts and interactions, then merge and verify production before marking this follow-up complete.

Live baseline: the five new subject rails exposed 2/2/2/2/1 videos. The learning API stopped at a two-item fallback while the photography API returned 12 for the same query. Preserve photography behavior and the working official-notice pipeline. Do not publish private source identifiers/media in Git or retry local Dot/cloud social-media playback.

The user's stray period was not a task change. This workstream is independent of CODE1/Order and the older platform-library backlog. CODE1/Order remains read-only.

## Released product

- Photography stays at `/`; new paths are `/video/`, `/ai/`, `/community/`, `/real-estate/`, `/auction/`. No new homepage.
- One-row subject menu with native horizontal overflow, non-sticky main menu, aligned subject/collection FABs, filled active selection, equal close-button insets and centered SVG icon.
- Original photography chapter-navigation owner, sticky lifecycle, motion and saved data preserved.
- Shared learning hero/section, subject navigation and resource rail modules use the same Registry owners in Library, Editor, Public and declared-dependency export consumers. Saved/checklist state is isolated per subject and Editor instance.
- 45 chapters, 194 blocks, 48 sources, 49 related links. Five native source Sheets contain 3,731 rows. The two filming updates were read back and byte-matched before snapshots/build; 212 dependent formula ranges passed.
- Six filming topics, a 45-second storyboard, next-action examples, production brief, inquiry handling and 24-hour/seven-day reflection are authored practice exercises. They are not claims of observed channel patterns.
- Ten learning images applied: eight accepted v2 scenes and two v3 image edits. All ten actual deployed WebP files match repository bytes. The original 48 photography image slots are preserved.
- Official education/support notices use region/type filters, source/deadline closure and separate unknown/failure states. A failed request never proves closure.

## Verified evidence

- Tested PR HEAD: all seven checks pass; Personal Edu runtime 57/57 pass. Run https://github.com/ydh1121/Photo-eBook/actions/runs/42164245595
- Implementation: 15,504 static assertions, 40 video-parser checks, 77 official-notice checks, canonical boundaries, deterministic build and syntax checks pass.
- Deployed merge: all seven commit checks pass; repeated runtime 57/57 pass, run https://github.com/ydh1121/Photo-eBook/actions/runs/42164564491
- Actual production module gate: 11/11 pass, run https://github.com/ydh1121/Photo-eBook/actions/runs/42164564573
- Six production routes inspected. The subject picker and region/type filters work. Both FAB centers match with a 12px vertical gap. Ten production image bytes/SHA values match.
- Four official providers responded normally. At the recorded check, video had 32 notices (7 open, 7 unknown, 18 closed); AI 24; community 12; real-estate and auction 7 closed each. These counts are a dated verification, not permanent inventory.
- All five live video APIs returned the verified metadata recommendation fallback (2/2/2/2/1 items). Successful upstream YouTube search is not claimed.

Evidence: `qa/release-qa.json`, `qa/production-verification.json`, `REVIEW.md`. The automated live-deploy workflow records its own status in the pre-existing platform-library QA file; that does not reopen its unrelated backlog. A later docs-only main commit may differ from the deployed code SHA; compare runtime trees before treating that as a failed deployment.

## Limits and resume rules

Actual Galaxy/Safari hardware was not tested. Static-server discovery tests use fixtures; live responses were checked separately. The standalone dependency fixture is not a new HTML/ZIP export product.

Local Dot is cancelled. The private archive preserves 18 Instagram accounts, six YouTube channels and twelve representative metadata references. Actual file analysis must cite file names and time ranges, distinguish visible actions from inference, and enter native source Sheets before validated snapshots/build when accepted into lessons.

Read AGENTS.md and this workstream's TASKS.md, compare actual Git/PR/deployment state, then read the private Drive CURRENT/PROJECT_INDEX records. Preserve both original photography folder names and IDs. Keep private family, financial, commercial and authentication details outside Git and public content.
