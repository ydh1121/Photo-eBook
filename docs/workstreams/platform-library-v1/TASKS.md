# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / runtime live green + full visual matrix next`
Production branch: `main`
Current implementation branch: `main`
Latest runtime PRs: `#39`, `#40` merged

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
[x] Photography 추출 모듈은 Library/Editor/Public에서 같은 module id + render/hydrate owner를 사용한다.
[x] Block Lab 승격 primitive는 연구실 runtime을 직접 import하지 않고 shared canonical owner로 분리한다.
[-] Portable Export도 같은 module id/render/hydrate/style owner를 포함하도록 dependency manifest 계약 추가.

## Current approved module set

Photography / shared public set:
[x] `top-chapter-navigation`
[x] `filter-chip-rail`
[x] `horizontal-card-rail`
[x] `collection-bottom-sheet`
[x] `device-handoff-accordion` / 표시명 `아코디언 탭`
[x] `floating-action`

Portable primitive set promoted in PR #38:
[x] `horizontal-rail`
[x] `accordion`
[x] `bottom-sheet`
[x] Library와 Editor가 동일 Registry render/hydrate owner를 사용한다.
[x] Photography 최종 Public에는 위 3개 primitive를 자동 연결하지 않는다.
[ ] 사용자 승인 후 Public consumer 및 Portable Export dependency manifest까지 확장한다.

## Top navigation photography parity

[x] Library 상단 메뉴 HTML이 `PhotoPublicModuleSource.navigation.render`를 사용한다.
[x] Library hydration이 사진 페이지의 `setupNavigation()` owner를 사용한다.
[x] 실제 liquid motion owner는 `public/assets/js/ui/liquid-controller.js`다.
[x] 실제 native pan owner는 `native-pan-fab-clearance.css`다.
[x] Library module remount 뒤 새 `.nav-scroll`에 canonical liquid controller가 다시 연결된다.
[x] Library 기본 style config가 사진 페이지의 BREEZE easing을 덮어쓰지 않는다.
[x] iOS Liquid 기본값은 Photography canonical appearance/motion을 유지한다.
[x] `chipFamily`의 iOS Flat / Material이 실제 shared CSS surface/geometry/state를 바꾼다.
[x] later-loaded liquid baseline이 non-liquid family를 다시 덮지 못하도록 module-scoped canonical selector로 수정.
[x] family CSS를 Registry `ownerFiles`에 포함해 Public Snapshot dependency loader에서도 같은 owner를 사용할 수 있게 함.
[x] live Pages에서 liquid → iOS Flat → Material의 computed skin 차이를 Chromium으로 확인.
[-] PC/mobile/light/dark 전체 visual matrix 재검수.

## Filter style families / horizontal interaction

[x] iOS Liquid / iOS Flat / Material은 하나의 `filter-chip-rail` 안에 존재하는 실제 source DOM family다.
[x] 세 family 모두 같은 `platform-filter-select` event와 ARIA state를 사용한다.
[x] Material에서 의미 없는 background blur 설정은 Library에서 disabled 처리한다.
[x] iOS Liquid `gap` / `runway` 실제 geometry 소비 no-op 수정.
[x] 메뉴가 rail 너비를 넘으면 세 family 모두 nowrap + horizontal overflow로 수용한다.
[x] Material family를 tonal surface / shape change / motion 중심으로 재구성했다.
[x] Library selector에 현재 family를 표시하고 변경 즉시 동기화한다.
[x] 모바일은 browser-native `pan-x`를 사용한다.
[x] PC는 canonical `filter-chip-rail` hydrate owner가 mouse drag + drag 후 click suppression을 제공한다.
[x] live Pages에서 PC pointer drag 190px + mobile native pan-x를 Chromium으로 확인.
[-] 세 family PC/mobile/light/dark 전체 visual matrix 재검수.

## Library content completeness

