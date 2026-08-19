# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 짧게 고정하는 handoff 문서다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

Phase 07 사용자 Block review 수집 + Phase 08 Editor Lab prototype 구현 완료 수준

완료된 단계:
- Phase 01 Reference Library
- Phase 02 Editorial Library
- Phase 03 UI Block Inventory + Block Contract
- Phase 04 Block Lab 기본 구현
- Phase 05 UI Refinement 코드 레벨 1차 정제
- Phase 06 신규 범용 Block candidate 확장
- Phase 07 registry/review infrastructure
- Phase 08 local-only Editor Lab prototype

현재 checkpoint:
- `/block-lab/`에 총 27개 candidate block family가 있음.
- 각 block에 `미결정 / 승인 / 재설계 / 통합 / 폐기` 검토 선택과 메모 UI가 있음.
- 검토는 localStorage에 저장되고 JSON으로 export 가능.
- runtime manifest와 renderer health check가 있음.
- production validation은 manifest status가 `approved`인 type만 통과하도록 구현했으나 현재 27개는 모두 candidate.
- `/editor-lab/`에서 candidate block을 실제로 배치·편집할 수 있음.
- Editor Lab은 localStorage draft만 사용하며 서버/Google Sheet write와 아직 연결하지 않음.

## Production safety

- photography production 페이지는 content-pack 분리 후 정상 동작한다고 사용자가 확인함.
- 기존 photography production renderer는 Block Library/Editor Lab으로 교체하지 않았음.
- Block Lab/Editor Lab CSS와 runtime은 별도 route로 격리됨.
- `/block-lab/`, `/editor-lab/` 모두 `noindex,nofollow,noarchive`.
- exact 200 proxy가 기존 SPA wildcard보다 앞에 있음.
- 기존 Safari navigation/runtime 계약은 변경하지 않았음.
- 관리자 인증이 없으므로 서버 write API는 추가하지 않았음.

## Permanent Reference Library

Index:
- `docs/library/references/README.md`

사용자가 2026-08-19에 제공한 외부 GitHub 링크 9개는 모두 정식 entry 또는 기존 entry로 반영됨:
- `emilkowalski/skills`
- `Meliwat/awesome-ios-design-md`
- `VoltAgent/awesome-design-md` Apple `DESIGN.md`
- `Leonxlnx/taste-skill`
- `tastesmd/TASTES.md`
- GitHub `topics/ai-design` discovery source
- `Shinwoo-Park/katfishnet`
- `DaleSeo/korean-skills`
- `dotoricode/korean-humanizer`

기존 추가 reference:
- `NomaDamas/k-skill` korean-humanizer
- `arknow91/liquid-taffy`

## Project design taste

영구 기준:
- `docs/library/design-taste/PLATFORM-TASTES.md`

우선순위:
`사용자 현재 피드백 → PLATFORM-TASTES → 프로젝트 spec → Approved Registry → external reference`

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

27개 candidate:
1. hero
2. chapter-hero
3. section-heading
4. rich-text
5. process/ranking
6. metric-grid
7. offer-rail
8. notice
9. comparison-cards
10. checklist
11. media-rail
12. case-study-rail
13. product-tool
14. roadmap
15. script-copy
16. tutorial
17. resources
18. faq
19. pros-cons
20. comparison-table
21. timeline
22. image-copy-split
23. gallery
24. quote-expert
25. calculator
26. cta
27. service-list

보류:
- location/map → provider/API/geocoding/privacy 계약 전까지 보류

## Block Lab runtime

Route:
- `/block-lab/`

Core:
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/blocks/block-renderers-extended.js`
- `public/assets/js/blocks/block-registry-health.js`
- `public/data/block-registry/v1/manifest.js`

Lab:
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-data-extended.js`
- `public/assets/js/block-lab/lab-interactions-extended.js`
- `public/assets/js/block-lab/lab-app.js`
- `public/assets/js/block-lab/lab-review.js`

