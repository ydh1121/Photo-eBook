# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 이 workstream의 작업 순서와 현재 상태를 나타내는 canonical tracker다. 새 채팅방에서 작업을 재개할 때 대화 기록보다 이 파일을 우선한다.

## 01. Reference Library

- [x] 레퍼런스 분류 체계 정의
- [x] `arknow91/liquid-taffy` 분석/등록
- [x] 사용자가 제공한 과거 외부 GitHub 링크 세트 9개 전부 확인/등록
- [x] 각 레퍼런스에 적용 후보/금지 범위/라이선스/기술 의존성 기록
- [x] design-taste / component-system / interaction-motion / editorial-writing / discovery 분류 확장
- [x] Reference Library index 확정
- [ ] 향후 추가로 발견되는 과거/신규 레퍼런스는 지속 등록

현재 주요 reference:
- `arknow91/liquid-taffy`
- `emilkowalski/skills`
- `Meliwat/awesome-ios-design-md`
- `VoltAgent/awesome-design-md` Apple DESIGN.md
- `Leonxlnx/taste-skill`
- `tastesmd/TASTES.md`
- GitHub `ai-design` topic discovery source
- `Shinwoo-Park/katfishnet`
- `DaleSeo/korean-skills`
- `dotoricode/korean-humanizer`
- `NomaDamas/k-skill` korean-humanizer

## 02. Editorial Library

- [x] 기존 `docs/spec-v1/20-korean-copywriting-skill.md`를 상위 Editorial Library와 연결
- [x] 사용자가 기획자로서 확정한 문장 작성 규칙 회수
- [x] 실제 before/after 사례 분류
- [x] heading / body / comparison / process / metric / CTA / source / SEO-GEO 규칙 분리
- [x] AI 작성 허용 범위와 사실 검증 규칙 정의
- [x] 산업 독립 규칙과 photography 특수 규칙 분리

## 03. UI Block Inventory + Block System V1

- [x] photography 페이지 시각 패턴 전수 분해
- [x] 중복 블록 통합
- [x] 챕터에 묶인 UI를 독립 block 후보로 분리
- [x] block data schema 정의
- [x] variant / responsive / accessibility 계약 정의
- [x] block별 editorial profile 연결
- [x] block별 reference profile 연결

완료 메모:
- `docs/library/blocks/V1-INVENTORY.md`
- `docs/library/blocks/BLOCK-CONTRACT.md`
- Content Block / Primitive / Platform Chrome 분리
- photography에서 17개 block family 추출

## 04. Block Lab

- [x] production과 분리된 `/block-lab/` route 생성
- [x] 27개 candidate block을 한 페이지에서 렌더
- [x] Fit / 390 / 768 / 1180 preview
- [x] light/dark preview
- [x] block별 variant 비교
- [x] candidate Block Registry + renderer 분리
- [x] block status/editorial profile/type 메타 표시
- [x] calculator interaction 샘플 동작
- [x] block별 사용자 review control 추가
- [x] review 상태 localStorage 저장
- [x] review JSON export
- [x] review 상태 필터/요약
- [x] registry manifest/runtime health 표시
- [x] `BLOCK_REVIEWS` Sheet에 27개 type을 `undecided`로 초기화
- [ ] 승인 후 실제 production renderer로 승격/공유
- [-] 배포 후 실제 화면 QA 및 사용자 디자인 검토

중요:
- Block Lab renderer는 아직 `candidate`다.
- 기존 photography production renderer는 변경하지 않았다.
- `/block-lab/`은 HTML meta와 `X-Robots-Tag` 모두 noindex 처리함.

## 05. UI Refinement

코드 레벨 1차 정제:
- [x] typography hierarchy
- [x] spacing rhythm
- [x] 정보 밀도
- [x] 카드 내부 구조
- [x] 긴 문장 가독성
- [x] 가로 rail 좌우 runway/여백
- [x] 표/수치/비교 가독성
- [x] 모바일/PC responsive 1차 정제
- [x] 접근성/reduced-motion 기존 계약 유지
- [-] 실제 화면 기준 사용자 피드백 반영 및 2차 정제

관련:
- `docs/library/design-taste/PLATFORM-TASTES.md`
- `public/assets/styles/block-lab/refinement-v2.css`

## 06. 신규 범용 블록

