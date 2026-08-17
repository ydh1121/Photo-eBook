# 19. 이미지 생성기 Context Isolation 규약

## 목적

Photo-eBook의 프롬프트 품질이 정상인데도 ChatGPT Images가 이전 대화의 웹 UI, 대시보드, 진행현황 이미지를 반복 참조해 개별 실사 asset을 잘못 생성하는 회귀를 방지한다.

이 문서는 `content/image-prompts/v1/02-generation-operation-rules.md`와 함께 적용한다.

## SPEC-IMGCTX-001 — prompt quality와 generator context를 구분

슬롯 프롬프트가 본문에 적합한지와 이미지 생성기가 현재 어떤 대화/이미지 문맥을 참조하는지는 별개의 문제다.

다음 조건이면 프롬프트를 잘못된 것으로 판단하지 않는다.

- 동일 prompt 계열에서 과거에는 정상 실사 결과가 나옴
- slot context와 결과의 주제가 전혀 다름
- 결과가 반복적으로 웹사이트, dashboard, progress report로 나옴
- 생성 직전 입력에서 해당 UI를 요구하지 않았음

이 경우 원인은 `context contamination`으로 분류한다.

## SPEC-IMGCTX-002 — generation context에 운영 대화 금지

이미지 generation context에는 다음 대화를 넣지 않는다.

- Git commit 설명
- Google Drive 동기화 설명
- Cloudflare 배포 설명
- ready/applied 상태
- QA 보고서
- 배치 진행률
- 웹페이지 UI 수정 토론
- 이전 실패 dashboard 이미지

이 정보는 이미지 생성 전후 파이프라인에서는 사용할 수 있지만 generation 의도를 구성하는 문맥으로 사용하지 않는다.

## SPEC-IMGCTX-003 — context contamination 판정

동일 generation context에서 아래 실패가 2회 이상 연속 발생하면 text prompt를 계속 고쳐서 재시도하지 않는다.

- 단일 실사 사진 요청 → 웹사이트 전체 화면
- 단일 제품 사진 요청 → 카드형 대시보드
- 기존 실사 편집 요청 → 랜딩페이지 mockup
- 여러 독립 이미지 요청 → 한 장짜리 contact sheet/infographic

이 상태를 `generator_context_poisoned`로 판정한다.

## SPEC-IMGCTX-004 — 같은 Project의 새 Chat은 fresh context가 아니다

ChatGPT Projects에서는 같은 프로젝트 안의 채팅이 프로젝트 지침·파일·다른 프로젝트 채팅의 컨텍스트를 참조할 수 있다.

따라서 `사진가 창업` 프로젝트가 이미 dashboard/website mockup 생성 이력으로 오염된 경우:

- 같은 프로젝트 안에서 `새 채팅`을 만드는 것만으로는 context reset으로 인정하지 않는다.
- 기존 오염 채팅을 새 채팅으로 복사하거나 요약해서 넘기지 않는다.
- `AGENTS.md`, failure log, Git/Drive/Cloudflare 진행상태를 generation 직전 대화에 장문으로 출력하지 않는다.
- 같은 프로젝트에서 fresh context라고 가정하고 image generation을 재개하지 않는다.

이 규칙은 실제 회귀로 검증됐다. 동일 프로젝트의 새 채팅에서도 개별 실사 요청이 다시 dashboard/progress-report 이미지로 변형됐다.

## SPEC-IMGCTX-005 — fresh image context의 정의

`generator_context_poisoned` 이후의 fresh image context는 아래 중 하나여야 한다.

### 권장: 전용 Image Factory Project

새 ChatGPT Project를 별도로 만든다.

권장 이름: `Photo-eBook Image Factory`

조건:
- 새 프로젝트 생성 시 가능하면 `project-only memory` 사용
- 기존 `사진가 창업` 프로젝트의 채팅을 이동/복사하지 않음
- 기존 dashboard/website mockup 이미지를 업로드하지 않음
- 프로젝트 지침은 이미지 생성 규칙만 최소한으로 둠
- 대상 prompt는 Git의 `content/image-prompts/v1/`에서 직접 읽음
- generation 직전에는 시각 prompt만 사용

