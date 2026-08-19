# Platform Library V1 Handoff

이 파일은 새 채팅/세션에서도 현재 작업을 추측 없이 이어가기 위한 canonical handoff다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

새 세션은 반드시 `AGENTS.md → TASKS.md → 이 HANDOFF.md → main 최신 commit` 순서로 읽는다.

## Current architecture

콘텐츠/UI 관리는 다음 계층으로 분리돼 있다.

1. Content Block type
2. Block variant — 구조/표현/동작/반응형 차이
3. Block Style preset — 같은 구조 안에서 제한된 디자인 공식
4. UI Capability — 상단 메뉴, filter, rail, bottom sheet 같은 페이지 공통 기능
5. UI Capability preset
6. Shared Primitive
7. Industry/content-pack specific logic

raw CSS를 preset 데이터로 저장하지 않는다.

## Current publish architecture — Snapshot V2

Canonical publish implementation:
- `functions/lib/publish-v2.js`
- `functions/api/editor/publish-check.js`
- `functions/api/editor/publish.js`

Snapshot storage:
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`
- `PUBLISHED_BLOCK_STYLES`
- `PUBLISHED_UI_CONFIG`

Public read/runtime:
- `/api/public/snapshot-v2?slug=...`
- `public/assets/js/public-snapshot/runtime-v2.js`
- staging: `/staging/snapshot-v2.html`

발행 시점의 Block style과 Page UI config를 resolved 값으로 고정한다. 나중에 preset 원본이 바뀌어도 과거 snapshot 디자인이 변하지 않는다.

Public API는 active snapshot만 반환한다. `fetchAndRender()`로 API에서 받은 active snapshot은 서버 publish gate를 이미 통과한 결과로 신뢰하며, 브라우저에서는 구조 유효성만 다시 검사한다. 직접 주입하는 candidate staging payload는 별도 `allowCandidate` 경로를 사용한다.

## Publish approval gate

자동 승인은 금지한다.

현재 gate:
- known Block type + variant
- `BLOCK_VARIANT_REVIEWS`의 저장된 variant 판정 우선
- 저장된 판정이 없으면 static candidate registry fallback
- variant decision이 `approved`여야 통과
- 선택한 Block Style preset이 있으면 해당 type+variant와 일치 + `approved`
- enabled Page UI는 preset 필수 + capability 일치 + `approved`
- AI fact state / evidence 조건 유지
- SEO / slug / active slug conflict 검사 유지

중요: Block Lab에서 사용자가 variant를 `승인`하고 서버에 저장하면 publish gate가 그 Sheet 판정을 실제로 읽는다.

## Block Lab

Route: `/block-lab/`
Status: candidate lab / noindex.

현재:
- 27 Block type
- type 단위 review + memo
- variant 단위 review + memo
- variant 차이 유형: structure / visual / behavior / responsive
- maturity: implemented / partial / placeholder
- constrained Block Style preset editor
- style preset local/server save/load
- Block Style preset lifecycle: `draft / approved / redesign / deprecated`
- server sync: BLOCK_REVIEWS + BLOCK_VARIANT_REVIEWS + BLOCK_STYLE_PRESETS

Photography built-in Style preset 12개가 `BLOCK_STYLE_PRESETS`에 seed돼 있으며 모두 자동 승인하지 않고 `draft`로 시작한다.

## Photography advanced Block parity

Permanent classification:
- `docs/library/blocks/photography/PARITY-V1.md`

새 candidate advanced variants:
- `hero / immersive-metrics`
- `chapter-hero / image-overlay`
- `comparison-cards / visual-metrics`
- `roadmap / metric-cards`

Files:
- `public/data/block-registry/v1/manifest.js` v2
- `public/data/block-registry/v1/variant-meta.js` v2
- `functions/lib/block-variants-v1.js`
- `public/assets/js/blocks/block-renderers-parity.js`
- `public/assets/styles/block-lab/photography-parity-v1.css`
- `public/assets/js/block-lab/lab-parity-data.js`

Photography production renderer 자체는 변경하지 않는다.

## Block Style preset

Contract:
- `docs/library/blocks/STYLE-PRESET-CONTRACT.md`

Tokens:
- density
- surface
- radius
- border
- shadow
- accentMode
- mediaRatio
- edgeTreatment

Draft storage:
- `BLOCK_STYLE_PRESETS`
- `PAGE_BLOCKS` N/O: `style_preset_id`, `style_overrides_json`

Immutable publish storage:
- `PUBLISHED_BLOCK_STYLES`

Shared runtime:
- `public/assets/js/blocks/block-style-runtime.js`
- `public/assets/styles/blocks/style-runtime.css`

Editor:
- `public/assets/js/editor-lab/block-style.js`
- current type + variant에 맞는 preset만 표시
- 선택값은 Editor draft에 저장
- Canvas immediate preview
- server preset merge

Snapshot preview/rollback도 발행 당시 resolved style을 보존한다.

## UI Capability / Design Dashboard

Route: `/ui-dashboard/`
Status: noindex.

Current 7 capability:
1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

Storage/API:
- `UI_PRESETS`
- `/api/editor/ui-presets`
- `PAGE_UI_CONFIG`
- `/api/editor/page-ui`
- immutable publish: `PUBLISHED_UI_CONFIG`

Built-in photography/system UI preset 8개가 Sheet에 seed돼 있고 모두 `draft`에서 시작한다.

Dashboard:
- custom preset save/load/export
- preset lifecycle: `draft / approved / redesign / deprecated`
- server sync

Public runtime:
- `public/assets/js/ui-capabilities/runtime.js`
- `public/assets/styles/ui-capabilities/runtime.css`
- Snapshot V2가 resolved capability context를 전달
- horizontal-card-rail은 현재 generic surface에 실제 적용
- top nav / bottom sheet 등은 generic surface가 준비되는 순서대로 연결

## Editor / DB

Editor supports:
- page/block editing
- server draft save/load
- SEO
- AI brief/response/review
- revisions
- publish history
- snapshot preview/rollback
- Page UI preset assignment
- Block Style preset assignment

Protected APIs require same-origin + Bearer `ADMIN_EDITOR_TOKEN`.
Token 미설정 시 closed.

Cloudflare live authenticated QA는 아직 token secret 설정이 필요하다.

## First non-photography QA

Page: `page_video_editor_qa_v1`
slug: `video-editor`
state: draft / noindex / needs_review
13 blocks in Sheets.

Routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/staging/snapshot-v2.html`

