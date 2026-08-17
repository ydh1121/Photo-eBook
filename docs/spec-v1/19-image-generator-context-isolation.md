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

## SPEC-IMGCTX-003 — 현재 대화에서 context contamination이 확인된 경우

동일 대화에서 아래 실패가 2회 이상 연속 발생하면 text prompt를 계속 고쳐서 재시도하지 않는다.

- 단일 실사 사진 요청 → 웹사이트 전체 화면
- 단일 제품 사진 요청 → 카드형 대시보드
- 기존 실사 편집 요청 → 랜딩페이지 mockup
- 여러 독립 이미지 요청 → 한 장짜리 contact sheet/infographic

이 상태를 `generator_context_poisoned`로 판정한다.

## SPEC-IMGCTX-004 — poisoned context recovery

`generator_context_poisoned` 상태에서는 다음 절차를 따른다.

1. 현재 실패 이미지를 전부 QA 폐기한다.
2. 이미 정상 생성된 asset은 보존한다.
3. prompt library, manifest, slot id, 적용상태는 Git을 source of truth로 유지한다.
4. generation은 **운영 대화와 분리된 fresh image context**에서 재개한다.
5. fresh context에는 대상 slot의 시각 prompt와 필요한 style/industry rules만 전달한다.
6. Git/Drive/Cloudflare/진행상태 설명은 generation이 끝난 뒤 다시 기존 작업 흐름에서 처리한다.
7. 사용자가 slot별로 다시 설명할 필요는 없다. Git prompt library를 읽어 자동 재개한다.

## SPEC-IMGCTX-005 — fresh image context의 입력 최소화

각 generation 입력은 다음 구조를 권장한다.

```
PURPOSE: 무엇을 설명하는 이미지인가
SUBJECT: 주 피사체
ACTION/STATE: 무엇을 하고 있는가
ENVIRONMENT: 어디인가
STYLE: realistic commercial/editorial photography
FRAMING/LIGHT: 필요한 경우만
CONSTRAINTS: no text, no UI, no collage 등
```

긴 사업 설명이나 구현 이력을 generation prompt에 그대로 복사하지 않는다.

## SPEC-IMGCTX-006 — 한국인 기본값

Photo-eBook fresh image context에서는 인물 포함 slot에 다음 기본 제약을 함께 전달한다.

`All people are natural-looking Korean adults unless the slot explicitly requires another nationality or region.`

외국인이 나온 결과는 해당 slot QA 실패다.

## SPEC-IMGCTX-007 — 배치 운용

사용자 경험상 한 번의 지시로 여러 이미지를 처리한다.

- 권장 배치: 4~8 slots
- 각 output: 독립 파일
- 성공 output: 즉시 고유 slot 파일명으로 보존
- 실패 output: 해당 slot만 재생성
- 정상 output 전체 재생성 금지

## SPEC-IMGCTX-008 — 현재 프로젝트에서 확인된 poisoned-context 증거

실제 작업 중 다음이 발생했다.

1. `portfolio-product-brand` 단일 제품사진 지시가 Photo-eBook 랜딩페이지로 생성됨.
2. `skill-portrait-retouch` 인물 변경 지시가 사이트 전체 UI로 생성됨.
3. 여러 독립 이미지 생성 지시가 이미지 적용 현황 dashboard로 생성됨.
4. `Git/Drive/Cloudflare`가 직전 대화에 존재할 때 생성 이미지 안에도 해당 운영 메타가 등장함.
5. 기존 정상 실사 6장은 prompt 자체로는 적합했으므로 품질 문제보다 generation context 문제가 핵심임이 확인됨.

이 실패 이력은 향후 회귀 테스트 항목으로 유지한다.

## SPEC-IMGCTX-009 — 완료 파이프라인

fresh image context에서 generation이 끝난 후 기존 작업 흐름으로 돌아와 다음을 자동 수행한다.

`QA → WebP → Drive mirror → verified Git binary import → runtime/manifest ready:true → Prompt Queue applied → deployment validation`

Generation context isolation은 자동 반영 파이프라인을 중단시키는 것이 아니라 **생성 단계만 운영 메타데이터에서 격리**하는 규칙이다.