[x] 상단 메뉴 항목 표시명/대상 ID 추가·삭제·순서변경을 live preview와 저장 기본값에 반영한다.
[x] 범용 필터칩 메뉴 추가·삭제·순서변경 및 선택 상태 보존.
[x] `horizontal-rail` canonical 카드가 지원하는 `eyebrow/title/description/tags/meta/image/imageAlt/actionLabel/actionUrl`을 Library에서 보존·편집한다.
[x] `horizontal-rail` 순서변경 시 tags/meta/image/action 필드가 삭제되지 않는다.
[x] live Pages에서 badges/meta/action이 편집·재정렬 후 유지되는지 Chromium으로 확인.
[x] `accordion`의 `singleOpen/openFirst/openIds/item meta`를 Library에서 편집한다.
[x] `bottom-sheet`의 initial open/show launcher/launcher label/backdrop dismiss/primary+secondary action을 Library에서 편집한다.
[x] Library preview frame의 장식용 box-shadow를 제거해 모듈 자체 surface와 preview frame을 혼동하지 않게 했다.
[x] live Pages에서 preview iframe의 인위적 shadow가 없는지 확인.
[-] 승인 모듈 전체에서 Registry가 지원하지만 Library editor에 빠진 content/state 필드가 더 없는지 계속 전수검사한다.

## Library settings runtime audit

[x] manifest + module extension visible controls를 canonical style/runtime owner와 1:1 코드 대조.
[x] `SETTING-RUNTIME-AUDIT-V1.md`에 owner/effect 단위 기록.
[x] locked control은 UI에서 disabled인지 별도 검사.
[x] exhaustive Chromium setting gate가 모든 기존 style control을 non-default 값으로 바꿔 measurable effect를 검사한다.
[x] `check-library-runtime-feedback-v1.mjs`가 family/drag/content-preservation 문제를 실제 DOM으로 검사한다.
[x] 위 focused gate를 `photo-ebook.pages.dev` live workflow에도 연결했다.
[ ] 향후 새 visible control 추가 시 exhaustive gate에도 반드시 추가한다.
[-] PC/mobile/light/dark visual QA에서 추가 no-op이 발견되면 canonical runtime 구현 또는 UI 제거/disabled 처리한다.

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

[x] `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`에 canonical/metadata/robots/sitemap 기본 계약 존재.
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

## QA / CI

[x] `scripts/check-platform-module-pipeline-v3.mjs` canonical pipeline 검사.
[x] `scripts/check-top-nav-runtime-parity.mjs` Photography Public ↔ Library 상단 메뉴 owner/motion/native-pan 검사.
[x] `scripts/check-library-setting-runtime-exhaustive-v2.mjs` visible setting runtime exhaustive 검사.
[x] `scripts/check-portable-primitives-batch2-v1.mjs` portable 3종 Registry/interaction/Editor snapshot 검사.
[x] `scripts/check-library-runtime-feedback-v1.mjs` family skin, filter drag, rail content preservation, primitive control completeness 검사.
[x] PR #39 merged: `12e3deb7996c46647a589e9bc7bb7ff43683cd44`.
[x] PR #40 merged: `7153464f7acbefdc49d67bb4cb243f38577a3138`.
[x] main `Platform Library Generalization Checks` run #14: PASS.
[x] main `Platform Library Checks` run #429 after PR #39: PASS.
[x] main `Platform Library Checks` run #431 after PR #40: PASS.
[x] `Platform Live Deploy Check` run #37 (`32949387548`): PASS.
[x] live QA now distinguishes 6 Photography/Public modules from 3 portable Library/Editor-only modules.
[x] live focused feedback gate: 7 checks PASS.
[x] live status bot commit: `a0383b91aeda69d0386a1422915b47cb65227f09`.

## Exact next action

1. 전체 9개 승인 모듈을 PC/mobile × light/dark 기준으로 실제 visual matrix 검수한다. filter/top-nav style family variant도 별도 포함한다.
2. 각 모듈의 Registry props/state/style controls와 Library inspector를 다시 1:1 대조해 빠진 content/state control 또는 no-op이 있으면 canonical owner에서 구현하거나 UI에서 제거/disabled 처리한다.
3. visual/runtime audit가 안정되면 SEO/GEO page metadata를 Editor/page model/runtime에 실제 연결한다.
4. 이후 completed-page registry → exact-runtime edit/duplicate → dependency-aware export → portable new-project smoke test 순서로 진행한다.
5. Photography 최종 Public의 새 primitive 연결 또는 최종 경험 변경은 사용자 승인 전 진행하지 않는다.
