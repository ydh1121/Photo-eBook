# Platform Library V1 Handoff

이 파일은 새 채팅/세션에서도 현재 작업을 추측 없이 이어가기 위한 canonical handoff다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

- Block Lab은 이제 **Block type → variant → style preset** 3단계로 검토/관리한다.
- 페이지 공통 기능은 Content Block과 분리한 **UI Capability / preset** 체계로 관리한다.
- `/ui-dashboard/`에서 상단 메뉴, 카드 rail, 필터칩, 하단 팝업, 다른 기기 연결 accordion, 읽기 진행선, floating action을 관리하는 scaffold가 구현됨.
- Editor에는 `페이지 UI` 영역이 추가돼 capability on/off와 preset을 페이지별로 저장할 수 있음.
- 다음 큰 작업은 **Photography Parity**: 현재 photography production의 고도화 UI를 advanced Block variant / Block style preset / shared primitive / UI capability preset으로 역추출하는 것.

## 절대 유지할 production safety

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Safari deferred-sticky/normal-flow fix를 건드리지 않는다.
- Block/variant는 사용자 판정 전 자동 승인하지 않는다.
- candidate를 포함한 production publish는 계속 차단한다.
- labs/dashboard/qa/staging은 noindex + robots exclude.
- `/api/editor/*`는 `ADMIN_EDITOR_TOKEN` 없으면 닫혀 있어야 한다.
- public snapshot API는 active snapshot만 반환하고 draft를 반환하지 않는다.

## Block Lab current state

Route: `/block-lab/`

### Block type review
기존 유지:
- undecided / approved / redesign / merge / deprecated
- type-level memo
- `BLOCK_REVIEWS`

### Variant review — 신규
Files:
- `public/data/block-registry/v1/variant-meta.js`
- `public/assets/js/block-lab/lab-variant-review.js`
- `public/assets/styles/block-lab/variant-review.css`
- `functions/lib/block-variants-v1.js`
- `functions/api/editor/variant-reviews.js`

Sheet:
- `BLOCK_VARIANT_REVIEWS`

동작:
- variant별 독립 판정과 메모
- 차이 유형: structure / visual / behavior / responsive
- maturity: implemented / partial / placeholder
- 모바일에서 구조가 수렴하는 variant 이유를 표시
- Block Lab 서버 load/save가 type + variant review를 함께 동기화

주의:
- 일부 variant는 의도적으로 `partial` 또는 `placeholder`로 표시됨.
- all Block type server status는 여전히 candidate.

### Block Style preset — 신규
Files:
- `docs/library/blocks/STYLE-PRESET-CONTRACT.md`
- `public/data/block-styles/v1/manifest.js`
- `public/assets/js/block-lab/lab-style-presets.js`
- `public/assets/styles/block-lab/style-presets.css`
- `functions/lib/block-style-v1.js`
- `functions/api/editor/block-style-presets.js`

Sheet:
- `BLOCK_STYLE_PRESETS`

허용 token:
- density
- surface
- radius
- border
- shadow
- accentMode
- mediaRatio
- edgeTreatment

원칙:
- raw CSS 저장 금지
- 구조 변경은 Style preset이 아니라 variant
- Block Lab에서 현재 style 조정 → 이름 저장 → 다시 불러오기 가능
- Block Lab 서버 `검토 저장/불러오기`에 style preset도 포함

Browser Block normalize는 `stylePresetId/styleOverrides`를 보존하도록 확장됨.
`PAGE_BLOCKS`에는 `style_preset_id`, `style_overrides_json` 컬럼을 예약함.

중요 미완료:
- `/api/editor/save-page`는 아직 A:M만 처리하므로 stylePresetId/styleOverrides 서버 round-trip을 열지 않음.
- 이 두 필드는 다음 저장-contract 변경에서 A:O로 일괄 연결해야 함.
- public renderer도 아직 style preset을 적용하지 않음.

## UI Capability Library — 신규
Permanent docs:
- `docs/library/ui-capabilities/README.md`
- `CAPABILITY-CONTRACT.md`
- `PHOTOGRAPHY-PARITY.md`

Browser manifest:
- `public/data/ui-capabilities/v1/manifest.js`

Server registry:
- `functions/lib/ui-capabilities-v1.js`

현재 7 capability:
1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

사진 production owner 예시:
- top nav state: `assets/js/navigation/chapter-navigation.js`
- liquid selector: `assets/js/ui/liquid-controller.js`
- device handoff accordion: `assets/js/collection/device-handoff.js`
- Safari deferred sticky layer는 capability보다 상위 invariant

특히:
- FAQ accordion과 device-handoff accordion은 다른 기능으로 유지.
- card rail은 mobile native scroll이 owner이고 desktop mouse drag만 보강.

## UI Dashboard — 신규

Route: `/ui-dashboard/`
noindex + robots disallow.

Files:
- `public/ui-dashboard/index.html`
- `public/assets/styles/ui-dashboard/dashboard.css`
- `public/assets/js/ui-dashboard/dashboard.js`
- `public/assets/styles/ui-dashboard/server.css`
- `public/assets/js/ui-dashboard/server.js`

