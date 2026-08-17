# Photo-eBook Repository Agent Rules

## Responsibility split

Image production has two separate contexts.

- **Orchestrator**: may read repository specs, manifest, status, Drive configuration, QA history, Git state, and deployment state.
- **Image generator**: receives only the visual description from exactly one `content/image-prompts/v1/slots/<slot-id>.md` file, plus a reference image only when the slot requires one.

Never forward queue JSON, status JSON, Git/Drive/Cloudflare details, filenames, paths, QA logs, deployment instructions, global rule documents, or previous failure images into the image-generation input.

## Canonical transaction

`slot 확인 → slot prompt 1개로 PNG 생성 → QA → Drive PNG → 결정론적 WebP 변환 → Drive WebP → Git 최종 WebP → ready:true → applied → 배포 검증`

A failed slot stays isolated. Do not regenerate or roll back accepted slots.

## Slot prompt contract

Files under `content/image-prompts/v1/slots/` are generator payloads, not workflow documents.

Each slot file must contain only a short visual description of one photograph or one final visual result. Do not put these in a slot prompt:

- slot id or output path
- Git/Drive/deployment state
- pipeline steps
- QA instructions
- failure history
- progress or batch information
- long negative lists

Operational metadata belongs in `manifest.json`, `content/image-status/v1/`, and the repository specs.

## Batch behavior

One user instruction may process several slots, but each slot gets its own generation call and its own final file. Never ask the image model to represent several semantic slots on one canvas.

## People and references

For Korean-market work scenes, use natural-looking Korean adults unless the source context requires otherwise. Real identifiable products use the reference-required path and must preserve the reference accurately.

## QA gate

Reject results that are not a believable standalone photograph/final visual for the requested slot, that contain unrelated interface/report layouts, or that materially mismatch the body context. Rejected outputs never reach production WebP, Drive WebP, Git assets, `ready:true`, or `applied`.

## Binary handling

New work uses the approved PNG master and `scripts/image/png-to-webp.py`. Do not use tar/base64 staging, orphan-blob recovery, or one-off importer workflows as the normal production path.
