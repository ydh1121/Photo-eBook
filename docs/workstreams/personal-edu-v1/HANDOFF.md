# Personal Edu V1 — handoff

Updated: 2026-11-06 UTC
Phase: WO complete; PR #58 merged, production verified, private evidence and operational readbacks complete
Branch: `main` (implementation branch: `feat/personal-edu-video-evidence-v2`)
PR: https://github.com/ydh1121/Photo-eBook/pull/58 — merged 2026-11-06T06:52:54Z
Tested implementation HEAD: `19b7f9e350e0f08371f977fce15a141e3737a6c7`
Deployed merge: `755ff19188e746ac33282063f91a2cab28da3625`
Cloudflare deployment: `4d0da2f7-2e73-4911-ae73-276c2cdfb97f`
Deployed at: 2026-11-06T06:53:11.203244Z
Current preview: https://6bcea703.photo-ebook.pages.dev/
Current real-estate source SHA-256: `50a7c47836bb01694f992aa166053b13f00559d2cfee467dfb0d62f3d4b85e31`
Production: https://photo-ebook.pages.dev/ — verified
Deployment URL: https://4d0da2f7.photo-ebook.pages.dev/

## Current checkpoint and next action

The supplied media and matching captures have been analyzed using video frames, captions/captures and machine-generated transcripts. The presenter-led sequence received detailed frame/text comparison; direct listening was not performed. This work is complete; the PR #57 statement that actual analysis was deferred is historical. Original uploads, their names, private source identities, and detailed evidence stay outside the public repository.

The rewritten real-estate course covers room-tour planning, filming, presenter-led tours, AI voice and captions, publication, local content, property basics, education, and inquiry handling. The latest native Sheet readback restores all 1,016 rows byte-identically to source SHA `50a7c47836bb01694f992aa166053b13f00559d2cfee467dfb0d62f3d4b85e31`. Its 735 primitive values and 124 dependent formula ranges were checked. It contains 9 chapters, 41 blocks and 14 sources. Across the five subjects, the current totals are 45 chapters, 196 blocks, 52 sources, 57 related links and 3,996 native source rows. The other four source records and previous source history are preserved.

All seven checks passed on the tested premerge revision and on the deployed merge. Premerge runtime run 42174475738 passed 59/59 in attempt 2; attempt 1 was cancelled during APT browser dependency installation and produced no application runtime result. The deployed merge's automatic runtime run 42177247757 independently passed 59/59 with zero browser diagnostics. Its production canonical module gate, run 42177247709, passed 11/11 against the live site. These are current-release results, separate from PR #57.

The production assets use resource JS/CSS cache version `v4`. Public implementation and release checks are complete. The private analysis/release archive contains 284 files; its full remote bytes and hash match the local archive. The summary and four standalone evidence files also passed full-byte readback. CURRENT and PROJECT_INDEX were updated at their existing IDs, read back byte-identically, and preserve history. All five subjects' production observations are recorded separately from preview and fixture counts. This WO is complete; resume from these records and the actual Git state only when a new follow-up is requested. Documentation-only revisions may follow the deployed product revision.

## Current implementation and evidence

