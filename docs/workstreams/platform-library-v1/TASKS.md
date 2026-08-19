# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 이 workstream의 canonical tracker다. 새 채팅방에서는 대화 기록보다 이 파일과 `HANDOFF.md`를 우선한다.

## 01. Reference Library
- [x] 사용자 제공 외부 GitHub 링크 9개 + 기존 reference 등록
- [x] design-taste / component-system / interaction-motion / editorial-writing / discovery 분류
- [x] 적용 후보/금지 범위/라이선스/기술 의존성 기록
- [ ] 이후 발견되는 reference 지속 등록

## 02. Editorial Library
- [x] 플랫폼 공통 문체 규칙
- [x] Block type별 editorial profile
- [x] AI 작성/검수/사실 보존 계약
- [x] 사용자 before/after 사례
- [x] photography 특수 규칙과 공통 규칙 분리
- [x] Google Sheet `COPY_GUIDE`와 연결

## 03. Block System V1
- [x] photography UI 전수 분해
- [x] Content Block / Primitive / Platform Chrome 분리
- [x] block data contract
- [x] variant/responsive/accessibility/editorial/reference profile 계약
- [x] 기존 17개 family + 신규 범용 block 확장

## 04. Block Lab
- [x] `/block-lab/` noindex route
- [x] 27개 candidate block
- [x] category / variant / Light-Dark / Fit-390-768-1180
- [x] review UI: 미결정/승인/재설계/통합/폐기
- [x] review memo/localStorage/JSON export/filter/summary
- [x] browser Registry health
- [x] `BLOCK_REVIEWS` 27개 undecided seed
- [x] server review loader `/api/editor/review-list`
- [x] Block Lab `서버 연결 / 검토 불러오기 / 검토 저장`
- [-] 사용자 실제 화면 검토 및 2차 디자인 정제
- [ ] approved renderer production 승격

중요: 27개는 여전히 모두 `candidate`. 자동 승인 금지.

## 05. UI Refinement
- [x] typography hierarchy 1차
- [x] spacing rhythm 1차
- [x] 정보 밀도/카드 구조
- [x] 긴 문장/표/수치/비교 가독성
- [x] rail 좌우 runway
- [x] mobile/PC responsive 1차
- [x] accessibility/reduced-motion 계약
- [-] 실제 화면 피드백 기반 2차 정제

## 06. 신규 범용 Block
- [x] FAQ
- [x] Pros / Cons
- [x] Comparison Table
- [x] Timeline
- [x] KPI/stat → metric-grid 통합
- [x] Image + Copy
- [x] Gallery
- [x] Quote / Expert
- [x] Calculator
- [x] Service List
- [x] CTA
- [!] location/map → provider/API/privacy 계약 전 보류

## 07. Approved Block Registry
- [x] browser manifest
- [x] server publish Registry
- [x] browser/server sync script
- [x] Registry health
- [x] publish validation은 server `approved`만 허용
- [x] CI에 Registry sync 포함
- [x] Editor Library Registry 상태 필터 준비 — 전체 / 승인만 / 후보만
- [-] 사용자 Block Lab review 결과 수집
- [ ] block별 최종 판정
- [ ] browser/server Registry status 반영
- [ ] approved renderer canonical 승격

## 08. 관리자 Block Editor

### Editor Lab
- [x] `/editor-lab/` noindex route
- [x] 27 block library/search
- [x] add/reorder/drag-drop/up-down/duplicate/delete
- [x] recursive inspector + 빠른 편집
- [x] variant / AI policy / field lock / fact state
- [x] Light/Dark + 390/768/1180
- [x] edit/preview
- [x] localStorage / undo-redo / JSON import-export
- [x] industry ID / slug / new page / duplicate page
- [x] SEO metadata
- [x] AI brief/request export + response safe import
- [x] server connect/page list/save/load
- [x] media picker
- [x] block revision history/restore
- [x] publish-check/publish UI
- [x] slug conflict check
- [x] publish snapshot history
- [x] snapshot 390/768/1180 full UI preview
- [x] snapshot → browser draft rollback
- [x] Block Library status filter: 전체 / 승인만 / 후보만

### Google Sheets V1 DB
- [x] `PLATFORM_PAGES`
- [x] `PAGE_BLOCKS`
- [x] `BLOCK_REVISIONS`
- [x] `BLOCK_REVIEWS`
- [x] `MEDIA_ASSETS`
- [x] `PUBLISH_SNAPSHOTS`
- [x] `PUBLISHED_BLOCKS`

### Save hardening
- [x] `/api/editor/save-page` change-aware save
- [x] stable JSON comparison
- [x] changed block만 revision 증가
- [x] unchanged block revision 생략
- [x] removed block 삭제 snapshot 후 clear
- [x] 기존 row 선삭제 금지

### Protected API
- [x] same-origin + Bearer `ADMIN_EDITOR_TOKEN`
- [x] token 미설정 시 closed
- [x] page list/load/save
- [x] review save/load
- [x] asset metadata
- [x] revision read
- [x] slug conflict
- [x] snapshot history
- [x] publish-check/publish
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정 + authenticated live QA

