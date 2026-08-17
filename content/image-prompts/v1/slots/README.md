# Image Slot Prompts

This directory is the image generator boundary.

Each slot file contains only the visual description for one image. The image generator should receive the contents of one target file and nothing from queue/status/Drive/Git/deployment documents.

Do not add workflow steps, output paths, status fields, failure reports, or long prohibition lists to slot files. Those belong elsewhere in the repository.

Generation is one slot per call. Approved PNG masters are handled afterward by the orchestrator: QA → Drive PNG → deterministic WebP conversion → Drive WebP → Git asset → activation → deployment verification.
