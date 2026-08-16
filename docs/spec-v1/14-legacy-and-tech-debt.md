# 14. Legacy / 기술부채 / 재구축 시 복제하지 말아야 할 것

V1은 현재 사용자 승인 상태를 기준으로 하지만, 현재 코드의 누적 override 구조까지 ‘좋은 설계’로 확정하는 것은 아니다. 이 문서는 **최종 UX는 보존하되 새 구현에서는 제거/통합해야 할 중복**을 명시한다.

## DEBT-001 — numbered CSS 누적 cascade

현재 active CSS는 `style-1.css`부터 `style-36.css`까지 다수 revision이 순서대로 누적되며, `style-23.css`만 현재 index에서 빠져 있다.

문제:
- 동일 selector가 여러 세대에서 반복 override.
- `!important` 의존.
- 낮은 번호 파일을 수정해도 후반 layer가 이김.
- 원인 추적 비용 증가.

V1 재구축 시:
- token/base/component/theme/Safari layer로 의미 단위 통합 권장.
- 최종 computed style과 명세를 보존.
- numbered override 역사 자체는 복제하지 않는다.

## DEBT-002 — 다중 `setupNavigation()` 정의

현재 `script-4`, `script-7`, `script-8`, `script-9` 세대가 global `setupNavigation`을 순차 override한다.

문제:
- 어떤 파일이 실제 호출되는지 load order에 의존.
- 한 파일만 수정하면 효과가 없거나 다른 세대에 눌림.
- 과거 custom horizontal alignment 코드 잔존.

재구축:
- chapter state/scroll target/progress를 하나의 navigation module로 통합.
- moving liquid는 별도 `LiquidController` owner 유지.

## DEBT-003 — retired liquid controllers가 저장소에 남음

Dormant 대표:
- `script-15.js`
- `script-16.js`
- `script-18.js`
- `script-20.js`
- `script-21.js`
- `script-22.js`
- `script-23.js`
- `script-27.js`

이 파일들은 liquid indicator/spring/theme/bulk의 이전 세대다.

위험:
- index에 다시 추가하면 double indicator / flat fallback / no spring / jitter 가능.

원칙:
- historical reference로만 취급.
- 재활성화 금지.
- 필요 기능은 current owner로 이식.

## DEBT-004 — `script-27.js` guard 기반 retirement

`script-liquid-core.js`가 `window.__photoV49CoreInstalled=true`를 먼저 설정하여 `script-27.js`가 attach되지 않도록 한다.

이는 file 삭제 대신 guard로 retirement한 상태다.

재구축 시 retired file 자체를 dependency graph에서 제거 가능.

## DEBT-005 — top indicator secondary heal

`script-19.js`는 canonical liquid owner가 있음에도:
- `syncTopIndicator()`
- `scheduleTopHeal()`

으로 nav indicator inline geometry를 idle 시 다시 쓴다.

현재 정상 상태에서는 큰 문제 없이 보조 repair로 작동하지만 **single-owner 원칙에 어긋나는 debt**다.

향후 정리:
- canonical controller self-heal이 충분하면 script19 top heal 제거.
- bulk functionality만 남김.

## DEBT-006 — current question geometry double ownership 흔적

`script-25.js`:
- `moveV40QuestionIndicator()`
- inline width/height/transform.
- `getAnimations().cancel()`.

`style-34.css`:
- final V40 grid geometry `!important`.
- visible transform/transition.

즉 JS와 CSS가 같은 geometry를 서로 다른 방식으로 표현한다.

사용자 승인 V1은 **style34의 grid geometry**다.

향후 정리:
- current V40에 대한 script25 geometry write/cancel 제거.
- legacy v32 selector만 필요 시 별도 유지.

## DEBT-007 — question parking node 세대 중복

현재 코드에:
- `#v40QuestionParking`
- `#v41QuestionParking`

계열이 존재할 수 있다.

목적은 composer를 collection rerender에서 보존하는 것.

재구축:
- stateful component owner 하나로 통합.
- hidden parking DOM 다중 세대는 불필요.

## DEBT-008 — legacy question drawer와 current collection question 공존

