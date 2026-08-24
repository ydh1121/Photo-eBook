# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / canonical module pipeline rebuild / branch QA pending`
Production branch: `main`
Branch base main: `721dcc2cd2f0802a9a231ade5f007d973ae31d36`
Current implementation branch: `refactor/canonical-library-pipeline-v1`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## User-confirmed product architecture

[x] 공개 페이지를 현재까지 완성된 모듈의 reference source로 정의한다.
[x] `/ui-dashboard/`를 승인된 공통 모듈의 UI 라이브러리로 정의한다.
[x] `/block-lab/`만 블록 연구실로 사용한다.
[x] `/block-editor/`를 승인된 모듈 기반 신규 페이지 조립/저장 도구로 정의한다.
[x] 기존 `화면 구성 / sandbox page builder`를 1급 제품 역할에서 제거한다.

Canonical flows:

`공개 페이지 완성형 → 공통 모듈 추출 → UI 라이브러리 → 블록 에디터 → 공개 페이지`

`블록 연구실 → 사용자 + GPT 검토 → 공통 모듈 승격 → UI 라이브러리 → 블록 에디터 → 공개 페이지`

## Canonical module registry

[x] `PlatformModuleRegistry`를 추가한다.
[x] module status를 `approved / candidate / deprecated`로 제한한다.
[x] provenance를 `public-extracted / block-lab-approved / platform-core`로 기록한다.
[x] 일반 consumer는 approved module만 사용할 수 있게 fail-closed한다.
[x] Library/Editor/Public consumer를 module definition에 명시한다.

## First public-extracted set

[x] `top-chapter-navigation`
[x] `filter-chip-rail`
[x] `horizontal-card-rail`
[x] `collection-bottom-sheet`
[x] `device-handoff-accordion`
[x] `floating-action`

[x] 기존 공개 DOM class/id와 interaction owner를 보존해 공통 render/hydrate owner로 추출한다.
[x] public top navigation은 첫 adapter로 canonical module을 실제 사용한다.
[ ] 나머지 다섯 public legacy path는 Library/Editor 안정화 뒤 단계적으로 adapter 전환한다.

## UI Library

[x] `/ui-dashboard/` root를 Library 전용 route로 바꾼다.
[x] `?view=library` 이중 모드를 제거한다.
[x] legacy screen composer toolbar/block palette/sandbox boot를 root에서 제거한다.
[x] catalog를 `PlatformModuleRegistry.listFor('library')`로 구성한다.
[x] Library와 Editor 공통 preview host `/ui-dashboard/module-preview/`를 추가한다.
[x] theme / PC / mobile preview를 shared host에 전달한다.
[x] filter sample V2/V3 normalization을 유지해 `[object Object]` 회귀를 차단한다.
[x] module provenance를 inspector에 표시한다.
[-] branch browser QA에서 6개 모듈 interaction/overflow/theme/mobile을 검증한다.

## Block Lab

[x] `/block-lab/`를 `블록 연구실`로 명명한다.
[x] `RESEARCH ONLY` 경계를 화면과 문서에 명시한다.
[x] 기존 candidate/variant/style research runtime을 연구실 내부에 유지한다.
[x] Library/Editor가 Block Lab JS/CSS/sample data를 직접 import하지 않도록 정적 boundary check를 추가한다.
[ ] 실제 Block Lab candidate → `block-lab-approved` 승격 transaction을 첫 사례에서 검증한다.

## Block Editor

[x] canonical route `/block-editor/`를 추가한다.
[x] 기존 `/editor-lab/`는 compatibility route로 유지한다.
[x] Block Lab JS/CSS/sample data dependency를 제거한다.
[x] insertion catalog를 `PlatformModuleRegistry.listFor('editor')`로 교체한다.
[x] page block을 `type: ui-module + variant: module id + content: props`로 저장한다.
[x] Library와 동일 `/ui-dashboard/module-preview/`를 Editor module iframe으로 사용한다.
[x] media picker의 Block Lab sample dependency를 제거한다.
[-] branch browser QA에서 module 삽입, 저장 shape, shared preview를 검증한다.

## Admin shell

[x] 메뉴를 `UI 라이브러리 / 블록 연구실 / 블록 에디터 / QA` 4개 역할로 재정의한다.
[x] `화면 구성` 메뉴를 제거한다.
[x] Block Editor canonical link를 `/block-editor/`로 연결한다.
[-] PC/mobile current navigation 회귀를 branch QA에서 확인한다.

## QA / CI

[x] `scripts/check-platform-module-boundaries.mjs` 정적 boundary check를 추가한다.
[x] `scripts/check-platform-module-pipeline-v1.mjs` Chromium QA를 추가한다.
[x] 기존 reference-fixture 중심 PR QA 실행을 canonical module pipeline QA로 교체한다.
[x] live deploy checker를 canonical Library + Block Lab + Block Editor + public top-nav 기준으로 교체한다.
[x] live workflow trigger에 platform module / editor / lab / public adapter 변경을 포함한다.
[-] PR을 열고 `Platform Library Checks`를 통과시킨다.
[ ] QA artifact screenshot을 확인한다.
[ ] 실패가 있으면 branch에서 수정하고 재검증한다.
[ ] green + 시각 evidence 확인 후 main에 merge한다.
[ ] Cloudflare Pages live check가 pass하고 status bot commit이 기록되는지 확인한다.

## Cleanup

[ ] active reference가 없는 `/ui-dashboard/reference-preview/` legacy runtime을 삭제한다.
[ ] active reference가 없는 reference-preview CSS / obsolete reference QA를 삭제한다.
[ ] old sandbox/page-builder 파일은 product route에서 완전히 분리된 것을 확인한 뒤 별도 cleanup 범위를 결정한다.

## Permanent docs

[x] `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md` 추가.
[x] `VISUAL-BUILDER.md`를 legacy architecture retired + current UI Library contract로 교체.
[x] `ADMIN-SHELL.md`를 4-role architecture로 교체.
[x] workstream TASKS/HANDOFF를 새 architecture 기준으로 재작성한다.

## Exact next action

1. reference-preview/obsolete active references를 검색하고 안전한 legacy 파일만 삭제한다.
2. PR을 생성해 new static boundary + Chromium pipeline QA를 실행한다.
3. CI failure를 branch에서 수정한다.
4. green artifact를 확인한 뒤 main merge 여부를 결정한다.
5. merge 후 live Cloudflare canonical pipeline verification을 확인한다.
