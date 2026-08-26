# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / unified admin shell + Library navigation UX`
Production branch: `main`
Current implementation branch: `fix/admin-shell-library-navigation-v2`
Latest production runtime PR: `#43` merged (`431ed3360039f3b10662f151587b6ca7c45340a9`), live verification record `444ead0a3ef94855697b147c06aeece1bbd42e38`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product architecture

[x] `PlatformModuleRegistry` = 승인 canonical module의 영구 source of truth.
[x] 기존 공개 페이지는 bootstrap extraction/parity reference일 뿐 영구 Library upstream이 아님.
[x] `source: public-extracted`는 최초 추출 provenance이며 live dependency 의미가 아님.
[x] `/ui-dashboard/` = 승인된 공통 모듈 UI Library.
[x] `/block-lab/` = 유일한 연구 공간.
[x] `/editor-lab/` = 승인 모듈 기반 페이지 조립/저장/발행의 canonical Editor route.
[x] `Library → Editor → Completed Page → Public → Portable Export`를 최종 실행 경로로 확정.
[x] preview-only 모사 구현 금지 규칙을 `AGENTS.md`에 영구 추가.
[-] Photography를 bootstrap source 역할에서 제거하고 첫 Completed Page로 이관하는 기술 경로를 구현.
[-] 동일 canonical module을 새 저장소/새 프로젝트로 가져가는 `Portable Export`를 필수 소비 경로로 확장.

## Canonical module contract

[x] `PlatformModuleRegistry` approved-only consumer 구조 유지.
[x] Library 기본값은 신규 Editor 인스턴스 생성 시 snapshot한다.
[x] 기존 Editor 인스턴스는 mutable Library 기본값을 다시 읽지 않는다.
[x] Public Snapshot은 admin iframe 없이 `PlatformModuleRegistry.mount()`로 `ui-module`을 직접 렌더한다.
[x] Public Snapshot은 저장된 style overrides를 `PlatformModuleStyleRuntime`으로 실제 적용한다.
[x] Photography에서 최초 추출한 모듈은 Library/Editor/Public에서 같은 module id + render/hydrate owner를 사용한다.
[x] 위 모듈의 Photography 연계는 migration/parity QA용이며 영구 source contract가 아님.
[x] Block Lab 승격 primitive는 연구실 runtime을 직접 import하지 않고 shared canonical owner로 분리한다.
[-] Portable Export도 같은 module id/render/hydrate/style owner를 포함하도록 dependency manifest 계약 추가.

## Current approved module set

Photography bootstrap-origin canonical set (`public-extracted` = provenance only):
[x] `top-chapter-navigation`
[x] `filter-chip-rail`
[x] `horizontal-card-rail`
[x] `collection-bottom-sheet`
[x] `device-handoff-accordion`
[x] `floating-action`

Block Lab promoted portable set:
[x] `horizontal-rail`
[x] `accordion`
[x] `bottom-sheet`

Platform composition:
[x] `screen-mode-selector`

[x] Library와 Editor가 승인 module을 같은 Registry render/hydrate owner로 사용한다.
[x] portable 3종과 screen-mode를 Photography 현재 Public에 자동 연결하지 않는다.
[ ] 사용자 승인 후 필요한 Completed Page/Public consumer 및 Portable Export dependency manifest까지 확장한다.

## Library hierarchy / admin shell

