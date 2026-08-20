# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 현재 남은 작업의 canonical tracker다. 상세 구현 상태와 정확한 파일은 `HANDOFF.md`가 보완한다.

## 01. Reference / Editorial
- [x] 외부 GitHub/UI/한국어 reference library
- [x] 사용자 문체 규칙 + COPY_GUIDE 연결
- [x] Block별 editorial profile
- [x] AI 사실/수치/사용자 문장 보존 계약
- [x] canonical route loading/404 copy를 COPY_GUIDE에 추가
- [x] UI Dashboard 실시간 미리보기/한글 상태 표시 규칙을 COPY_GUIDE에 추가
- [x] photography production parity / 원본-vs-범용 실험 표시 규칙을 COPY_GUIDE에 추가
- [ ] 이후 발견되는 reference 지속 등록

## 02. Block System
- [x] Content Block / Primitive / Platform Chrome 분리
- [x] 27 Block type
- [x] block data / responsive / accessibility contract
- [x] variant와 Style preset 역할 분리
- [x] constrained Style preset contract
- [x] browser/server variant registry sync

## 03. Block Lab
- [x] `/block-lab/` noindex
- [x] type 단위 review + memo
- [x] variant 단위 review + memo
- [x] variant 차이: structure / visual / behavior / responsive
- [x] maturity: implemented / partial / placeholder
- [x] Block Style preset 조절/이름 저장/불러오기
- [x] Block Style preset lifecycle: draft / approved / redesign / deprecated
- [x] server sync: type review + variant review + style preset
- [x] Light/Dark + Fit/390/768/1180
- [-] 사용자 실제 디자인 검토
- [ ] review 결과에 따른 2차 디자인 정제
- [ ] 최종 approved variant 확정

자동 승인은 하지 않는다. publish gate는 저장된 `BLOCK_VARIANT_REVIEWS`의 사용자 판정을 우선 사용한다.

## 04. Photography Parity

### Page UI Capability 추출
- [x] top chapter navigation 실제 production 값 추출
- [x] horizontal card rail 실제 production 값 추출
- [x] collection bottom sheet / secondary filter 추출
- [x] device handoff accordion 추출
- [x] UI Dashboard photography preset 1차 보정
- [x] photography-extracted UI는 production과 100% source parity를 기준으로 판정하는 계약 고정
- [x] UI Dashboard `사진 페이지 원본` same-origin actual production mode
- [x] `사진 페이지 원본` / `범용 실험` preview 분리
- [x] 원본 mode viewport: 현재 폭 / 모바일 390 / PC 1180
- [x] 원본 mode가 actual production DOM/CSS/JS로 상단 메뉴/rail/collection/device handoff/progress/FAB를 직접 조작하도록 연결
- [ ] Safari browser chrome 연동 deferred-sticky는 실제 `/photography/` 전체 화면에서 최종 parity QA
- [ ] floating action / collection 세부 primitive 추가 추출

### Content Block 1:1 분류
- [x] Hero
- [x] Chapter Hero
- [x] Market comparison
- [x] Education scored card
- [x] Checklist
- [x] Skill/media
- [x] Portfolio case
- [x] Product rail/list
- [x] Offer
- [x] Revenue roadmap
- [x] Script
- [x] Tutorial preview/preset/detail
- [x] Sources/guide modules

Permanent classification:
- `docs/library/blocks/photography/PARITY-V1.md`
- `docs/library/ui-capabilities/PHOTOGRAPHY-PARITY.md`

새 advanced candidate variants:
- [x] `hero / immersive-metrics`
- [x] `chapter-hero / image-overlay`
- [x] `comparison-cards / visual-metrics`
- [x] `roadmap / metric-cards`

- [x] photography 기존 variant용 built-in Style preset 추출/Sheet seed
- [ ] base skill-card generic destination 결정
- [ ] numbered checklist mini-card vs unified surface 결정
- [-] 사용자 parity review

Photography production renderer 자체는 변경하지 않는다.

Long-term target:
`photography production owner → approved shared primitive/capability 추출 → photography와 신규 산업이 같은 shared source 사용`

