# skill-portfolio-building

source: `20-skills-portfolio-gear.md` / `IMG-021`
output: `public/assets/images/generated/v1/skills/portfolio-building.webp`
master: 3:2
status_model: one-slot-one-file

## Context
제품·전문직 프로필·음식·공간 촬영을 무작위 예쁜 사진이 아니라 프로젝트 단위로 묶어 실제 영업용 포트폴리오를 구성하는 편집 장면을 보여준다.

## Prompt
Show a Korean photographer arranging a coherent commercial portfolio on a laptop and several printed proof cards. Product, professional portrait, food, and interior categories appear as image thumbnails with no readable text, grouped as complete projects rather than a random gallery. Include a notebook and a few selected printed outputs. Natural daylight, restrained editorial style, practical freelancer desk, clear sense of curation, sequencing, and project structure.

## Avoid
Art-gallery wall, random mood-board collage, readable project names, fashion-magazine spread, excessive decorative prints, dashboard UI, presentation board, unrelated stock images.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
