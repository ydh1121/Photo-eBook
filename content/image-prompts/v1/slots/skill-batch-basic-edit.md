# skill-batch-basic-edit

source: `20-skills-portfolio-gear.md` / `IMG-019`
output: `public/assets/images/generated/v1/skills/batch-basic-edit.webp`
master: 3:2
status_model: one-slot-one-file

## Context
한 촬영 세트 20~30장을 화이트밸런스·노출·렌즈 보정·마스크·동기화로 일관되게 처리하는 기본 보정 workflow를 보여준다. 정밀 피부 리터칭이 아니라 반복 가능한 대량 처리와 일관성이 핵심이다.

## Prompt
Show a Korean commercial photo editor working at a monitor that displays a coherent set of 20–30 images from the same shoot with consistent color and exposure, one frame enlarged and a thumbnail filmstrip beneath. The editor is applying synchronized basic corrections across the series; interface elements remain generic and unreadable. Include keyboard, mouse, and one external SSD. Practical neutral workspace, repeatable batch-processing workflow, consistent commercial color, realistic small-studio scale.

## Avoid
Wildly different photos, readable preset names, strong LUT colors, single isolated image, fake export text, beauty-retouching close-up, dashboard or infographic presentation.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
