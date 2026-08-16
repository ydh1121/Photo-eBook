# 02. 디자인 토큰

## TOK-COLOR-001 — 기본 라이트 색상

`style-1.css`의 base token을 출발점으로 한다.

| token | V1 값 | 용도 |
|---|---:|---|
| `--accent` | `#2f63d6` | 링크, 강조, active 계열 |
| `--accent-pressed` | `#2858c1` | pressed state |
| `--accent-soft` | `#eaf1ff` | 약한 accent surface |
| `--ink` | `#1d1d1f` | 가장 강한 본문/제목 |
| `--text` | `#343437` | 일반 텍스트 |
| `--secondary` | `#68686d` | 설명/보조 텍스트 |
| `--tertiary` | `#8e8e93` | 상태/메타 텍스트 |
| `--canvas` | `#fff` | 라이트 메인 캔버스 |
| `--grouped` | `#f5f5f7` | 그룹/soft badge/surface |
| `--grouped-2` | `#ececf1` | 더 진한 grouped surface |
| `--border` | `rgba(0,0,0,.075)` | 기본 라이트 경계 |

## TOK-COLOR-002 — 다크 surface family

최종 다크 surface는 v36/v37 계열을 따른다.

- canvas: `#0d0f13`
- surface: `#171b21`
- surface 2 / raised: `#1b2028`
- surface 3 / soft: `#20252d`
- dark line: `rgba(255,255,255,.085)` 전후
- primary text: `#f2f4f8` ~ `#f3f5f8`
- muted: `#aeb6c2` ~ `#aeb7c3`

다크 카드에 갈색/붉은 회색 tint를 새로 도입하지 않는다. graphite/blue-neutral family를 유지한다.

## TOK-COLOR-003 — Liquid blue

Moving liquid skin은 단색 버튼이 아니라 위→아래 gradient다. 현재 계열:

- top 약 `rgba(95~102,151~157,244~248,.88~.94)`
- middle 약 `rgba(60~67,118~124,226~231,.9)`
- bottom 약 `rgba(43~49,92~102,200~216,.93~.94)`

V1의 핵심은 정확한 hex 하나가 아니라 다음 계층이다.

1. 밝은 상단 reflection
2. 중간 blue body
3. 조금 더 진한 하단
4. 얇은 inner highlight
5. blue shadow + low dark inset

평면 `background:#2f63d6`만으로 active pill을 대체하지 않는다.

## TOK-TYPE-001 — 글꼴

기본 font stack은 iOS/Safari 우선 system sans다.

- `-apple-system`
- `BlinkMacSystemFont`
- system UI 계열 fallback

별도 웹폰트를 V1 의존성으로 추가하지 않는다.

## TOK-TYPE-002 — 기본 본문

- body: 약 `17px`
- line-height: 약 `1.68`
- Korean word breaking: `word-break: keep-all`
- 좁은 화면에서 자연스러운 행갈이 허용

## TOK-TYPE-003 — display hierarchy

`style-1.css` 기준 scale:

- hero display: `clamp(50px, ..., 78px)` 계열
- chapter title: `clamp(34px, ..., 58px)` 계열
- section h2: `clamp(29px, ..., 42px)` 계열
- component h3: 기본 약 `20px`, 카드별 15~19px로 조정
- small: 약 `14px`
- micro/meta: 약 `12px`

모바일에서 제목을 임의로 축소해 카드 밀도를 과도하게 높이지 않는다.

## TOK-WEIGHT-001 — weight hierarchy

- 핵심 제목/수치: 700~780 범위
- 카드 제목: 650~720
- 본문: normal~medium
- 작은 badge는 기본 디자인과 동일한 경우 400~690, 강조 badge만 720+

같은 의미의 badge를 모듈마다 임의로 굵게 만들지 않는다.

## TOK-RADIUS-001 — radius

base:

- small: `12px`
- medium: `18px`
- large card: `26px`
- pill: `999px`

