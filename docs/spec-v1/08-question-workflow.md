# 08. 본문 선택 → 질문 → 저장 → ChatGPT 흐름

## Q-001 — 질문 기능의 목적

사용자가 본문을 읽다가 특정 문장을 선택하고, 그 문장을 context로 질문을 작성·저장·복사·ChatGPT에 전달할 수 있어야 한다.

질문 기능은 별도 독립 앱이 아니라 읽기 흐름 안에서 시작해 `내 모음 > 질문`으로 이어지는 보조 기능이다.

## Q-002 — Storage keys

- 질문 배열: `photoRoadmapQuestionsV2`
- device link: `photoRoadmapDeviceKeyV1`

최대 local history는 현재 약 100개 기준.

## Q-003 — Text selection detection

base `script-5.js`는 본문에서 selection을 읽고 `#askBubble`을 표시한다.

MUST:
- 빈 selection 무시.
- UI control/text input 선택은 질문 context로 오인하지 않음.
- selection text를 bubble click보다 먼저 internal state/`#askQuote`에 반영.

## Q-004 — Context bubble

`#askBubble` label/역할:
- 선택 문장 근처에 나타남.
- `GPT에 질문` 진입점.

현재 canonical capture handler는 `script-29.js`가 window capture 단계에서 intercept하여 legacy drawer 대신 collection question flow로 연결한다.

## Q-005 — Selection handoff

bubble click 시 현재 canonical 흐름:

1. bubble 숨김.
2. selection text는 이미 state/quote에 저장됨.
3. browser selection highlight release.
4. `window.__photoPendingQuestionWrite=true`.
5. collection이 닫혀 있으면 FAB click.
6. 약간의 render delay 후 question primary tab click.
7. `__photoForceQuestionWrite()` 반복 호출로 write mode 확정.
8. pending flag는 v40 owner가 안정화 후 해제.

이 retry는 누적 render layer와의 compatibility 장치다. 재구축 시 동일 사용자 결과만 유지하면 된다.

## Q-006 — Primary destination

selection bubble은 반드시:

`내 모음 > 질문 > 질문 작성하기`

로 연결된다.

`내 모음 > 전체` 또는 legacy floating question drawer에 머물면 회귀다.

## Q-007 — Secondary question selector

V1 label:
- `질문 작성하기`
- `저장한 질문`

`질문 작성` 같은 옛 label로 되돌리지 않는다.

## Q-008 — Saved count

`저장한 질문` label 옆 badge는 `photoRoadmapQuestionsV2`의 현재 길이와 동기화한다.

질문 추가/삭제 후 즉시 갱신.

## Q-009 — Composer parking

기준 코드는 `#askWritePanel`을 collection body rerender에서 보호하기 위해 hidden parking node에 보관했다가 write mode에서 body로 mount한다.

관련:
- `#v40QuestionParking`
- `#v41QuestionParking`

두 세대 parking이 존재하는 것은 KNOWN DEBT. 사용자 기능은 **composer DOM state가 tab rerender 때문에 유실되지 않음**이 핵심이다.

## Q-010 — Composer quote

`#askQuote` / `.ask-sheet__quote`:

- 선택된 문장을 보여줌.
- minimum height 약 56px.
- width 100%.
- centered/comfortable vertical alignment.
- selection이 없을 때 placeholder `문장을 선택하면 여기에 표시됩니다.` 계열.

quote가 화면 너비를 넘거나 한쪽으로 치우치면 회귀.

## Q-011 — Question textarea

`#askInput`:

- 사용자가 실제 질문 작성.
- mobile font 16px 계열로 iOS zoom 방지.
- min-height 약 132px.
- max-height 약 240px.
- line-height 약 1.55.

selection quote를 textarea에 자동으로 덮어써 질문 수정이 불가능하게 만들지 않는다.

## Q-012 — Base question actions

composer action family:
- 질문 복사
- 질문 저장
- ChatGPT 열기

visible fourth install CTA는 현재 숨긴다. App Store/Play 직접 설치 버튼을 별도 primary action으로 추가하지 않는다.

## Q-013 — Copy

copy는 질문 context를 클립보드에 넣는다. Clipboard API 실패 시 legacy textarea copy fallback 허용.

## Q-014 — Prompt construction

ChatGPT handoff prompt:

selection이 있으면 의미적으로 아래 구조:

- 선택 문장을 바탕으로 답변 요청
- 선택 문장
- 사용자의 질문

selection이 없으면 질문만 전달 가능.

정확한 문구는 개선 가능하지만 선택 문장과 질문의 의미적 구분은 유지한다.

## Q-015 — ChatGPT open

`#askOpenChatGPT`:

