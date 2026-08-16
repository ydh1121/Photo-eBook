# 16. AI / Codex 작업 수행 규약

이 문서는 `docs/spec-v1/`의 제품 명세를 ChatGPT, Codex 또는 향후 자동화 스킬이 실제 코드 작업에 적용할 때 따라야 하는 **실행 규약**이다. 이 문서가 새로운 UI/기능을 정의하지는 않는다. 제품 규칙의 근거는 각 세부 명세이며, 이 문서는 그 명세를 무시하거나 우회하지 못하게 하는 작업 절차를 고정한다.

## WORK-001 — V1 기준점

모든 작업은 다음 애플리케이션 기준에서 시작한다.

- repository: `ydh1121/Photo-eBook`
- V1 application baseline SHA: `6fe9f6883baa45c3d39ad68d57c21f9d76bf5bfd`
- normative specification root: `docs/spec-v1/`
- production branch: `main`

명세 문서 추가 이후의 Git SHA를 V1 애플리케이션 기준 SHA로 바꾸어 해석하지 않는다.

## WORK-002 — 작업 전 필수 읽기

어떤 코드 작업이든 최소 다음 순서로 확인한다.

1. `README.md`
2. `00-baseline-governance.md`
3. `01-runtime-file-map.md`
4. 변경 대상과 직접 관련된 세부 명세
5. `12-lifecycle-ownership.md`
6. `14-legacy-and-tech-debt.md`
7. `15-regression-checklist.md`

디자인 요소를 수정하면 추가로:
- `02-design-tokens.md`
- `03-layout-responsive-motion.md`
- `04-component-registry.md`

Liquid/navigation을 수정하면 추가로:
- `06-liquid-navigation.md`

내 모음/질문을 수정하면 추가로:
- `07-collection-hub.md`
- `08-question-workflow.md`

외부 글/영상을 수정하면 추가로:
- `09-curated-video.md`

테마/Safari를 수정하면 추가로:
- `10-theme-and-safari.md`

데이터/API/storage를 수정하면 추가로:
- `11-data-api-storage.md`

## WORK-003 — 변경 범위 선언

코드를 쓰기 전에 내부적으로 다음을 확정한다.

- 사용자가 요청한 변화가 무엇인지.
- 변화하지 않아야 하는 인접 요소가 무엇인지.
- 관련 spec ID가 무엇인지.
- 실제 DOM selector가 무엇인지.
- 실제 state/class/data attribute가 무엇인지.
- 해당 상태의 current owner가 어떤 파일/함수인지.
- 후반 CSS override 또는 secondary repair가 있는지.

대상 owner를 찾지 못한 상태에서 새 override/controller를 추가하지 않는다.

## WORK-004 — 구현보다 먼저 실제 runtime 확인

파일 이름이나 주석만 보고 authority를 추정하지 않는다.

반드시 확인할 것:

1. `public/index.html`의 실제 load 여부와 순서.
2. postload/dynamic load 여부.
3. 같은 global function의 후속 재정의 여부.
4. 같은 selector의 후반 cascade 여부.
5. guard flag로 retirement된 controller 여부.
6. MutationObserver/repair layer가 DOM을 다시 쓰는지.

`script-15`~`script-27` 등 historical 세대 파일이 저장소에 존재한다는 이유만으로 다시 활성화하지 않는다.

## WORK-005 — Single Owner 원칙

한 상태/동작에는 하나의 주 owner만 둔다.

특히 다음은 중복 owner를 만들면 안 된다.

- moving liquid indicator
- navigation horizontal scroll
- active tab/chip state
- V40 question mode
- collection open/close state
- bulk selection state
- theme choice
- Safari compact prime

기존 코드에 secondary repair가 이미 존재하는 경우 `14-legacy-and-tech-debt.md`의 known debt로 취급한다. 신규 구현에서 같은 패턴을 더 늘리지 않는다.

## WORK-006 — 디자인 변경 최소 단위

사용자가 특정 영역만 수정하라고 하면 해당 영역만 수정한다.

금지:

- 질문 selector 버그를 고치면서 전역 `html/body` 색을 변경.
- 카드 한 종류를 수정하면서 모든 카드 radius를 변경.
- Safari 문제를 고치면서 FAB 위치나 sheet geometry를 임의 변경.
- Liquid 문제를 고치면서 easing 또는 rail material을 재디자인.
- light-mode contrast를 고치면서 dark theme를 동시에 재설계.

공용 token을 바꿔야 한다면 영향을 받는 component 목록을 먼저 식별한다.

## WORK-007 — 기존 컴포넌트 언어 재사용

새 UI를 추가하기 전에 `04-component-registry.md`에서 동일 의미의 component family를 찾는다.

- badge
- rail
- selected liquid pill
- card
- callout
- search
- bottom sheet
- action button
- empty state

기존 family가 있으면 새로운 독립 디자인을 만들지 말고 그 계층/재질/spacing을 재사용한다.

단, 이미지 위 `.curated-platform`처럼 명세가 contextual exception으로 정의한 요소는 억지로 공통 badge와 통일하지 않는다.

## WORK-008 — V1과 기술부채를 구분

현재 코드의 다음 특성은 V1 제품 요구가 아니다.

- numbered CSS override 누적 구조
- 다중 global `setupNavigation()` 정의
- broad `!important`
- parking node 세대 중복
- retired JS 파일 잔존
- repair layer 중복

재구축 시 이 구조를 복제할 필요는 없다.

반대로 다음은 V1 제품 계약이다.

