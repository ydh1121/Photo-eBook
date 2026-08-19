# Photography Parity Extraction

현재 photography production UI는 반복적인 실제 화면 수정으로 완성도가 높아졌지만 처음부터 공통 Block/Capability 공식으로 만들어진 것은 아니다.

이 문서는 좋은 부분을 잃지 않고 공통 시스템으로 옮기기 위한 추출 목록이다.

## 원칙

- 사진 production을 candidate renderer로 교체하지 않는다.
- 현재 사진 구현을 먼저 관찰한 뒤 공통화한다.
- 기능 owner가 이미 있으면 새 parallel controller를 만들지 않는다.
- 공통화 과정에서 사진 전용 의미가 강한 기능은 photography pack에 남긴다.

## A. Platform Chrome / Capability로 추출

### Top chapter navigation
현재 owner:
- `public/assets/js/navigation/chapter-navigation.js`
- `public/assets/js/ui/liquid-controller.js`
- Safari deferred sticky layer

추출할 설정:
- enabled
- sticky behavior
- chip selector family
- chip spacing
- accent color
- reading progress enabled/color/thickness
- PC/mobile rail alignment

### Horizontal content rail
현재 원칙:
- mobile native horizontal scroll
- PC mouse drag 보강

추출할 설정:
- edge runway
- left/right fade
- fade width/strength
- scrollbar visibility
- card shadow clipping guard
- desktop drag enabled

### Filter chip family
추출할 variant/preset:
- material flat
- iOS flat
- iOS liquid glass

설정:
- accent/background/text
- border/radius
- blur
- selected indicator
- response/overshoot
- spacing/runway

### Collection bottom sheet
현재 구성:
- backdrop
- handle
- primary tabs
- search
- filter chips
- bulk selection
- settings
- theme selector
- device handoff

공통 capability로 만들되 실제 tab contents는 module별로 on/off 가능해야 한다.

### Device handoff accordion
현재 owner:
- `public/assets/js/collection/device-handoff.js`

특징:
- FAQ accordion과 별개
- persistent outer shell
- 실제 panel scrollHeight 측정
- 0 → measured height transition
- copy/connect/status 포함

독립 interaction capability로 유지한다.

## B. Block 고급 variant로 추출

현재 photography UI에서 우선 비교할 대상:
- hero
- chapter hero
- market comparison card
- education option
- skill/media card
- portfolio case card
- product/tool card + detail row
- offer/pricing card
- roadmap/phase
- script/message
- tutorial/lesson
- curated/source card

Block Lab 기본형을 photography 디자인으로 덮지 않는다. 공통 기본형과 photography에서 추출한 고급형을 같은 block type의 별도 approved variant로 둔다.

## C. Shared Primitive로 추출

- content badge
- image source badge
- bookmark button
- copy button
- selected liquid indicator skin
- loading sentinel
- bottom-sheet handle
- progress paint
- fade edge mask

## D. 추출 완료 조건

각 항목은 다음을 만족해야 한다.

1. production owner 확인
2. Block / Primitive / Capability 분류
3. configurable field 정의
4. Block Lab 또는 UI Dashboard specimen 생성
5. PC/mobile 차이 기록
6. reduced-motion/Safari contract 기록
7. 사용자 판정
8. approved 상태에서만 새 산업에 사용
