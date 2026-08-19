# Mobile product-tool regression — 2026-08-20

Status: fixed in candidate renderer; live deployment recheck required.

## Report

iPhone Safari staging/public renderer preview에서 이미지가 없는 `product-tool` list 카드의 본문 폭이 매우 좁아졌다.

관찰된 영향:
- Adobe Premiere 제목/가격/설명이 단어 단위로 과도하게 줄바꿈됨
- DaVinci Resolve 카드도 동일 증상
- tag와 source metadata가 세로로 길게 늘어남

## Root cause

기본 Block Lab CSS가 list형 product card를 항상 다음 구조로 처리했다.

```css
.pb-product-list .pb-product-card {
  display: grid;
  grid-template-columns: 180px 1fr;
}

@media (max-width: 720px) {
  .pb-product-list .pb-product-card {
    grid-template-columns: 110px 1fr;
  }
}
```

이번 video-editor의 software cards는 image/media가 없지만 빈 media column 110px가 계속 예약되어 body가 두 번째 좁은 열에 갇혔다.

## Fix

Added:
- `public/assets/styles/block-lab/responsive-fixes-v1.css`

Rules:
- media가 없는 product list card → single-column full width
- product body `min-width:0`
- product title/price `word-break:keep-all`
- body/source는 Korean-readable wrapping 유지
- media가 있는 mobile list card도 fixed 110px 대신 bounded percentage + `minmax(0,1fr)` 사용

Loaded by:
- `/block-lab/`
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/editor-lab/`

## Safety

- 기존 photography production renderer/style은 변경하지 않음.
- candidate/public staging/editor preview 계층에만 적용.

## Recheck

Pages 배포 후 iPhone Safari에서 다음을 다시 확인한다.

1. Premiere card가 카드 전체 폭을 사용함
2. `월 30,800원`이 과도하게 한 글자/단어씩 끊기지 않음
3. DaVinci Resolve title/무료 버전 문구가 정상적인 문장 폭으로 표시됨
4. tags가 가능한 경우 한 행에 자연스럽게 배치됨
5. source metadata가 카드 본문 폭을 사용함
6. image가 있는 product list variant가 별도 회귀 없이 정상임
