# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Current implementation branch: `fix/ui-dashboard-system-audit`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Architecture

[x] Content Block / variant / style preset 분리
[x] UI Capability / preset 분리
[x] photography production은 parity reference로 유지
[x] `/ui-dashboard/`는 `/ui-dashboard/sandbox/` 더미 캔버스만 사용
[x] sandbox user/storage 데이터를 production과 격리
[x] 관리 화면 공통 셸: `화면 구성 / UI 라이브러리 / 블록 관리 / 페이지 에디터 / QA`
[x] UI Dashboard page mode와 library mode의 JS owner 분리

## UI Dashboard system audit

### 화면 구성

[x] 상단 메뉴가 editor iframe에서 스크롤을 따라오도록 fixed-pin fallback 추가
[x] Safari는 기존 deferred-sticky owner 유지
[x] 편집 chrome이 nav / sheet / FAB의 fixed/sticky geometry를 덮어쓰지 않도록 보정
[x] `화이트 / 다크 / 시스템` preview theme 전환 제공
[x] 구형 V1 설정값을 page boot 시 V2 explicit override로 정규화
[x] 실제 디자인 반영 owner를 sandbox `capability-runtime-v3`로 통일
[x] 설정 패널 input/change를 전역 live bridge로 연결
[x] builder-v1 late reapply 뒤 canonical runtime 재적용
[x] `초기값` 동작은 production 원본 reset으로 연결
[-] 모든 capability control을 실제 브라우저에서 live 변경 검증
[-] block add/reorder/save/reset 동작 회귀 QA
[-] 광고 좌/우/본문 동작 회귀 QA

### UI 라이브러리 = Live UI Kit

원칙: 카탈로그/쇼케이스가 아니라 실제 reusable UI를 하나씩 독립적으로 조작하는 live UI kit.

[x] 한 화면에 UI 하나만 표시
[x] page builder runtime과 library runtime 완전 분리
[x] component selector: 상단 메뉴 / 가로 카드 / 범용 필터칩 / 하단 팝업 / 다른 기기 / 플로팅 버튼
[x] `화이트 / 다크 / 시스템` 전역 색상 모드
[x] PC / 모바일 preview 전환
[x] 해당 UI가 지원하는 경우 표현 모드 quick switch
[x] 상단 메뉴: 원본 / Material / iOS 플랫 / iOS 리퀴드
[x] 범용 필터칩: 원본 / Material / iOS 플랫 / iOS 리퀴드
[x] 플로팅 버튼: 원본 / 플랫 / 글래스 / 리퀴드
[x] 하단 팝업: 전체 / 영상 / 읽을거리 / 질문 / 설정 상태 전환
[x] 다른 기기: 접힘 / 펼침 상태 전환
[x] 범용 필터칩은 하단 팝업의 실제 `#collectionFilters > .collection-filter` DOM 사용
[x] 더미 저장 영상 카테고리 3종으로 `전체 + 제품 + 인물 + 음식` 실제 필터 생성
[x] 다른 기기는 실제 `.collection-device-accordion`만 분리 표시
[x] 하단 팝업을 닫거나 아래로 내렸을 때 dummy page/FAB가 노출되지 않는 중립 floor 사용
[x] component interaction 유지: nav click / rail drag / filter click / sheet tab·drag / device accordion
[x] 초기 상태는 production CSS 원본, 사용자가 바꾼 속성만 V2 override
[x] 구형 library controller / sandbox preview controller 제거
[-] 6개 UI × 3 theme × PC/mobile 실제 브라우저 QA
[-] UI별 quick mode 실제 paint 전환 검증
[-] 세부 설정의 모든 control live 반영 검증

## Production UI parity

[x] production CSS stack을 sandbox에 동일 순서로 로드
[x] production `liquid-controller`, `collection-hub`, `device-handoff`, rail runtime 재사용
[x] 읽기 진행은 상단 메뉴 component에 포함
[x] legacy full-width `.read-progress`는 editor/library parity 대상으로 사용하지 않음
[-] `/photography/` 공개 화면과 sandbox의 nav/filter/sheet/FAB 시각 비교

## Side advertisement placement

[x] 좌/우 광고 설정과 활성화를 분리
[x] 1360px 미만 side ad 숨김
[x] content 외곽 여백 기준 배치
[x] follow on/off 유지
[-] 1440 / 1536 / 1600 / 1920 실제 브라우저 QA

## Other management tools

[x] Block Lab / Page Editor / QA 공통 관리자 셸 적용
[x] Page Editor secondary actions 그룹화
[x] Block Lab 검토 중심 레이아웃
[x] QA/theme는 management chrome이 아니라 preview canvas에 적용
[-] 관리 페이지 간 직접 이동 및 responsive QA

## Safety

- production `/photography/`를 builder canvas로 로드하지 않는다.
- sandbox에서 production user data를 읽거나 쓰지 않는다.
- photography renderer를 candidate/mock으로 교체하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- Safari deferred sticky safety를 유지한다.
- 사용자 승인 전 preset/block을 자동 승인하지 않는다.
- management / QA / staging은 noindex를 유지한다.

## Exact next action

1. `fix/ui-dashboard-system-audit`의 UI Kit를 실제 브라우저에서 검증한다.
2. Library: 6개 UI를 각각 White / Dark / System, PC / Mobile로 확인한다.
3. `범용 필터칩`이 실제 bottom-sheet chip 디자인과 동일한지 확인한다.
4. `다른 기기`에서 accordion 이외의 settings/sheet UI가 보이지 않는지 확인한다.
5. Bottom Sheet를 drag-close 했을 때 중립 floor 외에는 아무것도 보이지 않는지 확인한다.
6. Page mode에서 각 inspector control을 한 번씩 변경해 즉시 반영되는지 확인한다.
7. block / ad / draft save / reset 회귀 테스트를 수행한다.
8. 발견된 회귀만 같은 branch에서 수정한 뒤 `main`과 reconcile하고 사용자 승인 후 병합한다.
