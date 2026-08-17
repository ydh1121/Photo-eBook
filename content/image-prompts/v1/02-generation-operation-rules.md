# Image Generator Operation Rules V1

이 파일은 `00-global-rules.md`, `01-photo-industry-rules.md`와 함께 **모든 이미지 생성 작업에 필수 적용**한다. 본문 프롬프트의 시각 품질 규칙이 아니라, 생성기를 어떻게 운용해야 하는지를 고정한다.

## OP-IMG-001 — 생성 단계와 운영 단계를 분리

이미지 generation 직전에는 Git, Drive, Cloudflare, commit, deploy, ready 상태, prompt queue, 진행률, 보고서, 대시보드 같은 프로젝트 운영 문맥을 generation 입력에서 제거한다.

생성 입력은 오직 다음만 포함한다.

1. 이미지 목적
2. 주 피사체
3. 행동/상태
4. 장소/환경
5. 시각 스타일
6. 필요한 구도/조명/crop
7. 명시적 금지 요소

생성 완료 이후에만 WebP 변환, Git, Drive, ready/applied, 배포 검증을 수행한다.

## OP-IMG-002 — 짧고 직접적인 생성 프롬프트

실제 generation 입력은 장문의 프로젝트 설명이 아니라 **1~3개의 명확한 핵심 문장 + 짧은 제약문**을 기본으로 한다.

슬롯의 상세 prompt library는 분석·검수 기준으로 유지하되, 생성기에 넣는 마지막 입력은 핵심 장면만 압축한다.

예:

`A realistic commercial photograph of a Korean CEO in a contemporary Seoul office, chest-up, soft directional light, natural skin texture, neutral background. Business-useful portrait for website and press release. No text, no logo, no stock-photo pose.`

## OP-IMG-003 — 메타 문맥 오염 금지

다음 단어/개념은 **이미지 자체가 해당 주제가 아닌 한 generation 직전 입력에 넣지 않는다.**

- Git / GitHub
- Google Drive
- Cloudflare
- commit / deploy / deployment
- applied / ready / status
- prompt queue / manifest / slot id
- progress / 완료 보고 / 작업 현황
- dashboard / admin / workflow report
- website mockup / landing page

이 정보는 생성 후 파이프라인에서만 사용한다.

## OP-IMG-004 — 한 슬롯은 한 독립 최종 이미지

각 slot은 반드시 하나의 독립 이미지 파일을 가진다.

금지:
- 한 캔버스에 여러 slot을 배치
- contact sheet
- collage
- mood board
- dashboard
- infographic
- progress report
- presentation slide
- website screenshot/mockup

사용자가 별도 검수판을 요청한 경우에도 검수판은 production slot asset으로 사용하지 않는다.

## OP-IMG-005 — 배치 생성 방식

사용자는 한 번만 배치 진행을 지시한다. 작업자는 4~8개 slot을 자동으로 처리한다.

배치의 결과는 **여러 개의 독립 파일**이어야 한다.

현재 ChatGPT Images 운용에서 한 번의 multi-image generation이 각각 독립 파일을 반환하는 것이 확인된 경우에만 `n > 1`을 사용한다. 결과가 한 캔버스의 collage/dashboard로 합쳐진 전력이 있으면 같은 입력 방식으로 재시도하지 않는다.

배치 중 특정 slot이 실패해도 성공한 slot은 보존하고 실패 slot만 재생성한다.

## OP-IMG-006 — 즉시 폐기 조건

다음 결과는 미학적 품질과 관계없이 즉시 폐기한다.

- 웹사이트 전체 화면
- 앱/관리자 화면
- 대시보드
- 완료 보고서
- 파일명/경로/slot id가 표시된 화면
- 생성 이미지 목록 화면
- 여러 완성 이미지를 카드로 정리한 화면
- Git/Drive/Cloudflare 상태 화면
- 이미지 생성 과정을 설명하는 메타 이미지
- 프롬프트 설명문이 들어간 이미지
- 여러 장면이 하나의 레이아웃으로 합쳐진 결과

폐기 결과는 절대 Git/Drive/ready/applied에 넣지 않는다.

## OP-IMG-007 — 실패 유형별 재시도

### A. Context bleed / dashboard 실패
1. 실패 결과 폐기.
2. 운영 문맥을 전부 제거.
3. 해당 slot의 장면만 1~3문장으로 다시 작성.
4. `single standalone photograph`, `one continuous scene`, `no text`, `no UI`, `no collage` 제약.
5. 동일 방식으로 2회 연속 실패하면 같은 text-only 방식 반복 금지.

