(function(){
  if(window.__platformGlobalChipManifestV3)return;
  window.__platformGlobalChipManifestV3=true;

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

  function migrateRunway(config){
    if(!config||typeof config!=='object')return config;
    const next={...config};
    if(Object.prototype.hasOwnProperty.call(next,'runway')){
      const value=Math.max(0,Number(next.runway)||0);
      for(const key of ['railPaddingTop','railPaddingRight','railPaddingBottom','railPaddingLeft']){
        if(!Object.prototype.hasOwnProperty.call(next,key))next[key]=value;
      }
      delete next.runway;
    }
    return next;
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
      'ui-dashboard/sandbox/global-chip-runtime-v1.js',
      'ui-dashboard/sandbox/filter-chip-live-runtime-v2.js'
    ];
    chips.controls=[
      {id:'family',label:'스타일',type:'enum',default:'ios-flat',options:['material-flat','ios-flat','ios-liquid'],group:'스타일'},
      {id:'accentColor',label:'선택 색상',type:'color',default:'#202226',group:'스타일'},
      {id:'surfaceOpacity',label:'표면 투명도',type:'range',default:100,min:20,max:100,step:2,unit:'%',group:'스타일'},
      {id:'blur',label:'블러',type:'range',default:0,min:0,max:36,step:2,unit:'px',group:'스타일'},
      {id:'gap',label:'칩 사이 간격',type:'range',default:7,min:0,max:24,step:.5,unit:'px',group:'여백과 간격'},
      {id:'railPaddingTop',label:'레일 위 여백',type:'range',default:0,min:0,max:24,step:.5,unit:'px',group:'여백과 간격'},
      {id:'railPaddingRight',label:'레일 오른쪽 여백',type:'range',default:0,min:0,max:40,step:.5,unit:'px',group:'여백과 간격'},
      {id:'railPaddingBottom',label:'레일 아래 여백',type:'range',default:0,min:0,max:24,step:.5,unit:'px',group:'여백과 간격'},
      {id:'railPaddingLeft',label:'레일 왼쪽 여백',type:'range',default:0,min:0,max:40,step:.5,unit:'px',group:'여백과 간격'},
      {id:'chipPaddingY',label:'칩 위아래 여백',type:'range',default:7,min:2,max:18,step:.5,unit:'px',group:'여백과 간격'},
      {id:'chipPaddingX',label:'칩 좌우 여백',type:'range',default:10,min:4,max:28,step:.5,unit:'px',group:'여백과 간격'},
      {id:'response',label:'선택 이동 속도',type:'enum',default:'calm',options:['calm','standard','lively'],group:'움직임'},
      {id:'overshoot',label:'선택 이동 탄성',type:'enum',default:'none',options:['none','low','medium','high'],group:'움직임'}
    ];
    chips.presets=(chips.presets||[]).map(preset=>({...preset,config:migrateRunway(preset.config||{})}));
  }

  const stores=['platformBuilderCapabilityConfigsV2','platformBuilderCapabilityConfigsV1'];
  for(const key of stores){
    try{
      const all=JSON.parse(localStorage.getItem(key)||'{}');
      if(!all||typeof all!=='object'||Array.isArray(all))continue;
      let changed=false;
      const old=all['top-chapter-navigation'];
      if(old&&typeof old==='object'){
        const global={...(all['filter-chip-rail']||{})};
        if(Object.prototype.hasOwnProperty.call(old,'chipFamily')&&!Object.prototype.hasOwnProperty.call(global,'family'))global.family=old.chipFamily;
        if(Object.prototype.hasOwnProperty.call(old,'accentColor')&&!Object.prototype.hasOwnProperty.call(global,'accentColor'))global.accentColor=old.accentColor;
        delete old.chipFamily;delete old.accentColor;
        if(Object.keys(old).length)all['top-chapter-navigation']=old;else delete all['top-chapter-navigation'];
        if(Object.keys(global).length)all['filter-chip-rail']=global;
        changed=true;
      }
      const filter=all['filter-chip-rail'];
      if(filter&&typeof filter==='object'&&Object.prototype.hasOwnProperty.call(filter,'runway')){
        all['filter-chip-rail']=migrateRunway(filter);changed=true;
      }
      if(changed)localStorage.setItem(key,JSON.stringify(all));
    }catch{}
  }
})();
