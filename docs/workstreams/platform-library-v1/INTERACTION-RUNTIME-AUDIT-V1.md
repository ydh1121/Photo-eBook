# Platform Library Interaction Runtime Audit V1

Status: active

This audit is separate from the visible-setting audit. A setting is not considered functionally complete merely because a DOM attribute or computed style changes.

The browser gate must exercise real user flows on canonical module owners:

- Library theme/viewport persistence across module switching.
- Filter menu add, immediate label edit, reorder, delete, reset and long-menu overflow.
- Filter selection state continuity across style-family switches.
- A selected overflow filter chip must become fully visible inside its native horizontal rail.
- Horizontal card rail must respond to real desktop mouse drag in Library PC preview, even when the admin frame is physically narrower than the public desktop breakpoint.
- Bottom sheet must close/reopen, change tabs/filters/search, close by handle drag and bridge preview state back to Library state.
- Device-handoff accordion must expand/collapse through its real owner and surface invalid-code validation through the real status node.

Ambiguous action semantics are not invented by this audit. A standalone action module that needs a target/dependency contract must be handled by the Portable Export/page-composition contract rather than a preview-only fake action.

Evidence owner: `scripts/check-library-interaction-runtime-v1.mjs`.
