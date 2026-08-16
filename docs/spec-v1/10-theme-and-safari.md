# 10. 테마와 iOS Safari 명세

## THEME-001 — 지원 모드

V1은 다음 3개 user choice를 지원한다.

- `light`
- `dark`
- `system`

저장 key:
`photoRoadmapThemeV1`

## THEME-002 — first-paint bootstrap

`index.html`의 inline script는 CSS 이전에 theme choice를 적용한다.

MUST:
- 저장 choice 읽기.
- `system`이면 `prefers-color-scheme` 확인.
- `<html data-theme-choice>` 설정.
- `<html data-theme>`를 실제 `light|dark`로 설정.
- `style.colorScheme` 동기화.

이 로직을 defer하면 첫 paint theme flash가 생길 수 있다.

## THEME-003 — 기본값

저장값이 없거나 invalid면 `light`가 기본 choice다.

## THEME-004 — runtime theme controller

`script-liquid-core.js`가 current theme selection UI와 runtime apply를 담당한다.

테마 변경 시:
- dataset 갱신.
- colorScheme 갱신.
- localStorage 저장.
- `photo-theme-change` custom event dispatch.
- liquid indicator/theme UI 정렬.

## THEME-005 — system live update

choice가 `system`일 때 OS preference 변경을 반영해야 한다. choice 자체를 light/dark로 덮어쓰면 안 된다.

## THEME-006 — light surface

- app canvas: white.
- grouped: #f5f5f7 family.
- card: white 또는 very light blue-grey.
- text: ink/dark grey.
- border/shadow를 low contrast로 유지하되 카드 면이 사라지지 않아야 함.

## THEME-007 — light callout correction

`guide-key`는 과거 dark typography를 밝은 background 위에 남겨 text가 사라지는 회귀가 있었다.

현재 `style-36.css`가 light에서:
- dark text
- subtle blue-grey background
- thin border
- low shadow

를 확정한다.

## THEME-008 — light common badge

`.soft-tag`, 장비 meta, curated content tag는 매우 밝은 grouped badge family. 별도 진한 border/굵은 font로 과장하지 않는다.

## THEME-009 — dark canvas

앱/section/grouped의 current dark canvas는 `#0d0f13` graphite-black이다.

**pure black `#000`을 일반 page canvas로 쓰지 않는다.**

## THEME-010 — dark cards

카드는:
- surface #171b21
- raised #1b2028
- soft #20252d
- white-ish text
- muted #aeb6c2
- line rgba white .05~.09

계열을 사용.

## THEME-011 — dark nested panels

inner metric, message bubble, market price, guide key 등은 outer card와 한 단계 surface 차이를 둔다. 같은 색으로 뭉개지지 않아야 한다.

## THEME-012 — dark media exception

제품 컷아웃/흰 배경 이미지 stage는 이미지 콘텐츠 특성상 white/light background를 유지할 수 있다. 모든 흰 surface를 다크로 강제하지 않는다.

## THEME-013 — dark badge

common tag:
- dark-surface-3 계열.
- #bcc4cf text.
- thin line.

image source badge는 white text/dark translucent.

## THEME-014 — liquid across themes

selected blue liquid material은 light/dark 모두 같은 blue identity를 유지한다. dark에서는 shadow/rail contrast만 조정한다.

## THEME-015 — theme-color meta policy

V1 runtime은 `script-28.js`에서 `meta[name="theme-color"]`를 반복 제거한다.

이유:
- iOS Safari bottom/top chrome tint가 theme-color로 강하게 고정되는 회귀를 피함.

새 theme-color를 추가하려면 실제 iOS Safari expanded/compact 상태를 함께 검증한다.

---

# iOS Safari

## SAFARI-001 — detection

`index.html` bootstrap:

iPhone/iPad/iPod 또는 touch MacIntel + `WebKit`이면 `<html>`에:

`ios-webkit-chrome`

class를 추가한다.

Safari 전용 workaround는 가능하면 이 class에 scope한다.

## SAFARI-002 — browser-owned area

iOS Safari 26의 하단 주소 UI/obscured inset 일부는 페이지 DOM이 직접 소유하지 않는다.

따라서:
- 웹 CSS로 주소 UI 자체를 완전 투명하게 ‘강제’할 수 있다고 가정하지 않는다.
- browser chrome 문제를 고치기 위해 app UI geometry를 반복 이동시키지 않는다.

## SAFARI-003 — expanded vs compact

실사용 검증에서 두 상태는 다르게 동작한다.

### Expanded
최초 진입 또는 맨 위 상태의 큰 주소 영역.
- browser가 고체/불투명 배경을 보일 수 있음.
- V1에서 웹페이지가 이를 완전 투명화하는 것을 보장하지 않는다.

### Compact
스크롤 후 작은 floating address pill.
- Safari가 페이지 content를 통한 translucent/transparent 합성을 보여줄 수 있음.
- 현재 V1 workaround가 이 상태를 prime한다.

## SAFARI-004 — compact detection

`script-safari-compact-prime.js`:

- initial `visualViewport.height` baseline 저장.
- viewport height growth >= 약 28px.
- scrollY > 8.

