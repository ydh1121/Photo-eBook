# 06. Liquid Glass 네비게이션/필터 계약

이 영역은 과거 가장 많은 회귀가 발생한 부분이다. 새 작업은 **한 rail = 한 moving indicator = 한 geometry/motion owner** 원칙을 지켜야 한다.

## LIQ-001 — 공통 구조

Liquid selector는 다음 3층으로 구성한다.

1. rail/container
2. moving geometry indicator
3. indicator 내부 `.v37-liquid-skin`
4. 실제 clickable label/button은 indicator보다 위 z-layer

button 자체가 selected blue background를 소유하는 것은 **JS 초기 mount 전 fallback**일 뿐이다.

## LIQ-002 — canonical active fallback

indicator가 아직 mount되지 않았거나 ready class가 없을 때만 active button이 glass-like blue fallback을 표시한다.

`style-35.css`가 첫 paint의 flat blue flash를 막는다.

ready 이후에는:
- button background transparent
- moving skin만 blue/glass paint
- label은 white

## LIQ-003 — canonical top/collection/theme owner

`script-liquid-core.js`가 아래 세 control의 canonical moving indicator owner다.

| rail | item | indicator |
|---|---|---|
| `.nav-scroll` | `.nav-chip` | `.nav-v33-indicator` |
| `.collection-tabs` | `.collection-tab` | `.collection-v33-indicator` |
| `.theme-choice` | `button` | `.theme-v34-indicator` |

이 script는 `window.__photoV49CoreInstalled=true`를 선점하여 retired `script-27.js`가 두 번째 owner로 붙지 못하게 한다.

## LIQ-004 — indicator mount

canonical controller는 rail당 indicator가 하나만 존재하도록 한다.

- 없으면 생성
- 중복이면 제거
- indicator 내부 skin 없으면 생성
- active item geometry로 initial settle
- ready classes 설정

중복 indicator를 opacity 0으로 숨겨 ‘보이지만 않게’ 유지하지 않는다. DOM에서 제거한다.

## LIQ-005 — geometry

일반 rail target geometry는 active button의:

- `offsetLeft`
- `offsetTop`
- `offsetWidth`
- `offsetHeight`

를 기준으로 한다.

rail width에서 비율을 재계산해 endpoint를 추정하지 않는다. 실제 button slot을 source of truth로 사용한다.

## LIQ-006 — motion

selected indicator 이동은 transform, width, height가 같은 spring transition으로 움직인다.

기본 easing:
`cubic-bezier(0.34, 1.56, 0.64, 1)`

거리 기반 duration은 허용한다. 짧은 이동은 빠르고, 긴 이동은 조금 길어지되 과도하게 느리지 않아야 한다.

## LIQ-007 — overshoot

Breeze easing의 핵심은 target을 살짝 지나갔다 돌아오는 관성 느낌이다.

MUST:
- selected pill z값이 rail보다 위.
- non-scroll segmented rail은 `overflow:visible`을 허용.
- spring overshoot가 rail에서 잘려 ‘갇힌’ 느낌이 나면 안 됨.

## LIQ-008 — top rail clipping exception

`.nav-scroll`은 실제 horizontal overflow scroller이므로 scrollport가 paint를 clip할 수 있다. 이 경우 overflow를 억지로 visible로 바꾸지 않고 좌우 runway padding을 제공한다.

현재 후반 CSS는 first/last pill overshoot를 위해 좌우 padding을 별도 조정한다.

## NAV-001 — 상단 chapter rail identity

상단 chapter rail은 다음 상태에서도 geometry가 동일해야 한다.

- 첫 접속
- 스크롤 중
- Safari 주소창 expanded/compact
- light/dark
- chapter 변경

scroll에 따라 nav-shell height/scale/y offset을 바꾸지 않는다.

## NAV-002 — 상단 shell

`.nav-shell` 자체는 최종적으로 transparent다. glass material은 내부 rail이 담당한다.

MUST NOT:
- shell에 별도 grey plate
- shell backdrop blur로 Safari jitter 유발
- shell transform animation

## NAV-003 — native x scroll

`.nav-scroll`은 실제 browser native x scroller다.

MUST:
- `overflow-x:auto`
- nowrap
- chip flex none
- iOS native scrolling
- scrollbar hidden

MUST NOT:
- pointermove 기반 custom drag
- JavaScript momentum physics
- touchmove로 horizontal ownership 강탈

