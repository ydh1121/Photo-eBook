# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 현재 남은 작업의 canonical tracker다. 상세 구현 상태와 정확한 파일은 `HANDOFF.md`가 보완한다.

## 01. Reference / Editorial
- [x] 외부 GitHub/UI/한국어 reference library
- [x] 사용자 문체 규칙 + COPY_GUIDE 연결
- [x] Block별 editorial profile
- [x] AI 사실/수치/사용자 문장 보존 계약
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
- [x] server sync: type review + variant review + style preset
- [x] Light/Dark + Fit/390/768/1180
- [-] 사용자 실제 디자인 검토
- [ ] review 결과에 따른 2차 디자인 정제
- [ ] 최종 approved variant 확정

현재 모든 Block type은 server status `candidate`이며 자동 승인하지 않는다.

## 04. Photography Parity

### Page UI Capability 추출
- [x] top chapter navigation 실제 production 값 추출
- [x] horizontal card rail 실제 production 값 추출
- [x] collection bottom sheet / secondary filter 추출
- [x] device handoff accordion 추출
- [x] UI Dashboard photography preset 1차 보정
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

새 advanced candidate variants:
- [x] `hero / immersive-metrics`
- [x] `chapter-hero / image-overlay`
- [x] `comparison-cards / visual-metrics`
- [x] `roadmap / metric-cards`

- [-] photography에서 기존 variant용 built-in Style preset 추출
- [ ] base skill-card generic destination 결정
- [ ] numbered checklist mini-card vs unified surface 결정
- [ ] 사용자 parity review

Photography production renderer는 이 과정에서 변경하지 않는다.

## 05. UI Capability / Design Dashboard
- [x] UI Capability contract
- [x] 7 capability manifest
- [x] `/ui-dashboard/` noindex
- [x] live specimen + schema controls
- [x] custom preset save/load/export
- [x] `UI_PRESETS` server sync
- [x] `PAGE_UI_CONFIG` page assignment
- [x] Editor `페이지 UI` on/off + preset 선택 + server save/load
- [ ] capability approved/deprecated lifecycle UI
- [ ] shared primitive/token 관리 탭
- [ ] public snapshot에 resolved PAGE_UI_CONFIG 포함
- [ ] public runtime에 capability config 실제 적용

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
- [ ] built-in photography Style presets 추가
- [-] publish snapshot에 resolved Block style 저장
- [ ] public runtime에서 resolved style 적용
- [ ] publish gate에서 approved style preset 검사

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
- [!] Cloudflare `ADMIN_EDITOR_TOKEN` secret 설정 후 authenticated live QA

## 08. Approval Registry
- [x] browser/server Block type registry
- [x] browser/server variant registry
- [x] health/sync CI
- [-] type 단위 publish approval에서 `type + variant` approval로 전환 준비
- [ ] user review 결과를 canonical approved variant 상태로 반영
- [ ] production Editor는 approved variant만 선택 가능
- [ ] approved Style preset lifecycle
- [ ] approved UI Capability preset lifecycle

## 09. First non-photo QA — video editor
- [x] `page_video_editor_qa_v1`
- [x] 13 Sheet blocks / draft / noindex / needs_review
- [x] `/qa/video-editor/`
- [x] `/staging/public-renderer/`
- [x] Adobe/Blackmagic/고용24 1차 evidence
- [x] product-tool mobile narrow-column regression fix
- [x] QA wrapper internal line token fix
- [-] 시장수요/실제 단가 evidence
- [ ] 계약/세금/platform policy/license evidence
- [!] authenticated Editor→AI→server round-trip live QA는 ADMIN token 필요

## 10. Publish / Public Runtime
- [x] draft/published snapshot tables
- [x] publish-check/publish 기본 흐름
- [x] active snapshot read-only API
- [x] public staging renderer
- [x] title/description/robots/OG/Twitter + Article/WebPage JSON-LD
- [x] rollback draft
- [-] `PUBLISHED_BLOCKS`에 resolved Block style 포함
- [ ] `PUBLISH_SNAPSHOTS`에 resolved Page UI config 포함
- [ ] publish gate를 type + variant + approved style 기준으로 강화
- [ ] public renderer가 resolved style/UI config 사용
- [ ] canonical industry route
- [ ] sitemap
- [ ] real 404
- [ ] PC/mobile/CWV QA
- [ ] PC 광고 side rail QA

## 11. CI / Safety
- [x] Block type sync
- [x] Block variant sync
- [x] UI Capability sync
- [x] video-editor QA seed validator
- [x] Block Lab/Editor/UI Dashboard/Functions syntax 범위
- [!] 최신 workflow 성공 여부는 connector에서 아직 검증하지 못함

Production invariants:
- photography production renderer를 candidate로 교체하지 않음
- Safari deferred sticky safety 유지
- mobile native horizontal scroll owner 유지
- candidate 자동 publish 금지
- labs/dashboard/qa/staging noindex
- editor API token 없으면 closed
- public snapshot API는 draft 반환 금지

## Exact next action
1. [-] publish snapshot schema에 resolved Block style 저장
2. [ ] publish snapshot에 resolved Page UI config 저장
3. [ ] public runtime에서 Block style/UI config 적용
4. [ ] type+variant approval semantics로 publish gate 전환
5. [ ] photography built-in Style presets 추가
6. [ ] 사용자 Block Lab/UI Dashboard review 결과 반영
7. [ ] ADMIN_EDITOR_TOKEN live QA

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
