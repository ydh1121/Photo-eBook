# skill-product-retouch

source: `20-skills-portfolio-gear.md` / `IMG-016`
output: `public/assets/images/generated/v1/skills/product-retouch.webp`
master: 3:2
status_model: one-slot-one-file

## Context
소규모 제품 촬영에서 실제 납품 품질을 만드는 상품 리터칭 과정을 보여주는 교육용 이미지. 촬영 원본, 실물 참고 제품, 정교한 외곽선과 반사 정리가 하나의 현실적인 워크스테이션 장면으로 연결되어야 한다.

## Prompt
Realistic professional product-retouching workspace. A calibrated monitor shows a clean cosmetic or small consumer product on a white background with crisp believable edges, controlled reflections, accurate material texture, subtle dust cleanup, color matching, and generic non-readable path or mask shapes. The retoucher uses a pen tablet, with the real reference product beside the workstation so the relationship between physical object and edited image is obvious. Bright neutral practical workspace, commercially attainable quality for e-commerce and brand deliverables.

## Avoid
Readable software UI or labels, distorted product geometry, floating vector paths, campaign-style dramatic lighting, unrelated images, fake brand labels, impossible reflections, overly glossy CGI appearance, malformed hands.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
