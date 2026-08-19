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
- [x] Block variant와 Style preset 역할 분리
- [x] `docs/library/blocks/STYLE-PRESET-CONTRACT.md`

## 04. Block Lab
- [x] `/block-lab/` noindex route
- [x] 27개 candidate block
- [x] category / variant / Light-Dark / Fit-390-768-1180
- [x] block type 단위 review: 미결정/승인/재설계/통합/폐기
- [x] block type memo/localStorage/JSON export/filter/summary
- [x] browser Registry health
- [x] server block review sync
- [x] variant metadata: 구조/표현/동작/반응형
- [x] variant maturity: 구현됨/부분 구현/미완성
- [x] variant별 독립 review/memo
- [x] `BLOCK_VARIANT_REVIEWS` Google Sheet
- [x] `/api/editor/variant-reviews`
- [x] block + variant 검토를 `검토 불러오기/저장`에서 함께 동기화
- [x] constrained Block Style preset editor
- [x] style token: density/surface/radius/border/shadow/accent/media ratio/edge treatment
- [x] style preset 이름 저장/불러오기/localStorage
- [x] `BLOCK_STYLE_PRESETS` Google Sheet
- [x] `/api/editor/block-style-presets`
- [x] style preset도 Block Lab 서버 동기화에 포함
- [-] 사용자 실제 화면 검토 및 2차 디자인 정제
- [ ] approved renderer production 승격

중요:
- 27개 Block type은 여전히 모두 `candidate`.
- variant review가 추가됐지만 자동 승인하지 않는다.
- style preset은 구조를 바꾸지 않는다. 구조 변경은 새 variant다.

## 05. UI Refinement / Photography Parity
- [x] typography hierarchy 1차
- [x] spacing rhythm 1차
- [x] 정보 밀도/카드 구조
- [x] 긴 문장/표/수치/비교 가독성
- [x] rail 좌우 runway
- [x] mobile/PC responsive 1차
- [x] accessibility/reduced-motion 계약
- [x] `/qa/video-editor/`와 staging의 공통 `--lab-*` token 불일치 수정
- [x] image 없는 `product-tool/list` 모바일 1열 full-width 회귀 수정
- [x] `docs/library/ui-capabilities/PHOTOGRAPHY-PARITY.md` 작성
- [-] 현재 photography production 고도화 UI를 advanced Block variant / Primitive / UI Capability preset으로 역추출
- [ ] photography Hero/Chapter/Market/Education/Skill/Case/Product/Offer/Roadmap/Script/Tutorial/Resources 1:1 비교
- [ ] 각 항목을 variant/style preset/capability/photography-only로 판정
- [ ] 사용자 parity 검토

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
- [x] browser/server type sync script
- [x] browser/server variant sync script
- [x] Registry health
- [x] publish validation은 server `approved`만 허용
- [x] CI에 type/variant sync 포함
- [x] Editor Library Registry 상태 필터 준비 — 전체 / 승인만 / 후보만
- [-] 사용자 Block/variant review 결과 수집
- [ ] 승인 semantics를 `type + variant` 기준으로 전환
- [ ] 특정 variant만 approved 허용하는 server publish gate
- [ ] Editor에서 approved variant만 production 선택 가능
- [ ] browser/server Registry status 반영
- [ ] approved renderer canonical 승격

## 08. UI Capability / Design Dashboard

### UI Capability Library
- [x] Content Block과 페이지 공통 UI 기능 분리
- [x] `docs/library/ui-capabilities/README.md`
- [x] `CAPABILITY-CONTRACT.md`
- [x] browser capability manifest
- [x] server capability registry
- [x] browser/server capability sync script

현재 capability 7종:
- [x] top chapter navigation
- [x] horizontal card rail
- [x] filter chip rail
- [x] collection bottom sheet
- [x] device handoff accordion
- [x] reading progress
- [x] floating action

### 관리 대상 예시
- 상단 메뉴 on/off/sticky mode/chip family/accent/progress 색상·두께/runway
- 카드 rail desktop drag/native touch/left-right fade/fade width/scrollbar/runway/shadow guard
- 필터칩 Material Flat / iOS Flat / iOS Liquid, 색상, blur, opacity, response, overshoot, gap
- 하단 팝업 backdrop/handle/tabs/search/filter/bulk/theme/device handoff
- `다른 기기 연결` measured-height accordion은 FAQ와 별도 capability

### UI Dashboard
- [x] `/ui-dashboard/` noindex route
- [x] capability 목록
- [x] live specimen
- [x] schema 기반 control 생성
- [x] system/user preset 목록
- [x] custom preset 이름 저장/불러오기/export
- [x] `UI_PRESETS` Google Sheet
- [x] `/api/editor/ui-presets`
- [x] server connect/load/save
- [x] robots crawler 제외
- [ ] photography production 실제 값을 preset으로 정밀 역추출
- [ ] primitive/token 관리 탭 확장
- [ ] dashboard에서 approved/deprecated lifecycle 관리

### Page UI assignment
- [x] `PAGE_UI_CONFIG` Google Sheet
- [x] `/api/editor/page-ui`
- [x] Editor 왼쪽에 `페이지 UI` 영역 동적 연결
- [x] capability on/off + preset 선택
- [x] 서버 불러오기/저장
- [ ] public snapshot에 PAGE_UI_CONFIG resolved config 포함
- [ ] production runtime이 capability preset 실제 적용

