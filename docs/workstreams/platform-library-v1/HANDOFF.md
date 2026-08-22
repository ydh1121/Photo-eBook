# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `fix/ui-dashboard-system-audit`
Production branch: `main`
Draft PR: `#3`
Latest implementation QA HEAD: `7151adf41635d16a15b2f3f09eba588569dcd04c`
Latest documentation HEAD will be newer than the QA HEAD.

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
- `builder-page-preflight-v2.js`: explicit V2 override만 legacy inspector store로 투영. override가 없으면 V1 key 제거.
- `builder-v1.js`: inspector / block DnD chrome
- `builder-production-parity-v1.js`: sandbox app geometry stabilization
- `builder-page-audit-v1.js`: editor nav fixed-pin / sandbox-only UX repair
- `builder-progress-owner-audit-v1.js`: standalone reading-progress owner 제거
- `builder-page-live-v2.js`: V2 override → sandbox canonical runtime
- `builder-dynamic-sync-v1.js`: late-created collection/filter/device DOM 재적용
- `builder-sandbox-ads-v1.js`: side-ad 설정값 + inspector만 소유
- `builder-side-ad-zone-audit-v1.js`: side-ad geometry / visibility 단독 owner
- `builder-reset-audit-v1.js`: canvas draft reset
- `builder-late-frame-bootstrap-v1.js`: iframe이 builder scripts보다 먼저 load된 경우 missed lifecycle 복구

Chrome QA가 실제로 발견해 수정한 회귀:
- builder chrome missed-load race
- reset 뒤 빈 V1 store 재생성
- dynamic bottom-sheet rerender 뒤 visibility override 소실
- side-ad geometry double-owner race

## Live UI Kit runtime

`/ui-dashboard/?view=library`:
- page builder scripts를 로드하지 않는다.
- `builder-library-kit-v2.js`: parent UI Kit owner
- `builder-library-state-sync-v1.js`: state 변경/reset 뒤 config + state 재동기화
- `builder-library-notes-v1.js`: 수정 요청 메모 local + server notes
- `sandbox-kit-v4.js`: actual production component standalone extraction
- `capability-runtime-v3.js`: canonical capability override owner
- `runtime-audit-patch-v1.js`: production `!important` stack보다 높은 sandbox-only override / dark representation / device context
- `runtime-dynamic-config-guard-v1.js`: collection runtime DOM 재생성 뒤 현재 bottom-sheet/device 설정 재적용
- `builder-runtime-audit-loader-v1.js?v=2`: 위 runtime patches를 iframe에 확실히 주입

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
UI Dashboard browser script: `scripts/check-ui-dashboard-browser-v2.mjs`
Management browser script: `scripts/check-platform-admin-browser-v1.mjs`

Latest full successful run:
- run: `32603032059` / #203
- tested branch head: `7151adf41635d16a15b2f3f09eba588569dcd04c`
- job: `97104043129`
- conclusion: `success`
- UI Dashboard artifact: `9483414399`
- management artifact: `9483414627`

Static checks all pass:
- Registry sync
- variant sync
- UI capability sync
- non-photography QA seed
- Snapshot V2
- JavaScript syntax

UI Dashboard browser checks all pass:
- all six Live UI Kit components across White / Dark / System × PC / Mobile
- top nav: retired progress owner absent, Material mode, native x-scroll, progress line, note local save
- horizontal rail: padding, right fade pseudo layer, scrollbar
- filter chips: actual bottom-sheet source, click/active state
- bottom sheet: state, theme/device visibility, reset restoration
- device: accordion-only extraction, expansion
- FAB: flat family, accent, response
- page: fixed nav and integrated progress ownership
- inline advertisement add + layout save
- dummy reset storage clean + inline ad removed
- side ad hidden over hero and active in visible body zone
- mobile tap → inspector + dock

Management browser checks all pass:
- actual block DragEvent reorder + persisted order
- side ad width boundaries at outer 1280 / 1440 / 1536 / 1600 / 1920
- Block Lab / Page Editor / QA desktop/mobile current-nav + noindex

Side-ad canonical width result:
- 1280: left/right hidden
- 1440: left/right hidden
- 1536: left/right hidden
- 1600: left/right active when body zone visible
- 1920: left/right active when body zone visible

## Visual artifact review

Both latest artifacts were downloaded and screenshots manually opened.

Observed:
- Live UI Kit uses one component per canvas rather than stacked showcase cards.
- filter chip preview contains only actual filter rail.
- device preview contains only actual accordion.
- bottom sheet is isolated on neutral floor.
- horizontal rail is isolated and clipped/faded as intended.
- FAB is standalone.
- side ads sit outside body content at wide desktop.

CI Ubuntu does not contain the Korean glyph font stack used by the app, so Korean copy appears as tofu boxes in runner screenshots. Use those screenshots for geometry/interaction evidence, not Korean typography judgement. Final Korean visual review remains a user-browser task.

## Side ads

Final ownership:
- `builder-sandbox-ads-v1.js`: configuration + inspector + enabled mirror
- `builder-side-ad-zone-audit-v1.js`: all placement and `data-ad-zone-active` writes

Guard:
- visible `.chapter .section .content` required
- hero/chapter hero at ad top anchor → hidden
- sandbox viewport <1360px → hidden
- insufficient left/right room → hidden
- follow on/off preserved

The old double-writer race was removed after browser QA exposed inconsistent wide-screen visibility.

## Canvas reset

`더미 초기화` removes:
- `platformBuilderLayoutV1`
- `platformBuilderCapabilityConfigsV1`
- `platformBuilderCapabilityConfigsV2`
- `platformBuilderSideAdsV1`

Notes / saved presets remain.
The preflight layer no longer recreates an empty V1 key after reload.

## PR / main state

At latest comparison before this documentation update:
- branch ahead of `main`: 86 commits
- branch behind `main`: 2 commits
- status: diverged
- PR #3: open / Draft / `mergeable: true`
- base main: `bf8e006060a7c5de12692c28207328f83ac1d79d`

GitHub currently calculates no merge conflict, but re-read `main` immediately before any merge because `main` can move.

Do not merge PR #3 to `main` without explicit user approval.

## Next action

The automated system audit is complete enough for user review.

1. User checks `/ui-dashboard/` and `/ui-dashboard/?view=library` in a real browser after the branch is made viewable or merged.
2. If visual feedback arrives, modify `fix/ui-dashboard-system-audit` and rerun full browser QA.
3. If the user explicitly asks to merge/publish, re-read current `main`, compare divergence/conflicts, then merge safely.
4. Never treat merge/deployment as approval of candidate UI/block presets.
