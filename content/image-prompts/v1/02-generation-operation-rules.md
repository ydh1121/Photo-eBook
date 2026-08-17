# Image Generation Operation Rules V1

These rules are for the orchestrator. They are not image-generator prompt text.

## 1. Generator input

For a normal generated slot, pass exactly one `slots/<slot-id>.md` visual description to the image generator. For a reference-required slot, pass that visual description plus the verified reference image.

Do not include repository state, paths, queue/status data, storage details, deployment details, QA history, or other slot prompts in the generation call.

## 2. One call = one image = one slot

This is a hard rule.

- Every image-generation tool call must contain exactly one slot.
- Every image-generation tool call must request exactly one output image (`n=1` when the tool exposes an output-count parameter).
- Never put two or more slot descriptions in the same generation call.
- Never ask one generation call to produce a batch, grid, contact sheet, collage, dashboard, comparison board, or multiple candidate images.
- To generate 10 images, make 10 separate generation calls. To generate 30 images, make 30 separate generation calls.
- Each returned image is saved and QA'd independently before moving to the next slot.

A batch may contain several slots operationally, but the batch is executed only as a sequence of independent one-slot/one-image calls. A failure affects only that slot.

## 3. Prompt shape

A slot prompt should describe one physical scene or one final photographic result in direct visual language. Prefer subject, action, environment, framing, light, and realism. Keep operational instructions outside the prompt file.

## 4. QA

After generation, verify contextual fit, realism, human/gear anatomy, crop safety, duplication against other slots, and technical quality. Rejected outputs are discarded before storage or runtime state changes.

## 5. Storage and conversion

Approved PNG masters go to the configured Drive PNG folder. Convert deterministically with `scripts/image/png-to-webp.py`, mirror the verified WebP to Drive, then commit the same WebP bytes to the reserved Git path.

## 6. Activation

Only after the production file is present and verified may the manifest/runtime slot become `ready:true`. Verify the deployed asset before marking the slot applied/deployment-verified.
