# portfolio-professional-profile

source: `20-skills-portfolio-gear.md` / IMG-024
output: `/assets/images/generated/v1/portfolio/professional-profile.webp`
master: `3:2`
status_model: `one-slot-one-file`

## Context
대표/CEO 프로필. 홈페이지 2 + 보도자료 2 + SNS 2 + 가로 인터뷰. 자연스러운 피부톤, 신뢰감, 일관된 조명이 핵심.

## Prompt
Create a professional CEO or founder portrait in a contemporary Korean office. Natural confident expression, chest-up framing, soft directional key light, neutral background with subtle workplace context, realistic skin texture, and conservative color. The result should work for website, press release, social profile, and horizontal interview crops. Make it business-useful and repeatable, not fashion-oriented.

## Avoid
luxury executive cliché, dramatic colored lights, plastic retouching, crossed-arm stock pose, fake company logos, celebrity styling.

## Pipeline
1. Generate one high-resolution PNG for this slot only.
2. QA the PNG in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically to WebP with `scripts/image/png-to-webp.py`.
5. Upload the WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path.
7. Only then set this slot `ready:true` and verify production.