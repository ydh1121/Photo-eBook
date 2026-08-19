# 16. AI / Codex 작업 수행 규약

이 문서는 ChatGPT, Codex 또는 자동화 스킬이 Photo-eBook을 수정할 때 따를 실행 규약이다. 새로운 UI를 정의하지 않고, 현재 명세와 owner를 잘못 우회하지 않도록 작업 순서를 고정한다.

## WORK-001 — 기준

- repository: `ydh1121/Photo-eBook`
- production branch: `main`
- deploy root: `public/`
- normative spec: `docs/spec-v1/`
- 사용자 승인 모바일 기준: `UI_REGRESSION_SPEC.md`

과거 V1 baseline SHA는 역사 기준점으로 보존하되, 현재 runtime 파일 경로와 owner는 `01-runtime-file-map.md`, `12-lifecycle-ownership.md`를 source of truth로 사용한다.

## WORK-002 — 작업 전 필수 읽기

최소:
1. repository `README.md`
2. `01-runtime-file-map.md`
3. 변경 대상 세부 명세
4. `12-lifecycle-ownership.md`
5. `14-legacy-and-tech-debt.md`
6. `15-regression-checklist.md`
7. `UI_REGRESSION_SPEC.md`

추가:
- Liquid/navigation → `06-liquid-navigation.md`
- collection → `07-collection-hub.md`
- question → `08-question-workflow.md`
- theme/Safari → `10-theme-and-safari.md`
- data/API → `11-data-api-storage.md`
- image generation → `17`, `18` 이미지 시스템 명세

## WORK-003 — 변경 범위 선언

코드 작성 전 확인:
- 사용자가 요청한 변화.
- 변화하면 안 되는 인접 영역.
- 실제 DOM selector/state/data attribute.
- current semantic module/owner.
- 후반 CSS override/repair 여부.
- direct load인지 postload인지.

owner를 못 찾은 상태에서 새 override/controller를 추가하지 않는다.

## WORK-004 — 실제 runtime 확인

파일명만 보고 authority를 추정하지 않는다.

반드시:
1. `public/index.html` 실제 load path/order 확인.
2. `assets/js/app/postload-enhancements.js` 동적 load 확인.
3. global function 후속 override 확인.
4. 동일 selector 후반 cascade 확인.
5. guard flag 확인.
6. MutationObserver/timeout repair 확인.

2026-08-19 cleanup에서 삭제된 과거 numbered `script-N.js`, `style-N.css`를 history에서 발견해도 production dependency로 다시 연결하지 않는다.

## WORK-005 — Single owner

중복 owner를 만들지 않는다.

특히:
- moving liquid indicator → `js/ui/liquid-controller.js`
- chapter active/scroll target → `js/navigation/chapter-navigation.js`
- collection base DOM/state → `js/collection/collection-hub.js`
- bulk selection → `js/collection/bulk-selection.js`
- question workspace → `js/questions/question-workspace.js`
- contextual question handoff → `js/questions/context-handoff.js`
- device continuity → `js/collection/device-handoff.js`
- runtime theme → `js/ui/liquid-controller.js`
- Safari initial nav lifecycle → `js/safari/deferred-sticky-nav.js`

compat/repair layer는 canonical state source로 승격하지 않는다.

## WORK-006 — 디자인 변경 최소 단위

금지 예:
- 질문 selector 버그를 고치면서 unrelated global card/token 변경.
- 카드 하나를 고치면서 전체 radius 변경.
- Safari 문제를 고치면서 FAB/sheet geometry 변경.
- desktop 문제를 고치면서 mobile baseline 변경.

공용 token 변경이 필요하면 영향 component를 먼저 식별한다.

## WORK-007 — 모바일 기준선

모바일은 명시적 사용자 요청이 없는 한 승인된 시각 기준선을 유지한다.

PC 전용 개선은 가능한 `min-width:1024px` 범위에 둔다.

공통 JS 기능 수정은 가능하지만 모바일 위치/크기/여백/표면이 달라지면 회귀다.

## WORK-008 — Safari 규칙

현재 승인된 iPhone Safari 해결책:
- iOS WebKit `html/body`에 실제 theme root canvas.
- 최초 nav normal flow.
- visualViewport/scroll compact signal 이후 sticky arm.
- hidden collection open/tab/close replay 없음.

