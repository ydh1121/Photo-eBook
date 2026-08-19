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

- `V1-INVENTORY.md` — photography에서 추출한 기존 17개 block family와 통합 판단
- `V1-EXPANSION.md` — 여러 산업 확장을 위해 추가한 10개 candidate와 보류 판단
- `BLOCK-CONTRACT.md` — 모든 block이 따를 데이터/상태/반응형/접근성 계약
- `APPROVAL-WORKFLOW.md` — candidate를 검토하고 production-approved로 승격하는 절차

## Canonical Registry

runtime manifest:
- `public/data/block-registry/v1/manifest.js`

runtime validation:
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-registry-health.js`

manifest와 renderer의 type/variant가 맞는지 Block Lab에서 확인한다.

production validation은 manifest lifecycle이 `approved`인 type만 통과하도록 설계했다. 현재 27개는 사용자 시각 검토 전이므로 `candidate` 상태다.

## Block Lab

검토 route:
- `/block-lab/`
- 검색 노출 제외(`noindex,nofollow,noarchive`)

관련 코드:
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/blocks/block-renderers-extended.js`
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-data-extended.js`
- `public/assets/js/block-lab/lab-interactions-extended.js`
- `public/assets/js/block-lab/lab-app.js`
- `public/assets/js/block-lab/lab-review.js`
- `public/assets/styles/block-lab/`

현재 Block Lab에는 **27개 candidate family**가 있다.

각 block에서:
- variant 확인
- Light/Dark 확인
- Fit/390/768/1180 확인
- `승인 / 재설계 / 통합 / 폐기` 선택
- 검토 메모 저장
- review JSON 내보내기
가 가능하다.

검토 결과는 브라우저 localStorage에 임시 저장한다. 사용자가 내보낸 review 결과를 확인한 뒤 Git manifest lifecycle을 변경한다.

현재 Block Lab renderer는 **candidate**다. 기존 photography production renderer는 아직 교체하지 않는다.

## Editor Lab

편집 실험 route:
- `/editor-lab/`
- 검색 노출 제외
- production 저장 API와 미연결

현재 기능:
- 27개 block 추가
- drag-and-drop 및 위/아래 이동
- 복제/삭제
- variant 변경
- content field 편집
- Light/Dark
- 390/768/1180 preview
- 편집/미리보기 전환
- undo/redo
- JSON import/export
- 브라우저 localStorage draft

저장 구조와 향후 관리자 API는 `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`를 따른다.

## V1 구성

- photography에서 추출: 17개
- 신규 범용 candidate: 10개
- 합계: 27개

숫자를 맞추기 위해 중복 block을 만들지 않는다. KPI/stat은 `metric-grid`에 통합했고 지도는 provider/API 계약 전까지 보류했다.

## UI Refinement

Block Lab에는 production과 분리된 정제 레이어가 적용된다.

- `refinement-v2.css` — 기존 17개 block의 hierarchy, spacing, surface, rail, roadmap 등을 정제
- `new-blocks-v2.css` — 신규 10개 block

핵심 방향은 `docs/library/design-taste/PLATFORM-TASTES.md`를 따른다.

## 설계 원칙

- block type은 산업 이름을 포함하지 않는다.
- 사진용 문구와 검색 규칙은 photography pack에 둔다.
- block은 데이터와 renderer를 분리한다.
- 최종적으로 Block Lab, production, 관리자 preview가 같은 renderer 계약을 사용한다.
- 디자인 variant는 제한된 enum으로 관리하고 임의 CSS 입력을 허용하지 않는다.
- 모바일/PC는 같은 콘텐츠를 사용하고 responsive layout만 달라진다.
- 외부 reference는 `referenceProfiles`, 문장 규칙은 `editorialProfile`로 연결한다.
- 아직 승인되지 않은 block은 production 신규 페이지에서 사용하지 않는다.
