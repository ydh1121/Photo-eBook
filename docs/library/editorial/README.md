# Platform Editorial Library

이 폴더는 `먹고살기` 플랫폼 전체에서 사람이 직접 쓰는 문장과 AI가 생성·수정하는 문장의 공통 기준을 정의한다.

기존 photography 전용 계약인 `docs/spec-v1/20-korean-copywriting-skill.md`를 폐기하지 않는다. 이 라이브러리는 그보다 상위의 산업 독립 기준이며, photography pack은 필요할 때 기존 20번 명세의 분야 특수 규칙을 추가로 적용한다.

## 목적

관리자가 산업 분야와 UI 블록, 기본 방향을 정하면 AI가 다음을 스스로 판단할 수 있어야 한다.

- 이 블록에서 사용자가 무엇을 이해하거나 결정해야 하는지
- 제목과 설명을 어떤 길이와 구조로 쓸지
- 수치와 출처를 어떤 방식으로 표시할지
- 사용자가 직접 쓴 문장 중 무엇을 보호할지
- 어떤 표현이 AI식이거나 추상적인지
- 발행 전 어떤 사실 검증과 문장 검수를 거쳐야 하는지

## Authority

문장 작성·수정의 우선순위:

1. 사용자가 현재 작업에서 직접 확정한 문장과 지시
2. 사용자가 제공한 실제 before/after 사례
3. 이 `docs/library/editorial/`의 플랫폼 공통 규칙
4. 해당 industry/content pack의 분야별 에디토리얼 규칙
5. `COPY_GUIDE`와 `docs/spec-v1/20-korean-copywriting-skill.md`
6. `docs/library/references/editorial-writing/`의 외부 보조 레퍼런스

외부 humanizer나 style guide가 사용자 확정 문장을 자동으로 덮어쓰지 않는다.

## 구성

- `01-voice-principles.md` — 플랫폼 기본 문체와 금지 패턴
- `02-block-copy-profiles.md` — UI Block type별 제목/본문/수치/CTA 작성 규칙
- `03-ai-writing-and-review.md` — AI 초안, 수정, 사실 잠금, 검수, 발행 전 계약
- `04-before-after-examples.md` — 프로젝트에서 실제 확정된 수정 사례

## 공통 작성 원칙

- 한 문장에는 가능한 한 하나의 핵심 행동이나 판단을 둔다.
- 주어와 동작의 관계가 바로 보여야 한다.
- 사용자가 무엇을 결정하거나 무엇을 하면 되는지 먼저 이해되게 쓴다.
- 추상적인 브랜드 문구보다 가격, 시간, 행동, 결과물, 기준을 쓴다.
- 자연스러운 기존 문장은 다시 쓰지 않는다.
- 수치, 날짜, 가격, 모델명, 기관명, 법·제도 조건, 직접 인용은 문체 수정 과정에서 임의 변경하지 않는다.
- 새 용어는 사전식 정의보다 현재 화면에서 어떤 기능을 하는지 먼저 설명한다.
- 모바일에서 읽었을 때 의미 단위가 무너지지 않도록 제목과 긴 문장의 호흡을 검토한다.

## Block Editor 연결 원칙

향후 Block Registry의 각 block type은 최소 하나의 `editorialProfile`을 가진다.

예:

```js
{
  type: 'comparison',
  editorialProfile: 'comparison'
}
```

AI는 해당 profile을 먼저 읽고 블록 내용을 작성한다. 전체 페이지용 공통 프롬프트 하나로 모든 블록을 같은 문체와 정보 구조로 만들지 않는다.

## 운영 원본

현재 photography 데이터 기반 카피의 live 원본은 Google Sheet `COPY_GUIDE` 및 각 콘텐츠 시트다. 새 프로젝트 공통 규칙이 실제 데이터 문구 변경을 요구하면 `COPY_GUIDE`를 먼저 갱신한 뒤 Git 라이브러리와 runtime을 맞춘다.

이 라이브러리는 제품과 함께 계속 유지되는 영구 규칙이며 workstream 완료 후에도 Git에 남긴다.
