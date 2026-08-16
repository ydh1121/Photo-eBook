# 17. V1 이미지 생성 시스템

이 문서는 Photo-eBook의 고정 이미지 자산을 본문 맥락과 1:1로 연결하고, 향후 다른 산업으로 확장 가능한 생성 규칙과 배포 절차를 고정한다.

## IMG-SYS-001 — 본문 맥락이 이미지보다 먼저다

이미지 생성은 `public/data/site-data-1.js` ~ `site-data-8.js`의 실제 본문과 최종 renderer를 먼저 읽은 뒤 진행한다.

카테고리명만 보고 이미지를 생성하지 않는다. 각 슬롯의 챕터 제목, 섹션 설명, 본문, 강조문장, 카드 목적, 실제 crop을 함께 해석한다.

상세 prompt source of truth:
- `content/image-prompts/v1/00-global-rules.md`
- `content/image-prompts/v1/01-photo-industry-rules.md`
- `content/image-prompts/v1/10-core-market.md`
- `content/image-prompts/v1/20-skills-portfolio-gear.md`
- `content/image-prompts/v1/30-iphone.md`
- `content/image-prompts/v1/90-dynamic-fallbacks.md`
- `content/image-prompts/v1/manifest.json`

## IMG-SYS-002 — 상위/산업 규칙 분리

`00-global-rules.md`는 산업 독립 규칙이다. 플랫폼이 다른 산업으로 확장되어도 유지한다.

사진 분야 특수 규칙은 `01-photo-industry-rules.md`에만 둔다. 새로운 산업은 별도 `industry-<name>-rules` 계층을 추가한다.

## IMG-SYS-003 — V1 슬롯 수

현재 고정 contextual 슬롯은 44개다.

- 메인 hero: 1
- chapter hero: 10
- market cards: 3
- skills: 8
- portfolio cases: 4
- exact gear product cards: 3
- iPhone lessons: 8
- iPhone presets: 7

별도 fallback 생성 슬롯:
- curated article fallback
- video fallback

외부 원문 식별 자산:
- curated OG thumbnail
- YouTube thumbnail

외부 원문 식별 자산은 생성 이미지로 대체하지 않는다.

## IMG-SYS-004 — source class

모든 슬롯은 다음 중 하나다.

- `generate`: 본문 맥락 기반 신규 생성
- `reference_required`: 실제 제품/대상 정확성을 보존하기 위해 신뢰 가능한 참조가 필요
- `preserve_external`: 원문 OG/영상 thumbnail 등 실제 외부 자산 보존
- `fallback_generate`: 외부 자산 실패 시에만 사용

## IMG-SYS-005 — 제품 사실성

Sony A7 III, Tamron 28-75mm F2.8 G2, Sony FE 85mm F1.8 제품 카드는 자유 생성하지 않는다.

신뢰 가능한 현재 제품 이미지를 기준으로 WebP 정규화하거나 참조 기반 편집만 허용한다. 모델 형상, 버튼, 마운트, 렌즈 구조, 표기를 임의 생성하지 않는다.

## IMG-SYS-006 — WebP가 production format

생성 도구의 원본 형식과 무관하게 최종 웹 배포 파일은 기본적으로 WebP다.

목표:
- hero: long edge 1600px 이상, 약 280KB 이하
- normal card: long edge 1200px 이상, 약 160KB 이하
- lesson visual: long edge 1400px 이상, 약 200KB 이하
- exact product card: square 1000px 이상, 약 140KB 이하
- quality는 보통 80~86 범위에서 육안 검수 후 결정
- 불필요 metadata 제거

## IMG-SYS-007 — 경로는 생성 전에 예약한다

출력 경로는 `content/image-prompts/v1/manifest.json`과 `public/assets/image-slots-v1.js`가 정의한다.

생성자가 임의 파일명을 만들거나 코드에서 개별 URL을 하드코딩하지 않는다.

최상위 경로:
`/assets/images/generated/v1/`

## IMG-SYS-008 — ready gate

`public/assets/image-slots-v1.js`의 generated/reference/fallback 슬롯은 실제 파일이 존재하고 QA가 완료되기 전 `ready:false`다.

`ready:false` 상태에서는 production의 기존 이미지가 그대로 사용되어야 한다.

다음 모두 충족 후 해당 슬롯만 `ready:true`로 바꾼다.

1. 지정 경로에 WebP 존재
2. 본문 맥락 일치
3. 실제 CSS crop 검수
4. 기술적 오류 없음
5. 다른 슬롯과 의미/장면 중복 없음
6. 파일 용량 검수

## IMG-SYS-009 — semantic binder

`public/assets/image-slot-binder-v1.js`는 현재 renderer를 다시 설계하지 않고 이미 렌더된 DOM의 semantic title/section을 기준으로 슬롯을 연결한다.

이 binder는 이미지 생성 로직을 가지지 않는다.

금지:
- Safari/Liquid/질문 기능과 결합
- ready=false 이미지를 강제 로드
- renderer 전체를 이미지 교체 때문에 복제

## IMG-SYS-010 — 생성 순서

2차 생성 작업은 기본적으로 아래 순서다.

1. hero/main + chapter heroes
2. market
3. skills
4. portfolio
5. iPhone lessons
6. iPhone presets
7. exact product normalization
8. dynamic fallbacks

각 이미지 생성 직후:
- WebP 변환/최적화
- 지정 Git path 저장
- Google Drive `Generated WebP`에 동일 파일 저장
- actual UI crop 검수
- 해당 slot `ready:true`

## IMG-SYS-011 — Google Drive mirror

Google Drive의 `Photo-eBook Image Pipeline V1`은 생성/검수 운영 공간이다.

- Rules 문서: 생성 규칙 검수
- Prompt Library Sheet: slot별 본문 맥락, prompt, 경로, 상태 관리
- Generated WebP 폴더: 실제 생성 결과 mirror

Git이 runtime/source-of-truth이며, Drive는 생성 작업과 검수 상태를 가시화하는 mirror다.

## IMG-SYS-012 — 동적 외부 이미지

외부 글의 OG 이미지와 YouTube thumbnail은 해당 원문/영상의 식별 정보이므로 valid하면 그대로 사용한다.

생성 fallback은 원문 이미지를 가장하지 않으며, 실패/누락 상황에서만 사용한다.

## IMG-SYS-013 — 중복 사용 금지

같은 `product` 이미지 하나를 시장, 리터칭, 포트폴리오, iPhone 제품 교육에 반복 쓰는 현재 legacy 방식은 V1 신규 이미지 생성에서 폐기한다.

같은 주제라도 역할에 따라 별도 장면을 생성한다.

예:
- 시장 제품: 고객이 쓸 커머스 결과물
- 제품 리터칭: 후반작업 화면
- 포트폴리오 제품: 완성 프로젝트 hero
- iPhone 제품: 창문+반사판 초보 세팅

## IMG-SYS-014 — 회귀 방지

이미지 작업만 하는 경우 다음은 변경 금지다.

- Liquid Glass geometry/motion
- Safari compact prime
- collection sheet/FAB
- question workflow
- theme color contracts
- unrelated typography/layout

이미지 binder와 slot manifest 이외의 기능 코드 수정이 필요해질 경우 먼저 이유를 명세에 기록한다.
