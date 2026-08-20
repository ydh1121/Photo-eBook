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

브라우저 뒤로가기는 주요 이동 수단이 아니다. 각 화면에서 위 메뉴로 바로 이동한다.

전역 메뉴와 각 도구의 로컬 작업 버튼은 분리한다.

## Implemented in this branch

### Shared admin shell

New:
- `public/assets/styles/admin/admin-shell-v1.css`
- `public/assets/styles/admin/admin-surface-v1.css`
- `public/assets/js/admin/admin-shell-v1.js`

`block-registry.js`가 Block Lab / Editor Lab / QA 계열에서 공통 셸을 bootstrap한다.

Page Editor에서 낮은 빈도의 undo / redo / export / import는 `더보기`로 묶는다. Block Lab의 기존 별도 builder 복귀 링크는 공통 셸이 대신한다.

### Visual Builder simplification

New:
- `public/assets/styles/ui-dashboard/builder-simplified-v2.css`
- `public/assets/js/ui-dashboard/builder-ux-patch-v2.js`

`/ui-dashboard/`:
- 기존 중복 global nav 제거
- 로컬 header는 현재 작업명 + server state만 유지
- toolbar는 편집 상태 / 블록 추가 / 광고 / 저장 / 더보기 중심
- 본문/좌/우 광고 버튼은 하나의 `광고` 메뉴 안으로 이동
- 더미 초기화는 `더보기` 안으로 이동
- UI Library mode에서는 page toolbar를 숨김
- library tools `[hidden]` 강제 처리

### Dummy top navigation

`sandbox.css`에서 desktop `.nav-glass`는 structural wrapper만 남기고 visual surface를 제거했다. PC `nav-scroll` rail만 보이도록 해서 white outer capsule + inner rail 이중 표현을 제거한다.

### Side ads

`builder-sandbox-ads-v1.js`는 더 이상 `50% + 590px` 위치를 가정하지 않는다.

현재 visible `.chapter .section .content`의 실제 rect를 사용한다.

- hero / chapter hero에서는 hidden
- 본문 content가 viewport에 들어올 때만 eligible
- 좌/우 실제 여백이 광고 폭 + gap을 수용할 때만 visible
- 1360px 미만 hidden
- chapter content가 끝나기 직전 hidden
- follow on: viewport-following
- follow off: 해당 content 시작점에 absolute placement

이 구조의 목적은 광고가 히어로나 chapter image 위에 올라가는 문제를 없애는 것이다.

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
- `docs/library/admin-ui/ADMIN-SHELL.md`
- workstream TASKS / HANDOFF

## Safety

- `/ui-dashboard/` iframe remains `/ui-dashboard/sandbox/` only.
- production `/photography/` is not the builder canvas.
- production user data/API are not introduced into sandbox.
- photography renderer is untouched.
- block/UI presets remain candidate/draft unless user explicitly approves.

## QA still required

No GitHub status checks are attached to the current branch commits. Cloudflare branch preview URL has not yet been confirmed from connector status.

Actual browser QA must cover:
1. common shell appears on all five management modes,
2. every management mode can move directly to every other mode,
3. sticky offsets do not overlap local toolbars,
4. Page Editor `더보기` preserves all moved button behavior,
5. Visual Builder page mode does not show UI Library filter strip,
6. UI Library mode does not show page editing toolbar,
7. dummy desktop nav shows one surface only,
8. side ads remain absent on hero/chapter hero and appear only beside body content,
9. 1440 / 1536 / 1920 desktop widths,
10. <=900px and mobile management navigation.

## Exact next action

Confirm the Cloudflare preview for `feat/admin-ux-shell-v1`, run the QA list above, then fix only observed regressions. Do not merge to `main` until the user reviews the branch result or explicitly asks to merge.
