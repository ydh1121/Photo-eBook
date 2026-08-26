# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / exhaustive Library setting audit + portable module contract`
Production branch: `main`
Current implementation branch: `fix/library-runtime-audit-portability-v1`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product architecture

[x] 공개 페이지 = 완성 모듈 reference/source.
[x] `/ui-dashboard/` = 승인된 공통 모듈 UI Library.
[x] `/block-lab/` = 유일한 연구 공간.
[x] `/editor-lab/` = 승인 모듈 기반 페이지 조립/저장/발행의 canonical Editor route.
[x] `Library → Editor → Public`를 공통 모듈의 필수 실행 경로로 확정.
[x] preview-only 모사 구현 금지 규칙을 `AGENTS.md`에 영구 추가.
[-] 동일 canonical module을 새 저장소/새 프로젝트로 가져가는 `Portable Export`를 필수 소비 경로로 확장.

## Canonical module contract

[x] `PlatformModuleRegistry` approved-only consumer 구조 유지.
[x] Library 기본값은 신규 Editor 인스턴스 생성 시 snapshot한다.
[x] 기존 Editor 인스턴스는 mutable Library 기본값을 다시 읽지 않는다.
[x] Public Snapshot은 admin iframe 없이 `PlatformModuleRegistry.mount()`로 `ui-module`을 직접 렌더한다.
[x] Public Snapshot은 저장된 style overrides를 `PlatformModuleStyleRuntime`으로 실제 적용한다.
[x] Library/Editor/Public가 동일 module id + render/hydrate owner를 사용하도록 정적 검사한다.
[-] Portable Export도 같은 module id/render/hydrate/style owner를 포함하도록 dependency manifest 계약 추가.

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
[x] Cloudflare live에서 동일 controller/native-pan/remount recovery/BREEZE easing parity 재검증.

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
[x] 세 family 모두 `filter-chip-rail` 하나의 canonical module 안에서 실제 source DOM으로 렌더된다.
[x] 세 family 모두 동일 `platform-filter-select` interaction event와 ARIA state를 사용.
[x] 세 family 모두 Editor/Public에서 같은 module ID로 렌더할 수 있다.
[x] Material에서 의미 없는 background blur 설정은 Library에서 disabled 처리.
[x] 코드 감사에서 iOS Liquid의 `gap` / `runway`가 CSS 변수만 설정되고 실제 source geometry에는 소비되지 않던 no-op 발견.
[x] iOS Liquid가 `gap` / `runway`를 실제 rail gap/padding으로 소비하도록 shared canonical CSS 수정.
[x] 메뉴가 rail 너비를 넘으면 세 family 모두 nowrap horizontal overflow로 수용하고 텍스트가 rail 밖으로 paint되지 않도록 수정.
[x] Material family를 outlined-pill + dot에서 tonal surface / contrasting shape / motion 중심의 Material 3 Expressive 방향으로 재구성.
[x] Library 상단 module selector에 현재 family (`iOS 리퀴드` / `iOS 플랫` / `Material 3 Expressive`)를 표시하고 변경 즉시 동기화.
[-] 세 family PC/mobile/light/dark + long-menu 실제 Chromium QA.

## Library settings runtime audit

[x] manifest + module-extension의 모든 visible control을 canonical `PlatformModuleStyleRuntime`, owner CSS, interaction owner와 1:1 코드 대조.
[x] 감사 결과를 `SETTING-RUNTIME-AUDIT-V1.md`에 owner/effect 단위로 기록.
[x] locked control은 편집 효과가 없는 대신 UI에서 disabled인지 별도 분류.
[x] filter `gap` / `runway`의 iOS Liquid no-op를 코드 감사로 확인하고 shared runtime에서 수정.
[-] 모든 editable control을 비기본값으로 실제 변경하고 measurable DOM/computed-style/interaction 변화를 검증하는 exhaustive Chromium gate 추가.
[ ] exhaustive Chromium에서 추가 no-op 발견 시 canonical runtime 구현 또는 UI 제거/disabled 후 다시 전체 통과.

## Bottom sheet interaction

[x] 실제 Public bulk-selection owner 사용.
[x] 실제 `전체 선택 / n개 선택 / 삭제` bulk action footer 사용.
[x] 질문 작성 / 저장 질문 / 질문 reopen state 실제 owner 사용.
[x] 영상/읽을거리 filter actual runtime 유지.

## Photography ↔ Block Lab parity

[x] `docs/library/blocks/photography/PARITY-V1.md`에서 Photography production block을 Block Lab 구조와 1차 분류 완료.
[ ] `hero / immersive-metrics` candidate 구현.
[ ] `chapter-hero / image-overlay` candidate 구현.
[ ] `comparison-cards / visual-metrics` candidate 구현.
[ ] `roadmap / metric-cards` candidate 구현.
[ ] 기존 scored/product/case/offer/script/tutorial/resources variants에 Photography 수준의 generic refinement / style preset 반영.
[ ] base skill-card의 generic destination 결정.
[ ] numbered checklist의 mini-card vs unified surface 결정.
[ ] 사용자 승인된 candidate/preset만 Editor production library로 승격.

