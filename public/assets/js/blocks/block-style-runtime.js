(function(){
  if(window.PlatformBlockStyles)return;
  const STORAGE_KEY='platformBlockStylePresetsV1';
  const ENUMS={
    density:['airy','standard','compact'],
    surface:['plain','grouped','card'],
    radius:['none','small','medium','large'],
    border:['none','subtle','strong'],
    shadow:['none','soft','raised'],
    accentMode:['neutral','accent','semantic'],
    mediaRatio:['auto','16:10','16:9','4:3','1:1'],
    edgeTreatment:['none','runway','fade']
  };
  const DATASET={density:'styleDensity',surface:'styleSurface',radius:'styleRadius',border:'styleBorder',shadow:'styleShadow',accentMode:'styleAccentMode',mediaRatio:'styleMediaRatio',edgeTreatment:'styleEdgeTreatment'};

  function readLocalPresets(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function normalize(input={}){const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};const output={};for(const [key,values] of Object.entries(ENUMS)){if(values.includes(String(source[key]||'')))output[key]=String(source[key]);}return output;}
  function presetFor(block,presets=readLocalPresets()){
    const id=String(block?.stylePresetId||'');
    if(!id)return null;
    return (Array.isArray(presets)?presets:[]).find(item=>item?.id===id&&item?.blockType===block.type&&item?.variant===block.variant)||null;
  }
  function resolve(block,{presets}={}){
    const embedded=normalize(block?.resolvedStyle||block?.style||{});
    const preset=presetFor(block,presets||readLocalPresets());
    const presetStyle=normalize(preset?.style||{});
    const overrides=normalize(block?.styleOverrides||{});
    return {...presetStyle,...embedded,...overrides};
  }
  function clear(host){
    if(!host)return;
    delete host.dataset.blockStyleHost;
    for(const datasetKey of Object.values(DATASET))delete host.dataset[datasetKey];
  }
  function apply(host,block,options={}){
    if(!host)return {};
    const style=resolve(block,options);
    host.dataset.blockStyleHost='true';
    for(const [key,datasetKey] of Object.entries(DATASET)){
      const value=style[key];
      if(value&&value!=='auto'&&value!=='standard')host.dataset[datasetKey]=value;
      else delete host.dataset[datasetKey];
    }
    return style;
  }
  window.PlatformBlockStyles={storageKey:STORAGE_KEY,enums:ENUMS,normalize,readLocalPresets,presetFor,resolve,apply,clear};
})();