- 새 `https://chatgpt.com/` 창/탭 open.
- prompt copy 시도.
- note에 복사 성공/팝업 차단 여부 안내.
- OpenAI icon/favicon 계열 표시.

V1은 ChatGPT API 자동 답변을 앱 내부에서 생성하는 구조가 아니다.

## Q-016 — Save local

질문 save record의 핵심 필드:

- id
- selected_text / selection / quote
- question / prompt
- created_at
- updated_at 가능

save 시 localStorage 먼저 지속 가능.

## Q-017 — Save remote

`deviceId`가 있고 `window.apiRpc` 가능하면 Google Sheet `QUESTION_HISTORY`에 저장을 시도한다.

remote 실패가 local save 전체를 막으면 안 된다.

## Q-018 — Remote contract

RPC actions:
- `getQuestionHistory`
- `saveQuestionHistory`
- `deleteQuestionHistory`

limits:
- selected text 최대 약 5000자
- question 최대 약 3000자
- history max 약 100

## Q-019 — Saved list mode

`저장한 질문` 선택 시 composer를 parking하고 collection의 question list를 복원한다.

current V40 layer는 legacy `.v32-question-hub`를 strip하고 saved child nodes만 유지하는 compatibility 처리를 한다.

## Q-020 — Write mode

`질문 작성하기` 선택 시:

- collection body를 composer 하나로 교체 가능.
- bulk selection mode 제거.
- select toggle 숨김.
- bulkbar 숨김.

composer 아래 기존 saved cards가 같이 남으면 회귀.

## Q-021 — forceQuestionWrite

context handoff처럼 race-sensitive한 경우 current owner는 write mode를 즉시 + 40/120/280/420ms 시점에 재확인한다.

이 retry 자체를 V1 UX로 간주하지는 않는다. 결과가 deterministic해야 한다는 것이 명세다.

## Q-022 — Open saved question

saved question 클릭:

- write mode로 전환.
- saved selected text를 quote에 로드.
- saved question text를 textarea에 로드.
- input/change event dispatch.
- collection body top으로 scroll.

legacy question history drawer를 별도 중복 표시하지 않는다.

## Q-023 — Delete saved question

질문 삭제 시:

- local array에서 삭제.
- device ID가 있으면 remote delete 시도.
- saved count 갱신.
- collection list rerender.

## Q-024 — Device continuity

질문은 video/article와 달리 remote history sync 대상이다.

현재 device-key 기반 연결 UI는 legacy question settings를 재활용한다. V1 기능 요구는:
- 연결 코드를 통해 다른 기기에서 질문 history를 이어볼 수 있음.

구체적인 legacy drawer choreography는 재구축 필수 조건이 아니다.

## Q-025 — Legacy selector suppression

`.v32-question-hub > .v32-question-segment`는 current V40 selector가 존재하는 상태에서 보이면 안 된다.

단, current `.v40-question-segment` 자체가 `v32-question-segment` visual class를 함께 갖는 것은 허용된다.

## Q-026 — Current structure canonicalizer

`script-29.js` 책임:

- duplicate `#v40QuestionControls` 제거.
- legacy segment 숨김.
- write label normal화.
- one indicator/one skin 보장.
- geometry/motion은 쓰지 않음.

이 ownership boundary를 유지한다.

## Q-027 — Selection state survival

bubble click 직후 browser selection highlight를 지워도 selected quote 데이터는 유지돼야 한다.

`removeAllRanges()` 전에 selection text를 읽으려는 방식으로 바꾸면 race가 생길 수 있다.

## Q-028 — Search coexistence

question primary tab에서도 collection search는 유지된다. secondary selector를 넣는다고 search를 숨기지 않는다.

## Q-029 — Bulk coexistence

saved question list에서는 bulk select 가능. write mode에서는 bulk action을 노출하지 않는다.

## Q-030 — Accessibility

- buttons는 `type=button`.
- tablist 역할 가능.
- action label 명확.
- count badge는 decorative layout을 깨지 않음.
- textarea 사용 가능.

## REG-Q-001 — 회귀 정의

다음은 실패:

- 본문 selection bubble이 legacy drawer만 열음.
- 선택 문장이 write mode 도착 전에 사라짐.
- question tab에서 secondary selector 2개가 보임.
- `질문 작성하기` label이 다시 `질문 작성`으로 바뀜.
- saved count 불일치.
- write mode인데 saved cards가 함께 남음.
- 저장 질문 open이 composer 값을 채우지 못함.
- ChatGPT 버튼이 질문을 copy하지 않음.
- question delete 후 remote/local state 중 하나만 남고 UI count가 갱신되지 않음.
