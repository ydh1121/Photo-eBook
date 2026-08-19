# Platform Library V1 Handoff

이 파일은 채팅방 길이 제한, 세션 종료, 다른 작업자/에이전트로의 전환이 발생해도 작업이 끊기지 않도록 현재 작업 상태를 짧게 고정하는 handoff 문서다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

## Current phase

Phase 01 — Reference Library

현재까지 확인한 사항:
- 공통 플랫폼과 photography content pack 분리는 완료되어 production에서 정상 동작하는 것을 사용자가 확인함.
- 현재 photography 페이지의 UI를 향후 여러 산업에 재사용할 Block System으로 정제하려고 함.
- UI Block Lab → Approved Block Registry → 관리자 Block Editor → AI 콘텐츠 작성/검수 순으로 진행하기로 함.
- 최종 목표는 관리자가 산업 주제와 기본 블록 배치/방향만 정하고 AI가 세부 콘텐츠를 작성·검수하는 운영 구조임.
- 진행 중 자료는 Git workstream에 저장하고, 실사용 완료 시 workstream 폴더를 Google Drive로 아카이브하기로 함.
- 채팅방 길이 제한에 대비한 restart-safe workstream protocol을 루트 `AGENTS.md`에 추가함.
- `TASKS.md`와 이 `HANDOFF.md`를 새 채팅방 재개의 canonical source로 고정함.

## Reference currently approved for library intake

`arknow91/liquid-taffy`

분류:
- Interaction / Motion / Liquid Surface

확인한 특성:
- anchored dropdown
- morphing dropdown
- speed dial
- shared press/drag/stretch/snap-back gesture engine
- spring choreography
- visual goo layer와 실제 DOM hit target 분리
- reduced-motion/accessibility 고려
- MIT license
- React 19 + GSAP + Vite reference implementation

적용 방향:
- 외부 구현 전체를 production dependency로 들여오지 않음
- 동작 원리와 motion language를 참고해 현재 플랫폼 runtime에 맞게 필요한 부분만 재구현
- 후보: block add FAB, 관리자 floating toolbar, quick action menu, context action
- 긴 본문 카드/표/정적 콘텐츠에는 과도한 liquid motion을 사용하지 않음

## Existing editorial baseline

`docs/spec-v1/20-korean-copywriting-skill.md`

추후 Editorial Library로 확장해야 함.
사용자가 이전 프로젝트 대화에서 기획자로서 직접 설명한 문장 작성 규칙과 실제 before/after 수정 사례를 회수해 산업 독립 규칙으로 정리할 예정.

## Next action

1. `docs/library/references/` 구조와 index 생성
2. `arknow91/liquid-taffy` 정식 reference entry 생성
3. 프로젝트의 다른 채팅/기존 문서에서 과거 외부 UI/GitHub reference를 회수해 같은 형식으로 등록
4. Reference Library 완료 후 Editorial Library 단계로 이동

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
- 관련 최종 규칙은 workstream 폴더가 아닌 영구 `docs/library/` 또는 `docs/spec-v1/`에 반영

세션이 끝날 때 작업이 완결되지 않았더라도 중간 상태를 Git에 기록해 다음 세션이 추측 없이 이어갈 수 있게 한다.
