# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 이 workstream의 canonical tracker다. 새 채팅방에서는 대화 기록보다 이 파일과 `HANDOFF.md`를 우선한다.

## 01. Reference Library

- [x] 레퍼런스 분류 체계 정의
- [x] `arknow91/liquid-taffy` 분석/등록
- [x] 사용자 제공 외부 GitHub 링크 9개 전부 확인/등록
- [x] 적용 후보/금지 범위/라이선스/기술 의존성 기록
- [x] design-taste / component-system / interaction-motion / editorial-writing / discovery 분류
- [ ] 이후 발견되는 레퍼런스는 지속 등록

주요 reference:
- `arknow91/liquid-taffy`
- `emilkowalski/skills`
- `Meliwat/awesome-ios-design-md`
- `VoltAgent/awesome-design-md` Apple DESIGN.md
- `Leonxlnx/taste-skill`
- `tastesmd/TASTES.md`
- GitHub `ai-design` topic
- `Shinwoo-Park/katfishnet`
- `DaleSeo/korean-skills`
- `dotoricode/korean-humanizer`
- `NomaDamas/k-skill` korean-humanizer

## 02. Editorial Library

- [x] `docs/spec-v1/20-korean-copywriting-skill.md`와 플랫폼 Editorial Library 연결
- [x] 사용자 문장 규칙/전후 사례 회수
- [x] heading/body/comparison/process/metric/CTA/source/SEO-GEO profile 분리
- [x] AI 작성 허용 범위와 사실 보존 규칙
- [x] 산업 공통 규칙과 photography 특수 규칙 분리

## 03. Block System V1

- [x] photography UI 전수 분해
- [x] 중복 통합
- [x] Content Block / Primitive / Platform Chrome 분리
- [x] block data contract
- [x] variant/responsive/accessibility/editorial/reference profile 계약
- [x] photography 기반 17개 block family

문서:
- `docs/library/blocks/V1-INVENTORY.md`
- `docs/library/blocks/BLOCK-CONTRACT.md`

## 04. Block Lab

- [x] `/block-lab/` 독립 route
- [x] 27개 candidate 렌더
- [x] Fit / 390 / 768 / 1180
- [x] Light/Dark
- [x] variant 비교
- [x] category/status/editorial metadata
- [x] calculator 등 interaction sample
- [x] `미결정 / 승인 / 재설계 / 통합 / 폐기` review UI
- [x] review memo/localStorage/JSON export/filter/summary
- [x] browser Registry health 표시
- [x] Google Sheet `BLOCK_REVIEWS`에 27개 `undecided` seed
- [ ] approved renderer production 승격
- [-] 사용자 실제 화면 검토 및 2차 디자인 정제

중요:
- 27개는 아직 모두 `candidate`다.
- 기존 photography production renderer는 변경하지 않았다.
- `/block-lab/`은 noindex다.

## 05. UI Refinement

- [x] typography hierarchy 1차
- [x] spacing rhythm 1차
- [x] 정보 밀도/카드 구조
- [x] 긴 문장 가독성
- [x] rail 좌우 runway
- [x] 표/수치/비교 가독성
- [x] mobile/PC responsive 1차
- [x] accessibility/reduced-motion 계약
- [-] 실제 화면 피드백 기반 2차 정제

기준:
- `docs/library/design-taste/PLATFORM-TASTES.md`
- `public/assets/styles/block-lab/refinement-v2.css`

## 06. 신규 범용 Block

- [x] `faq`
- [x] `pros-cons`
- [x] `comparison-table`
- [x] `timeline`
- [x] KPI/stat → `metric-grid`에 통합
- [x] `image-copy-split`
- [x] `gallery`
- [x] `quote-expert`
- [x] `calculator`
- [x] `service-list`
- [x] `cta`
- [!] location/map → provider/API/privacy 계약 전 보류

총 candidate: 27개.

## 07. Approved Block Registry

- [x] browser manifest — `public/data/block-registry/v1/manifest.js`
- [x] browser runtime validation
- [x] server publish Registry — `functions/lib/block-registry-v1.js`
- [x] approval lifecycle 문서 — `docs/library/blocks/APPROVAL-WORKFLOW.md`
- [x] browser/server Registry sync script — `scripts/check-block-registry-sync.mjs`
- [x] 승인 작업 시 두 Registry 동시 수정 강제
- [x] publish validation은 server Registry의 `approved`만 허용
- [x] Registry/editor Functions syntax CI — `.github/workflows/platform-library-checks.yml`
- [-] 사용자 Block Lab review 결과 수집
- [ ] block별 최종 판정
- [ ] browser/server status에 approved/redesign/deprecated 반영
- [ ] approved renderer canonical 승격

자동 승인 금지. 현재 browser/server 27개 모두 candidate.

## 08. 관리자 Block Editor

### Editor Lab

- [x] `/editor-lab/` 독립 noindex route
- [x] 27개 block library/search
- [x] add/reorder/drag-and-drop/up-down/duplicate/delete
- [x] variant/content recursive inspector
- [x] block AI policy / field lock / fact state
- [x] block별 빠른 편집 profile — `inspector-friendly.js`
- [x] 390/768/1180 + Light/Dark
- [x] edit/preview
- [x] localStorage draft
- [x] undo/redo
- [x] JSON import/export
- [x] industry ID / slug
- [x] 새 페이지 / 페이지 복제
- [x] SEO metadata editor
- [x] 서버 연결/목록/저장/불러오기
- [x] token은 sessionStorage only
- [x] media picker
- [x] block revision history 조회/브라우저 복원
- [x] publish-check/publish UI