Liquid rail/selected chip은 pill radius를 유지한다. 일반 정보 tag는 현재 `7px` rounded rectangle 계열을 사용한다.

## TOK-SHADOW-001 — 카드 그림자

기본 카드:

- normal: `0 10px 30px rgba(20,30,55,.08)` 계열
- soft: `0 7px 18px rgba(20,30,55,.055)` 계열

라이트모드에서는 border와 low shadow를 함께 써서 흰 canvas에서 면을 구분한다. 다크모드에서는 큰 광택 그림자보다 surface/line 대비를 우선한다.

## TOK-SHADOW-002 — liquid shadow

selected liquid surface는 일반 카드보다 짧고 선명한 blue shadow를 사용한다.

- primary drop: 대략 y 5~8px / blur 13~20px
- secondary low blue shadow 가능
- top inset white highlight
- bottom inset dark blue

Z hierarchy 때문에 rail보다 위에 떠 있는 것처럼 보여야 한다.

## TOK-SPACE-001 — 전역 폭

- content max: 약 `44rem`
- wide max: 약 `70rem`
- default horizontal gutter: 약 `1.35rem`
- >=720px: gutter 약 `1.6rem`

`wide > content` 중첩 시 gutter를 이중 적용하지 않는다.

## TOK-SPACE-002 — section rhythm

기본 section vertical rhythm은 대략:

- top `5.2rem`
- bottom `6rem`

개별 chapter/module에서 목적 없는 대형 빈 공간을 추가하지 않는다. horizontal rail 아래의 status/sentinel도 빈 카드처럼 공간을 차지하면 안 된다.

## TOK-MOTION-001 — Breeze easing

승인된 selected pill 이동 easing:

`cubic-bezier(0.34, 1.56, 0.64, 1)`

이 값은 overshoot가 있는 spring-like travel의 핵심 토큰이다.

## TOK-MOTION-002 — edge easing

상단 rail 첫/끝 경계 등 overshoot clipping 위험이 큰 특수 case에는 더 억제된 edge easing 계열을 사용할 수 있다.

현재 canonical controller가 사용하는 edge 계열:

`cubic-bezier(0.34, 1.24, 0.64, 1)`

## TOK-MOTION-003 — reduced motion

`prefers-reduced-motion: reduce`에서는 spring/transition을 제거하거나 즉시 settle한다. reduced motion 사용자를 위해 별도 opacity flicker나 WAAPI bounce를 남기지 않는다.

## TOK-GLASS-001 — rail material

라이트 rail:

- 반투명 white/blue-grey gradient
- 투명 border gradient/reflection
- blur 약 15~24px 계열
- subtle inset top line
- 낮은 outer shadow

다크 rail:

- translucent graphite/blue-grey
- hard white outline 금지
- 낮은 white edge reflection
- dark shadow

## TOK-BADGE-001 — 일반 content badge

`soft-tag`, 장비 row meta, curated content tag는 같은 언어를 우선 재사용한다.

라이트:
- background `var(--grouped)`
- text `#55555a`
- radius `7px`
- font `12px`
- padding `.34rem .5rem`

다크:
- background `--v36-dark-surface-3` 계열
- text `#bcc4cf`
- 매우 얇은 light border 허용

## TOK-BADGE-002 — 이미지 위 source badge

`.curated-platform`처럼 이미지 위에 직접 놓이는 badge는 일반 content badge와 다르다.

- dark translucent surface
- white text
- image 대비를 위한 blur/outline/shadow

이 차이는 기능적 배경 차이 때문에 허용되는 예외다.

## TOK-COPY-001 — UI 문체

- 한국어 사용자에게 자연스러운 표현
- 과도한 AI식 설명/확언 금지
- 메뉴/버튼은 짧고 동작이 명확해야 함
- middle dot(`·`)를 decorative bullet로 사용하지 않음
- 이미 학습된 interaction은 불필요한 안내 문구로 과설명하지 않음
