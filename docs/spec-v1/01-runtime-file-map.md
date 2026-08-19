# 01. 런타임 파일 지도와 로드 순서

## LIFE-001 — 최초 HTML bootstrap

`public/index.html`이 유일한 정적 런타임 진입점이다.

CSS보다 먼저 실행되는 inline bootstrap은 다음만 수행한다.

1. iOS + WebKit이면 `<html>`에 `ios-webkit-chrome` 클래스 추가.
2. `localStorage.photoRoadmapThemeV1` 읽기.
3. `light | dark | system`을 해석하고 기본값은 `light`로 설정.
4. `data-theme-choice`, `data-theme`, `style.colorScheme` 즉시 설정.

테마 first-paint flash를 막기 위해 이 코드를 deferred module 뒤로 이동하지 않는다.

## LIFE-002 — runtime asset layout

번호형 런타임 파일은 제거하고 역할별 디렉터리로 분류한다.

### CSS

- `public/assets/styles/core/`
- `public/assets/styles/components/`
- `public/assets/styles/navigation/`
- `public/assets/styles/collection/`
- `public/assets/styles/questions/`
- `public/assets/styles/ui/`
- `public/assets/styles/media/`
- `public/assets/styles/desktop/`
- `public/assets/styles/safari/`
- `public/assets/styles/compat/`

### JavaScript

- `public/assets/js/core/`
- `public/assets/js/app/`
- `public/assets/js/render/`
- `public/assets/js/navigation/`
- `public/assets/js/content/`
- `public/assets/js/media/`
- `public/assets/js/collection/`
- `public/assets/js/questions/`
- `public/assets/js/ui/`
- `public/assets/js/desktop/`
- `public/assets/js/safari/`
- `public/assets/js/compat/`

### bundled fallback data

`public/data/site-data/part-01.js` ~ `part-08.js`

각 파일은 JSON 문자열 조각을 `window.__SITE_DATA_FALLBACK_PARTS`에 순서대로 append한다. 파일 번호는 기능 revision이 아니라 payload shard 순서를 뜻한다.

## LIFE-003 — CSS 실제 로드 순서

기존 승인 UI의 cascade를 보존하기 위해 semantic rename 뒤에도 CSS 순서는 변경하지 않는다. 아래 순서 자체가 회귀 계약이다.

1. `styles/core/tokens.css`
2. `styles/core/base-layout.css`
3. `styles/core/base-components.css`
4. `styles/navigation/legacy-top-controls.css`
5. `styles/components/cards.css`
6. `styles/components/card-tuning.css`
7. `styles/components/gear-cards.css`
8. `styles/core/responsive-accessibility.css`
9. `styles/navigation/safari-curated-base.css`
10. `styles/compat/korean-punctuation.css`
11. `styles/safari/sticky-backdrop-guard.css`
12. `styles/navigation/mobile-nav-curated.css`
13. `styles/navigation/nav-question-drawer.css`
14. `styles/navigation/sticky-performance.css`
15. `styles/safari/browser-surface.css`
16. `styles/media/process-skill-media.css`
17. `styles/media/discovery-sentinel.css`
18. `styles/collection/hub.css`
19. `styles/collection/horizontal-rails.css`
20. `styles/ui/liquid-question-foundation.css`
21. `styles/ui/progress-theme.css`
22. `styles/ui/dark-question-swipe.css`
23. `styles/ui/liquid-flat-canonical.css`
24. `styles/ui/liquid-skin.css`
25. `styles/ui/rail-dark-repairs.css`
26. `styles/collection/question-search-repairs.css`
27. `styles/questions/workspace-controls.css`
28. `styles/questions/workspace-stability.css`
29. `styles/safari/native-rail-root.css`
30. `styles/navigation/native-pan-fab-clearance.css`
31. `styles/ui/pill-hierarchy.css`
32. `styles/questions/top-runway-glass.css`
33. `styles/questions/workspace-final.css`
34. `styles/safari/first-paint-fallback.css`
35. `styles/ui/light-contrast-badges.css`
36. `styles/desktop/layout-hit-targets.css`
37. `styles/desktop/nav-rails.css`
38. `styles/desktop/nav-corrections.css`
39. `styles/desktop/rail-fade.css`
40. `styles/collection/device-handoff-layout.css`
41. `styles/collection/device-accordion.css`
42. `styles/collection/device-accordion-state.css`
43. `styles/collection/device-accordion-fallback.css`
44. `styles/collection/selection-state.css`
45. `styles/collection/modal-shield.css`
46. `styles/navigation/chapter-progress.css`
47. `styles/safari/deferred-sticky-chrome.css`

