/* v1: Library editing metadata for grouped/shared module families. */
(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const registry=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.capabilities)||!registry)return;

  function capabilityFor(id){
    let capability=manifest.capabilities.find(item=>item.id===id);
    const definition=registry.get(id);
    if(!capability&&definition){
      capability={id, label:definition.label, category:definition.category||'ui', status:'approved', source:definition.source, owners:[...(definition.ownerFiles||[])], controls:[], presets:[]};
      manifest.capabilities.push(capability);
    }
    if(capability&&definition){
      capability.label=definition.label;
      capability.category=definition.category||capability.category;
      capability.status='approved';
      capability.source=definition.source;
      capability.owners=[...(definition.ownerFiles||[])];
    }
    return capability;
  }
  function ensureControl(capability,control){
    if(!capability)return;
    capability.controls=Array.isArray(capability.controls)?capability.controls:[];
    const existing=capability.controls.find(item=>item.id===control.id);
    if(existing)Object.assign(existing,control);
    else capability.controls.push(control);
  }

  const rail=capabilityFor('horizontal-rail');
  const defaults=registry.get('horizontal-rail')?.styleDefaults||{};
  [
    {id:'nativeTouch',label:'모바일 기본 스크롤',type:'boolean',default:true,locked:true,group:'input'},
    {id:'desktopDrag',label:'PC 마우스 드래그',type:'boolean',default:true,group:'input'},
    {id:'leftShadowGuard',label:'왼쪽 카드 그림자 보호',type:'boolean',default:true,group:'left-edge'},
    {id:'leftPaintRunway',label:'왼쪽 그림자 여백',type:'range',default:16,min:0,max:64,step:1,unit:'px',group:'left-edge'},
    {id:'leftFade',label:'왼쪽 페이드',type:'boolean',default:false,group:'left-edge'},
    {id:'rightFade',label:'오른쪽 페이드',type:'boolean',default:true,group:'right-edge'},
    {id:'rightFadeMode',label:'오른쪽 페이드 방식',type:'enum',default:'alpha-mask',options:['alpha-mask'],locked:true,group:'right-edge'},
    {id:'rightFadeWidth',label:'오른쪽 페이드 너비',type:'range',default:112,min:0,max:180,step:2,unit:'px',group:'right-edge'},
    {id:'rightContentPadding',label:'오른쪽 끝 여백',type:'range',default:122,min:0,max:180,step:2,unit:'px',group:'right-edge'},
    {id:'scrollbar',label:'스크롤바',type:'enum',default:'hidden',options:['hidden','auto'],group:'visibility'},
    {id:'dragThreshold',label:'드래그 시작 거리',type:'range',default:5,min:2,max:16,step:1,unit:'px',group:'advanced'},
    {id:'clickSuppressMs',label:'드래그 후 클릭 억제',type:'range',default:220,min:0,max:500,step:10,unit:'ms',group:'advanced'}
  ].forEach(control=>ensureControl(rail,{...control,default:Object.prototype.hasOwnProperty.call(defaults,control.id)?defaults[control.id]:control.default}));

  ['accordion','device-handoff-accordion','collection-bottom-sheet','bottom-sheet','screen-mode-selector'].forEach(capabilityFor);
})();
