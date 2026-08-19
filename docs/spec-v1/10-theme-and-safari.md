# 10. 테마와 iOS Safari 명세

## THEME-001 — 지원 모드

V1은 `light`, `dark`, `system` 세 choice를 지원한다.

저장 key: `photoRoadmapThemeV1`

## THEME-002 — first-paint bootstrap

`public/index.html`의 inline script는 CSS 이전에 다음을 적용한다.

- 저장 choice 읽기.
- `system`이면 `prefers-color-scheme` 확인.
- `<html data-theme-choice>` 설정.
- `<html data-theme>`를 실제 `light|dark`로 설정.
- `style.colorScheme` 동기화.
- iOS + WebKit이면 `ios-webkit-chrome` class 추가.

이 bootstrap을 defer하면 theme flash와 Safari first-paint surface 회귀가 생길 수 있다.

## THEME-003 — runtime theme owner

`assets/js/ui/liquid-controller.js`가 runtime theme state와 theme choice UI를 담당한다.

테마 변경 시:
- dataset 갱신.
- colorScheme 갱신.
- localStorage 저장.
- `photo-theme-change` custom event dispatch.
- liquid indicator/theme UI 정렬.

choice가 `system`일 때 OS preference 변경을 반영하되 choice 자체를 `light`/`dark`로 덮어쓰지 않는다.

## THEME-004 — surfaces

Light:
- app canvas: white.
- grouped: `#f5f5f7` family.
- card: white/light blue-grey.

Dark:
- app canvas: `#0d0f13` graphite-black.
- 일반 page canvas에 pure black `#000`을 사용하지 않는다.
- cards: `#171b21`, raised `#1b2028`, soft `#20252d` family.

제품 컷아웃 등 콘텐츠 특성상 흰 이미지 stage가 필요한 영역은 dark mode에서도 밝게 유지할 수 있다.

## THEME-005 — theme-color policy

`assets/js/safari/theme-color-cleanup.js`는 runtime에서 `meta[name="theme-color"]`를 제거한다.

이유:
- Safari browser chrome이 stale theme-color로 고정되는 회귀를 피함.
- 실제 browser-facing surface는 document/app surface와 Safari-specific root rule로 제어함.

새 `theme-color`를 추가하려면 iPhone Safari expanded/compact 상태를 함께 실기기 검증한다.

---

# iOS Safari

## SAFARI-001 — detection

`index.html` bootstrap에서 iPhone/iPad/iPod 또는 touch MacIntel + WebKit이면 `<html>`에 `ios-webkit-chrome`을 추가한다.

Safari 전용 geometry/surface 수정은 이 class에 scope한다.

## SAFARI-002 — 2026-08-19 실기기에서 확인된 원인

iPhone Safari 최초 접속 시 주소 영역 뒤에 고체 배경이 나타나는 현상을 격리 페이지로 비교했다.

확인 결과:

- 앱 코드가 없는 최소 페이지: 문제 없음.
- 하단 collection/FAB/question UI 제거: 문제 유지.
- root background만 정상화하고 sticky nav 유지: 문제 유지.
- sticky nav만 늦추고 root를 transparent로 유지: 문제 유지.
- nav를 제거하거나, real root background + non-sticky initial nav 조합: 문제 없음.
- `sticky; top:5px`처럼 viewport edge에서 몇 px 띄우는 방식: 문제 유지.
- real root background + initial normal-flow nav + Safari chrome compact 후 sticky 전환: 문제 없음.

따라서 현재 승인 원인은 단일 popup이 아니라 **transparent browser-facing root와 최초 sticky top navigation의 결합 조건**이다.

## SAFARI-003 — 승인된 browser-facing root

`assets/styles/safari/deferred-sticky-chrome.css`에서 iOS WebKit에 한해:

Light:
- `html`, `body`: `#fff`

Dark:
- `html`, `body`: `#0d0f13`

을 실제 배경으로 사용한다.

이 규칙은 iOS Safari의 browser chrome composition을 안정시키기 위한 예외다. 다른 브라우저의 기존 root/app surface 정책을 전역으로 바꾸지 않는다.

## SAFARI-004 — 최초 nav state

`ios-webkit-chrome`이면서 아직 `safari-nav-sticky-armed`가 없으면 `.nav-shell`은:

- `position: relative`
- `top: auto`

로 시작한다.

즉 Safari가 expanded address chrome으로 최초 paint하는 동안 top-edge sticky surface를 만들지 않는다.

## SAFARI-005 — compact detection / sticky arm

`assets/js/safari/deferred-sticky-nav.js`가 최초 visual viewport height를 baseline으로 저장한다.

다음 중 하나면 sticky를 arm한다.

- `visualViewport.height - baseline > 24px`
- fallback으로 `scrollY > 140`

arm 시 `<html>`에 `safari-nav-sticky-armed`를 한 번 추가한다.

## SAFARI-006 — armed nav state

`assets/styles/safari/deferred-sticky-chrome.css`에서 `safari-nav-sticky-armed` 이후 `.nav-shell`은 기존 승인 동작으로 복귀한다.

- `position: -webkit-sticky / sticky`
- `top: 0`

따라서 최초 접속의 browser chrome 문제를 피하면서 실제 스크롤 중 상단 챕터 메뉴 고정 기능은 유지한다.

## SAFARI-007 — 금지된 이전 workaround

과거 `script-safari-compact-prime.js`는 compact 상태에서 Safari 재합성을 유도하려고 다음 동작을 사용자에게 보이지 않게 replay했다.

- collection 열기
- 영상 탭 전환
- collection 닫기
- scroll 위치 복원

2026-08-19 원인 분리 후 이 방식은 제거했다.

현재 `deferred-sticky-nav.js`는 popup lifecycle을 호출하지 않는다. Safari 문제를 고치기 위해 숨은 modal/tab interaction을 다시 도입하지 않는다.

## SAFARI-008 — collection/popup 관계

하단 popup/FAB를 완전히 제외한 진단에서도 문제가 남았으므로 **최초 주소영역 배경 문제의 직접 원인은 collection popup이 아니다.**

다만 modal open 상태에서 browser chrome tint/composition이 별도로 바뀔 가능성은 있으므로 collection geometry 수정은 독립적으로 회귀 검증한다.

## SAFARI-009 — 회귀 기준

물리 iPhone Safari에서 다음을 확인한다.

1. 새 탭/최초 접속, 스크롤 전 주소 영역 뒤에 사이트 고체 색상판이 보이지 않는다.
2. 초기 nav가 페이지 흐름 안에 자연스럽게 표시된다.
3. 스크롤 후 Safari chrome이 compact되면 nav가 상단 sticky로 정상 전환된다.
4. 전환 후 페이지가 점프하지 않는다.
5. collection/FAB/question 기능이 그대로 동작한다.
6. 다크 모드 root가 pure black으로 바뀌지 않는다.

## SAFARI-010 — 변경 규칙

- 이 문제를 다시 고치기 위해 `html/body`를 무조건 transparent로 되돌리지 않는다.
- 최초부터 sticky를 강제하지 않는다.
- 4~5px edge offset 같은 추정 workaround를 production fix로 사용하지 않는다.
- hidden popup replay를 다시 추가하지 않는다.
- Safari-only 변경은 `ios-webkit-chrome` 범위에 둔다.
