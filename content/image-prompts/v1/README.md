# Photo-eBook Image Prompt Library V1

이 폴더는 현재 Photo-eBook 본문 전체 맥락을 기준으로 확정한 이미지 생성 라이브러리다.

## 목적

- 기존의 `product / profile / food / studio` 같은 소수 공용 이미지 반복 사용을 없앤다.
- 각 이미지 슬롯을 해당 챕터, 카드, 교육 문장과 1:1로 연결한다.
- 생성 전 단계에서 출력 경로를 고정한다.
- 실제 이미지 생성은 이 라이브러리의 `slot_id` 순서와 규칙을 따른다.
- 향후 사진 이외의 산업으로 플랫폼이 확장되어도 상위 이미지 규칙은 재사용하고 산업별 규칙만 추가한다.

## 파일

- `00-global-rules.md` — 모든 산업에 공통 적용되는 상위 이미지 생성 규칙
- `01-photo-industry-rules.md` — 사진/상업사진 분야 전용 규칙
- `10-core-market.md` — 메인 히어로, 10개 챕터 히어로, 시장 3개 카드
- `20-skills-portfolio-gear.md` — 실무 8개, 포트폴리오 4개, 장비 제품 카드
- `30-iphone.md` — 아이폰 8개 레슨, 상황별 프리셋 7개
- `90-dynamic-fallbacks.md` — 외부 OG/YouTube 이미지 보존 규칙과 fallback
- `manifest.json` — slot id, 최종 WebP 경로, 생성 방식, ready 상태

## 소스 클래스

- `generate` — 본문 맥락을 기준으로 새 이미지 생성
- `reference_required` — 특정 실제 제품처럼 정확성이 중요해 참조 이미지가 있어야 처리 가능
- `preserve_external` — 외부 글 OG 이미지/YouTube 썸네일처럼 원문 식별 정보이므로 생성 이미지로 대체 금지
- `fallback_generate` — 외부 이미지가 없거나 실패했을 때만 쓰는 생성 fallback

## 현재 1차 생성 대상

고정 생성/정규화 슬롯은 메인 히어로, 10개 챕터 히어로, 시장 3개, 실무 8개, 포트폴리오 4개, 장비 3개, 아이폰 레슨 8개, 아이폰 프리셋 7개다.

동적 외부 썸네일은 생성 대상에서 제외한다.

## 코드 연결

런타임 경로는 `public/assets/image-slots-v1.js`가 소유한다. 이미지가 아직 생성되지 않은 슬롯은 `ready:false`라 기존 이미지로 fallback한다. 2차 생성 작업에서 지정된 WebP 파일을 실제 경로에 저장한 뒤 해당 슬롯만 `ready:true`로 바꾼다.