[x] 상단 가로 module chip catalog를 Registry-driven 좌측 hierarchy tree로 교체.
[x] tree는 실제 `[data-kit-ui]` Registry selector button을 이동/재조정하며 별도 module catalog clone을 만들지 않음.
[x] 메뉴 / 탐색, 가로 콘텐츠, 아코디언, 하단 팝업, 버튼 / 액션, 화면 / 표시의 계층 taxonomy 적용.
[x] group별 SVG icon과 펼침/접힘/active 시각 위계 추가.
[x] group open/closed 상태 저장.
[x] 모듈 수가 많아져도 tree body만 세로 스크롤하도록 남은 shell 높이에 배치.
[x] sidebar button collapse/reopen 구현.
[x] collapse 시 shell 실제 폭과 page offset 변수를 분리해 텍스트가 좁은 폭으로 삐져나오는 버그 수정.
[x] reopen affordance를 좌측 중앙 고정 handle로 변경.
[x] sidebar drag resize + 좁은 폭 drag collapse 구현.
[x] sidebar 폭을 `platformAdminSidebarWidthV1`로 저장해 Library / Block Lab / Editor 간 공유.
[x] mobile/narrow admin drawer 경로 유지.
[-] 새 hierarchy/collapse/resize를 Chromium architecture gate로 회귀 검증.

## Admin theme / preview-state separation

[x] 관리 화면 전용 테마 상태 `platformAdminThemeV1` 추가: light / dark / system.
[x] 관리 화면 테마는 `data-admin-theme` / `data-admin-theme-resolved`와 admin CSS token만 변경.
[x] Library 편집 대상 테마 `platformLibraryThemeV3`와 관리 화면 테마를 분리.
[x] 관리 화면이 dark여도 Library iframe의 기본 편집 대상은 light로 유지 가능.
[x] Library preview theme/viewport/`스타일 / 상태` 실제 owner DOM을 canvas 바로 위 한 toolbar로 이동; 복제 UI 생성 금지.
[x] Block Lab `data-theme`, Editor `data-theme`, QA preview theme는 admin theme과 독립 유지.
[x] `admin-unified-v2.css`로 Library / Block Lab / Editor / QA의 공통 management chrome token과 topbar 표현을 통일.
[-] Library admin dark → preview light 유지, preview dark → admin dark 유지, 대메뉴 이동 상태 유지까지 Chromium으로 검증.

## Shared primitive remediation from PR #43

[x] `bottom-sheet`와 `collection-bottom-sheet`가 shared bottom-popup shell owner를 소비하도록 중복 skin 제거.
[x] `screen-mode-selector`가 별도 segmented skin 대신 canonical `filter-chip-rail`을 composition하도록 변경.
[x] `horizontal-rail` bottom paint runway를 canonical CSS에 추가해 그림자 clipping 수정.
[x] device-handoff preview에 섞이는 unrelated screen-mode page-context UI 격리.
[x] Photography는 bootstrap-only이며 Completed Page migration이 최종 상태라는 architecture audit 문서화.

## Top navigation migration parity

[x] Library 상단 메뉴 HTML이 초기 Photography 추출 canonical renderer를 사용한다.
[x] Library hydration이 같은 shared navigation owner를 사용한다.
[x] 실제 liquid motion owner는 `public/assets/js/ui/liquid-controller.js`다.
[x] 실제 native pan owner는 `native-pan-fab-clearance.css`다.
[x] Library module remount 뒤 새 `.nav-scroll`에 canonical liquid controller가 다시 연결된다.
[x] Library 기본 style config가 BREEZE easing을 덮어쓰지 않는다.
[x] iOS Liquid 기본값은 bootstrap Photography parity appearance/motion을 유지한다.
[x] `chipFamily`의 iOS Flat / Material이 실제 shared CSS surface/geometry/state를 바꾼다.
[x] family CSS를 Registry `ownerFiles`에 포함해 consumer가 같은 owner를 사용할 수 있게 함.
[x] live Pages에서 liquid → iOS Flat → Material computed skin 차이를 Chromium으로 확인.
[-] PC/mobile/light/dark 전체 visual matrix 재검수.
[ ] Photography Completed Page migration 이후 QA 기준을 legacy page가 아니라 canonical Completed Page snapshot으로 전환.

## Filter style families / horizontal interaction

