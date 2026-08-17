# skill-delivery-process

source: `20-skills-portfolio-gear.md` / `IMG-022`
output: `public/assets/images/generated/v1/skills/delivery-process.webp`
master: 3:2
status_model: one-slot-one-file

## Context
촬영 후 셀렉·수정·백업·최종납품까지 정리되는 사진가의 운영 장면을 보여준다. 데이터 안전과 질서 있는 고객 인계가 핵심이며, 단순 편집 작업 화면이 아니다.

## Prompt
Show a Korean commercial photographer at the end of a job organizing final image delivery. A laptop shows a clean non-readable gallery or file-grid preview; two separate storage devices clearly imply backup, camera memory cards sit in a small protective case, and a phone nearby suggests client communication. The composition communicates orderly handoff, revision control, and data safety. Clean practical desk, neutral light, realistic freelancer workspace, one coherent scene.

## Avoid
Readable folder names, cloud-service logos, piles of USB sticks, chaotic desk, handshake, delivery-truck metaphor, dashboard or flowchart UI, multiple disconnected scenes.

## Pipeline
1. Generate ONE high-resolution PNG for this slot only.
2. QA this slot in isolation.
3. Upload the approved PNG to the Drive PNG folder.
4. Convert deterministically with `scripts/image/png-to-webp.py`.
5. Upload the converted WebP to the Drive WebP folder.
6. Commit the WebP to the reserved repo path above.
7. Only then set `ready:true` and verify the production asset URL.