기능:
- capability별 live specimen
- schema 기반 설정 control
- system preset + user preset
- user preset 이름 저장/불러오기/export
- server connect/load/save

Sheet/API:
- `UI_PRESETS`
- `/api/editor/ui-presets`

현재 manifest에 photography-derived 기본 preset도 들어 있음.
향후 실제 photography 값을 정확히 역추출해 교체/보강해야 함.

## Page UI assignment — 신규

Sheet:
- `PAGE_UI_CONFIG`

API:
- `/api/editor/page-ui`

Editor extension:
- `public/assets/js/editor-lab/page-ui.js`
- `public/assets/styles/editor-lab/page-ui.css`
- `page-meta.js`가 manifest + page-ui extension을 동적으로 로드

Editor 왼쪽 `페이지 UI`에서:
- capability on/off
- preset 선택
- UI Dashboard 링크
- 서버 불러오기/저장

중요 미완료:
- public publish snapshot이 PAGE_UI_CONFIG를 아직 포함하지 않음.
- production runtime이 capability preset을 아직 실제 적용하지 않음.

## Google Sheets additions

새 tabs:
- BLOCK_VARIANT_REVIEWS
- BLOCK_STYLE_PRESETS
- UI_PRESETS
- PAGE_UI_CONFIG

기존 tabs 유지:
- PLATFORM_PAGES
- PAGE_BLOCKS
- BLOCK_REVISIONS
- BLOCK_REVIEWS
- MEDIA_ASSETS
- PUBLISH_SNAPSHOTS
- PUBLISHED_BLOCKS

## Mobile QA fixes already made

1. `product-tool/list` image 없는 카드가 모바일에서 빈 media column 때문에 좁아지던 버그 수정.
2. `/qa/video-editor/`에 `--lab-*` token mapping이 빠져 내부 구분선/roadmap line이 사라지던 버그 수정.

사용자가 첫 수정은 실제 iPhone에서 정상화 확인함.
두 번째 line fix는 배포 후 다시 확인 필요.

## First non-photo QA page

`page_video_editor_qa_v1`, slug `video-editor`, draft/noindex/needs_review.
13 blocks가 실제 Sheets에 존재.

Routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`

공식 evidence:
- Adobe Premiere
- Blackmagic DaVinci Resolve
- 고용24 영상편집 NCS/훈련

추가 evidence 필요:
- 시장수요/실제 단가
- 계약/세금
- 플랫폼 정책
- 음원/폰트/소스 라이선스

## CI

Workflow:
- `.github/workflows/platform-library-checks.yml`

현재 검사:
- browser/server Block type sync
- browser/server Block variant sync
- browser/server UI capability sync
- video-editor QA seed
- Block Lab / Editor / UI Dashboard / Functions syntax

Scripts:
- `scripts/check-block-registry-sync.mjs`
- `scripts/check-block-variant-sync.mjs`
- `scripts/check-ui-capability-sync.mjs`
- `scripts/check-platform-qa-seed.mjs`

최신 workflow run 성공 여부는 connector에서 아직 확인하지 못했으므로 성공으로 추정하지 않는다.

## Current checkpoints

사용자 확인 필요:
1. `/block-lab/`의 variant별 review UI와 style preset controls
2. `/ui-dashboard/` PC/mobile UI와 capability controls
3. `/qa/video-editor/` line fix 및 전체 흐름
4. `/staging/public-renderer/`
5. Cloudflare `ADMIN_EDITOR_TOKEN` 설정 후 protected API live QA

## Exact next action

새 세션은 다음 순서로 진행한다.

1. `main` 최신 commit 확인.
2. Photography production의 UI owner를 하나씩 읽음.
3. **Top chapter navigation부터 Photography Parity 추출 시작**:
   - 현재 실제 CSS/JS 값 확인
   - capability manifest의 `photo-topnav-blue-progress`를 실제 값으로 보정
   - Block Lab/UI Dashboard specimen과 production의 차이 기록
4. Horizontal rail → filter chips → bottom sheet → device handoff accordion 순서로 parity 진행.
5. 그 다음 photography Content Block을 hero부터 1:1 비교해서 advanced variant/style preset으로 추출.
6. 이후 `PAGE_BLOCKS` A:O style preset round-trip을 한 번에 연결.
7. variant별 사용자 승인 결과를 바탕으로 publish gate를 `type + variant`로 전환.

## V1 completion target

- Block/variant/style preset 최종 승인
- UI Capability/preset dashboard 실사용
- Editor에서 Block + Page UI 구성/저장/복원
- photography의 고도화 design asset을 공통 공식으로 안전하게 추출
- 비사진 산업 1개 draft→AI→human review→publish→rollback
- public renderer/canonical/SEO/sitemap/404
- PC/mobile/CWV/ad side rail QA
- workstream QA Drive archive

## Resume protocol

1. `AGENTS.md`
2. `TASKS.md`
3. 이 `HANDOFF.md`
4. `main` 최신 commit
5. `Exact next action`과 실제 repo 상태 비교

대화만 보고 상태를 추정하지 않는다.
