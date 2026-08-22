# Platform Library V1 Handoff

Updated: 2026-08-23 KST
Active branch: `fix/ui-dashboard-system-audit`
Production branch: `main`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current branch HEAD

## Current product direction

`UI 라이브러리`는 screenshot catalog가 아니다. 플랫폼에서 실제로 쓰는 reusable UI를 하나씩 독립적으로 띄우고 상태·테마·표현을 바꾸는 Live UI Kit이다.

Library components:
- 상단 메뉴
- 가로 카드
- 범용 필터칩
- 하단 팝업
- 다른 기기
- 플로팅 버튼

중요한 의미:
- `범용 필터칩` = 실제 내 모음 bottom sheet 안의 `.collection-filter`
- `다른 기기` = 실제 `.collection-device-accordion` 하나만 표시
- `읽기 진행` = 상단 메뉴 component의 일부
- 초기 상태 = production CSS 원본
- 사용자가 바꾼 값만 override

## Current runtime split

`/ui-dashboard/` page mode:
- builder-v1은 inspector / block selection / block DnD chrome을 유지
- `builder-page-preflight-v2.js`가 V1 store를 V2 explicit override 기준으로 정규화
- `builder-page-live-v2.js`가 design control을 sandbox canonical runtime으로 전달
- `builder-dynamic-sync-v1.js`가 bottom sheet / filter / device처럼 클릭 뒤 생기는 DOM에 설정을 다시 적용
- `builder-control-guard-v1.js`가 실제 owner가 없는 조절기를 UI에서 숨김
- sandbox `capability-runtime-v3.js`가 실제 UI paint/behavior override owner
- `runtime-audit-patch-v1.js`가 dark representation과 device transition/context 회귀를 보정
- editor nav는 sandbox fixed-pin fallback으로 스크롤을 따라옴

`/ui-dashboard/?view=library`:
- page builder scripts를 로드하지 않음
- `builder-library-kit-v2.js`가 parent UI Kit owner
- `builder-library-state-sync-v1.js`가 상태 전환 뒤 capability override를 재적용
- `sandbox-kit-v4.js`가 실제 production component를 단독 추출
- `runtime-audit-patch-v1.js`가 device standalone에 보이지 않는 `.collection-settings` 문맥만 유지

## Live UI Kit behavior

Global controls:
- 색상: White / Dark / System
- 화면: PC / Mobile

Quick representation controls:
- 상단 메뉴: 원본 / Material / iOS 플랫 / iOS 리퀴드
- 범용 필터칩: 원본 / Material / iOS 플랫 / iOS 리퀴드
- 플로팅 버튼: 원본 / 플랫 / 글래스 / 리퀴드

State controls:
- 하단 팝업: 전체 / 영상 / 읽을거리 / 질문 / 설정
- 다른 기기: 접힘 / 펼침

Component extraction:
- nav: actual `.nav-shell`
- rail: actual `.scroll-row` / `.desktop-rail-window`
- filter: actual `#collectionFilters`
- sheet: actual `#collectionLayer`, FAB hidden
- device: actual `.collection-device-accordion`; production selector 문맥을 위한 투명 `.collection-settings` wrapper만 유지
- FAB: actual `#collectionFab`

The dummy page remains hidden behind isolated library previews. Dragging/closing the bottom sheet must reveal only the neutral kit floor.

## Theme

Sandbox `liquid-controller.js` owns `window.setPhotoRoadmapTheme(light|dark|system)`.
`capability-runtime-v3.js` receives `platform-theme` from the parent and applies it inside the iframe.
Storage isolation keeps `photoRoadmapThemeV1` inside sandbox memory, so UI Kit theme tests do not mutate the user's production theme.

Material/iOS override families now have explicit dark surfaces in `runtime-audit-patch-v1.js`; dark mode no longer falls back to light chips/rails.

## Fixed editor nav

Production의 Safari deferred-sticky owner는 유지한다.

일반 desktop editor iframe에서는 CSS sticky가 scroll ancestor에 따라 불안정할 수 있으므로 sandbox 전용 fixed-pin fallback을 사용한다. `.nav-shell` 앞 spacer가 viewport top에 도달하면 실제 nav shell을 fixed로 전환한다. 이 동작은 production source를 수정하지 않는다.

Legacy full-width `.read-progress`는 호환층에서 항상 제외한다.

## Canvas reset

`더미 초기화`는 이제 단순 iframe reload가 아니다.

초기화 대상:
- `platformBuilderLayoutV1`
- `platformBuilderCapabilityConfigsV1`
- `platformBuilderCapabilityConfigsV2`
- `platformBuilderSideAdsV1`

메모/저장 preset은 삭제하지 않는다. 캔버스 초안만 지운 뒤 parent 관리 화면을 다시 시작한다.

## Side ads

기존 side-ad owner가 페이지 전체의 가장 넓은 `.wide`를 선택할 수 있어 chapter hero 구간에 잘못 남는 가능성이 있었다.

`builder-side-ad-zone-audit-v1.js`가 최종 배치를 다시 검증한다.

- viewport에 실제로 보이는 `.chapter .section .content`가 있어야 함
- hero / chapter hero anchor 위에서는 숨김
- 좌우 실제 여백이 width + gap을 수용해야 함
- 1360px 미만 숨김
- follow on/off 유지

## Main divergence

현재 `main`은 branch merge-base 이후 2커밋 앞서 있다.
두 커밋의 실제 파일 변경은 `public/ui-dashboard/sandbox/sandbox.js` 하나이며, branch의 해당 파일 blob SHA와 현재 main blob SHA가 동일하다. 내용 충돌은 확인되지 않았다.

## Removed / superseded paths

Do not restore:
- `builder-library-audit-v1.js`
- `sandbox-v3.js`

They were replaced by Live UI Kit v2 / sandbox kit v4.

## Safety

- builder canvas remains dummy-only.
- production `/photography/` is not loaded into the builder.
- production user storage/data are not read by sandbox.
- UI previews reuse production component runtime/CSS but use isolated dummy data.
- no preset/block automatic approval.
- do not merge to `main` without user approval.

## Next verification

1. Open a Draft PR from `fix/ui-dashboard-system-audit` to `main` so `Platform Library Checks` runs.
2. Confirm registry checks and JS syntax checks pass.
3. Then run actual browser QA for the six UI Kit components across White / Dark / System and PC / Mobile.
4. Verify filter source, device-only preview, bottom-sheet close floor, quick modes, and every visible inspector control.
5. Verify block add/reorder/save/reset and left/right/inline ads.
6. Fix only observed regressions on the same branch.
7. Reconcile with `main`, then merge only after user approval.