- [x] FAQ / accordion → `faq`
- [x] pros & cons → `pros-cons`
- [x] comparison table → `comparison-table`
- [x] timeline → `timeline`
- [x] KPI / stat → 별도 type 없이 기존 `metric-grid`에 통합
- [x] image + copy split → `image-copy-split`
- [x] gallery → `gallery`
- [x] quote / expert comment → `quote-expert`
- [x] calculator / simulation → `calculator`
- [!] location / map → provider/API/privacy 계약 전까지 보류
- [x] service/business comparison → `service-list` + 기존 comparison 조합
- [x] CTA / external action → `cta`

완료 메모:
- 신규 독립 type 10개 추가
- 총 candidate 27개
- `docs/library/blocks/V1-EXPANSION.md`

## 07. Approved Block Registry

- [x] runtime manifest 생성 — `public/data/block-registry/v1/manifest.js`
- [x] manifest와 renderer type/variant health validation
- [x] browser production 사용 가능 여부 검사 API
- [x] server publish용 Registry status helper — `functions/lib/block-registry-v1.js`
- [x] approval lifecycle 문서화 — `docs/library/blocks/APPROVAL-WORKFLOW.md`
- [x] 사용자 Block Lab review 결과를 저장/내보낼 UI 구현
- [x] Google Sheet `BLOCK_REVIEWS` 저장 구조 준비
- [x] 보호된 `/api/editor/reviews` write endpoint 코드 준비
- [-] 사용자 Block Lab 검토 결과 수집
- [ ] block별 `approved / redesign / merge / deprecated` 최종 판정
- [ ] browser manifest와 server Registry에 approved lifecycle 반영
- [x] publish validation에서 approved block만 허용하도록 연결
- [ ] 승인 renderer를 production/admin canonical renderer로 승격

중요:
- 사용자 시각 검토 전 자동 승인하지 않는다.
- browser manifest와 server Registry의 27개 type은 현재 모두 `candidate`다.
- 현재 발행 검사는 candidate block을 정상적으로 차단해야 한다.

## 08. 관리자 Block Editor

### Editor Lab — 구현됨
- [x] production과 분리된 `/editor-lab/` route
- [x] 27개 candidate library 표시/search
- [x] block 추가
- [x] drag-and-drop 순서 변경
- [x] 위/아래 이동 대체 조작
- [x] block 복제/삭제
- [x] variant 변경
- [x] content 문자열/숫자/배열/객체 편집 inspector
- [x] block AI 수정 정책 / field lock / fact state inspector
- [x] desktop/tablet/mobile preview (1180/768/390)
- [x] light/dark preview
- [x] edit/preview mode
- [x] localStorage draft
- [x] undo/redo
- [x] JSON import/export
- [x] 같은 Block Registry renderer 사용
- [x] 산업 ID / URL slug 페이지 메타데이터 UI
- [x] 새 페이지 / 페이지 복제
- [x] 서버 연결 UI
- [x] 서버 초안 목록 / 저장 / 불러오기 UI
- [x] 관리자 토큰은 `sessionStorage`에만 보관
- [x] SEO metadata 편집 UI
- [x] 발행 검사 / 발행 action UI

### Google Sheets V1 DB — 실제 생성/검증됨
- [x] `PLATFORM_PAGES`
- [x] `PAGE_BLOCKS`
- [x] `BLOCK_REVISIONS`
- [x] `BLOCK_REVIEWS`
- [x] `MEDIA_ASSETS`
- [x] `PUBLISH_SNAPSHOTS`
- [x] `PUBLISHED_BLOCKS`
- [x] `PLATFORM_PAGES`에 `brief_json`, `ai_status`, `ai_review_json` 추가
- [x] 헤더/기본 validation 설정

### 보호된 Editor API — 코드 구현됨
- [x] 별도 `functions/api/editor/[[path]].js`
- [x] 기존 공개 `/api/rpc`와 분리
- [x] same-origin + Bearer `ADMIN_EDITOR_TOKEN`
- [x] token 미설정 시 모든 editor API 거부
- [x] page 목록/불러오기
- [x] draft page 저장
- [x] block revision 기록
- [x] block review 저장
- [x] AI brief/status/review 저장
- [x] draft save 시 기존 행을 먼저 삭제하지 않는 non-destructive 순서
- [x] 발행 전 server-side validation
- [x] immutable-style publish snapshot append
- [x] 이전 active snapshot supersede
- [x] disabled block은 publish 대상에서 제외
- [-] Cloudflare `ADMIN_EDITOR_TOKEN` 환경변수 설정 및 live API 검증