## NAV-004 — active chapter

active `.nav-chip.is-active`는 현재 chapter와 일치해야 한다.

vertical scroll과 chip click이 둘 다 active state를 변경할 수 있다. click 직후 observer/scroll scan이 즉시 이전 section으로 되돌리는 race를 막는 short lock/hysteresis는 허용한다.

MUST:
- 최초 HTML에서 첫 chip에 임시 `.is-active`가 있더라도 runtime 측정 후 실제 chapter 하나만 active로 정규화한다.
- 새로고침 후 브라우저가 이전 scroll 위치를 복원하면 해당 chapter chip도 다시 맞춘다.
- 동시에 두 개 이상의 `.nav-chip.is-active`가 남지 않는다.

## NAV-005 — active chip visibility

active chip은 현재 chapter를 따라가되 native x-scroll ownership을 깨지 않는다.

- chapter 변경 시 active chip이 horizontal viewport 밖에 있으면 scroll 종료 후 보이도록 보정할 수 있다.
- 새로고침/pageshow/layout 재측정 시 현재 chapter chip을 즉시 맞춘다.
- vertical scroll 매 frame마다 `scrollLeft`를 재계산하지 않는다.
- user native horizontal pan을 방해하지 않는다.

## NAV-006 — chapter-coupled reading progress

상단 rail에는 별도 독립 progress bar/plate를 추가하지 않는다. 진행 상태는 기존 rail surface 안의 blue wash로 표현한다.

V1 확정 방식은 **전체 문서 절대 scroll 비율이 아니라 현재 chapter + 해당 chip 길이를 결합한 진행률**이다.

### NAV-006-A — 하나의 page state에서 두 출력 생성

active chip과 progress가 서로를 추종하는 구조로 만들지 않는다.

canonical source는 실제 page geometry다.

1. 현재 viewport의 chapter anchor 위치를 계산한다.
2. anchor가 속한 chapter를 선택한다.
3. 그 chapter 안에서의 local progress `p`를 구한다.
4. 같은 chapter id로 active chip을 선택한다.
5. visible progress endpoint는 해당 chip의 실제 `offsetLeft + offsetWidth * p`로 계산한다.

즉 **active chip과 progress는 같은 측정값의 sibling output**이다. 숨겨진 별도 progress bar를 두고 서로 연쇄 추종시키지 않는다.

### NAV-006-B — chapter local progress 공식

chapter `i`에 대해:

- `start_i` = 현재 렌더된 chapter i의 document Y 시작점
- `end_i` = 다음 chapter의 시작점
- 마지막 chapter는 실제 scroll 가능한 문서 끝을 사용
- `anchorY` = 현재 scrollY + nav height + scan offset

`p = clamp((anchorY - start_i) / (end_i - start_i), 0, 1)`

따라서 chapter가 길면 같은 chip 폭을 천천히 채우고, chapter가 짧으면 빠르게 채운다. 디바이스/모니터/줄바꿈/이미지 높이에 따라 실제 chapter 높이가 달라져도 재측정된 DOM geometry를 사용한다.

### NAV-006-C — chip mapped endpoint

visible progress width는:

`chip.offsetLeft + chip.offsetWidth * p`

를 기준으로 한다.

MUST:
- chapter 시작 시 progress endpoint가 해당 chip의 시작점에 들어온다.
- chapter 중간에서는 해당 chip 내부를 가변적으로 통과한다.
- chapter 끝에서는 해당 chip 끝까지 도달한다.
- 다음 chapter로 넘어갈 때 active indicator와 progress endpoint가 같은 chapter로 전환된다.

chip label 글자 수가 달라 폭이 서로 달라도 실제 `offsetWidth`를 사용하므로 별도 가중치 표를 만들지 않는다.

### NAV-006-D — native x-scroll 동기화

progress wash는 `.nav-scroll` 내부의 `.nav-chapter-progress` child layer로 존재한다. 이 layer가 chip과 같은 scroll content coordinate를 사용하므로 모바일에서 rail을 가로로 이동해도 progress endpoint와 chip의 상대 위치가 깨지지 않는다.

기존 `--v32-progress` 기반 전체-page absolute wash는 canonical visual owner가 아니며 최종 CSS에서 0으로 neutralize한다.

### NAV-006-E — layout remeasure

다음 시점에는 chapter/chip geometry를 다시 측정한다.