### 대안: Project 밖의 완전히 새 대화

기존 `사진가 창업` Project 밖에서 새 대화를 사용한다. 가능하면 기억/이전 대화 참조를 최소화하는 환경을 사용한다.

중요: **같은 오염 Project 안의 새 Chat은 이 대안에 포함되지 않는다.**

## SPEC-IMGCTX-006 — Image Factory의 입력 최소화

Image Factory가 Git에서 규칙과 prompt를 읽은 후 실제 generation 직전에는 다음 구조만 사용한다.

```
PURPOSE: 무엇을 설명하는 이미지인가
SUBJECT: 주 피사체
ACTION/STATE: 무엇을 하고 있는가
ENVIRONMENT: 어디인가
STYLE: realistic commercial/editorial photography
FRAMING/LIGHT: 필요한 경우만
CONSTRAINTS: no text, no UI, no collage, no dashboard
```

긴 사업 설명이나 구현 이력, Git/Drive/Cloudflare 상태를 generation prompt에 복사하지 않는다.

## SPEC-IMGCTX-007 — 한국인 기본값

Photo-eBook Image Factory에서는 인물 포함 slot에 다음 기본 제약을 함께 전달한다.

`All people are natural-looking Korean adults unless the slot explicitly requires another nationality or region.`

외국인이 나온 결과는 해당 slot QA 실패다.

## SPEC-IMGCTX-008 — 배치 운용

사용자 경험상 한 번의 지시로 여러 이미지를 처리한다.

- 권장 배치: 4~8 slots
- 실제 생성: slot별 독립 generation call
- 각 output: 독립 파일
- 성공 output: 즉시 고유 slot 파일명으로 보존
- 실패 output: 해당 slot만 재생성
- 정상 output 전체 재생성 금지
- `n>1` 한 호출에서 collage/dashboard로 합쳐진 전력이 있으면 해당 방법 사용 금지

## SPEC-IMGCTX-009 — 생성과 운영 단계 분리

Image Factory 안에서도 generation call 직전에는 운영 메타데이터를 제거한다.

생성 완료 후에만 다음 단계로 넘어간다.

`QA → WebP → Drive mirror → verified Git binary import → runtime/manifest ready:true → Prompt Queue applied → deployment validation`

Git/Drive 작업을 Image Factory 자체에서 수행할 수 있으면 그대로 완료한다. 수행할 수 없는 환경이면 생성된 독립 파일과 slot id만 기존 운영 흐름으로 넘긴다.

## SPEC-IMGCTX-010 — 현재 프로젝트에서 확인된 poisoned-context 증거

실제 작업 중 다음이 발생했다.

1. `portfolio-product-brand` 단일 제품사진 지시가 Photo-eBook 랜딩페이지로 생성됨.
2. `skill-portrait-retouch` 인물 변경 지시가 사이트 전체 UI로 생성됨.
3. 여러 독립 이미지 생성 지시가 이미지 적용 현황 dashboard로 생성됨.
4. `Git/Drive/Cloudflare`가 직전 대화에 존재할 때 생성 이미지 안에도 해당 운영 메타가 등장함.
5. 기존 정상 실사 6장은 prompt 자체로는 적합했으므로 품질 문제보다 generation context 문제가 핵심임이 확인됨.
6. **동일 `사진가 창업` Project에서 새 Chat을 만든 뒤에도 dashboard 생성이 재현됨.**

이 실패 이력은 향후 회귀 테스트 항목으로 유지한다.

## SPEC-IMGCTX-011 — 완료 파이프라인

fresh Image Factory context에서 generation이 끝난 후 다음을 자동 수행한다.

`QA → WebP → Drive mirror → verified Git binary import → runtime/manifest ready:true → Prompt Queue applied → deployment validation`

Generation context isolation은 자동 반영 파이프라인을 중단시키는 것이 아니라 **생성 단계의 Project/Chat context만 운영 메타데이터에서 격리**하는 규칙이다.
