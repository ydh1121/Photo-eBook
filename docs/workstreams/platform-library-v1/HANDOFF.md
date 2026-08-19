# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 고정한다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

- Phase 07: 사용자 Block review 대기
- Phase 08: Editor Lab + V1 Sheets DB + 보호된 draft/publish API 구현, live auth/visual QA 대기
- Phase 09: AI content request/response/lock/review 왕복 계약과 Editor UI 구현
- Phase 10: SEO metadata + publish snapshot + server validation 인프라 구현, public renderer는 승인 전 보류

## Production safety

- 기존 photography production renderer는 교체하지 않았다.
- 기존 Safari navigation/runtime 계약은 건드리지 않았다.
- `/block-lab/`, `/editor-lab/`은 별도 route이며 meta + `X-Robots-Tag` noindex 처리했다.
- `/api/editor/*`는 기존 공개 `/api/rpc`와 분리했다.
- `ADMIN_EDITOR_TOKEN`이 배포 환경에 없으면 editor API는 모두 401로 닫힌다.
- Editor Lab의 관리자 토큰은 브라우저 `sessionStorage`에만 저장한다.
- publish validator는 Git server Registry에서 `approved`인 block만 허용한다.
- 현재 27개는 전부 candidate이므로 실제 publish는 차단되는 것이 정상이다.

## Reference / Editorial

Reference index:
- `docs/library/references/README.md`

2026-08-19 사용자 제공 GitHub 링크 9개 모두 등록됨:
- `emilkowalski/skills`
- `Meliwat/awesome-ios-design-md`
- `VoltAgent/awesome-design-md` Apple `DESIGN.md`
- `Leonxlnx/taste-skill`
- `tastesmd/TASTES.md`
- GitHub `topics/ai-design`
- `Shinwoo-Park/katfishnet`
- `DaleSeo/korean-skills`
- `dotoricode/korean-humanizer`

기존 reference:
- `NomaDamas/k-skill` korean-humanizer
- `arknow91/liquid-taffy`

Project design taste:
- `docs/library/design-taste/PLATFORM-TASTES.md`

Editorial:
- `docs/library/editorial/`
- photography 특수 계약: `docs/spec-v1/20-korean-copywriting-skill.md`
- Google Sheet `COPY_GUIDE`가 live copy rule source

## Block Library / Registry

문서:
- `docs/library/blocks/README.md`
- `V1-INVENTORY.md`
- `V1-EXPANSION.md`
- `BLOCK-CONTRACT.md`
- `APPROVAL-WORKFLOW.md`

Browser Registry:
- `public/data/block-registry/v1/manifest.js`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-registry-health.js`

Server publish Registry:
- `functions/lib/block-registry-v1.js`

현재 27개 type은 browser/server 모두 `candidate`다. 사용자 시각 검토 전에 자동 승인하지 않는다.

보류:
- location/map → provider/API/geocoding/privacy 계약 전까지 보류

## Block Lab

Route:
- `/block-lab/`

기능:
- 27개 candidate
- category filter
- Light/Dark
- Fit/390/768/1180
- variant 비교
- `미결정 / 승인 / 재설계 / 통합 / 폐기`
- review memo
- localStorage review persistence
- review JSON export
- registry health 표시

Google Sheet `BLOCK_REVIEWS`에는 27개 type을 `undecided`로 seed했다. 아직 사용자 판정은 반영하지 않았다.

## Editor Lab

Route:
- `/editor-lab/`

주요 기능:
- 27개 block library/search
- block add/reorder/duplicate/delete
- drag-and-drop + up/down fallback
- variant/content inspector
- block AI policy / field locks / fact state
- Light/Dark, 390/768/1180
- edit/preview
- undo/redo
- JSON import/export
- localStorage browser draft
- 산업 ID / URL slug
- 새 페이지 / 페이지 복제
- 선택적 서버 연결
- 서버 초안 목록/저장/불러오기
- SEO metadata editor
- AI brief/request export
- AI response safe import
- 최근 AI review 표시
- 발행 검사 / 발행 action

주요 파일:
- `public/editor-lab/index.html`
- `public/assets/js/editor-lab/editor-app.js`
- `page-meta.js`
- `seo-meta.js`
- `ai-brief.js`
- `ai-response.js`
- `ai-review.js`
- `editor-server.js`
- `publish-controls.js`

## AI Content Contract

문서:
- `docs/library/ai-content/README.md`
- `AI-CONTENT-CONTRACT-V1.md`
- `AI-CONTENT-RESPONSE-V1.md`

흐름:
`rough layout → AI 작업 JSON → AI 작성/검토 → AI 결과 JSON → lock-aware import → needs_review → 사용자 검토 → 서버 draft`

중요:
- AI가 page/block identity, block type/order/variant/enabled, approval/publish status를 변경하지 않음
- `locked` / `fact_check_only` content 자동 수정 금지
- `wording_only`는 기존 구조를 유지하고 문자열만 수정
- evidence 없는 `verified`를 importer가 거부
- pageReview의 `blocker`는 publish 차단
- AI 적용 후 `needs_review`; importer가 `approved`로 올리지 않음

## V1 Sheets DB — 실제 생성/검증됨

Spreadsheet:
- `사진작가 수익화 로드맵 | 모바일 LANDING + DB`
- ID `1TgA_-C9rDPRvgxTnG5cPnWihwC48KZxod-sPeEoMWUc`

추가된 tabs:
- `PLATFORM_PAGES`
- `PAGE_BLOCKS`
- `BLOCK_REVISIONS`
- `BLOCK_REVIEWS`
- `MEDIA_ASSETS`
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`

