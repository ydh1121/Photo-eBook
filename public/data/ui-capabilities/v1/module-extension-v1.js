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

  /* filter-chip-rail now has three canonical runtime families. They are mounted
     by the same registry module in Library, Editor and public snapshots. */
  const filter=manifest.capabilities.find(item=>item.id==='filter-chip-rail');
  if(filter){
    const family=(filter.controls||[]).find(control=>control.id==='family');
    if(family){
      family.default='ios-liquid';
      family.options=['ios-liquid','ios-flat','material-flat'];
    }
    const surface=(filter.controls||[]).find(control=>control.id==='surfaceOpacity');
    if(surface)surface.default=54;
    const blur=(filter.controls||[]).find(control=>control.id==='blur');
    if(blur)blur.default=15;

    const defaults={
      'ios-liquid':{surfaceOpacity:54,blur:15,gap:8,runway:4},
      'ios-flat':{surfaceOpacity:100,blur:0,gap:6,runway:4},
      'material-flat':{surfaceOpacity:100,blur:0,gap:8,runway:0}
    };
    (filter.presets||[]).forEach(preset=>{
      const familyId=preset.config?.family;
      if(defaults[familyId])preset.config={...preset.config,...defaults[familyId]};
    });
  }
})();
