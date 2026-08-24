# UI Library Contract

Status: active / legacy Visual Builder architecture retired

이 파일명은 기존 문서 링크 호환을 위해 유지한다. 현재 canonical architecture는 `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`다.

## 역할 변경

기존 `/ui-dashboard/`의 `화면 구성 → sandbox → UI 추출` 구조는 폐기한다.

현재 `/ui-dashboard/`는 **UI 라이브러리** 하나의 역할만 가진다.

- 연구 공간이 아니다.
- 페이지 편집기가 아니다.
- 공개 페이지 DOM을 임시로 뜯어내는 extractor가 아니다.
- 승인된 `PlatformModuleRegistry` 모듈을 한 번에 하나씩 실행하는 UI Kit다.

페이지 조립은 `/block-editor/`, 신규 블록 연구는 `/block-lab/`가 담당한다.

## Library source

목록 source:

`window.PlatformModuleRegistry.listFor('library')`

Library에 나타나는 모듈은 모두 다음 조건을 충족해야 한다.

- `status: approved`
- `consumers`에 `library` 포함
- provenance가 `public-extracted`, `block-lab-approved`, `platform-core` 중 하나

Candidate는 보이지 않는다.

## Shared runtime

Library preview route:

`/ui-dashboard/module-preview/?module=<id>&embed=library`

Block Editor 역시 동일 preview host를 `embed=editor`로 사용한다.

따라서 Library와 Editor의 동일 모듈은 같은 `render()/hydrate()` owner를 실행한다.

Preview CSS는 neutral background, centering, viewport isolation만 담당한다. 실제 UI skin을 별도로 그리지 않는다.

## 현재 Library set

첫 public-extracted set:

- 상단 메뉴 `top-chapter-navigation`
- 범용 필터칩 `filter-chip-rail`
- 가로 카드 `horizontal-card-rail`
- 하단 팝업 `collection-bottom-sheet`
- 다른 기기 `device-handoff-accordion`
- 플로팅 버튼 `floating-action`

목록을 문서나 controller에 별도 하드코딩하지 않는다. Registry가 추가/승격되면 Library catalog가 따라간다.

## Controls

Library는 공통 module 자체와 capability control을 구분한다.

- module definition: 구조, source, consumer, render/hydrate owner
- capability config: 표현, spacing, motion처럼 조절 가능한 값

테마와 viewport는 Library 공통 control이다.

- 화이트
- 다크
- 시스템
- PC
- 모바일

Filter sample item 같은 preview-only 입력은 production content가 아니다.

## Storage isolation

Library preview는 공개 사용자의 질문, 저장 목록, device id, theme preference를 오염시키지 않는다.

Preview용 local state는 관리 UI 범위에서만 사용한다. Public user storage를 canonical source로 사용하지 않는다.

## Retired paths

다음 개념은 더 이상 product architecture가 아니다.

- `/ui-dashboard/` 화면 구성 모드
- `/ui-dashboard/?view=library` 이중 모드
- `/ui-dashboard/sandbox/`를 Library source로 사용
- 전체 더미 페이지에서 DOM을 추출해 Library specimen으로 이동
- `reference-preview`를 별도 component runtime으로 유지
- Block Registry candidate를 화면 구성 palette에서 바로 조립

기존 파일이 migration/비교 목적으로 잠시 남아 있어도 active Library/Editor가 이를 import하면 안 된다.

## Promotion

Public 출발:

`Public complete UI → common module extraction → approved/public-extracted → Library → Editor`

Block Lab 출발:

`Block Lab research → user + GPT review → common module extraction → approved/block-lab-approved → Library → Editor`

Public publish는 Editor와 QA를 통과한 결과가 소비한다.

## QA

최소 검사:

1. `/ui-dashboard/`가 Registry approved module만 표시하는가
2. sandbox/reference-preview를 로드하지 않는가
3. Library와 Editor가 같은 `/ui-dashboard/module-preview/`를 사용하는가
4. 각 module provenance가 보존되는가
5. filter labels에 `[object Object]` 같은 data-shape 회귀가 없는가
6. PC/mobile/theme에서 outer scrollbar나 preview overflow가 생기지 않는가
7. Block Lab runtime/data/style이 Library와 Editor에 직접 들어오지 않는가
8. Public consumer가 candidate를 사용할 수 없는가
