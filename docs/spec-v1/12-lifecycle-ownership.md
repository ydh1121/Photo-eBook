# 12. 초기화 순서와 상태/DOM 소유권

V1의 가장 중요한 구조 규칙은 **같은 상태를 여러 스크립트가 동시에 쓰지 않는 것**이다. 기준 코드는 누적 revision 때문에 일부 중복이 남아 있으므로, 현재 최종 owner와 기술부채를 분리해서 기록한다.

## LIFE-001 — Document phase

HTML parse 중 inline bootstrap이 수행하는 것:

- iOS WebKit class.
- theme choice.
- actual theme.
- color-scheme.

이 phase에서 app DOM을 재구성하지 않는다.

## LIFE-002 — Deferred data phase

`site-data-1..8.js`:
- bundled fallback JSON fragments 등록.

`script-1.js`:
- cache/fallback/live API helper 등록.

아직 user-facing app render가 완료됐다고 간주하지 않는다.

## LIFE-003 — Renderer definition phase

`script-2.js`:
- helper와 image/callout functions.

`script-3.js`:
- base markup renderers.

후속 scripts가 일부 renderer를 override할 수 있으므로 `renderApp()` 호출 시점의 최종 global function이 실제 renderer다.

## OWN-001 — `renderApp` owner

현재 `script-5.js`가 main app assembly owner다.

책임:
- nav data 정렬/필터.
- hero + nav + 10 chapter 조합.
- `#app.innerHTML` 설정.
- app hidden 해제.
- boot 제거.
- navigation/copy/question setup 호출.

다른 postload script가 전체 `#app.innerHTML`을 다시 쓰면 안 된다.

## LIFE-004 — UI gate

`script-gate.js`는 UI/data readiness gate를 제공한다.

목적:
- required scripts/renderer가 준비되기 전 premature render 방지.
- fallback timeout으로 deadlock 방지.

새 gate를 하나 더 추가해 boot가 두 개의 Promise를 기다리게 만들지 않는다.

## LIFE-005 — Boot recovery

`script-11.js`:
- app이 아직 렌더되지 않은 경우만 복구 시도.
- cache/bundled/live data로 render 재시도.

MUST:
- 이미 app이 정상 렌더된 상태에서는 destructive rerender 금지.

## OWN-002 — Theme state owner

초기 state:
- `index.html` bootstrap.

runtime state/UI:
- `script-liquid-core.js`.

keys/datasets:
- localStorage `photoRoadmapThemeV1`
- html `data-theme-choice`
- html `data-theme`

다른 script는 theme를 읽을 수 있으나 별도 storage key/parallel source를 만들지 않는다.

## OWN-003 — Liquid controller owner

현재 canonical owner:
`script-liquid-core.js`

소유:
- top nav moving indicator.
- collection primary tabs moving indicator.
- theme choice moving indicator.
- shared skin mount/self-heal.

이 owner는 `window.__photoV49CoreInstalled=true`로 retired script27을 차단한다.

## OWN-004 — Liquid visual material owner

공통 paint rules:
- `style-25.css` `.v37-liquid-skin`
- 후속 style30~35 z/overflow/first-paint adjustments

JS는 material color 자체를 inline style로 반복 쓰지 않는다.

## OWN-005 — Top chapter active state

현재 기준 코드에는 여러 `setupNavigation` 세대가 순서대로 정의된다.

실제 render 직전 마지막 override 계열은 `script-9.js` 쪽이다. 이후 canonical liquid controller는 active class 이동 indicator를 관찰한다.

소유권 분리:
- chapter 결정/scroll target: navigation setup.
- moving blue indicator: liquid controller.
- reading progress surface: navigation/liquid progress helper.

하나의 함수가 셋을 모두 강제로 animate하지 않는다.

## OWN-006 — Collection DOM/base state

현재 active owner:
postload `script-14.js`.

소유:
- collectionLayer/FAB/backdrop/sheet 생성.
- libraryTab/filter/search internal state.
- open/close.
- item render.
- base filter render.
- settings render.
- favorite item aggregation.
- drag close.

## LIFE-006 — Postload boundary

`script-postload-v27.js`:

1. app ready 대기.
2. 약 900ms wait.
3. stale modal/collection lock 정리.
4. idle callback.
5. `script-asset-fix.js` load.
6. guarded MutationObserver 환경에서 `script-14.js` load.
7. lock 재정리.

이 sequence는 core first paint를 늦추지 않기 위한 구조다.

## OWN-007 — Collection bulk state

현재 주요 owner:
`script-19.js`

보조 repair:
`script-24.js`, `script-25.js`

current invariant:
- select toggle state가 active 여부 source.
- `collectionBody.is-bulk-selecting` class.
- card `.is-selected`.
- selectbox `aria-pressed`.
- bulkbar count/delete.

새 구현에서 repair owner를 추가하지 않는다.

## OWN-008 — Question base data/form owner

`script-5.js`:
- selected text base state.
- quote/input base elements.
- local question store.
- save/sync base.
- selection bubble base.

## OWN-009 — Question workspace owner

`script-24.js`:
- V40 controls.
- write/saved mode state.
- parking/mounting composer.
- deterministic force write.
- legacy question hub stripping.

## OWN-010 — Question canonical structure owner

`script-29.js`:
- duplicate control cleanup.
- label normalization.
- indicator/skin existence.
- contextual selection → collection question handoff.

