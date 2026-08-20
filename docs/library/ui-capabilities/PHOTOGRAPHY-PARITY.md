# Photography Parity Extraction

현재 photography production UI는 반복적인 실제 화면 수정으로 완성도가 높아졌지만 처음부터 공통 Block/Capability 공식으로 만들어진 것은 아니다.

이 문서는 좋은 부분을 잃지 않고 공통 시스템으로 옮기기 위한 추출 목록이다.

## 원칙

- 사진 production을 candidate renderer로 교체하지 않는다.
- 현재 사진 구현을 먼저 관찰한 뒤 공통화한다.
- 기능 owner가 이미 있으면 새 parallel controller를 만들지 않는다.
- 공통화 과정에서 사진 전용 의미가 강한 기능은 photography pack에 남긴다.
- **photography-extracted preset의 기준 화면은 production과 100% source parity여야 한다.**
- 사진 원본을 비슷하게 다시 그린 mockup은 parity 승인 근거로 사용할 수 없다.
- UI Dashboard의 `사진 페이지 원본` 모드는 same-origin `/photography/`의 실제 DOM/CSS/JavaScript를 그대로 불러온다.
- `범용 실험` 모드는 공통화를 위한 별도 실험 화면이며 photography production과 동일하다고 주장하지 않는다.
- 사진 production이 변경되면 원본 비교 화면도 별도 복제 없이 즉시 같은 source를 보게 해야 한다.
- Safari 주소창 축소처럼 top-level browser chrome에 의존하는 동작은 iframe 환경이 동일하지 않으므로 실제 `/photography/` 전체 페이지에서 최종 검증한다.

## Parity 판정 기준

photography-extracted UI가 `approved`가 되려면 다음 네 축을 따로 확인한다.

1. Visual parity — 크기, 간격, 색, 그림자, blur, fade, mask, border, responsive 배치
2. Interaction parity — click, drag, scroll, accordion, popup, selected indicator, progress motion
3. Functional parity — 실제 검색/필터/복사/연결/저장 등 기능 owner와 상태 전환
4. Responsive parity — mobile native owner, desktop augmentation, Safari safety contract

원본 비교 화면과 다르면 `approved`로 올리지 않는다. 차이가 의도적인 공통화 실험이라면 `범용 실험`의 별도 preset/variant로 저장한다.

## Long-term shared-source rule

최종 공통화의 목표는 photography와 새 산업이 비슷한 코드를 각각 유지하는 것이 아니다.

`production photography owner → shared primitive/capability로 추출 → photography와 새 산업이 같은 shared source 사용`

순서로 이동한다.

초기 추출 단계에서는 photography production owner를 그대로 둔다. 사용자 승인과 회귀 QA가 끝난 뒤에만 shared source로 승격하고 photography consumer를 같은 source로 전환한다. 이 전환 전까지 photography production을 candidate implementation으로 교체하지 않는다.

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

Dashboard 원본 비교는 actual `.nav-shell / .nav-scroll / .nav-chip / .nav-v33-indicator / .nav-chapter-progress`를 사용한다.

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

Dashboard 원본 비교는 actual `.desktop-rail-window`와 내부 `.scroll-row` 계열을 사용한다. PC drag, click suppression, alpha mask와 shadow runway도 production owner가 처리한다.

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

photography 원본 필터는 실제 `#collectionSheet` 안의 `.collection-filters / .collection-filter` 상태를 기준으로 한다. 실제 저장 데이터에 분류값이 없으면 원본 필터가 나타나지 않는 것도 정상 production state다.

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

Dashboard 원본 비교는 `#collectionFab`을 통해 실제 production `#collectionSheet`를 열고 production event owner를 그대로 사용한다.

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

Dashboard 원본 비교는 실제 설정 탭의 `#collectionDeviceLink`와 `.collection-device-accordion`을 사용한다.

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
4. UI Dashboard `사진 페이지 원본`에서 actual production source 확인
5. 필요 시 `범용 실험`에서 configurable version 검토
6. PC/mobile 차이 기록
7. reduced-motion/Safari contract 기록
8. 사용자 판정
9. approved 상태에서만 새 산업에 사용
10. shared-source 승격 시 photography regression QA 통과
