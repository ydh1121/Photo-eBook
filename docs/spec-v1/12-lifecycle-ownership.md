# 12. 초기화 순서와 상태/DOM 소유권

가장 중요한 구조 규칙은 **같은 상태를 여러 모듈이 동시에 source of truth로 쓰지 않는 것**이다. 파일명은 역할을 설명하지만 실제 owner는 load order, guard, DOM lifecycle까지 함께 판단한다.

## LIFE-001 — Document bootstrap

`public/index.html` inline bootstrap:

- iOS WebKit detection/class.
- theme choice 읽기.
- effective theme 설정.
- `color-scheme` 설정.

이 단계에서는 app DOM을 만들지 않는다.

## LIFE-002 — bundled data / API phase

`public/data/site-data/part-01.js` ~ `part-08.js`가 bundled fallback JSON fragment를 등록한다.

`assets/js/core/site-data-client.js`가:
- local cache 읽기/쓰기.
- bundled fallback parse.
- `/api/site-data` live fetch.
- `/api/rpc` helper.

를 제공한다.

## LIFE-003 — Renderer definition phase

- `assets/js/core/render-helpers.js` — 공통 helper/image/callout.
- `assets/js/render/chapter-renderers.js` — 기본 chapter/component markup renderer.

후속 compatibility module이 일부 global renderer를 보정할 수 있으므로 최종 `app-shell` 실행 시점의 함수가 실제 renderer다.

## OWN-001 — 전체 app assembly

Owner: `assets/js/app/app-shell.js`

책임:
- nav data 정렬/필터.
- hero + nav + chapters 조합.
- `#app.innerHTML` 설정.
- app hidden 해제.
- boot 제거.
- navigation/question/copy setup 호출.

postload module이 전체 `#app.innerHTML`을 다시 쓰면 안 된다.

## LIFE-004 — UI readiness / recovery

- `assets/js/core/ui-ready-gate.js` — required renderer가 준비되기 전 premature render 방지, timeout fallback.
- `assets/js/app/boot-recovery.js` — app이 아직 정상 렌더되지 않은 경우에만 cache/bundled/live data로 복구.

이미 app이 정상 렌더된 뒤 destructive rerender하지 않는다.

## OWN-002 — Theme state

초기 owner: `index.html` inline bootstrap.

runtime owner: `assets/js/ui/liquid-controller.js`.

Source:
- localStorage `photoRoadmapThemeV1`
- html `data-theme-choice`
- html `data-theme`

다른 module은 읽을 수 있으나 parallel theme storage를 만들지 않는다.

## OWN-003 — Liquid moving indicator

Canonical owner: `assets/js/ui/liquid-controller.js`.

소유:
- top nav moving indicator.
- collection primary tabs moving indicator.
- theme choice moving indicator.
- common liquid skin mount/self-heal.

다른 module의 geometry write는 compatibility repair일 뿐 새 owner가 아니다.

## OWN-004 — Top chapter navigation state

Owner: `assets/js/navigation/chapter-navigation.js`.

소유:
- 현재 chapter 판정.
- nav-chip active class.
- chapter click scroll target.
- nav progress source 값.

moving liquid paint/motion은 `liquid-controller.js`가 관찰해 표현한다.

과거 최종 호출 전에 덮어써지기만 하던 중간 `setupNavigation()` 파일은 삭제됐다.

## OWN-005 — Safari initial nav geometry

Owner pair:
- `assets/js/safari/deferred-sticky-nav.js`
- `assets/styles/safari/deferred-sticky-chrome.css`

소유:
- iOS WebKit initial normal-flow nav.
- visualViewport/scroll compact signal.
- `safari-nav-sticky-armed` class.
- armed 후 sticky 복귀.
- iOS browser-facing root theme background.

collection popup lifecycle을 Safari chrome repair 수단으로 사용하지 않는다.

## LIFE-005 — Postload boundary

Owner: `assets/js/app/postload-enhancements.js`

순서:
1. app ready 대기.
2. 약 900ms wait.
3. stale interaction lock 정리.
4. idle callback.
5. `assets/js/media/generated-image-blob-cache.js` load.
6. guarded MutationObserver 환경에서 `assets/js/collection/collection-hub.js` load.
7. lock 재정리.

core first paint를 늦추지 않는다.

## OWN-006 — Collection DOM/base state