`PLATFORM_PAGES` 현재 주요 컬럼:
- page_id
- slug
- industry_id
- title
- status
- theme
- seo_json
- created_at
- updated_at
- published_at
- brief_json
- ai_status
- ai_review_json

Storage decision:
- 구조화 페이지/블록 → Google Sheets
- 이미지/파일/archive → Google Drive
- renderer/schema/permanent rules → Git
- localStorage → local/offline draft fallback

문서:
- `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`

## Protected Editor API

파일:
- `functions/api/editor/[[path]].js`

Endpoints:
- `GET /api/editor/health`
- `GET /api/editor/pages`
- `GET /api/editor/page?id=...`
- `POST /api/editor/page`
- `POST /api/editor/reviews`
- `POST /api/editor/publish-check`
- `POST /api/editor/publish`

보호:
- same-origin 확인
- Bearer `ADMIN_EDITOR_TOKEN`
- token 미설정 시 closed

Draft persistence:
- page status를 draft로 저장
- block type allowlist 검증
- block revision 기록
- 기존 block update → 신규 append → 삭제 block 마지막 clear
- AI brief/status/review 저장
- 빈 slug를 page id로 임의 보정하지 않음

Publish:
- disabled block 제외
- approved Registry 확인
- SEO title/description 검사
- AI `needs_review` / blocker 검사
- stale fact 차단
- `PUBLISHED_BLOCKS` 저장 후 `PUBLISH_SNAPSHOTS` active row 생성
- 이전 active snapshot은 그 뒤 `superseded`
- publish snapshot은 draft와 별도 보존

OAuth 주의:
- Google service-account token의 grant type은 반드시 `urn:ietf:params:oauth:grant-type:jwt-bearer`
- 중간 구현 중 한 번 오타가 생겼다가 즉시 수정했고 현재 파일은 올바른 문자열을 사용함

## SEO/GEO + Publishing

문서:
- `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`

구현됨:
- `seo_json` editor
- title / description / Article|WebPage / OG image / site / author / index policy / reviewedAt
- publish snapshot tables
- server publish validation
- `public/robots.txt`
- labs/API crawler 제외
- public route에서 `OAI-SearchBot`을 별도로 차단하지 않음

아직 안 함:
- 승인 block 기반 public snapshot renderer
- 신규 산업 canonical route 확정
- public metadata/JSON-LD renderer
- sitemap
- public 404 처리
- 광고 rail

기존 photography `/`는 이 단계에서 변경하지 않는다.

## Current blockers / unresolved checks

1. Cloudflare Pages/Functions 배포 환경에 `ADMIN_EDITOR_TOKEN` secret을 아직 설정하지 못했다. 현재 도구에는 Cloudflare 환경변수를 설정할 connector가 없다.
2. 따라서 `/api/editor/*`의 live authenticated save/load/publish-check는 아직 검증하지 못했다.
3. 현재 도구 세션에서는 실제 Pages browser/device visual QA를 완료하지 못했다.
4. 27개 block은 사용자 실제 화면 판정 전이므로 candidate 상태를 유지한다.

## Next action

비차단 작업:
1. `MEDIA_ASSETS` 기반 이미지 asset picker 설계/구현
2. revision history 조회/복원 UI
3. block-specific friendly inspector 2차 정제
4. Registry browser/server sync 검사 도구 추가

사용자/환경 입력이 필요한 checkpoint:
1. `/block-lab/` 실제 검토 후 block 판정
2. Cloudflare에 `ADMIN_EDITOR_TOKEN` 설정
3. `/editor-lab/` 서버 연결 후 save/load/publish-check QA

승인 후:
- browser manifest + server Registry status 갱신
- approved renderer를 canonical로 승격
- public snapshot renderer와 canonical route 연결
- sitemap/JSON-LD/404/광고 rail 구현 및 QA

## Resume protocol

새 채팅방에서는 다음 순서로 재개한다.
1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. 이 `HANDOFF.md`
4. `main` 최신 commit
5. active task와 Next action 일치 확인

의미 있는 작업 단위가 끝날 때마다 TASKS/HANDOFF를 함께 갱신한다.
