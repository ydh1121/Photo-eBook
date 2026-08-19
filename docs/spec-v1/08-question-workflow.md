# 08. 본문 선택 → 질문 → 저장 → ChatGPT 흐름

## Q-001 — 목적

사용자가 본문을 읽다가 특정 문장을 선택하고, 그 문장을 context로 질문을 작성·저장·복사·ChatGPT에 전달할 수 있어야 한다.

질문 기능은 읽기 흐름 안에서 시작해 `내 모음 > 질문`으로 이어진다.

## Q-002 — Storage

- 질문 배열: `photoRoadmapQuestionsV2`
- device link: `photoRoadmapDeviceKeyV1`
- remote: Google Sheet `QUESTION_HISTORY`

local save는 remote 실패와 독립적으로 지속 가능해야 한다.

## Q-003 — Selection detection

Base form/state는 `assets/js/app/app-shell.js`가 생성하는 현재 shared question elements를 사용한다.

MUST:
- 빈 selection 무시.
- UI control/input 선택을 context로 오인하지 않음.
- selection text를 bubble click보다 먼저 state/quote에 반영.

## Q-004 — Context bubble / canonical handoff

`#askBubble`의 `GPT에 질문`이 본문 contextual entry다.

Canonical handoff owner: `assets/js/questions/context-handoff.js`

Bubble click 후 결과:
1. selection text 유지.
2. browser selection release.
3. collection이 닫혀 있으면 열기.
4. question primary tab으로 이동.
5. `질문 작성하기` mode 확정.
6. fresh contextual draft를 composer에 mount.

과거 별도 numbered canonicalizer/controller는 제거했다.

## Q-005 — Primary destination

Context bubble은 반드시:

`내 모음 > 질문 > 질문 작성하기`

로 연결된다.

`전체` tab 또는 별도 legacy floating drawer에 머물면 회귀다.

## Q-006 — Question workspace owner

Owner: `assets/js/questions/question-workspace.js`

Secondary labels:
- `질문 작성하기`
- `저장한 질문`

책임:
- controls mount.
- write/saved mode.
- composer parking/reuse.
- write mode deterministic entry.

final visible geometry는 `assets/styles/questions/workspace-final.css`가 소유한다.

## Q-007 — Selector invariant

- 두 slot 정확히 1/2.
- search/content rail과 outer edge 정렬.
- selected liquid pill의 좌우 폭 동일.
- 좌우 outer gap mirror.
- count badge가 라벨 중심을 밀지 않음.
- 중복 legacy selector 금지.

## Q-008 — Saved count

`저장한 질문` badge는 local question store의 현재 길이와 동기화한다.

추가/삭제 후 즉시 갱신한다.

## Q-009 — Composer persistence

collection body rerender로 textarea/quote state가 유실되면 안 된다.

현재 구현은 composer parking/mount compatibility를 사용한다. parking node generation 자체는 제품 UX 계약이 아니며 향후 하나의 stateful component lifecycle로 통합 가능하다.

## Q-010 — Quote

`#askQuote` / `.ask-sheet__quote`:
- 선택 문장 표시.
- 한 줄일 때 안정적인 vertical centering.
- 여러 줄이면 자연스럽게 확장.
- selection이 없을 때 `문장을 선택하면 여기에 표시됩니다.` family placeholder.
- viewport 넘침 금지.

## Q-011 — Textarea

`#askInput`:
- 실제 질문 작성/수정 가능.
- mobile 16px family로 iOS zoom 방지.
- selection quote와 독립적으로 수정 가능.

새 contextual entry에서는 이전 saved question의 textarea 값이 남으면 안 된다.

## Q-012 — Actions

`assets/js/questions/question-actions.js`가 action을 보강한다.

기능 family:
- 질문/프롬프트 복사.
- 질문 저장.
- ChatGPT 열기.
- saved question 삭제/swipe interaction.

별도 App Store/Play 설치 CTA를 primary action으로 추가하지 않는다.

## Q-013 — Prompt / ChatGPT

Prompt는 의미적으로:
- 선택 문장 context.
- 사용자의 질문.

을 구분한다.

ChatGPT open:
- `https://chatgpt.com/` 새 창/탭.
- prompt clipboard copy 시도.
- copy/popup 상태 안내.

앱 내부에서 OpenAI API를 호출해 자동 답변을 생성하는 기능이 아니다.

## Q-014 — Local/remote save

Local record 핵심 field:
- id
- selected_text / selection / quote
- question / prompt
- created_at
- updated_at 가능

Remote RPC:
- `getQuestionHistory`
- `saveQuestionHistory`
- `deleteQuestionHistory`

remote 실패가 local save를 막지 않는다.

## Q-015 — Saved mode

`저장한 질문` mode:
- composer를 parking/reuse 가능 상태로 보존.
- saved question list 표시.
- write composer가 list 아래에 중복 표시되지 않음.

Saved card open:
- write mode 전환.
- saved quote 복원.
- saved question text 복원.
- input/change state 동기화.
- body top으로 적절히 이동.

## Q-016 — Write mode

`질문 작성하기` mode:
- composer 하나가 primary content.
- bulk mode 해제.
- select toggle/bulk bar 숨김.
- saved cards가 composer 아래에 남지 않음.

## Q-017 — Fresh contextual entry vs saved edit

`context-handoff.js`는 새 본문 selection entry와 saved question reopen을 구분해야 한다.

새 selection bubble을 눌렀을 때:
- selected quote는 새 값.
- textarea는 새 질문 작성 상태.
- 직전에 열었던 saved question draft를 복원하지 않음.

saved question card를 명시적으로 열었을 때만 saved draft를 복원한다.

## Q-018 — Delete

질문 삭제 시:
- local array 제거.
- device id가 있으면 remote delete 시도.
- saved count 갱신.
- collection list rerender.

## Q-019 — Device continuity

질문은 video/article와 달리 remote history sync 대상이다.

Owner: `assets/js/collection/device-handoff.js`

사용자는 연결 코드를 통해 다른 기기에서 같은 질문 history를 이어볼 수 있어야 한다.

## Q-020 — Compatibility repair

`assets/js/ui/breeze-repair.js` 등 일부 compatibility layer가 current question geometry/state를 보조한다.

이들은 canonical question source가 아니다. 새 버그 수정에서 세 번째 state owner를 추가하지 않는다.

## Q-021 — 변경 규칙

- question workspace를 별도 페이지/modal로 중복 구현하지 않는다.
- current collection question destination을 유지한다.
- selected text와 질문 textarea를 하나의 문자열로 강제 결합하지 않는다.
- local/remote storage key를 파일명 정리 목적으로 바꾸지 않는다.
- visual geometry 변경 시 `UI_REGRESSION_SPEC.md`의 좌우 대칭과 mobile baseline을 검증한다.
