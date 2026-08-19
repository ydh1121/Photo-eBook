# AI Content Contract V1

이 문서는 관리자가 산업 페이지의 주제와 기본 Block 배치를 만든 뒤 AI가 세부 내용을 작성하거나 검수할 때 지켜야 하는 공통 계약이다.

특정 AI 업체나 API에 종속되지 않는다. ChatGPT 대화에서 직접 작업하든, 향후 관리자 화면에 AI API를 연결하든 같은 page/block data를 사용한다.

## 1. 기본 흐름

```text
산업 분야 생성
  ↓
page brief 작성
  ↓
관리자가 block 배치
  ↓
AI가 현재 배치와 block 목적을 읽음
  ↓
허용된 block/field만 초안 또는 수정
  ↓
사실·수치·출처 검토
  ↓
사용자 검토
  ↓
needs_review → approved
```

AI가 HTML/CSS를 새로 만들어 기존 Block Library를 우회하지 않는다.

## 2. Page brief

권장 shape:

```json
{
  "topic": "",
  "audience": "",
  "goal": "",
  "context": "",
  "mustCover": [],
  "avoid": [],
  "toneNotes": "",
  "researchPolicy": "current_sources_required",
  "sourcePreferences": [],
  "factSensitivity": "normal"
}
```

### `topic`
페이지가 다루는 구체적인 직업/사업/산업 주제.

### `audience`
누구를 위한 페이지인지. 경험 수준과 상황을 함께 적는 것을 권장한다.

### `goal`
페이지를 읽은 뒤 사용자가 할 수 있어야 하는 판단이나 행동.

### `context`
다른 필드로 표현하기 어려운 사업 구조, 지역, 운영 조건 등.

### `mustCover`
페이지에 반드시 포함해야 하는 내용.

### `avoid`
다루지 않을 내용, 금지 표현, 범위 밖 주제.

### `toneNotes`
해당 산업에서만 필요한 문체 보정. 플랫폼 공통 Editorial Library보다 우선하지 않는다.

### `researchPolicy`
권장 값:
- `no_external_research`
- `stable_sources_only`
- `current_sources_required`

가격, 제도, 법률, 제품 사양, 시장 통계처럼 바뀌는 내용은 `current_sources_required`를 기본으로 한다.

### `factSensitivity`
- `normal`
- `high`

의료, 법률, 금융, 규제 등은 `high`를 사용한다.

## 3. Page AI status

`PLATFORM_PAGES.ai_status`:

- `not_requested`
- `brief_ready`
- `drafting`
- `needs_review`
- `approved`

AI가 일부 문장을 작성했다는 이유만으로 `approved`로 변경하지 않는다.

## 4. Block AI policy

기본 shape:

```json
{
  "mode": "full",
  "factState": "needs_verification",
  "fields": {}
}
```

### mode
- `full` — block 목적 안에서 구조와 문장 수정 가능
- `wording_only` — 사실/구조는 유지하고 표현만 수정
- `fact_check_only` — 내용 변경 없이 검토 의견만 제공
- `locked` — AI 수정 금지

### field override

```json
{
  "mode": "full",
  "fields": {
    "content.title": "wording_only",
    "content.founderNote": "locked",
    "content.items.0.price": "locked"
  }
}
```

더 구체적인 field rule이 block mode보다 우선한다.

## 5. Fact state

- `not_required`
- `needs_verification`
- `verified`
- `stale`

다음은 기본적으로 검증 대상이다.
- 금액과 가격
- 지원금/세금/법률/규제
- 기간과 처리 시간
- 시장 규모와 통계
- 제품 사양
- 플랫폼 수수료
- 특정 업체/기관의 현재 정책

`verified`에는 근거가 있어야 한다. 시간에 따라 변하는 사실은 확인일을 같이 관리한다.

## 6. Evidence

Block의 중요한 주장과 출처를 field 단위로 연결한다.

```json
[
  {
    "id": "source_01",
    "title": "",
    "publisher": "",
    "url": "",
    "publishedAt": null,
    "checkedAt": null,
    "supports": ["content.items.0.price"]
  }
]
```

검색 결과 링크를 많이 모으는 것이 목적이 아니다. 실제로 사용한 주장과 출처를 연결한다.

## 7. 작성 규칙

AI는 작업 전에 순서대로 읽는다.

1. 사용자가 현재 요청에서 직접 정한 조건
2. page brief
3. block type과 editorialProfile
4. block aiPolicy / field lock
5. 기존 사용자 작성 내용
6. Evidence와 최신 사실
7. Editorial Library
8. 관련 Reference profile

사용자 작성 내용을 AI 문체로 덮어쓰지 않는다.

## 8. 구조 수정 권한

AI가 할 수 있음:
- 같은 block 안에서 항목 순서 개선
- 중복 항목 정리
- 정보가 부족한 필드에 초안 제안
- 적합한 approved block으로 분리 제안

자동으로 하면 안 됨:
- 사용자가 배치한 block 삭제
- block type을 임의 변경
- candidate block을 production용으로 승인
- 사실을 추측해 빈칸 채우기
- 출처 없이 가격/정책/수치 생성

구조 변경이 필요하면 제안과 실제 변경을 구분한다.

## 9. 한국어 문장

한국어 콘텐츠는 다음을 함께 적용한다.
- `docs/library/editorial/`
- `docs/spec-v1/20-korean-copywriting-skill.md`
- 운영 Google Sheet `COPY_GUIDE`

특히:
- 한 문장에 핵심 행동 하나
- 추상 명사보다 실제 행동/결과
- AI식 도입·결론·과장 표현 억제
- 수치와 사실을 문체 수정 중 바꾸지 않음
- 한국어 의미 단위 줄바꿈

KatFishNet과 humanizer reference는 lint/분석 보조다. 탐지기를 속이기 위한 문장 변형이 목적이 아니다.

## 10. 이 ChatGPT 프로젝트에서의 사용

관리자가 Editor에서 rough layout을 서버 초안으로 저장한 뒤 사용자가 새 채팅에서 특정 `page_id`, 산업 ID, 제목을 지정하면 에이전트는:

1. `PLATFORM_PAGES`의 brief를 읽음
2. `PAGE_BLOCKS`에서 현재 배치와 내용을 읽음
3. aiPolicy와 기존 사용자 내용을 구분
4. 필요한 최신 조사를 수행
5. block content를 작성/수정
6. 근거가 필요한 내용은 evidence를 함께 기록
7. `ai_status`를 `needs_review`까지 올릴 수 있음
8. 최종 `approved`는 사용자 검토 후 처리

이 흐름 때문에 대화방이 바뀌어도 산업 페이지의 구조와 작성 조건을 다시 설명할 필요가 없다.
