# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 고정한다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

- Phase 07: 사용자 Block review 대기
- Phase 08: Editor Lab + V1 Sheets DB + 보호된 draft API 구현, live auth 검증 대기
- 다음 비차단 작업: Phase 09 AI 콘텐츠 계약 / Phase 10 publish 구조 설계

## Production safety

- 기존 photography production renderer는 교체하지 않았다.
- 기존 Safari navigation/runtime 계약은 건드리지 않았다.
- `/block-lab/`, `/editor-lab/`은 별도 route이며 meta + `X-Robots-Tag` noindex 처리했다.
- `/api/editor/*`는 기존 공개 `/api/rpc`와 분리했다.
- `ADMIN_EDITOR_TOKEN`이 배포 환경에 없으면 editor API는 모두 401로 닫힌다.
- Editor Lab의 관리자 토큰은 브라우저 `sessionStorage`에만 저장한다.

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

## Block Library

문서:
- `docs/library/blocks/README.md`
- `V1-INVENTORY.md`
- `V1-EXPANSION.md`
- `BLOCK-CONTRACT.md`
- `APPROVAL-WORKFLOW.md`

Registry:
- `public/data/block-registry/v1/manifest.js`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-registry-health.js`

현재 27개 type은 모두 `candidate`다. 사용자 시각 검토 전에 자동 승인하지 않는다.

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

주요 파일:
- `public/editor-lab/index.html`
- `public/assets/js/editor-lab/editor-app.js`
- `public/assets/js/editor-lab/editor-server.js`
- `public/assets/js/editor-lab/page-meta.js`
- `public/assets/styles/editor-lab/editor.css`
- `public/assets/styles/editor-lab/server.css`
- `public/assets/styles/editor-lab/page-meta.css`

기능:
- 27개 block library/search
- block add/reorder/duplicate/delete
- drag-and-drop + up/down fallback
- variant/content inspector
- Light/Dark, 390/768/1180
- edit/preview
- undo/redo
- JSON import/export
- localStorage browser draft
- 산업 ID / URL slug
- 새 페이지 / 페이지 복제
- 선택적 서버 연결
- 서버 초안 목록/저장/불러오기
- 관리자 token은 sessionStorage only

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

헤더와 기본 data validation까지 생성·확인했다.

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

보호:
- same-origin 확인
- Bearer `ADMIN_EDITOR_TOKEN`
- token 미설정 시 closed

Draft persistence:
- page status를 강제로 `draft`로 저장
- block type allowlist 검증
- block revision 기록
- 기존 block row를 먼저 전체 삭제하지 않도록 보완
- 기존 block은 제자리 update
- 신규 block은 append
- 현재 draft에서 사라진 block만 마지막에 clear

## Current blockers / unresolved checks

1. Cloudflare Pages/Functions 배포 환경에 `ADMIN_EDITOR_TOKEN` secret을 아직 설정하지 못했다. 현재 도구에는 Cloudflare 환경변수를 설정할 connector가 없다.
2. 따라서 `/api/editor/*`의 live authenticated save/load는 아직 검증하지 못했다.
3. 이 도구 세션에서는 `photo-ebook.pages.dev` DNS 접근이 실패해 Block Lab/Editor Lab의 live browser visual QA를 하지 못했다.
4. 27개 block은 사용자 실제 화면 판정 전이므로 candidate 상태를 유지한다.

## Next action

비차단 작업은 계속 진행 가능:
1. Phase 09 AI content request / lock / fact-state schema와 Editor UI 설계
2. draft → review → publish snapshot contract 설계
3. SEO/GEO page metadata contract를 platform page schema에 연결

사용자/환경 입력이 필요한 checkpoint:
1. `/block-lab/` 실제 검토 후 block 판정
2. Cloudflare에 `ADMIN_EDITOR_TOKEN` 설정
3. `/editor-lab/` 서버 연결 후 save/load QA

이후:
- approved Registry 확정
- production picker는 approved만 노출
- 이미지 asset picker/Drive 연결
- publish workflow 구현
- 기존 photography page를 새 platform renderer로 옮길지는 별도 회귀 QA 후 결정

## Resume protocol

새 채팅방에서는 다음 순서로 재개한다.
1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. 이 `HANDOFF.md`
4. `main` 최신 commit
5. active task와 Next action 일치 확인

의미 있는 작업 단위가 끝날 때마다 TASKS/HANDOFF를 함께 갱신한다.