이면 compact candidate.

## SAFARI-005 — compact prime trigger

user scroll이 멈춘 뒤 약 150ms 이상 안정화된 상태에서 prime을 시도한다.

조건:
- app ready.
- collection UI ready.
- collection이 실제 user에게 open 상태가 아님.
- compact 상태.
- 아직 primed 아님.

## SAFARI-006 — compact prime sequence

Safari bottom chrome 재합성을 유도하기 위해 **실제로 동작이 확인된 production lifecycle**을 invisibly replay한다.

1. `<html>`에 `safari-compact-prime`.
2. collection FAB click.
3. 몇 frame wait.
4. `영상` primary tab click.
5. 몇 frame wait.
6. close click.
7. 약 230ms wait.
8. scroll position 복원.
9. class 제거.

## SAFARI-007 — prime visual hiding

prime 중 `style-35.css`:

- `#collectionLayer opacity:.001`
- pointer-events none
- sheet/backdrop animation none

WebKit render tree에는 존재하지만 사용자에게 popup flicker가 보여서는 안 된다.

## SAFARI-008 — compact rearm

한 번 prime한 뒤 사용자가 실제로 top으로 돌아가 Safari toolbar가 expanded 상태가 된 경우에만 rearm.

조건:
- viewport growth <= 약 12px.
- scrollY <= 약 4.
- priming 중 아님.

그 후 다시 compact로 내려오면 prime 재실행 가능.

## SAFARI-009 — known confirmed behavior

V1 직전 사용자 확인:
- compact address pill로 줄어들면 자동으로 뒤 surface가 translucent/transparent 상태로 전환되는 경로가 작동함.

이 기능을 제거하지 않는다.

## SAFARI-010 — known limitation: popup open tint

실사용 과정에서 **하단 collection popup을 실제로 열어 둔 동안 Safari address pill 뒤가 검정/고체 tint로 바뀌는 현상**이 관찰됐다.

이는 V1에서 완전히 해결됐다고 명세하지 않는다.

사용자가 당시 ‘여기서 마무리’하고 다른 디자인 작업으로 이동했으므로:
- compact auto-prime은 보존.
- popup-open Safari tint는 KNOWN LIMITATION.
- future work는 app geometry를 무작정 옮기지 말고 별도 Safari research/isolated test로 처리.

## SAFARI-011 — no site-owned bottom plate

MUST NOT:
- footer-like solid strip를 address pill 뒤에 고정.
- safe-area를 별도 black/grey rectangle로 채움.
- body pseudo-element로 browser chrome 뒤를 덮음.

현재 후반 CSS는 html/body/pseudo surfaces를 transparent로 유지하고 actual app/sections가 surface를 소유한다.

## SAFARI-012 — root/app surface split

최종 V1:
- html/body: browser-facing transparent.
- light `#app/.app`: white.
- dark `#app/.app`: #0d0f13.

이 split은 Safari chrome 실험 때문에 생긴 확정 구조다.

## SAFARI-013 — sticky nav stability

Safari toolbar expand/collapse 중:
- nav-shell height 고정.
- sticky ancestor backdrop-filter 제거.
- y transform 없음.
- height-only viewport resize에 layout recalculation을 최소화.

## SAFARI-014 — native horizontal rail

iOS에서 nav horizontal pan은 native overflow scroll이어야 한다. touch gesture override를 추가하지 않는다.

## SAFARI-015 — FAB

FAB bottom은 safe-area + 약 20px family. Safari address UI를 피하려고 70~80px 추가로 임의 상승시키는 것은 과거 회귀이므로 금지.

## SAFARI-016 — bottom sheet

collection sheet는 원래 bottom sheet geometry를 유지한다. Safari tint workaround를 위해 중앙 floating dialog로 올리면 안 된다.

## SAFARI-017 — popup bottom gap

sheet와 viewport bottom 사이에 main page가 보이는 gap을 workaround로 만들지 않는다. 이는 과거 실험에서 발생한 회귀다.

## SAFARI-018 — failed experiments 기록

V1 이전에 효과 없거나 부작용을 만든 접근:

- root background를 임의 grey/black으로 강제.
- transparent root만 반복 덮기.
- popup/FAB를 큰 fixed clearance만큼 위로 이동.
- full-screen fixed wrapper 구조 변경.
- 1px edge-scroll guard만으로 chrome 갱신 기대.
- fake lock/unlock만으로 first paint chrome 갱신.
- popup fixed background만 투명화 + app brightness dim.

이 접근을 같은 근거 없이 반복하지 않는다.

## REG-THEME-001 — Theme regression

- 첫 paint가 light였다 dark로 flash.
- light guide-key text가 흰 배경에서 사라짐.
- dark nested panel hierarchy가 사라짐.
- common badge가 모듈마다 서로 다른 style.

## REG-SAFARI-001 — Safari regression

- compact auto-prime 제거.
- compact 진입 시 visible popup flicker.
- FAB가 과도하게 위로 이동.
- bottom sheet가 중앙 dialog가 됨.
- popup bottom gap.
- root에 pure black plate가 다시 생김.
- nav가 Safari toolbar 움직임에 따라 y축 jitter.
