# skill-portrait-retouch

source: `20-skills-portfolio-gear.md` / `IMG-015`
output: `public/assets/images/generated/v1/skills/portrait-retouch.webp`
master: 3:2
status_model: one-slot-one-file

## Context
초보 사진가가 실제 유료 인물 작업에서 익혀야 할 자연스러운 리터칭 과정을 보여주는 교육용 이미지. 결과물과 작업 행위가 한 장면 안에서 명확히 연결되어야 한다.

## Prompt
Realistic professional portrait-retouching workspace with one large natural business portrait visible on a calibrated monitor, a retoucher actively using a pen tablet and stylus for subtle dodge-and-burn, blemish cleanup, stray-hair correction, and restrained tonal work. Show realistic skin pores and texture, conservative business portrait color, generic non-readable retouching interface shapes only, neutral practical workspace, and a visually clear connection between the retoucher's hand, tablet, and portrait on screen. Commercially believable small-studio workflow rather than glamour advertising.

## Avoid
Plastic skin, split-face before-and-after gimmick, readable Photoshop or software labels, beauty-ad glamour, neon gaming setup, malformed hands or stylus grip, excessive skin smoothing, celebrity styling, floating UI elements.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
