# Platform Visual Builder

Status: candidate / noindex / production state non-mutating

## 목적

`/ui-dashboard/`는 UI specimen 전시장 대신 실제 플랫폼 페이지를 편집 캔버스로 사용한다. 사진 페이지에서 이미 구현된 요소 가운데 다른 산업에서도 재사용할 수 있는 UI만 capability로 표시하고, 실제 DOM/CSS/JavaScript 문맥 안에서 조정한다.

별도로 비슷한 mockup을 다시 그려 photography parity를 판정하지 않는다.

## 관리 도구 역할

- `플랫폼 빌더`: 실제 페이지 위에서 UI 설정, 블록 순서, 광고 위치를 조립하고 확인한다.
- `UI 라이브러리`: 실제 플랫폼 source UI를 맨바닥 surface에 꺼내 범주별로 확인한다. 카드/테이블 전시 프레임으로 감싸지 않는다.
- `Block Lab`: Block type / variant / style preset을 검토하고 범용화 여부를 판정한다.
- `Page Editor`: 데이터 기반 새 페이지 초안을 조립·저장·발행 준비한다.
- `QA`: 비사진 페이지와 public renderer 회귀 검증에 사용한다.

Block Lab에서 범용화된 block/primitive는 이후 Visual Builder의 블록 팔레트와 실제 renderer source에 연결한다.

## 실제 페이지 Inspector

PC:
- capability 대상에 hover하면 gear가 보인다.
- gear를 누르면 해당 요소 설정창이 열린다.
- 설정창은 modal이 아니라 독립 floating panel이다.
- 여러 panel을 동시에 열 수 있다.
- header drag로 이동한다.
- 사용자가 닫기 전에는 자동으로 닫지 않는다.
- 값 변경은 Dashboard override layer로 실제 iframe DOM에 즉시 반영한다.

Mobile:
- hover를 사용하지 않는다.
- 편집 모드에서 capability를 탭하면 하단 inspector를 연다.
- 여러 inspector 상태는 유지하고 하단 dock으로 전환한다.
- 실제 모바일 production scroll owner는 바꾸지 않는다.

## UI 라이브러리

라이브러리 source는 실제 페이지의 capability DOM이다.

- navigation
- horizontal content
- selector/filter
- overlay
- interaction
- status
- action

각 source를 clone해 흰 platform floor에 직접 배치하며, 라이브러리용 card/table wrapper를 만들지 않는다. 설정 override는 원본과 library clone 모두 같은 selector를 통해 반영한다.

실제 production state에 source가 존재하지 않으면 억지 mockup을 만들지 않는다. 예를 들어 저장 데이터에 category가 없어서 filter가 없는 상태는 실제 상태로 취급한다.

## Block composer

편집 모드에서 실제 `#app`의 page block 후보를 drag/drop으로 재배치할 수 있다. 이 순서는 builder local draft이며 public production state를 직접 변경하지 않는다.

Block palette는 Block Registry manifest를 읽는다. candidate block은 sandbox 조립만 허용하고 자동 승인·자동 publish하지 않는다.

## Advertisement block

Block Registry에 `advertisement` candidate를 추가한다.

Variants:
- `inline-banner`
- `native-card`
- `desktop-side-rail`
- `sticky-bottom`

광고는 실제 광고 네트워크 연결 전까지 layout placeholder로 검토한다. 콘텐츠 흐름, PC side rail, 모바일 높이, sticky 닫기 정책은 별도 사용자 review 후 승인한다.

## 수정 요청 메모

각 UI inspector에 `수정 요청 메모`를 둔다.

- 브라우저에서는 즉시 local draft로 보관한다.
- 관리자 서버 연결 상태에서는 기존 `UI_PRESETS` Sheet의 `notes` 필드로 저장한다.
- note preset id는 capability별로 안정적으로 유지한다.
- GPT 작업 시 Sheet의 open/draft note를 읽고 source owner와 현재 config를 대조한 뒤 반영한다.

메모 저장 자체는 approval이 아니다.

## Production safety

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Dashboard override는 production source를 직접 수정하지 않는다.
- Safari deferred sticky safety를 제거하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- 사용자 review 전 block/UI preset을 자동 승인하지 않는다.
- builder / labs / QA / staging은 noindex다.

## 다음 QA

1. 실제 `/ui-dashboard/`에서 photography load 및 capability gear 탐지 확인.
2. PC floating inspector 다중 열기/drag/live value 확인.
3. 모바일 tap inspector + dock + native scroll 충돌 확인.
4. 실제 filter chip이 collection state에서 열린 뒤 inspector에 잡히는지 확인.
5. live block drag/drop이 photography DOM의 의미 단위를 올바르게 잡는지 확인.
6. advertisement 4 variant를 Block Lab에서 실제 content flow에 맞춰 설계.
7. Block Lab approved primitive를 builder palette 실제 renderer로 연결.
8. Sheet `UI_PRESETS.notes` → GPT 반영 workflow 검증.
