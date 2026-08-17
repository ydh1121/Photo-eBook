# skill-raw-culling

source: `20-skills-portfolio-gear.md` / `IMG-018`
output: `public/assets/images/generated/v1/skills/raw-culling.webp`
master: 3:2
status_model: one-slot-one-file

## Context
RAW 200장 안팎에서 노출·초점·표정을 빠르게 비교해 1차 셀렉하는 사진가의 실무 작업을 보여준다. 리터칭이 아니라 많은 유사 컷을 빠르게 판단하는 장면이다.

## Prompt
Show a Korean commercial photographer rapidly reviewing a dense series of similar commercial-shoot thumbnails on a large monitor, with one selected frame enlarged and many closely related frames in a contact-sheet or filmstrip layout. No readable filenames or software labels. The photographer actively uses keyboard shortcuts and a mouse, emphasizing quick decisions based on focus, exposure, and expression. Calm practical desk, realistic image series from one shoot, neutral work lighting, believable freelancer workflow.

## Avoid
Random unrelated thumbnails, readable filenames, gaming visuals, single-photo retouching scene, giant server-room setup, dashboard-style meta UI, collage poster composition.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