## 05. UI Capability / Design Dashboard
- [x] UI Capability contract
- [x] 7 capability manifest
- [x] `/ui-dashboard/` noindex
- [x] custom preset save/load/export
- [x] `UI_PRESETS` server sync
- [x] built-in photography/system UI preset Sheet seed
- [x] UI preset lifecycle: draft / approved / redesign / deprecated
- [x] `PAGE_UI_CONFIG` page assignment
- [x] Editor `페이지 UI` on/off + preset 선택 + server save/load
- [x] publish snapshot에 immutable resolved UI config 저장
- [x] public runtime: horizontal-card-rail 실제 적용
- [x] public runtime: reading-progress 실제 적용
- [x] Dashboard 설정 변경 즉시 specimen 반영
- [x] Dashboard 7개 capability 직접 조작형 `범용 실험` preview
- [x] Dashboard 드롭다운/상태/source/category 한글 표시
- [x] Dashboard 기본값 복원 + 현재 상태 요약
- [x] Dashboard `사진 페이지 원본` mode는 actual `/photography/`를 iframe으로 재사용
- [x] 원본 mode와 실험 controls를 혼동하지 않도록 원본에서는 실험 controls 잠금 표시
- [-] 사용자 실제 UI Dashboard 원본 parity + 범용 실험 조작 검토
- [-] generic surface가 필요한 capability의 public runtime 적용 확대
- [ ] capability 자체 approved/deprecated lifecycle UI
- [ ] shared primitive/token 관리 탭

사진 원본 mode와 범용 실험 mode를 같은 승인 근거로 섞지 않는다. photography-extracted preset은 원본 mode와 visual/interaction/function/responsive parity가 맞아야 승인할 수 있다.

Current capabilities:
1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

## 06. Block Style preset
- [x] `BLOCK_STYLE_PRESETS` Sheet/API
- [x] constrained browser/server style schema
- [x] Block Lab preview/save/load/server sync
- [x] `PAGE_BLOCKS` N/O style columns
- [x] browser block normalize preserves `stylePresetId/styleOverrides`
- [x] exact `/api/editor/save-page` A:O style-aware change detection/revisions
- [x] exact `/api/editor/page` style-aware load
- [x] shared Block Style runtime/CSS
- [x] Editor Inspector current type+variant preset selector
- [x] Editor Canvas immediate style preview
- [x] server style preset merge in Editor
- [x] photography built-in Style presets 12개 seed
- [x] preset review lifecycle UI
- [x] immutable `PUBLISHED_BLOCK_STYLES` snapshot
- [x] public Snapshot V2에서 resolved style 적용
- [x] publish gate에서 approved style preset 검사

## 07. Editor / Admin
- [x] Block Editor Lab
- [x] add/reorder/drag/duplicate/delete
- [x] recursive inspector + friendly quick edit
- [x] variant / AI policy / locks / fact state
- [x] Light/Dark + 390/768/1180
- [x] local draft / undo-redo / JSON import-export
- [x] industry/page metadata / slug / duplicate
- [x] SEO
- [x] AI brief/request/response/review
- [x] server page save/load
- [x] media picker
- [x] block revision restore
- [x] publish history preview/rollback draft
- [x] Page UI capability panel
- [x] Block Style preset selector
- [x] snapshot preview/rollback에서 resolved style/UI 상태 보존
- [ ] production Editor에서 approved variant만 노출/선택하는 최종 모드
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정 후 authenticated live QA

## 08. Approval Registry
- [x] browser/server Block type registry
- [x] browser/server variant registry
- [x] health/sync CI
- [x] publish gate를 `type + variant` approval semantics로 전환
- [x] `BLOCK_VARIANT_REVIEWS` 저장 판정을 publish gate에서 우선 사용
- [x] approved Style preset lifecycle
- [x] approved UI preset lifecycle
- [ ] user review 결과를 canonical approved variant 상태로 확정

현재 live Sheet 확인값:
- `BLOCK_VARIANT_REVIEWS`: 승인 행 0개
- photography Block Style preset 12개: 전부 draft
- UI preset 8개: 전부 draft

## 09. First non-photo QA — video editor
- [x] `page_video_editor_qa_v1`
- [x] 13 Sheet blocks / draft / noindex / needs_review
- [x] `/qa/video-editor/`
- [x] `/staging/public-renderer/`
- [x] Snapshot V2 candidate staging `/staging/snapshot-v2.html`
- [x] Adobe/Blackmagic/고용24 evidence
- [x] 크몽 개별 공개 판매가 예시 evidence
- [x] KOCCA 표준계약서 evidence
- [x] 국세청 인적용역/종합소득세 evidence
- [x] 한국저작권위원회 음원·폰트 이용허락 evidence
- [x] 크몽 판매 이용약관 evidence
- [x] `verified` block evidence overlay CI 검증
- [x] product-tool mobile narrow-column regression fix
- [x] QA wrapper internal line token fix
- [x] 시장 수요 규모는 근거 없이 수치화하지 않도록 명시적으로 제외
- [-] 사용자 내용/디자인 최종 review
- [!] authenticated Editor→AI→server round-trip live QA는 ADMIN token 필요