- The public metadata index contains 517 subject records: video 138, AI 126, community 85, real-estate 107, auction 61. Real-estate has 99 YouTube records and 8 Instagram posts verified from supplied captures. IDs are unique within each subject; this is not a claim of 517 distinct videos watched.
- Discovery supports modern YouTube metadata formats, actual continuation pages, 12 bounded queries per subject, keyword/caption/hashtag search, source filters, ID deduplication, and automatic loading near the end of the horizontal rail. Failures retain cards and a usable cursor; source exhaustion does not loop back to the beginning.
- Real-estate's initial recommendations prioritize verified home-introduction and filming/editing examples. Reviewed exclusions do not return during index refresh or live search. Price lookup and contract documents remain later search topics.
- Local checks passed: 16,531 static assertions, 55 video contracts, 77 official-notice checks, canonical module boundaries, syntax and diff checks. The current premerge and postmerge browser suites each passed 59/59.
- At preview revision `531ce77b2c5924652e9c97155bd115d239bbc11a`, cloud-browser inspection observed real-estate cards grow from 19 to 33 to 51 through actual horizontal scrolling, with 33 and 51 unique IDs respectively. Initial counts were video 20, AI 20, community 19 and auction 29, all with further loading available. These are dated preview observations.
- The same preview's Instagram filter returned 8 posts, clicking `#신림원룸` returned 2, and caption search for `예산` returned 1. A captured contract-complete reference retained its explanatory label.
- The first-click chapter-layout issue is fixed in the shared resource owner at `19b7f9e350e0f08371f977fce15a141e3737a6c7`. The live notice stage reserves 512px before data arrives. In the actual fresh `/video/` preview, the resources chapter's document top was 19,743.40625px before and after 32 notices arrived: delta 0px. The loaded results occupied 459.046875px, the chapter settled at viewport top 72.40625px, and the active menu stayed 자료. No second menu click or corrective target scroll was used.
- The regression fixture now delays notice responses and checks first-click destination/active-menu stability before any `scrollIntoView` for the video rail. It retains the automatic paging, duplicate, retry, platform and caption/hashtag assertions.

## Production acceptance

Actual cloud-browser inspection confirmed the deployed subject headings, nine learning chapters, v4 resource scripts and the existing photography image rendering. Real-estate video cards grew from **17 → 31 → 47** through horizontal scrolling, with the same number of unique IDs at each step. The Instagram filter returned 8 posts, all from Instagram; the captured contract-complete label remained visible. Clicking `#신림원룸` returned 2 posts and caption search for `예산` returned 1. These are dated production observations and differ from the earlier preview counts.

The final initial production observations were:

| Subject | Cards | Unique IDs | Further loading |
| --- | ---: | ---: | --- |
| Video | 20 | 20 | Available |
| AI | 20 | 20 | Available |
| Community | 19 | 19 | Available |
| Real-estate | 17 | 17 | Available |
| Auction | 29 | 29 | Available |

AI first showed 13 stored metadata references. A later refreshed view showed 20, and automatic loading increased it to 32 with 32 unique IDs. Both the 13-card first observation and 20-card later observation remain in JSON evidence. Photography retained 10 chapters and six subject links; the two FAB centers differed by 0px and their vertical gap was 12px. The completed observation record is dated 2026-11-06T07:04:18.104Z.

The live module gate passed 11/11, its Library feedback checks 13/13, module-family checks 9/9 and visual matrix 68 states; Block Lab mobile controls also passed. The postmerge runtime artifact contains 59 passing checks, zero diagnostics and 58 screenshots. In its controlled fixture, late notices preserved 72.34375px → 72.34375px target position and pagination followed 0 → 3 → 6 failure → 6 retry → 9 completion. Fixture counts are not production inventory. Nine premerge screenshots were inspected with no blocking visual finding; the 58 generated screenshots are not all claimed as manually inspected.

Current public evidence: `qa/video-evidence-v2.json`, `REVIEW.md`, `docs/spec-v1/23-learning-discovery-rails.md`. Successful metadata discovery does not claim playback of every result.

## Boundaries and resume rules

Photography stays at `/`; the five subject paths and existing chapter-navigation owner remain unchanged. The layout fix belongs to `learning-resource-rail` and does not replay or replace the photography navigation behavior. Resource rails still compose the canonical horizontal-rail and filter-chip-rail owners across Library, Editor, Public and declared-dependency consumers. Preserve the working official-notice pipeline and original bookmark storage.

Local Dot remains cancelled. Do not retry cloud social-media playback or account login. Known Instagram posts may refresh public metadata; this is not an authenticated profile-wide crawler. No recurring monitoring task is configured. Actual Galaxy/Safari hardware remains untested; static-server tests use fixtures; the dependency fixture is not a new HTML/ZIP export product.

