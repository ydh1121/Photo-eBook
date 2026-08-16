# 01. 런타임 파일 지도와 cascade 순서

## LIFE-001 — 최초 HTML bootstrap

`public/index.html`이 모든 런타임 진입점이다.

최초 inline bootstrap은 CSS/앱 렌더 전에 다음을 수행한다.

1. iOS + WebKit이면 `<html>`에 `ios-webkit-chrome` 클래스 추가.
2. `localStorage.photoRoadmapThemeV1` 읽기.
3. 값은 `light | dark | system`만 허용, 기본값 `light`.
4. `data-theme-choice`, `data-theme`, `style.colorScheme` 즉시 설정.

테마 FOUC를 막기 때문에 이 bootstrap을 일반 deferred JS 뒤로 이동하면 안 된다.

## LIFE-002 — CSS 실제 로드 순서

기준 SHA의 `index.html`은 아래 순서로 CSS를 로드한다. 뒤 파일이 앞 파일을 override할 수 있으므로 **순서 자체가 계약**이다.

1. `style-1.css?v=22` — root tokens
2. `style-2.css?v=22` — reset/layout primitives/boot
3. `style-3.css?v=22` — hero/nav/chapter/base guide/question
4. `style-4.css?v=22` — legacy nav top control
5. `style-5.css?v=22` — card/component base
6. `style-6.css?v=22` — card tuning
7. `style-7.css?v=22` — equipment table/card tuning
8. `style-8.css?v=22` — responsive/accessibility
9. `style-9.css?v=22` — Safari nav + curated base
10. `style-10.css?v=22` — middle-dot removal
11. `style-11.css?v=22` — sticky/backdrop jitter guard
12. `style-12.css?v=22` — mobile nav/curated polish
13. `style-13.css?v=22` — nav/question drawer revision
14. `style-14.css?v=22` — sticky nav performance revision
15. `style-15.css?v=24` — Safari browser-facing surface attempt
16. `style-16.css?v=25` — refined process + skill media
17. `style-17.css?v=26` — discovery sentinel
18. `style-18.css?v=27` — unified collection hub
19. `style-19.css?v=31` — native horizontal rails + collection layout
20. `style-20.css?v=32` — liquid/question hub generation
21. `style-21.css?v=33` — progress/theme generation
22. `style-22.css?v=34` — dark completion/question actions/swipe
23. `style-24.css?v=36` — v36 flat liquid canonical layer
24. `style-25.css?v=37` — nested liquid skin canonical material
25. `style-26.css?v=38` — rail interaction/dark repairs
26. `style-27.css?v=39` — liquid/question/search repairs
27. `style-28.css?v=40` — v40 question controls/bulk layout
28. `style-29.css?v=42` — question workspace/bulk stability
29. `style-30.css?v=48` — native top rail + Safari root cleanup
30. `style-31.css?v=49` — native pan/FAB clearance
31. `style-32.css?v=50` — pill z hierarchy/overshoot/root transparency
32. `style-33.css?v=51` — top runway/current question glass
33. `style-34.css?v=75` — final v40 question geometry + browser-facing root
34. `style-35.css?v=7` — first-paint liquid fallback + compact-prime hiding
35. `style-36.css?v=4` — light contrast + curated badge finalization

`style-23.css`는 저장소에 있으나 기준 `index.html`에서 로드되지 않는다. 현재 runtime authority가 아니다.

## LIFE-003 — bundled data 순서

CSS 다음에 `site-data-1.js` ~ `site-data-8.js`가 defer로 로드된다. 각 파일은 JSON 문자열 조각을 `window.__SITE_DATA_FALLBACK_PARTS`에 append한다. 이 파일들은 UI logic이 아니라 offline/boot fallback payload다.

## LIFE-004 — critical JS 로드 순서

head:
- `script-1.js` — site data retrieval/cache/RPC

body의 generated media:
- `generated/client-review.js`
- `generated/product-studio.js`
- `generated/retouch-workstation.js`

body deferred scripts:
1. `script-2.js` — helpers/images/callout
2. `script-3.js` — base renderer/modules
3. `script-liquid-core.js` — canonical liquid/theme controller
4. `script-4.js` — older navigation implementation
5. `script-6.js` — curated renderer + source section
6. `script-gate.js` — UI/data gate
7. `script-5.js` — renderApp + selection/question base
8. `script-7.js` — navigation revision
9. `script-8.js` — navigation/question revision
10. `script-12.js` — generated images + skill media/video
11. `script-9.js` — final effective `setupNavigation` revision at initial render path
12. `script-10.js` — curated copy cleanup
13. `script-11.js` — boot recovery
14. `script-13.js` — endless curated/video + durable favorite snapshots
15. `script-postload-v27.js` — postload loader
16. `script-17.js` — question actions/ChatGPT/swipe delete
17. `script-19.js` — bulk select + secondary repair
18. `script-24.js` — current question controls/write-saved mounting
19. `script-25.js` — v40/question repair + Breeze-related legacy motion layer
20. `script-28.js` — theme-color cleanup
21. `script-29.js` — canonical question structure/context handoff
22. `script-safari-compact-prime.js` — iOS compact toolbar prime

## LIFE-005 — 지연 로드되는 JS

`script-postload-v27.js`는 앱 렌더 완료 후 idle 구간에서:

- `/assets/script-asset-fix.js?v=30`
- `/assets/script-14.js?v=29`

를 동적으로 로드한다.

따라서 `script-14.js`는 `index.html`에 직접 없지만 **현재 runtime active**다. `script-asset-fix.js` 역시 generated image registry를 data URL → Blob URL로 변환하는 active postload helper다.

## OWN-001 — 현재 authority와 legacy 구분

현재 file 이름의 숫자가 높다고 자동으로 owner가 되는 것은 아니다. 최종 owner는 실제 runtime 순서, guard flag, selector specificity, DOM lifecycle을 함께 판단한다.

특히:
- nav/collection/theme moving liquid controller: `script-liquid-core.js`
- chapter 활성 상태/vertical navigation: 최종 `setupNavigation` override 계열(`script-9.js`) + existing event layers
- collection DOM/base state: dynamically loaded `script-14.js`
- v40 질문 workspace: `script-24.js`, `script-29.js`; visible geometry는 `style-34.css`
- bulk selection: `script-19.js`가 주요 owner
- Safari compact prime: `script-safari-compact-prime.js`

## OWN-002 — dormant / historical JS

저장소에 있으나 기준 index/postload에서 로드하지 않는 세대 파일은 새로운 작업에서 임의로 다시 연결하면 안 된다. 대표적으로:

- `script-15.js` v32 liquid/question
- `script-16.js` v33/v44 liquid/theme
- `script-18.js` v35 liquid/bulk
- `script-20.js` v36.1 settle
- `script-21.js` v37 skin/inertia
- `script-22.js` v38 spring
- `script-23.js` v39 rail controller
- `script-26.js` v48 Safari/native rail
- `script-27.js` v54 retired liquid owner (`script-liquid-core.js`가 guard를 선점)
- `script-30.js` old Safari edge guard

이 파일들은 역사/참고 자료이며 V1 신규 owner가 아니다.

## REG-001 — runtime 변경 규칙

- active asset을 수정하면 `index.html`의 해당 query version을 올린다.
- postload asset의 version은 `script-postload-v27.js` 내부 URL에서 관리한다.
- load order를 바꾸는 작업은 기능 수정이 아니라 architecture 변경으로 취급한다.
- dormant controller를 다시 로드하려면 먼저 `12-lifecycle-ownership.md`와 `14-legacy-and-tech-debt.md`를 갱신해야 한다.
