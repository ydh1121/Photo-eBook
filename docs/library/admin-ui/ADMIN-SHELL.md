# Platform Management UI Contract

Status: active

## 관리 제품의 네 역할

관리 셸은 다음 네 화면만 1급 제품 역할로 노출한다.

1. `UI 라이브러리` `/ui-dashboard/`
   - 승인된 공통 모듈 UI Kit
2. `블록 연구실` `/block-lab/`
   - 신규 블록 연구와 논의
3. `블록 에디터` `/block-editor/`
   - 승인 모듈로 페이지 조립, 저장, 분류
4. `QA` `/qa/video-editor/`
   - 발행 전 최종 화면 검수

기존 `화면 구성` 메뉴와 `/ui-dashboard/?view=library` 이중 모드는 폐기한다.

## 공통 관리자 셸

모든 관리 화면은 동일한 관리자 셸을 사용한다.

PC와 모바일에서 메뉴 순서와 명칭을 유지한다. 현재 화면은 한 항목만 active 상태여야 한다.

관리 화면 로컬 툴바에서 다른 관리 화면으로 이동하는 중복 링크를 최소화한다. 전역 이동은 관리자 셸이 담당한다.

공개 페이지 링크는 작업 surface와 분리해 외부 확인용으로 제공한다.

## UI 라이브러리

`/ui-dashboard/`는 승인 모듈 catalog와 preview에 집중한다.

- Registry approved 모듈만 표시
- 테마/PC/모바일 확인
- capability settings 확인
- provenance 표시
- shared module preview 사용

페이지 순서 조립, 광고 배치, candidate 연구 기능을 두지 않는다.

## 블록 연구실

`/block-lab/`는 research-only surface다.

- candidate block
- variant
- style experiment
- 사용자/GPT 검토
- promotion 판단

이 화면의 코드와 샘플 데이터는 Library/Editor의 dependency가 아니다.

승격 시 연구실 파일을 공유하는 것이 아니라 재사용 가능한 결과를 canonical `PlatformModuleRegistry` 코드로 추출한다.

## 블록 에디터

Canonical route는 `/block-editor/`다. 기존 `/editor-lab/`는 호환 route로만 유지할 수 있다.

에디터의 insertion catalog는 `PlatformModuleRegistry.listFor('editor')`에서 가져온 approved module만 표시한다.

페이지 인스턴스는 `module id + props`를 저장한다. Block Lab sample object를 저장하지 않는다.

페이지 설정, SEO, AI 작업 기준, revision, 발행 준비 같은 page-level 기능은 에디터가 계속 소유한다.

## QA

QA는 발행 직전 페이지를 검사한다.

- approved module 사용 여부
- responsive
- theme
- interaction
- overflow
- public renderer parity
- noindex/index 정책

연구실 candidate를 QA에서 production 승인으로 자동 승격하지 않는다.

## 시각 원칙

- 전역 이동과 로컬 작업을 같은 컨트롤 묶음에 섞지 않는다.
- 화면마다 다른 제품처럼 보이는 중복 브랜드 헤더를 만들지 않는다.
- 관리 chrome보다 작업 대상이 우선한다.
- radius, typography, control hierarchy는 공통 admin token을 따른다.
- 좁은 화면에서도 역할 메뉴를 임의로 숨기지 않는다.

## 안전 경계

- 관리 화면은 noindex를 유지한다.
- Block Lab은 Library/Editor/Public에 직접 import되지 않는다.
- Library는 Public user data를 읽지 않는다.
- Editor는 approved canonical module만 조립한다.
- Public은 Registry에서 approved + public consumer가 허용된 모듈만 사용할 수 있다.
- candidate 자동 승인과 자동 publish를 금지한다.

상세 module promotion contract는 `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`를 따른다.
