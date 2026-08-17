# Image Generation Failure Log

## Current poisoned-context state

The current long-running chat accumulated multiple generated website/dashboard/contact-sheet images. Subsequent attempts to create single standalone photographs repeatedly returned Photo-eBook UI/dashboard compositions even when the immediate instruction explicitly prohibited UI, text, collage, and dashboard output.

This state is classified as `generator_context_poisoned` under `docs/spec-v1/19-image-generator-context-isolation.md`.

## Confirmed failures

1. Single product photo request -> full Photo-eBook landing page.
2. Portrait retouch edit request -> full site UI instead of localized edit.
3. Multi-image independent output request -> one dashboard/contact sheet.
4. Operational words such as Git/Drive/Cloudflare appeared inside generated images.
5. Korean B2B retouching scenes generated foreign subjects.
6. Repeating the same generation method after context bleed reproduced the same failure.
7. Valid previously generated images risked being regenerated unnecessarily during retries.
8. Repeated tool outputs reused generic temporary filenames, making asset identity ambiguous.

## Recovery state

Preserved good outputs:
- portfolio-product-brand
- portfolio-professional-profile
- portfolio-studio-process

Rejected / regenerate in fresh image context:
- portfolio-food-store
- skill-portrait-retouch
- skill-product-retouch

The rejected items must be regenerated from the existing prompt library. Users must not be asked to restate the slot descriptions.
