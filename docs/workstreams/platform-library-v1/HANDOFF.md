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
- server sync: BLOCK_REVIEWS + BLOCK_VARIANT_REVIEWS + BLOCK_STYLE_PRESETS

모든 Block type은 아직 server status `candidate`. 자동 승인 금지.

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

`/block-lab/`, `/qa/video-editor/`, `/staging/public-renderer/`, Editor candidate runtime에서 parity renderer를 사용할 수 있게 준비돼 있다.

Photography production renderer 자체는 변경하지 않았다.

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

Storage:
- Sheet `BLOCK_STYLE_PRESETS`
- `PAGE_BLOCKS` N/O: `style_preset_id`, `style_overrides_json`

API:
- `/api/editor/block-style-presets`
- exact `/api/editor/save-page` now writes A:O and includes style fields in change detection/revisions
- exact `/api/editor/page` now returns stylePresetId/styleOverrides

Shared runtime:
- `public/assets/js/blocks/block-style-runtime.js`
- `public/assets/styles/blocks/style-runtime.css`

Editor:
- `public/assets/js/editor-lab/block-style.js`
- `public/assets/styles/editor-lab/block-style.css`
- current block type + variant에 맞는 preset만 표시
- 선택값은 normal Editor field path를 통해 변경되어 undo/redo/save 흐름을 유지
- Canvas에 constrained style 즉시 적용
- server preset이 있으면 관리자 token 세션에서 merge load
- MutationObserver self-loop 방지 처리 완료

아직 미완료:
- publish snapshot에 resolved style preset 저장
- public runtime에서 snapshot style 적용
- publish gate에서 style preset approval 검사

## UI Capability / Design Dashboard

Route: `/ui-dashboard/`
Status: noindex + robots exclude.

Current 7 capability:
1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

Files:
- `public/data/ui-capabilities/v1/manifest.js` v2
- `functions/lib/ui-capabilities-v1.js`
- `public/ui-dashboard/index.html`
- `public/assets/js/ui-dashboard/dashboard.js`
- `public/assets/styles/ui-dashboard/dashboard.css`
- `public/assets/styles/ui-dashboard/parity-v2.css`
- server sync files

Storage/API:
- Sheet `UI_PRESETS`
- `/api/editor/ui-presets`
- Sheet `PAGE_UI_CONFIG`
- `/api/editor/page-ui`

Editor left panel has `페이지 UI` capability on/off + preset selection + server load/save.

아직 미완료:
- PAGE_UI_CONFIG를 publish snapshot에 immutable resolved config로 넣기
- production public runtime에서 capability config 실제 적용

## Photography UI Capability parity extracted

Permanent docs:
- `docs/library/ui-capabilities/photography/top-chapter-navigation-v1.md`
- `horizontal-card-rail-v1.md`
- `collection-bottom-sheet-v1.md`
- `device-handoff-accordion-v1.md`

### Top nav key production values
- mobile native horizontal scroll owner
- iOS Safari initial normal-flow + deferred sticky invariant 유지
- chip gap mobile 6px / desktop 약 9px
- selected liquid easing: `cubic-bezier(0.34,1.56,0.64,1)`
- nav durationScale 1.10
- chapter progress is measured chip/chapter geometry wash, not simple document percentage
- photography dashboard preset updated to actual direction

### Horizontal rail key production values
- mobile native scroll invariant
- PC mouse drag >=1024 only
- drag threshold 5px
- post-drag click suppression 220ms
- left shadow runway 16px
- right alpha-mask fade 112px
- right content padding 122px
- scrollbar hidden
- blur overlay fade 금지; Chromium seam 회귀 때문에 continuous alpha mask 사용

### Collection sheet/filter
- max width 760px
- max height 84dvh
- top radius 30px
- sheet blur 26px / saturate 135%
- backdrop blur 12px
- primary tab and secondary filter role 분리
- current photography secondary filters are flat pills, not moving liquid

### Device handoff accordion
- FAQ와 별도 capability
- persistent outer shell
- measured scrollHeight animation
- copy/connect/status controls
- aria-expanded/aria-hidden/inert/keyboard semantics

## Editor / DB

Existing V1 DB tabs:
- PLATFORM_PAGES
- PAGE_BLOCKS
- BLOCK_REVISIONS
- BLOCK_REVIEWS
- BLOCK_VARIANT_REVIEWS
- BLOCK_STYLE_PRESETS
- UI_PRESETS
- PAGE_UI_CONFIG
- MEDIA_ASSETS
- PUBLISH_SNAPSHOTS
- PUBLISHED_BLOCKS

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

User iPhone QA:
- image 없는 product-tool/list narrow-column bug 수정 후 정상화 확인.
- QA wrapper `--lab-*` token 누락으로 내부 선이 사라지던 원인 확인 및 수정.

## Production safety invariants

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Safari deferred sticky fix 건드리지 않는다.
- 사용자 review 전 Block/variant 자동 승인 금지.
- candidate production publish 계속 차단.
- labs/dashboard/QA/staging noindex.
- public snapshot API는 active snapshot만 반환하고 draft 반환 금지.

## CI

Workflow: `.github/workflows/platform-library-checks.yml`

Checks:
- Block type browser/server sync
- Block variant browser/server sync
- UI Capability browser/server sync
- video-editor QA seed
- Block Lab / Editor / UI Dashboard / Functions syntax

최신 workflow success는 connector로 아직 검증하지 못했으므로 성공으로 추정하지 않는다.

## Exact next action

1. current `main` 확인.
2. publish snapshot schema 확장:
   - `PUBLISHED_BLOCKS`에 style preset/resolved style
   - `PUBLISH_SNAPSHOTS`에 resolved page UI config
3. exact publish-check/publish API로 catch-all publish logic 분리 검토.
4. publish gate를 `type + variant + approved style preset` 기준으로 확장할 준비.
5. public snapshot API/runtime이 resolved Block style을 적용하도록 연결.
6. UI Capability resolved config를 snapshot/public runtime에 연결.
7. Photography parity에서 기존 variant 고도화용 built-in Style presets 추가.
8. 사용자 `/block-lab/`, `/ui-dashboard/` 검토 결과 반영.

## Current user checkpoints

- `/block-lab/`: type/variant/style preset별 실제 디자인 검토
- `/ui-dashboard/`: PC/mobile capability/preset 검토
- `/qa/video-editor/`: 전체 페이지 흐름 검토
- `/staging/public-renderer/`: 공개형 검토
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
