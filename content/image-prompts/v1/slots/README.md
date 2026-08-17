# V1 Image Slot Pipeline

This directory is the authoritative per-image generation entrypoint.

## Core rule

One image slot equals one prompt file, one isolated generation transaction, and one isolated QA decision. Do not concatenate multiple slot prompts into a shared generation document or ask the image model to produce a batch of unrelated scenes from one context.

## New-slot pipeline

1. Read only the target slot prompt plus the global image rules required for that slot.
2. Generate exactly one high-resolution PNG for the target slot.
3. QA that PNG in isolation. A failed slot must not change any other slot.
4. Upload the approved PNG to the Google Drive PNG source folder before conversion.
5. Convert PNG to WebP deterministically with `scripts/image/png-to-webp.py`; do not use generative image editing for format conversion.
6. Upload the verified WebP to the Google Drive WebP mirror folder.
7. Commit that WebP to the reserved final repository path.
8. Verify the Git file is a real RIFF/WEBP asset and record its SHA-256.
9. Only after those checks set the manifest/runtime slot to `ready:true`.
10. Verify the production asset URL after deployment before marking deployment verified.

## Failure isolation

- Generation or QA failure belongs to one slot only.
- Do not retry unrelated slots because one slot failed.
- Do not reuse a contaminated generation context after repeated scene/mode failures; start an isolated fresh generation context for that slot.
- Never write HTML, JSON, logs, or base64 transfer text to an image path.

## Storage model

- Google Drive PNG folder: approved high-resolution source PNGs for all newly generated slots.
- Google Drive WebP folder: deterministic delivery-format mirrors.
- Git: final WebP delivery assets plus prompt/status metadata; raw PNG generation masters stay out of Git unless a separate repository rule explicitly requires them.

## Legacy exception

The six pre-policy b005 assets already passed visual QA and have exact verified WebP bytes plus Drive WebP mirrors. They may be migrated without regenerating missing PNG originals. Their status must state `legacy_source:true`, `predates-policy`, and `regenerate:false`. This exception does not apply to newly generated slots.

## Prohibited normal workflow

Tar/base64 staging, orphan Git blobs, multi-image generation batches, and one-off recovery importers are migration/recovery mechanisms only. They must not be used as the normal image-production pipeline.
