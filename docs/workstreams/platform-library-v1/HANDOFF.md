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

## UI Dashboard — current checkpoint

Route: `/ui-dashboard/`
Status: noindex / review surface.

2026-08-20 사용자 피드백을 반영해 Dashboard를 정적 모형에서 **실시간 조작형 specimen**으로 개편했다.

Visible UI contract:
- enum/status/source/category의 내부 영문 value를 그대로 노출하지 않는다.
- 내부 저장/API value는 기존 영문 identifier를 유지한다.
- 사용자 화면에서는 의미 중심의 한국어 레이블을 사용한다.
- 설정은 저장하기 전에도 값을 바꾸는 즉시 specimen에 반영된다.
- `기본값으로 되돌리기`와 현재 상태 요약을 제공한다.
- 구현 파일 경로는 기본 화면에서 숨기고 details 안에서만 확인한다.

Current interactive specimens:
1. 상단 고정 메뉴
   - preview 내부 실제 스크롤
   - chapter chip 클릭 → 해당 section 이동
   - scroll에 따른 active chip/진행 표시 변화
   - 고정 방식: 스크롤 후 고정 / 항상 고정 / 고정 안 함
   - 메뉴칩: Material 플랫 / iOS 플랫 / iOS 리퀴드 표면 비교
   - 사용 off 상태 시 specimen 비활성 표시
2. 가로 카드 rail
   - 모바일/native horizontal scroll
   - PC mouse drag on/off
   - drag threshold + click suppression
   - 왼쪽 shadow runway / right fade / end padding / scrollbar 상태 실제 반영
3. 범용 필터칩
   - 직접 chip 선택
   - family / blur / opacity / response / overshoot 즉시 반영
4. 하단 팝업
   - 열기/닫기/backdrop
   - tabs/search/filter/bulk selection/theme/handoff surface 직접 조작
   - blur/saturation/size/radius 즉시 반영
5. 다른 기기 연결 아코디언
   - open/close
   - code copy / connect 상태
   - response speed 반영
6. 읽기 진행선
   - specimen 내부 문서를 직접 스크롤하면 progress가 실제로 변화
7. 플로팅 액션
   - FAB click → action menu open/close
   - flat/glass/liquid family + motion 반영

Relevant files:
- `public/ui-dashboard/index.html`
- `public/assets/js/ui-dashboard/dashboard.js`
- `public/assets/js/ui-dashboard/live-preview-patch-v3.js`
- `public/assets/js/ui-dashboard/server.js`
- `public/assets/js/ui-dashboard/preset-lifecycle.js`
- `public/assets/styles/ui-dashboard/dashboard.css`
- `public/assets/styles/ui-dashboard/parity-v2.css`
- `public/assets/styles/ui-dashboard/live-preview-v3.css`
- `public/assets/styles/ui-dashboard/live-preview-nav-v3.css`

COPY_GUIDE additions:
- `UI 대시보드 실시간 미리보기`
- `UI 설정 한글 표시`

Important: Dashboard changes only preview/preset state. It does not directly mutate photography production UI.

## UI Capability inventory

Current 7 capabilities:
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

Built-in photography/system UI preset 8개는 live Sheet에서 모두 `draft` 상태다. 자동 승인하지 않는다.

Public runtime status:
- `horizontal-card-rail`: generic public surface 실제 적용 완료
- `reading-progress`: generic public surface 실제 적용 완료
- top chapter nav / bottom sheet / filter 등은 generic surface/data contract가 승인되기 전 production public runtime에 임의 생성하지 않는다.

## Block Lab / approval state

Route: `/block-lab/`
Status: candidate lab / noindex.

- 27 Block type
- type review + memo
- variant review + memo
- difference taxonomy: structure / visual / behavior / responsive
- maturity: implemented / partial / placeholder
- constrained Block Style preset editor
- style preset lifecycle: draft / approved / redesign / deprecated
- server sync: BLOCK_REVIEWS + BLOCK_VARIANT_REVIEWS + BLOCK_STYLE_PRESETS

Photography advanced variants:
- `hero / immersive-metrics`
- `chapter-hero / image-overlay`
- `comparison-cards / visual-metrics`
- `roadmap / metric-cards`