`script-5.js`가 base `#askLayer/#askSheet`를 만들고, current UX는 이를 collection question workspace로 가져와 재사용한다.

과거 drawer DOM이 완전히 사라진 것은 아니다.

재구축 시:
- selection state, textarea, 저장/복사/ChatGPT 기능은 유지.
- 별도 legacy drawer UI는 제거 가능.
- 하나의 question workspace component로 통합 권장.

## DEBT-009 — legacy `.v32-question-segment` class 의미 중첩

current `.v40-question-segment`가 visual inheritance를 위해 `v32-question-segment` class를 함께 가진다.

따라서:
- `.v32-question-segment` == 무조건 legacy DOM 이라는 가정이 틀림.
- legacy 제거 selector는 `.v32-question-segment:not(.v40-question-segment)`처럼 범위를 좁혀야 함.

재구축 시 세대명 class를 semantic class로 변경 가능.

## DEBT-010 — collection bulk repair layers 중복

bulk selection은 script19가 owner지만 script24/25가 question rerender 후 boxes/grid를 repair한다.

재구축:
- renderLibrary(state)가 bulk state를 직접 render.
- 후처리 repair scripts 제거.

## DEBT-011 — collection scroll lock 규칙 충돌

`script-14.js`는 body top negative + collection-open을 사용하고, 후속 CSS는 일부 body positioning을 static으로 override한다.

이것은 Safari 대응 과정에서 누적된 상태다.

향후:
- iOS Safari behavior test와 함께 하나의 scroll-lock 전략으로 통합.
- 현재 V1 동작을 깨지 않는 범위에서만 변경.

## DEBT-012 — Safari address chrome workaround는 product code에 존재

`script-safari-compact-prime.js`는 hidden collection interaction을 replay해 Safari compact toolbar composition을 갱신한다.

이것은 표준 UI architecture가 아니라 browser-specific workaround다.

향후 Safari/WebKit이 수정되면:
- feature detection/버전 검증 후 제거 고려.
- 제거 전 iOS actual device regression test 필수.

현재는 user-confirmed compact behavior 때문에 MUST KEEP.

## DEBT-013 — Safari popup-open tint 미해결

collection popup이 실제로 열린 동안 Safari compact address pill 뒤가 고체/검정 tint로 바뀔 수 있다.

V1 known limitation.

해결 시 과거 실패 실험을 반복하지 않는다:
- popup을 중앙으로 띄움.
- FAB 78px 상승.
- bottom gap.
- root black/grey plate.
- fake fixed wrapper.

별도 isolated browser test 필요.

## DEBT-014 — expanded Safari toolbar 투명화 불가/미보장

큰 주소영역 상태는 browser-owned opaque chrome으로 남을 수 있다.

이를 제품 코드 버그로 간주해 app geometry를 변경하지 않는다.

## DEBT-015 — generated image를 JS base64로 번들

3개 generated image가 거대한 data URL JS file로 포함된다.

문제:
- repository diff/parse 부담.
- postload Blob 변환 필요.

재구축/최적화:
- 정적 `.webp` asset 파일로 이동 가능.
- `__PHOTO_GENERATED_IMAGES` logical key contract만 유지하면 됨.

## DEBT-016 — external image fallback URL

일부 fallback은 Unsplash remote URL.

위험:
- 외부 availability/crop 변화.

장기적으로 approved local/generated assets로 통합 가능.

## DEBT-017 — YouTube scraping dependency

`/api/videos`는 official stable API가 아니라 public search document/Innertube parsing에 의존.

위험:
- markup/API 내부 구조 변경.
- bot/network block.

현재 fallback search URL로 resilience 확보.

장기적으로 Data API 또는 별도 curated video source 검토 가능.

## DEBT-018 — external article discovery source stability

Bing RSS/Naver fallback/HTML metadata parsing 역시 외부 구조에 영향 받음.

core app과 failure isolation을 유지한다.

## DEBT-019 — global namespace

많은 renderer/helper가 `window`/global scope에 존재하고 후속 script가 override한다.

재구축:
- ES modules 또는 명확한 namespace/module registry 권장.
- 기능 순서는 보존.

## DEBT-020 — string-template DOM rendering

