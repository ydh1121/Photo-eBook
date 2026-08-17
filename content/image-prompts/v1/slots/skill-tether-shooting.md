# skill-tether-shooting

source: `20-skills-portfolio-gear.md` / `IMG-020`
output: `public/assets/images/generated/v1/skills/tether-shooting.webp`
master: 3:2
status_model: one-slot-one-file

## Context
카메라와 노트북을 실제 케이블로 연결해 촬영 중 결과를 즉시 확인하고 클라이언트 검수·백업으로 이어지는 테더 촬영 workflow를 보여준다.

## Prompt
Show a believable Korean small-studio tethered commercial shoot: a mirrorless camera on tripod connected by one clearly visible tether cable to a laptop beside the set, with one clean product or professional portrait being photographed. The laptop displays the current frame as a non-readable image preview; a Korean client or assistant may view from the side. One softbox, practical stands, tidy cable routing, realistic small-studio scale, clear camera-to-laptop connection, professional but achievable freelancer setup.

## Avoid
Floating or wireless-looking cable, giant film crew, impossible rigging, readable capture-software text, cluttered unsafe stands, sci-fi gear, dashboard presentation, multiple disconnected scenes.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
