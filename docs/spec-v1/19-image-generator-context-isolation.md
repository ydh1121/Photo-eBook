# 19. Image Generator Context Isolation

## Purpose

Prevent project-management context from influencing photographic generation.

## Contract

The orchestration context and the image-generation context are separate.

The orchestrator may know the repository, queue, status, Drive folders, QA history, deployment state, and neighboring slots. The image generator must not receive those materials.

For each generated slot, the generation payload is limited to:

1. the contents of exactly one `content/image-prompts/v1/slots/<slot-id>.md` file;
2. an optional verified visual reference when the slot is `reference_required`.

No other repository document is part of the generation payload.

## Prompt requirements

A slot prompt describes one continuous physical scene or one final photographic result. It should be short enough that the desired subject and action dominate the request. Workflow metadata, file paths, status text, QA instructions, and failure narratives stay outside the prompt.

## Failure handling

If a generation returns a meta-layout or otherwise misses the requested photographic scene, discard it and retry only that slot from the same clean slot prompt. Do not append the operational failure report to the next image prompt.

After repeated context-bleed failures, use a genuinely clean generation context without copying prior operational conversation or failed outputs into it.

## Completion boundary

Generation isolation ends when an acceptable PNG exists. QA, conversion, Drive mirroring, Git writes, runtime activation, and deployment verification happen afterward in the orchestration context.
