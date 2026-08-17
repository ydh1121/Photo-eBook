# Photo-eBook Repository Agent Rules

이 저장소에서 이미지 생성/교체 작업을 수행하는 AI 작업자는 아래 문서를 **필수 선행 규칙**으로 읽는다.

1. `docs/spec-v1/17-image-generation-system.md`
2. `content/image-prompts/v1/00-global-rules.md`
3. `content/image-prompts/v1/01-photo-industry-rules.md`
4. `content/image-prompts/v1/02-generation-operation-rules.md`
5. `docs/spec-v1/18-image-generation-commit-automation.md`

## 이미지 작업 기본 트랜잭션

사용자가 이미지 생성/교체를 요청하고 반영을 금지하지 않았다면 다음을 자동 수행한다.

`본문/slot 확인 → 생성 → QA → WebP → Drive mirror → Git binary → ready:true → Prompt Queue applied → 배포 검증`

사용자가 단계별로 다시 지시하게 만들지 않는다.

## 생성 단계의 강제 분리

이미지 generation 직전 입력에는 Git, Drive, Cloudflare, commit, deploy, ready/applied, 진행상태, 대시보드 같은 운영 문맥을 넣지 않는다. 해당 slot의 시각 장면만 전달한다.

## 배치

한 번의 사용자 지시로 4~8개 slot을 처리할 수 있다. 결과는 반드시 slot별 독립 이미지 파일이어야 한다. collage/dashboard/contact sheet/web mockup은 production 실패다.

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
