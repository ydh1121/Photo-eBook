# Photo-eBook Repository Agent Rules

이 저장소에서 이미지 생성/교체 작업을 수행하는 AI 작업자는 아래 문서를 **필수 선행 규칙**으로 읽는다.

1. `docs/spec-v1/17-image-generation-system.md`
2. `content/image-prompts/v1/00-global-rules.md`
3. `content/image-prompts/v1/01-photo-industry-rules.md`
4. `content/image-prompts/v1/02-generation-operation-rules.md`
5. `docs/spec-v1/18-image-generation-commit-automation.md`
6. `docs/spec-v1/19-image-generator-context-isolation.md`
7. `content/image-prompts/v1/generation-failure-log.md`

## 이미지 작업 기본 트랜잭션

사용자가 이미지 생성/교체를 요청하고 반영을 금지하지 않았다면 다음을 자동 수행한다.

`본문/slot 확인 → slot별 독립 prompt → 고화질 PNG 생성 → QA → Drive PNG 보관 → 결정론적 WebP 변환 → Drive WebP 보관 → Git 최종 WebP → ready:true → Prompt Queue applied → 배포 검증`

사용자가 단계별로 다시 지시하게 만들지 않는다.

## 생성 단계의 강제 분리

이미지 generation 직전 입력에는 Git, Drive, Cloudflare, commit, deploy, ready/applied, 진행상태, 대시보드 같은 운영 문맥을 넣지 않는다. 해당 slot의 시각 장면만 전달한다.

## Project context 오염 규칙

`generator_context_poisoned`가 확인된 ChatGPT Project에서는 **같은 Project 안의 새 Chat도 fresh context로 간주하지 않는다.**

현재 `사진가 창업` Project는 다음 회귀가 확인됐으므로 generation context로 재사용하지 않는다.

- 단일 실사 요청이 Photo-eBook 전체 웹 UI로 생성됨
- 다중 독립 이미지 요청이 dashboard/contact sheet로 생성됨
- 새 Chat을 만들어도 동일 dashboard 회귀가 반복됨

이 경우 실제 이미지 generation은 다음 중 하나에서만 재개한다.

1. 별도 신규 Project `Photo-eBook Image Factory` — 가능하면 project-only memory, 이전 Project 채팅/이미지 미이동
2. 기존 `사진가 창업` Project 밖의 완전히 새 대화

Image Factory는 Git의 prompt library와 최소 이미지 규칙만 읽고, 기존 dashboard/website mockup 이미지나 운영 대화를 generation context로 가져오지 않는다.

## 배치

한 번의 사용자 지시로 4~8개 slot을 처리할 수 있다. 결과는 반드시 slot별 독립 이미지 파일이어야 한다. collage/dashboard/contact sheet/web mockup은 production 실패다.

실제 generation은 slot별 독립 call을 연속 수행한다. 여러 slot을 한 canvas에 합치는 multi-image 요청은 금지한다.

신규 작업에서 tar/base64/blob staging/orphan blob 복구를 정상 파이프라인으로 사용하지 않는다. 한 slot의 실패는 그 slot에서만 멈추고 다른 완료 slot은 보존한다.

## Photo-eBook 인물 기본값

별도 본문 근거가 없는 한 사람은 한국인 성인으로 생성한다. 기업 프로필, 교육, 리터칭, 사진가/어시스턴트, 고객 검수, iPhone 인물 레슨은 특히 한국인으로 고정한다.

## 실패 결과

아래는 즉시 폐기하며 Git/Drive/ready/applied에 반영하지 않는다.

- dashboard / progress report / infographic / presentation
- website/app/admin mockup
- multiple assets arranged in one canvas
- filenames, slot ids, Git/Drive/Cloudflare status inside the image
- generation-process meta image
- foreign-person output where Korean-person rule applies

실패 slot만 재생성하고 정상 slot은 보존한다.

## 실패 복구

동일 generation context에서 dashboard/context-bleed가 2회 이상 연속 발생하면 같은 방식으로 prompt를 반복 수정하지 않는다.

- 해당 context를 `generator_context_poisoned`로 판정
- 정상 생성 asset 보존
- 실패 asset만 `qa_failed`
- generation을 별도 Image Factory/fresh outside-project context로 이동
- Git prompt library에서 자동 재개
- 사용자가 slot 설명을 다시 입력하게 하지 않음
