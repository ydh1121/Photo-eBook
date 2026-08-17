# skill-space-correction

source: `20-skills-portfolio-gear.md` / `IMG-017`
output: `public/assets/images/generated/v1/skills/space-correction.webp`
master: 3:2
status_model: one-slot-one-file

## Context
소규모 매장·카페·클리닉 공간사진에서 수직/수평, 광각 왜곡, 혼합광, 창밖 노출을 기술적으로 바로잡는 보정 작업을 보여준다. 화려한 인테리어 광고가 아니라 실무 보정 장면이어야 한다.

## Prompt
Realistic interior-photography editing workstation with one clean Korean café or clinic interior image large on screen. Architectural verticals are visibly straight, perspective feels natural, window exposure is balanced, and mixed warm/cool lighting is corrected into a believable neutral result. Generic adjustment panels may appear but contain no readable text. Place a realistic wide-angle lens near the workstation. Practical small-business interior, restrained professional color, technical editing workflow, natural monitor and room light.

## Avoid
Wildly distorted ultra-wide perspective, HDR halos, surreal windows, readable software panels, luxury hotel fantasy, architectural-magazine spectacle, floating UI, exaggerated saturation.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
