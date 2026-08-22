# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / user review ready`
Production branch: `main`
Current implementation branch: `fix/ui-dashboard-system-audit`
Draft PR: `#3`
Latest verified HEAD: `7151adf41635d16a15b2f3f09eba588569dcd04c`

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

[x] 상단 메뉴 editor fixed-pin fallback + Safari deferred-sticky owner 유지
[x] 편집 chrome이 nav / sheet / FAB fixed/sticky geometry를 덮어쓰지 않도록 보정
[x] 구형 V1 설정값을 V2 explicit override 기준으로 정규화
[x] canonical design owner를 sandbox `capability-runtime-v3`로 통일
[x] 동적 bottom sheet / filter / device DOM 재동기화
[x] production owner가 없는 죽은 조절기 숨김 + stale override 제거
[x] legacy full-width `.read-progress` 제거, 진행 표시는 상단 메뉴가 단독 소유
[x] 이미 iframe load가 끝난 뒤 builder script가 붙는 경우 late bootstrap 추가
[x] `더미 초기화` 후 빈 V1 config key가 다시 생성되지 않도록 수정
[x] Chrome에서 fixed nav + integrated progress ownership 검증
[x] Chrome에서 inline 광고 추가 → layout draft 저장 검증
[x] Chrome에서 더미 reset 후 layout/UI/ad draft 완전 삭제 검증
[x] Chrome 모바일에서 tap → 하단 inspector + dock 검증
[x] 실제 block drag/drop 재정렬 이벤트와 저장 순서 검증

### UI 라이브러리 = Live UI Kit

원칙: 카탈로그/쇼케이스가 아니라 실제 reusable UI를 하나씩 독립적으로 조작하는 live UI kit.

[x] 한 화면에 UI 하나만 표시
[x] page builder runtime과 library runtime 완전 분리
[x] component selector: 상단 메뉴 / 가로 카드 / 범용 필터칩 / 하단 팝업 / 다른 기기 / 플로팅 버튼
[x] `화이트 / 다크 / 시스템` 전역 색상 모드
[x] PC / 모바일 preview 전환
[x] 상단 메뉴: 원본 / Material / iOS 플랫 / iOS 리퀴드
[x] 범용 필터칩: 원본 / Material / iOS 플랫 / iOS 리퀴드
[x] 플로팅 버튼: 원본 / 플랫 / 글래스 / 리퀴드
[x] 하단 팝업: 전체 / 영상 / 읽을거리 / 질문 / 설정
[x] 다른 기기: 접힘 / 펼침
[x] 범용 필터칩은 실제 `#collectionFilters > .collection-filter` 사용
[x] 다른 기기는 실제 `.collection-device-accordion`만 표시하고 보이지 않는 `.collection-settings` selector context만 유지
[x] bottom sheet 뒤에는 dummy page/FAB 대신 neutral floor만 유지
[x] component interaction owner 유지
[x] production CSS 원본에서 시작하고 사용자 변경값만 V2 override
[x] Material/iOS dark surface 보정
[x] device accordion response transition 연결
[x] `수정 요청 메모` local draft + 기존 `UI_PRESETS.notes` server write 복구
[x] collection runtime이 DOM을 다시 그려도 현재 visibility 설정을 재적용하는 dynamic config guard
[x] 6개 UI × White/Dark/System × PC/Mobile = 36개 조합 실제 Chromium QA 통과
[x] top nav Material + native horizontal scroll + progress line live control 검증
[x] horizontal rail padding / right fade / scrollbar live control 검증
[x] filter 실제 chip click/active state 검증
[x] bottom sheet state / visibility / reset 동기화 검증
[x] device standalone + expansion 검증
[x] FAB family / accent / response 검증
[-] 모든 노출 control의 개별 극단값 수동 visual QA

## Registry / CI

[x] Draft PR #3 생성
[x] browser Block Registry 28 types sync 통과
[x] advertisement server variants sync
[x] block variant sync 통과
[x] UI capability sync 통과
[x] non-photography QA seed / Snapshot V2 check 통과
[x] UI Dashboard 포함 platform JavaScript syntax 통과
[x] Playwright + runner Chrome 기반 실제 browser QA를 `Platform Library Checks`에 추가
[x] browser QA screenshot/report artifact 업로드 추가
[x] 최신 전체 성공 run `32603032059`
[x] 최신 UI Dashboard artifact `9483414399`
[x] 최신 management artifact `9483414627`
[x] UI Dashboard 17개 explicit browser checks 통과
[x] management 3개 browser suites 통과

