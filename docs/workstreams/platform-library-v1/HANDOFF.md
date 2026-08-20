# Platform Library V1 Handoff

Updated: 2026-08-20 KST
Active branch: `feat/admin-ux-shell-v1`
Base main: `95e7d41811424b19b0f587adf4d1d9ad6ee6448c`

## Resume order

1. `AGENTS.md`
2. `docs/workstreams/platform-library-v1/TASKS.md`
3. this file
4. `docs/library/admin-ui/ADMIN-SHELL.md`
5. `docs/library/ui-capabilities/VISUAL-BUILDER.md`
6. current branch HEAD

## Current direction

관리 화면을 각각의 실험 페이지가 아니라 하나의 관리 제품처럼 통합한다.

공통 전역 메뉴:
- 페이지 구성
- UI 라이브러리
- 블록 관리
- 페이지 에디터
- QA

브라우저 뒤로가기는 주요 이동 수단이 아니다. 각 화면에서 공통 메뉴로 바로 이동한다.

전역 이동과 각 도구의 로컬 작업 버튼을 같은 줄에 뒤섞지 않는다. 관리 chrome은 최소화하고 실제 작업 영역을 우선한다.

## Implemented in this branch

### Shared admin shell

New:
- `public/assets/styles/admin/admin-shell-v1.css`
- `public/assets/styles/admin/admin-surface-v1.css`
- `public/assets/js/admin/admin-shell-v1.js`

`block-registry.js`가 Block Lab / Editor Lab / QA 계열에서 공통 셸을 bootstrap한다.

- 모든 주요 관리 화면에서 상호 직접 이동 가능
- 현재 화면 한 곳만 active 표시
- Block Lab의 별도 builder 복귀 링크는 공통 셸이 대체
- QA도 동일한 전역 이동 구조 사용
- `/assets/js/blocks/block-registry.js`, `/assets/js/admin/*`, `/assets/styles/admin/*`에 no-store header 추가해 stale admin shell asset을 피함

### Visual Builder simplification

New:
- `public/assets/styles/ui-dashboard/builder-simplified-v2.css`
- `public/assets/js/ui-dashboard/builder-ux-patch-v2.js`

`/ui-dashboard/`는 이제:
- 공통 관리자 셸
- 로컬 toolbar 한 줄
- 더미 canvas
순서만 기본 chrome으로 사용한다.

기존 builder-local topbar와 중복 global nav는 제거했다.

로컬 toolbar 기본 행동:
- 캔버스 선택
- 편집 중 / 미리보기
- 블록 추가
- 광고
- 저장
- 더보기

`광고` 메뉴 안:
- 본문 광고 추가
- 좌측 광고 설정
- 우측 광고 설정

`더보기` 안:
- 더미 초기화
- 서버 연결
- 설정 불러오기
- 설정 저장

서버 동기화 버튼은 기능을 유지하지만 평소 toolbar를 차지하지 않는다.

UI Library mode에서는 page editing toolbar를 숨기고 library filter만 사용한다. page mode에서 library strip이 같이 보이지 않도록 `[hidden]` owner를 명시했다.

### Page Editor simplification

Page Editor는 기능을 제거하지 않고 작업 우선순위를 바꿨다.

- Undo / Redo / Export / Import → `더보기`
- Page meta / SEO / AI brief / publish → 접힌 `페이지·발행 설정`
- 블록 검색과 블록 목록이 기본 작업 흐름에서 바로 보임
- 상단바, 좌우 pane, canvas chrome 밀도 축소
- 기존 element id/class와 event owner는 유지

### Block Lab simplification

- topbar compact
- sidebar/intro 설명 축소
- 큰 landing-page형 heading 축소
- specimen stage/card chrome 축소
- 900px 이하에서 block nav를 horizontal rail 형태로 전환

### Dummy top navigation

`sandbox.css`에서 desktop `.nav-glass`는 structural wrapper만 남기고 visual surface를 제거했다.

PC에서는 `nav-scroll`의 desktop rail 하나만 visible surface owner가 된다. 기존 white outer capsule + inner rail 중첩 표현을 제거한다.

### Side ads

`builder-sandbox-ads-v1.js`는 더 이상 `50% + 590px` 위치를 가정하지 않는다.

현재 visible `.chapter .section .content`의 실제 `getBoundingClientRect()`를 사용한다.

- hero / chapter hero에서는 hidden
- readable body content가 viewport에 들어올 때만 eligible
- 좌/우 실제 여백이 광고 폭 + gap을 수용할 때만 visible
- content bottom에 최소 광고 표시 공간이 없으면 hidden
- 1360px 미만 hidden
- follow on: eligible body 구간에서 viewport-following
- follow off: 해당 body content 위치 기준 absolute

목적은 좌우 광고가 hero 또는 chapter image 위에 올라가는 문제를 제거하는 것이다.

## Files changed / added

- `public/ui-dashboard/index.html`
- `public/ui-dashboard/sandbox/sandbox.css`
- `public/assets/js/ui-dashboard/builder-sandbox-ads-v1.js`
- `public/assets/js/ui-dashboard/builder-ux-patch-v2.js`
- `public/assets/styles/ui-dashboard/builder-simplified-v2.css`
- `public/assets/js/admin/admin-shell-v1.js`
- `public/assets/styles/admin/admin-shell-v1.css`
- `public/assets/styles/admin/admin-surface-v1.css`
- `public/assets/js/blocks/block-registry.js`
- `public/_headers`
- `docs/library/admin-ui/ADMIN-SHELL.md`
- workstream TASKS / HANDOFF

## Static verification completed

`node --check` passed for current versions of:
- `admin-shell-v1.js`
- `builder-ux-patch-v2.js`
- `block-registry.js`
- `builder-sandbox-ads-v1.js`

No GitHub status checks are attached to the current branch commits.

## Safety

- `/ui-dashboard/` iframe remains `/ui-dashboard/sandbox/` only.
- production `/photography/` is not the builder canvas.
- production user data/API are not introduced into sandbox.
- photography renderer is untouched.
- block/UI presets remain candidate/draft unless user explicitly approves.
- management / QA / staging remain noindex.

## QA still required

Cloudflare branch preview URL/status has not been confirmed through the available connector.

Actual browser QA must cover:
1. common shell appears on all five management modes,
2. every management mode can move directly to every other mode,
3. sticky offsets do not overlap local toolbars,
4. Visual Builder shows common shell + one local toolbar only,
5. UI Library does not show page editing toolbar,
6. Page Editor starts with block search/list visible and advanced page settings collapsed,
7. moved Page Editor `더보기` buttons preserve behavior,
8. dummy desktop nav shows one surface only,
9. side ads remain absent on hero/chapter hero and appear only beside body content,
10. 1440 / 1536 / 1920 desktop widths,
11. <=900px and mobile management navigation.

## Exact next action

Confirm a Cloudflare preview for `feat/admin-ux-shell-v1`, run the QA list above, then fix only observed regressions. Do not merge to `main` until the user reviews the branch result or explicitly asks to merge.
