(function(){
  if(window.__platformGlobalChipManifestV2)return;
  window.__platformGlobalChipManifestV2=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest?.capabilities)return;

  const top=manifest.capabilities.find(item=>item.id==='top-chapter-navigation');
  const chips=manifest.capabilities.find(item=>item.id==='filter-chip-rail');
  if(top){
    top.controls=(top.controls||[]).filter(control=>!['chipFamily','accentColor'].includes(control.id));
    top.presets=(top.presets||[]).map(preset=>{
      const config={...(preset.config||{})};
      delete config.chipFamily;delete config.accentColor;
      return {...preset,config};
    });
  }
  if(chips){
    chips.label='범용 필터칩';
    chips.category='design-system';
    chips.owners=[
      'assets/js/ui/liquid-controller.js',
      'assets/styles/ui/liquid-flat-canonical.css',
      'assets/styles/ui/liquid-skin.css',
      'assets/styles/desktop/nav-corrections.css',
      'assets/styles/collection/hub.css',
      'ui-dashboard/sandbox/global-chip-runtime-v1.js'
    ];
    const runway=(chips.controls||[]).find(control=>control.id==='runway');
    if(runway)runway.step=.5;
    const gap=(chips.controls||[]).find(control=>control.id==='gap');
    if(gap)gap.step=.5;
  }

  const stores=['platformBuilderCapabilityConfigsV2','platformBuilderCapabilityConfigsV1'];
  for(const key of stores){
    try{
      const all=JSON.parse(localStorage.getItem(key)||'{}');
      if(!all||typeof all!=='object'||Array.isArray(all))continue;
      const old=all['top-chapter-navigation'];
      if(!old||typeof old!=='object')continue;
      const global={...(all['filter-chip-rail']||{})};
      if(Object.prototype.hasOwnProperty.call(old,'chipFamily')&&!Object.prototype.hasOwnProperty.call(global,'family'))global.family=old.chipFamily;
      if(Object.prototype.hasOwnProperty.call(old,'accentColor')&&!Object.prototype.hasOwnProperty.call(global,'accentColor'))global.accentColor=old.accentColor;
      delete old.chipFamily;delete old.accentColor;
      if(Object.keys(old).length)all['top-chapter-navigation']=old;else delete all['top-chapter-navigation'];
      if(Object.keys(global).length)all['filter-chip-rail']=global;
      localStorage.setItem(key,JSON.stringify(all));
    }catch{}
  }
})();
