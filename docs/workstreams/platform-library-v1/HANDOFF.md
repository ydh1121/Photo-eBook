# Platform Library V1 Handoff

Updated: 2026-08-22 KST
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

`UI 라이브러리`는 screenshot catalog가 아니다. 플랫폼에서 실제로 쓰는 reusable UI를 하나씩 독립적으로 띄우고 상태·테마·표현을 바꾸는 **Live UI Kit**이다.

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
- `builder-page-live-v2.js`가 모든 design control을 sandbox canonical runtime으로 전달
- sandbox `capability-runtime-v3.js`가 실제 UI paint/behavior override owner
- editor nav는 sandbox fixed-pin fallback으로 스크롤을 따라옴

`/ui-dashboard/?view=library`:
- page builder scripts를 로드하지 않음
- `builder-library-kit-v2.js`만 parent UI Kit owner
- `sandbox-kit-v4.js`가 실제 production component를 단독 추출

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
- device: actual `.collection-device-accordion` only
- FAB: actual `#collectionFab` only

The dummy page remains hidden behind isolated library previews. Dragging/closing the bottom sheet must reveal only the neutral kit floor.

## Theme

Sandbox `liquid-controller.js` owns `window.setPhotoRoadmapTheme(light|dark|system)`.
`capability-runtime-v3.js` receives `platform-theme` from the parent and applies it inside the iframe.
Storage isolation keeps `photoRoadmapThemeV1` inside sandbox memory, so UI Kit theme tests do not mutate the user's production theme.

## Fixed editor nav

CSS sticky alone was unreliable inside the editor iframe. The sandbox page-mode runtime now inserts a spacer before `.nav-shell` and switches the actual nav shell to `position:fixed` when the spacer reaches the viewport top. Scroll events are captured at document level, so it does not depend on a specific scroll owner.

The user confirmed this editor nav now follows scrolling.

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

## QA still required before merge

1. Library component selector shows one UI only.
2. White / Dark / System changes the active component immediately.
3. PC / Mobile changes preview width without changing component source.
4. Filter preview shows the actual bottom-sheet filter chips and all seeded categories.
5. Filter click interaction remains live.
6. Bottom sheet tabs and drag remain live; closing reveals only neutral floor.
7. Device preview shows only accordion; collapsed/expanded controls work.
8. FAB visual mode controls work.
9. Page mode: every inspector input immediately changes the iframe through canonical runtime.
10. Reset returns production UI, not manifest-forced defaults.
11. Block DnD, ads, draft save/reset regressions are absent.
12. 1440 / 1536 / 1920 desktop and mobile widths.

Do not merge to `main` until these checks are observed or the user explicitly requests merge despite remaining QA.
