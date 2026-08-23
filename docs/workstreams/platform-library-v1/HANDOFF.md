# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `fix/filter-chip-live-editor-v2`
Production branch: `main`
Status: `admin UI refinement / PR #11 clean QA passed / merge pending`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current `main` HEAD

## Product direction

`UI 라이브러리`는 실제 reusable UI를 한 번에 하나씩 조작하는 Live UI Kit다.

Components:
- 상단 메뉴
- 가로 카드
- 범용 필터칩
- 하단 팝업
- 다른 기기
- 플로팅 버튼

Meaning:
- `범용 필터칩` = bottom sheet 실제 `#collectionFilters > .collection-filter`를 기준으로 한 플랫폼 공통 Chip Design System
- 상단 메뉴는 common Chip paint를 소유하지 않고 layout / sticky / reading progress만 소유
- 다른 기기 = 실제 `.collection-device-accordion` 하나만 표시
- 초기 상태 = production CSS 원본, 사용자 변경값만 V2 override

## Current filter-chip feedback patch

User feedback identified three concrete issues:
- four separate specimen cards made a single component unnecessarily hard to compare;
- the isolated filter rail did not reproduce the intended rail-to-chip spacing;
- desktop mouse drag stopped immediately instead of carrying momentum.

PR #11 changes the filter-chip editor as follows:
- retires `filter-chip-specimens-v1.js`; no clone-based specimen board remains;
- renders one real `#collectionFilters` rail directly in the preview;
- adds preview-only sample chip input with add / last delete / reset actions;
- exposes rail top / right / bottom / left padding separately;
- exposes chip horizontal / vertical padding and chip gap;
- migrates legacy `runway` to the four explicit rail paddings;
- preserves tuned geometry when switching Material / iOS Flat / iOS Liquid family;
- when a family is first chosen, uses the former top-nav canonical gap `9px` and rail inset `5.5px` as missing geometry defaults;
- adds velocity-based desktop mouse inertia with post-drag click suppression;
- leaves native mobile horizontal scrolling unchanged.

New runtime owner: `public/ui-dashboard/sandbox/filter-chip-live-runtime-v2.js`.
New editor style: `public/assets/styles/ui-dashboard/builder-filter-chip-live-v2.css`.
Dashboard entry is bumped to `builder-entry-audit-v1.js?v=10` on the branch.

Two implementation regressions were found and fixed during CI:
- `MutationObserver` annotation loop that could keep the library runtime busy;
- `startMomentum()` zeroing velocity before the first animation frame, which made the rail stop exactly at mouse release.

Temporary diagnostics were removed after isolating those issues.

## Global Chip ownership

Canonical paint owner: `public/ui-dashboard/sandbox/global-chip-runtime-v1.js`
Runtime marker: `__platformGlobalChipRuntimeV4`
Style marker: `platform-global-chip-style-v4`

Canonical styles restored from the former top navigation:
- Material: `#f1f3f6`, former border, no shadow, no blur
- iOS Flat: `rgba(244,247,251,.88)`, 12px blur, former shadow
- iOS Liquid: 22px blur / saturate 138% glass, moving v37 selector
- inactive common chips remain transparent
- top nav / bottom-sheet filters share the same family and accent

`filter-chip-live-runtime-v2.js` owns filter-rail geometry and desktop drag momentum only. It does not replace common Chip paint.
`runtime-audit-patch-v1.js` and legacy capability runtime do not own common Chip paint.
Production `nav-corrections.css` remains intact; global family selectors have final representation priority only while the builder/UI Kit override is active.

## Page runtime

`/ui-dashboard/` uses `/ui-dashboard/sandbox/`, never production `/photography/`.

Important owners:
- `builder-v1.js`: inspector / block DnD chrome
- `builder-page-audit-v1.js`: editor fixed-pin nav fallback
- `builder-progress-owner-audit-v1.js`: removes retired standalone progress owner
- `builder-page-live-v2.js`: V2 override → sandbox runtime
- `builder-dynamic-sync-v1.js`: dynamic collection/filter/device sync
- `builder-sandbox-ads-v1.js`: side-ad configuration
- `builder-side-ad-zone-audit-v1.js`: side-ad geometry/visibility
- `builder-reset-audit-v1.js`: canvas draft reset
- `builder-late-frame-bootstrap-v1.js`: missed iframe lifecycle recovery

Safari deferred sticky and mobile native horizontal scrolling remain unchanged.

## Live UI Kit runtime

Route: `/ui-dashboard/?view=library`

