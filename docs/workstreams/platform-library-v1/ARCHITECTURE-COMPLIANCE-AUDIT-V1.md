# Platform Library Architecture Compliance Audit V1

Status: active audit
Scope: Block Lab → approved Library module → Block Editor instance customization → saved completed module/preset → published page → Portable Export

## Target workflow

The canonical technical workflow is:

`Block Lab candidate → user/GPT review → approved canonical module → UI Library → Block Editor instance customization → saved completed module/preset → published page → Portable Export/new project`

The Library is a catalog and live configuration surface for approved reusable runtime modules. It is not a second implementation surface.

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

## Current findings

### Compliant

- `PlatformModuleRegistry` owns approved module IDs, render/hydrate, provenance and consumer boundaries.
- Photography modules use shared Registry definitions across Library/Editor/Public.
- Library preview and Editor preview use the shared module preview host and Registry mount path rather than separate per-surface component markup.
- Public Snapshot V2 mounts `ui-module` blocks with `PlatformModuleRegistry.mount()` and applies `PlatformModuleStyleRuntime`; it does not render Library/admin iframes.
- Block Lab-promoted `horizontal-rail`, `accordion`, and `bottom-sheet` live under shared `public/assets/js/platform-modules/` owners and do not import Block Lab runtime.
- Library content/style defaults are snapshotted when a new Editor module instance is created.
- Existing exhaustive setting/interaction gates prevent visible no-op controls for the currently audited module set.

### Transitional / incomplete, not yet a contract violation if kept closed

- Portable primitives currently expose Library/Editor consumers but are intentionally not yet Public consumers. They cannot be called end-to-end portable until Public + export dependency packaging is approved and implemented.
- `Portable Export` dependency manifest/bundle generator is not implemented yet.
- The explicit `saved completed module/preset` layer is not yet implemented as a first-class data model. The Editor can save page/module instances, but reusable completed presets need a canonical registry/storage contract.
- The current Library module catalog is flat at Registry level. Hierarchical navigation is an admin organization concern and must remain separate from module ownership.

### Violations / technical debt to remove

- The generic `bottom-sheet` visual shell was independently restyled to resemble the Photography collection sheet instead of consuming an extracted shared bottom-popup shell owner. This creates duplicated visual ownership. Replace it with shared shell/control primitives used by both modules while preserving the Photography appearance.
- `screen-mode-selector` currently owns a new standalone visual implementation instead of consuming an extracted canonical segmented-control/theme-mode owner. Replace its skin with a shared platform segmented-control owner derived from the finished Photography control.
- The Library top horizontal module selector does not scale to dozens of modules. It is not an ownership violation, but it is an information architecture dead end and should be replaced by a Registry-driven hierarchical tree integrated into the admin sidebar.
- The `horizontal-rail` scroller clips part of card shadow paint at the bottom because the scrolling track owns insufficient vertical paint runway. The fix belongs in the canonical rail CSS, not the Library preview.
- The device-handoff preview still receives legacy screen-mode UI from Photography runtime during hydration. Screen mode must be removed from the device-handoff module composition and remain a separate module.

## Required next implementation

1. Extract shared bottom-popup shell/control styling and make `collection-bottom-sheet` + `bottom-sheet` consume it without changing the Photography public appearance.
2. Extract shared segmented-control/theme-mode styling and make `screen-mode-selector` consume that owner.
3. Replace Library top module chips with a Registry-driven hierarchical tree mounted inside the admin sidebar; move the real Registry selector buttons instead of cloning them.
4. Add desktop sidebar collapse button + drag resize/collapse behavior and a reopen affordance. Keep a responsive drawer path for narrow admin screens.
5. Fix canonical horizontal-rail vertical shadow runway.
6. Remove legacy screen-mode composition from device-handoff preview.
7. Add architecture CI that fails if approved Library modules import Block Lab runtime, if Library-only component implementation appears in module preview code, or if Editor/Public module IDs drift from Registry contracts.
8. Define `saved completed module/preset` schema after the Library architecture stabilizes.
