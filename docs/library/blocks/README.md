# Platform Block Library

이 폴더는 `먹고살기` 플랫폼의 콘텐츠 페이지를 구성하는 편집 가능한 UI Block의 canonical 설계 문서다.

`docs/spec-v1/04-component-registry.md`는 selector와 runtime component를 기록한다. 이 Block Library는 그보다 상위의 **콘텐츠 편집 단위**를 정의한다.

## 세 계층

### 1. Content Block
관리자 Block Editor에서 추가, 삭제, 복제, 정렬, 내용 수정할 수 있는 단위.

예:
- hero
- comparison
- checklist
- roadmap
- case study

### 2. Primitive
Block 내부에서 공통 재사용하지만 관리자가 독립 콘텐츠 블록으로 배치하지 않는 요소.

예:
- badge
- bookmark button
- copy button
- image source badge
- loading sentinel
- metric cell
- callout key

### 3. Platform Chrome
콘텐츠가 아니라 사이트 자체의 탐색·저장·질문·설정 기능.

예:
- chapter navigation
- collection FAB/sheet
- question workspace
- theme selector
- Safari browser-chrome 대응

Platform Chrome는 산업 pack의 block 배열에 넣지 않는다.

## 문서

- `V1-INVENTORY.md` — 현재 photography 화면에서 추출한 block family와 통합 판단
- `BLOCK-CONTRACT.md` — 모든 block이 따를 데이터/상태/반응형/접근성 계약

## Block Lab

검토 route:
- `/block-lab/`
- 검색 노출 제외(`noindex,nofollow,noarchive`)

관련 코드:
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-app.js`
- `public/assets/styles/block-lab/`

현재 Block Lab renderer는 **candidate**다. 기존 photography production renderer는 아직 교체하지 않는다.

Block Lab에서 가독성, 정보 구조, mobile/desktop, light/dark, variant를 검토하고 block이 `approved` 상태가 된 뒤 production과 관리자 preview의 canonical renderer로 승격한다.

## V1 목표

현재 photography에서 추출한 17개 block family를 기준으로 시작한다. Block Lab에서 실제 가독성과 재사용성을 검토하면서 필요한 범용 block을 추가한다.

초기 목표는 약 25개이며 숫자를 맞추기 위해 불필요한 block을 만들지는 않는다.

## 설계 원칙

- block type은 산업 이름을 포함하지 않는다.
- 사진용 문구와 검색 규칙은 photography pack에 둔다.
- block은 데이터와 renderer를 분리한다.
- 최종적으로 Block Lab, production, 관리자 preview가 같은 renderer 계약을 사용한다.
- 디자인 variant는 제한된 enum으로 관리하고 임의 CSS 입력을 허용하지 않는다.
- 모바일/PC는 같은 콘텐츠를 사용하고 responsive layout만 달라진다.
- 외부 reference는 `referenceProfiles`, 문장 규칙은 `editorialProfile`로 연결한다.
- 아직 승인되지 않은 block은 production 신규 페이지에서 사용하지 않는다.