Styles:
- `public/assets/styles/block-lab/lab.css`
- `a11y.css`
- `refinement-v2.css`
- `new-blocks-v2.css`
- `review-v1.css`

Review features:
- category filter
- review-decision filter
- Light/Dark
- Fit / 390 / 768 / 1180 preview
- block variant selector
- review decision + memo
- localStorage persistence
- review JSON export
- registry health count

## Editor Lab

Route:
- `/editor-lab/`

Code:
- `public/editor-lab/index.html`
- `public/assets/js/editor-lab/editor-app.js`
- `public/assets/styles/editor-lab/editor.css`

Features:
- 27개 block library
- search
- block add
- drag-and-drop reorder
- up/down reorder fallback
- duplicate/delete
- variant edit
- recursive content inspector for strings/numbers/arrays/objects
- Light/Dark
- 390/768/1180
- edit/preview
- undo/redo
- localStorage draft
- JSON import/export
- canonical Block Registry renderer 재사용

중요:
- Editor Lab은 production 관리자 페이지가 아님.
- 인증/서버 저장 전까지 local-only prototype.
- candidate도 실험용으로 추가 가능하지만 production publish validation은 candidate를 거부함.

## Storage decision

문서:
- `docs/library/admin-editor/EDITOR-AND-STORAGE-V1.md`

V1 방향:
- 구조화 페이지/블록 데이터 → Google Sheets
- 이미지/파일/workstream archive → Google Drive
- renderer/schema/permanent rules → Git
- localStorage → Editor Lab 검증용 draft만

권장 future sheets:
- `PLATFORM_PAGES`
- `PAGE_BLOCKS`
- `BLOCK_REVISIONS`
- `BLOCK_REVIEWS`
- `MEDIA_ASSETS`

광고 기반 초기 운영/소수 관리자 조건에서는 별도 Supabase/D1을 먼저 추가하지 않음. 여러 관리자 동시 편집, 복잡한 권한/검색/대규모 revision이 필요해지면 migration 검토.

## Current unresolved checks

- 이 도구 세션의 container에서 `photo-ebook.pages.dev` DNS 조회가 실패해서 실제 live `/block-lab/`/`/editor-lab/` 브라우저 렌더 검증은 하지 못함.
- 따라서 live success를 추정해 완료 처리하지 않음.
- 사용자 실제 PC/모바일 검토가 필요함.

## Next action

1. 배포된 `/block-lab/`에서 27개 block 검토 UI 확인
2. 사용자가 주요 block을 `승인 / 재설계 / 통합 / 폐기`로 판정하고 필요 시 메모
3. review JSON 또는 사용자 피드백을 Git canonical manifest에 반영
4. approved lifecycle 확정 및 publish validation 연결
5. `/editor-lab/` 실화면 QA
6. block-specific inspector를 사용자 편집 관점에서 정제
7. 관리자 인증 방식을 확정한 뒤 Google Sheets draft save/load API 연결
8. draft/published + revision + publish 흐름 구현

중요:
- 사용자 시각 검토 전에 block 자동 승인 금지.
- candidate renderer를 photography production에 바로 적용하지 않음.
- 인증 전에는 공개 admin write endpoint를 만들지 않음.

## Resume protocol

새 채팅방에서는 사용자가 이전 대화를 다시 설명할 필요가 없어야 한다.

재개 시 에이전트는:
1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. 이 `HANDOFF.md`
4. `main` 최신 commit
을 먼저 확인한다.

작업 시작 전 `Next action`이 실제 repository 상태와 일치하는지 확인한다.

작업을 한 단위 완료할 때마다:
- `TASKS.md` 상태 갱신
- 이 파일의 `Current phase`, `Next action`, 중요 결정사항 갱신
- 최종 규칙은 영구 `docs/library/` 또는 `docs/spec-v1/`에 반영

세션이 끝날 때 작업이 완결되지 않았더라도 중간 상태를 Git에 기록해 다음 세션이 추측 없이 이어갈 수 있게 한다.
