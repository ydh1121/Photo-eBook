# Photo-eBook Image Prompt Library V1

This directory separates image content, orchestration rules, runtime mapping, and status tracking.

- `slots/` — generator payloads. One file equals one visual slot; these files contain visual description only.
- `manifest.json` — slot id, source class, production path, and ready state.
- `00-global-rules.md`, `01-photo-industry-rules.md`, `02-generation-operation-rules.md` — orchestration and QA rules; never forward them wholesale to the image generator.
- `10-core-market.md`, `20-skills-portfolio-gear.md`, `30-iphone.md`, `90-dynamic-fallbacks.md` — source libraries and design rationale.
- `drive-folders.json` — Drive storage configuration for generated masters/delivery assets.
- `generation-failure-log.md` — unresolved diagnostic history only.

The runtime mapping remains owned by `public/assets/image-slots-v1.js`. A slot becomes `ready:true` only after the final production asset is present and verified.
