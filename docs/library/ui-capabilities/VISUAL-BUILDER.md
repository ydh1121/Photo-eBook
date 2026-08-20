# Platform Visual Builder

Status: candidate / noindex / production state non-mutating

## 목적

`/ui-dashboard/`는 운영 페이지를 직접 편집하지 않는다. 전용 더미 페이지 `/ui-dashboard/sandbox/`를 편집 캔버스로 사용한다.

더미 캔버스는 운영 데이터, Google Sheet 사용자 데이터, 질문 기록, 저장 목록과 연결하지 않는다. 대신 실제 플랫폼이 사용하는 공통 CSS, UI class, interaction owner를 최대한 그대로 불러와 실제 페이지와 같은 문맥에서 범용 UI와 Block을 검토한다.

Photography production은 디자인과 동작의 reference source다. 빌더가 production DOM 자체를 iframe으로 불러오지는 않는다.

## 관리 도구 역할

- `플랫폼 빌더`: 더미 페이지에서 UI 설정, Block 순서, 광고 위치를 조립한다.
- `UI 라이브러리`: 더미 페이지에 실착된 공통 UI를 맨바닥 surface로 꺼내 범주별로 확인한다.
- `Block Lab`: Block type / variant / style preset을 검토하고 범용화 여부를 판정한다.
- `Page Editor`: 데이터 기반 새 페이지 초안을 조립, 저장, 발행 준비한다.
- `QA`: 비사진 페이지와 public renderer 회귀 검증에 사용한다.

Block Lab에서 범용화된 Block/primitive는 Visual Builder 팔레트와 shared renderer source에 연결한다.

## Dummy canvas contract

Route: `/ui-dashboard/sandbox/`

- 정적 더미 콘텐츠만 사용한다.
- production API나 Google Sheet를 읽지 않는다.
- 실제 플랫폼의 공통 CSS와 동일한 class owner를 사용한다.
- navigation, horizontal rail, filter chip, collection sheet, device accordion, progress, FAB을 실제 page flow 안에 배치한다.
- 별도 showcase card/table 안에 UI를 전시하지 않는다.
- PC와 모바일에서 같은 더미 DOM을 사용한다.
- 빌더 초안 저장은 browser local state이며 production publish가 아니다.

## Inspector

PC:
- capability 대상에 hover하면 gear가 보인다.
- gear를 누르면 해당 요소 설정창이 열린다.
- 설정창은 modal이 아니라 독립 floating panel이다.
- 여러 panel을 동시에 열 수 있다.
- header drag로 옮길 수 있다.
- 사용자가 닫기 전에는 자동으로 닫지 않는다.
- 값 변경은 Dashboard override layer로 더미 DOM에 즉시 반영한다.

Mobile:
- hover를 사용하지 않는다.
- 편집 모드에서 capability를 탭하면 하단 inspector를 연다.
- 여러 inspector 상태는 유지하고 하단 dock으로 전환한다.
- mobile native horizontal scroll owner를 바꾸지 않는다.

## UI 라이브러리

UI Library source는 더미 페이지에서 실제 플랫폼 class/CSS로 렌더링된 capability DOM이다.

- navigation
- horizontal content
- selector/filter
- overlay
- interaction
- status
- action

각 source를 clone해 흰 platform floor에 직접 배치한다. 라이브러리용 카드나 테이블 wrapper를 만들지 않는다.

Photography와 비교가 필요할 때는 production source owner와 selector를 코드 기준으로 대조한다. production 페이지를 builder source로 사용하지 않는다.

## Block composer

편집 모드에서 더미 `#app`의 의미 있는 page block을 drag/drop으로 재배치할 수 있다. 이 순서는 builder local draft다.

Block palette는 Block Registry manifest를 읽는다. candidate block은 sandbox 조립만 허용하고 자동 승인, 자동 publish하지 않는다.

## Advertisement block

Block Registry의 `advertisement`는 candidate 상태다.

Variants:
- `inline-banner`
- `native-card`
- `desktop-side-rail`
- `sticky-bottom`

Visual Builder에는 다음 광고 자리를 둔다.

1. 본문 중간 삽입 광고
2. PC 좌측 여백 플로팅 배너
3. PC 우측 여백 플로팅 배너
4. 이후 검토할 하단 고정 광고

PC 좌우 플로팅 배너는 더미 페이지 콘텐츠 바깥 여백에 위치하며 스크롤을 따라가는 방식이 기본값이다. 좌측과 우측을 독립적으로 켜고 끌 수 있으며 폭, 높이, 상단 위치, 본문과의 간격, 스크롤 추적 여부를 조절한다.

광고 네트워크는 연결하지 않는다. 현재 단계에서는 layout placeholder만 검토한다.

## 수정 요청 메모

각 UI inspector에 `수정 요청 메모`를 둔다.

- 브라우저에서는 즉시 local draft로 보관한다.
- 관리자 서버 연결 상태에서는 기존 `UI_PRESETS` Sheet의 `notes` 필드로 저장한다.
- note preset id는 capability별로 안정적으로 유지한다.
- GPT 작업 시 Sheet의 open/draft note를 읽고 source owner와 현재 config를 대조한 뒤 반영한다.

메모 저장 자체는 approval이 아니다.

## Production safety

- Visual Builder에서 `/photography/` production page를 편집 캔버스로 불러오지 않는다.
- photography production renderer를 candidate renderer로 교체하지 않는다.
- Dashboard override는 production source를 직접 수정하지 않는다.
- Safari deferred sticky safety를 제거하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- 사용자 review 전 block/UI preset을 자동 승인하지 않는다.
- builder / labs / QA / staging은 noindex다.

## 다음 QA

1. `/ui-dashboard/`가 `/ui-dashboard/sandbox/`만 iframe source로 사용하는지 확인한다.
2. sandbox가 production API/Sheet 요청을 만들지 않는지 확인한다.
3. PC floating inspector 다중 열기, drag, live value를 확인한다.
4. 모바일 tap inspector, dock, native scroll 충돌을 확인한다.
5. filter chip, collection sheet, device accordion이 더미 상태에서도 실제 class/CSS로 표시되는지 확인한다.
6. 더미 block drag/drop 단위를 검수한다.
7. 좌우 플로팅 광고의 폭, 높이, top, gap, follow 설정을 검수한다.
8. advertisement 4 variant를 Block Lab에서 정제한다.
9. approved Block Lab primitive를 builder palette 실제 renderer로 연결한다.
10. Sheet `UI_PRESETS.notes` → GPT 반영 workflow를 검증한다.