### Production 관리자 연결 — 남음
- [ ] block-specific friendly inspector schema 2차 정제
- [ ] 이미지 asset picker / Drive 업로드 연결
- [ ] 정식 관리자 인증/session 방식으로 교체 여부 결정
- [ ] revision history 조회/복원 UI
- [ ] published snapshot preview
- [ ] approved block만 production picker에 노출
- [ ] server save/load/publish 실사용 QA

저장 설계:
- `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`
- V1 구조화 콘텐츠: Google Sheets
- 이미지/파일/archive: Google Drive
- renderer/schema/permanent rules: Git
- `/editor-lab/` localStorage는 offline/local draft fallback

## 09. AI 콘텐츠 작성/검수

공급자 API에 종속되지 않는 JSON 왕복 방식으로 구현한다.

- [x] page brief 입력 UI
- [x] topic / audience / goal / context / mustCover / avoid / tone / research / source priority / sensitivity
- [x] `platform-ai-content-request/v1` export
- [x] block별 editorialProfile / referenceProfiles를 AI request에 포함
- [x] block AI policy: `full / wording_only / fact_check_only / locked`
- [x] top-level field lock UI
- [x] factState / evidence 구조
- [x] `platform-ai-content-response/v1` 계약
- [x] AI 결과 JSON import
- [x] pageId / blockId / block type 검증
- [x] wording-only 구조 보존
- [x] locked / fact-check-only 자동 수정 차단
- [x] evidence 없는 `verified` 자동 거부
- [x] 전체 페이지 AI review / blocker 기록
- [x] AI 적용 후 자동 `needs_review`
- [x] `aiReview` Google Sheets 서버 draft 저장/복원
- [x] 최근 AI 검토 요약 Editor 표시
- [ ] 실제 산업 페이지 1개로 end-to-end AI 작성/검수 QA

문서:
- `docs/library/ai-content/README.md`
- `AI-CONTENT-CONTRACT-V1.md`
- `AI-CONTENT-RESPONSE-V1.md`

## 10. SEO/GEO + Publish

- [x] 공통 publish/SEO/GEO 계약 — `docs/library/publishing/PUBLISH-SEO-GEO-V1.md`
- [x] page `seo_json` 구조 정의
- [x] Editor SEO metadata UI
- [x] SEO title / description / Article|WebPage / OG image / site / author / index policy / reviewedAt
- [x] source/evidence를 published block snapshot에 포함
- [x] draft와 published snapshot 분리
- [x] `PUBLISH_SNAPSHOTS` / `PUBLISHED_BLOCKS` 생성
- [x] protected publish-check endpoint
- [x] protected publish endpoint
- [x] block approval / AI review / stale fact 검사
- [x] `/block-lab/`, `/editor-lab/`, `/api/` crawler 제외 정책
- [x] `public/robots.txt` 생성
- [x] public route에서 `OAI-SearchBot`을 차단하지 않는 정책
- [ ] 승인 block 기반 public snapshot renderer
- [ ] 실제 public canonical route 확정
- [ ] `<title>` / meta description / canonical / OG/Twitter runtime 적용
- [ ] JSON-LD 렌더
- [ ] published canonical URL 기반 sitemap 생성
- [ ] public 404/soft-404 처리
- [ ] Core Web Vitals/광고 rail QA
- [ ] 실사용 QA
- [ ] Drive workstream archive

현재 Phase 10의 public renderer 관련 항목은 사용자 Block 승인 전 production에 연결하지 않는다.

## 현재 외부 blocker

- [!] 사용자 `/block-lab/` 시각 검토 및 block 최종 판정 필요
- [!] Cloudflare 배포 환경 `ADMIN_EDITOR_TOKEN` 설정 필요
- [!] 현재 도구 환경에서 live Pages UI/device browser QA 미완료

## 재개 규칙

새 채팅방 또는 다른 작업 세션에서 이 workstream을 재개할 때는 반드시 다음 순서로 시작한다.

1. 저장소 루트 `AGENTS.md` 읽기
2. 이 `TASKS.md` 읽기
3. 같은 폴더의 `HANDOFF.md` 읽기
4. `main` 최신 commit 확인
5. `[-] active` 항목과 `HANDOFF.md`의 `Next action`이 일치하는지 확인
6. 마지막 변경 파일과 관련 명세를 읽은 뒤 작업 재개

대화 기록만 보고 현재 상태를 추정하지 않는다.
