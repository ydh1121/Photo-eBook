# Platform Library V1 Handoff

Updated: 2026-08-26 KST
Active implementation branch: `fix/library-runtime-audit-portability-v1`
Production branch: `main`
Status: `exhaustive Library setting audit + filter runtime repair + portability roadmap`

## Resume order

1. `AGENTS.md` — especially `Private business context boundary` and `Reusable UI module contract`
2. `docs/library/platform-modules/CANONICAL-MODULE-PIPELINE.md`
3. `docs/workstreams/platform-library-v1/TASKS.md`
4. `docs/workstreams/platform-library-v1/SETTING-RUNTIME-AUDIT-V1.md`
5. this file
6. compare active branch against production `main`

If a task needs business intent or strategic prioritization, and Google Drive access is available, search Drive for the exact document title recorded in `AGENTS.md`. Do not copy that private document into Git.

## Production baseline before current branch

`main` at branch start: `147ad83f6916b762eaf0579569d7f52c3d5d336c` (PR #33 merge/status).

The previous production baseline was green:
- `Platform Library Checks`: green
- `Platform Live Deploy Check`: run #30 green
- Photography/Public ↔ Library top-nav canonical owner/BREEZE/native-pan parity: green

Do not regress the established `Library → Editor → Public` canonical owner contract.

## Current branch findings

Source-level audit compared every exposed Library control from the capability manifest/module extension against:
- `PlatformModuleStyleRuntime`
- canonical owner CSS
- `desktop/rail-drag.js`
- actual module render/hydrate sources

Confirmed:
- iOS Liquid, iOS Flat and Material are real source DOM families inside the one canonical `filter-chip-rail`; they are not Library-only simulations.
- Library style changes already travel through `saveStyleKey()` → `platform-module-style` → preview `applyStyle()` → canonical style runtime.
- one definite no-op existed: `filter-chip-rail.gap` and `runway` set CSS variables but default iOS Liquid did not consume them.
- long iOS Liquid menus lacked a strong shared overflow contract and could paint/size outside the intended rail.

Full source audit is recorded in `SETTING-RUNTIME-AUDIT-V1.md`.

## Current branch changes already made

### Library family label

`public/assets/js/ui-dashboard/library-control-polish-v1.js`
- Library selector now shows the current style family for top nav/filter.
- examples: `상단 메뉴 · iOS 리퀴드`, `범용 필터칩 · iOS 플랫`.
- selector label updates when the family control changes.
- Material display label is `Material 3 Expressive` while the persisted family ID remains `material-flat` for compatibility.

### Filter canonical runtime / overflow

`public/assets/styles/platform-modules/filter-chip-rail-v1.css`
- iOS Liquid now consumes the shared gap/runway controls.
- all three families use single-row native horizontal overflow when menu width exceeds the rail.
- filter source/module geometry uses `min-width:0`/width containment to avoid text painting beyond the rail.
- Material family was redesigned from outlined pills + accent dot to a tonal/shape/motion treatment while preserving the canonical family ID and interaction owner.

### Restart/privacy/portability rules

`AGENTS.md`
- private strategic/business context is Drive-only.
- Git must not contain the private body/Drive ID/URL.
- reusable module path expanded to `Library → Editor → Public → Portable Export`.
- exhaustive visible-setting audits must test every editable control, not representative samples.

`TASKS.md`
- records SEO/GEO → completed-page registry → exact-runtime duplicate/edit → dependency-aware export → portable new-project smoke-test sequence.
- records Photography ↔ Block Lab pending advanced variants from the existing parity classification.

## Photography ↔ Block Lab status

Photography patterns have been classified in `docs/library/blocks/photography/PARITY-V1.md`, but full runnable parity is not complete.

Still pending as actual Block Lab candidate variants:
- `hero / immersive-metrics`
- `chapter-hero / image-overlay`
- `comparison-cards / visual-metrics`
- `roadmap / metric-cards`

Several other Photography patterns are classified as improvements/style presets for existing generic variants rather than new variants.

## SEO/GEO status

`docs/library/publishing/PUBLISH-SEO-GEO-V1.md` already defines the base publish contract: canonical URL, page SEO metadata, draft/published snapshots, robots/sitemap intent and publish validation.

The missing next layer is product wiring: page metadata editing/storage, hierarchy/sitemap management, completed-page registry, duplication and export preservation.

## Exact next action

1. Create `scripts/check-library-setting-runtime-exhaustive-v1.mjs`.
2. For every editable setting, apply a non-default value and assert a measurable canonical DOM/computed-style/interaction effect; for every locked setting assert disabled.
3. Add long-menu filter overflow and family-selector label/runtime-switch checks.
4. Wire the exhaustive script into `Platform Library Checks` and make the branch green.
5. Bump only admin/module-preview cache markers needed for the changed shared assets.
6. Open PR, verify CI, merge when green.
7. After this runtime audit is complete, begin actual SEO/GEO page-metadata wiring before completed-page duplication/export work.

Do not treat the source audit alone as completed QA. Browser proof is the merge gate.