### Block Style preset
- [x] `BLOCK_STYLE_PRESETS` Google Sheet
- [x] constrained style manifest
- [x] style preset API
- [x] Block Lab preview/save/load/server sync
- [x] browser Block contract에 `stylePresetId/styleOverrides` 필드 보존
- [x] `PAGE_BLOCKS`에 `style_preset_id`, `style_overrides_json` 컬럼 예약
- [!] 기존 `/api/editor/save-page`는 아직 A:M만 저장함. 서버 round-trip 연결 전까지 Editor instance 선택 UI를 production 용도로 열지 않음
- [ ] save-page/get-page/revision/snapshot 계약을 A:O로 일괄 확장
- [ ] Editor Inspector에서 style preset 선택
- [ ] public snapshot에서 approved style preset 적용

## 09. 관리자 Block Editor

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
- [x] publish snapshot history/full UI preview/rollback draft
- [x] Block Library status filter
- [x] Page UI capability panel

### Google Sheets V1 DB
- [x] `PLATFORM_PAGES`
- [x] `PAGE_BLOCKS`
- [x] `BLOCK_REVISIONS`
- [x] `BLOCK_REVIEWS`
- [x] `BLOCK_VARIANT_REVIEWS`
- [x] `BLOCK_STYLE_PRESETS`
- [x] `UI_PRESETS`
- [x] `PAGE_UI_CONFIG`
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
- [ ] stylePresetId/styleOverrides change-aware 저장 추가

### Protected API
- [x] same-origin + Bearer `ADMIN_EDITOR_TOKEN`
- [x] token 미설정 시 closed
- [x] page list/load/save
- [x] block review save/load
- [x] variant review save/load
- [x] block style preset save/load
- [x] UI preset save/load
- [x] page UI config save/load
- [x] asset metadata/revision/slug/snapshot/publish
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정 + authenticated live QA

### Media
- [x] 기존 repo asset + `MEDIA_ASSETS` picker
- [x] 기존 Drive image pipeline 재사용 원칙
- [ ] 관리자 신규 파일 업로드 → Drive master → Git/public asset 승격 자동화

## 10. AI 콘텐츠 작성/검수
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
- [x] 첫 비사진 QA 분야 `video-editor`
- [x] Git reproducible seed + actual Sheet draft 13 blocks
- [x] draft `noindex + needs_review`
- [x] QA seed validator/CI
- [x] `/qa/video-editor/`
- [x] Adobe/Blackmagic/고용24 evidence
- [-] 시장수요·실제 단가·계약/세금/플랫폼 정책 evidence 추가 보완
- [!] authenticated Editor → AI → server save roundtrip live QA는 ADMIN token 필요

## 11. SEO/GEO + Publish
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
- [x] published snapshot history/preview/rollback
- [x] shared public snapshot runtime
- [x] title/description/robots/OG/Twitter + Article/WebPage JSON-LD
- [x] candidate staging `/staging/public-renderer/`
- [x] active snapshot read-only API `/api/public/snapshot?slug=`
- [ ] approved `type + variant + style preset` 기반 production renderer 연결
- [ ] PAGE_UI_CONFIG resolved config snapshot 포함
- [ ] canonical industry route
- [ ] sitemap
- [ ] real 404
- [ ] Core Web Vitals / 광고 side rail QA
- [ ] 실사용 QA
- [ ] Drive workstream archive

## CI / validation
- [x] Block Registry type sync
- [x] Block variant sync
- [x] UI capability sync
- [x] QA seed validator
- [x] 새 UI dashboard/editor/functions syntax 검사 범위 포함
- [!] GitHub connector에서 최신 workflow run 성공 여부는 아직 확인되지 않음

## Current checkpoints
- [!] `/block-lab/`에서 block type + variant별 실제 판정 필요
- [!] `/ui-dashboard/`의 capability/preset 모바일·PC 검토 필요
- [!] `/qa/video-editor/` 전체 페이지 흐름 검토 계속
- [!] `/staging/public-renderer/` 공개 형태 검토 계속
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` 설정
- [!] 실제 Pages PC/mobile browser QA
- [!] candidate 때문에 production publish는 의도적으로 차단됨

## 다음 자동 진행 순서
1. [-] Photography Parity: 현재 사진 production UI owner와 Block/Capability 1:1 매핑
2. [ ] 사진 고도화 디자인을 advanced variant 또는 style preset으로 Block Lab에 추가
3. [ ] 사진 상단 nav/filter/bottom sheet/accordion 실제 설정을 UI Dashboard preset으로 정밀 추출
4. [ ] `PAGE_BLOCKS` A:O style preset round-trip 계약 연결
5. [ ] approved semantics를 type+variant로 변경
6. [ ] public snapshot에 Block style/UI capability resolved config 포함
7. [ ] 사용자 판정 후 approved renderer 승격

## V1 완료 목표
1. Block/variant/style preset 최종 승인/정제
2. 공통 UI capability/preset 관리 대시보드 실사용 가능
3. Editor에서 Block + Page UI를 함께 구성/저장/복원 가능
4. Editor 저장/AI/미디어/버전/발행 live QA
5. 사진 외 실제 산업 1개를 초안→검수→발행→rollback까지 통과
6. 산업별 public renderer + canonical route
7. SEO/GEO + sitemap + real 404
8. PC/mobile + Core Web Vitals QA
9. PC 광고 side rail을 넣어도 본문/내비게이션이 무너지지 않는 상태
10. workstream QA 자료 Drive archive

AdSense 계정 승인·publisher ID 등 외부 계정 심사는 V1 코드 완료와 별도 checkpoint로 관리한다.

## Resume protocol
1. `AGENTS.md`
2. 이 `TASKS.md`
3. `HANDOFF.md`
4. `main` 최신 commit
5. `다음 자동 진행 순서`와 current checkpoints 비교

대화만 보고 진행 상태를 추정하지 않는다.
