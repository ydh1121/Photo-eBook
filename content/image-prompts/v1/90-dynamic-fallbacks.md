# 90. Dynamic External Images / Fallbacks

## DYN-IMG-001 — 외부 글 OG 이미지

- 대상: `.curated-card__visual img`
- source class: `preserve_external`
- 현재 의미: 브런치/티스토리 등 외부 글의 실제 `thumbnail_url / og:image`는 해당 원문을 식별하는 정보다.
- 규칙: 유효한 원문 대표 이미지가 있으면 생성 이미지로 교체하지 않는다.

### fallback slot — `fallback-curated-article`

- 사용 조건: 외부 글에 유효한 대표 이미지가 없거나 이미지가 실패한 경우만.
- 출력: `/assets/images/generated/v1/fallback/curated-article.webp`
- 비율/마스터: 16:9 / 1200×675 이상

Prompt:
> Create a neutral editorial photography reference image suitable as a fallback for an external photography article. Use a clean daylight desk with a camera, a small printed contact sheet, and a notebook, with no readable text or brand logo. The image should clearly belong to photography but should not imply a specific genre, article claim, author, or publication. Calm neutral color, simple composition, useful at small card size.

Avoid:
> dominant human face, specific camera brand, readable article text, fake browser screenshot, strong genre-specific styling.

---

## DYN-IMG-002 — YouTube/관련 영상 썸네일

- 대상: `.skill-video-card__visual img`
- source class: `preserve_external`
- 현재 의미: 실제 영상 썸네일은 해당 영상의 식별 정보다.
- 규칙: 유효한 영상 thumbnail이 있으면 생성 이미지로 교체하지 않는다.

### fallback slot — `fallback-video-general`

- 사용 조건: 영상 thumbnail이 비어 있거나 로딩에 실패한 경우만.
- 출력: `/assets/images/generated/v1/fallback/video-general.webp`
- 비율/마스터: 16:9 / 1200×675 이상

Prompt:
> Create a neutral commercial-photography workstation image for use only when a real tutorial video thumbnail is unavailable. Show a camera, monitor with a generic non-readable photo preview, and the edge of a softbox or reflector in the background. The composition must remain topic-neutral enough to stand in for general commercial photography practice. No text, no platform branding, restrained realistic lighting.

Avoid:
> fake YouTube UI, large play button baked into image, readable tutorial title, specific software logo, specific tutorial topic that could misrepresent the video.

---

## DYN-IMG-003 — 제품 카드

Sony A7 III, Tamron 28-75 G2, Sony FE 85mm F1.8은 동적 외부 이미지와 성격이 다르지만 사실 정확도가 필요한 `reference_required`다.

2차 작업에서 처리 우선순위:

1. 기존 사실 기반 제품 사진 확인
2. 출처/사용 가능성 확인
3. 참조 기반 정규화 또는 단순 WebP 변환
4. 제품 형상이 바뀌는 자유 생성은 하지 않음

---

## DYN-IMG-004 — 생성 fallback의 위계

fallback은 정상 이미지보다 먼저 보이면 안 된다.

- valid external image → external image
- invalid/missing external image + ready fallback → generated fallback WebP
- generated fallback도 준비 전 → 기존 코드의 안정적인 legacy fallback

fallback 이미지를 실제 글/영상의 내용처럼 보이게 만들지 않는다.
