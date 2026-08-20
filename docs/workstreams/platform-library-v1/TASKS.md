# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Current implementation branch: `feat/admin-ux-shell-v1`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Architecture

[x] Content Block / variant / style preset 분리
[x] UI Capability / preset 분리
[x] photography production은 parity reference로만 유지
[x] Visual Builder는 `/ui-dashboard/sandbox/` 더미 캔버스만 사용
[x] sandbox는 production API / Google Sheet 사용자 데이터와 분리
[x] 관리 화면 공통 UX 계약 추가: `docs/library/admin-ui/ADMIN-SHELL.md`

## Management UX consolidation

대상:
- `/ui-dashboard/` 페이지 구성
- `/ui-dashboard/?view=library` UI 라이브러리
- `/block-lab/` 블록 관리
- `/editor-lab/` 페이지 에디터
- `/qa/video-editor/` QA

[x] 공통 관리자 셸 추가
[x] 모든 주요 관리 화면에서 직접 상호 이동 가능한 전역 메뉴 추가
[x] 현재 화면 active state 표시
[x] 전역 이동과 로컬 작업 도구 분리
[x] Block Lab의 별도 `플랫폼 빌더` 복귀 링크 제거 방향 적용
[x] Block Lab 상단/intro/sidebar 밀도 축소
[x] Page Editor undo/redo/export/import를 `더보기`로 묶음
[x] Page Editor `페이지·발행 설정`을 접힌 고급 설정으로 통합
[x] Page Editor block 검색/목록을 기본 작업 흐름 앞으로 이동
[x] Page Editor 상단바/좌우 패널/캔버스 chrome 밀도 축소
[x] QA 상단 chrome 통일
[x] management shell bootstrap asset stale-cache 방지 header 추가
[-] 실제 branch preview에서 각 화면 navigation / sticky offset QA
[-] 900px 이하 responsive 관리 셸 QA

## Visual Builder / UI Dashboard

Route: `/ui-dashboard/`
Dummy canvas: `/ui-dashboard/sandbox/`
Status: noindex / production state non-mutating

[x] production `/photography/` iframe 제거
[x] static dummy page 사용
[x] 7 UI capability 탐지 및 inspector 유지
[x] PC 다중 inspector / mobile bottom dock 유지
[x] block drag/drop + local layout draft 유지
[x] inline advertisement candidate 유지
[x] 기존 builder 자체 global nav 제거
[x] 공통 관리자 셸 + 로컬 toolbar 1줄 구조로 단순화
[x] toolbar를 `편집 / 블록 추가 / 광고 / 저장 / 더보기` 중심으로 축소
[x] 본문/좌/우 광고를 `광고` 메뉴로 통합
[x] 초기화 + 서버 연결/설정 동기화를 `더보기`로 이동
[x] 페이지 편집과 UI 라이브러리 동시 chrome 노출 방지
[x] UI library `[hidden]` 강제 처리
[x] 더미 chapter navigation outer `nav-glass` visual 중첩 제거
[-] 실제 preview에서 더미 nav single-surface QA

## Side advertisement placement

[x] 고정 `50% + 590px` 위치 가정 제거
[x] 현재 보이는 `.chapter .section .content` 실제 rect 기준 좌우 위치 계산
[x] hero / chapter hero 구간에서는 광고 숨김
[x] 본문 구간에 최소 표시 높이가 없으면 광고 숨김
[x] 좌/우 여백이 광고 폭 + gap보다 작으면 해당 광고 숨김
[x] 1360px 미만에서는 side ad 숨김
[x] scroll-follow on/off 유지
[-] 1440 / 1536 / 1600 / 1920 데스크톱 QA
[-] chapter 경계에서 광고가 이미지 영역에 겹치지 않는지 QA

## Block Registry / Block Lab

[x] 28 block family 유지 (advertisement 포함)
[x] advertisement variants 유지
[-] 사용자 실제 디자인 검토
[ ] advertisement 4 variant 최종 디자인 검토
[ ] 사용자 결정만 approved/redesign/deprecated 저장
[ ] approved block/primitive production 승격

## Page Editor / publish

[x] 기존 block add/reorder/drag 유지
[x] SEO / AI / media / revisions / snapshot 기반 기능 유지
[x] UX consolidation에서 기능 삭제 없이 고급 설정을 접어 기본 작업을 단순화
[ ] `ADMIN_EDITOR_TOKEN` production secret 설정
[ ] authenticated publish / rollback live QA

## Safety

- Visual Builder에서 production `/photography/` 로드 금지
- sandbox에서 production user data 읽기 금지
- photography renderer 자동 교체 금지
- mobile native horizontal scroll owner 유지
- Safari deferred sticky safety 유지
- 사용자 승인 전 preset/block 자동 승인 금지
- management / QA / staging noindex 유지

## Exact next action

1. `feat/admin-ux-shell-v1` Cloudflare preview를 확인한다.
2. 페이지 구성 → UI 라이브러리 → 블록 관리 → 페이지 에디터 → QA를 순서대로 이동하고 브라우저 뒤로가기 없이 모두 왕복되는지 확인한다.
3. 페이지 구성에서 공통 메뉴 + 로컬 toolbar 1줄만 보이는지 확인한다.
4. 페이지 에디터에서 블록 목록이 바로 보이고 페이지·발행 설정은 접혀 있는지 확인한다.
5. 더미 nav의 이중 캡슐이 제거됐는지 확인한다.
6. hero / chapter hero 구간에서 좌우 광고가 숨고 본문 구간에서만 나타나는지 확인한다.
7. 1440 / 1536 / 1920 PC 폭과 900px 이하에서 관리 셸과 툴바를 검수한다.
8. 발견되는 visual regression만 수정하고 production renderer에는 손대지 않는다.
