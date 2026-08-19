# Platform Library V1 Handoff

이 파일은 새 채팅/세션에서도 현재 작업을 추측 없이 이어가기 위한 canonical handoff다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

- Phase 07 — 27개 Block 사용자 시각 review/최종 판정 대기
- Phase 08 — Editor Lab + Sheets DB + protected API + revision/media/publish UX 구현
- Phase 09 — 첫 비사진 분야 `video-editor` 실제 draft와 공식 evidence 생성
- Phase 10 — public snapshot runtime/API를 staging까지 구현, production route는 승인 전 미연결

## 절대 유지할 production safety

- 기존 photography production renderer를 candidate renderer로 교체하지 않는다.
- 기존 Safari navigation/runtime fix를 건드리지 않는다.
- 27개 Block은 사용자 판정 전 자동 승인하지 않는다.
- candidate block이 포함된 page의 production publish는 실패해야 한다.
- `/block-lab/`, `/editor-lab/`, `/qa/`, `/staging/`은 검색 노출 제외.
- `/api/editor/*`는 `ADMIN_EDITOR_TOKEN` 없으면 닫혀 있어야 한다.
- 공개 read API `/api/public/snapshot`은 active publish snapshot만 반환하고 draft를 반환하지 않는다.

## Block Registry / Lab

