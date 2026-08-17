# Image Generation Failure Log

This file records only unresolved or diagnostically useful failures. It is never forwarded to the image generator.

## 2026-08-18 — skill-space-correction

Status: `qa_failed`

- Repeated attempts returned a meta-layout instead of the requested standalone photographic work scene.
- A recovery edit using an existing production image as a visual anchor also failed the same QA gate.
- All failed outputs were discarded.
- No failed PNG/WebP was mirrored to production storage.
- Manifest/runtime remain `ready:false` for this slot.
- Remaining queued slots remain independent and may proceed normally.

Recovery: regenerate `skill-space-correction` using only `slots/skill-space-correction.md` as the text generation payload. Do not carry this failure report or repository/deployment context into that generation call.
