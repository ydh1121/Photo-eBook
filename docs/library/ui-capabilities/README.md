# Platform UI Capability Library

이 폴더는 콘텐츠 Block과 별도로 페이지 전체에서 반복 사용하는 UI 기능을 관리한다.

Content Block은 본문 흐름에 들어가는 편집 단위이고, UI Capability는 페이지 탐색·필터·상태 표시·팝업·interaction 같은 공통 동작이다.

## 왜 분리하는가

사진 페이지에는 이미 고도화된 상단 chapter navigation, liquid selector, collection bottom sheet, 범용 filter chip, device handoff accordion, horizontal rail interaction이 있다. 이 기능을 새 산업마다 복사하면 디자인과 버그 수정이 다시 분산된다.

따라서 앞으로는:

`Capability definition → preset → page assignment → runtime`

순서로 관리한다.

## V1 capability family

1. `top-chapter-navigation`
   - sticky/static/deferred-sticky
   - chapter chip visibility
   - liquid/flat selector
   - progress 표시/색상/두께
   - accent color
   - horizontal runway

2. `horizontal-card-rail`
   - native touch scroll
   - desktop mouse drag
   - left/right transparent runway
   - edge fade 적용 여부
   - scrollbar 표시 여부
   - shadow clipping guard

3. `filter-chip-rail`
   - material flat
   - iOS flat
   - iOS liquid glass
   - selected/accent color
   - spring response
   - overshoot/acceleration family
   - horizontal spacing/runway

4. `collection-bottom-sheet`
   - enabled
   - backdrop/blur
   - handle
   - primary tabs
   - search/filter tools
   - theme selector
   - device handoff entry

5. `device-handoff-accordion`
   - collection sheet 안의 cross-device accordion
   - 일반 FAQ accordion과 다른 capability로 관리
   - persistent outer shell + measured-height animation
   - copy/connect controls
   - expanded/collapsed motion

6. `reading-progress`
   - chapter geometry 기반 progress
   - color/thickness/opacity
   - nav integration

7. `floating-action`
   - collection/question/admin quick action 등
   - flat / glass / liquid interaction 후보

## 중요한 경계

- FAQ Block의 accordion과 device handoff accordion은 같은 component type으로 합치지 않는다.
- top navigation의 liquid indicator owner는 현재 `assets/js/ui/liquid-controller.js`다.
- chapter state owner는 `assets/js/navigation/chapter-navigation.js`다.
- device handoff owner는 `assets/js/collection/device-handoff.js`다.
- 기존 Safari deferred sticky lifecycle은 capability 설정으로 파괴하지 않는다.

## Preset

같은 capability의 설정 조합은 preset으로 저장한다.

예:
- `사진 상단 메뉴 · 파란 진행선`
- `iOS Liquid 필터 · 강한 spring`
- `카드 rail · 양쪽 fade`

Preset은 Git의 capability schema를 바꾸지 않는다. 실제 값만 저장한다.

Google Sheet:
- `UI_PRESETS` — 저장된 preset
- `PAGE_UI_CONFIG` — 페이지별 capability/preset 연결

## Photography parity

현재 사진 페이지는 공통 공식으로 처음부터 만든 것이 아니라 실제 화면을 반복 개선하며 완성도가 올라간 상태다.

따라서 사진 페이지를 폐기하거나 Block Lab 기본형으로 덮어쓰지 않는다. 대신 현재 구현을 다음 세 종류로 역추출한다.

1. 공통 Block의 고급 variant
2. shared primitive
3. UI Capability preset

사진 전용 의미가 강한 로직은 photography pack에 남긴다.

관련 문서:
- `PHOTOGRAPHY-PARITY.md`
- `CAPABILITY-CONTRACT.md`
