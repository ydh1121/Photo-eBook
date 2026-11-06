# Personal Edu V1 — tasks

Updated: 2026-11-06 KST
Branch: `feat/personal-edu-subjects-v1`
Baseline main: `16669aca400a343d772680e47e08a2a48ca708e7`

This is an independent workstream. Do not resume or modify the older platform-library workstream merely because its handoff still says active.

## Accepted scope

- [x] Inspect current repository, content-pack contract, copy rules, image pipeline and existing regression specification.
- [x] Confirm the current main SHA; retain the finished photography page as `/`.
- [x] Establish a separate implementation branch.
- [x] Organize the user-designated project Drive folder; preserve both photography folder names and IDs.
- [-] Build five subject content packs: video, AI, community, real estate and auction.
- [-] Preserve authored content and evidence in the project Drive folders before compiling public snapshots.
- [ ] Add a non-sticky subject menu in the hero and a subject picker above the existing collection FAB.
- [ ] Use the same chapter navigation and collection runtime on every subject.
- [ ] Extract shared hero/section rendering and implement any new learning components in canonical common modules.
- [ ] Wire new canonical modules into Library, Editor, Public and portable manifests without preview copies.
- [ ] Generate and inspect subject images, preserve approved PNG masters in Drive, convert with the existing deterministic WebP tool, then bind verified assets.
- [ ] Validate all routes, content references, mobile/desktop layouts, keyboard actions, saved collection, templates and practice checklist persistence.
- [ ] Run repository-required static boundary and Chromium pipeline checks; record actual results and limitations.
- [ ] Commit and push reviewable work; create a PR with concrete change and validation details.
- [ ] Update the Drive handoff and repository HANDOFF with exact next action and revision.

## Invariants

1. No new homepage. `/` remains photography.
2. The photography chapter bar keeps its existing behavior, motion and sticky lifecycle.
3. Subject navigation scrolls away. The floating subject button is a separate control above the existing `내 모음` button.
4. Existing localStorage keys and saved photography data are preserved. New resource/checklist IDs include a subject namespace.
5. Improvements specific to new learning pages are scoped to those pages.
6. No personal family details or private commercial strategy enter Git, public content, commits or PRs.
7. CODE1/Order sources are read-only references. Project operational documents are owned by this workstream.
8. Do not report a production deployment unless the deployed revision and behavior have actually been verified.
