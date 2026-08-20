# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Current implementation branch: `feat/admin-ux-shell-v1`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Architecture

[x] Content Block / variant / style preset 분리
[x] UI Capability / preset 분리
[x] photography production은 parity reference로 유지
[x] Visual Builder는 `/ui-dashboard/sandbox/` 더미 캔버스만 사용
[x] sandbox는 production API / Google Sheet 사용자 데이터와 분리
[x] 관리 화면 공통 UX 계약: `docs/library/admin-ui/ADMIN-SHELL.md`

## Management UX consolidation

대상:
- `/ui-dashboard/` 화면 구성
- `/ui-dashboard/?view=library` UI 라이브러리
- `/block-lab/` 블록 관리
- `/editor-lab/` 페이지 에디터
- `/qa/video-editor/` QA

[x] 공통 관리자 셸 추가
[x] 데스크톱 전역 이동을 고정 좌측 사이드바로 통합
[x] 태블릿에서는 compact icon rail, 모바일에서는 상단 horizontal nav로 전환
[x] 모든 주요 관리 화면에서 브라우저 뒤로가기 없이 상호 이동
[x] 현재 화면 active state 표시
[x] 관리 메뉴 용어를 `화면 구성 / UI 라이브러리 / 블록 관리 / 페이지 에디터 / QA`로 정리
[x] 전역 이동과 로컬 작업 도구 분리
[x] Block Lab 소개형 hero 제거, 목록 + 검토 대상 중심으로 재구성
[x] Block Lab 미리보기를 설정 패널보다 먼저 읽히도록 순서 변경
[x] Block Lab 서버 기능은 `동기화`, 테마/화면폭은 `보기`로 그룹화
[x] Page Editor undo/redo/export/import를 `더보기`로 그룹화
[x] Page Editor 서버 초안 기능을 `초안` 메뉴로 그룹화
[x] Page Editor `페이지 설정`을 접힌 고급 설정으로 통합
[x] Page Editor block 검색/목록을 기본 작업 흐름 앞으로 이동
[x] QA 관리 chrome은 항상 중립 테마 유지
[x] QA dark/light는 preview canvas에만 적용
[x] Block Lab/Page Editor dark/light도 관리 chrome이 아니라 preview canvas에만 적용
[x] management assets no-store 처리
[-] 실제 브라우저에서 desktop/tablet/mobile responsive QA

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
[x] 공통 관리자 셸 + 로컬 toolbar 한 줄 구조로 단순화
[x] toolbar를 `편집 / 블록 추가 / 광고 / 초안 저장 / 더보기` 중심으로 축소
[x] UI library에서는 page editing toolbar 숨김
[x] builder stage가 viewport를 소유하고 iframe 내부만 스크롤하도록 중첩 스크롤 축소
[x] UI library bare-floor 간격/폭 보정

## Production UI parity in editor

원칙: 편집 기능 때문에 production UI의 geometry나 paint가 달라지면 안 된다.

[x] 실제 production nav DOM 구조를 유지
[x] sandbox nav에 production 최종 `desktop/nav-corrections.css`를 그대로 재적용
[x] builder의 generic `position:relative!important`가 sticky/fixed UI를 덮어쓰는 문제 보정
[x] 원래 `position:static`인 요소에만 builder anchor를 부여
[x] `.nav-shell` sticky, `.collection-fab` fixed, sheet/overlay 고유 positioning을 보존
[x] 편집 outline/gear는 실제 UI geometry를 변경하지 않는 보조 chrome으로 제한
[-] actual production `/photography/`와 sandbox nav 픽셀 비교 QA
[-] production CSS 변경 시 sandbox parity drift 점검 자동화 검토

## Side advertisement placement

[x] 고정 `50% + 590px` 위치 가정 제거
[x] 현재 보이는 `.chapter .section .content` 실제 rect 기준 좌우 위치 계산
[x] hero / chapter hero 구간에서는 광고 숨김
[x] 본문 구간에 최소 표시 높이가 없으면 광고 숨김
[x] 좌/우 여백이 광고 폭 + gap보다 작으면 해당 광고 숨김
[x] 1360px 미만에서는 side ad 숨김
[x] scroll-follow on/off 유지
[x] `설정 열기`와 `광고 활성화` 분리
[x] 꺼진 side ad 슬롯은 캔버스에서 완전히 숨김
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
[x] 기능 삭제 없이 작업 빈도에 따라 chrome 재배치
[ ] `ADMIN_EDITOR_TOKEN` production secret 설정
[ ] authenticated publish / rollback live QA

## Safety

- Visual Builder에서 production `/photography/` 로드 금지
- sandbox에서 production user data 읽기 금지
- photography renderer 자동 교체 금지
- 편집 chrome이 production UI의 position/size/flow를 변경하지 않음
- mobile native horizontal scroll owner 유지
- Safari deferred sticky safety 유지
- 사용자 승인 전 preset/block 자동 승인 금지
- management / QA / staging noindex 유지

## Exact next action

1. `feat/admin-ux-shell-v1`을 실제 브라우저에서 확인한다.
2. 좌측 공통 메뉴에서 화면 구성 → UI 라이브러리 → 블록 관리 → 페이지 에디터 → QA를 왕복한다.
3. 화면 구성에서 더미 nav가 실제 production nav와 동일한 geometry/paint/sticky 동작인지 비교한다.
4. 편집 모드 ON/OFF 전환으로 nav/FAB/sheet 위치가 변하지 않는지 확인한다.
5. Block Lab에서 미리보기 → 판정 → variant → style 순서가 자연스러운지 확인한다.
6. Page Editor에서 블록 추가가 첫 작업으로 읽히고 secondary actions가 메뉴 안에 있는지 확인한다.
7. QA와 Block Lab/Page Editor에서 dark mode가 preview에만 적용되는지 확인한다.
8. 1440 / 1536 / 1920 PC, 900px 전후, 모바일에서 검수한다.
