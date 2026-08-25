# UI Library Setting Runtime Audit V1

Updated: 2026-08-26 KST
Scope: visible settings generated from `manifest.js` + `module-extension-v1.js` for approved `PlatformModuleRegistry` modules.

Status meanings:
- `LIVE`: editable value has a canonical runtime owner/effect in code.
- `FIXED`: a code-level no-op was found during this audit and fixed on the active branch; browser proof still required before merge.
- `LOCKED`: intentionally fixed behavior; the Library control must be disabled and is not expected to produce an editable runtime effect.
- `NOT-LIBRARY`: capability exists in legacy/manifest data but is not an approved Library module and must not appear as a standalone Library item.

This audit is source-level evidence only. Final completion requires `check-library-setting-runtime-exhaustive-v1.mjs` to change every editable control to a non-default value and measure the actual canonical DOM/computed style/interaction result.

## top-chapter-navigation

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| enabled | LIVE | `module-style-runtime-v1.js`; `.nav-shell.hidden` |
| stickyMode | LIVE | shell `position/top/transform` |
| chipFamily | LIVE | `.nav-scroll[data-module-style-family]` for non-liquid; liquid returns to canonical owner |
| accentColor | LIVE | `--module-accent` + liquid/active color variables |
| fontFamily | LIVE | actual `.nav-chip` `font-family` |
| fontSize | LIVE | actual `.nav-chip` `font-size` |
| fontWeight | LIVE | actual `.nav-chip` `font-weight` |
| letterSpacing | LIVE | actual `.nav-chip` `letter-spacing` |
| progressEnabled | LIVE | `data-module-progress-enabled`; progress visibility |
| progressMode | LIVE | `data-module-progress-mode`; chapter wash vs line |
| progressColor | LIVE | `--module-progress-color` |
| progressOpacityStart | LIVE | `--module-progress-start` gradient stop alpha |
| progressOpacityEnd | LIVE | `--module-progress-end` gradient stop alpha |
| mobileChipGap | LIVE | `.nav-scroll.style.gap` below 1024px |
| desktopChipGap | LIVE | `.nav-scroll.style.gap` at/above 1024px |
| railInset | LIVE | `.nav-scroll` padding top/bottom |
| response | LIVE | custom motion duration/easing when changed from baseline |
| overshoot | LIVE | custom motion easing when changed from baseline |
| durationScale | LIVE | custom motion duration multiplier |
| safariSafety | LOCKED | fixed safety behavior; manifest control is locked and must be disabled |

## filter-chip-rail

Runtime family proof from `photo-core-modules-v1.js`:
- `ios-liquid`, `ios-flat`, `material-flat` are three actual source DOM rails inside one canonical `filter-chip-rail` module.
- family switching hides/shows those real sources; it is not a Library-only visual label.
- all families share `hydrateGenericFilterRail()`, active ARIA/class synchronization, and `platform-filter-select` event.

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| family | LIVE | switches actual liquid / iOS Flat / Material source DOM |
| accentColor | LIVE | `--platform-filter-accent`; family active-state color |
| fontFamily | LIVE | actual visible family button `font-family` |
| fontSize | LIVE | actual visible family button `font-size` |
| fontWeight | LIVE | actual visible family button `font-weight` |
| letterSpacing | LIVE | actual visible family button `letter-spacing` |
| surfaceOpacity | LIVE | liquid/flat surface alpha or Material tonal fill alpha |
| blur | LIVE | liquid/iOS Flat backdrop blur; disabled for Material because Material runtime intentionally uses no backdrop blur |
| response | LIVE | shared transition duration |
| overshoot | LIVE | shared transition timing function |
| gap | FIXED | audit found default iOS Liquid only stored the variable without consuming it. Shared CSS now applies `--platform-filter-gap` to all three real rails |
| runway | FIXED | audit found default iOS Liquid only stored the variable without consuming it. Shared CSS now applies `--platform-filter-runway` to all three real rails |

Overflow contract after fix:
- all three families are single-row horizontal rails;
- excess menu width must increase `scrollWidth`, not page/module paint width;
- labels remain `white-space:nowrap` inside their own buttons;
- no chip text may paint outside the canonical module rail.

