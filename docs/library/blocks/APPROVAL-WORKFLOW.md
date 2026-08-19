# Block Approval Workflow V1

Block Lab의 candidate를 production에서 사용할 수 있는 approved block으로 승격하는 절차다.

## 1. 두 종류의 상태를 구분한다

### Registry lifecycle

Block type 자체의 제품 상태다.

- `draft`
- `candidate`
- `reviewing`
- `approved`
- `deprecated`

production 신규 페이지에서 사용할 수 있는 상태는 기본적으로 `approved`뿐이다.

### Review decision

사용자가 Block Lab을 보면서 내리는 판정이다.

- `undecided` — 아직 판단하지 않음
- `approved` — 현재 방향으로 승인 후보
- `redesign` — 같은 정보 목적은 유지하되 UI 재설계 필요
- `merge` — 다른 block type/variant와 통합
- `deprecated` — V1에서 사용하지 않음

`redesign`, `merge`는 Registry lifecycle 상태가 아니다.

## 2. Block Lab 검토

`/block-lab/`에서 각 block type마다:

1. Light/Dark 확인
2. Fit/390/768/1180 확인
3. 제공된 variants 확인
4. 정보 위계와 가독성 확인
5. 가로 rail/표/interaction이 있는 경우 실제 조작 확인
6. `승인 / 재설계 / 통합 / 폐기` 판정
7. 필요하면 메모 기록

검토 상태와 메모는 `platformBlockReviewV1` localStorage에 저장한다.

`검토 내보내기`를 누르면 `platform-block-review-YYYY-MM-DD.json`을 만들고 가능한 경우 같은 JSON을 clipboard에도 복사한다.

## 3. Registry 반영

사용자 review JSON을 받은 뒤 Git에서 다음 순서로 반영한다.

### approved

- 관련 visual/interaction QA가 통과했는지 확인
- schema/variant를 최종 확정
- manifest lifecycle을 `approved`로 변경
- production validation allowlist에 포함

### redesign

- 기존 type id 유지 여부 판단
- 정보 목적이 같으면 type은 유지하고 renderer/variant를 수정
- 다시 Block Lab에서 사용자 검토

### merge

- 통합 대상 type을 메모에 명시
- content migration 규칙 정의
- 기존 type은 바로 삭제하지 않고 deprecation alias 기간을 둠

### deprecated

- 신규 pack 선택 목록에서 제외
- 기존 published content가 있으면 renderer compatibility를 유지할 수 있음
- 안전하게 migration이 끝난 뒤 제거

## 4. 자동 승인 금지

다음은 승인 근거가 아니다.

- 코드가 오류 없이 실행됨
- 외부 reference와 유사함
- AI가 보기 좋다고 판단함
- 한 화면 폭에서만 정상임
- sample content가 잘 맞음

사용자의 실제 화면 검토가 필요한 candidate는 자동으로 `approved`로 변경하지 않는다.

## 5. Canonical files

- runtime manifest: `public/data/block-registry/v1/manifest.js`
- renderer definitions: `public/assets/js/blocks/`
- Block contract: `docs/library/blocks/BLOCK-CONTRACT.md`
- 이 approval workflow: `docs/library/blocks/APPROVAL-WORKFLOW.md`

향후 관리자 Block Editor의 block picker는 canonical registry에서 `approved` 상태만 기본 노출한다. 관리자 개발/실험 모드에서만 candidate를 별도로 볼 수 있다.

## 6. Production validation

신규 산업 pack publish 시 최소 확인:

- type이 manifest에 존재하는가
- type lifecycle이 `approved`인가
- variant가 해당 type의 허용 목록에 포함되는가
- 필수 content field가 schema를 만족하는가
- evidence가 필요한 field의 검증 상태가 적절한가

기존 photography production renderer는 Block Registry 전환이 완료될 때까지 legacy-compatible 경로를 유지한다.
