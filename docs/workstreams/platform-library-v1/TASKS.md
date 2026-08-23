# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / admin UI refinement / production connection deferred`
Production branch: `main`
Current implementation branch: `main`
Canonical UI parity PR: `#6`
Live verification PRs: `#7`, `#8`, `#9`, `#10`
Latest admin UI PR: `#11` merged
Global Chip implementation merge: `9278658f464fd2179d642f668cea236f866b8d63`
Latest admin UI merge: `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
Latest live-verified source SHA: `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
Latest live status commit: `9a7e627e16b18eeed1a9cad1cbd8e0532a2f2059`

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
[x] canonical design owner를 sandbox runtime으로 통일
[x] 동적 bottom sheet / filter / device DOM 재동기화
[x] production owner가 없는 죽은 조절기 숨김 + stale override 제거
[x] legacy full-width `.read-progress` 제거, 진행 표시는 상단 메뉴가 단독 소유
[x] iframe missed lifecycle용 late bootstrap 추가
[x] `더미 초기화` 후 block/UI/ad draft 완전 삭제 검증
[x] Chrome fixed nav + integrated progress ownership 검증
[x] inline 광고 추가 → layout draft 저장 검증
[x] Chrome 모바일 tap → 하단 inspector + dock 검증
[x] 실제 block drag/drop 재정렬 이벤트와 저장 순서 검증

### UI 라이브러리 = Live UI Kit

[x] 한 화면에 UI 하나만 표시
[x] page builder runtime과 library runtime 완전 분리
[x] component selector: 상단 메뉴 / 가로 카드 / 범용 필터칩 / 하단 팝업 / 다른 기기 / 플로팅 버튼
[x] `화이트 / 다크 / 시스템` 전역 색상 모드
[x] PC / 모바일 preview 전환
[x] 범용 필터칩은 실제 `#collectionFilters > .collection-filter` 사용
[x] 다른 기기는 실제 `.collection-device-accordion`만 표시
[x] bottom sheet 뒤에는 neutral floor만 유지
[x] production CSS 원본에서 시작하고 사용자 변경값만 V2 override
[x] `수정 요청 메모` local draft + 기존 `UI_PRESETS.notes` server write 복구
[x] collection runtime DOM 재생성 뒤 현재 설정 재적용
[x] 6개 UI × White/Dark/System × PC/Mobile = 36개 조합 Chromium QA 통과
[x] horizontal rail padding / right fade / scrollbar live control 검증
[x] bottom sheet state / visibility / reset 동기화 검증
[x] device standalone + expansion 검증
[x] FAB family / accent / response 검증
[-] 사용자 브라우저에서 최종 typography/미세 시각 조정 검토

### Filter chip feedback patch V2

[x] `하단 팝업 필터칩 / 활성 칩 비교 / 긴 라벨 / 좁은 폭` 4개 specimen board 제거
[x] 실제 `#collectionFilters` 하나만 Live UI Kit에 직접 표시
[x] 샘플 칩 이름 입력 → 추가 / 마지막 삭제 / 기본 구성 복원 기능 추가
[x] 레일 위 / 오른쪽 / 아래 / 왼쪽 여백을 각각 live control로 분리
[x] 칩 좌우 / 위아래 여백과 칩 사이 간격을 live control로 노출
[x] 기존 `runway` 저장값은 네 방향 레일 여백으로 안전하게 migration
[x] style family 전환이 사용자가 조정한 geometry를 덮어쓰지 않도록 분리
[x] 기본 family를 처음 선택할 때 이전 상단 메뉴 기준 gap `9px`, rail inset `5.5px`를 적용
[x] PC mouse drag에 velocity 기반 관성 스크롤 + drag 후 click suppression 추가
[x] 모바일은 native horizontal scroll owner 유지
[x] MutationObserver 재귀 루프 제거
[x] 관성 시작 시 velocity가 0으로 초기화되던 버그 수정
[x] 임시 진단 스크립트 및 CI 호출 제거
[x] PR #11 `Platform Library Checks` run `32638788027`, job `97192525406` 성공
[x] PR #11 `main` merge: `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
[x] Cloudflare Pages 관리단 v10 배포 검증
[-] 사용자 실제 브라우저 최종 확인

## Global Chip parity

[x] `범용 필터칩`을 플랫폼 공통 Chip Design System owner로 승격
[x] 상단 메뉴에서 common Chip 표현 owner 제거; layout/sticky/progress만 유지
[x] 범용 Chip 표현 owner를 `global-chip-runtime-v1.js`로 단일화
[x] 중복 Material/iOS/iOS Liquid chip paint owner 제거
[x] Material rail `#f1f3f6`, border, no-shadow/no-blur 복원
[x] iOS Flat rail `rgba(244,247,251,.88)`, 12px blur, 기존 shadow 복원
[x] iOS Liquid 22px / saturate 138% glass + v37 moving selector 복원
[x] inactive chip은 모든 공통 family에서 투명 surface 유지
[x] top nav / filter / bottom sheet가 동일 global family와 accent 공유
[x] production `nav-corrections.css`보다 global family nav surface가 최종 표현 owner가 되도록 specificity 정리
[x] Material → iOS Flat → iOS Liquid runtime transition Chromium 검증
[x] 과거 잘못 저장된 정확히 일치하는 legacy preset만 canonical 값으로 1회 마이그레이션
[x] 사용자 직접 수정 preset은 보존
[x] PR #6 `main` 병합

