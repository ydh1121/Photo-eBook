# 06. Liquid Glass 네비게이션/필터 계약

이 영역은 과거 회귀가 많았으므로 **한 rail = 한 moving indicator = 한 canonical geometry/motion owner** 원칙을 지킨다.

## LIQ-001 — 공통 구조

Liquid selector는 다음 위계를 유지한다.

1. rail/container
2. moving geometry indicator
3. indicator 내부 `.v37-liquid-skin`
4. clickable label/button

button 자체의 selected blue background는 JS 초기 mount 전 fallback일 뿐이다. ready 이후에는 moving skin이 selected paint를 소유한다.

## LIQ-002 — canonical owner

Owner: `assets/js/ui/liquid-controller.js`

소유:
- `.nav-scroll` / `.nav-chip` / `.nav-v33-indicator`
- `.collection-tabs` / `.collection-tab` / `.collection-v33-indicator`
- `.theme-choice` / button / `.theme-v34-indicator`
- common skin mount/self-heal
- runtime theme UI

과거 retired liquid controller source는 production tree에서 제거됐으며 다시 연결하지 않는다.

## LIQ-003 — indicator invariant

rail당 indicator는 하나만 존재한다.

- 없으면 생성.
- 중복이면 DOM에서 제거.
- 내부 skin이 없으면 생성.
- active item의 실제 geometry로 settle.
- label은 indicator 위 z-layer.

중복 indicator를 opacity 0으로 숨겨 보관하지 않는다.

## LIQ-004 — geometry

일반 rail target은 active item의 실제:

- `offsetLeft`
- `offsetTop`
- `offsetWidth`
- `offsetHeight`

를 source로 사용한다.

endpoint를 rail width 비율로 추정하지 않는다.

## LIQ-005 — motion

selected indicator 이동은 transform/width/height가 같은 spring transition으로 움직인다.

승인 easing family:
`cubic-bezier(0.34, 1.56, 0.64, 1)`

거리 기반 duration은 허용하지만 과도하게 느리게 하지 않는다.

## LIQ-006 — overshoot / clipping

- selected pill은 rail보다 위 z-layer.
- non-scroll segmented rail은 필요 시 `overflow:visible`.
- top `.nav-scroll`은 실제 horizontal scrollport이므로 overflow를 강제로 visible로 바꾸지 않는다.
- first/last spring overshoot는 runway padding으로 보호한다.

## LIQ-007 — first-paint fallback

`assets/styles/safari/first-paint-fallback.css`를 포함한 후반 layer가 초기 flat blue flash/indicator mount 전 상태를 보정한다.

ready 이후 active button 자체에 두 번째 파란 plate가 남으면 회귀다.

---

# Top chapter navigation

## NAV-001 — information architecture

순서:
- 시작
- 시장
- 교육
- 실무
- 포트폴리오
- 장비
- 수익
- 영업
- 아이폰
- 자료

active chapter state/scroll target owner는 `assets/js/navigation/chapter-navigation.js`다.

moving liquid owner는 `assets/js/ui/liquid-controller.js`다.

둘을 같은 새 controller로 중복 구현하지 않는다.

## NAV-002 — nav shell surface

일반 시각 규칙에서 `.nav-shell` 자체는 투명하고 실제 glass material은 내부 rail이 담당한다.

금지:
- 별도 grey/black plate.
- shell backdrop blur animation.
- scroll에 따른 shell scale/transform.

### iOS Safari 최초 접속 예외

Safari 26 browser chrome 대응을 위해 `ios-webkit-chrome`에서 최초에는 shell을 normal flow로 둔다. `assets/js/safari/deferred-sticky-nav.js`가 compact signal을 확인한 뒤 sticky를 arm한다.

이 예외는 `10-theme-and-safari.md`가 authority다.

## NAV-003 — native horizontal scroll

`.nav-scroll`은 browser native x scroller다.

MUST:
- `overflow-x:auto`
- nowrap
- chip flex none
- iOS native scrolling
- scrollbar hidden

MUST NOT:
- touch/pointermove custom momentum.
- vertical scroll ownership 강탈.

PC mouse drag 보강은 `assets/js/desktop/rail-drag.js`가 해당 horizontal content rail에만 적용하며 모바일 touch를 가로채지 않는다.

## NAV-004 — active chapter

active `.nav-chip.is-active`는 실제 chapter와 일치한다.

- 동시에 두 active chip 금지.
- 새로고침 scroll restoration 후 현재 chapter로 재정렬.
- click 직후 observer가 이전 chapter로 되돌리는 race 방지용 short lock/hysteresis 허용.
- user native horizontal pan을 지속적으로 방해하는 `scrollLeft` 강제 write 금지.

## NAV-005 — reading progress

별도 두꺼운 progress plate를 추가하지 않는다.

Canonical source는 실제 page/chapter geometry다.

1. 현재 anchor가 속한 chapter 계산.
2. chapter local progress `p` 계산.
3. 같은 chapter id로 active chip 선택.
4. visible endpoint를 해당 chip의 `offsetLeft + offsetWidth * p`에 매핑.

active chip과 progress는 하나가 다른 하나를 추종하는 것이 아니라 같은 page measurement의 sibling output이다.

`assets/styles/navigation/chapter-progress.css`가 current progress paint/layout을 담당한다.

다음 시점에는 geometry를 재측정할 수 있다.
- fonts ready
- window load
- pageshow/scroll restoration
- orientation change
- ResizeObserver가 감지한 실제 높이 변화

scroll gesture 중 매 frame 전체 section layout을 다시 측정하지 않는다.

---

# Collection / theme / question selectors

## LIQ-008 — Collection primary tabs

`.collection-tabs` labels:
- 전체
- 영상
- 읽을거리
- 질문
- 설정

moving indicator 하나만 사용한다.

## LIQ-009 — Theme choice

Light/Dark/System selector도 같은 liquid family를 사용한다.

state owner는 `assets/js/ui/liquid-controller.js`이며 별도 parallel theme indicator를 만들지 않는다.

## LIQ-010 — Question secondary selector

Question selector는:
- `질문 작성하기`
- `저장한 질문`

두 슬롯을 사용한다.

State/DOM owner: `assets/js/questions/question-workspace.js`

Contextual entry owner: `assets/js/questions/context-handoff.js`

Final visible geometry owner: `assets/styles/questions/workspace-final.css`

규칙:
- outer rail은 search content edge와 맞춤.
- 두 slot 정확히 1/2.
- selected pill 폭/outer gap 좌우 대칭.
- badge가 label 중심을 밀지 않음.
- indicator 하나/skin 하나.
- legacy second selector가 동시에 보이지 않음.

## LIQ-011 — Single-owner 변경 규칙

새 liquid 버그를 고칠 때:

1. 실제 active owner 확인.
2. 후반 CSS override 확인.
3. compatibility repair가 이미 있는지 확인.
4. 새 indicator/controller를 추가하지 않고 current owner를 우선 수정.
5. `15-regression-checklist.md`의 top nav + collection + theme + question을 함께 확인.
