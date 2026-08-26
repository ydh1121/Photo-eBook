(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const modules=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.capabilities)||!modules)return;

  const FONT_OPTIONS=['system-sans','apple-sans','korean-sans','rounded-sans'];
  function ensureControl(capability,control,{after}={}){
    capability.controls=Array.isArray(capability.controls)?capability.controls:[];
    const existing=capability.controls.find(item=>item.id===control.id);
    if(existing){Object.assign(existing,control);return existing;}
    const index=after?capability.controls.findIndex(item=>item.id===after):-1;
    if(index>=0)capability.controls.splice(index+1,0,control);
    else capability.controls.push(control);
    return control;
  }

  for(const definition of modules.listFor('library')){
    let capability=manifest.capabilities.find(item=>item.id===definition.id);
    if(!capability){
      capability={id:definition.id,label:definition.label,category:definition.category||'ui',status:'approved',source:definition.source,owners:[...definition.ownerFiles],controls:[],presets:[]};
      manifest.capabilities.push(capability);
      continue;
    }
    capability.label=definition.label||capability.label;
    capability.category=definition.category||capability.category;
    capability.status='approved';
    capability.source=definition.source;
    capability.owners=[...definition.ownerFiles];
  }

  const topNav=manifest.capabilities.find(item=>item.id==='top-chapter-navigation');
  if(topNav){
    ensureControl(topNav,{id:'fontFamily',label:'폰트',type:'enum',default:'system-sans',options:FONT_OPTIONS,group:'typography'},{after:'accentColor'});
    ensureControl(topNav,{id:'fontSize',label:'글자 크기',type:'range',default:15,min:11,max:20,step:.5,unit:'px',group:'typography'},{after:'fontFamily'});
    ensureControl(topNav,{id:'fontWeight',label:'글자 굵기',type:'range',default:680,min:400,max:800,step:10,group:'typography'},{after:'fontSize'});
    ensureControl(topNav,{id:'letterSpacing',label:'자간',type:'range',default:-.38,min:-1.2,max:.6,step:.02,unit:'px',group:'typography'},{after:'fontWeight'});
  }

  const filter=manifest.capabilities.find(item=>item.id==='filter-chip-rail');
  if(filter){
    const family=(filter.controls||[]).find(control=>control.id==='family');
    if(family)family.options=['ios-liquid','ios-flat','material-flat'];
    ensureControl(filter,{id:'fontFamily',label:'폰트',type:'enum',default:'system-sans',options:FONT_OPTIONS},{after:'accentColor'});
    ensureControl(filter,{id:'fontSize',label:'글자 크기',type:'range',default:14,min:10,max:19,step:.5,unit:'px'},{after:'fontFamily'});
    ensureControl(filter,{id:'fontWeight',label:'글자 굵기',type:'range',default:680,min:400,max:800,step:10},{after:'fontSize'});
    ensureControl(filter,{id:'letterSpacing',label:'자간',type:'range',default:-.28,min:-1.2,max:.6,step:.02,unit:'px'},{after:'fontWeight'});
    const defaultsByFamily={
      'ios-liquid':{surfaceOpacity:54,blur:15,gap:8,runway:4},
      'ios-flat':{surfaceOpacity:92,blur:8,gap:3,runway:4},
      'material-flat':{surfaceOpacity:100,blur:0,gap:8,runway:0}
    };
    (filter.presets||[]).forEach(preset=>{
      const familyId=preset.config?.family;
      if(defaultsByFamily[familyId])preset.config={...preset.config,...defaultsByFamily[familyId],fontFamily:preset.config?.fontFamily||'system-sans',fontSize:preset.config?.fontSize||14,fontWeight:preset.config?.fontWeight||680,letterSpacing:preset.config?.letterSpacing??-.28};
    });
  }

  /* Registry is the runtime source of truth. Capability metadata only describes
     how to edit it, so matching controls inherit their default from Registry. */
  for(const definition of modules.listFor('library')){
    const capability=manifest.capabilities.find(item=>item.id===definition.id);
    const defaults=definition.styleDefaults&&typeof definition.styleDefaults==='object'?definition.styleDefaults:{};
    for(const control of capability?.controls||[]){
      if(Object.prototype.hasOwnProperty.call(defaults,control.id))control.default=defaults[control.id];
    }
  }

  manifest.runtimeSource='PlatformModuleRegistry';
  manifest.runtimeSyncedAt=new Date().toISOString();
})();
