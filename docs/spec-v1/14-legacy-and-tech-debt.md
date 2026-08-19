# 14. Legacy / 기술부채 / 재구축 시 복제하지 말아야 할 것

이 문서는 현재 사용자 승인 UX는 보존하되, 내부 구현에서 아직 남은 구조적 부채와 2026-08-19 정리로 해결된 항목을 구분한다.

## RESOLVED-001 — 번호형 runtime 파일명

2026-08-19 cleanup에서 `style-N.css`, `script-N.js`를 production runtime identity로 사용하는 구조를 제거했다.

현재 runtime은 `public/assets/styles/*`, `public/assets/js/*`의 semantic path만 사용한다.

해결 효과:
- 파일명만 보고 역할을 식별 가능.
- active/dormant 세대 혼동 감소.
- 새 코드가 높은 번호를 붙여 owner처럼 보이는 문제 제거.

단, **파일 내부의 누적 override 자체가 자동으로 통합된 것은 아니다.** 이름 정리와 cascade consolidation은 다른 작업이다.

## RESOLVED-002 — dormant controller source 잔존

현재 dependency graph에 연결되지 않던 구형 liquid/navigation/controller 파일을 production tree에서 삭제했다.

삭제 대상에는 과거 `script-15`, `16`, `18`, `20`, `21`, `22`, `23`, `26`, `27`, `29`, `30` 세대가 포함된다.

또한 최종 `setupNavigation()` 호출 전에 항상 덮어써져 실행되지 않던 중간 `script-4`, `script-7` 정의도 제거했다.

필요한 역사 정보는 Git history가 보존한다. dead source를 production directory에 별도 보관하지 않는다.

## RESOLVED-003 — 미사용 CSS / 임시 diagnostics

- index에서 로드되지 않던 과거 `style-23.css` 삭제.
- Safari 원인 분석용 `public/diagnostics/*` 임시 페이지 삭제.

진단 페이지를 production tree에 장기 보관하지 않는다. 재현이 필요하면 Git history에서 복구하거나 새 isolated fixture를 만든다.

## RESOLVED-004 — Safari hidden popup prime

과거 Safari compact chrome을 갱신하기 위해 collection을 보이지 않게 열고 탭을 바꿨다가 닫던 workaround는 제거했다.

현재 승인 구현:
- iOS WebKit root에 실제 theme canvas 제공.
- 최초 nav는 normal flow.
- browser chrome compact 감지 후 sticky arm.

자세한 내용은 `10-theme-and-safari.md`를 따른다.

---

# Remaining technical debt

## DEBT-001 — CSS 누적 cascade

semantic path로 이름은 정리했지만 현재 CSS는 여전히 여러 역사 layer가 순서대로 같은 selector를 override한다.

문제:
- 동일 selector 반복.
- `!important` 의존.
- 앞 layer를 수정해도 뒤 layer가 이길 수 있음.
- 기능별 파일과 실제 final owner가 완전히 1:1은 아님.

향후 정리:
- token/base/component/navigation/collection/question/theme/Safari 단위에서 최종 computed rule을 추출.
- 한 번에 한 component family씩 consolidation.
- 각 단계마다 `UI_REGRESSION_SPEC.md` 실기기 회귀 확인.
- 현재 47개 CSS의 load order를 임의로 재정렬하지 않는다.

## DEBT-002 — global renderer/function overrides

다수 helper/renderer가 아직 `window`/global scope에 있고 뒤 script가 같은 global function을 override하는 구조가 일부 남아 있다.

향후:
- ES modules 또는 명확한 namespace/module registry로 이전.
- `app-shell`이 최종 render 시 호출하는 함수 identity를 테스트로 고정.

## DEBT-003 — Liquid secondary repair

canonical moving liquid owner는 `assets/js/ui/liquid-controller.js`다.

다만 bulk/question/desktop repair 코드 일부가 indicator geometry나 skin 존재 여부를 보조적으로 다시 맞춘다.

