# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / photography canonical runtime parity green`
Production branch: `main`
Current implementation branch: `fix/canonical-top-nav-liquid-motion-v1`

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

## Top navigation photography parity

[x] Library 상단 메뉴 HTML이 `PhotoPublicModuleSource.navigation.render`를 사용하는지 확인.
[x] Library hydration이 사진 페이지의 `setupNavigation()` owner를 사용하는지 확인.
[x] 사진 페이지의 실제 liquid motion owner가 `public/assets/js/ui/liquid-controller.js`임을 확인.
[x] 사진 페이지의 실제 native pan owner가 `native-pan-fab-clearance.css`임을 확인.
[x] Registry `ownerFiles`에 liquid controller / native pan / mobile nav / desktop nav runtime을 명시.
[x] Library module remount 뒤 새 `.nav-scroll`에 canonical liquid controller가 다시 연결되도록 shared owner 수정.
[x] Library 기본 style config가 사진 페이지의 BREEZE easing을 덮어쓰지 않도록 수정.
[x] motion control을 사용자가 실제 변경한 경우에만 style runtime override 적용.
[x] Public과 module preview 모두 `liquid-controller.js?v=2`를 로드하도록 cache marker 갱신.
[x] focused Chromium QA `check-top-nav-runtime-parity.mjs` 추가.
[x] PR Actions에서 Public ↔ Library controller/native-pan/BREEZE parity 실제 검증.

## Typography

[x] 상단 메뉴에 font family 설정 추가.
[x] 상단 메뉴에 font size / weight / letter-spacing 설정 추가.
[x] 범용 필터칩에 동일 typography 설정 추가.
[x] typography 값은 module style defaults에 저장되는 canonical 설정이다.
[x] typography 값은 preview DOM이 아니라 실제 nav/filter button node에 적용한다.
[x] Library font family 옵션에 한국어 표시명 polish runtime 추가.
[x] 사진 페이지 CSS의 `!important` baseline을 canonical style runtime이 실제 override할 수 있도록 수정.
[x] Chromium QA에서 computed font size/weight/spacing 변화 재검증.

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

[x] top nav: enabled / stickyMode / typography.
[x] top nav: progressEnabled / progressMode / progressColor / opacity controls 연결.
[x] top nav: response / overshoot / durationScale는 사용자 변경 시 실제 indicator transition override.
[x] top nav: 기본 motion은 Photography Public의 canonical BREEZE owner를 그대로 유지.
[x] card rail: desktop drag / threshold / click suppression 연결 유지.
[x] card rail: leftShadowGuard / leftFade / rightFade / fade width / right padding 연결.
[x] card rail: scrollbar hidden/auto 실제 rail에 연결.
[x] bottom sheet: enabled / backdrop / blur / width / height / radius / handle / tabs / search / filters 연결.
[x] bottom sheet: bulkSelection / themeSelector / deviceHandoff 실제 node에 연결.
[x] accordion: enabled / response / copy / connect / status 연결.
[x] FAB: flat/glass/liquid family / accent / response / overshoot 연결.
[x] Chromium에서 대표 control이 computed style/DOM state를 실제 변경하는지 확인.
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

[x] `scripts/check-platform-module-pipeline-v3.mjs`로 reusable module runtime 설정 검사.
[x] `scripts/check-top-nav-runtime-parity.mjs`로 Photography Public ↔ Library 상단 메뉴 owner/motion/native-pan 검사 추가.
[x] Actions path filter에 `public/assets/js/ui/**`, `navigation/**`, `desktop/**` 및 대응 style owner 추가.
[x] JS syntax 검사에도 canonical UI/navigation/desktop owner 디렉터리 추가.
[x] static boundary check가 top-nav complete owner set과 remount-safe liquid owner를 강제하도록 확장.
[x] PR #27 Actions에서 focused top-nav parity green.
[x] PR #27 전체 `Compare Library against actual public runtime` green.
[x] Library settings + Editor preview interaction Chromium QA green.
[-] main merge 후 Cloudflare live visual verification.

## Exact next action

1. PR #27을 `main`에 병합한다.
2. main `Platform Library Checks`와 `Platform Live Deploy Check`를 확인한다.
3. Cloudflare live에서 Photography 상단 메뉴와 Library 상단 메뉴의 BREEZE/native-pan을 재확인한다.
4. 이후 전체 모듈의 PC/mobile/light/dark 시각 QA와 잔여 no-op control 전수검사를 계속한다.
