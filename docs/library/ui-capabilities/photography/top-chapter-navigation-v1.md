# Photography Parity — Top Chapter Navigation V1

상태: `extracted / not yet production-rebound`

현재 photography production의 최종 cascade를 기준으로 상단 메뉴를 역추출한 기록이다.

## Owners / cascade

로드 순서상 중요한 파일:

1. `assets/styles/navigation/mobile-nav-curated.css`
2. `assets/styles/ui/liquid-flat-canonical.css`
3. `assets/styles/ui/liquid-skin.css`
4. `assets/styles/desktop/nav-rails.css`
5. `assets/styles/desktop/nav-corrections.css`
6. `assets/styles/navigation/chapter-progress.css`
7. `assets/styles/safari/deferred-sticky-chrome.css`

JS owner:
- active chapter/progress geometry: `assets/js/navigation/chapter-navigation.js`
- moving liquid indicator/theme selector: `assets/js/ui/liquid-controller.js`
- iOS Safari sticky arm: `assets/js/safari/deferred-sticky-nav.js`

## Runtime invariants

이 값은 일반 preset보다 우선한다.

- iOS Safari 첫 진입은 nav를 normal flow(`position:relative`)로 시작한다.
- browser chrome compact 신호 뒤 `safari-nav-sticky-armed`에서 sticky로 전환한다.
- non-iOS는 기존 sticky 동작 유지.
- native horizontal x-scroll이 owner다.
- moving selected pill은 rail당 하나만 존재한다.
- `prefers-reduced-motion`에서는 indicator motion을 제거한다.

## Mobile final geometry

Base mobile:
- shell height: `76px + safe-top`
- shell padding: `6px + safe-top / 10px / 6px`
- glass wrapper height: `64px`
- nav rail: full width, pill track
- rail vertical padding: `8px`
- final rail left/right padding: `.34rem` (chapter-progress의 마지막 override)
- chip gap: `6px`
- chip height: `46px`
- chip horizontal padding: `16px`
- chip font: `14px / 680`

`<=430px`:
- shell height: `74px + safe-top`
- shell side padding: `8px`
- wrapper height: `62px`
- chip height: `44px`
- chip horizontal padding: `14px`
- chip font: `13.5px`
- final rail left/right padding은 여전히 `.34rem`

`<=370px`:
- chip horizontal padding: `12px`
- chip font: `13px`

## Desktop final geometry

`>=1024px`에서 `desktop/nav-corrections.css`가 최종 geometry owner다.

- shell display: block / centered
- shell padding: `.56rem + safe-top / .82rem / .6rem`
- wrapper width: `max-content`
- wrapper max-width: `100vw - 1.64rem`
- rail width: `max-content`
- rail max-width: `100vw - 1.64rem`
- rail padding: `.34rem` on all sides
- chip gap: `.54rem`
- chip min-height: `2.72rem`
- chip horizontal padding: `1rem`
- chip font: `15px / 650`
- overflow-x remains native `auto`

## Rail glass material

Final light rail:
- border: transparent 1px with gradient border-box
- background main gradient: `rgba(255,255,255,.43) → rgba(236,241,248,.24)`
- reflective border gradient is asymmetric 125deg
- blur: `22px`
- saturation: `138%`
- outer shadow: `0 7px 22px rgba(35,52,82,.075)`

Desktop dark:
- main surface: `rgba(59,71,91,.54) → rgba(22,27,35,.56)`
- blur: `24px`
- saturation: `132%`
- outer shadow: `0 7px 20px rgba(0,0,0,.14)`

Mobile liquid-skin layer uses the same glass family with light blur `22px / 138%` and dark blur `24px / 126%` before desktop correction.

## Selected liquid indicator

Controller:
- regular easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- first-edge easing: `cubic-bezier(0.34, 1.24, 0.64, 1)`
- nav durationScale: `1.10`
- raw base duration: `245 + distance*0.10`, clamped `255–380ms`
- resulting nav duration: about `281–418ms`

Selected skin:
- blue A: `rgba(102,157,248,.94)`
- blue B: `rgba(67,124,231,.92)`
- blue C: `rgba(44,91,202,.94)`
- shadow: `rgba(35,82,176,.22)`
- conic reflective 1px edge
- top highlight overlay

이 값은 UI Dashboard의 `response/overshoot` 쉬운 설정 뒤의 advanced production token으로 보존한다.

## Reading progress

Visible owner:
- `.nav-chapter-progress` child inside native `.nav-scroll`

Light fill:
- `rgba(64,129,239,.24) → rgba(64,129,239,.16)`

Dark fill:
- `rgba(73,145,255,.38) → rgba(73,145,255,.24)`

Geometry:
- progress top/bottom fills rail height
- rounded 999px
- cap inset `.34rem`
- left coordinate begins at first chip offset
- last chapter completes through final chip + right rail inset

Progress is NOT simple document percentage.
`chapter-navigation.js` maps progress to measured chapter and chip geometry.

Important values:
- nav anchor: `y + navHeight + 20px`
- down enter hysteresis: `18px`
- up leave hysteresis: `18px`
- chip completion includes vertical breathing gap
- scroll-end aligns active chip to front after momentum settles

## Capability classification

`top-chapter-navigation` capability should expose beginner controls:
- enabled
- stickyMode (Safari safety cannot be disabled by this)
- chipFamily
- accent family
- progress enabled
- progress appearance
- spacing density
- response/overshoot

Advanced mode may expose:
- rail blur/saturation
- chip height/padding/gap
- selected pill duration scale
- progress cap inset

Do not expose raw selectors or arbitrary CSS.

## Current dashboard gap

현재 `public/data/ui-capabilities/v1/manifest.js`의 `photo-topnav-blue-progress`는 방향만 맞춘 간단 preset이다.

이 문서의 실제 production 값을 기준으로 다음 단계에서:
1. easy controls
2. advanced controls
3. exact photography preset
으로 나눠 보정해야 한다.

production 자체에는 아직 역방향 적용하지 않는다.