Read AGENTS.md, TASKS.md, current Git/PR/deployment state, and the private CURRENT/PROJECT_INDEX records when resuming. Preserve original photography folder identities and all source history. CODE1/Order is read-only; this workstream does not reopen the unrelated platform-library backlog. The user's stray period was not a task change. Keep private household, financial, commercial, authentication and source identifiers outside Git and public content.

## Historical PR #57 release — superseded checkpoint

The following product and verification records describe PR #57, not the current PR #58 release. Its deferred-analysis statements were valid at that earlier checkpoint and are superseded by the completed uploaded-reference analysis above.

PR: https://github.com/ydh1121/Photo-eBook/pull/57 — merged
Tested PR HEAD: `9834fafc020d65375f736571ebc06a61b22a1353`
Deployed code: `7ce547910893eb819e712df3620063edc2980e5d`
Cloudflare deployment: `7d9fd907-9144-4b1d-8531-59e705a51981`
Deployed at: 2026-11-06T04:47:43.013488Z

### Product at PR #57

- Photography stays at `/`; new paths are `/video/`, `/ai/`, `/community/`, `/real-estate/`, `/auction/`. No new homepage.
- One-row subject menu with native horizontal overflow, non-sticky main menu, aligned subject/collection FABs, filled active selection, equal close-button insets and centered SVG icon.
- Original photography chapter-navigation owner, sticky lifecycle, motion and saved data preserved.
- Shared learning hero/section, subject navigation and resource rail modules use the same Registry owners in Library, Editor, Public and declared-dependency export consumers. Saved/checklist state is isolated per subject and Editor instance.
- 45 chapters, 194 blocks, 48 sources, 49 related links. Five native source Sheets contain 3,731 rows. The two filming updates were read back and byte-matched before snapshots/build; 212 dependent formula ranges passed.
- Six filming topics, a 45-second storyboard, next-action examples, production brief, inquiry handling and 24-hour/seven-day reflection are authored practice exercises. They are not claims of observed channel patterns.
- Ten learning images applied: eight accepted v2 scenes and two v3 image edits. All ten actual deployed WebP files match repository bytes. The original 48 photography image slots are preserved.
- Official education/support notices use region/type filters, source/deadline closure and separate unknown/failure states. A failed request never proves closure.

### Verification at PR #57

- Tested PR HEAD: all seven checks pass; Personal Edu runtime 57/57 pass. Run https://github.com/ydh1121/Photo-eBook/actions/runs/42164245595
- Implementation: 15,504 static assertions, 40 video-parser checks, 77 official-notice checks, canonical boundaries, deterministic build and syntax checks pass.
- Deployed merge: all seven commit checks pass; repeated runtime 57/57 pass, run https://github.com/ydh1121/Photo-eBook/actions/runs/42164564491
- Actual production module gate: 11/11 pass, run https://github.com/ydh1121/Photo-eBook/actions/runs/42164564573
- Six production routes inspected. The subject picker and region/type filters work. Both FAB centers match with a 12px vertical gap. Ten production image bytes/SHA values match.
- Four official providers responded normally. At the recorded check, video had 32 notices (7 open, 7 unknown, 18 closed); AI 24; community 12; real-estate and auction 7 closed each. These counts are a dated verification, not permanent inventory.
- All five live video APIs returned the verified metadata recommendation fallback (2/2/2/2/1 items). Successful upstream YouTube search is not claimed.

Evidence: `qa/release-qa.json`, `qa/production-verification.json`, `REVIEW.md`. The automated live-deploy workflow records its own status in the pre-existing platform-library QA file; that does not reopen its unrelated backlog. A later docs-only main commit may differ from the deployed code SHA; compare runtime trees before treating that as a failed deployment.


Historical evidence files remain `qa/release-qa.json` and `qa/production-verification.json`; they are not current-release acceptance results. At that release, actual video analysis awaited uploaded files.
