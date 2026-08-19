# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 짧게 고정하는 handoff 문서다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

Phase 04 — Block Lab / 실제 화면 QA 대기

완료된 단계:
- Phase 01 Reference Library
- Phase 02 Editorial Library
- Phase 03 UI Block Inventory + Block Contract

현재 상태:
- photography production 페이지는 content pack 분리 후 정상 동작한다고 사용자가 확인함.
- production photography renderer는 이번 workstream에서 아직 교체하지 않았음.
- `/block-lab/`에 17개 candidate block family를 한 페이지로 구현함.
- Block Lab은 검색 노출 제외 상태임.
- Light/Dark와 Fit/390/768/1180 preview, category filter, block별 variant selector가 있음.
- candidate registry와 renderer는 `public/assets/js/blocks/`에 분리함.
- `/block-lab`과 `/block-lab/` exact 200 proxy를 SPA wildcard보다 앞에 두었음.

## Permanent libraries created

Reference:
- `docs/library/references/README.md`
- `interaction-motion/arknow91-liquid-taffy.md`
- `editorial-writing/daleseo-korean-skills.md`
- `editorial-writing/nomadamas-k-skill-korean-humanizer.md`

Editorial:
- `docs/library/editorial/README.md`
- `01-voice-principles.md`
- `02-block-copy-profiles.md`
- `03-ai-writing-and-review.md`
- `04-before-after-examples.md`

Blocks:
- `docs/library/blocks/README.md`
- `V1-INVENTORY.md`
- `BLOCK-CONTRACT.md`

## Block Lab code

- `public/block-lab/index.html`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-app.js`
- `public/assets/styles/block-lab/lab.css`
- `public/assets/styles/block-lab/a11y.css`

현재 17개 family:
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

## Editorial decisions

- 사용자 확정 문장/전후 예시가 최우선 authority.
- 운영 `COPY_GUIDE`에 회수된 사용자 문장 규칙을 먼저 반영했고 Git Editorial Library와 연결함.
- AI 문체 수정은 사실·수치·고유명사와 사용자 lock을 변경하지 않음.
- block마다 `editorialProfile`을 사용함.

## Reference decisions

`arknow91/liquid-taffy`:
- Interaction/Motion reference로 승인.
- React/GSAP dependency를 그대로 production에 추가하지 않음.
- 관리자 add-block FAB, quick action, floating toolbar 같은 작은 직접 조작 surface의 후보.
- 긴 정보 카드나 표에 liquid motion을 남발하지 않음.

## Next action

1. Cloudflare 배포 후 `/block-lab/` 실제 접근 확인
2. 사용자가 Block Lab을 PC/모바일에서 보고 가독성·구조·디자인을 검토
3. 피드백을 block family별로 기록
4. Phase 05 UI Refinement 진행
5. 이후 부족한 범용 block을 Phase 06에서 추가

중요:
- 현재 candidate renderer를 photography production에 바로 적용하지 않는다.
- user-approved block부터 정제/승격한다.
- 라이브 UI를 이 세션에서 독립적으로 브라우저 검증하지 못했으므로 성공 여부를 추정해 완료 처리하지 않는다.

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
