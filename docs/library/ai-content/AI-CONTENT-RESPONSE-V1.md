# AI Content Response V1

이 문서는 `platform-ai-content-request/v1`을 읽은 AI가 Editor에 다시 전달할 결과 형식과 안전한 적용 규칙을 정의한다.

목표는 AI가 페이지 전체 JSON을 덮어쓰지 않고, 기존 block id와 type을 기준으로 허용된 내용만 수정하게 만드는 것이다.

## 1. Response shape

```json
{
  "schema": "platform-ai-content-response/v1",
  "pageId": "page_...",
  "generatedAt": "2026-08-20T00:00:00+09:00",
  "pageReview": {
    "summary": "",
    "issues": [],
    "researchNotes": []
  },
  "blockChanges": [
    {
      "blockId": "hero_...",
      "type": "hero",
      "content": {},
      "evidence": [],
      "factState": "needs_verification",
      "note": ""
    }
  ]
}
```

`pageReview`만 있고 `blockChanges`가 없어도 유효하다. 검수만 수행한 결과를 표현할 수 있어야 한다.

## 2. 절대 변경하지 않는 것

AI response importer는 다음을 바꾸지 않는다.

- page id
- block id
- block type
- block 순서
- block enabled 상태
- block variant
- 사용자가 배치한 block의 존재 여부
- Registry approval status
- page publish status

AI가 구조 변경이 필요하다고 판단하면 `pageReview.issues` 또는 block `note`에 제안으로 남긴다.

## 3. Block policy 적용

block의 `aiPolicy.mode`가 가장 먼저 적용된다.

### `locked`

content, evidence, factState를 모두 변경하지 않는다.

### `fact_check_only`

content를 변경하지 않는다. AI 결과의 `note`와 pageReview만 검토 정보로 보존한다. 자동 content 적용은 없다.

### `wording_only`

기존 자료 구조를 유지한 채 문자열 표현만 바꿀 수 있다.

- 숫자 변경 금지
- boolean 변경 금지
- 배열 길이 변경 금지
- object key 추가/삭제 금지
- 문자열이 아닌 값 변경 금지
- field override가 `locked`면 해당 문자열도 변경 금지

### `full`

같은 block 내부에서는 content 구조와 문장을 수정할 수 있다. 단, field override가 더 우선한다.

## 4. Field override

`aiPolicy.fields`의 경로는 `content.title`, `content.items.0.price` 같은 dot path를 사용한다.

허용 값:
- `full`
- `wording_only`
- `fact_check_only`
- `locked`

더 구체적인 경로가 block mode보다 우선한다.

## 5. Evidence / factState

AI가 `verified`를 요청해도 evidence가 비어 있으면 importer는 `verified`로 올리지 않는다.

기본 규칙:
- evidence 있음 + `verified` 요청 → `verified` 허용
- evidence 없음 + `verified` 요청 → `needs_verification`
- `stale` 요청 → 그대로 반영 가능
- `not_required` → 해당 block이 사실 근거를 요구하지 않는 경우에만 관리자가 최종 판단

Evidence는 기존 사용자 content와 별도 데이터다. 하지만 block 전체가 `locked` 또는 `fact_check_only`면 importer가 자동 교체하지 않는다.

## 6. Page review

페이지 전체 검토 결과는 draft의 `aiReview`에 보존한다.

```json
{
  "summary": "",
  "issues": [
    {
      "severity": "warning",
      "blockId": "",
      "message": ""
    }
  ],
  "researchNotes": []
}
```

권장 severity:
- `info`
- `warning`
- `blocker`

`blocker`가 남아 있는 페이지를 publish 가능한 상태로 간주하지 않는다.

## 7. 적용 후 상태

AI response를 한 건이라도 적용하거나 page review를 불러오면 page `aiStatus`는 자동으로 `needs_review`가 된다.

AI importer가 `approved`로 올리지 않는다.

## 8. Editor 적용 UX

Editor Lab은 다음 흐름을 제공한다.

1. `AI 작업 JSON`으로 request export
2. ChatGPT 또는 다른 AI가 response 작성
3. `AI 결과 적용`으로 response JSON 선택
4. pageId/type/lock 검증
5. 적용 가능 변경만 반영
6. 적용/건너뜀/경고 수 표시
7. 관리자가 실제 화면 검토
8. 서버 draft 저장

## 9. 새 채팅 재개

새 대화에서 AI 작업을 재개할 때 request JSON 또는 서버의 page_id를 기준으로 작업한다. 대화 내용만으로 block 구조와 사용자 lock을 추정하지 않는다.
