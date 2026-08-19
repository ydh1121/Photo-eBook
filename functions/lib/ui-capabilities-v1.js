export const UI_CAPABILITIES_V1=Object.freeze([
  'top-chapter-navigation',
  'horizontal-card-rail',
  'filter-chip-rail',
  'collection-bottom-sheet',
  'device-handoff-accordion',
  'reading-progress',
  'floating-action'
]);

export const UI_BUILTIN_PRESETS_V1=Object.freeze({
  'photo-topnav-blue-progress':Object.freeze({capabilityId:'top-chapter-navigation',source:'photography-extracted',status:'draft',config:Object.freeze({enabled:true,stickyMode:'deferred-sticky',chipFamily:'ios-liquid',accentColor:'#437ce7',progressEnabled:true,progressMode:'chapter-wash',progressColor:'#4081ef',progressOpacityStart:24,progressOpacityEnd:16,mobileChipGap:6,desktopChipGap:9,railInset:5.5,response:'standard',overshoot:'high',durationScale:1.1,safariSafety:true})}),
  'photo-rail-balanced-fade':Object.freeze({capabilityId:'horizontal-card-rail',source:'photography-extracted',status:'draft',config:Object.freeze({nativeTouch:true,desktopDrag:true,leftShadowGuard:true,leftPaintRunway:16,leftFade:false,rightFade:true,rightFadeMode:'alpha-mask',rightFadeWidth:112,rightContentPadding:122,scrollbar:'hidden',dragThreshold:5,clickSuppressMs:220})}),
  'photo-collection-filter-flat':Object.freeze({capabilityId:'filter-chip-rail',source:'photography-extracted',status:'draft',config:Object.freeze({family:'ios-flat',accentColor:'#202226',surfaceOpacity:100,blur:0,response:'calm',overshoot:'none',gap:7,runway:0})}),
  'ios-liquid-standard':Object.freeze({capabilityId:'filter-chip-rail',source:'system',status:'draft',config:Object.freeze({family:'ios-liquid',accentColor:'#315fc9',surfaceOpacity:78,blur:18,response:'standard',overshoot:'medium',gap:8,runway:14})}),
  'material-flat-neutral':Object.freeze({capabilityId:'filter-chip-rail',source:'system',status:'draft',config:Object.freeze({family:'material-flat',accentColor:'#315fc9',surfaceOpacity:100,blur:0,response:'calm',overshoot:'none',gap:8,runway:14})}),
  'photo-collection-full':Object.freeze({capabilityId:'collection-bottom-sheet',source:'photography-extracted',status:'draft',config:Object.freeze({enabled:true,backdrop:true,backdropBlur:12,sheetBlur:26,sheetSaturation:135,maxWidth:760,maxHeightDvh:84,radiusTop:30,handle:true,tabs:true,search:true,filters:true,bulkSelection:true,themeSelector:true,deviceHandoff:true})}),
  'photo-device-handoff':Object.freeze({capabilityId:'device-handoff-accordion',source:'photography-extracted',status:'draft',config:Object.freeze({enabled:true,heightMode:'measured',response:'standard',copyAction:true,connectAction:true,statusMessage:true})}),
  'photo-progress-blue':Object.freeze({capabilityId:'reading-progress',source:'photography-extracted',status:'draft',config:Object.freeze({enabled:true,color:'#4081ef',thickness:2,opacity:100})})
});

export function isKnownUiCapability(id){
  return UI_CAPABILITIES_V1.includes(String(id||''));
}

export function sanitizeUiConfigV1(input={}){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const output={};
  for(const [key,value] of Object.entries(source)){
    if(['__proto__','prototype','constructor'].includes(key))continue;
    if(value===null||['string','number','boolean'].includes(typeof value))output[key]=value;
  }
  return output;
}

export function findBuiltinUiPresetV1(capabilityId,presetId){
  const preset=UI_BUILTIN_PRESETS_V1[String(presetId||'')];
  return preset&&preset.capabilityId===String(capabilityId||'')?preset:null;
}

export function resolveUiCapabilityConfigV1(item,serverPresets=[]){
  const capabilityId=String(item?.capabilityId||'');
  const presetId=String(item?.presetId||'');
  const serverPreset=(Array.isArray(serverPresets)?serverPresets:[]).find(preset=>
    String(preset?.id||'')===presetId&&String(preset?.capabilityId||'')===capabilityId
  )||null;
  const builtin=findBuiltinUiPresetV1(capabilityId,presetId);
  const preset=serverPreset||builtin;
  const presetConfig=sanitizeUiConfigV1(preset?.config||{});
  const overrides=sanitizeUiConfigV1(item?.overrides||{});
  return {
    capabilityId,
    enabled:item?.enabled===true,
    presetId,
    presetSource:String(serverPreset?.source||builtin?.source||''),
    presetStatus:String(serverPreset?.status||builtin?.status||''),
    config:{...presetConfig,...overrides},
    presetFound:!presetId||Boolean(preset)
  };
}