### B. 인물 국적/환경 불일치
1. 구도·조명·행동이 맞으면 해당 slot만 재생성/편집.
2. Photo-eBook의 한국 B2B 문맥에서는 사람을 **한국인 성인**으로 명시.
3. 외국인 모델이 생성됐다고 해서 전체 배치를 폐기하지 않는다.

### C. 장비/손/케이블 왜곡
1. 해당 slot만 재생성.
2. 장비 수를 줄이고 행동을 단순화.
3. 실제 제품 식별이 필요하면 `reference_required`로 전환.

## OP-IMG-008 — 한국인 인물 기본값

Photo-eBook의 인물 포함 generated asset은 별도 이유가 없는 한 **한국인 성인**을 기본값으로 한다.

특히 다음 slot 계열은 한국인으로 고정한다.
- 기업/전문직 프로필
- 촬영 교육/실습
- 리터칭 작업자
- 고객/클라이언트 검수 장면
- 사진가/어시스턴트
- iPhone 인물 레슨
- 영업/미팅 관련 이미지

외국인이 필요한 본문 맥락이 명시된 경우에만 예외다.

## OP-IMG-009 — 성공한 결과 보존

배치 6장 중 4장이 정상이고 2장이 실패하면 정상 4장은 다시 생성하지 않는다.

재생성은 실패 slot에만 적용한다. 이미 승인된 이미지의 구도/품질을 불필요하게 바꾸지 않는다.

## OP-IMG-010 — 생성 파일 즉시 고유 이름으로 보존

생성 도구가 `/mnt/data/imagegen.png` 같은 동일 이름을 반복 사용할 수 있으므로, 각 생성 직후 slot id 기반 고유 파일명으로 복사/이동한다.

예:
- `portfolio-product-brand.png`
- `portfolio-professional-profile.png`
- `skill-portrait-retouch.png`

다음 generation call 전에 파일 충돌 여부를 확인한다.

## OP-IMG-011 — slot mapping은 이미지 밖에서 관리

slot id, prompt id, output path, 상태는 manifest/Prompt Queue에서 관리한다.

생성 이미지 안에 해당 정보가 보이게 만들지 않는다.

## OP-IMG-012 — QA 후에만 변환/반영

순서는 고정한다.

`generate → visual QA → context QA → Korean-person check → crop check → WebP → Drive mirror → Git binary → ready:true → Prompt Queue applied → deploy verification`

QA 이전에는 WebP/Git/Drive/application 상태를 변경하지 않는다.

## OP-IMG-013 — 프롬프트 작성 원칙의 근거

OpenAI의 ChatGPT 이미지 생성 가이드는 프롬프트를 과도하게 길게 만들기보다 이미지의 목적, 주 피사체, 행동, 장소, 시각 스타일과 필요한 구도/조명 같은 핵심 정보를 명확하게 전달하는 방식을 권장한다.

우리 운영에서는 이 원칙을 상세 라이브러리와 실제 generation 입력을 분리하는 방식으로 적용한다.

## OP-IMG-014 — 이번 프로젝트에서 확인된 금지 실패 이력

다음 실패는 이미 실제로 발생했으므로 회귀 금지 항목이다.

1. 여러 slot을 한 개의 웹 대시보드로 생성.
2. "이미지 N장 생성 완료" 같은 진행현황 인포그래픽 생성.
3. Git commit/Drive/Cloudflare 정보가 이미지 안에 나타남.
4. 개별 제품사진 요청이 전체 Photo-eBook 랜딩페이지로 변형됨.
5. 기존 실사 이미지 편집 요청이 사이트 전체 UI 재생성으로 변형됨.
6. `n>1` 요청을 여러 독립 파일이 아니라 한 캔버스 카드 모음으로 해석.
7. 한국 B2B 문맥의 리터칭 작업자/모델이 외국인으로 생성됨.
8. 정상 이미지가 있는데도 실패 재시도 과정에서 정상 slot까지 다시 생성하려 함.
9. 생성 단계와 Git/Drive 반영 설명을 같은 generation 문맥에 섞어 context bleed 발생.
10. 반복 생성 시 동일 임시 파일명으로 산출물 식별이 어려워짐.

이 중 하나가 재발하면 같은 생성 방식을 그대로 반복하지 말고 실패 유형에 맞는 recovery rule로 즉시 전환한다.