명시적으로 indicator geometry를 쓰지 않는다.

## OWN-011 — Question visible geometry owner

`style-34.css`:
- V40 grid geometry.
- left/right mirrored slots.
- visible indicator transform.
- 410ms CSS transition.

## OWN-012 — Question legacy JS motion debt

`script-25.js`에도 v40 geometry/motion write 코드가 남아 있다.

현재 CSS `!important`가 최종 visual geometry를 이긴다. 이는 정상적인 새 architecture가 아니라 compatibility debt다.

새 code는 script25를 본떠 세 번째 owner를 만들지 않는다.

## OWN-013 — Article favorite owner

현재 user state source:
- localStorage ID set.
- localStorage snapshot object.

render/sync는 script13/script14 계열이 관여하지만 **key와 ID 상태가 source of truth**다.

## OWN-014 — Video favorite owner

동일하게 ID set + snapshot object.

button UI는 state projection이며 별도 진실 source가 아니다.

## OWN-015 — External discovery owner

backend:
- curated fixed/cache: `curated.js`
- discovery: `discover.js`
- videos: `videos.js`

frontend:
- article render base `script-6.js`
- endless/durable augmentation `script-13.js`
- current canonical sentinel/collection snapshot integration `script-14.js`/`script-24.js`

## OWN-016 — Generated media owner

registry:
`window.__PHOTO_GENERATED_IMAGES`

initial values:
- generated JS assets.

postload conversion:
- script-asset-fix.

renderer는 registry를 읽을 수 있지만 registry key마다 별도의 hidden image owner를 만들지 않는다.

## OWN-017 — Safari compact prime owner

유일 owner:
`script-safari-compact-prime.js`

다른 script에서 visualViewport compact threshold를 또 추적하지 않는다.

## OWN-018 — Safari theme-color owner

`script-28.js`가 theme-color meta removal을 지속적으로 수행한다.

새 script가 동시에 meta theme-color를 추가/삭제하는 ping-pong 구조를 만들지 않는다.

## LIFE-007 — DOM replacement hazards

다음 DOM은 rerender/replace 가능성이 있으므로 stale reference에 주의한다.

- `#app` initial render.
- `#skillsInfiniteRow` postload clone/replace.
- `#collectionBody` tab/search/filter rerender.
- question legacy hub strip/replace.
- curated rail renderer.

controller는 replacement 가능한 child에 한번만 listener를 달고 끝내기보다 delegation 또는 owner render 시 binding을 사용한다.

## LIFE-008 — MutationObserver 규칙

MUST NOT:
- documentElement 전체 subtree를 여러 script가 무제한 observe.
- observer callback에서 자기 subtree를 매번 rewrite하여 무한 loop.

`script-postload-v27.js`는 old enhancement가 global subtree observer를 붙이지 못하도록 guard wrapper를 사용한다.

## LIFE-009 — Event delegation

dynamic collection/bookmark/question 요소는 document-level delegation을 사용할 수 있다.

단:
- capture handler가 normal click owner를 `stopImmediatePropagation`할 경우 정확한 selector scope 필요.
- unrelated buttons까지 막지 않는다.

## LIFE-010 — Pageshow

iOS Safari BFCache/pageshow 복귀에서:
- stale modal lock 정리.
- needed skin/question repair.
- theme-color cleanup.
- compact prime state check.

가능.

그러나 pageshow마다 app 전체 rerender는 하지 않는다.

## LIFE-011 — Resize

resize 종류를 구분한다.

- 실제 width/orientation change: geometry recalibration 가능.
- Safari chrome height-only change: top nav 전체 layout 재구성 금지.

## LIFE-012 — Scroll

vertical scroll frame에서 수행 가능한 작업:
- active chapter scan requestAnimationFrame.
- reading progress update.
- compact Safari state check.

MUST NOT:
- 모든 card layout 재계산.
- top nav indicator mount repeatedly.
- horizontal momentum loop.

## LIFE-013 — Click transition order

Liquid control click:
1. user action owner가 active class/state 변경.
2. canonical liquid controller가 class mutation/handler로 target geometry 이동.

self-heal이 active click 직후 `transition:none`을 쓰면 안 된다.

## LIFE-014 — Collection tab transition

primary tab click:
1. `libraryTab` state.
2. active class.
3. renderLibrary.
4. question tab이면 V40 repair/mount.
5. liquid indicator moves independently.

## LIFE-015 — Theme transition

theme button click:
1. choice update.
2. actual theme apply.
3. custom event.
4. relevant skins/surfaces CSS update.
5. indicator endpoint는 same button geometry 유지.

## LIFE-016 — App surface ownership

`html/body`는 browser-facing transparent layer.
`#app/.app`가 page canvas.

popup/browser workaround를 이유로 이 ownership을 다시 뒤집지 않는다.

## LIFE-017 — Cache version ownership

asset code 변경자 = 해당 query version 변경 책임자.

문서만 변경할 때 `index.html` asset version을 건드리지 않는다.

## REG-LIFE-001 — lifecycle regression

- first load와 third load의 glass state가 다름.
- refresh하면만 정상화되는 UI.
- popup tab을 한 번 눌러야 state가 완성됨(의도된 Safari compact prime 제외).
- 동일 selector를 두 controller가 계속 서로 transform.
- MutationObserver loop.
- postload가 first content render를 막음.
- pageshow 후 body lock이 남음.
