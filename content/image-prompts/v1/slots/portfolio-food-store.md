# portfolio-food-store

source: `20-skills-portfolio-gear.md` / `IMG-025`
output: `public/assets/images/generated/v1/portfolio/food-store.webp`
master: 3:2
status_model: one-slot-one-file

## Context
실제 소규모 카페·식당 포트폴리오에서 바로 쓸 수 있는 대표 음식 촬영 사례. 메뉴, 배달 썸네일, 매장 소개, 세로형 소셜 콘텐츠까지 확장 가능한 현실적인 상업 사진이어야 한다.

## Prompt
Commercial restaurant hero photograph of a signature Korean café or restaurant dish near a soft side window, natural appetizing food texture, controlled highlights on the plate, minimal practical props, a restrained hint of the real venue in the background, composed to support delivery thumbnail, printed or digital menu, website hero, and vertical social crops. Realistic small-business production quality, clean but attainable styling, believable natural light plus subtle fill, accurate food color and texture, no fake typography.

## Avoid
Oversaturation, fake steam, excessive prop clutter, readable fake menu text, luxury fine-dining fantasy, greasy artificial gloss, impossible garnish, distorted tableware, unrelated people or scenes.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
