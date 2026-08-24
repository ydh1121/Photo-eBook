# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / admin UI architecture reset deployed / user browser review`
Production branch: `main`
Architecture reset merge: `80dc5a835b3515e07c7b53b2f69164664d7dfc82`
Live verification result: `pass`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product boundary

[x] 관리단과 공개 페이지 publish 경계를 분리한다.
[x] 현재 단계에서는 `/ui-dashboard/`만 수정한다.
[ ] 사용자가 관리단을 최종 승인한 뒤에만 승인 설정을 공개 `photo-ebook.pages.dev` 런타임에 연결한다.
[ ] publish 연결 후 공개 페이지 PC / 모바일 / 테마 회귀 QA를 수행한다.

## Admin UI architecture reset

2026-08-24 사용자 녹화에서 확인된 기존 문제:
- 전체 sandbox 페이지를 실행한 뒤 DOM을 떼어내는 구조
- reparenting 후 filter/bottom-sheet/state patch가 겹치는 다중 owner
- 컴포넌트 전환 시 hero/full-page flash
- 하단 팝업 탭 전환 뒤 sheet 소실
- filter rail / selector / legacy indicator 경쟁

현재 구조:
`관리단 컨트롤러 → 독립 컴포넌트 미리보기 → 관리단 설정 저장`

[x] `/ui-dashboard/component-preview/` 독립 preview document 추가
[x] `component-preview-v1.js`를 preview renderer 단일 owner로 추가
[x] `builder-library-kit-v3.js`를 parent state/config 단일 owner로 추가
[x] library iframe에서 `/ui-dashboard/sandbox/?preview=...` 제거
[x] sandbox full-page DOM extraction / reparenting 제거
[x] library boot patch stack 제거
[x] page runtime loader에서 preview-only filter/bottom-sheet patch 제거
[x] sandbox page runtime에서 preview branch 제거

## Dead patch removal

[x] `builder-library-kit-v2.js`
[x] `builder-global-chip-kit-v1.js`
[x] `builder-library-canonical-state-v1.js`
[x] `builder-library-state-sync-v1.js`
[x] `builder-library-notes-v1.js`
[x] `builder-kit-v2.css`
[x] `builder-filter-chip-live-v2.css`
[x] `bottom-sheet-parity-v1.js`
[x] `filter-chip-legacy-guard-v1.js`
[x] `filter-chip-live-runtime-v2.js`
[x] `filter-chip-live-runtime-v3.js`

Result: architecture reset removed substantially more legacy code than it added.

## UI Library V3

### Shared controls

[x] White / Dark / System
[x] PC / Mobile
[x] 상단 메뉴 / 가로 카드 / 범용 필터칩 / 하단 팝업 / 다른 기기 / 플로팅 버튼
[x] component-specific preview height
[x] 설정값은 management config에만 저장

### Filter chip

[x] rail 하나만 horizontal scroll owner
[x] active chip은 sibling overlay
[x] legacy selector owner 제거
[x] 샘플 칩 추가 / 마지막 삭제 / 기본 복원
[x] 칩 개별 family override
[x] 공통값 사용 / Material / iOS 플랫 / iOS 리퀴드
[x] 공통 family 변경 시 개별 override 보존
[x] rail top/right/bottom/left padding
[x] chip X/Y padding + gap
[x] 상단 메뉴는 공통 filter-chip family/accent 상속

### Bottom sheet

[x] collection hub open/close 기반 DOM 추출 제거
[x] stable sheet DOM 직접 소유
[x] 전체 / 영상 / 읽을거리 / 질문 / 설정
[x] 동일 sheet 내부에서 내용만 변경
[x] preview tab ↔ parent state 동기화
[x] settings에 다른 기기 accordion fixture 포함

### Other UI

[x] top navigation direct fixture
[x] horizontal card rail direct fixture + overflow
[x] device handoff direct fixture
[x] floating action direct fixture

## Page builder / ads

[x] 화면 구성 sandbox는 page-mode 전용으로 유지
[x] component preview가 page builder DOM을 재사용하지 않음
[x] `캔버스 넓게` 유지
[x] PC side-ad outer gutter 방향 유지
[-] 사용자 브라우저에서 화면 구성 / 광고 위치 추가 검토

## QA and deployment

[x] `check-ui-dashboard-browser-v5.mjs`
[x] full sandbox / hero 미혼입 검사
[x] legacy preview patch 미로딩 검사
[x] 6 UI × White/Dark/System × PC/Mobile
[x] filter ownership + per-chip override
[x] bottom-sheet all→video→article→question→settings→all stability
[x] device state sync
[x] card rail overflow
[x] PR #13 final Platform Library Checks success: run `32678705117`
[x] PR #13 merge: `80dc5a835b3515e07c7b53b2f69164664d7dfc82`
[x] Cloudflare Pages management deploy verified
[x] deployed entry: `builder-entry-audit-v1.js?v=12`
[x] deployed preview marker: `__platformComponentPreviewV1`
[x] live isolated preview boot pass
[x] live filter rail + sibling overlay pass
[x] live per-chip override pass
[x] live bottom-sheet all-state stability pass
[x] live workflow run: `32678756008`
[x] live status bot commit: `85fb5577b797d94f8505d7fec68a2c5e8016ab72`
[-] 사용자 실제 브라우저 확인

## Safety

- production `/photography/`를 component preview로 로드하지 않는다.
- component preview는 production user/storage 데이터를 읽지 않는다.
- management config를 최종 승인 전 public runtime에 publish하지 않는다.
- mobile native horizontal scroll 원칙을 유지한다.
- management / QA / staging은 noindex를 유지한다.

## Exact next action

1. 사용자가 live `/ui-dashboard/`의 UI 라이브러리를 다시 확인한다.
2. 남은 문제는 새 V3 owner 안에서만 수정한다. 제거한 extraction/repair patch를 되살리지 않는다.
3. UI 라이브러리가 안정되면 화면 구성의 Lego/module assembly UX를 다음 단계로 정리한다.
4. 공개 페이지 publish 연결은 관리단 전체 최종 승인 뒤 마지막 단계로 유지한다.
