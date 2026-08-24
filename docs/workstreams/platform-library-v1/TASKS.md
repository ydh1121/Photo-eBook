# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active / failed isolated-preview rollout reverted / safer reference-runtime rebuild in branch`
Production branch: `main`
Current main restore commit: `f7349d41a90cd55ebd4b8b75e82ed665e05a723f`
Current implementation branch: `refactor/admin-ui-reference-runtime-v2`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Product boundary

[x] 관리단과 공개 페이지 publish 경계를 분리한다.
[x] 현재 단계에서는 `/ui-dashboard/` 관리단만 수정한다.
[ ] 사용자가 관리단을 최종 승인한 뒤에만 승인 설정을 공개 `photo-ebook.pages.dev` 런타임에 연결한다.
[ ] publish 연결 후 공개 페이지 PC / 모바일 / 테마 회귀 QA를 수행한다.

## 2026-08-24 rollback

[x] 사용자 실브라우저 녹화에서 PR #13 isolated component preview가 실제 UI parity를 크게 훼손한 것을 확인했다.
[x] 확인된 증상: 필터 라벨 `[object Object]`, 실제 사진 페이지와 다른 크기/표면/타이포그래피, 지나치게 큰 빈 캔버스, 하단 팝업 내부 레이아웃/상태 표현 차이, 모바일/PC 비율 불일치.
[x] 원인: production CSS/JS를 공유하지 않고 관리단용 모사 컴포넌트를 새로 그린 것이었다.
[x] PR #13 rollout tree를 main에서 되돌렸다.
[x] 복구 commit `f7349d41a90cd55ebd4b8b75e82ed665e05a723f`는 PR #13 이전 tree를 그대로 사용한다.
[x] 잘못된 isolated preview 구현을 기준으로 추가 패치를 하지 않는다.

## Safe rebuild rule

새 구조는 `모사 UI`를 만들지 않는다.

Target:
`관리단 컨트롤 → reference fixture → 기존 사진 페이지 CSS/JS owner`

필수 원칙:
- 컴포넌트의 HTML class/id 구조는 사진 페이지/현재 sandbox와 동일하게 유지한다.
- `liquid-controller.js`, `chapter-navigation.js`, `collection-hub.js`, `rail-drag.js`, `device-handoff.js` 등 기존 owner를 직접 재사용한다.
- 하단 팝업은 `collection-hub.js`가 실제 `#collectionLayer / #collectionSheet / #collectionFilters`를 생성하게 한다.
- 하단 팝업/필터를 관리단 DOM으로 reparent 하지 않는다.
- standalone preview가 필요하면 같은 DOM을 제자리에서 CSS로 격리해서 보여준다.
- 새 preview 전용 CSS는 stage/centering/background만 소유하고, 실제 component skin을 다시 그리지 않는다.
- 기존 localStorage V2/V3 데이터 shape를 명시적으로 migration하고 `[object Object]` 같은 문자열화 실패를 금지한다.
- 모바일은 production native scroll을 유지한다.

## Active rebuild tasks

[-] `refactor/admin-ui-reference-runtime-v2`에서 exact reference fixture 구조를 만든다.
[ ] 상단 메뉴: sandbox와 동일 `.nav-shell > .nav-scroll > .nav-chip` DOM + 기존 navigation/liquid runtime 사용.
[ ] 가로 카드: sandbox와 동일 `.scroll-row / .market-card` DOM + `rail-drag.js` 사용.
[ ] 하단 팝업: `collection-hub.js`가 생성한 실제 sheet를 열고 같은 DOM 안에서 탭 상태를 바꾼다.
[ ] 범용 필터칩: 실제 `#collectionFilters > .collection-filter`를 제자리에서 사용하고 reparent하지 않는다.
[ ] 다른 기기: 실제 settings 상태의 `.collection-device-accordion`을 제자리에서 사용한다.
[ ] 플로팅 버튼: 실제 `#collectionFab`을 그대로 사용한다.
[ ] 관리단 샘플 칩 저장 데이터 V2/V3 migration을 추가한다.
[ ] UI별 PC/mobile reference screenshots를 자동 저장하고 사진 페이지 기준 screenshot과 육안 비교한다.
[ ] 실제 브라우저 확인 전 main에 merge하지 않는다.

## Page builder / ads

[x] PR #12 이전 상태로 관리단을 복구했다.
[-] PC side-ad는 본문 바깥 gutter에 고정하고 hero 진입에 따라 슬롯 자체가 사라지지 않는 방향을 유지한다.
[ ] UI 라이브러리 복구 후 화면 구성/광고를 다시 실브라우저 검토한다.
[ ] 이후 아임웹식 `페이지 → 섹션 → 모듈 인스턴스 → 내용/디자인/동작` 조립 UX로 단계적으로 정리한다.

## Safety

- production `/photography/`를 management preview용 canvas로 로드하지 않는다.
- production user/storage 데이터를 관리단 fixture에서 읽지 않는다.
- 사진 페이지 UI를 닮은 새 CSS skin을 별도로 만들지 않는다.
- existing production/sandbox component owner를 직접 재사용한다.
- 승인 전 management config를 공개 production runtime에 publish하지 않는다.
- management / QA / staging은 noindex를 유지한다.

## Exact next action

1. main 복구 배포를 확인한다.
2. `refactor/admin-ui-reference-runtime-v2`에서 production owner를 공유하는 reference fixture를 구축한다.
3. 브라우저 QA에서 실제 DOM/class/runtime owner와 screenshot parity를 확인한다.
4. 사용자에게 branch 결과를 보여주기 전까지 main에 다시 merge하지 않는다.
