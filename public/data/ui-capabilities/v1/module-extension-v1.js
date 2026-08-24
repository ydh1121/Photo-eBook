(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const modules=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.capabilities)||!modules)return;

  for(const definition of modules.listFor('library')){
    let capability=manifest.capabilities.find(item=>item.id===definition.id);
    if(!capability){
      capability={
        id:definition.id,
        label:definition.label,
        category:definition.category||'ui',
        status:'approved',
        source:definition.source,
        owners:[...definition.ownerFiles],
        controls:[],
        presets:[]
      };
      manifest.capabilities.push(capability);
      continue;
    }
    capability.label=definition.label||capability.label;
    capability.status='approved';
    capability.source=definition.source;
    capability.owners=[...definition.ownerFiles];
  }

  /* The public Photography page has two completed filter sources:
     - .collection-tabs/.collection-tab: iOS liquid segmented control
     - .collection-filters/.collection-filter: iOS flat pills
     Material never existed as a completed public source, so it must not be
     advertised as an approved Library style. It can return through Block Lab
     after an explicit research/promotion cycle. */
  const filter=manifest.capabilities.find(item=>item.id==='filter-chip-rail');
  if(filter){
    const family=(filter.controls||[]).find(control=>control.id==='family');
    if(family){
      family.default='ios-liquid';
      family.options=['ios-liquid','ios-flat'];
    }
    const surface=(filter.controls||[]).find(control=>control.id==='surfaceOpacity');
    if(surface)surface.default=54;
    const blur=(filter.controls||[]).find(control=>control.id==='blur');
    if(blur)blur.default=15;
    filter.presets=(filter.presets||[]).filter(preset=>preset.config?.family!=='material-flat'&&preset.id!=='material-flat-neutral');
    const flat=filter.presets.find(preset=>preset.config?.family==='ios-flat');
    if(flat)flat.config={...flat.config,surfaceOpacity:100,blur:0};
    const liquid=filter.presets.find(preset=>preset.config?.family==='ios-liquid');
    if(liquid)liquid.config={...liquid.config,surfaceOpacity:54,blur:15};
  }
})();