### Google Sheets V1 DB

실제 생성/검증:
- [x] `PLATFORM_PAGES`
- [x] `PAGE_BLOCKS`
- [x] `BLOCK_REVISIONS`
- [x] `BLOCK_REVIEWS`
- [x] `MEDIA_ASSETS`
- [x] `PUBLISH_SNAPSHOTS`
- [x] `PUBLISHED_BLOCKS`
- [x] `brief_json`, `ai_status`, `ai_review_json`

### Media

- [x] `MEDIA_ASSETS` metadata API — `/api/editor/assets`
- [x] 기존 repo/Cloudflare image + MEDIA_ASSETS picker
- [x] sample asset seed
- [x] 기존 Drive `Photo-eBook Image Pipeline V1` 재사용 원칙 확인
- [x] Drive master/archive와 public asset URL 역할 분리
- [ ] 관리자 웹에서 신규 파일 업로드 → Drive master → Git/public asset 승격 자동화

### Revision / save hardening

- [x] revision history API — `/api/editor/revisions`
- [x] 과거 version을 browser draft로 복원
- [x] 기존 행 선삭제 금지
- [x] 변경 감지 저장 exact route — `/api/editor/save-page`
- [x] content/evidence/AI policy를 stable JSON으로 비교
- [x] 실제 변경된 block만 revision_version 증가
- [x] 변경 없는 block은 row update/revision append 생략
- [x] 제거 block은 삭제 snapshot revision 기록 후 clear
- [x] Editor server save와 publish pre-save가 `/save-page` 사용

### 보호된 Editor API

- [x] same-origin + Bearer `ADMIN_EDITOR_TOKEN`
- [x] token 미설정 시 closed
- [x] page list/load
- [x] change-aware draft save
- [x] review save
- [x] asset metadata
- [x] revision read
- [x] publish-check
- [x] publish snapshot
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정 및 live authenticated QA

저장 설계:
- `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`
- 구조화 콘텐츠 → Google Sheets
- master/file/archive → Google Drive
- public static asset/renderer/schema/permanent rules → Git + Cloudflare
- localStorage → local/offline draft fallback

## 09. AI 콘텐츠 작성/검수

- [x] page brief UI
- [x] topic/audience/goal/context/mustCover/avoid/tone/research/source priority/sensitivity
- [x] `platform-ai-content-request/v1`
- [x] editorialProfile/referenceProfiles 포함
- [x] block policy `full / wording_only / fact_check_only / locked`
- [x] field lock
- [x] factState/evidence
- [x] `platform-ai-content-response/v1`
- [x] safe import
- [x] pageId/blockId/type 검증
- [x] wording-only 구조 보존
- [x] locked/fact-check-only 차단
- [x] evidence 없는 verified 거부
- [x] page review / blocker
- [x] AI 적용 후 `needs_review`
- [x] brief/status/review Sheet 저장/복원
- [x] 최근 AI review Editor 표시
- [ ] 실제 신규 산업 페이지 1개 end-to-end QA

문서:
- `docs/library/ai-content/README.md`
- `AI-CONTENT-CONTRACT-V1.md`
- `AI-CONTENT-RESPONSE-V1.md`

## 10. SEO/GEO + Publish

- [x] `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`
- [x] `seo_json` + Editor UI
- [x] title/description/Article|WebPage/OG/site/author/index/reviewedAt
- [x] source/evidence snapshot 포함
- [x] draft/published 분리
- [x] immutable-style snapshot tables
- [x] server publish-check / publish
- [x] approved block / AI review / stale fact 검사
- [x] disabled block publish 제외
- [x] `/block-lab/`, `/editor-lab/`, `/api/` crawler 제외
- [x] `public/robots.txt`
- [x] public route에서 OAI-SearchBot을 별도 차단하지 않는 정책
- [ ] approved block 기반 public snapshot renderer
- [ ] canonical public route 확정
- [ ] public title/meta/canonical/OG/Twitter 적용
- [ ] JSON-LD
- [ ] sitemap
- [ ] real 404 / soft-404 해소
- [ ] Core Web Vitals / 광고 side rail QA
- [ ] 실사용 QA
- [ ] Drive workstream archive

public renderer는 사용자 block 승인 전 production에 연결하지 않는다.

## 현재 blocker / checkpoint

- [!] 사용자 `/block-lab/` 시각 검토 및 block 최종 판정
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` 설정
- [!] 실제 Pages PC/mobile browser QA
- [!] 모든 block이 candidate이므로 production publish는 의도적으로 차단됨

## 다음 자동 진행 가능 항목

- [ ] published snapshot preview/history UI
- [ ] page-level revision/rollback UX
- [ ] slug 중복 검사 강화
- [ ] approved 상태 반영 후 production picker 필터 전환 준비
- [ ] public snapshot renderer를 production 미연결 상태로 staging 설계

## 재개 규칙

1. `AGENTS.md`
2. 이 `TASKS.md`
3. 같은 폴더 `HANDOFF.md`
4. `main` 최신 commit
5. active/checkpoint 상태 확인
6. 관련 permanent spec/runtime 읽기

대화만 보고 진행 상태를 추정하지 않는다. 의미 있는 단위마다 TASKS/HANDOFF를 함께 갱신한다.
