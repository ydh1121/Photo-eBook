# Photography Parity — Collection Bottom Sheet / Filter Chips V1

상태: `extracted / not yet production-rebound`

## Bottom sheet production geometry

Owner baseline:
- `assets/styles/collection/hub.css`
- later collection repair/state CSS

Current base values:
- width: `min(100%, 760px)`
- height: `min(84dvh, 780px)`
- bottom aligned
- radius: `30px 30px 0 0`
- background: `rgba(249,250,252,.96)`
- shadow: `0 -18px 50px rgba(27,37,58,.16)`
- blur: `26px`
- saturation: `135%`
- backdrop: `rgba(18,21,28,.32)` + blur `12px`
- open transition: `transform .2s cubic-bezier(.22,.75,.2,1)`
- drag state removes transition
- handle: `48 × 5px`

Body scrolling:
- vertical native scroll
- visible scrollbar width removed
- page scroll locked while sheet open
- backdrop owns outside interaction

## Modules inside sheet

Current functional modules:
- header
- close
- bulk-selection toggle
- primary tabs
- search
- secondary filters
- saved item list
- settings
- theme selector
- device handoff accordion

Capability config may turn modules on/off, but layout owner remains one bottom-sheet component.

## Primary tabs

Base geometry before liquid controller:
- margin: `0 18px 12px`
- padding: `5px`
- gap: `5px`
- base radius: `18px`
- tab min-width: `62px`
- tab padding: `10px 11px`
- tab radius: `14px`
- font: `12px / 710`

Final selected state is owned by shared `liquid-controller.js` + `liquid-skin.css` when controller is ready.

Therefore collection primary tabs belong to the same **moving liquid segmented-control primitive** family as top-nav selection, but their page role is inside `collection-bottom-sheet`.

## Secondary collection filters

`.collection-filters`:
- horizontal native scroll
- gap: `7px`
- top margin: `9px`
- scrollbar hidden
- overscroll-x contain

`.collection-filter` base:
- padding: `7px 10px`
- pill radius: `999px`
- border: `rgba(28,40,65,.055)`
- background: `#f3f4f7`
- text: `#6f747d`
- font: `10.5px / 680`

Active:
- background: `#202226`
- text: white
- border: `#202226`

`pill-hierarchy.css` raises filter z-index above the local tool surface, but does NOT currently give secondary filters the shared moving liquid indicator.

## Filter capability conclusion

Current photography production secondary filters are closest to:
- `iOS flat / dark-selected` rather than moving liquid.

The new `filter-chip-rail` capability intentionally supports more families than current production:
- Material Flat
- iOS Flat
- iOS Liquid

This is a valid expansion, not a claim that all three already exist in photography production.

## Dashboard controls to preserve

### Sheet
- enabled
- backdrop
- backdrop blur
- handle
- tabs
- search
- filter rail
- bulk selection
- theme selector
- device handoff

### Filter rail
- family
- active/accent color
- surface opacity
- blur (liquid family only)
- response/overshoot (moving indicator family only)
- gap
- left/right runway
- scrollbar

## Important distinction

- collection primary tabs: moving liquid segmented control
- secondary filters: current flat pills
- FAQ accordion: content Block
- device-handoff accordion: specialized interaction capability

이 네 요소를 하나의 generic “pill/accordion” component로 뭉치지 않는다.
