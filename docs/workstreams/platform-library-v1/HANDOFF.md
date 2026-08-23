# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `main`
Production branch: `main`
Status: `deployed / live verified / user visual review`

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

## Global Chip final ownership

Canonical owner: `public/ui-dashboard/sandbox/global-chip-runtime-v1.js`
Runtime marker: `__platformGlobalChipRuntimeV4`
Style marker: `platform-global-chip-style-v4`

Canonical styles restored from the former top navigation:
- Material: `#f1f3f6`, former border, no shadow, no blur
- iOS Flat: `rgba(244,247,251,.88)`, 12px blur, former shadow
- iOS Liquid: 22px blur / saturate 138% glass, moving v37 selector
- inactive common chips remain transparent
- top nav / bottom-sheet filters share the same family and accent

`runtime-audit-patch-v1.js` and legacy capability runtime no longer own common Chip paint.
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
- `builder-library-state-sync-v1.js`: state/config resync
- `builder-library-notes-v1.js`: modification notes
- `sandbox-kit-v4.js`: standalone actual component extraction
- `global-chip-runtime-v1.js`: common Chip paint/interaction owner
- `runtime-audit-patch-v1.js`: non-Chip sandbox visual corrections
- `runtime-dynamic-config-guard-v1.js`: reapply settings after dynamic DOM rebuild

Global controls:
- White / Dark / System
- PC / Mobile

## Browser QA

Local/PR Chromium coverage passes:
- six Live UI Kit components × White/Dark/System × PC/Mobile
- canonical Material / iOS Flat / iOS Liquid Chip parity
- common filter → top nav / bottom sheet propagation
- horizontal rail controls
- bottom sheet state/reset
- device accordion standalone
- FAB family/accent/response
- fixed editor nav + reading progress ownership
- block drag/drop/save/reset
- side ads at 1280/1440/1536/1600/1920
- Block Lab / Page Editor / QA responsive admin shell + noindex

Latest PR #10 validation:
- workflow run `32631294005`
- job `97174412641`
- conclusion `success`

## Live Cloudflare Pages verification

Workflow: `.github/workflows/platform-live-deploy-check.yml`
Script: `scripts/check-live-ui-dashboard-deploy.mjs`
Status file: `docs/workstreams/platform-library-v1/qa/live-deploy-status.json`

Final live result: `pass`

Verified against `https://photo-ebook.pages.dev`:
- dashboard HTML serves `builder-entry-audit-v1.js?v=9`
- live runtime contains `__platformGlobalChipRuntimeV4`
- Material filter rail = `rgb(241, 243, 246)`
- Material filter setting propagates to top nav
- iOS Liquid filter = `blur(22px) saturate(1.38)` with moving selector
- iOS Liquid setting propagates to top nav

Live result metadata:
- source SHA: `393d5747cae9d6a8fc1c3b6b4816676b9193fe20`
- workflow run id: `32631402171`
- workflow run number: `4`
- result bot commit: `4c54d59ae1ea2dc982b3c67289ae9fcdb42a9079`

The first live check failure was a QA bug: storage was cleared on every route navigation. PR #10 changed the checker to clear storage once, after which the live check passed. It was not a production runtime failure.

## Merge history relevant to current state

- PR #6: canonical global Chip parity → merge `9278658f464fd2179d642f668cea236f866b8d63`
- PR #7: live Cloudflare Pages checker
- PR #8: persist successful live result
- PR #9: persist success or failure result
- PR #10: preserve common Chip state across live route verification → merge `393d5747cae9d6a8fc1c3b6b4816676b9193fe20`

## Safety

- production `/photography/` is not the builder canvas.
- sandbox does not read production user data.
- photography renderer is not replaced.
- mobile native horizontal scroll remains.
- Safari deferred sticky remains.
- no automatic preset/block approval.
- management / QA / staging remain noindex.

## Exact next action

Automated implementation, Chromium regression QA, merge, and live deployment verification are complete.

1. User visually checks the live global filter-chip UI in the real Korean browser/font environment.
2. If there is remaining visual mismatch against the former top-nav Material / iOS Flat / iOS Liquid appearance, fix only the observed visual delta and rerun both local Chromium and live deploy checks.
3. Once the user accepts the visual result, archive the active workstream according to `AGENTS.md`.