[x] iOS Liquid / iOS Flat / Material은 하나의 `filter-chip-rail` 안에 존재하는 실제 source DOM family다.
[x] 세 family 모두 같은 `platform-filter-select` event와 ARIA state를 사용한다.
[x] Material에서 의미 없는 background blur 설정은 Library에서 disabled 처리한다.
[x] iOS Liquid `gap` / `runway` 실제 geometry 소비 no-op 수정.
[x] 메뉴가 rail 너비를 넘으면 세 family 모두 nowrap + horizontal overflow로 수용한다.
[x] Material family를 tonal surface / shape change / motion 중심으로 재구성했다.
[x] 모바일 browser-native `pan-x` 사용.
[x] PC canonical hydrate owner가 mouse drag + drag 후 click suppression 제공.
[x] live Pages에서 PC pointer drag + mobile native pan-x 확인.
[-] 세 family PC/mobile/light/dark 전체 visual matrix 재검수.

## Library content completeness

[x] 상단 메뉴 항목 표시명/대상 ID 추가·삭제·순서변경을 live preview와 저장 기본값에 반영한다.
[x] 범용 필터칩 메뉴 추가·삭제·순서변경 및 선택 상태 보존.
[x] `horizontal-rail` canonical 카드의 `eyebrow/title/description/tags/meta/image/imageAlt/actionLabel/actionUrl` 보존·편집.
[x] `horizontal-rail` 순서변경 시 tags/meta/image/action 필드 유지.
[x] `accordion`의 `singleOpen/openFirst/openIds/item meta`를 Library에서 편집.
[x] `bottom-sheet`의 initial open/show launcher/launcher label/backdrop dismiss/primary+secondary action 편집.
[x] Library preview frame 장식용 box-shadow 제거.
[-] 승인 모듈 전체에서 Registry가 지원하지만 Library editor에 빠진 content/state 필드가 더 없는지 계속 전수검사한다.

## Library settings runtime audit

[x] manifest + module extension visible controls를 canonical style/runtime owner와 1:1 코드 대조.
[x] `SETTING-RUNTIME-AUDIT-V1.md`에 owner/effect 단위 기록.
[x] locked control은 UI에서 disabled인지 검사.
[x] exhaustive Chromium setting gate가 기존 style control을 non-default 값으로 바꿔 measurable effect 검사.
[x] focused runtime feedback gate를 live workflow에 연결.
[ ] 향후 새 visible control 추가 시 exhaustive gate에도 반드시 추가.
[-] PC/mobile/light/dark visual QA에서 추가 no-op이 발견되면 canonical runtime 구현 또는 UI 제거/disabled.

## Photography ↔ Block Lab parity / extraction backlog

[x] `docs/library/blocks/photography/PARITY-V1.md`에서 Photography production block을 Block Lab 구조와 1차 분류 완료.
[ ] `hero / immersive-metrics` candidate 구현.
[ ] `chapter-hero / image-overlay` candidate 구현.
[ ] `comparison-cards / visual-metrics` candidate 구현.
[ ] `roadmap / metric-cards` candidate 구현.
[ ] 기존 scored/product/case/offer/script/tutorial/resources variants에 generic refinement / style preset 반영.
[ ] base skill-card generic destination 결정.
[ ] numbered checklist mini-card vs unified surface 결정.
[ ] 사용자 승인된 candidate/preset만 Editor production library로 승격.

## SEO / GEO + page structure

[x] `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`에 canonical/metadata/robots/sitemap 기본 계약 존재.
[ ] SEO/GEO metadata를 page model과 Editor에서 실제 편집/저장할 수 있게 연결.
[ ] page hierarchy / parent-child / route / canonical / sitemap 포함 여부를 공통 page metadata로 관리.
[ ] draft/preview는 noindex, published snapshot만 indexable이라는 런타임 계약 자동 검증.
[ ] export bundle이 SEO/GEO/page hierarchy metadata를 손실 없이 포함하도록 manifest 규격화.

## Completed-page technical roadmap