Safari 문제를 고친다는 이유로:
- root를 무조건 transparent로 되돌리거나,
- initial sticky를 다시 강제하거나,
- 5px edge offset hack을 넣거나,
- hidden popup lifecycle을 replay하지 않는다.

실기기 회귀는 `10-theme-and-safari.md`, `15-regression-checklist.md`를 따른다.

## WORK-009 — CSS 작업

CSS 수정 전:
- base selector 검색.
- 동일 selector의 모든 active override 확인.
- light/dark/media/Safari scope 확인.
- final computed authority 확인.

현재 semantic directory 구조가 생겼어도 CSS 내부 cascade debt는 남아 있다. 파일을 카테고리별로 보기 좋게 재정렬하는 이유만으로 load order를 바꾸지 않는다.

새 `!important`는 기존 cascade를 이해하지 못한 상태에서 임시로 추가하지 않는다.

## WORK-010 — JS 작업

JS 수정 전:
- direct/postload 구분.
- guard flag.
- global override.
- event listener phase/중복.
- observer/timeout repair.
- localStorage/API side effect.

동일 click을 처리하는 capture listener를 새로 만들기 전에 current owner로 해결 가능한지 확인한다.

## WORK-011 — Storage/API

호환성 계약으로 취급:
- `photoRoadmapQuestionsV2`
- `photoRoadmapDeviceKeyV1`
- article/video favorite stores
- `photoRoadmapThemeV1`
- `QUESTION_HISTORY`
- `CURATED_LINKS`
- `/api/site-data`
- `/api/rpc`
- `/api/curated`
- `/api/discover`
- `/api/videos`

파일명 cleanup이나 미관을 위해 storage/API 이름을 임의 변경하지 않는다.

## WORK-012 — Runtime file naming

새 runtime 파일:
- 기능을 설명하는 kebab-case.
- 적절한 semantic directory.
- 파일명에 revision 순번을 identity로 사용하지 않음.

예:
- `js/questions/context-handoff.js`
- `styles/safari/deferred-sticky-chrome.css`

파일 내용 revision/cache bust가 필요하면 URL query version으로 관리한다.

## WORK-013 — 파일 이동/rename

반드시 함께 확인:
1. `index.html` path.
2. postload dynamic URL.
3. JS 내부 asset URL.
4. CSS relative `url(...)`.
5. Functions/static asset reference.
6. docs owner path.
7. cache query.

active file move는 old/new blob이 동일한지 검증하는 것을 기본으로 한다.

## WORK-014 — 제거 규칙

다음 조건이면 production tree에서 제거 가능:
- dependency graph에서 실제로 load되지 않음.
- global definition이 최종 호출 전에 항상 덮어써지고 side effect 없음.
- temporary diagnostic/one-off migration 파일.
- replacement semantic asset이 동일 blob/content를 보유.

단, image generation manifest/status, approved WebP, deployment/functions 운영 파일은 단순히 “현재 화면에서 직접 안 보인다”는 이유로 삭제하지 않는다.

## WORK-015 — 이미지 파이프라인

이미지 생성/교체는 `17-image-generation-system.md`, `18-image-generation-commit-automation.md`, root `AGENTS.md`를 따른다.

- contextual slot 확인.
- 1 slot = 1 generation.
- QA.
- Drive mirror.
- WebP/Git production path.
- ready/applied 상태.
- 배포 검증.

## WORK-016 — 한국어 카피

새 한국어 문장/윤문은 `20-korean-copywriting-skill.md`와 COPY_GUIDE를 따른다.

코드 cleanup 중 content source나 사용자 확정 카피를 임의 수정하지 않는다.

## WORK-017 — 완료 전 검증

- `15-regression-checklist.md` 수행.
- branch compare 검토.
- main이 작업 시작 뒤 외부 변경됐는지 재확인.
- fast-forward 가능한 경우 force push 금지.
- main 반영 뒤 entry/tree 확인.
- live visual 검증을 실제로 하지 않았다면 했다고 표현하지 않는다.

## WORK-018 — 명세 변경

버그 수정/파일 rename을 제품 규칙 변경으로 오해하지 않는다.

제품 규칙이 실제 변경된 경우에만:
1. 사용자 승인.
2. 관련 spec 수정.
3. owner/component/regression 문서 수정.
4. 이전 규칙과 변경 이유 기록.
