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
})();