- `builder-library-kit-v2.js`: parent Live UI Kit owner
- `builder-global-chip-kit-v1.js`: filter family presets + sample chip editor + geometry-preserving style switch
- `builder-library-state-sync-v1.js`: state/config resync
- `builder-library-notes-v1.js`: modification notes
- `sandbox-kit-v4.js`: standalone actual component extraction
- `global-chip-runtime-v1.js`: common Chip paint/selector owner
- `filter-chip-live-runtime-v2.js`: one-rail preview, filter geometry, sample labels, desktop inertia
- `runtime-audit-patch-v1.js`: non-Chip sandbox visual corrections
- `runtime-dynamic-config-guard-v1.js`: reapply settings after dynamic DOM rebuild

Global controls:
- White / Dark / System
- PC / Mobile

Filter-chip direct controls:
- Material / iOS Flat / iOS Liquid
- sample chip add / last delete / reset
- rail top / right / bottom / left padding
- chip horizontal / vertical padding
- chip gap
- response / overshoot settings remain in the inspector

## Browser QA

PR #11 clean validation passed after diagnostics were removed.

Final clean run:
- workflow: `Platform Library Checks`
- run: `32638788027`
- run number: `263`
- job: `97192525406`
- conclusion: `success`

Coverage includes:
- six Live UI Kit components × White/Dark/System × PC/Mobile
- no `.platform-kit-specimen` board on filter-chip route
- real filter rail as the single direct preview
- sample chip insertion on the same rail
- four-side rail padding and chip X/Y padding live updates
- style switches preserving tuned geometry
- simulated desktop mouse drag continuing after release through inertia
- Liquid selector movement
- global filter → top nav / bottom sheet style propagation
- horizontal rail controls
- bottom sheet state/reset
- device accordion standalone
- FAB family/accent/response
- fixed editor nav + reading progress ownership
- block drag/drop/save/reset
- side ads at 1280/1440/1536/1600/1920
- Block Lab / Page Editor / QA responsive admin shell + noindex

## Live Cloudflare Pages verification

Workflow: `.github/workflows/platform-live-deploy-check.yml`
Script: `scripts/check-live-ui-dashboard-deploy.mjs`
Status file: `docs/workstreams/platform-library-v1/qa/live-deploy-status.json`

Current production live result before PR #11 merge: `pass`.

Current deployed admin verification:
- dashboard HTML serves `builder-entry-audit-v1.js?v=9`
- live runtime contains `__platformGlobalChipRuntimeV4`
- Material filter rail = `rgb(241, 243, 246)`
- Material filter setting propagates to top nav
- iOS Liquid filter = `blur(22px) saturate(1.38)` with moving selector
- iOS Liquid setting propagates to top nav

Current live result metadata:
- source SHA: `393d5747cae9d6a8fc1c3b6b4816676b9193fe20`
- workflow run id: `32631402171`
- workflow run number: `4`
- result bot commit: `4c54d59ae1ea2dc982b3c67289ae9fcdb42a9079`

After PR #11 merge, verify only the management/admin deployment expecting `builder-entry-audit-v1.js?v=10` and the new single-rail filter editor.

## Production connection boundary

The user explicitly set the public-site connection as the final task.

Until the management UI is finally approved:
- do not publish management overrides into the public `photo-ebook.pages.dev` page runtime;
- do not make the production photography renderer read unapproved Live UI Kit config;
- continue using sandbox/admin preview as the design and QA surface.

After final UI-management approval only:
- create the publish boundary from approved preset/config to production;
- connect approved UI settings to the public page;
- rerun public PC/mobile and theme regression QA.

This distinction is important: deploying `/ui-dashboard/` updates is allowed now; wiring those settings into the public visible site is deferred.

## Merge history relevant to current state

- PR #6: canonical global Chip parity → merge `9278658f464fd2179d642f668cea236f866b8d63`
- PR #7: live Cloudflare Pages checker
- PR #8: persist successful live result
- PR #9: persist success or failure result
- PR #10: preserve common Chip state across live route verification → merge `393d5747cae9d6a8fc1c3b6b4816676b9193fe20`
- PR #11: single filter rail + geometry controls + inertia — clean QA passed, merge pending

## Safety

- production `/photography/` is not the builder canvas.
- sandbox does not read production user data.
- photography renderer is not replaced.
- mobile native horizontal scroll remains.
- Safari deferred sticky remains.
- no automatic preset/block approval.
- unapproved admin settings are not published to public production runtime.
- management / QA / staging remain noindex.

## Exact next action

1. Merge PR #11 into `main` now that clean CI is green.
2. Verify Cloudflare Pages management deployment: v10 dashboard entry and single filter rail route only.
3. Continue management UI refinement from user feedback.
4. Do not connect approved management configuration to the public page until the user explicitly gives final approval.
