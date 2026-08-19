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

## Snapshot V2 publish architecture

Canonical publish implementation:
- `functions/lib/publish-v2.js`
- `functions/api/editor/publish-check.js`
- `functions/api/editor/publish.js`

Snapshot storage:
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`
- `PUBLISHED_BLOCK_STYLES`
- `PUBLISHED_UI_CONFIG`

Public source/runtime:
- shared loader: `functions/lib/public-snapshot-v2.js`
- API: `/api/public/snapshot-v2?slug=...`
- client runtime: `public/assets/js/public-snapshot/runtime-v2.js`
- generic public interactions: `public/assets/js/public-snapshot/interactions.js`
- staging: `/staging/snapshot-v2.html`

발행 시점의 Block style과 Page UI config를 resolved 값으로 고정한다. 나중에 preset 원본이 바뀌어도 과거 snapshot 디자인이 변하지 않는다.

Public API와 canonical route는 active snapshot만 읽는다. API에서 받은 active snapshot은 서버 publish gate를 이미 통과한 immutable 결과로 취급하며 browser에서는 구조 유효성만 다시 확인한다. 직접 주입하는 staging candidate는 `allowCandidate` 경로를 사용한다.

## Publish approval gate

자동 승인은 금지한다.

현재 gate:
- known Block type + variant
- `BLOCK_VARIANT_REVIEWS`의 저장된 `type::variant` 판정을 우선 사용
- 저장된 판정이 없으면 static candidate registry fallback
- variant decision이 `approved`여야 통과
- 선택한 Block Style preset은 현재 type+variant와 일치하고 `approved`여야 통과
- enabled Page UI는 preset 필수 + capability 일치 + `approved`
- AI fact state / evidence 조건 유지
- SEO / slug / active slug conflict 검사 유지

Block Lab에서 사용자가 variant를 `승인`하고 서버 저장하면 publish gate가 해당 Sheet 판정을 실제로 읽는다.

## Canonical public routes

새 산업 public route:
- `functions/[slug].js`
- active Snapshot V2가 존재하는 `/:slug/`만 200
- active snapshot이 없는 draft/unknown slug는 실제 404
- slash 없는 active slug는 `/:slug/`로 308
- GET/HEAD만 허용

Legacy photography:
- `/`는 기존 photography renderer 유지
- `/photography/`도 `public/_redirects`를 통해 기존 `/index.html` renderer 유지
- `/photography`와 `/photography/*`는 `public/_routes.json`에서 Functions 호출 제외
- photography production renderer와 Safari deferred sticky fix는 변경하지 않음

Search/AI rendering:
- canonical Function이 title/description/canonical/robots/OG/Twitter/JSON-LD를 서버 HTML에 먼저 출력
- 같은 immutable snapshot에서 semantic text fallback도 서버 렌더
- fallback에는 block 제목/설명/items/facts/FAQ/resources/공식 링크 등이 실제 visible HTML로 들어감
- JS 가능 시 같은 payload를 `runtime-v2.js`가 advanced block UI로 교체
- 숨겨진 duplicate SEO content는 만들지 않음

Files:
- `functions/[slug].js`
- `functions/lib/public-snapshot-v2.js`
- `functions/sitemap.xml.js`
- `public/404.html`
- `public/_routes.json`
- `public/_redirects`
- `public/_headers`
- `public/assets/styles/public-snapshot/runtime.css`

Sitemap:
- `/sitemap.xml`
- active snapshot만 대상
- `seo.indexPolicy=noindex` 제외
- `/` + active/indexable `/:slug/`
- lastmod는 sourceUpdatedAt/publishedAt 사용

404:
- 기존 `/* → /index.html 200` SPA fallback 제거
- dynamic slug missing/draft는 404
- 정적 `public/404.html`도 존재

Internal review routes:
- Block Lab / Editor Lab / UI Dashboard / QA / staging은 noindex/no-store header 강화
- `_routes.json`으로 static surfaces를 Functions invocation에서 제외

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

Photography built-in Style preset 12개가 `BLOCK_STYLE_PRESETS`에 seed돼 있으며 모두 자동 승인하지 않고 `draft`에서 시작한다.

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
- current type + variant에 맞는 preset만 표시
- 선택값 draft/server round-trip
- Canvas immediate preview
- snapshot preview/rollback에서도 resolved style 보존

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
- `horizontal-card-rail`: 실제 generic surface 적용 완료
  - left runway/right padding/fade
  - hidden/auto scrollbar
  - PC mouse drag + click suppression
  - mobile native horizontal scroll owner 유지
- `reading-progress`: 실제 generic surface 적용 완료
  - color/thickness/opacity
  - scroll/resize progress
  - reduced-motion safety
- top chapter nav / bottom sheet / filter 등은 실제 generic surface와 data contract가 준비되기 전 임의 생성하지 않는다.

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

## First non-photography QA — video editor

Page: `page_video_editor_qa_v1`
slug: `video-editor`
state: draft / noindex / needs_review
13 blocks in Sheets.

Routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/staging/snapshot-v2.html`

Current evidence scope:
- Adobe Premiere official plan/function evidence
- Blackmagic DaVinci Resolve official evidence
- 고용24 영상편집 훈련 evidence
- 크몽 개별 공개 판매 등록가 예시
- 한국콘텐츠진흥원 방송영상 표준계약서 reference
- 국세청 인적용역/종합소득세 reference
- 한국저작권위원회 음원·폰트 이용허락 reference
- 크몽 판매 이용약관 reference

Important pricing rule:
- 현재 가격은 확인일 기준 `개별 공개 등록가 예시`다.
- 평균 단가, 실제 거래가, 시장 평균으로 표현하지 않는다.
- 시장 수요 규모는 현재 정량 근거가 없어 수치로 주장하지 않는다.

Sheet source was updated first, then browser QA overlay matched.
Verified effective blocks:
- `ve_market_compare`
- `ve_process`
- `ve_tools`
- `ve_offer`
- `ve_faq`
- `ve_resources`

`ve_hero`는 외부 사실 주장이 아니므로 `factState:not_required`.

`PLATFORM_PAGES.ai_review_json`도 갱신돼 남은 blocker를 사용자 content/design review + approval로 정확히 표시한다.

Browser evidence overlay:
- `public/data/qa/video-editor-evidence-v1.js`

CI validator:
- `scripts/check-platform-qa-seed.mjs`
- canonical JSON seed뿐 아니라 browser draft + evidence overlay를 VM에서 실제 실행
- verified block은 evidence publisher/url/checkedAt가 없으면 실패
- effective block IDs/count도 canonical seed와 비교

## COPY_GUIDE additions

Live `COPY_GUIDE`에 추가됨:
- `public_route_status`
  - public route/404에서 Snapshot/version 같은 개발 상태 문구 금지
  - 짧은 상태 + 다음 행동만 표시
- `public_route_loading`
  - loading/failure는 현재 상태와 다음 행동만 짧게 표시

## CI

Workflow: `.github/workflows/platform-library-checks.yml`

Checks:
- Block type browser/server sync
- Block variant browser/server sync
- UI Capability browser/server sync
- video-editor canonical seed + effective evidence overlay
- Block Lab / Editor / UI runtime / UI Dashboard / Public Snapshot / Functions syntax
- root `functions/*.js`도 syntax 범위
- `_routes.json`, `_redirects`, `404.html` 변경이 workflow trigger

Known CI limitation:
- GitHub connector가 push workflow run/check-run을 현재 노출하지 않는다.
- combined status도 status context가 없어 latest success를 성공으로 추정하지 않는다.
- local clone 시 container DNS 문제로 full local run은 수행하지 못했다.

## Live deployment verification

아직 실제 Cloudflare 응답 smoke test를 성공적으로 읽지 못했다.
Web tool이 `photo-ebook.pages.dev` 직접 open을 정상 fetch하지 못했다.
따라서 아래를 배포 성공으로 간주하지 않는다:
- canonical dynamic slug response
- 404 response status
- sitemap response
- `_routes.json` runtime behavior

코드/Sheet 상태만 확인된 상태다.

## Production safety invariants

- photography production renderer를 candidate renderer로 교체하지 않는다.
- Safari deferred sticky fix 건드리지 않는다.
- mobile native horizontal scroll owner 유지.
- 사용자 review 전 Block/variant/style/UI preset 자동 승인 금지.
- candidate production publish 차단.
- labs/dashboard/QA/staging noindex.
- public snapshot API는 active snapshot만 반환하고 draft 반환 금지.
- canonical `/:slug/`도 active snapshot만 반환.
- active API snapshot만 browser trusted-published 경로 사용.
- `/video-editor/`는 현재 draft이므로 active snapshot 생성 전 공개되면 안 된다.

## Exact next action

1. current `main` 확인.
2. 사용자 `/block-lab/` + `/ui-dashboard/` + `/qa/video-editor/` review 결과를 받는다.
3. review 결과에 따라 variant/style/UI preset을 server `approved` 또는 redesign/deprecated로 저장한다.
4. approval 이후 production Editor approved-only 최종 모드를 켠다.
5. `ADMIN_EDITOR_TOKEN` 설정 후 authenticated Editor→publish→canonical→rollback live QA.
6. 실제 Cloudflare canonical/404/sitemap smoke test.
7. generic surface가 준비된 UI Capability runtime 적용 확대.
8. PC/mobile/CWV + 광고 side rail QA.
9. workstream QA Drive archive.

## Current user checkpoints

- `/block-lab/`: type/variant/style preset 실제 디자인 검토
- `/ui-dashboard/`: Page UI capability/preset 검토
- `/qa/video-editor/`: 비사진 분야 전체 흐름/문구/근거 검토
- `/staging/snapshot-v2.html`: immutable style/UI + public runtime 검토
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
