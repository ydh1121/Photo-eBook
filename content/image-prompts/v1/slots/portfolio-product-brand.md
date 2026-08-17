# portfolio-product-brand

source: `20-skills-portfolio-gear.md` / IMG-023
output: `/assets/images/generated/v1/portfolio/product-brand.webp`
master: `3:2`
status_model: `one-slot-one-file`

## Context
가상 향수/뷰티 브랜드. 누끼 3 + 연출 4 + 상세페이지 2 + SNS 4:5. 반사/색상/질감/활용성이 핵심.

## Prompt
Create a polished but realistic beauty-brand product photograph using a small perfume or skincare package on a white-to-warm-beige seamless set. Controlled rectangular softbox reflections, accurate material texture, clean contact shadow, and one restrained styling element. The image should look like the hero output of a practical portfolio case that could also produce cutouts, detail-page crops, and 4:5 social assets. Premium but achievable small-brand commercial quality.

## Avoid
readable fake labels, luxury fantasy set, excessive flowers, floating product, impossible glass reflections, surreal shadows.

## Pipeline
1. Generate one high-resolution PNG for this slot only.
2. QA the PNG in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically to WebP with `scripts/image/png-to-webp.py`.
5. Upload the WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path.
7. Only then set this slot `ready:true` and verify production.