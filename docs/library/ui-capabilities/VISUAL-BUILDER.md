# Platform Visual Builder

Status: candidate / noindex / production state non-mutating

## 목적

`/ui-dashboard/`는 운영 페이지를 직접 편집하지 않는다. 전용 더미 페이지 `/ui-dashboard/sandbox/`를 편집 캔버스로 사용한다.

더미 캔버스는 운영 데이터, Google Sheet 사용자 데이터, 질문 기록, 저장 목록과 연결하지 않는다. 대신 실제 플랫폼이 사용하는 공통 CSS, UI class, interaction owner를 그대로 불러와 범용 UI와 Block을 검토한다.

Photography production은 디자인과 동작의 reference source다. 빌더가 production DOM 자체를 iframe으로 불러오지는 않는다.

## 관리 도구 역할

- `화면 구성`: 더미 페이지에서 UI 설정, Block 순서, 광고 위치를 조립한다.
- `UI 라이브러리`: 실제 reusable UI를 하나씩 독립적으로 띄우고 테마, 표현, 상태, 상호작용을 검토하는 Live UI Kit다.
- `Block Lab`: Block type / variant / style preset을 검토하고 범용화 여부를 판정한다.
- `Page Editor`: 데이터 기반 새 페이지 초안을 조립, 저장, 발행 준비한다.
- `QA`: 비사진 페이지와 public renderer 회귀 검증에 사용한다.

## Dummy canvas contract

Route: `/ui-dashboard/sandbox/`

- 정적 더미 콘텐츠만 사용한다.
- production API나 Google Sheet를 읽지 않는다.
- 실제 플랫폼의 공통 CSS와 동일한 class owner를 사용한다.
- navigation, horizontal rail, filter chip, collection sheet, device accordion, progress, FAB을 실제 page flow 안에 배치한다.
- PC와 모바일에서 같은 더미 DOM을 사용한다.
- 빌더 초안 저장은 browser local state이며 production publish가 아니다.

## Inspector

PC:
- capability 대상에 hover하면 gear가 보인다.
- gear를 누르면 독립 floating 설정창이 열린다.
- 여러 panel을 동시에 열고 header drag로 옮길 수 있다.
- 값 변경은 sandbox canonical capability runtime에 즉시 전달한다.

Mobile:
- hover를 사용하지 않는다.
- 편집 모드에서 capability를 탭하면 하단 inspector를 연다.
- 여러 inspector 상태는 dock으로 전환한다.
- mobile native horizontal scroll owner를 바꾸지 않는다.

중요: inspector의 manifest 기본값은 form 초기값일 뿐 production UI에 자동 적용하지 않는다. 실제 화면은 production CSS 원본에서 시작하고 사용자가 바꾼 속성만 override한다.

## UI 라이브러리 = Live UI Kit

Route: `/ui-dashboard/?view=library`

목적은 여러 specimen을 쌓아보는 catalog가 아니다. 한 번에 하나의 reusable UI component를 실제 runtime으로 독립 렌더링하고 조작한다.

Components:
- 상단 메뉴
- 가로 카드
- 범용 필터칩
- 하단 팝업
- 다른 기기
- 플로팅 버튼

Global controls:
- 색상: `화이트 / 다크 / 시스템`
- 화면: `PC / 모바일`

Component별 가능한 controls:
- 표현 모드: 원본 / Material / iOS / Liquid 등
- 상태: bottom-sheet tab, accordion collapsed/expanded 등
- 세부 설정: capability manifest control

Source contract:
- 상단 메뉴: 실제 `.nav-shell`
- 가로 카드: 실제 `.scroll-row` 또는 `.desktop-rail-window`
- 범용 필터칩: **내 모음 하단 팝업의 실제 `#collectionFilters > .collection-filter`**
- 하단 팝업: 실제 `#collectionLayer` / `#collectionSheet`; standalone preview에서는 FAB 숨김
- 다른 기기: **실제 `.collection-device-accordion` 하나만** 표시
- 플로팅 버튼: 실제 `#collectionFab`

Library preview는 dummy page 전체를 보여주지 않는다. component만 neutral floor에 남기고 나머지 dummy DOM을 숨긴다. Bottom sheet를 drag-close해도 뒤에서 dummy page나 FAB가 나오지 않고 neutral floor만 보인다.

UI를 `cloneNode()`로 복제해 임의 specimen으로 재구성하지 않는다. production runtime이 만든 실제 DOM node를 standalone preview root로 이동해 event owner와 interaction을 유지한다.

`읽기 진행`은 별도 specimen이 아니라 상단 메뉴 component의 일부로 취급한다.

## Theme isolation

UI Kit의 `화이트 / 다크 / 시스템`은 iframe 내부 production theme owner인 `window.setPhotoRoadmapTheme()`에 전달한다.

Sandbox storage isolation이 `photoRoadmapThemeV1`을 memory에서만 처리하므로 theme 실험은 사용자의 공개 페이지 theme 설정을 변경하지 않는다.

## Page design override owner

기존 builder V1의 직접 inline paint는 authoritative owner가 아니다.

- V1은 inspector / block chrome을 유지한다.
- V2 config store는 사용자가 직접 변경한 속성만 보관한다.
- `capability-runtime-v3`가 iframe의 실제 design override를 소유한다.
- reset은 manifest 기본값을 강제하는 것이 아니라 production UI 원본으로 돌아간다.

## Editor navigation

Production의 Safari deferred-sticky owner는 유지한다.

일반 desktop editor iframe에서는 CSS sticky가 scroll ancestor에 따라 불안정할 수 있으므로 sandbox 전용 fixed-pin fallback을 사용한다. `.nav-shell` 앞 spacer가 viewport top에 도달하면 실제 nav shell을 fixed로 전환한다. 이 동작은 production source를 수정하지 않는다.

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

Visual Builder에는 본문 중간 광고와 PC 좌/우 여백 광고를 둔다. 광고 네트워크는 연결하지 않고 layout placeholder만 검토한다.

## 수정 요청 메모

각 UI inspector에 `수정 요청 메모`를 둔다.

- 브라우저에서는 local draft로 보관한다.
- 관리자 서버 연결 상태에서는 기존 `UI_PRESETS` Sheet의 `notes` 필드로 저장한다.
- 메모 저장 자체는 approval이 아니다.

## Production safety

- Visual Builder에서 `/photography/` production page를 편집 캔버스로 불러오지 않는다.
- photography production renderer를 candidate renderer로 교체하지 않는다.
- Dashboard override는 production source를 직접 수정하지 않는다.
- Safari deferred sticky safety를 제거하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- 사용자 review 전 block/UI preset을 자동 승인하지 않는다.
- builder / labs / QA / staging은 noindex다.

## 다음 QA

1. page mode에서 상단 메뉴 fixed-pin, inspector live controls, reset을 확인한다.
2. library에서 6개 component가 하나씩만 표시되는지 확인한다.
3. 각 component를 White / Dark / System, PC / Mobile로 확인한다.
4. filter chip이 bottom sheet 원본과 동일한지 확인한다.
5. device preview에서 accordion 이외 UI가 보이지 않는지 확인한다.
6. bottom sheet close 뒤 neutral floor만 보이는지 확인한다.
7. block drag/drop, ads, local draft 기능을 회귀 검증한다.
