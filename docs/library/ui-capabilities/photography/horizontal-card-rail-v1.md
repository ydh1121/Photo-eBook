# Photography Parity — Horizontal Card Rail V1

상태: `extracted / not yet production-rebound`

현재 photography production의 가로 카드 rail을 모바일과 PC로 분리해 역추출한다.

## Runtime owner

Base stability:
- `assets/styles/collection/horizontal-rails.css`

Desktop structure/paint:
- `assets/styles/desktop/nav-rails.css`
- `assets/styles/desktop/rail-fade.css`

Desktop interaction:
- `assets/js/desktop/rail-drag.js`

## Mobile contract

모바일은 브라우저 native horizontal scroll이 owner다.

공통 rail 안정화:
- `scroll-snap-type:none`
- `scroll-behavior:auto`
- `overscroll-behavior-x:contain`
- `touch-action:pan-x pan-y`
- `overflow-anchor:none`

금지:
- custom inertia
- JS momentum
- wheel hijack
- desktop drag logic의 mobile 적용

이 원칙은 capability preset으로 끌 수 있는 장식이 아니라 platform interaction invariant다.

## Desktop wrapper

`rail-drag.js`가 `>=1024px`에서 대상 rail을 `.desktop-rail-window`로 감싼다.

대상:
- `.scroll-row`
- `.skills-infinite-row`
- `.curated-links-row`
- `#skillsInfiniteRow`
- `#curatedLinksRow`

Desktop wrapper는 mobile에서 제거된다.

## Desktop left edge

기존 `nav-rails.css`의 핵심 의도:
- body copy 시작선보다 왼쪽에 `16px` paint runway 확보
- 첫 카드 그림자가 clipping되지 않게 함
- 초기 scrollLeft 0에서는 runway가 투명 영역
- row가 움직인 뒤에는 왼쪽 clipping edge가 명확해져야 함

초기 token:
- `--desktop-shadow-runway:16px`

후속 `nav-corrections.css`에서 `.desktop-rail-window::before` 자체는 제거됐지만, rail 내부 left padding과 wrapper geometry를 통해 shadow runway 개념은 유지된다.

따라서 capability는 단순 `left fade on/off`가 아니라 아래를 구분해야 한다.

- `leftRunway`: px/token
- `leftFade`: on/off
- `leftScrolledClip`: on/off
- `shadowGuard`: on/off

## Desktop right edge

최종 owner는 `desktop/rail-fade.css`.

최종 fade:
- `--desktop-rail-fade:112px`
- rail 자체에 단일 `mask-image`
- `#000 0%`
- `#000 calc(100% - 112px)`
- `transparent 100%`

중요:
- 기존 backdrop-filter overlay는 compositor seam 때문에 제거됨.
- fade는 별도 overlay 2개가 아니라 **rail 자체의 한 개 continuous alpha mask**.
- Chrome/Chromium의 세로 seam 회귀를 피하기 위한 production decision.

따라서 Dashboard에서 `fade strength`를 단순 blur opacity로 표현하면 production과 다르다.

권장 capability controls:
- rightFade enabled
- rightFadeWidth token
- rightFadeMode: `alpha-mask`
- backdropBlurOverlay: locked false for photography preset

## Desktop rail padding / continuation

`nav-rails.css` 기준:
- shadow runway: `16px`
- 이전 blur zone: `88px`
- row top padding: `18px`
- bottom padding: `30px`
- right padding: `88 + 34 = 122px`
- left padding: `16px`
- scroll-padding-left: `16px`
- scroll-padding-right: `122px`

최종 right visible fade는 `112px` alpha mask.

이 값들을 하나의 generic `runwayRight` 숫자로 뭉치지 않는다.

의미를 분리한다:
- content right padding
- visible fade width
- shadow paint runway

## Desktop mouse drag

`rail-drag.js`:
- only `min-width:1024px`
- only pointerType `mouse`
- left mouse button only
- input/textarea/select/contenteditable에서는 drag 시작 금지
- drag threshold: `5px`
- dragging 중 pointer capture
- scroll position = startScroll - dx
- drag 완료 뒤 click suppression: `220ms`
- link/image native drag disabled
- text selection disabled while rail interaction owner
- cursor: grab/grabbing

이 동작은 사용자가 이전에 지적한 “링크가 선택되거나 같이 끌려 drag가 안 되는 문제”를 막는 production 계약이다.

Dashboard easy controls:
- desktop mouse drag on/off
- click suppression on/off

Advanced locked defaults:
- threshold 5px
- suppression 220ms

## Scrollbar

Desktop:
- hidden
- WebKit scrollbar display none

Mobile base rails도 현재 대부분 custom scrollbar를 노출하지 않는다.

Dashboard에서는 `hidden | auto` 정도만 노출하고 production photography preset은 `hidden`.

## Capability model correction

현재 `horizontal-card-rail` manifest의 `fadeEdges: both` 같은 단일 값은 photography 실제 구현을 충분히 표현하지 못한다.

Photography preset은 다음 의미로 보정해야 한다.

```text
mobile owner: native
PC drag: enabled
left shadow runway: 16px
left fade: 없음 또는 별도 사용자 선택
right fade: alpha-mask 112px
right content padding: 122px
scrollbar: hidden
shadow guard: enabled
drag threshold: 5px
post-drag click suppression: 220ms
```

## Dashboard next revision

`horizontal-card-rail` control을 다음 그룹으로 나눈다.

### Input
- mobile native touch: locked true
- desktop mouse drag

### Left edge
- shadow guard
- paint runway
- fade enabled

### Right edge
- fade enabled
- fade width
- content end runway

### Visibility
- scrollbar

### Advanced
- drag threshold
- click suppression

현재 production에는 역방향 적용하지 않는다.
