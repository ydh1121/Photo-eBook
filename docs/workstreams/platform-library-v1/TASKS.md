# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / admin UI architecture cleanup / production connection deferred`
Production branch: `main`
Current implementation branch: `refactor/admin-ui-component-runtime-v1`
Current PR: `#13`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product boundary

[x] 관리단과 공개 페이지 publish 경계를 분리한다.
[x] 현재 단계에서는 `/ui-dashboard/`만 수정한다.
[ ] 사용자가 관리단을 최종 승인한 뒤에만 승인 설정을 공개 `photo-ebook.pages.dev` 런타임에 연결한다.
[ ] publish 연결 후 공개 페이지 PC / 모바일 / 테마 회귀 QA를 수행한다.

## Admin UI architecture reset

Problem confirmed from the 2026-08-24 browser recording:
- UI 라이브러리가 전체 sandbox 페이지를 실행한 뒤 DOM을 떼어내는 구조였다.
- DOM reparenting 뒤 filter/bottom-sheet/state patch가 겹치며 owner가 늘어났다.
- 컴포넌트 전환 시 hero/full-page flash가 보였다.
- 하단 팝업 탭 전환 뒤 sheet가 사라질 수 있었다.
- filter rail / active selector / legacy indicator가 서로 다른 runtime에서 경쟁했다.

Target architecture:
`관리단 컨트롤러 → 독립 컴포넌트 미리보기 → 관리단 설정 저장`

[x] `/ui-dashboard/component-preview/` 독립 preview document 추가
[x] `component-preview-v1.js`를 preview renderer 단일 owner로 추가
[x] `builder-library-kit-v3.js`를 library parent state/config 단일 owner로 추가
[x] library iframe이 `/ui-dashboard/sandbox/?preview=...`를 사용하지 않도록 변경
[x] sandbox full-page DOM extraction / reparenting 제거
[x] library boot에서 runtime patch loader / canonical-state patch / state-sync patch 제거
[x] page-mode runtime loader에서 preview-only filter/bottom-sheet patch 제거
[x] sandbox page runtime에서 preview branch 전체 제거

## Dead patch removal

[x] `builder-library-kit-v2.js` 제거
[x] `builder-global-chip-kit-v1.js` 제거
[x] `builder-library-canonical-state-v1.js` 제거
[x] `builder-library-state-sync-v1.js` 제거
[x] `builder-library-notes-v1.js` 제거
[x] `builder-kit-v2.css` 제거
[x] `builder-filter-chip-live-v2.css` 제거
[x] `bottom-sheet-parity-v1.js` 제거
[x] `filter-chip-legacy-guard-v1.js` 제거
[x] `filter-chip-live-runtime-v2.js` 제거
[x] `filter-chip-live-runtime-v3.js` 제거

This refactor currently removes more legacy code than it adds.

## UI Library V3

### Shared controls

[x] White / Dark / System
[x] PC / Mobile
[x] component selector: 상단 메뉴 / 가로 카드 / 범용 필터칩 / 하단 팝업 / 다른 기기 / 플로팅 버튼
[x] component-specific preview height
[x] 설정값은 management local config에만 저장

### Filter chip

[x] 가로 scroll owner는 rail 하나로 고정
[x] active chip은 rail 내부 indicator가 아니라 sibling overlay로 분리
[x] legacy selector owner 제거
[x] 샘플 칩 추가 / 마지막 삭제 / 기본 복원
[x] 선택한 샘플 칩의 개별 family override
[x] 개별 override 선택지: 공통값 사용 / Material / iOS 플랫 / iOS 리퀴드
[x] 공통 family 변경 시 개별 override 보존
[x] rail top/right/bottom/left padding control
[x] chip X/Y padding + gap control
[x] 상단 메뉴는 공통 filter-chip family/accent를 상속

### Bottom sheet

[x] collection hub를 열었다 닫아서 DOM을 추출하는 방식 제거
[x] stable sheet DOM을 preview가 직접 소유
[x] 전체 / 영상 / 읽을거리 / 질문 / 설정 상태 전환
[x] 탭 전환은 동일 sheet 내부 content만 교체
[x] preview 내부 탭 클릭과 parent state 동기화
[x] 다른 기기 accordion을 settings fixture 안에서도 표시 가능

### Other UI

[x] top navigation direct fixture
[x] horizontal card rail direct fixture + real overflow
[x] device handoff direct fixture
[x] floating action direct fixture

## Page builder / ads

[x] 기존 화면 구성 sandbox는 page-mode로 유지
[x] component preview refactor가 page builder DOM을 재사용하지 않음
[x] PR #12의 `캔버스 넓게` 기능 유지
[x] PR #12의 PC side-ad outer gutter 방향 유지
[-] 사용자 브라우저에서 page builder / 광고 위치 추가 검토

## QA

[x] `check-ui-dashboard-browser-v5.mjs` 추가
[x] full sandbox / hero가 component preview에 섞이지 않는지 검사
[x] legacy extraction/patch scripts가 component preview에 로드되지 않는지 검사
[x] 6 UI × White/Dark/System × PC/Mobile 검사
[x] filter rail와 active overlay ownership 검사
[x] filter per-chip override 검사
[x] bottom-sheet all→video→article→question→settings→all stability 검사
[x] device accordion state sync 검사
[x] card rail horizontal overflow 검사
[x] live deploy checker를 entry v12 + isolated component runtime 기준으로 갱신
[-] PR #13 final `Platform Library Checks` run `32678621466` 진행 중
[ ] PR #13 merge
[ ] Cloudflare Pages 관리단 배포 검증
[ ] 사용자 실브라우저 확인

## Safety

- production `/photography/`를 management component preview로 로드하지 않는다.
- component preview는 production user/storage 데이터를 읽지 않는다.
- unapproved management config를 public production runtime에 publish하지 않는다.
- mobile native horizontal scroll 원칙을 유지한다.
- management / QA / staging은 noindex를 유지한다.

## Exact next action

1. PR #13 run `32678621466` 결과를 확인한다.
2. 실패 시 새 isolated-preview QA 기준으로 수정한다. 구형 extraction patch를 되살리지 않는다.
3. 성공 시 PR #13을 `main`에 병합한다.
4. Cloudflare Pages 관리단 live check에서 entry v12, component preview boot, filter ownership, bottom-sheet tab stability를 확인한다.
5. 사용자에게 실제 관리단 화면 확인을 요청한다.