- fonts ready
- window load
- pageshow / scroll restoration
- orientation change
- 실제 app 높이 변화(ResizeObserver)

scroll gesture 중 매 frame section layout 전체를 다시 측정하지 않는다. 측정값은 cache하고 scroll 중에는 숫자 계산만 수행한다.

## LIQ-009 — Collection primary tabs

`.collection-tabs`는 5개 동일 family button을 가진다.

- 전체
- 영상
- 읽을거리
- 질문
- 설정

selected state는 moving glass.

## LIQ-010 — Theme selector

`.theme-choice`는 light/dark/system을 같은 liquid family로 표시한다.

테마 선택 자체를 iOS native segmented control이나 plain radio로 임의 변경하지 않는다.

## LIQ-011 — Question secondary selector

현재 canonical selector:
- `#v40QuestionControls`
- `.v40-question-segment`

label:
- `질문 작성하기`
- `저장한 질문` + count badge

## LIQ-012 — Question rail geometry

V1 확정 geometry:

- 전체 rail height: `50px`
- grid row: `40px`
- rail padding: `5px`
- center gap: `5px`
- columns: 동일한 `1fr 1fr`
- indicator: 첫 grid cell을 차지
- saved state: `translate3d(calc(100% + 5px),0,0)`

이 구조는 좌/우 outer gutter를 정확히 mirror하기 위해 확정됐다.

## LIQ-013 — Question indicator owner exception

기준 코드에는 `script-25.js`가 v40 indicator inline width/transform을 쓰는 legacy motion 코드가 남아 있다. 그러나 `style-34.css`가 visible geometry를 `!important`로 고정하여 최종 화면 endpoint를 소유한다.

따라서 새 작업에서:
- v40 geometry JS를 또 추가하지 않는다.
- CSS grid geometry를 유지한다.
- JS animation cancellation이 visible CSS transition을 방해하지 않도록 주의한다.

이 중복은 `14-legacy-and-tech-debt.md`의 정리 후보다.

## LIQ-014 — Question count badge

`저장한 질문` 내부 count badge:

- label 옆 inline
- active일 때 translucent white 계열
- inactive light/dark 각각 muted surface
- badge가 button center 정렬을 깨지 않음

## LIQ-015 — first paint resilience

상단 필터가 첫 접속 시 flat으로 보였다가 몇 번 새로고침 후 glass가 되는 현상은 회귀다.

canonical controller가 가능한 이른 시점에 indicator/skin을 확보하고, CSS fallback은 controller 준비 전에도 glass family를 보여야 한다.

## LIQ-016 — self-heal 범위

self-heal은 다음에만 개입한다.

- indicator 실제 소실
- skin 실제 소실
- root DOM 자체 교체

active class가 정상적으로 바뀌는 매번 instant geometry를 다시 써서 spring transition을 덮으면 안 된다.

## LIQ-017 — one owner invariant

아래 파일 세대를 동시에 controller로 활성화하면 안 된다.

- script15/16/18/20/21/22/23/27 등 retired liquid controllers
- current `script-liquid-core.js`

현재 direct runtime에서 `script-liquid-core.js`가 top/collection/theme moving-indicator owner다. top chapter state와 chapter-coupled progress 계산은 `script-9.js`가 소유한다.

## LIQ-018 — question owner invariant

v40 current question:

- structure/label/context: `script-24.js`, `script-29.js`
- final visible geometry: `style-34.css`
- liquid skin material: shared `.v37-liquid-skin` rules

legacy `.v32-question-segment` class는 visual material inheritance를 위해 current root에 남아 있을 수 있다. class 이름만 보고 legacy DOM으로 제거하면 안 된다.

## LIQ-019 — z-order regression

다음은 회귀다.

- selected chip가 rail 뒤에 들어감
- active text가 liquid skin 아래에 가려짐
- first/last overshoot가 잘림
- indicator가 두 개 겹침
- active button 자체에도 blue fill이 남아 ghost double-pill 발생
- 현재 chapter와 active chip이 다름
- progress endpoint가 active chapter가 아닌 다른 chip 구간에 위치함

## LIQ-020 — design consistency

같은 liquid family라면 상단 nav, collection tabs, theme selector, question secondary selector의 blue material/edge/shadow 언어를 유지한다. geometry는 목적에 따라 다를 수 있지만 별도의 flat/3D/plastic visual language를 만들지 않는다.
