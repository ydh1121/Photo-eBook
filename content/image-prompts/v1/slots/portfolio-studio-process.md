# portfolio-studio-process

source: `20-skills-portfolio-gear.md` / `IMG-026`
output: `public/assets/images/generated/v1/portfolio/studio-process.webp`
master: 3:2
status_model: one-slot-one-file

## Context
소규모 상업 촬영자가 실제로 반복 운영할 수 있는 제품 촬영 프로세스를 보여주는 비하인드컷. 과도한 장비 과시가 아니라 촬영·테더링·백업까지 연결된 현실적인 작업 흐름을 보여줘야 한다.

## Prompt
Realistic behind-the-scenes photograph of a clean small-studio product photography workflow: a small product table, mirrorless camera on a stable tripod, one or two plausibly positioned softboxes or reflectors, a tethered laptop showing the current frame with only generic non-readable capture shapes, an external SSD or clear backup device, and optionally one client or assistant at the side. Tidy but believable cables, safe stand placement, neutral professional workspace, practical repeatable setup for a solo or very small commercial photography business. Composition should clearly connect product, camera, laptop, and backup workflow.

## Avoid
Huge production crew, unsafe light stands, readable capture-software UI, excessive or luxury gear, smoke or cinematic haze, impossible cable routing, floating equipment, branded logos, unrelated studio scenes.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