User iPhone QA:
- product-tool/list narrow-column bug 수정 후 정상화 확인
- QA wrapper 내부 선 token 회귀 수정

남은 content QA:
- 시장수요/실제 단가 evidence
- 계약/세금/platform policy/license evidence

## Production safety invariants

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Safari deferred sticky fix 건드리지 않는다.
- mobile native horizontal scroll owner 유지.
- 사용자 review 전 Block/variant/style/UI preset 자동 승인 금지.
- candidate production publish 차단.
- labs/dashboard/QA/staging noindex.
- public snapshot API는 active snapshot만 반환하고 draft 반환 금지.
- active API snapshot만 browser trusted-published 경로 사용.

## CI

Workflow: `.github/workflows/platform-library-checks.yml`

Checks:
- Block type browser/server sync
- Block variant browser/server sync
- UI Capability browser/server sync
- video-editor QA seed
- Block Lab / Editor / UI runtime / UI Dashboard / Public Snapshot / Functions syntax

GitHub connector는 push workflow run/check-run을 현재 노출하지 않으므로 최신 success를 성공으로 추정하지 않는다.

## Exact next action

1. current `main` 확인.
2. Snapshot V2를 canonical public route에 안전하게 연결한다.
3. canonical route와 함께 sitemap / real 404를 설계한다.
4. generic surface가 있는 UI Capability부터 runtime 실제 적용 범위를 늘린다.
5. 사용자 `/block-lab/` + `/ui-dashboard/` review 결과를 server `approved` 상태로 저장한다.
6. approval 이후 production Editor approved-only 최종 모드를 켠다.
7. video-editor 남은 evidence를 채운다.
8. `ADMIN_EDITOR_TOKEN` 설정 후 authenticated Editor→publish→public→rollback live QA.

## Current user checkpoints

- `/block-lab/`: type/variant/style preset 실제 디자인 검토
- `/ui-dashboard/`: Page UI capability/preset 검토
- `/qa/video-editor/`: 비사진 분야 전체 흐름 검토
- `/staging/snapshot-v2.html`: immutable style/UI가 포함된 공개형 V2 검토
- Cloudflare `ADMIN_EDITOR_TOKEN` 설정 후 protected live QA

## V1 completion target

- Block/variant/style preset 최종 승인
- UI Capability/preset dashboard 실사용
- Editor에서 Block + Page UI 구성/저장/복원
- photography 고도화 design asset을 공통 공식으로 안전하게 추출
- 비사진 산업 1개 draft→AI→human review→publish→rollback
- public renderer/canonical/SEO/sitemap/404
- PC/mobile/CWV/ad side rail QA
- workstream QA Drive archive