Browser:
- `public/data/block-registry/v1/manifest.js`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-registry-health.js`

Server:
- `functions/lib/block-registry-v1.js`

검사:
- `scripts/check-block-registry-sync.mjs`
- `.github/workflows/platform-library-checks.yml`

현재 27 type 전부 `candidate`.

Block Lab:
- `/block-lab/`
- 27 candidate
- category/variant/Light-Dark/Fit-390-768-1180
- undecided/approved/redesign/merge/deprecated + memo
- localStorage + JSON export
- `BLOCK_REVIEWS` server sync 추가
- `GET /api/editor/review-list`
- UI: `서버 연결 / 검토 불러오기 / 검토 저장`

사용자의 실제 시각 판정이 아직 없다.

## Editor Lab

Route: `/editor-lab/`

구현:
- 27 block library/search
- add/reorder/drag-drop/up-down/duplicate/delete
- recursive inspector + 빠른 편집
- AI policy/field lock/fact state
- edit/preview, Light/Dark, 390/768/1180
- undo/redo/localStorage/JSON import-export
- industry ID/slug/new/duplicate
- SEO metadata
- AI brief/request/response safe import/review
- server connect/list/save/load
- media picker
- block revision history/restore
- slug conflict
- publish-check/publish
- publish snapshot history
- snapshot full UI preview 390/768/1180
- snapshot rollback to browser draft
- Registry status filter `전체 / 승인만 / 후보만`

새 status filter:
- `public/assets/js/editor-lab/library-status-filter.js`
- `public/assets/styles/editor-lab/library-status-filter.css`
- `publish-controls.js`가 extension으로 로드

## Sheets V1 DB

Spreadsheet:
`1TgA_-C9rDPRvgxTnG5cPnWihwC48KZxod-sPeEoMWUc`

Tabs:
- PLATFORM_PAGES
- PAGE_BLOCKS
- BLOCK_REVISIONS
- BLOCK_REVIEWS
- MEDIA_ASSETS
- PUBLISH_SNAPSHOTS
- PUBLISHED_BLOCKS

Storage authority:
- structured page/block/review → Sheets
- master/files/archive → Drive
- public asset/renderer/schema/permanent rules → Git + Cloudflare
- localStorage → local draft fallback

## First non-photography QA page

Page:
- pageId: `page_video_editor_qa_v1`
- slug: `video-editor`
- industry: `video-editor`
- title: `영상편집으로 먹고살기`
- status: draft
- seo indexPolicy: noindex
- aiStatus: needs_review

실제 Sheets row 생성됨.
PAGE_BLOCKS 13개:
1. hero
2. chapter-hero
3. comparison-cards
4. process
5. checklist
6. pros-cons
7. product-tool
8. offer-rail
9. roadmap
10. script-copy
11. faq
12. resources
13. cta

Git seed:
- `docs/workstreams/platform-library-v1/qa/video-editor-draft-v1.json`

주의:
- seed v1 마지막 CTA에 legacy `primaryHref`가 남아 있음.
- 실제 Sheet와 QA public fixture는 renderer 계약에 맞게 `primaryUrl` 사용.
- 이후 seed v2/migration으로 정리 가능하나 현재 runtime blocker는 아님.

## Video editor official evidence

Evidence doc:
- `docs/workstreams/platform-library-v1/qa/video-editor-evidence-v1.json`

QA overlay:
- `public/data/qa/video-editor-evidence-v1.js`

현재 연결:
- Adobe Premiere 공식 한국 페이지
  - 2026-08-20 확인 당시 개인 Premiere: 연간 약정/월 청구 월 30,800원(부가세 포함)
- Blackmagic Design DaVinci Resolve
  - Resolve 21 무료 버전 제공 확인
  - Studio 가격은 최근 공식 검색 결과가 538,800원/565,800원으로 엇갈려 확정값으로 잠그지 않음
- 고용24
  - 영상편집 NCS `08030406`
  - 현재 과정 예시 확인
  - 특정 기관 추천이 아니라 지역/기간/자비부담 비교 경로로 사용

Sheet:
- `ve_tools` revision 2 + evidence
- `ve_resources` revision 2 + evidence
- `BLOCK_REVISIONS`에 두 변경 이력 추가
- page aiReview도 source-added 상태로 갱신

아직 보완 필요:
- 실제 편집 분야별 수요/단가
- 계약/세금
- 플랫폼 수수료/정책
- 음원/폰트/소스별 라이선스

## Full page QA

Route:
- `/qa/video-editor/`

Files:
- `public/qa/video-editor/index.html`
- `public/data/qa/video-editor-draft-v1.js`
- `public/data/qa/video-editor-evidence-v1.js`
- `public/assets/js/qa-page/video-editor.js`
- `public/assets/styles/qa-page/page.css`

실제 candidate renderer로 13 block을 한 페이지 흐름으로 렌더.
390/768/1180 + Light/Dark.
noindex + robots `/qa/` disallow.

## Public snapshot staging

Shared runtime:
- `public/assets/js/public-snapshot/runtime.js`

Staging route:
- `/staging/public-renderer/`

Files:
- `public/staging/public-renderer/index.html`
- `public/assets/js/public-snapshot/staging.js`
- `public/assets/styles/public-snapshot/runtime.css`

Runtime 구현:
- snapshot normalize/validation
- approved-only gate가 기본
- staging에서만 `allowCandidate:true`
- title/description/robots
- OG title/description/type/site/url/image
- Twitter card/title/description/image
- canonical 적용 함수
- Article/WebPage JSON-LD

Staging은 noindex이며 production URL에 연결하지 않음.

## Public active snapshot read API

Route:
- `GET /api/public/snapshot?slug=<slug>`

File:
- `functions/api/public/snapshot.js`

동작:
- PUBLISH_SNAPSHOTS에서 `state=active`인 slug만 조회
- 해당 PUBLISHED_BLOCKS만 반환
- draft/PLATFORM_PAGES/PAGE_BLOCKS는 노출하지 않음
- active가 없으면 404
- public cache header 적용

현재 active snapshot이 없으므로 `video-editor`는 공개 API에서 조회되면 안 됨.

## Protected Editor API

Canonical write:
- `POST /api/editor/save-page`

Exact read/support:
- `/api/editor/assets`
- `/api/editor/revisions`
- `/api/editor/slug-check`
- `/api/editor/snapshots`
- `/api/editor/review-list`

Catch-all:
- health/pages/page/reviews/publish-check/publish

보호:
- same-origin
- Bearer ADMIN_EDITOR_TOKEN
- token missing → closed

Google JWT grant type 유지:
`urn:ietf:params:oauth:grant-type:jwt-bearer`

## CI

Workflow:
- `.github/workflows/platform-library-checks.yml`

검사 범위:
- browser/server Registry sync
- first industry QA seed validator
- block-lab/editor-lab/qa-page/public-snapshot JS syntax
- editor/public Functions syntax

GitHub connector에서 실제 workflow run 성공 결과는 아직 확인하지 못했으므로 성공으로 추정하지 않는다.

## Current checkpoints

1. `/block-lab/` 사용자 시각 검토 및 27 block 최종 판정
2. `/qa/video-editor/` 전체 페이지 흐름 검토
3. `/staging/public-renderer/` 공개 형태 검토
4. Cloudflare `ADMIN_EDITOR_TOKEN` 설정
5. 실제 Pages PC/mobile browser QA

이 환경의 container는 `photo-ebook.pages.dev` DNS lookup에 실패했으므로 live route 정상 여부를 추정하지 않는다.

## Next action

자동 가능:
1. video-editor 시장/계약/비용 evidence 추가 보완
2. public route/404/sitemap 연결 전 route contract 마무리
3. 광고 side rail용 desktop layout contract 설계
4. QA seed v1 CTA legacy field를 v2에서 정리

사용자 checkpoint 후:
1. Block review를 server에 저장
2. browser/server Registry final status 반영
3. approved renderer canonical 승격
4. Editor approved-only 운영 모드 전환
5. video-editor AI/human review 완료
6. publish snapshot 생성
7. active snapshot public route 연결
8. metadata/canonical/sitemap/404/CWV/ad rail QA

## V1 완료 목표

1. Block 최종 승인/정제
2. Editor 저장/AI/미디어/버전/발행 live QA
3. 사진 외 산업 1개를 draft→AI→human review→publish→rollback 통과
4. 산업별 public renderer/canonical route
5. SEO metadata + JSON-LD + sitemap + real 404
6. PC/mobile + Core Web Vitals QA
7. PC side AdSense 영역을 넣어도 콘텐츠/내비게이션이 무너지지 않는 layout
8. workstream QA 자료 Drive archive

AdSense 승인/publisher ID는 외부 checkpoint로 별도 관리.

## Resume protocol

1. AGENTS.md
2. TASKS.md
3. 이 HANDOFF.md
4. main 최신 commit
5. checkpoint/next action 확인

대화만 보고 상태를 추정하지 않는다.