Owner: postload `assets/js/collection/collection-hub.js`.

소유:
- collection layer/FAB/backdrop/sheet 생성.
- open/close.
- primary tab/filter/search state.
- item rendering.
- settings rendering.
- favorite aggregation.
- drag close.

Outside interaction shield: `assets/js/collection/modal-shield.js`.

## OWN-007 — Collection bulk selection

주요 owner: `assets/js/collection/bulk-selection.js`.

State projection:
- select toggle active state.
- `collectionBody.is-bulk-selecting`.
- card `.is-selected`.
- selectbox `aria-pressed`.
- bulk bar count/delete.

질문 workspace rerender 후 repair가 일부 존재하지만 새 bulk source를 만들지 않는다.

## OWN-008 — Device continuation

Primary owner: `assets/js/collection/device-handoff.js`.

Compatibility/transition helper: `assets/js/collection/device-handoff-compat.js`.

Source:
- `photoRoadmapDeviceKeyV1` localStorage key.
- QUESTION_HISTORY RPC deviceId.

accordion visual state는 trigger의 `aria-expanded`를 기준으로 유지한다.

## OWN-009 — Question base data/form

Base state/form은 `assets/js/app/app-shell.js`가 최초 생성하는 legacy-compatible form elements와 local question data를 사용한다.

질문 user state source:
- localStorage `photoRoadmapQuestionsV2`.
- QUESTION_HISTORY sheet/RPC sync.

## OWN-010 — Question workspace

Owner: `assets/js/questions/question-workspace.js`.

소유:
- 질문 작성 / 저장한 질문 controls.
- write/saved mode.
- composer mount/parking.
- force-write entry.

## OWN-011 — Contextual question handoff

Owner: `assets/js/questions/context-handoff.js`.

소유:
- text selection / contextual GPT entry intent.
- collection question tab/write mode로 deterministic handoff.
- write panel 보존/reconcile.

과거 별도 canonical `script-29` 세대는 제거됐다.

## OWN-012 — Question visible geometry

Final visual owner:
- `assets/styles/questions/workspace-final.css`

보조 layer:
- `styles/questions/workspace-controls.css`
- `styles/questions/workspace-stability.css`
- `assets/js/ui/breeze-repair.js`

승인 기준:
- write/saved 두 슬롯 대칭.
- moving pill 하나.
- 라벨 중심과 badge 독립.
- current CSS `!important` geometry가 legacy inline repair보다 우선.

향후 JS/CSS double ownership은 기술부채로 단계적으로 제거한다.

## OWN-013 — Question actions

Owner: `assets/js/questions/question-actions.js`.

소유:
- prompt copy.
- question save/action enhancement.
- ChatGPT handoff.
- swipe/delete interaction 보강.

## OWN-014 — Article/video favorite state

Source of truth:
- localStorage favorite ID set.
- localStorage snapshot object.

`content-discovery.js`와 collection/content renderer는 이를 projection한다. 버튼 DOM 자체를 state source로 삼지 않는다.

## OWN-015 — Generated/contextual images

- registry: `assets/js/media/image-slot-registry.js`
- DOM binding: `assets/js/media/image-slot-binder.js`
- postload data URL helper: `assets/js/media/generated-image-blob-cache.js`
- static approved production images: `public/assets/images/generated/v1/`

slot은 `ready:true`일 때만 generated path를 활성화한다.

## OWN-016 — Desktop horizontal rail drag

Owner: `assets/js/desktop/rail-drag.js`.

PC pointer/mouse interaction만 보강하며 모바일 native touch scroll을 소유하지 않는다.

## OWN-017 — Copy presentation compatibility

- `assets/js/compat/curated-copy.js`
- `assets/js/compat/copy-contract.js`

Google Sheet가 content source인 영역을 임의로 별도 데이터 source로 복제하지 않는다. 이 계층은 승인된 표시/라벨/line-break contract만 보장한다.

## REG-001 — owner 변경 규칙

1. 새 상태를 추가하기 전에 기존 owner를 찾는다.
2. 같은 state를 쓰는 parallel module을 추가하지 않는다.
3. compatibility repair를 canonical owner로 승격하려면 문서와 regression test를 함께 갱신한다.
4. semantic filename만 보고 owner라고 판단하지 않는다.
5. DOM rerender boundary를 변경할 때 question/collection parking과 event listener 생존 여부를 검증한다.