향후:
- canonical controller self-heal이 충분한지 검증.
- 보조 module의 nav/question indicator 직접 geometry write를 단계적으로 제거.
- moving indicator owner는 하나만 남긴다.

## DEBT-004 — question geometry compatibility layers

현재 질문 workspace는 semantic 파일로 분류됐지만 다음 역할이 여러 compatibility layer에 걸쳐 있다.

- `questions/question-workspace.js`
- `ui/breeze-repair.js`
- `questions/context-handoff.js`
- `styles/questions/workspace-final.css`

최종 visual geometry는 CSS가 강하게 소유하고 일부 JS inline write는 legacy compatibility로 남아 있다.

향후:
- 현재 승인된 mirrored two-slot geometry를 기준으로 JS geometry write/cancel을 제거.
- composer parking/mount lifecycle을 하나의 owner로 통합.

## DEBT-005 — legacy question drawer data owner

base question form/state와 current collection question workspace 사이에 과거 drawer DOM/state 재사용 흔적이 남아 있다.

향후:
- selection state, quote, textarea, 저장/복사/ChatGPT 기능 유지.
- 별도 legacy modal representation은 제거.
- 하나의 question workspace lifecycle로 통합.

## DEBT-006 — collection bulk repair layers

bulk selection의 주요 owner는 `assets/js/collection/bulk-selection.js`지만 question rerender 이후 보조 repair가 존재한다.

향후:
- collection renderer가 현재 bulk state를 직접 projection.
- 후처리 repair 최소화.

## DEBT-007 — collection scroll lock

collection open/close 과정에는 과거 Safari 대응에서 누적된 body/root lock 보정이 남아 있다.

향후:
- 하나의 scroll-lock owner로 통합.
- iPhone Safari expanded/compact chrome과 modal open 상태를 함께 실기기 테스트.

## DEBT-008 — generated image를 JS data URL로 보유

`assets/js/media/generated/`의 일부 generated media는 큰 data URL registry다.

문제:
- JS parse/diff 부담.
- postload Blob URL 변환 helper 필요.

향후:
- static `.webp` 파일로 이전 가능.
- logical generated-image key contract는 유지.

## DEBT-009 — external fallback / discovery dependency

일부 콘텐츠는 외부 이미지/검색/metadata source에 의존할 수 있다.

위험:
- 외부 availability/crop 변경.
- YouTube/public search 내부 구조 변경.
- article metadata parser 대상 사이트 변경.

원칙:
- core app failure와 격리.
- 승인된 local/generated asset을 우선.
- 외부 API/parser 실패 시 기존 fallback 경로 유지.

## DEBT-010 — string-template DOM rendering

많은 UI가 HTML string + `innerHTML` 기반이다.

위험:
- rerender가 child state/listener를 파괴.
- parking/repair 필요.

향후 component framework 도입이 필수는 아니지만 state owner와 DOM update boundary는 명확히 해야 한다.

## DEBT-011 — `!important`와 theme rule 분산

여러 역사 CSS layer가 final geometry를 고정하기 위해 `!important`를 사용하고 light/dark 규칙도 분산돼 있다.

향후 우선순위:
1. 실제 DOM/class 확인.
2. 현재 final owner 확인.
3. semantic surface token으로 중복 theme rule 통합.
4. 동일 selector의 후반 override를 줄인 뒤에만 앞 layer 제거.

## DEBT-012 — semantic filename은 owner 선언이 아님

파일명이 정리됐다고 해서 해당 파일이 자동으로 유일 owner가 되는 것은 아니다.

판정 기준:
- 실제 load order.
- guard flag.
- selector specificity.
- DOM lifecycle.
- `12-lifecycle-ownership.md`의 owner 계약.

새 기능을 추가할 때 기존 semantic module을 먼저 확장하고, 같은 상태를 다루는 새 parallel module을 만들지 않는다.