## Registry / browser QA

[x] Block Registry 28 types sync
[x] advertisement server variants sync
[x] block variant sync
[x] UI capability sync
[x] non-photography QA seed / Snapshot V2
[x] platform JavaScript syntax
[x] Playwright + runner Chrome 기반 browser QA
[x] browser QA screenshot/report artifact
[x] global Chip canonical parity browser check
[x] management browser suites
[x] PR #10 전체 `Platform Library Checks` 성공: run `32631294005`, job `97174412641`
[x] Filter chip V2 single-rail / live spacing / inertia browser check
[x] PR #11 최종 clean CI 성공: run `32638788027`, job `97192525406`

## Live Cloudflare Pages verification

[x] `Platform Live Deploy Check` workflow 추가
[x] 관리단 HTML이 `builder-entry-audit-v1.js?v=10` 제공하는지 확인
[x] live asset이 `__platformGlobalChipRuntimeV4` 제공하는지 확인
[x] live 범용 필터칩 Material surface = `rgb(241, 243, 246)` 확인
[x] live Material 범용 필터칩 → 상단 메뉴 전파 확인
[x] live iOS Liquid filter = `blur(22px) saturate(1.38)` 확인
[x] live iOS Liquid 범용 필터칩 → 상단 메뉴 전파 확인
[x] 성공/실패 모두 `docs/workstreams/platform-library-v1/qa/live-deploy-status.json`에 기록
[x] 현재 live status = `pass`
[x] live workflow run id `32638904052`, run number `5`
[x] live 검증 대상 source SHA `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
[x] live status bot commit `9a7e627e16b18eeed1a9cad1cbd8e0532a2f2059`

## Production UI parity

[x] production CSS stack을 sandbox에 동일 순서로 로드
[x] production `liquid-controller`, `collection-hub`, `device-handoff`, rail runtime 재사용
[x] 읽기 진행은 상단 메뉴 component에 포함
[x] legacy full-width `.read-progress` 제외
[x] live Pages에서 global Chip 핵심 runtime/전파 검증
[-] 사용자 브라우저에서 실제 한국어 typography와 미세 시각 parity 최종 검토

## Production connection — final task only

[ ] 관리단에서 사용자가 UI를 최종 승인하기 전에는 관리단 설정을 공개 페이지 런타임에 연결하지 않는다.
[ ] 최종 승인 후에만 관리단의 승인된 UI 설정을 `photo-ebook.pages.dev` 공개 페이지에 연결한다.
[ ] 연결 시 승인된 preset/config만 production renderer가 읽도록 publish boundary를 둔다.
[ ] 연결 후 공개 페이지 PC / 모바일 / White / Dark/System 회귀 QA를 다시 수행한다.

현재 단계는 `관리단 자체 완성`이다. 공개 페이지 적용 연결은 최종 테스크로 보류한다.

## Side advertisement placement

[x] 좌/우 광고 설정과 geometry owner 분리
[x] 실제 geometry는 `builder-side-ad-zone-audit-v1.js` 하나만 소유
[x] hero / chapter hero anchor에서 숨김
[x] 실제 보이는 `.chapter .section .content` 기준 배치
[x] 좌우 여백이 폭 + gap을 수용하지 못하면 숨김
[x] follow on/off 유지
[x] 1280 / 1440 / 1536 / 1600 / 1920 관리 화면 폭 QA

Canonical width result:
- 1280 / 1440 / 1536 → 좌우 숨김
- 1600 / 1920 → 본문 zone에서 좌우 노출 가능

## Other management tools

[x] Block Lab / Page Editor / QA 공통 관리자 셸
[x] Page Editor secondary actions 그룹화
[x] Block Lab 검토 중심 레이아웃
[x] QA/theme는 preview canvas에 적용
[x] Block Lab / Page Editor / QA desktop/mobile current-nav + noindex browser QA

## Safety

- production `/photography/`를 builder canvas로 로드하지 않는다.
- sandbox에서 production user data를 읽거나 쓰지 않는다.
- photography renderer를 candidate/mock으로 교체하지 않는다.
- mobile native horizontal scroll owner를 유지한다.
- Safari deferred sticky safety를 유지한다.
- 사용자 승인 전 preset/block을 자동 승인하지 않는다.
- 관리단에서 승인 전 설정을 공개 페이지 production runtime에 publish하지 않는다.
- management / QA / staging은 noindex를 유지한다.

## Current main state

- global Chip implementation merge: `9278658f464fd2179d642f668cea236f866b8d63`
- PR #11 admin UI merge: `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
- latest live-verified implementation source: `46eb02f4eedf30fbe8b4b01c706e11759577abb0`
- live verification result commit: `9a7e627e16b18eeed1a9cad1cbd8e0532a2f2059`
- live status: `pass`
- deployed dashboard entry: `builder-entry-audit-v1.js?v=10`
- deployed common Chip runtime: `__platformGlobalChipRuntimeV4`

## Exact next action

1. 사용자가 `https://photo-ebook.pages.dev/ui-dashboard/?view=library&ui=filter-chip-rail`에서 단일 레일, 관성, 상하좌우 여백, 샘플 칩 추가/삭제 UX를 확인한다.
2. 피드백이 있으면 관리단만 계속 조정한다.
3. 공개 `photo-ebook.pages.dev` 화면과 승인 설정을 연결하는 작업은 사용자 최종 승인 시점까지 진행하지 않는다.