### Media
- [x] 기존 repo asset + `MEDIA_ASSETS` picker
- [x] 기존 Drive image pipeline 재사용 원칙
- [ ] 관리자 신규 파일 업로드 → Drive master → Git/public asset 승격 자동화

## 09. AI 콘텐츠 작성/검수
- [x] page brief schema/UI
- [x] request/response contract
- [x] editorial/reference profile 전달
- [x] full / wording_only / fact_check_only / locked
- [x] field lock
- [x] factState/evidence
- [x] safe import / identity validation
- [x] evidence 없는 verified 거부
- [x] AI 적용 후 `needs_review`
- [x] Sheet 저장/복원
- [x] 첫 비사진 QA 분야 선택: `video-editor`
- [x] Git reproducible seed: `docs/workstreams/platform-library-v1/qa/video-editor-draft-v1.json`
- [x] 실제 `PLATFORM_PAGES`에 `page_video_editor_qa_v1` draft 생성
- [x] 실제 `PAGE_BLOCKS`에 13 block 생성
- [x] draft는 `noindex + needs_review`
- [x] QA seed validator: `scripts/check-platform-qa-seed.mjs`
- [x] CI에 QA seed 검사 연결
- [x] 전체 페이지 QA route `/qa/video-editor/`
- [x] Adobe Premiere 공식 가격/기능 evidence 연결
- [x] Blackmagic DaVinci Resolve 무료 버전/기능 evidence 연결
- [x] 고용24 영상편집 NCS/훈련과정 evidence 연결
- [x] 변동 가격 충돌 시 확정값으로 잠그지 않는 정책 적용
- [x] evidence 변경 revision 기록
- [-] 시장수요·실제 단가·계약/세금/플랫폼 정책 evidence 추가 보완
- [!] authenticated Editor → AI → server save roundtrip live QA는 ADMIN token 필요

QA evidence:
- `docs/workstreams/platform-library-v1/qa/video-editor-evidence-v1.json`
- `public/data/qa/video-editor-evidence-v1.js`

## 10. SEO/GEO + Publish
- [x] publish/SEO/GEO contract
- [x] `seo_json` + Editor UI
- [x] source/evidence snapshot
- [x] draft/published 분리
- [x] immutable-style snapshot tables
- [x] server publish-check/publish
- [x] approved block / AI review / stale fact 검사
- [x] disabled block 제외
- [x] labs/API/QA/staging crawler 제외
- [x] `robots.txt`
- [x] OAI-SearchBot public route 별도 차단하지 않는 정책
- [x] published snapshot history/preview/rollback draft UI
- [x] shared public snapshot runtime — `public/assets/js/public-snapshot/runtime.js`
- [x] title/description/robots/OG/Twitter metadata 적용 함수
- [x] Article/WebPage JSON-LD 생성 함수
- [x] candidate 허용 staging `/staging/public-renderer/`
- [x] active snapshot 전용 read-only API `/api/public/snapshot?slug=`
- [x] public snapshot API는 draft 미노출, active snapshot만 반환
- [ ] approved block 기반 public snapshot renderer production 연결
- [ ] canonical industry route 확정
- [ ] production canonical URL 적용
- [ ] sitemap
- [ ] real 404 / soft-404 해소
- [ ] Core Web Vitals / 광고 side rail QA
- [ ] 실사용 QA
- [ ] Drive workstream archive

## CI / validation
- [x] Registry sync script
- [x] QA seed validator
- [x] public snapshot/editor/public API syntax 검사 범위 포함
- [!] GitHub connector에서 workflow run 성공 여부는 아직 확인되지 않음

## Current blockers / checkpoints
- [!] 사용자 `/block-lab/` 시각 검토 및 27 block 최종 판정
- [!] 사용자 `/qa/video-editor/` 전체 페이지 흐름 검토
- [!] 사용자 `/staging/public-renderer/` 공개 형태 검토
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` 설정
- [!] 실제 Pages PC/mobile browser QA
- [!] candidate block 때문에 production publish는 의도적으로 차단됨

## 다음 자동 진행 가능 항목
- [-] video-editor 시장/계약/비용 evidence 추가 보완
- [ ] page-level draft revision/rollback UX 추가 검토
- [ ] public route/404/sitemap production 연결을 위한 route 설계 마무리
- [ ] 광고 side rail용 desktop layout contract 사전 설계

## V1 완료 목표
1. Block 최종 승인/정제
2. Editor 저장/AI/미디어/버전/발행 live QA
3. 사진 외 실제 산업 1개를 초안→검수→발행→rollback까지 통과
4. 산업별 public renderer + canonical route
5. title/meta/canonical/OG/Twitter + JSON-LD + sitemap + real 404
6. PC/mobile + Core Web Vitals QA
7. PC 광고 side rail을 넣어도 본문/내비게이션이 무너지지 않는 상태
8. workstream QA 자료 Drive archive

AdSense 계정 승인·publisher ID 등 외부 계정 심사는 V1 코드 완료와 별도 checkpoint로 관리한다.

## Resume protocol
1. `AGENTS.md`
2. 이 `TASKS.md`
3. `HANDOFF.md`
4. `main` 최신 commit
5. current blocker/next action 확인

대화만 보고 진행 상태를 추정하지 않는다.
