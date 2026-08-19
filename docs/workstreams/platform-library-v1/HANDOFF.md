# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 짧게 고정하는 handoff 문서다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

Phase 05/06 완료 수준의 candidate 구현 → Phase 07 전 실제 화면 검토 대기

완료된 단계:
- Phase 01 Reference Library
- Phase 02 Editorial Library
- Phase 03 UI Block Inventory + Block Contract
- Phase 04 Block Lab 기본 구현
- Phase 05 UI Refinement 코드 레벨 1차 정제
- Phase 06 신규 범용 Block candidate 확장

현재 checkpoint:
- `/block-lab/`에 총 27개 candidate block family가 있음.
- 사용자 실제 화면 검토 전에는 candidate를 production-approved로 자동 승격하지 않음.
- 다음 핵심 작업은 Block Lab 실화면 QA → block별 `approved / redesign / merge / deprecated` 결정임.

## Production safety

- photography production 페이지는 content-pack 분리 후 정상 동작한다고 사용자가 확인함.
- 기존 photography production renderer는 이번 Block Library 작업으로 교체하지 않았음.
- Block Lab CSS/renderer는 별도 경로로 격리됨.
- `/block-lab/`은 `noindex,nofollow,noarchive`.
- `/block-lab`과 `/block-lab/` exact 200 proxy가 기존 SPA wildcard보다 앞에 있음.
- 기존 Safari navigation/runtime 계약은 변경하지 않았음.

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

분류:
- `design-taste/`
- `component-system/`
- `interaction-motion/`
- `editorial-writing/`
- `discovery/`

중요 결정:
- 외부 repository는 원리/검토기준 reference이며 production dependency를 자동 추가하지 않음.
- reverse-engineered Apple/iOS DESIGN.md는 공식 Apple specification으로 취급하지 않음.
- KatFishNet은 한국어 LLM 문체 연구 evidence이며 detector 우회나 자동 판정 용도로 사용하지 않음.

## Project design taste

영구 기준:
- `docs/library/design-taste/PLATFORM-TASTES.md`

핵심:
- content보다 card/border/shadow/badge가 먼저 보이는 UI 거절
- typography/whitespace로 hierarchy를 먼저 만들기
- 읽는 UI는 정적으로, 직접 조작하는 UI만 움직이기
- mobile-first
- rail은 native horizontal overflow + 시작/끝/runway 명시
- 외부 Apple/taste reference의 style/value를 그대로 복제하지 않기

우선순위:
`사용자 현재 피드백 → PLATFORM-TASTES → 프로젝트 spec → Approved Registry → external reference`

## Editorial Library

- `docs/library/editorial/README.md`
- `01-voice-principles.md`
- `02-block-copy-profiles.md`
- `03-ai-writing-and-review.md`
- `04-before-after-examples.md`

결정:
- 사용자 확정 문장/전후 예시가 최우선 authority.
- AI 문체 수정은 사실·수치·고유명사와 user lock을 변경하지 않음.
- block마다 `editorialProfile` 사용.
- 운영 `COPY_GUIDE`에 회수된 사용자 규칙을 먼저 반영했고 photography copy spec과 연결함.

## Block Library

문서:
- `docs/library/blocks/README.md`
- `V1-INVENTORY.md`
- `V1-EXPANSION.md`
- `BLOCK-CONTRACT.md`

기존 photography 17개:
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

신규 10개:
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

별도 type을 만들지 않은 항목:
- KPI/stat → `metric-grid`로 통합
- service/business comparison → `service-list` + comparison 계열 조합

보류:
- location/map → provider/API/geocoding/privacy 계약 전까지 보류

## Block Lab runtime

Route:
- `/block-lab/`

Core:
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/blocks/block-renderers-extended.js`

Lab:
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-data-extended.js`
- `public/assets/js/block-lab/lab-interactions-extended.js`
- `public/assets/js/block-lab/lab-app.js`

Styles:
- `public/assets/styles/block-lab/lab.css`
- `a11y.css`
- `refinement-v2.css`
- `new-blocks-v2.css`

Features:
- category filter
- Light/Dark
- Fit / 390 / 768 / 1180 preview
- block variant selector
- type/category/status/editorial profile metadata
- script copy sample
- calculator multiply/sum sample

## Phase 05 first-pass refinement

Block-Lab-only refinement:
- Korean keep-all + heading balance/readability
- typography hierarchy and line height
- fewer nested mini-cards/surfaces
- process → separated sequence rows
- metric → coherent data grid
- checklist → unified checklist surface
- roadmap → connected progression; mobile vertical timeline-like progression
- script/source → flat rows before card decoration
- media/case/product metadata subdued
- horizontal rail start/end/shadow runway improved
- mobile/desktop spacing first pass

Production photography CSS is not using this candidate refinement layer.

## Next action

1. 배포된 `/block-lab/` 접근 및 script/CSS 로드 확인
2. PC와 모바일에서 27개 block visual QA
3. 사용자 피드백을 block별로 기록
4. 각 block을 `approved / redesign / merge / deprecated`로 판정
5. Phase 07 Approved Block Registry 계약 확정
6. 승인된 renderer만 production/admin preview canonical renderer로 승격
7. 그 다음 Phase 08 관리자 Block Editor 구현

중요:
- 사용자 시각 검토 전에 Phase 07 자동 승인 금지.
- candidate renderer를 photography production에 바로 적용하지 않음.
- 실제 라이브 접근/렌더 검증이 안 된 경우 성공했다고 추정하지 않음.

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
