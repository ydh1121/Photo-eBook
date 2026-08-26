/* v2: portable style-runtime extension. Loaded after module-style-runtime-v1. */
(function(){
  if(window.__platformModuleStylePortableV2)return;
  window.__platformModuleStylePortableV2=true;

  const runtime=window.PlatformModuleStyleRuntime;
  if(!runtime)return;
  const originalApply=runtime.apply.bind(runtime);
  const originalReset=runtime.reset.bind(runtime);
  const num=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const bool=(value,fallback=true)=>typeof value==='boolean'?value:fallback;
  const $=(selector,root=document)=>root.querySelector(selector);

  function resetRail(root=document){
    const track=$('[data-platform-module="horizontal-rail"] .platform-horizontal-rail__track',root);
    if(!track)return;
    delete track.dataset.moduleDesktopDrag;
    delete track.dataset.moduleDragThreshold;
    delete track.dataset.moduleClickSuppressMs;
    delete track.dataset.moduleScrollbar;
    track.style.removeProperty('--platform-rail-left-runway');
    track.style.removeProperty('--platform-rail-right-padding');
    track.style.removeProperty('padding-left');
    track.style.removeProperty('padding-right');
    track.style.removeProperty('-webkit-mask-image');
    track.style.removeProperty('mask-image');
    track.style.removeProperty('scrollbar-width');
    track.style.removeProperty('overflow-x');
  }

  function applyRail(root=document,config={}){
    resetRail(root);
    const track=$('[data-platform-module="horizontal-rail"] .platform-horizontal-rail__track',root);
    if(!track)return config;
    const baseline=runtime.defaults('horizontal-rail')||{};
    const value={...baseline,...(config||{})};

    track.dataset.moduleDesktopDrag=String(bool(value.desktopDrag,true));
    track.dataset.moduleDragThreshold=String(num(value.dragThreshold,5));
    track.dataset.moduleClickSuppressMs=String(num(value.clickSuppressMs,220));
    track.dataset.moduleScrollbar=value.scrollbar==='auto'?'auto':'hidden';

    const leftRunway=bool(value.leftShadowGuard,true)?num(value.leftPaintRunway,16):0;
    const rightPadding=num(value.rightContentPadding,122);
    track.style.setProperty('--platform-rail-left-runway',`${leftRunway}px`);
    track.style.setProperty('--platform-rail-right-padding',`${rightPadding}px`);
    track.style.setProperty('padding-left',`${leftRunway}px`,'important');
    track.style.setProperty('padding-right',`${rightPadding}px`,'important');

    const left=bool(value.leftFade,false);
    const right=bool(value.rightFade,true);
    const rightWidth=Math.max(0,num(value.rightFadeWidth,112));
    const leftWidth=Math.max(18,num(value.leftPaintRunway,16)+18);
    if(left||right){
      let mask;
      if(left&&right)mask=`linear-gradient(to right,transparent 0,#000 ${leftWidth}px,#000 calc(100% - ${rightWidth}px),transparent 100%)`;
      else if(left)mask=`linear-gradient(to right,transparent 0,#000 ${leftWidth}px,#000 100%)`;
      else mask=`linear-gradient(to right,#000 0,#000 calc(100% - ${rightWidth}px),transparent 100%)`;
      track.style.setProperty('-webkit-mask-image',mask,'important');
      track.style.setProperty('mask-image',mask,'important');
    }else{
      track.style.setProperty('-webkit-mask-image','none','important');
      track.style.setProperty('mask-image','none','important');
    }

    if(value.scrollbar==='hidden')track.style.setProperty('scrollbar-width','none','important');
    else{
      track.style.setProperty('scrollbar-width','auto','important');
      track.style.setProperty('overflow-x','auto','important');
    }
    return value;
  }

  function collectionScreenModeSlot(root=document){
    return $('[data-platform-module="collection-bottom-sheet"] [data-collection-screen-mode-slot]',root)||$('[data-collection-screen-mode-slot]',root);
  }
  function resetCollectionScreenMode(root=document){
    const slot=collectionScreenModeSlot(root);
    if(slot)slot.hidden=false;
  }
  function applyCollectionScreenMode(root=document,value={}){
    const slot=collectionScreenModeSlot(root);
    if(slot)slot.hidden=!bool(value.themeSelector,true);
  }

  runtime.reset=function(id,root=document){
    if(id==='horizontal-rail'){resetRail(root);return;}
    const result=originalReset(id,root);
    if(id==='collection-bottom-sheet')resetCollectionScreenMode(root);
    return result;
  };
  runtime.apply=function(id,root=document,config={}){
    if(id==='horizontal-rail')return applyRail(root,config);
    const value=originalApply(id,root,config);
    if(id==='collection-bottom-sheet')applyCollectionScreenMode(root,value||config);
    return value;
  };
})();