## horizontal-card-rail

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| nativeTouch | LOCKED | browser-native touch scroll contract; manifest control locked |
| desktopDrag | LIVE | `data-builder-desktop-drag`; consumed by `desktop/rail-drag.js` |
| leftShadowGuard | LIVE | determines left padding runway on actual rail |
| leftPaintRunway | LIVE | actual left padding and left fade width input |
| leftFade | LIVE | actual mask-image left fade |
| rightFade | LIVE | actual mask-image right fade |
| rightFadeMode | LOCKED | only `alpha-mask` supported; manifest control locked |
| rightFadeWidth | LIVE | mask stop width |
| rightContentPadding | LIVE | actual rail `padding-right` |
| scrollbar | LIVE | dataset + `scrollbar-width`; auto/hidden runtime CSS |
| dragThreshold | LIVE | dataset consumed by `rail-drag.js` before drag begins |
| clickSuppressMs | LIVE | dataset consumed by `rail-drag.js` after mouse drag |

## collection-bottom-sheet

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| enabled | LIVE | layer disabled dataset + sheet/backdrop/FAB visibility |
| backdrop | LIVE | actual backdrop visibility/background |
| backdropBlur | LIVE | actual backdrop `backdrop-filter` |
| sheetBlur | LIVE | actual sheet `backdrop-filter` blur |
| sheetSaturation | LIVE | actual sheet saturation |
| maxWidth | LIVE | actual sheet width/max geometry |
| maxHeightDvh | LIVE | actual sheet height |
| radiusTop | LIVE | actual top border radius |
| handle | LIVE | `.collection-handle-wrap.hidden` |
| tabs | LIVE | `.collection-tabs.hidden` |
| search | LIVE | `.collection-search.hidden` |
| filters | LIVE | `.collection-filters.hidden` |
| bulkSelection | LIVE | layer dataset + selection toggle/bar visibility |
| themeSelector | LIVE | `.theme-setting-card.hidden` |
| deviceHandoff | LIVE | `#collectionDeviceLink.hidden` |

## device-handoff-accordion

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| enabled | LIVE | `#collectionDeviceLink.hidden` |
| heightMode | LOCKED | only measured owner supported; manifest control locked |
| response | LIVE | actual panel transition duration/easing |
| copyAction | LIVE | canonical copy action node visibility |
| connectAction | LIVE | canonical connect action node visibility |
| statusMessage | LIVE | canonical status node visibility |

## floating-action

| Control | Status | Canonical owner / measurable effect |
| --- | --- | --- |
| family | LIVE | `data-module-style-family` flat/glass/liquid + shared CSS |
| accentColor | LIVE | actual FAB background/gradient |
| response | LIVE | actual FAB transition duration |
| overshoot | LIVE | actual FAB transition timing function |

## reading-progress

`reading-progress` is present in older capability manifest data, but it is not an approved `PlatformModuleRegistry` Library module. Progress ownership is integrated into `top-chapter-navigation`. Status: `NOT-LIBRARY`.

Browser QA must assert that it is not exposed as a standalone Library selector/control owner.

## Confirmed findings from this audit

1. iOS Flat and Material are already real `filter-chip-rail` runtime sources, not simulated Library-only modes.
2. The current live-change message path exists: Library `saveStyleKey()` → `platform-module-style` → module preview `applyStyle()` → `PlatformModuleStyleRuntime.apply()`.
3. A real no-op was found: `filter-chip-rail.gap` and `runway` did not affect the default iOS Liquid source. The active branch fixes this in shared canonical CSS.
4. Long filter menus need rail-level overflow containment rather than wrapping/painting past the module. The active branch changes all three families to native horizontal overflow.
5. Material filter visual treatment is replaced on the active branch with a tonal/shape/motion-oriented Material 3 Expressive treatment while keeping the same canonical family ID for backward compatibility.
6. Locked controls are not implementation gaps. They must remain visibly disabled and are tested as such.

## Merge gate

Do not mark this audit complete until CI proves:
- every `LIVE`/`FIXED` control changes a measurable canonical runtime result;
- every `LOCKED` control is disabled;
- every family switch changes the real source DOM and the Library selector label;
- a long filter menu overflows horizontally without painting text outside the module;
- no standalone `reading-progress` Library module appears;
- the existing Library → Editor canonical module pipeline remains green.