export const UI_CAPABILITIES_V1=Object.freeze([
  'top-chapter-navigation',
  'horizontal-card-rail',
  'filter-chip-rail',
  'collection-bottom-sheet',
  'device-handoff-accordion',
  'reading-progress',
  'floating-action'
]);

export function isKnownUiCapability(id){
  return UI_CAPABILITIES_V1.includes(String(id||''));
}