## SEO / GEO + page structure

[x] `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`에 draft/published snapshot, canonical, metadata, robots/sitemap 기본 계약 존재.
[ ] SEO/GEO metadata를 page model과 Editor에서 실제 편집/저장할 수 있게 연결.
[ ] page hierarchy / parent-child / route / canonical / sitemap 포함 여부를 공통 page metadata로 관리.
[ ] draft/preview는 noindex, published snapshot만 indexable이라는 런타임 계약 자동 검증.
[ ] export bundle이 SEO/GEO/page hierarchy metadata를 손실 없이 포함하도록 manifest 규격화.

## Completed-page technical roadmap

[ ] 완료된 페이지 registry data model 정의.
[ ] Photography를 첫 completed page로 등록할 수 있는 non-destructive metadata layer 구현.
[ ] completed page를 실제 published runtime과 동일하게 렌더하는 관리 화면 구현.
[ ] completed page의 content/style/page metadata를 같은 canonical owner로 편집.
[ ] completed page snapshot 전체 복제 기능.
[ ] 초기 single-page main/home 정책과 다중 completed-page 전환 규칙을 metadata로 관리.
[ ] completed-page index/browse UI는 registry가 여러 페이지를 수용할 수 있게 된 뒤 구현.

## Portable project / code export

[x] `AGENTS.md` reusable module contract를 `Library → Editor → Public → Portable Export`로 확장.
[ ] module dependency manifest: module ID/version + owner JS/CSS + assets + transitive dependencies.
[ ] page export manifest: page snapshot + selected modules + style/content props + SEO/GEO + route/sitemap metadata.
[ ] export bundle 생성기: 사용하지 않는 Photo-eBook app code를 제외하고 필요한 파일만 수집.
[ ] Cloudflare Pages starter/bootstrap 구성 포함.
[ ] 새 Git 저장소에 bundle을 배치한 뒤 동일 페이지를 재현하는 smoke test.
[ ] 공통 module bundle을 다른 신규 프로젝트에서 직접 import할 수 있는 distribution/versioning contract 확정.
[ ] exported project가 Library preview/admin iframe 없이 독립 실행되는지 CI 검증.

## Private strategy boundary / restart safety

[x] 민감한 사업/제품 전략 원문은 Google Drive private document로 분리.
[x] Git에는 private 문서 본문/ID/URL을 넣지 않는 규칙을 `AGENTS.md`에 추가.
[x] 전략적 판단이 필요한 AI 세션은 Drive 연결 시 지정 문서 제목을 검색해 최신 내용을 읽도록 규칙화.
[x] Drive 접근이 없으면 민감한 맥락을 Git에서 추측하지 않도록 규칙화.
[x] Git workstream에는 실행에 필요한 비민감 기술 계약과 상태만 유지.

## Permanent Git instructions

[x] `AGENTS.md`에 `Reusable UI module contract` 추가.
[x] preview-only visual copy 금지.
[x] 모든 visible Library setting은 canonical runtime effect가 있어야 한다는 규칙 추가.
[x] Public에서 admin preview/sandbox/iframe 사용 금지.
[x] actual interaction QA 의무화.
[x] static boundary + Chromium pipeline QA 의무화.
[x] exhaustive setting audit 시 대표 control이 아니라 모든 editable/locked control을 검증하도록 규칙 강화.

## QA / CI

[x] `scripts/check-platform-module-pipeline-v3.mjs`로 reusable module runtime 대표 설정 검사.
[x] `scripts/check-top-nav-runtime-parity.mjs`로 Photography Public ↔ Library 상단 메뉴 owner/motion/native-pan 검사 추가.
[x] Actions path filter에 canonical owner 경로 추가.
[x] static boundary check가 top-nav complete owner set과 remount-safe liquid owner를 강제하도록 확장.
[x] PR #27 canonical BREEZE/remount repair + 전체 Chromium QA green.
[x] PR #28 live deploy gate 확대.
[x] PR #29~#32 stale live QA를 현재 canonical 계약에 맞게 수정.
[x] PR #33 기준 main `Platform Library Checks` green / live deploy gate green.
[-] `check-library-setting-runtime-exhaustive-v1.mjs`를 CI에 추가하고 branch 전체 green 확보.

## Exact next action

1. exhaustive Chromium setting gate를 작성해 모든 visible control + filter long-menu overflow + family label/runtime switch를 검증한다.
2. gate에서 발견되는 추가 no-op을 canonical owner에서 수정하고 전체 green으로 만든다.
3. 그 다음 SEO/GEO page metadata의 실제 Editor/runtime 연결을 먼저 진행한다.
4. 이후 completed-page registry → exact-runtime edit/duplicate → dependency-aware export → portable new-project smoke test 순서로 진행한다.
5. Photography Block Lab advanced variants는 `PARITY-V1.md`의 4개 candidate부터 병행 연구하되, 승인 전 Editor production에는 노출하지 않는다.