이 순서를 임의로 카테고리별로 재정렬하지 않는다. 현재 코드는 여러 세대의 selector override를 포함하므로 semantic folder는 탐색성을 개선하기 위한 분류이고, cascade consolidation은 별도 리팩터링 과제다.

## LIFE-004 — critical JavaScript 순서

### head

bundled data 8개 뒤에:

- `assets/js/core/site-data-client.js` — site data cache/fallback/live fetch/RPC

### body — generated media registry

1. `assets/js/media/generated/client-review.js`
2. `assets/js/media/generated/product-studio.js`
3. `assets/js/media/generated/retouch-workstation.js`

### body — deferred runtime

1. `assets/js/core/render-helpers.js`
2. `assets/js/render/chapter-renderers.js`
3. `assets/js/ui/liquid-controller.js`
4. `assets/js/content/curated-content.js`
5. `assets/js/core/ui-ready-gate.js`
6. `assets/js/app/app-shell.js`
7. `assets/js/questions/drawer-enhancements.js`
8. `assets/js/media/media-enrichment.js`
9. `assets/js/navigation/chapter-navigation.js`
10. `assets/js/compat/curated-copy.js`
11. `assets/js/app/boot-recovery.js`
12. `assets/js/content/content-discovery.js`
13. `assets/js/app/postload-enhancements.js`
14. `assets/js/questions/question-actions.js`
15. `assets/js/collection/bulk-selection.js`
16. `assets/js/questions/question-workspace.js`
17. `assets/js/ui/breeze-repair.js`
18. `assets/js/safari/theme-color-cleanup.js`
19. `assets/js/media/image-slot-registry.js`
20. `assets/js/media/image-slot-binder.js`
21. `assets/js/safari/deferred-sticky-nav.js`
22. `assets/js/desktop/rail-drag.js`
23. `assets/js/collection/device-handoff-compat.js`
24. `assets/js/collection/device-handoff.js`
25. `assets/js/questions/context-handoff.js`
26. `assets/js/collection/modal-shield.js`
27. `assets/js/compat/copy-contract.js`

과거의 중간 `setupNavigation()` 정의 파일처럼 최종 renderer 호출 전에 항상 덮어써져 실제 실행되지 않던 runtime 파일은 제거했다.

## LIFE-005 — postload boundary

`assets/js/app/postload-enhancements.js`는 앱 렌더 후 idle 구간에서 다음을 동적으로 로드한다.

1. `assets/js/media/generated-image-blob-cache.js`
2. `assets/js/collection/collection-hub.js`

따라서 두 파일은 `index.html`에 직접 없지만 runtime active다.

## OWN-001 — 주요 runtime authority

- site data API/cache: `js/core/site-data-client.js`
- 전체 app assembly: `js/app/app-shell.js`
- top nav active chapter/scroll target: `js/navigation/chapter-navigation.js`
- nav/collection/theme moving liquid: `js/ui/liquid-controller.js`
- collection DOM/base state: postload `js/collection/collection-hub.js`
- bulk selection: `js/collection/bulk-selection.js`
- question workspace: `js/questions/question-workspace.js`
- question contextual/GPT handoff: `js/questions/context-handoff.js`
- device continuation: `js/collection/device-handoff.js`
- iOS Safari initial chrome/sticky transition: `js/safari/deferred-sticky-nav.js` + `styles/safari/deferred-sticky-chrome.css`
- image slot registry/binding: `js/media/image-slot-registry.js`, `js/media/image-slot-binder.js`

## OWN-002 — 제거된 역사 파일

2026-08-19 runtime cleanup에서 다음을 repository runtime surface에서 제거했다.

- 미사용 `style-23.css`
- 중간 navigation definition인 `script-4.js`, `script-7.js`
- 연결되지 않은 controller 세대 `script-15.js`, `16`, `18`, `20`, `21`, `22`, `23`, `26`, `27`, `29`, `30`
- Safari 원인 분석용 임시 `public/diagnostics/*`

Git history가 과거 구현의 기록 역할을 하므로 dead source를 production tree에 별도 보관하지 않는다.

## REG-001 — runtime 변경 규칙

- active asset을 수정하면 해당 semantic path의 query version을 올린다.
- postload asset version은 `js/app/postload-enhancements.js` 내부 URL에서 관리한다.
- CSS load order를 바꾸는 작업은 단순 rename이 아니라 architecture 변경으로 취급한다.
- 동일 상태/indicator/scroll owner를 새 파일로 중복 생성하지 않는다.
- 새 파일명은 기능을 설명하는 kebab-case를 사용하며 revision 번호를 filename identity로 사용하지 않는다.
