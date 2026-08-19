# 13. 함수/스크립트 책임 레지스트리

이 문서는 현재 production tree의 **active runtime module**을 찾기 위한 인덱스다. 2026-08-19 semantic module cleanup 이후 삭제된 numbered script를 기준으로 탐색하지 않는다.

## Core / app

### `assets/js/core/site-data-client.js`

Owner: site data acquisition/API helper.

주요 책임:
- `photoRoadmapSiteDataV2` cache 읽기/쓰기.
- bundled site-data fragment parse.
- `/api/site-data` live fetch.
- `/api/rpc` POST helper.
- live/cache/bundled race orchestration.

### `assets/js/core/render-helpers.js`

Owner: global markup/media helper.

대표 함수:
- `$`, `$$`, `esc`, `attr`, `reduceMotion`.
- `imageFor()`.
- `paragraphs()`.
- `calloutHtml()`.
- product/link helper 계열.

### `assets/js/core/ui-ready-gate.js`

Owner: premature render 방지.

- `apiGetSiteData` 호출을 UI-ready 신호까지 gate.
- timeout fallback으로 boot deadlock 방지.

### `assets/js/app/app-shell.js`

Owner: 전체 app assembly와 base question form/data.

대표 책임:
- `renderApp(data)`.
- hero/nav/chapter 조립.
- boot 제거.
- navigation/copy/question setup.
- local question/device key helper.
- base selection/question drawer DOM/state.

### `assets/js/app/boot-recovery.js`

Owner: 초기 render 실패 recovery.

정상 app이 이미 렌더된 경우 destructive rerender하지 않는다.

### `assets/js/app/postload-enhancements.js`

Owner: non-critical runtime extension lifecycle.

동적 로드:
- `assets/js/media/generated-image-blob-cache.js`
- `assets/js/collection/collection-hub.js`

## Render / content

### `assets/js/render/chapter-renderers.js`

Owner: base page markup factory.

대표 renderer:
- hero/nav/chapter hero.
- intro/market/education/skills/portfolio/gear/plan/scripts/iphone/sources section.

후속 content/media module이 일부 renderer를 보강할 수 있다.

### `assets/js/content/curated-content.js`

Owner: curated article source section과 favorite base UI.

- current sources section override.
- curated card rendering.
- favorites read/write/render.
- `/api/curated` load/refresh.

### `assets/js/content/content-discovery.js`

Owner: endless curated/video discovery와 durable favorite snapshot 보강.

## Navigation / liquid

### `assets/js/navigation/chapter-navigation.js`

Owner: chapter active state와 click scroll target.

- 최종 effective `setupNavigation()`.
- IntersectionObserver chapter detection.
- active nav chip.
- reading progress source.

과거 중간 `setupNavigation()` 정의 파일은 production tree에서 제거했다.

### `assets/js/ui/liquid-controller.js`

Owner: canonical Liquid Glass moving indicator와 runtime theme UI.

- top nav moving indicator.
- collection primary tab indicator.
- theme choice indicator.
- shared liquid skin mount/self-heal.
- runtime theme apply/system preference sync.

### `assets/js/ui/breeze-repair.js`

Compatibility/repair layer.

- current question/liquid UI가 rerender 뒤 승인 geometry를 잃지 않도록 보정.
- canonical state source가 아니며 향후 consolidation 대상.

## Questions

### `assets/js/questions/drawer-enhancements.js`

Compatibility layer for base question drawer/settings behavior.

### `assets/js/questions/question-actions.js`

Owner: prompt copy/save/ChatGPT handoff/swipe-delete action 보강.

### `assets/js/questions/question-workspace.js`

Owner: collection 내부 `질문 작성 / 저장한 질문` workspace.

- V40 controls mount.
- write/saved state.
- composer parking/reuse.
- force-write entry.

### `assets/js/questions/context-handoff.js`

Owner: selected text/context → collection question workspace handoff.

- fresh contextual draft.
- question tab/write mode deterministic entry.
- current question structure/form reconcile.

과거 별도 `script-29.js` 세대는 제거됐다.

## Collection

### `assets/js/collection/collection-hub.js`

Owner: collection DOM/base state. Postload로 활성화된다.

- FAB/backdrop/sheet 생성.
- open/close.
- primary tabs/filter/search.
- item render.
- settings/favorite aggregation.
- drag close.

### `assets/js/collection/bulk-selection.js`

Owner: bulk select state/action.

- edit/select mode.
- selected card state.
- count/delete bar.

### `assets/js/collection/device-handoff.js`

Owner: 다른 기기에서 이어보기.

- sync key UI.
- QUESTION_HISTORY device id handoff.
- accordion state/action.

### `assets/js/collection/device-handoff-compat.js`

Compatibility layer for existing collection DOM/state transition. Primary device state source가 아니다.

### `assets/js/collection/modal-shield.js`

Owner: open collection sheet 바깥 click/touch 차단과 outside dismissal.

## Media

### `assets/js/media/media-enrichment.js`

Owner: generated image/skill media/video presentation 보강.

### `assets/js/media/image-slot-registry.js`

Owner: semantic image slot metadata (`path`, `fallbackKey`, `ready`, `rev`).

### `assets/js/media/image-slot-binder.js`

Owner: rendered DOM element와 semantic image slot 연결.

### `assets/js/media/generated-image-blob-cache.js`

Postload helper: generated data URL registry를 안전한 Blob URL로 변환.

### `assets/js/media/generated/*.js`

Generated image registry payload. 장기적으로 static WebP migration 가능한 기술부채다.

## Safari / desktop

### `assets/js/safari/theme-color-cleanup.js`

Owner: stale `meta[name="theme-color"]` 제거.

### `assets/js/safari/deferred-sticky-nav.js`

Owner: iOS Safari initial nav lifecycle.

- initial visual viewport baseline.
- compact signal 감지.
- `safari-nav-sticky-armed` class 설정.
- hidden popup replay 없음.

### `assets/js/desktop/rail-drag.js`

Owner: PC horizontal content rail mouse drag.

모바일 touch/pointer interaction을 가로채지 않는다.

## Compatibility copy

### `assets/js/compat/curated-copy.js`

Curated display copy cleanup.

### `assets/js/compat/copy-contract.js`

Approved Korean presentation contract와 collection/question label hierarchy 보정.

Google Sheet를 대체하는 content source가 아니다.

## Registry rules

1. 새 기능 수정 전 `12-lifecycle-ownership.md`와 이 registry에서 owner를 찾는다.
2. 삭제된 numbered path를 다시 연결하지 않는다.
3. 같은 state를 다루는 새 repair module을 만들기 전에 canonical owner를 확장한다.
4. postload module은 `index.html`에 없다고 inactive로 판단하지 않는다.
5. semantic filename은 탐색성 개선용이며 실제 authority는 load order/guard/DOM lifecycle로 판정한다.