## Production UI parity

[x] production CSS stack을 sandbox에 동일 순서로 로드
[x] production `liquid-controller`, `collection-hub`, `device-handoff`, rail runtime 재사용
[x] 읽기 진행은 상단 메뉴 component에 포함
[x] legacy full-width `.read-progress`는 editor/library parity 대상에서 제외
[-] 사용자 브라우저에서 production reference와 sandbox의 nav/filter/sheet/FAB 최종 육안 비교

## Side advertisement placement

[x] 좌/우 광고 설정과 활성화 분리
[x] 광고 설정 UI와 배치 geometry owner 분리
[x] 실제 geometry는 `builder-side-ad-zone-audit-v1.js` 하나만 소유
[x] 1360px 미만 sandbox viewport에서 side ad 숨김
[x] 현재 viewport에 보이는 `.chapter .section .content` 기준 배치
[x] hero / chapter hero anchor에서 숨김
[x] 좌우 여백이 폭 + gap을 수용하지 못하면 숨김
[x] follow on/off 유지
[x] Chrome에서 hero 위 숨김 → 본문 진입 시 좌측 광고 활성화 검증
[x] 좌/우 광고 동일 경계 QA
[x] 1280 / 1440 / 1536 / 1600 / 1920 관리 화면 폭에서 여백 경계 QA
[x] 테스트 간 block-layout draft 격리

현재 canonical QA 결과:
- outer 1280 → 좌/우 숨김
- outer 1440 → 좌/우 숨김
- outer 1536 → 좌/우 숨김
- outer 1600 → 좌/우 노출 가능
- outer 1920 → 좌/우 노출 가능

## Other management tools

[x] Block Lab / Page Editor / QA 공통 관리자 셸 적용
[x] Page Editor secondary actions 그룹화
[x] Block Lab 검토 중심 레이아웃
[x] QA/theme는 management chrome이 아니라 preview canvas에 적용
[x] Block Lab / Page Editor / QA desktop/mobile current-nav + noindex browser QA

## Visual artifact review

[x] latest UI Dashboard artifact의 14개 screenshot 직접 확인
[x] latest management artifact의 5개 screenshot 직접 확인
[x] Live UI Kit에서 한 화면에 한 component만 노출되는 구조 확인
[x] filter / device / sheet / FAB / rail이 서로 섞이지 않는 구조 확인
[x] side ad가 body 외곽에 놓이고 narrow desktop에서 숨는 구조 확인

참고: GitHub Ubuntu runner에는 한국어 glyph font가 없어 screenshot의 한국어가 tofu box로 보인다. 이는 레이아웃 QA에는 사용할 수 있지만 실제 한국어 typography 판정 근거로 사용하지 않는다.

## Safety

- production `/photography/`를 builder canvas로 로드하지 않는다.
- sandbox에서 production user data를 읽거나 쓰지 않는다.
- photography renderer를 candidate/mock으로 교체하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- Safari deferred sticky safety를 유지한다.
- 사용자 승인 전 preset/block을 자동 승인하지 않는다.
- management / QA / staging은 noindex를 유지한다.

## Current branch state

- HEAD: `7151adf41635d16a15b2f3f09eba588569dcd04c`
- PR #3: open / Draft / mergeable
- `main` 대비: ahead 86 / behind 2 / diverged
- GitHub merge calculation: conflict 없이 merge 가능
- latest `Platform Library Checks`: success

## Exact next action

1. 사용자가 `UI 라이브러리`와 `화면 구성`을 실제 브라우저에서 최종 육안 검토한다.
2. 피드백이 있으면 `fix/ui-dashboard-system-audit`에서 수정하고 browser QA를 다시 통과시킨다.
3. 병합 요청이 오면 먼저 `main`의 최신 HEAD와 2개 divergence commit을 재확인한다.
4. 사용자 승인 전에는 Draft PR #3을 `main`에 병합하지 않는다.