대부분 HTML string + `innerHTML` 기반.

장점:
- 단순/빠른 초기 구현.

위험:
- dynamic rerender가 child state/listener 파괴.
- parking/repair 필요.

재구축 시 component framework가 필수는 아니지만 state owner/DOM update boundary를 명확히 해야 한다.

## DEBT-021 — repeated `!important`

후반 CSS가 legacy cascade를 이기기 위해 `!important`를 광범위하게 사용한다.

새 style36 이후 또 `!important`를 쌓는 방식은 가능한 피한다.

먼저:
1. actual DOM class 확인.
2. current final owner 찾기.
3. 동일 component family 재사용.
4. 필요한 최소 selector만 수정.

## DEBT-022 — light/dark 규칙 분산

base light + 여러 dark audit + style36 light repair가 분산돼 있다.

재구축:
- semantic surface tokens로 통합 권장.
- `data-theme`만 theme switch source.

## DEBT-023 — card badge class 불일치

실제 사례:
- common `.soft-tag`
- product `.product-row__meta span`
- curated `.curated-tags > span`

같은 디자인 언어인데 class가 다르다.

과거 `.soft-tag`만 수정해 curated badge가 안 바뀌는 회귀 발생.

향후:
- semantic common badge class 추가 또는 token mixin.
- 현재 DOM 변경 없이 수정할 경우 실제 selector 모두 확인.

## DEBT-024 — source badge는 의도적 예외

`.curated-platform`은 이미지 위에 있어 common badge와 동일화하면 contrast가 떨어질 수 있다.

이것은 class inconsistency debt가 아니라 **contextual exception**이다.

## DEBT-025 — duplicated favorite render paths

curated section 내부 favorites panel과 unified collection이 모두 저장 글을 보여줄 수 있다.

사용자 primary hub는 `내 모음`.

장기 정리 시 internal curated favorite panel 제거 가능하지만, 사용자 요청 없이 V1에서 삭제하지 않는다.

## DEBT-026 — question remote identity가 account가 아님

device key는 lightweight sync mechanism.

향후 account system 도입 시 migration 필요. 현재 key를 사용자의 로그인 account처럼 확장 해석하지 않는다.

## DEBT-027 — API route aggregation

`functions/api/[[path]].js`가 site-data + question RPC 등 다수 책임을 함께 가진다.

재구축 시 route 분리 가능하나 public endpoints/schema는 migration 필요.

## DEBT-028 — 자동화 테스트 부족

현재 주요 안정성 검증은 실제 iPhone Safari screenshot/manual UX test 의존도가 높다.

특히 자동화가 필요한 후보:
- DOM invariant: indicator one per rail.
- V40 geometry.
- collection tab/search/question structure.
- storage migration.
- API schema.
- dark/light contrast class presence.

## DEBT-029 — viewport/browser UI는 screenshot test 필요

Safari address chrome, sticky nav, safe-area는 desktop headless browser만으로 검증 불충분.

실기기/실 Safari QA를 명세에서 제거하지 않는다.

## DEBT-030 — old comments can be stale

각 numbered file의 header `vXX canonical` 표현은 그 시점의 canonical을 의미한다. 현재 V1의 최종 canonical을 자동 의미하지 않는다.

현재 판단 순서:
1. V1 spec.
2. active load order.
3. final computed behavior.
4. historical comments.

## DEBT-031 — future cleanup rule

기술부채 정리 PR/작업은 **동작 변경과 섞지 않는 것**이 원칙이다.

예:
- `script-25` V40 motion 제거 + 새로운 question feature 추가를 동시에 하지 않음.
- CSS layer consolidation + visual redesign 동시에 하지 않음.

먼저 behavior-preserving cleanup, 이후 기능 변경.

## DEBT-032 — spec is not debt

다음은 ‘낡아 보여서’ 지울 대상이 아니다.

- Breeze spring.
- native horizontal rail.
- collection bottom sheet.
- V40 two-slot question selector.
- contextual selection bubble.
- local durable favorite snapshots.
- light/dark/system.
- compact Safari prime (현재 필요).

이것들은 V1 기능/디자인 계약이다.
