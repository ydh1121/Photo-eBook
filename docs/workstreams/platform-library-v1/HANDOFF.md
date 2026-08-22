# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `fix/ui-dashboard-system-audit`
Production branch: `main`
Draft PR: `#3`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current branch HEAD

## Current product direction

`UI 라이브러리`는 screenshot catalog가 아니다. 플랫폼에서 실제로 쓰는 reusable UI를 하나씩 독립적으로 띄우고 상태·테마·표현을 바꾸는 Live UI Kit이다.

Library components:
- 상단 메뉴
- 가로 카드
- 범용 필터칩
- 하단 팝업
- 다른 기기
- 플로팅 버튼

Important meaning:
- `범용 필터칩` = bottom sheet 실제 `.collection-filter`
- `다른 기기` = 실제 `.collection-device-accordion` 하나만 표시
- `읽기 진행` = 상단 메뉴 component 내부 owner
- 초기 상태 = production CSS 원본
- 사용자 변경값만 V2 override

## Page runtime

`/ui-dashboard/`는 production `/photography/`가 아니라 `/ui-dashboard/sandbox/`를 iframe canvas로 사용한다.

Page chain 핵심:
- `builder-page-preflight-v2.js`: explicit V2 override만 legacy inspector store로 투영. override가 없으면 V1 key를 아예 제거한다.
- `builder-v1.js`: inspector / block DnD chrome
- `builder-production-parity-v1.js`: sandbox app geometry stabilization
- `builder-page-audit-v1.js`: editor nav fixed-pin / sandbox-only UX repair
- `builder-progress-owner-audit-v1.js`: standalone reading-progress owner 제거
- `builder-page-live-v2.js`: V2 override → sandbox canonical runtime
- `builder-dynamic-sync-v1.js`: late-created collection/filter/device DOM 재적용
- `builder-sandbox-ads-v1.js` + `builder-side-ad-zone-audit-v1.js`: side ads
- `builder-reset-audit-v1.js`: canvas draft reset
- `builder-late-frame-bootstrap-v1.js`: iframe이 builder scripts보다 먼저 load된 경우 missed `load` lifecycle을 한 번 복구

Chrome QA가 실제로 `builder chrome missing` 회귀를 발견했고 원인은 dynamic script chain보다 iframe load가 먼저 끝난 race였다. `builder-late-frame-bootstrap-v1.js`로 수정했다.

## Live UI Kit runtime

`/ui-dashboard/?view=library`:
- page builder scripts를 로드하지 않는다.
- `builder-library-kit-v2.js`: parent UI Kit owner
- `builder-library-state-sync-v1.js`: state 변경/reset 뒤 config + state 재동기화
- `builder-library-notes-v1.js`: 수정 요청 메모 local + server notes
- `sandbox-kit-v4.js`: actual production component standalone extraction
- `capability-runtime-v3.js`: canonical capability override owner
- `runtime-audit-patch-v1.js`: production `!important` stack보다 높은 sandbox-only override / dark representation / device context

Global:
- White / Dark / System
- PC / Mobile

Quick representation:
- 상단 메뉴: 원본 / Material / iOS 플랫 / iOS 리퀴드
- 범용 필터칩: 원본 / Material / iOS 플랫 / iOS 리퀴드
- 플로팅 버튼: 원본 / 플랫 / 글래스 / 리퀴드

State:
- 하단 팝업: 전체 / 영상 / 읽을거리 / 질문 / 설정
- 다른 기기: 접힘 / 펼침

## Browser QA

Workflow: `.github/workflows/platform-library-checks.yml`
Browser script: `scripts/check-ui-dashboard-browser-v2.mjs`

The workflow now:
1. registry / variants / capability / seed / snapshot checks
2. JavaScript syntax checks
3. installs `playwright@1.55.0`
4. starts a local static server from `public/`
5. uses runner Chrome/Chromium to operate UI Dashboard
6. uploads `ui-dashboard-browser-qa` screenshot/report artifact

Latest successful run:
- run: `32601908580`
- branch head tested: `e03ca2031b8d5eec6fb42ea44c583b3f4a38e248`
- artifact: `9483117259`
- report status: `pass`
- 17 explicit browser checks
- 14 screenshots

Passed:
- all six Live UI Kit components across White / Dark / System × PC / Mobile
- top nav: legacy progress absent/hidden, Material mode, native x-scroll, progress line, note local save
- horizontal rail: padding, right fade pseudo layer, scrollbar
- filter chips: actual bottom-sheet source, click/active state
- bottom sheet: settings state, theme/device visibility, reset restores standalone state
- device: accordion-only extraction, expansion
- FAB: flat family, accent, response
- page: fixed nav and integrated progress ownership
- inline advertisement add + layout save
- dummy reset storage clean + inline ad removed
- side ad hidden over hero and active in visible body zone
- mobile tap → inspector + dock

The successful artifact screenshots were manually opened after download. Layout composition was coherent. Ubuntu runner lacked Korean glyph fonts, so screenshot copy appears as tofu boxes; this is a CI environment font limitation, not application copy evidence.

## Bugs found by real browser QA

1. `builder chrome missing`
   - iframe could finish loading before `builder-v1` registered `load` handler.
   - fixed with `builder-late-frame-bootstrap-v1.js`.

2. reset storage not fully empty
   - `builder-page-preflight-v2.js` recreated `platformBuilderCapabilityConfigsV1` as `{}` immediately after reset.
   - fixed by removing V1 key when V2 has no explicit overrides.

3. Initial side-ad browser assertion was wrong
   - test expected side ad while chapter hero still crossed the 108px anchor.
   - production safety intentionally hides there.
   - browser QA now first verifies hero hide, then scrolls into body and verifies activation.

## Side ads

Final guard:
- visible `.chapter .section .content` required
- hero/chapter hero at ad top anchor → hidden
- sandbox viewport <1360px → hidden
- insufficient left/right room → hidden
- follow on/off preserved

Latest QA validated left side: hero hidden → body active at wide desktop.
Right side and multiple outer browser widths remain the next automated coverage.

## Canvas reset

`더미 초기화` removes:
- `platformBuilderLayoutV1`
- `platformBuilderCapabilityConfigsV1`
- `platformBuilderCapabilityConfigsV2`
- `platformBuilderSideAdsV1`

Notes / saved presets remain.
The preflight layer no longer recreates an empty V1 key after reload.

## Main divergence

At last comparison:
- branch was ahead by 73 commits and behind `main` by 2 commits.
- the 2 `main` commits only changed `public/ui-dashboard/sandbox/sandbox.js`.
- `sandbox.js` blob SHA is identical on `main` and this branch: `9fd8c59d1487ae329ab78b4f05b5a7559f7a688a`.
- no content conflict is currently known.

Do not merge PR #3 to `main` without explicit user approval.

## Next action

1. Add browser coverage for actual block reorder/drop + persisted order.
2. Add right side-ad and browser-width boundary coverage.
3. Add browser QA for admin navigation across Block Lab / Page Editor / QA including mobile/noindex.
4. Re-check main divergence immediately before any merge request.
5. Keep PR #3 Draft until the user explicitly asks to publish/merge.
