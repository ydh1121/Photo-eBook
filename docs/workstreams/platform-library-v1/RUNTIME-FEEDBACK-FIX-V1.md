# Library Runtime Feedback Fix V1

Status: `implementation / QA pending`
Branch: `fix/library-complete-runtime-controls-v1`

## User-observed defects

- 상단 메뉴의 `메뉴칩` family 변경이 화면에서 구분되지 않음.
- 범용 필터칩은 항목이 많아졌을 때 모바일 native pan은 가능하지만 PC mouse-drag owner가 없음.
- Library preview iframe shell 그림자가 모듈 모서리의 희미한 사각형처럼 보임.
- 범용 `horizontal-rail` Library 편집기가 `tags / meta / image / action` 필드를 버려 재정렬 시 배지가 사라짐.

## Runtime findings

- 기존 top-nav family gate는 `data-module-style-family` 변경만 확인했고 실제 칩 geometry/surface 차이를 측정하지 않았다.
- filter source CSS는 `overflow-x:auto`였지만 canonical hydration에 PC pointer drag가 없었다.
- faint rectangle은 module runtime이 아니라 `.builder-kit-frame-shell` admin-only box-shadow였다.
- `library-primitive-content-editor-v1.js`의 rail normalizer가 canonical item 필드를 부분 복사해 데이터 손실을 일으켰다.

## Repair contract

- iOS Liquid는 Photography canonical liquid owner를 그대로 유지한다.
- iOS Flat / Material top-nav skin은 `top-nav-style-families-v1.css`의 canonical owner로 분리하고 `ownerFiles`에 포함한다.
- filter PC drag는 `filter-chip-rail`의 canonical hydrate owner가 직접 소유한다. 모바일은 native `pan-x`를 유지한다.
- Library preview frame의 장식용 shadow는 제거한다.
- portable primitive content editor v2는 canonical props를 보존한 채 편집/재정렬한다.
- focused Chromium gate는 computed style, PC pointer drag, mobile pan, badge/action reorder preservation을 실제 측정한다.

## Reuse boundary

- Photography canonical 6 modules: `public / library / editor` 동일 Registry owner.
- `horizontal-rail / accordion / bottom-sheet`: 현재 `library / editor` 동일 Registry owner이며 단순 모사가 아니다.
- 위 portable 3종의 `public` consumer 연결과 Portable Export dependency bundle은 아직 승인/구현 전이다. 현재 Photography Public에는 연결하지 않는다.
