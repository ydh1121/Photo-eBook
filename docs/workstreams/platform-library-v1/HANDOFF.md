# Platform Library V1 Handoff

이 파일은 새 채팅/세션에서도 현재 작업을 추측 없이 이어가기 위한 canonical handoff다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

- Phase 07 — 27개 Block 사용자 시각 review 대기
- Phase 08 — Editor Lab, Sheets DB, protected APIs, media/revision/save hardening 구현
- Phase 09 — AI request/response/lock/review 왕복 구현; 실제 신규 산업 end-to-end QA 대기
- Phase 10 — SEO metadata + snapshot publish infra 구현; public renderer는 Block 승인 전 미연결

## 절대 유지할 production safety

- 기존 photography production renderer를 이 workstream의 candidate renderer로 교체하지 않는다.
- 기존 Safari navigation/runtime fix를 건드리지 않는다.
- `/block-lab/`, `/editor-lab/`은 noindex 상태를 유지한다.
- `/api/editor/*`는 기존 공개 `/api/rpc`와 분리한다.
- `ADMIN_EDITOR_TOKEN`이 없으면 editor API는 닫혀 있어야 한다.
- 27개 Block은 현재 모두 `candidate`; 사용자 검토 전 자동 승인 금지.
- candidate block이 포함된 페이지의 production publish는 실패해야 한다.

## Reference / Editorial

Reference index:
- `docs/library/references/README.md`

사용자 제공 9개 GitHub 링크 + 기존 `liquid-taffy`, NomaDamas reference 모두 등록됨.

Project design authority:
- `docs/library/design-taste/PLATFORM-TASTES.md`

Editorial:
- `docs/library/editorial/`
- photography: `docs/spec-v1/20-korean-copywriting-skill.md`
- Google Sheet `COPY_GUIDE`가 live copy rule source

## Block Registry

Browser:
- `public/data/block-registry/v1/manifest.js`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-registry-health.js`

Server:
- `functions/lib/block-registry-v1.js`

Sync:
- `scripts/check-block-registry-sync.mjs`
- `.github/workflows/platform-library-checks.yml`

Approval 시 browser/server Registry를 같이 수정하고 sync script를 통과시켜야 한다.

27 type 모두 현재 `candidate`.

## Block Lab

Route: `/block-lab/`

- 27개 candidate
- category / variant / Light-Dark / Fit-390-768-1180
- review decision: undecided/approved/redesign/merge/deprecated
- memo/localStorage/JSON export/filter/summary
- Google Sheet `BLOCK_REVIEWS` 27개 `undecided` seed

사용자의 실제 화면 판정이 아직 없다.

## Editor Lab

Route: `/editor-lab/`

현재 구현:
- 27 block library/search
- add/reorder/drag-drop/up-down/duplicate/delete
- recursive content inspector
- block별 빠른 편집 profile — `inspector-friendly.js`
- variant
- AI policy/field lock/fact state
- Light/Dark + 390/768/1180
- edit/preview
- undo/redo
- localStorage draft
- JSON import/export
- industry ID / slug / new/duplicate page
- SEO metadata
- AI brief/request export
- AI response safe import
- recent AI review
- optional server connect/save/load
- media picker
- revision history/restore to browser draft
- publish-check/publish controls

주요 runtime:
- `public/editor-lab/index.html`
- `public/assets/js/editor-lab/editor-app.js`
- `page-meta.js`
- `seo-meta.js`
- `ai-brief.js`
- `ai-response.js`
- `ai-review.js`
- `editor-server.js`
- `publish-controls.js`
- `media-picker.js`
- `revision-history.js`
- `inspector-friendly.js`

## V1 Sheets DB

Spreadsheet ID:
`1TgA_-C9rDPRvgxTnG5cPnWihwC48KZxod-sPeEoMWUc`

Tabs:
- `PLATFORM_PAGES`
- `PAGE_BLOCKS`
- `BLOCK_REVISIONS`
- `BLOCK_REVIEWS`
- `MEDIA_ASSETS`
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`

`PLATFORM_PAGES` A:M:
`page_id, slug, industry_id, title, status, theme, seo_json, created_at, updated_at, published_at, brief_json, ai_status, ai_review_json`

Storage authority:
- structured page/block → Sheets
- master/files/archive → Drive
- public static asset/renderer/schema/permanent rules → Git + Cloudflare
- localStorage → local/offline draft fallback

Permanent doc:
- `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`

## Existing Drive image pipeline

기존 폴더를 재사용한다.
- `Photo-eBook Image Pipeline V1`
- Generated PNG
- Generated WebP

Drive를 public CDN처럼 쓰지 않는다.
`MEDIA_ASSETS.public_url`은 실제 Editor/public renderer가 읽을 수 있는 배포 URL이어야 한다.