[x] Photography는 영구 Library source가 아니라 첫 Completed Page migration 대상이라는 원칙 확정.
[ ] Completed Page registry data model 정의.
[ ] Block Editor에 Completed Page 목록/browse surface 구현.
[ ] Photography 현재 페이지를 non-destructive canonical page snapshot으로 변환/등록.
[ ] 목록에서 Photography를 열었을 때 실제 published runtime과 동일 canonical owner로 렌더.
[ ] Completed Page의 content/style/state/page metadata 편집.
[ ] Completed Page snapshot 전체 복제 기능.
[ ] published revision / draft revision / route 상태 관리.
[ ] 초기 single-page main/home 정책과 다중 completed-page 전환 규칙을 metadata로 관리.
[ ] Photography migration/parity 완료 후 legacy page를 Library upstream/QA source로 취급하는 코드·문서 제거.

## Saved completed module / preset

[x] preset은 `moduleId + moduleVersion + content/style/state snapshot`만 저장하고 rendered HTML/CSS를 저장하지 않는 계약 확정.
[ ] reusable preset registry/storage schema 구현.
[ ] Editor에서 현재 module instance를 preset으로 저장.
[ ] preset 재삽입 시 동일 Registry owner로 새 instance 생성.

## Portable project / code export

[x] `AGENTS.md` reusable module contract를 `Library → Editor → Public → Portable Export`로 확장.
[ ] module dependency manifest: module ID/version + owner JS/CSS + assets + transitive dependencies.
[ ] page export manifest: page snapshot + selected modules + style/content/state props + SEO/GEO + route/sitemap metadata.
[ ] export bundle 생성기: 사용하지 않는 Photo-eBook app code 제외.
[ ] Cloudflare Pages starter/bootstrap 구성 포함.
[ ] 새 Git 저장소에서 동일 page smoke test.
[ ] common module distribution/versioning contract 확정.
[ ] exported project가 Library preview/admin iframe 없이 독립 실행되는지 CI 검증.

## QA / CI

[x] `scripts/check-platform-module-pipeline-v3.mjs` canonical pipeline 검사.
[x] `scripts/check-top-nav-runtime-parity.mjs` bootstrap Photography ↔ canonical Library parity 검사.
[x] `scripts/check-library-setting-runtime-exhaustive-v2.mjs` visible setting runtime exhaustive 검사.
[x] `scripts/check-portable-primitives-batch2-v1.mjs` portable Registry/interaction/Editor snapshot 검사.
[x] `scripts/check-library-runtime-feedback-v1.mjs` family skin/filter drag/rail content/primitive controls 검사.
[x] `scripts/check-library-module-family-controls-v1.mjs`를 tree/collapse/shared shell/composition + admin-theme/preview isolation/cross-route shell continuity 검사로 확장.
[x] Architecture workflow가 `public/assets/js/admin/**`, `public/assets/styles/admin/**`, Block Lab, QA 변경도 감시하도록 확장.
[x] PR #43 merge 및 live verification record 확인.
[-] current branch architecture + 전체 PR CI 확인.

## Exact next action

1. `fix/admin-shell-library-navigation-v2`에서 architecture Chromium gate와 기존 Library/Generalization 회귀 CI를 통과시킨다.
2. CI green이면 PR을 main에 병합하고 Cloudflare live에서 좌측 tree/collapse, preview toolbar, admin-theme isolation, Block Lab/Editor shell continuity를 확인한다.
3. 전체 10개 승인 모듈을 PC/mobile × light/dark visual matrix로 검수한다. filter/top-nav family variant도 별도 포함한다.
4. visible setting/content/state 전수 audit를 끝낸다.
5. Completed Page registry/list를 구현하고 Photography를 첫 page snapshot으로 migration한다.
6. Photography migration이 끝나면 legacy Photography page를 Library source/영구 QA 기준으로 취급하는 의존을 제거한다.
7. 이후 saved preset → SEO/GEO/page hierarchy → dependency-aware Portable Export/new-project smoke test 순서로 진행한다.
8. 현재 Photography final Public 경험 변경은 사용자 승인 전 진행하지 않는다.
