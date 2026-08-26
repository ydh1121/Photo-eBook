# Platform Library Architecture Compliance Audit V1

Status: active audit
Scope: Block Lab → approved canonical module → UI Library → Block Editor customization → saved module/preset → Completed Page → Public/Portable Export

## Target workflow

The canonical technical workflow is:

`Block Lab candidate → user/GPT review → approved canonical module → UI Library → Block Editor instance customization → saved completed module/preset → Completed Page registry → published page → Portable Export/new project`

Existing finished pages may be used only as bootstrap extraction references. They are not permanent Library upstreams.

Photography-specific rule:

`Photography legacy page → one-time canonical extraction/parity QA → Photography Completed Page migration → managed from Block Editor completed-page list`

After extraction, `source: public-extracted` means historical provenance only. Library source of truth is `PlatformModuleRegistry`.

## Compliance rules

1. Approved modules must be registered in `PlatformModuleRegistry` with a stable module ID.
2. Library and Editor must consume the same Registry `render()`/`hydrate()` owner.
3. Published pages must mount the same module ID directly through the Registry, never through Library/Editor preview HTML.
4. Block Lab code/data/style cannot be imported directly by Library/Editor/Public after promotion.
5. Library framing/navigation/settings UI may differ, but component visual/interaction implementation cannot live in Library-only code.
6. Visible Library controls must change canonical props/style/state or be disabled/removed.
7. Module grouping/navigation in the Library is metadata/UI organization only; it must re-use Registry entries rather than clone module implementations.
8. Editor customization must snapshot module content/style/state into the instance. Later Library default changes must not mutate existing instances.
9. A saved completed module/preset must reference `moduleId + version + content/style/state snapshot`; it must not store copied rendered HTML/CSS.
10. Portable Export must collect the Registry definition owner files and transitive dependencies for only the modules actually used.
11. No finished page may remain a permanent Library source/upstream after canonical extraction.
12. Photography must ultimately exist as a Completed Page entry that can be opened, edited, duplicated and published from the Editor management flow.

## Current findings

### Compliant

- `PlatformModuleRegistry` owns approved module IDs, render/hydrate, provenance and consumer boundaries.
- Photography-derived modules use shared Registry definitions across Library/Editor/Public. Their `public-extracted` metadata is historical provenance, not a live source contract.
- Library preview and Editor preview use the shared module preview host and Registry mount path rather than separate per-surface component markup.
- Public Snapshot V2 mounts `ui-module` blocks with `PlatformModuleRegistry.mount()` and applies `PlatformModuleStyleRuntime`; it does not render Library/admin iframes.
- Block Lab-promoted `horizontal-rail`, `accordion`, and `bottom-sheet` live under shared `public/assets/js/platform-modules/` owners and do not import Block Lab runtime.
- Library content/style defaults are snapshotted when a new Editor module instance is created.
- Existing exhaustive setting/interaction gates prevent visible no-op controls for the currently audited module set.

### Transitional / incomplete

- Photography still exists as the legacy live composition used for migration/parity QA. It has not yet been registered as a first-class Completed Page in the Editor management layer.
- Completed-page registry/list/edit/duplicate data model is not implemented yet.
- Portable primitives currently expose Library/Editor consumers but are intentionally not yet Public consumers.
- `Portable Export` dependency manifest/bundle generator is not implemented yet.
- The explicit reusable saved module/preset layer is not yet implemented as a first-class data model.
- Shared module-preview still preloads a broad Photography runtime set; it should become dependency-driven by `ownerFiles`.

### Remediation implemented on current branch, pending CI/live verification

- Generic `bottom-sheet` now consumes a shared bottom-popup shell owner instead of keeping its own Photography-lookalike shell skin.
- `screen-mode-selector` now composes the canonical `filter-chip-rail` module rather than owning a second segmented-control implementation.
- Library top horizontal module catalog is replaced by a Registry-driven hierarchical tree integrated into the admin sidebar.
- Sidebar supports collapse/reopen and drag resize/collapse behavior, with a narrow-screen drawer path.
- `horizontal-rail` gets canonical vertical paint runway so card shadows are not clipped by the scroller.
- Device-handoff preview isolation removes unrelated screen-mode page-context UI.
- Architecture QA is being updated to verify Registry tree reuse, shared composition, rail paint and Library↔Editor module parity.

## Required next implementation

1. Run focused architecture Chromium QA and all existing module regression workflows for this branch.
2. Merge only if the Registry-driven tree, shared popup owner, canonical screen-mode composition, rail paint and Editor module parity are green.
3. Complete the PC/mobile × light/dark visual matrix and exhaustive content/state/style control audit.
4. Implement Completed Page registry/list/edit/duplicate data model.
5. Migrate Photography into that registry as the first Completed Page without making Photography a Library upstream.
6. Remove remaining bootstrap-only Photography coupling from shared preview/dependency loading once migration is proven.
7. Implement saved module/preset schema and dependency-aware Portable Export.
