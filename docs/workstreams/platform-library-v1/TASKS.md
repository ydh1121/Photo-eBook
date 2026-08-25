# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / reusable module style contract hardening`
Production branch: `main`
Current production main at branch start: `a14d56707463b16b0ad97e4f7db47390d91eda5e`
Current implementation branch: `fix/library-font-style-contract-v1`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product architecture

[x] 공개 페이지 = 완성 모듈 reference/source.
[x] `/ui-dashboard/` = 승인된 공통 모듈 UI Library.
[x] `/block-lab/` = 유일한 연구 공간.
[x] `/block-editor/` = 승인 모듈 기반 페이지 조립/저장/발행.
[x] `Library → Editor → Public`를 공통 모듈의 필수 실행 경로로 확정.
[x] preview-only 모사 구현 금지 규칙을 `AGENTS.md`에 영구 추가.

## Canonical module contract

[x] `PlatformModuleRegistry` approved-only consumer 구조 유지.
[x] Library 기본값은 신규 Editor 인스턴스 생성 시 snapshot한다.
[x] 기존 Editor 인스턴스는 mutable Library 기본값을 다시 읽지 않는다.
[x] Public Snapshot은 admin iframe 없이 `PlatformModuleRegistry.mount()`로 `ui-module`을 직접 렌더한다.
[x] Public Snapshot은 저장된 style overrides를 `PlatformModuleStyleRuntime`으로 실제 적용한다.
[x] Library/Editor/Public가 동일 module id + render/hydrate owner를 사용하도록 정적 검사한다.

## Current module set

[x] `top-chapter-navigation`
[x] `filter-chip-rail`
[x] `horizontal-card-rail`
[x] `collection-bottom-sheet`
[x] `device-handoff-accordion` / 표시명 `아코디언 탭`
[x] `floating-action`

## Typography

[x] 상단 메뉴에 font family 설정 추가.
[x] 상단 메뉴에 font size / weight / letter-spacing 설정 추가.
[x] 범용 필터칩에 동일 typography 설정 추가.
[x] typography 값은 module style defaults에 저장되는 canonical 설정이다.
[x] typography 값은 preview DOM이 아니라 실제 nav/filter button node에 적용한다.
[x] Library font family 옵션에 한국어 표시명 polish runtime 추가.
[-] Chromium QA에서 computed font size/weight/spacing 변화 검증.

## Filter style families

[x] iOS Liquid = 기존 canonical liquid controller 유지.
[x] iOS Flat = 별도 실제 runtime source 유지.
[x] Material = 별도 실제 runtime source 유지.
[x] `filter-chip-rail` source provenance를 유효한 `platform-core`로 수정.
[x] iOS Flat을 neutral segmented surface + raised active segment로 재디자인.
[x] Material을 Material 3 계열 tonal/outlined chip + accent dot 구조로 재디자인.
[x] 세 family 모두 동일 `platform-filter-select` interaction event와 ARIA state를 사용.
[x] 세 family 모두 Editor/Public에서 같은 module ID로 렌더할 수 있다.
[x] Material에서 의미 없는 background blur 설정은 Library에서 disabled 처리.
[-] PC/mobile/light/dark 시각 QA.

## Library settings runtime audit

[x] top nav: enabled / stickyMode / chipFamily / accent / typography.
[x] top nav: progressEnabled / progressMode / progressColor / opacity controls 연결.
[x] top nav: response / overshoot / durationScale를 실제 indicator transition에 연결.
[x] card rail: desktop drag / threshold / click suppression 연결 유지.
[x] card rail: leftShadowGuard / leftFade / rightFade / fade width / right padding 연결.
[x] card rail: scrollbar hidden/auto 실제 rail에 연결.
[x] bottom sheet: enabled / backdrop / blur / width / height / radius / handle / tabs / search / filters 연결.
[x] bottom sheet: bulkSelection / themeSelector / deviceHandoff 실제 node에 연결.
[x] accordion: enabled / response / copy / connect / status 연결.
[x] FAB: flat/glass/liquid family / accent / response / overshoot 연결.
[-] Chromium에서 각 대표 control이 computed style/DOM state를 실제 변경하는지 확인.
[ ] QA 중 추가 no-op control 발견 시 구현 또는 Library UI에서 제거/disabled.

## Bottom sheet interaction

[x] 실제 Public bulk-selection owner 사용.
[x] 실제 `전체 선택 / n개 선택 / 삭제` bulk action footer 사용.
[x] 질문 작성 / 저장 질문 / 질문 reopen state 실제 owner 사용.
[x] 영상/읽을거리 filter actual runtime 유지.

## Permanent Git instructions

[x] `AGENTS.md`에 `Reusable UI module contract` 추가.
[x] preview-only visual copy 금지.
[x] 모든 visible Library setting은 canonical runtime effect가 있어야 한다는 규칙 추가.
[x] Public에서 admin preview/sandbox/iframe 사용 금지.
[x] actual interaction QA 의무화.
[x] static boundary + Chromium pipeline QA 의무화.

## QA / CI

[x] 오래된 2-family/Material 금지 static assertion 제거 방향으로 boundary check 교체.
[x] `scripts/check-platform-module-pipeline-v3.mjs` 추가.
[x] v3 QA에서 nav typography actual computed style 검사.
[x] v3 QA에서 iOS Flat / Material source switch 및 live selection 검사.
[x] v3 QA에서 filter menu add + typography + accent 검사.
[x] v3 QA에서 card scrollbar + left fade 검사.
[x] v3 QA에서 bottom-sheet theme selector 검사.
[x] v3 QA에서 Editor 신규 filter instance가 Library family/typography defaults를 snapshot하는지 검사.
[x] v3 QA에서 Editor filter interaction이 실제 동작하는지 검사.
[-] PR 생성 후 Actions 실행.
[ ] CI 오류 수정.
[ ] QA screenshots 확인.
[ ] 필요 시 main merge 후 Cloudflare live visual verification.

## Exact next action

1. branch diff를 점검하고 PR 생성.
2. `Platform Library Checks`를 실행한다.
3. static/Chromium failure를 실제 runtime 기준으로 수정한다.
4. green 후 Library screenshots에서 top-nav typography, iOS Flat, Material, bottom-sheet를 확인한다.
5. owner가 main 확인을 요청하면 merge하고 Cloudflare live verification을 확인한다.
