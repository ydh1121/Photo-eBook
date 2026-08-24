(function(){
  if(window.PlatformModuleStyleRuntime)return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const num=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const bool=(value,fallback=true)=>typeof value==='boolean'?value:fallback;

  function ensureStyle(){
    let style=document.getElementById('platform-module-style-runtime-v1');
    if(style)return style;
    style=document.createElement('style');
    style.id='platform-module-style-runtime-v1';
    style.textContent=`
      [data-module-style-family="material-flat"]{background:#f1f3f6!important;border-color:rgba(22,30,48,.07)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
      [data-module-style-family="ios-flat"]{background:rgba(244,247,251,.88)!important;border-color:rgba(22,30,48,.075)!important;box-shadow:0 5px 16px rgba(25,38,62,.06)!important;-webkit-backdrop-filter:blur(12px)!important;backdrop-filter:blur(12px)!important}
      [data-module-style-family="material-flat"] :is(.nav-v33-indicator,.collection-v33-indicator),[data-module-style-family="ios-flat"] :is(.nav-v33-indicator,.collection-v33-indicator){display:none!important}
      [data-module-style-family="material-flat"] :is(.nav-chip,.collection-tab).is-active,[data-module-style-family="ios-flat"] :is(.nav-chip,.collection-tab).is-active{background:var(--module-accent,#437ce7)!important;border-color:var(--module-accent,#437ce7)!important;color:#fff!important;box-shadow:none!important}
      .platform-filter-chip-source[hidden]{display:none!important}
      .platform-filter-chip-source--flat[data-custom-accent="true"] .collection-filter.is-active{background:var(--module-flat-accent,#202226)!important;border-color:var(--module-flat-accent,#202226)!important;color:#fff!important}
      .collection-fab[data-module-style-family="flat"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important}
      .collection-fab[data-module-style-family="liquid"]{-webkit-backdrop-filter:blur(18px) saturate(145%)!important;backdrop-filter:blur(18px) saturate(145%)!important;box-shadow:0 8px 22px rgba(34,76,165,.22),inset 0 1px 0 rgba(255,255,255,.35)!important}
      [data-platform-module="collection-bottom-sheet"][data-module-disabled="true"] :is(#collectionFab,#collectionBackdrop,#collectionSheet){display:none!important;pointer-events:none!important}
    `;
    document.head.appendChild(style);
    return style;
  }

  function controlsFor(id){
    const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
    return manifest?.capabilities?.find(item=>item.id===id)?.controls||[];
  }
  function defaults(id){
    const canonical=window.PlatformModuleRegistry?.get?.(id)?.styleDefaults;
    if(canonical&&typeof canonical==='object')return {...canonical};
    const result={};
    controlsFor(id).forEach(control=>{result[control.id]=control.default;});
    return result;
  }
  function resetInline(node,names){for(const name of names)node?.style?.removeProperty(name);}
  function baselineAccent(id){return window.PlatformModuleRegistry?.get?.(id)?.styleDefaults?.accentColor||'';}
  function hasCustomAccent(id,value){return Boolean(value?.accentColor)&&String(value.accentColor).toLowerCase()!==String(baselineAccent(id)).toLowerCase();}

  function reset(id,root=document){
    if(id==='top-chapter-navigation'){
      const shell=$('.nav-shell',root),rail=$('.nav-scroll',root);
      if(shell){shell.hidden=false;resetInline(shell,['position','top','transform']);}
      if(rail){delete rail.dataset.moduleStyleFamily;resetInline(rail,['gap','padding-left','padding-right','padding-top','padding-bottom','--module-accent','--v36-blue-top','--v36-blue-mid','--v36-blue-bottom','--lg-blue-a','--lg-blue-b','--lg-blue-c']);}
    }else if(id==='filter-chip-rail'){
      const module=$('[data-platform-module="filter-chip-rail"]',root),liquid=$('.platform-filter-chip-source--liquid',root),flat=$('.platform-filter-chip-source--flat',root);
      if(module)module.dataset.platformFilterFamily='ios-liquid';
      if(liquid){liquid.hidden=false;resetInline(liquid,['gap','padding-left','padding-right','background','-webkit-backdrop-filter','backdrop-filter','--module-accent','--v36-blue-top','--v36-blue-mid','--v36-blue-bottom','--lg-blue-a','--lg-blue-b','--lg-blue-c']);$$('.collection-tab',liquid).forEach(button=>resetInline(button,['transition-duration']));}
      if(flat){flat.hidden=true;delete flat.dataset.customAccent;resetInline(flat,['gap','padding-left','padding-right','--module-flat-accent']);$$('.collection-filter',flat).forEach(button=>resetInline(button,['transition-duration','background','-webkit-backdrop-filter','backdrop-filter']));}
    }else if(id==='horizontal-card-rail'){
      const rail=$('[data-platform-module="horizontal-card-rail"]',root);
      if(rail){delete rail.dataset.builderDesktopDrag;delete rail.dataset.builderDragThreshold;delete rail.dataset.builderClickSuppressMs;resetInline(rail,['padding-left','padding-right','-webkit-mask-image','mask-image']);}
    }else if(id==='collection-bottom-sheet'){
      const layer=$('[data-platform-module="collection-bottom-sheet"]',root),sheet=$('#collectionSheet',root),backdrop=$('#collectionBackdrop',root),fab=$('#collectionFab',root);
      if(layer)delete layer.dataset.moduleDisabled;
      if(fab)fab.hidden=false;
      if(sheet){sheet.hidden=false;resetInline(sheet,['width','height','max-width','border-radius','-webkit-backdrop-filter','backdrop-filter']);$$('.collection-handle-wrap,.collection-tabs,.collection-search,.collection-filters,#collectionDeviceLink,.collection-select-toggle',sheet).forEach(node=>node.hidden=false);}
      if(backdrop){resetInline(backdrop,['background','-webkit-backdrop-filter','backdrop-filter']);}
    }else if(id==='device-handoff-accordion'){
      const link=$('#collectionDeviceLink',root),panel=$('.collection-device-panel-v2',root);
      if(link)link.hidden=false;if(panel){resetInline(panel,['transition-duration']);$$('[data-device-panel-copy],[data-device-panel-connect],.collection-device-panel__status',panel).forEach(node=>node.hidden=false);}
    }else if(id==='floating-action'){
      const fab=$('[data-platform-module="floating-action"],#collectionFab',root);
      if(fab){delete fab.dataset.moduleStyleFamily;resetInline(fab,['background','border-color','transition-duration','-webkit-backdrop-filter','backdrop-filter','box-shadow']);}
    }
  }

  function applyAccent(node,color){
    if(!node||!color)return;
    const top=`color-mix(in srgb, ${color} 82%, white)`;
    const bottom=`color-mix(in srgb, ${color} 82%, black)`;
    node.style.setProperty('--module-accent',color);
    node.style.setProperty('--v36-blue-top',top);
    node.style.setProperty('--v36-blue-mid',color);
    node.style.setProperty('--v36-blue-bottom',bottom);
    node.style.setProperty('--lg-blue-a',top);
    node.style.setProperty('--lg-blue-b',color);
    node.style.setProperty('--lg-blue-c',bottom);
  }

  function apply(id,root=document,config={}){
    ensureStyle();reset(id,root);
    const value={...defaults(id),...(config||{})};
    if(id==='top-chapter-navigation'){
      const shell=$('.nav-shell',root),rail=$('.nav-scroll',root);if(!shell||!rail)return value;
      if(has(value,'enabled'))shell.hidden=!bool(value.enabled,true);
      if(value.stickyMode==='static'){shell.style.position='relative';shell.style.top='auto';shell.style.transform='none';}
      else if(value.stickyMode==='sticky'){shell.style.position='sticky';shell.style.top='0';shell.style.transform='none';}
      if(value.chipFamily&&value.chipFamily!=='ios-liquid')rail.dataset.moduleStyleFamily=value.chipFamily;
      if(value.chipFamily!=='ios-liquid'||hasCustomAccent(id,value))applyAccent(rail,value.accentColor||'#437ce7');
      rail.style.gap=`${innerWidth<1024?num(value.mobileChipGap,6):num(value.desktopChipGap,9)}px`;
      const inset=num(value.railInset,5.5);rail.style.paddingTop=`${inset}px`;rail.style.paddingBottom=`${inset}px`;
    }else if(id==='filter-chip-rail'){
      const module=$('[data-platform-module="filter-chip-rail"]',root),liquid=$('.platform-filter-chip-source--liquid',root),flat=$('.platform-filter-chip-source--flat',root);if(!module||!liquid||!flat)return value;
      const family=value.family==='ios-flat'?'ios-flat':'ios-liquid';
      module.dataset.platformFilterFamily=family;
      liquid.hidden=family!=='ios-liquid';flat.hidden=family!=='ios-flat';
      const active=family==='ios-flat'?flat:liquid;
      active.style.gap=`${num(value.gap,4)}px`;
      const runway=num(value.runway,4);active.style.paddingLeft=`${runway}px`;active.style.paddingRight=`${runway}px`;
      const duration=value.response==='lively'?140:value.response==='calm'?260:190;
      $$('button',active).forEach(button=>button.style.transitionDuration=`${duration}ms`);
      if(family==='ios-liquid'){
        if(hasCustomAccent(id,value))applyAccent(liquid,value.accentColor||'#4c7fdf');
        const opacity=Math.max(20,Math.min(100,num(value.surfaceOpacity,54)))/100;
        const lower=Math.max(.16,opacity*.74);
        liquid.style.background=`linear-gradient(180deg,rgba(249,251,254,${opacity}),rgba(237,242,249,${lower}))`;
        liquid.style.backdropFilter=`blur(${num(value.blur,15)}px) saturate(125%)`;liquid.style.webkitBackdropFilter=liquid.style.backdropFilter;
        requestAnimationFrame(()=>liquid.__photoLiquidController?.update?.({instant:true}));
      }else{
        const custom=hasCustomAccent(id,value);flat.dataset.customAccent=String(custom);if(custom)flat.style.setProperty('--module-flat-accent',value.accentColor||'#202226');
        const defaultSurface=num(defaults(id).surfaceOpacity,54),defaultBlur=num(defaults(id).blur,15);
        const flatOpacity=num(value.surfaceOpacity,defaultSurface)===defaultSurface?100:num(value.surfaceOpacity,100);
        const flatBlur=num(value.blur,defaultBlur)===defaultBlur?0:num(value.blur,0);
        $$('.collection-filter',flat).forEach(button=>{
          button.style.background=`color-mix(in srgb, #f3f4f7 ${flatOpacity}%, transparent)`;
          button.style.backdropFilter=`blur(${flatBlur}px)`;button.style.webkitBackdropFilter=button.style.backdropFilter;
        });
      }
    }else if(id==='horizontal-card-rail'){
      const rail=$('[data-platform-module="horizontal-card-rail"]',root);if(!rail)return value;
      rail.dataset.builderDesktopDrag=String(bool(value.desktopDrag,true));rail.dataset.builderDragThreshold=String(num(value.dragThreshold,5));rail.dataset.builderClickSuppressMs=String(num(value.clickSuppressMs,220));
      rail.style.paddingLeft=`${bool(value.leftShadowGuard,true)?num(value.leftPaintRunway,16):0}px`;rail.style.paddingRight=`${num(value.rightContentPadding,122)}px`;
      if(value.rightFade){const width=num(value.rightFadeWidth,112);rail.style.webkitMaskImage=`linear-gradient(to right,#000 0,#000 calc(100% - ${width}px),transparent 100%)`;rail.style.maskImage=rail.style.webkitMaskImage;}
      if(value.scrollbar==='hidden'){rail.style.scrollbarWidth='none';}
    }else if(id==='collection-bottom-sheet'){
      const layer=$('[data-platform-module="collection-bottom-sheet"]',root),sheet=$('#collectionSheet',root),backdrop=$('#collectionBackdrop',root),fab=$('#collectionFab',root);if(!sheet)return value;
      if(!bool(value.enabled,true)){if(layer)layer.dataset.moduleDisabled='true';sheet.hidden=true;if(backdrop)backdrop.hidden=true;if(fab)fab.hidden=true;return value;}
      if(layer)delete layer.dataset.moduleDisabled;if(fab)fab.hidden=false;
      if(backdrop){if(!bool(value.backdrop,true))backdrop.style.background='transparent';const blur=bool(value.backdrop,true)?num(value.backdropBlur,12):0;backdrop.style.backdropFilter=`blur(${blur}px)`;backdrop.style.webkitBackdropFilter=backdrop.style.backdropFilter;}
      sheet.style.width=`min(100%,${num(value.maxWidth,760)}px)`;sheet.style.height=`min(${num(value.maxHeightDvh,84)}dvh,780px)`;const radius=num(value.radiusTop,30);sheet.style.borderRadius=`${radius}px ${radius}px 0 0`;sheet.style.backdropFilter=`blur(${num(value.sheetBlur,26)}px) saturate(${num(value.sheetSaturation,135)}%)`;sheet.style.webkitBackdropFilter=sheet.style.backdropFilter;
      const toggles=[['handle','.collection-handle-wrap'],['tabs','.collection-tabs'],['search','.collection-search'],['filters','.collection-filters'],['deviceHandoff','#collectionDeviceLink']];
      for(const [key,selector] of toggles){const node=$(selector,sheet);if(node&&has(value,key))node.hidden=!bool(value[key],true);}
      if(has(value,'bulkSelection')){
        const enabled=bool(value.bulkSelection,true),toggle=$('.collection-select-toggle',sheet),bar=$('.collection-bulkbar',sheet);
        if(toggle)toggle.hidden=!enabled;if(!enabled&&bar)bar.hidden=true;
      }
    }else if(id==='device-handoff-accordion'){
      const link=$('#collectionDeviceLink',root),panel=$('.collection-device-panel-v2',root);if(link)link.hidden=!bool(value.enabled,true);if(panel){panel.style.transitionDuration=value.response==='lively'?'140ms':value.response==='calm'?'260ms':'190ms';$$('[data-device-panel-copy]',panel).forEach(node=>node.hidden=!bool(value.copyAction,true));$$('[data-device-panel-connect]',panel).forEach(node=>node.hidden=!bool(value.connectAction,true));$$('.collection-device-panel__status',panel).forEach(node=>node.hidden=!bool(value.statusMessage,true));}
    }else if(id==='floating-action'){
      const fab=$('[data-platform-module="floating-action"],#collectionFab',root);if(!fab)return value;
      if(value.family)fab.dataset.moduleStyleFamily=value.family;const accent=value.accentColor||'#315fc9';fab.style.background=`linear-gradient(145deg,${accent},${accent})`;fab.style.transitionDuration=value.response==='lively'?'140ms':value.response==='calm'?'260ms':'190ms';
    }
    return value;
  }

  window.PlatformModuleStyleRuntime={apply,reset,defaults,controlsFor};
})();