Live Sheet approval checkpoint:
- `BLOCK_VARIANT_REVIEWS`: review row 0개
- photography Block Style presets 12개: 전부 `draft`
- UI presets 8개: 전부 `draft`

따라서 사용자 review 전 production publish는 계속 차단한다.

## Snapshot V2 / public route

Canonical publish:
- `functions/lib/publish-v2.js`
- `functions/api/editor/publish-check.js`
- `functions/api/editor/publish.js`

Immutable storage:
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`
- `PUBLISHED_BLOCK_STYLES`
- `PUBLISHED_UI_CONFIG`

Public source/runtime:
- `functions/lib/public-snapshot-v2.js`
- `/api/public/snapshot-v2?slug=...`
- `public/assets/js/public-snapshot/runtime-v2.js`
- staging: `/staging/snapshot-v2.html`

Canonical routes:
- active Snapshot V2 only `/:slug/`
- draft/unknown slug real 404
- active + indexable dynamic sitemap
- `/` and `/photography/` keep legacy photography renderer
- server-rendered visible semantic fallback + client enhancement
- no hidden duplicate SEO body

## First non-photography QA

Page: `page_video_editor_qa_v1`
slug: `video-editor`
state: draft / noindex / needs_review
13 Sheet blocks.

Routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/staging/snapshot-v2.html`

Evidence completed:
- Adobe Premiere
- Blackmagic DaVinci Resolve
- 고용24 영상편집 훈련
- 크몽 개별 공개 등록가 예시
- KOCCA 표준계약서
- 국세청 인적용역/종합소득세
- 한국저작권위원회 음원·폰트 이용허락
- 크몽 판매 이용약관

가격은 평균/실거래가가 아니라 확인일 기준 개별 공개 등록가 예시로만 사용한다.

## Editor / auth

Editor supports page/block editing, SEO, AI brief/result/review, media, revisions, snapshot preview/rollback, Page UI preset assignment, Block Style preset assignment.

Protected APIs require same-origin + Bearer `ADMIN_EDITOR_TOKEN`.
Token 미설정 시 closed.

Cloudflare live authenticated QA는 아직 token secret 설정이 필요하다.

## Validation state

Workflow: `.github/workflows/platform-library-checks.yml`

UI Dashboard JS/CSS paths are already in workflow trigger/syntax scope.

Known limitation:
- current execution container cannot resolve `github.com`, so local clone + `node --check` could not run.
- GitHub combined status returns no workflow contexts for the latest commit, so do not infer CI success.
- live Pages render should be user/device QA before approving presets.

## Production safety invariants

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Safari deferred sticky safety fix를 건드리지 않는다.
- mobile native horizontal scroll owner 유지.
- 사용자 review 전 Block/variant/style/UI preset 자동 승인 금지.
- labs/dashboard/QA/staging noindex.
- public snapshot API/canonical route는 active snapshot만 반환.
- UI Dashboard는 production state를 직접 변경하지 않고 preview + preset review/save만 한다.

## Exact next action

1. user opens `/ui-dashboard/` and verifies live manipulation on mobile/PC.
2. fix visual/interaction issues found in Dashboard specimen.
3. continue `/block-lab/` and `/qa/video-editor/` review.
4. save user decisions as approved/redesign/deprecated; do not auto-approve.
5. enable approved-only production Editor mode after approvals exist.
6. set Cloudflare `ADMIN_EDITOR_TOKEN` and run authenticated Editor→publish→canonical→rollback QA.
7. live canonical/404/sitemap + PC/mobile/CWV/ad side rail QA.
8. archive workstream QA to Drive after V1 approval.

## Current review URLs

- `/ui-dashboard/` — page UI live manipulation + preset review
- `/block-lab/` — Block/variant/style preset review
- `/qa/video-editor/` — non-photo page flow/content review
- `/staging/snapshot-v2.html` — public Snapshot V2 appearance

## V1 completion target

- Block/variant/style preset final approval
- UI Capability/preset dashboard real use
- Editor Block + Page UI compose/save/restore
- photography advanced design safely extracted into reusable formulas
- one non-photo industry draft→AI→human review→publish→rollback
- public renderer/canonical/SEO/sitemap/404
- PC/mobile/CWV/ad side rail QA
- workstream QA Drive archive