현재 `MEDIA_ASSETS`에는 photography repo sample 8개가 seed돼 있고 Editor media picker에서 사용할 수 있다.

## Protected Editor APIs

Catch-all:
- `functions/api/editor/[[path]].js`

Exact routes:
- `POST /api/editor/save-page` — change-aware draft save
- `GET|POST /api/editor/assets`
- `GET /api/editor/revisions`

Catch-all routes:
- `GET /health`
- `GET /pages`
- `GET /page?id=...`
- `POST /reviews`
- `POST /publish-check`
- `POST /publish`

보호:
- same-origin
- Bearer `ADMIN_EDITOR_TOKEN`
- no token → closed
- Editor token은 sessionStorage only

### change-aware save

`/api/editor/save-page`가 Editor와 publish pre-save의 canonical write path다.

- page metadata는 draft로 저장
- new block → version 1 + revision
- existing changed block → version +1 + row update + revision
- unchanged block → row update/revision 생략
- stable JSON으로 content/evidence/AI policy 비교
- removed block → 삭제 snapshot revision 후 마지막 clear
- 기존 데이터 전체 선삭제 금지

기존 catch-all `POST /page`는 호환용 legacy 경로이며 Editor UI에서는 사용하지 않는다.

Google OAuth grant type은 반드시:
`urn:ietf:params:oauth:grant-type:jwt-bearer`

## Revision history

- server: `functions/api/editor/revisions.js`
- UI: `revision-history.js`
- 과거 block snapshot을 browser draft로 먼저 불러온다.
- 서버는 사용자가 다시 저장하기 전까지 변경하지 않는다.

## Media picker

- server metadata API: `functions/api/editor/assets.js`
- UI: `media-picker.js`
- MEDIA_ASSETS + Block Lab repo sample merge
- image/avatar 및 SEO ogImage 선택 지원
- imageAlt가 비어 있으면 asset alt를 보조 입력

아직 웹 관리자에서 신규 파일을 Drive에 업로드하고 Git/public asset으로 승격하는 자동 파이프라인은 연결하지 않았다.

## AI Content

문서:
- `docs/library/ai-content/README.md`
- `AI-CONTENT-CONTRACT-V1.md`
- `AI-CONTENT-RESPONSE-V1.md`

흐름:
`rough layout → AI request JSON → AI 작성/검토 → response JSON → lock-aware import → needs_review → 사용자 검토 → server draft`

중요:
- AI가 page/block identity, block type/order/variant/enabled, approval/publish status를 변경하지 않음
- `locked`/`fact_check_only` 자동 content 수정 금지
- `wording_only`는 문자열만 변경하고 구조 보존
- evidence 없는 verified 거부
- pageReview blocker는 publish 차단

## SEO/GEO + Publish

문서:
- `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`

구현:
- seo_json Editor
- source/evidence snapshot
- `PUBLISH_SNAPSHOTS`, `PUBLISHED_BLOCKS`
- publish-check/publish server validation
- approved Registry only
- disabled block 제외
- AI needs_review/blocker/stale fact 차단
- `public/robots.txt`
- labs/API crawler 제외

아직 미연결:
- approved snapshot public renderer
- canonical 산업 route
- public title/meta/canonical/OG/Twitter
- JSON-LD
- sitemap
- real 404
- 광고 side rail

기존 photography `/`는 그대로 둔다.

## CI / validation

Workflow:
- `.github/workflows/platform-library-checks.yml`

검사:
- browser/server Registry sync
- block/editor/Functions JS `node --check`

현재 connector의 combined status에는 status가 반환되지 않아 CI 성공 여부를 이 세션에서 확인하지 못했다. live success로 추정하지 않는다.

## Current blockers

1. 사용자의 `/block-lab/` 실제 시각 검토/최종 Block 판정
2. Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정
3. 실제 `/editor-lab/` authenticated save/load/revision/media/publish-check QA
4. 실제 PC/mobile browser visual QA

## Next action

자동으로 더 진행 가능한 것:
1. slug 중복/URL 충돌 검사
2. published snapshot history/preview UI
3. page-level rollback UX
4. approval 이후 production picker 필터 준비
5. public snapshot renderer를 production에 연결하지 않은 staging 형태로 설계

사용자/환경 checkpoint:
1. `/block-lab/` 검토
2. Cloudflare secret 설정
3. `/editor-lab/` 실사용 QA

승인 후:
- browser/server Registry status 반영
- approved renderer canonical 승격
- public renderer/canonical route
- metadata/JSON-LD/sitemap/404
- 광고 side rail + CWV QA

## Resume protocol

1. `AGENTS.md`
2. `TASKS.md`
3. 이 `HANDOFF.md`
4. `main` 최신 commit
5. active/checkpoint 일치 확인

대화만 보고 상태를 추정하지 않는다.
