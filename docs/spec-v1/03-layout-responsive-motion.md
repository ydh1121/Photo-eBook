# 03. 레이아웃, 반응형, 스크롤, 모션

## LAY-001 — 모바일 우선

V1은 iPhone Safari를 핵심 기준으로 설계한다. 데스크톱은 모바일 구조를 깨지 않고 폭과 grid를 확장한다.

## LAY-002 — 루트 구조

기본 DOM 순서:

1. `#boot.boot`
2. `#app.app[hidden]`
3. 앱 렌더 후 `#app` 표시, boot 제거
4. postload에서 collection layer 등 동적 UI가 body에 추가될 수 있음

`#app`은 실제 앱 canvas를 소유한다. 일반 browser-facing root 정책과 별개로 iOS WebKit 최초 접속에서는 Safari 주소영역 합성을 안정시키기 위해 `html/body`에도 실제 테마 canvas를 제공한다. 이 Safari 예외는 `10-theme-and-safari.md`가 authority다.

## LAY-003 — content containers

- `.content`: 최대 약 44rem
- `.wide`: 최대 약 70rem
- 수평 gutter는 CSS variable 사용
- `.wide > .content`는 이중 padding이 생기지 않도록 기존 규칙 유지

## LAY-004 — section

- `.section`은 긴 읽기 문서의 vertical breathing room을 제공한다.
- `.section.grouped`/`.grouped`는 alternate surface.
- 마지막 section은 Safari 하단 영역 때문에 임의의 고체 footer plate를 두지 않는다.

## LAY-005 — hero

`.hero`:

- 최소 높이 약 `90dvh`
- background image full bleed
- image 위 dark gradient overlay
- 콘텐츠는 하단 정렬
- hero title은 가장 큰 display type
- 4개 fact card는 모바일 2열, 넓은 화면 4열
- fact card는 glass/dark translucent panel

hero 이미지 밝기가 텍스트 가독성을 해치면 overlay를 조정하지, hero text를 임의의 별도 흰 box에 넣지 않는다.

## LAY-006 — chapter hero

각 chapter는 `.chapter-hero`를 갖고 image + copy card 형태를 사용한다. chapter navigation target과 `data-chapter`가 일치해야 한다.

## LAY-007 — horizontal content rail

대표 selector:

- `.scroll-row`
- `.skills-infinite-row`
- `.curated-links-row`

원칙:

- 모바일에서 다음 카드가 살짝 보여 ‘옆으로 더 있음’을 시각적으로 전달.
- x축은 browser native overflow가 owner.
- 수직 페이지 scroll과 경쟁하는 JS drag/momentum loop를 만들지 않는다.
- final layers는 `scroll-snap-type:none`으로 과도한 snap 경쟁을 제거한다.
- `overscroll-behavior-x: contain/auto`는 rail 목적에 따라 사용.
- sentinel은 빈 카드처럼 큰 surface를 만들지 않는다.

PC의 마우스 drag 보강은 `assets/js/desktop/rail-drag.js`가 담당하며 모바일 touch ownership을 가로채지 않는다.

## LAY-008 — 상단 chapter rail

일반 scroll 상태에서 `.nav-shell`의 높이/scale/y offset을 동적으로 변경하지 않는다. Safari toolbar resize 때문에 nav geometry 자체가 흔들리면 안 된다.

단, iOS WebKit 최초 expanded browser chrome에서는 승인된 예외가 있다.

- 최초: `.nav-shell { position:relative; top:auto; }`
- Safari compact 감지 후: `safari-nav-sticky-armed`
- 이후: 기존 `.nav-shell { position:sticky; top:0; }`

이 lifecycle은 `assets/js/safari/deferred-sticky-nav.js`와 `assets/styles/safari/deferred-sticky-chrome.css`가 소유한다.

`.nav-scroll`:

- `display:flex`
- nowrap
- native `overflow-x:auto`
- scrollbar hidden
- chip `flex:0 0 auto`
- first/last liquid overshoot runway를 위한 좌우 padding 허용

## LAY-009 — native horizontal ownership

MUST:

- 모바일 pointermove/touchmove 기반 커스텀 수평 drag 금지.
- 모바일 momentum simulation 금지.
- scroll frame마다 강제 `scrollLeft` 보정 금지.
- indicator는 hit target이 아니며 `pointer-events:none`.

PC mouse drag는 명시적인 desktop interaction 범위에서만 허용한다.

## LAY-010 — breakpoints

기준 breakpoints:

- `< 360/370px`: 매우 좁은 iPhone용 chip/font padding 보정
- `< 430px`: 주요 mobile override
- `< 720px`: metric grid 1열 등
- `>=720px`: gutter 확대, hero facts 4열, 카드 고정 폭 확대
- `>=1024px`: wide navigation/desktop center 조정

새 breakpoint를 추가하기 전에 기존 360/430/720/1024 체계로 해결 가능한지 먼저 확인한다.

## LAY-011 — safe-area

`env(safe-area-inset-top/bottom/right)`를 실제 floating control 위치에 사용한다.

- FAB는 safe bottom + 시각 여백
- top nav는 safe top 고려
- Safari 주소창 뒤를 가리는 별도 site-owned bottom plate 금지

## LAY-012 — collection sheet

`#collectionSheet`는 mobile bottom sheet다.

- 화면 중앙 modal로 바꾸지 않는다.
- bottom edge에 붙는 sheet geometry 유지.
- drag handle을 아래로 당겨 닫는 gesture 존재.
- desktop에서도 최대폭/최대높이를 유지하며 bottom sheet identity를 잃지 않는다.

## LAY-013 — collection scroll

팝업 내부 `.collection-body`가 y축 scroll owner다.

- `overflow-y:auto`
- `overscroll-behavior:contain`
- `touch-action:pan-y`
- backdrop은 background page gesture를 차단.

root scroll lock 방식은 Safari와 충돌 위험이 있으므로 현재 구현 이상으로 확대하지 않는다.

## LAY-014 — z hierarchy

Liquid selector의 핵심 z 순서:

1. rail/background
2. moving indicator geometry
3. `.v37-liquid-skin` paint
4. button label/content

selected pill은 rail 안쪽에 과도하게 갇혀 보이지 않아야 하며, spring overshoot가 필요한 control은 승인된 runway/overflow 규칙을 사용한다.

## LAY-015 — spring travel

일반 liquid control은 active target change 시:

- endpoint를 button offset/size로 측정
- width/height/transform을 같은 duration/easing으로 이동
- Breeze easing 사용
- 이동거리 기반 duration 허용
- first mount는 instant settle 가능
- 사용자 click 이후 이동은 spring이 보여야 함

## LAY-016 — question secondary selector

현재 `질문 작성하기 / 저장한 질문` selector의 **보이는 최종 geometry는 CSS grid가 owner**다.

Final visual owner: `assets/styles/questions/workspace-final.css`

현재 승인 family:
- rail total height 약 50px
- padding 약 5px
- center gap 약 5px
- indicator height 약 40px
- 두 column 동일 폭
- saved state는 한 track + gap만큼 이동
- Breeze 계열 transition
- rail overflow visible

JS compatibility layer가 inline geometry를 쓰더라도 final CSS geometry와 충돌하지 않아야 한다.

## LAY-017 — reduced motion

`prefers-reduced-motion: reduce`일 때:

- liquid travel 즉시 settle 또는 transition none
- loading spinner animation 제거 가능
- smooth scroll을 auto로 변경
- 기능 상태 변화는 유지

## LAY-018 — visual stability

다음은 회귀다.

- Safari compact 후 sticky 상태에서 vertical scroll 중 nav y축 흔들림
- Safari chrome resize마다 rail 높이/scale 변화
- 최초 iPhone Safari에서 주소영역 뒤 site-owned solid plate 재발
- 카드 이미지 load로 전체 row 높이가 크게 점프
- 질문 write/saved 전환 시 collection body 폭 변화
- bulk select 진입 시 thumb/Q icon이 text와 겹침
- horizontal rail가 vertical page scroll을 가로채는 현상