가격 evidence는 평균 단가/실거래가가 아니라 확인일 기준 개별 공개 등록가 예시다.

## 10. Publish / Public Runtime
- [x] draft/published snapshot tables
- [x] exact publish-check/publish 기본 흐름
- [x] immutable `PUBLISHED_BLOCK_STYLES`
- [x] immutable `PUBLISHED_UI_CONFIG`
- [x] active Snapshot V2 read-only API
- [x] public Snapshot V2 renderer
- [x] resolved Block style 적용
- [-] resolved Page UI capability 적용 확대
- [x] type + variant + approved style/UI preset publish gate
- [x] active API snapshot은 publish gate를 이미 통과한 결과로 runtime에서 신뢰
- [x] title/description/robots/OG/Twitter + Article/WebPage JSON-LD
- [x] canonical `/:slug/` active-snapshot route
- [x] legacy `/`와 `/photography/`는 기존 photography renderer 유지
- [x] active + indexable snapshot 기반 dynamic sitemap
- [x] real 404 / wildcard SPA fallback 제거
- [x] canonical HTML에 server-rendered semantic text fallback
- [x] public 전용 calculator/copy interaction bundle
- [x] internal lab/QA/staging noindex/no-store header 강화
- [x] rollback draft
- [ ] 실제 Cloudflare 배포 응답 canonical/404/sitemap smoke test
- [ ] PC/mobile/CWV QA
- [ ] PC 광고 side rail QA

## 11. CI / Safety
- [x] Block type sync
- [x] Block variant sync
- [x] UI Capability sync
- [x] video-editor canonical seed validator
- [x] video-editor effective evidence overlay validator
- [x] Block Lab/Editor/UI runtime/UI Dashboard/Public Snapshot/root Functions syntax 범위
- [x] canonical route/_routes/_redirects/404 변경 시 workflow trigger
- [x] UI Dashboard JS/CSS 경로는 workflow trigger/syntax 범위에 포함
- [!] 현재 실행 환경 DNS 문제로 local clone/Node 검증 실패
- [!] GitHub connector combined status에 workflow context가 노출되지 않아 최신 Actions 성공 여부 직접 확인 불가

Production invariants:
- photography production renderer를 candidate로 교체하지 않음
- photography parity baseline을 mockup으로 대체하지 않음
- Safari deferred sticky safety 유지
- mobile native horizontal scroll owner 유지
- candidate 자동 publish 금지
- labs/dashboard/qa/staging noindex
- editor API token 없으면 closed
- public snapshot API는 draft 반환 금지
- canonical dynamic route는 active snapshot만 반환
- active snapshot만 public runtime 신뢰 대상으로 취급
- `/video-editor/`는 현재 draft이므로 active snapshot이 생기기 전 공개되지 않아야 함
- UI Dashboard는 production UI를 직접 변경하지 않고 원본 비교 + preset 실험/저장만 수행

## Exact next action
1. [-] `/ui-dashboard/`의 `사진 페이지 원본` mode에서 7개 capability 실제 production parity 확인
2. [-] 같은 capability의 `범용 실험` mode에서 조절 가능한 설정 검토
3. [-] `/block-lab/` + `/qa/video-editor/` review 결과 수집
4. [ ] review 결과에 따라 variant/style/UI preset을 server `approved` 또는 redesign/deprecated로 저장
5. [ ] approved-only production Editor 최종 모드
6. [ ] `ADMIN_EDITOR_TOKEN` 설정 후 authenticated Editor→publish→canonical→rollback live QA
7. [ ] 실제 Cloudflare canonical/404/sitemap smoke test
8. [ ] 승인된 generic surface 기준 UI Capability public runtime 적용 확대
9. [ ] PC/mobile/CWV + 광고 side rail QA
10. [ ] workstream QA Drive archive

## V1 완료 목표
1. Block/variant/style preset 최종 승인
2. UI Capability/preset dashboard 실사용
3. Editor에서 Block + Page UI 구성/저장/복원
4. photography 고도화 UI를 공통 공식으로 안전하게 추출
5. 비사진 산업 1개 draft→AI→human review→publish→rollback 통과
6. public renderer + canonical route
7. SEO/GEO + sitemap + real 404
8. PC/mobile/CWV + 광고 side rail QA
9. workstream QA Drive archive

## Resume protocol
1. `AGENTS.md`
2. 이 `TASKS.md`
3. `HANDOFF.md`
4. `main` 최신 commit
5. `Exact next action`과 실제 repo 상태 비교

대화만 보고 진행 상태를 추정하지 않는다.
