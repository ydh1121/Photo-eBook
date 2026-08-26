/* v1: Registry metadata for the canonical filter-chip outer paint repair. */
(function(){
  if(window.__platformFilterChipEdgeRepairV1)return;
  window.__platformFilterChipEdgeRepairV1=true;
  const registry=window.PlatformModuleRegistry;
  const current=registry?.get?.('filter-chip-rail');
  if(!registry||!current)return;
  const edgeCss='public/assets/styles/platform-modules/filter-chip-rail-edge-repair-v1.css';
  registry.register({...current,ownerFiles:[...new Set([...(current.ownerFiles||[]),edgeCss])]});
})();
