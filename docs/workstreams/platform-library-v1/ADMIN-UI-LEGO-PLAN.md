# Admin UI Lego Builder Plan

Updated: 2026-08-24 KST
Scope: management UI only. Public production publishing remains the final task after user approval.

## Immediate parity fixes

1. Filter chip
   - production photo-page interaction is the reference owner.
   - separate global chip design tokens from per-instance overrides.
   - the rail is a background track; active/inactive chips render above it.
   - do not invent a second motion model in the admin preview.
   - each inserted chip can choose `inherit / Material / iOS Flat / iOS Liquid` while global sync remains the default.

2. Bottom sheet
   - keep the real `#collectionLayer` hierarchy used by the photo page.
   - entering the component starts from canonical `전체` state.
   - tab changes use the real `.collection-tab` click path.
   - preview state is transient; it is not a saved design setting.

3. Page canvas and advertisements
   - provide a wide-canvas mode that hides the left management sidebar temporarily.
   - PC side ads use stable outer gutters derived from the common content width, not the currently visible chapter.
   - hero/chapter hero presence must not toggle side-ad visibility.
   - side-ad containers remain stable while scrolling to avoid layout/visibility churn.

## Lego builder model

The page builder should have three layers, similar to Imweb-style assembly but with stricter ownership.

### A. Page tree

A page is a vertical ordered list of module instances.

`Page -> Section -> Module instance -> Content/Settings`

Examples:
- Hero
- Chapter navigation
- Text section
- Horizontal card rail
- Image gallery
- CTA
- Inline ad
- FAQ
- Collection launcher

Every module instance has a stable id. Drag/drop changes only the ordered page tree, not the module implementation.

### B. Module library

The left/add panel becomes a searchable module library rather than a long technical registry.

Each card shows:
- preview thumbnail
- module name
- short purpose
- responsive support
- whether it is reusable/global

Insertion methods:
- click `+`
- drag into an insertion line between modules
- duplicate an existing module

### C. Inspector

Selecting a module opens one inspector with three tabs:
- `내용`: text, image, links, items
- `디자인`: spacing, color, radius, typography, chip/card family
- `동작`: sticky, scrolling, animation, visibility, interaction

No separate UI screen should be required for ordinary per-instance editing.

## Global vs individual settings

Every reusable design setting follows inheritance:

`Platform default -> Global component preset -> Page/module instance override`

Example for filter chips:
- global default: iOS Liquid
- chip A: inherit
- chip B: Material override
- chip C: inherit

The inspector must always show whether a value is inherited or overridden and provide `공통값으로 되돌리기`.

## Canvas usability

- PC / tablet / mobile viewport switch
- zoom 50/75/100%
- management sidebar collapse
- outline mode for module boundaries
- insert-line drop targets between modules
- direct click to select module
- keyboard delete/duplicate where safe
- undo/redo history
- sticky top bar with Save / Preview / QA

Ads use dedicated outer lanes in PC preview so they do not compete with the left management sidebar or content modules.

## State model

Separate four data classes:

1. content data
2. module instance configuration
3. global design presets
4. transient preview state

Tab selections such as `전체 / 영상 / 읽을거리` are transient preview state unless explicitly designated as a default setting. This prevents the current problem where a previous preview state becomes the next component's initial state.

## Approval and publishing boundary

During management development:
- all edits are draft/admin-only.
- public `photo-ebook.pages.dev` runtime does not consume unapproved configs.

Final task after user approval:
- create approved preset snapshot.
- publish only approved snapshot to production renderer.
- verify public PC/mobile/theme regression.

## Recommended implementation order

Phase 1 — parity/stability
- filter chip motion/rail ownership
- bottom sheet real hierarchy and canonical state
- wide canvas and stable side-ad gutters

Phase 2 — module assembly UX
- page tree schema
- insertion lines
- module library
- drag/drop/duplicate/delete
- single inspector

Phase 3 — inheritance
- global preset -> instance override
- per-chip/per-card family override
- reset-to-global indicators

Phase 4 — revision safety
- undo/redo
- draft snapshots
- QA diff
- approval state

Phase 5 — final public connection
- approved snapshot publishing only after explicit user final approval