- 10개 챕터 정보 구조
- 모바일 우선 읽기 흐름
- native horizontal top rail
- Liquid Glass rail + one moving selected pill
- Breeze 계열 spring
- 내 모음 bottom sheet
- 전체/영상/읽을거리/질문/설정 primary tabs
- 질문 작성하기/저장한 질문 secondary selector
- 본문 선택 → GPT에 질문 → 질문 작성 흐름
- local durable favorites
- 질문 local + Google Sheet sync
- light/dark/system
- 현재 필요한 Safari compact-prime behavior

## WORK-009 — 명세와 구현이 다를 때

다음 순서로 판단한다.

1. 사용자의 현재 명시적 요청.
2. `docs/spec-v1/` 세부 규칙.
3. 기존 `UI_REGRESSION_SPEC.md`.
4. V1 baseline의 실제 구현.
5. historical comment.

현재 구현에 known bug/debt가 있어 명세와 다르면 코드를 정답으로 승격시키지 않는다.

## WORK-010 — 명세 자체를 바꾸는 조건

버그 수정으로 spec을 사용자 몰래 바꾸지 않는다.

V1 규칙 자체가 변경되는 경우에만:

1. 사용자가 새 최종 상태를 명시적으로 승인.
2. 관련 spec ID 수정.
3. 관련 component/state/owner 문서 수정.
4. regression checklist 수정 필요 여부 확인.
5. 변경 이유와 이전 규칙의 관계 기록.

단순 구현 수정은 V1 baseline 의미를 바꾸지 않는다.

## WORK-011 — CSS 작업 규칙

CSS 수정 전:

- base selector 검색.
- 동일 selector의 모든 active override 확인.
- 최종 computed authority 확인.
- light/dark/media query 확인.
- Safari-specific selector 확인.

새 `!important`는 기존 cascade를 이해하지 못한 상태에서 임시로 추가하지 않는다.

active stylesheet를 수정했다면 실제 `public/index.html` cache query version도 함께 확인한다.

## WORK-012 — JS 작업 규칙

JS 수정 전:

- 파일이 direct load인지 postload인지 확인.
- guard flag 확인.
- global override 확인.
- capture/bubble event listener 중복 확인.
- MutationObserver/timeout repair 확인.
- state persistence/localStorage/API side effect 확인.

동일 click을 처리하는 새로운 capture listener를 추가하기 전에 기존 owner로 해결 가능한지 우선 확인한다.

## WORK-013 — Storage/API 변경 규칙

localStorage key, Sheet column, API response shape는 UI class보다 더 강한 호환성 계약으로 취급한다.

변경 시 반드시 migration/backward compatibility를 검토한다.

특히:

- `photoRoadmapQuestionsV2`
- `photoRoadmapDeviceKeyV1`
- video/article favorite ID/item stores
- `photoRoadmapThemeV1`
- `QUESTION_HISTORY`
- `CURATED_LINKS`
- `/api/site-data`
- `/api/rpc`
- `/api/curated`
- `/api/discover`
- `/api/videos`

을 이름만 깔끔하게 만들기 위해 임의 변경하지 않는다.

## WORK-014 — Safari 작업 규칙

Safari 브라우저 UI와 사이트 DOM을 구분한다.

사이트가 보장할 수 있는 것:

- app/root surface 처리
- nav geometry stability
- collection geometry
- safe-area 처리
- compact 상태 감지 및 prime lifecycle

사이트가 완전히 소유하지 않는 것:

- Safari expanded toolbar 자체의 색/투명도
- Safari compact address pill 자체의 최종 browser rendering

browser-owned 영역을 억지로 바꾸기 위해 app geometry를 희생하지 않는다.

## WORK-015 — 구현 후 필수 회귀 검증

최소 다음을 수행한다.

1. 변경 selector/state의 직접 동작.
2. 관련 theme light/dark.
3. mobile width.
4. collection과 연관되면 primary tab/search/bulk.
5. liquid와 연관되면 duplicate indicator 및 spring.
6. question과 연관되면 selection → write → save → reopen.
7. root/nav/Safari와 연관되면 iPhone Safari 실제 동작.
8. storage/API와 연관되면 기존 저장 데이터 보존.

상세 항목은 `15-regression-checklist.md`를 따른다.

## WORK-016 — Git 종료 검증

작업 종료 시 시작 SHA와 종료 SHA를 compare한다.

반드시 확인:

- 요청한 파일만 변경되었는지.
- unrelated 파일이 섞이지 않았는지.
- active asset 변경 시 cache query가 맞는지.
- docs-only 작업이면 `public/`, `functions/`가 변경되지 않았는지.
- spec 변경이 있다면 실제 사용자 승인 범위인지.

검증 없이 “완료”라고 보고하지 않는다.

## WORK-017 — 후속 작업 보고 형식

후속 구현 완료 보고에는 최소 다음 정보를 포함한다.

- 무엇을 변경했는지.
- 관련 spec ID.
- 변경 파일.
- 의도적으로 유지한 인접 동작.
- 회귀 검증 결과.
- final commit SHA.

버그가 남아 있으면 완료로 숨기지 않고 known limitation/debt로 구분한다.

## WORK-018 — Skill로 전환할 때

향후 이 프로젝트 전용 Skill을 만들 경우 이 문서를 entry contract로 사용한다.

Skill은 최소 다음 행동을 강제해야 한다.

1. 요청을 spec ID와 연결.
2. 관련 source owner를 먼저 찾음.
3. V1 규칙 위반 여부를 구현 전에 판단.
4. 코드 변경 범위를 제한.
5. 변경 후 `15-regression-checklist.md`에서 관련 항목 검증.
6. Git compare로 unrelated changes 차단.
7. V1 변경이 필요하면 사용자 명시적 승인 없이는 spec을 수정하지 않음.

즉 Skill의 목적은 ‘코드를 자동으로 많이 고치는 것’이 아니라 **V1 명세에서 벗어나지 않게 작업 과정을 통제하는 것**이다.
