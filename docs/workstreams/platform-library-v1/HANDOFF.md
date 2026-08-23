# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `main`
Production branch: `main`
Merged PR: `#6`
Implementation merge commit: `9278658f464fd2179d642f668cea236f866b8d63`
Latest implementation QA HEAD: `c8c130c236671f0fbdebdea90acd8051ed387b9f`
Documentation commits are newer than the implementation merge commit.

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current `main` HEAD

## Current product direction

`UI 라이브러리`는 screenshot catalog가 아니라 플랫폼에서 실제로 쓰는 reusable UI를 하나씩 독립적으로 띄우고 상태·테마·표현을 바꾸는 Live UI Kit이다.

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
- `builder-page-preflight-v2.js`: explicit V2 override만 legacy inspector store로 투영
- `builder-v1.js`: inspector / block DnD chrome
- `builder-production-parity-v1.js`: sandbox app geometry stabilization
- `builder-page-audit-v1.js`: editor nav fixed-pin / sandbox-only UX repair
- `builder-progress-owner-audit-v1.js`: standalone reading-progress owner 제거
- `builder-page-live-v2.js`: V2 override → sandbox canonical runtime
- `builder-dynamic-sync-v1.js`: late-created collection/filter/device DOM 재적용
- `builder-sandbox-ads-v1.js`: side-ad 설정값 + inspector만 소유
- `builder-side-ad-zone-audit-v1.js`: side-ad geometry / visibility 단독 owner
- `builder-reset-audit-v1.js`: canvas draft reset
- `builder-late-frame-bootstrap-v1.js`: missed iframe lifecycle 복구

## Live UI Kit runtime

`/ui-dashboard/?view=library`:
- page builder scripts를 로드하지 않는다.
- `builder-library-kit-v2.js`: parent UI Kit owner
- `builder-library-state-sync-v1.js`: state 변경/reset 뒤 config + state 재동기화
- `builder-library-notes-v1.js`: 수정 요청 메모 local + server notes
- `sandbox-kit-v4.js`: actual production component standalone extraction
- `capability-runtime-v3.js`: legacy capability override runtime; global Chip paint는 더 이상 소유하지 않음
- `global-chip-runtime-v1.js`: Material / iOS Flat / iOS Liquid 공통 Chip 표현 단독 owner
- `runtime-audit-patch-v1.js`: 광고/가로레일/아코디언/FAB 등 sandbox-only 보정. Chip paint는 소유하지 않음
- `runtime-dynamic-config-guard-v1.js`: collection runtime DOM 재생성 뒤 현재 설정 재적용
- `builder-runtime-audit-loader-v1.js`: 위 runtime patches를 iframe에 확실히 주입

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

## Global Chip parity fix

PR #6에서 완료:
- 전역 Chip 승격 전 상단 메뉴의 Material/iOS Flat/iOS Liquid 표현을 canonical 기준으로 복원
- Material rail: `#f1f3f6`, 기존 border, shadow 없음, blur 없음
- iOS Flat rail: `rgba(244,247,251,.88)`, 12px blur, 기존 shadow
- iOS Liquid: 22px blur / saturate 138% glass + v37 moving selector
- inactive chip은 공통 family에서 투명하게 유지
- `runtime-audit-patch`의 중복 Chip paint 제거
- sandbox `capability-runtime-v3`의 퇴역 `.collection-filters[data-builder-family] .collection-filter` paint rule 제거
- production `nav-corrections.css`보다 global family nav surface가 최종 표현 owner가 되도록 nav selector specificity 정리
- 사용자 직접 수정 preset은 보존하고, 과거 잘못 저장된 정확히 일치하는 legacy preset만 canonical 값으로 마이그레이션

## Browser QA

Workflow: `.github/workflows/platform-library-checks.yml`
UI Dashboard browser script: `scripts/check-ui-dashboard-browser-v3.mjs`
Management browser script: `scripts/check-platform-admin-browser-v1.mjs`

Latest full successful pre-merge run:
- run: `32628018616` / #245
- tested branch head: `c8c130c236671f0fbdebdea90acd8051ed387b9f`
- conclusion: `success`
- UI Dashboard artifact: `9490245629`
- management artifact: `9490245824`

Static checks passed:
- Registry sync
- variant sync
- UI capability sync
- non-photography QA seed
- Snapshot V2
- JavaScript syntax

UI Dashboard browser checks passed:
- all six Live UI Kit components across White / Dark / System × PC / Mobile
- top nav: Material/iOS Flat/iOS Liquid global family propagation
- filter: actual bottom-sheet source, click/active state, transparent inactive chips
- global Chip: canonical Material / iOS Flat / iOS Liquid rail surface and selector parity
- horizontal rail: padding, right fade, scrollbar
- bottom sheet: state / visibility / reset
- device: accordion-only extraction
- FAB: family / accent / response
- page: top nav no longer owns common Chip style; global filter-chip capability owns family

Management browser checks passed:
- block DragEvent reorder + persisted order
- side ad width boundaries at 1280 / 1440 / 1536 / 1600 / 1920
- Block Lab / Page Editor / QA desktop/mobile current-nav + noindex

## Side ads

Final ownership:
- `builder-sandbox-ads-v1.js`: configuration + inspector + enabled mirror
- `builder-side-ad-zone-audit-v1.js`: all placement and `data-ad-zone-active` writes

Canonical width result:
- 1280: left/right hidden
- 1440: left/right hidden
- 1536: left/right hidden
- 1600: active when body zone visible
- 1920: active when body zone visible

## Canvas reset

`더미 초기화` removes:
- `platformBuilderLayoutV1`
- `platformBuilderCapabilityConfigsV1`
- `platformBuilderCapabilityConfigsV2`
- `platformBuilderSideAdsV1`

Notes / saved presets remain.

## Safety

- production `/photography/`를 builder canvas로 로드하지 않는다.
- sandbox에서 production user data를 읽거나 쓰지 않는다.
- photography renderer를 candidate/mock으로 교체하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- Safari deferred sticky safety를 유지한다.
- 사용자 승인 전 preset/block을 자동 승인하지 않는다.
- management / QA / staging은 noindex를 유지한다.

## PR / main state

- PR #6: merged
- merge commit: `9278658f464fd2179d642f668cea236f866b8d63`
- merge time: 2026-08-23 17:26 KST
- `main` contains `builder-entry-audit-v1.js?v=9`
- `main` runtime loader points to `global-chip-runtime-v1.js?v=4`
- implementation branch had no divergence before merge (`ahead 32 / behind 0`)

## Next action

1. Confirm post-merge `main` CI if the GitHub Actions push run becomes observable.
2. Confirm Cloudflare Pages deployment reflects the latest `main` assets.
3. Check deployed `/ui-dashboard/` and `/ui-dashboard/?view=library` for final runtime response.
4. Final Korean typography and visual judgement remains a real-browser user review item.
5. Never treat merge/deployment as approval of candidate UI/block presets.
