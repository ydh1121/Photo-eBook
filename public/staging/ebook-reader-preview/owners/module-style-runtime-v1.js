(function(){
  if(window.PlatformModuleStyleRuntime)return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const num=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const bool=(value,fallback=true)=>typeof value==='boolean'?value:fallback;
  const FONT_STACKS={
    'system-sans':'-apple-system,BlinkMacSystemFont,"SF Pro Text","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif',
    'apple-sans':'-apple-system,BlinkMacSystemFont,"SF Pro Text","Apple SD Gothic Neo",sans-serif',
    'korean-sans':'"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif',
    'rounded-sans':'ui-rounded,"SF Pro Rounded","Apple SD Gothic Neo",system-ui,sans-serif'
  };

  function fontStack(value){return FONT_STACKS[value]||FONT_STACKS['system-sans'];}
  function motion(value='standard',overshoot='medium',scale=1){
    const base=value==='lively'?145:value==='calm'?270:195;
    const easing=overshoot==='none'?'cubic-bezier(.2,.72,.2,1)':overshoot==='low'?'cubic-bezier(.2,.88,.28,1.08)':overshoot==='high'?'cubic-bezier(.22,1.42,.32,1)': 'cubic-bezier(.22,1.18,.3,1)';
    return {duration:Math.max(80,Math.round(base*num(scale,1))),easing};
  }

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
      .nav-scroll[data-module-progress-enabled="false"]>.nav-chapter-progress{display:none!important}
      .nav-scroll[data-module-progress-mode="line"]>.nav-chapter-progress{top:auto!important;bottom:1px!important;height:2px!important;border-radius:999px!important;padding-top:0!important;padding-bottom:0!important}
      .nav-scroll[data-module-progress-enabled="true"]>.nav-chapter-progress{background:linear-gradient(90deg,color-mix(in srgb,var(--module-progress-color,#4081ef) var(--module-progress-start,24%),transparent),color-mix(in srgb,var(--module-progress-color,#4081ef) var(--module-progress-end,16%),transparent))!important}
      .nav-scroll[data-module-motion]>.nav-v33-indicator{transition-duration:var(--module-motion-duration,195ms)!important;transition-timing-function:var(--module-motion-ease,cubic-bezier(.22,1.18,.3,1))!important}
      .platform-filter-chip-module .collection-v33-indicator{transition-duration:var(--platform-filter-duration,195ms)!important;transition-timing-function:var(--platform-filter-ease,cubic-bezier(.22,1.18,.3,1))!important}
      .collection-fab[data-module-style-family="flat"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important}
      .collection-fab[data-module-style-family="glass"]{-webkit-backdrop-filter:blur(14px) saturate(125%)!important;backdrop-filter:blur(14px) saturate(125%)!important}
      .collection-fab[data-module-style-family="liquid"]{-webkit-backdrop-filter:blur(20px) saturate(150%)!important;backdrop-filter:blur(20px) saturate(150%)!important;box-shadow:0 10px 28px rgba(34,76,165,.24),inset 0 1px 0 rgba(255,255,255,.42)!important}
      [data-platform-module="collection-bottom-sheet"][data-module-disabled="true"] :is(#collectionFab,#collectionBackdrop,#collectionSheet){display:none!important;pointer-events:none!important}
      [data-platform-module="collection-bottom-sheet"][data-module-bulk-selection="false"] :is(.collection-select-toggle,.collection-bulkbar,.collection-selectbox){display:none!important;pointer-events:none!important}
      .scroll-row[data-module-scrollbar="auto"]{scrollbar-width:auto!important;overflow-x:auto!important}
      .scroll-row[data-module-scrollbar="auto"]::-webkit-scrollbar{display:block!important;height:8px}
      .scroll-row[data-module-scrollbar="auto"]::-webkit-scrollbar-thumb{background:rgba(90,98,112,.24);border-radius:999px}
      .scroll-row[data-module-scrollbar="auto"]::-webkit-scrollbar-track{background:transparent}
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
  function applyTypography(nodes,value,{size=14,weight=680,spacing=-.28}={}){
    nodes.forEach(node=>{
      node.style.setProperty('font-family',fontStack(value.fontFamily),'important');
      node.style.setProperty('font-size',`${num(value.fontSize,size)}px`,'important');
      node.style.setProperty('font-weight',String(num(value.fontWeight,weight)),'important');
      node.style.setProperty('letter-spacing',`${num(value.letterSpacing,spacing)}px`,'important');
    });
  }

  function reset(id,root=document){
    if(id==='top-chapter-navigation'){
      const shell=$('.nav-shell',root),rail=$('.nav-scroll',root);
      if(shell){shell.hidden=false;resetInline(shell,['position','top','transform']);}
      if(rail){delete rail.dataset.moduleStyleFamily;delete rail.dataset.moduleProgressEnabled;delete rail.dataset.moduleProgressMode;delete rail.dataset.moduleMotion;resetInline(rail,['gap','padding-left','padding-right','padding-top','padding-bottom','--module-accent','--v36-blue-top','--v36-blue-mid','--v36-blue-bottom','--lg-blue-a','--lg-blue-b','--lg-blue-c','--module-progress-color','--module-progress-start','--module-progress-end','--module-motion-duration','--module-motion-ease']);$$('.nav-chip',rail).forEach(node=>resetInline(node,['font-family','font-size','font-weight','letter-spacing']));}
    }else if(id==='filter-chip-rail'){
      const module=$('[data-platform-module="filter-chip-rail"]',root);
      const liquid=$('.platform-filter-chip-source--liquid',root);
      const iosFlat=$('.platform-filter-chip-source--ios-flat',root);
      const material=$('.platform-filter-chip-source--material-flat',root);
      if(module){module.dataset.platformFilterFamily='ios-liquid';delete module.dataset.platformFilterValue;resetInline(module,['--platform-filter-accent','--platform-filter-gap','--platform-filter-runway','--platform-filter-surface-opacity','--platform-filter-duration','--platform-filter-ease','--platform-filter-font-family','--platform-filter-font-size','--platform-filter-font-weight','--platform-filter-letter-spacing']);}
      if(liquid){liquid.hidden=false;resetInline(liquid,['gap','padding-left','padding-right','background','-webkit-backdrop-filter','backdrop-filter','--module-accent','--v36-blue-top','--v36-blue-mid','--v36-blue-bottom','--lg-blue-a','--lg-blue-b','--lg-blue-c']);}
      [iosFlat,material].forEach(source=>{if(!source)return;source.hidden=true;resetInline(source,['gap','padding-left','padding-right','background','-webkit-backdrop-filter','backdrop-filter']);});
      $$('[data-platform-filter-id]',module||root).forEach(button=>resetInline(button,['transition-duration','transition-timing-function','font-family','font-size','font-weight','letter-spacing']));
    }else if(id==='horizontal-card-rail'){
      const rail=$('[data-platform-module="horizontal-card-rail"]',root);
      if(rail){delete rail.dataset.builderDesktopDrag;delete rail.dataset.builderDragThreshold;delete rail.dataset.builderClickSuppressMs;delete rail.dataset.moduleScrollbar;resetInline(rail,['padding-left','padding-right','-webkit-mask-image','mask-image','scrollbar-width','overflow-x']);}
    }else if(id==='collection-bottom-sheet'){
      const layer=$('[data-platform-module="collection-bottom-sheet"]',root),sheet=$('#collectionSheet',root),backdrop=$('#collectionBackdrop',root),fab=$('#collectionFab',root);
      if(layer){delete layer.dataset.moduleDisabled;delete layer.dataset.moduleBulkSelection;}
      if(fab)fab.hidden=false;
      if(sheet){sheet.hidden=false;resetInline(sheet,['width','height','max-width','border-radius','-webkit-backdrop-filter','backdrop-filter']);$$('.collection-handle-wrap,.collection-tabs,.collection-search,.collection-filters,#collectionDeviceLink,.collection-select-toggle,.theme-setting-card',sheet).forEach(node=>node.hidden=false);}
      if(backdrop){backdrop.hidden=false;resetInline(backdrop,['background','-webkit-backdrop-filter','backdrop-filter']);}
    }else if(id==='device-handoff-accordion'){
      const link=$('#collectionDeviceLink',root),panel=$('.collection-device-panel-v2',root);
      if(link)link.hidden=false;if(panel){resetInline(panel,['transition-duration','transition-timing-function']);$$('[data-device-panel-copy],[data-device-panel-connect],.collection-device-panel__status',panel).forEach(node=>node.hidden=false);}
    }else if(id==='floating-action'){
      const fab=$('[data-platform-module="floating-action"],#collectionFab',root);
      if(fab){delete fab.dataset.moduleStyleFamily;resetInline(fab,['background','border-color','transition-duration','transition-timing-function','-webkit-backdrop-filter','backdrop-filter','box-shadow']);}
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
    const baseline=defaults(id);
    const value={...baseline,...(config||{})};
    if(id==='top-chapter-navigation'){
      const shell=$('.nav-shell',root),rail=$('.nav-scroll',root);if(!shell||!rail)return value;
      if(has(value,'enabled'))shell.hidden=!bool(value.enabled,true);
      if(value.stickyMode==='static'){
        shell.style.setProperty('position','relative','important');
        shell.style.setProperty('top','auto','important');
        shell.style.setProperty('transform','none','important');
      }else if(value.stickyMode==='sticky'){
        shell.style.setProperty('position','sticky','important');
        shell.style.setProperty('top','0','important');
        shell.style.setProperty('transform','none','important');
      }
      if(value.chipFamily&&value.chipFamily!=='ios-liquid')rail.dataset.moduleStyleFamily=value.chipFamily;
      if(value.chipFamily!=='ios-liquid'||hasCustomAccent(id,value))applyAccent(rail,value.accentColor||'#437ce7');
      applyTypography($$('.nav-chip',rail),value,{size:15,weight:680,spacing:-.38});
      rail.style.setProperty('gap',`${innerWidth<1024?num(value.mobileChipGap,6):num(value.desktopChipGap,9)}px`,'important');
      const inset=num(value.railInset,5.5);
      rail.style.setProperty('padding-top',`${inset}px`,'important');
      rail.style.setProperty('padding-bottom',`${inset}px`,'important');
      rail.dataset.moduleProgressEnabled=String(bool(value.progressEnabled,true));
      rail.dataset.moduleProgressMode=value.progressMode==='line'?'line':'chapter-wash';
      rail.style.setProperty('--module-progress-color',value.progressColor||'#4081ef');
      rail.style.setProperty('--module-progress-start',`${Math.max(0,Math.min(100,num(value.progressOpacityStart,24)))}%`);
      rail.style.setProperty('--module-progress-end',`${Math.max(0,Math.min(100,num(value.progressOpacityEnd,16)))}%`);
      const customMotion=value.response!==baseline.response||value.overshoot!==baseline.overshoot||num(value.durationScale,1)!==num(baseline.durationScale,1);
      if(customMotion){const m=motion(value.response,value.overshoot,value.durationScale);rail.dataset.moduleMotion='true';rail.style.setProperty('--module-motion-duration',`${m.duration}ms`);rail.style.setProperty('--module-motion-ease',m.easing);}
      else{delete rail.dataset.moduleMotion;rail.style.removeProperty('--module-motion-duration');rail.style.removeProperty('--module-motion-ease');}
    }else if(id==='filter-chip-rail'){
      const module=$('[data-platform-module="filter-chip-rail"]',root),liquid=$('.platform-filter-chip-source--liquid',root),iosFlat=$('.platform-filter-chip-source--ios-flat',root),material=$('.platform-filter-chip-source--material-flat',root);
      if(!module||!liquid||!iosFlat||!material)return value;
      const allowed=['ios-liquid','ios-flat','material-flat'];const family=allowed.includes(value.family)?value.family:'ios-liquid';const source=family==='ios-liquid'?liquid:family==='ios-flat'?iosFlat:material;
      module.dataset.platformFilterFamily=family;
      module.style.setProperty('--platform-filter-accent',value.accentColor||'#4c7fdf');module.style.setProperty('--platform-filter-gap',`${num(value.gap,8)}px`);module.style.setProperty('--platform-filter-runway',`${num(value.runway,4)}px`);module.style.setProperty('--platform-filter-surface-opacity',String(Math.max(20,Math.min(100,num(value.surfaceOpacity,100)))/100));
      module.style.setProperty('--platform-filter-font-family',fontStack(value.fontFamily));module.style.setProperty('--platform-filter-font-size',`${num(value.fontSize,14)}px`);module.style.setProperty('--platform-filter-font-weight',String(num(value.fontWeight,680)));module.style.setProperty('--platform-filter-letter-spacing',`${num(value.letterSpacing,-.28)}px`);
      const m=motion(value.response,value.overshoot,1);module.style.setProperty('--platform-filter-duration',`${m.duration}ms`);module.style.setProperty('--platform-filter-ease',m.easing);
      liquid.hidden=family!=='ios-liquid';iosFlat.hidden=family!=='ios-flat';material.hidden=family!=='material-flat';
      applyTypography($$('button',source),value,{size:14,weight:680,spacing:-.28});$$('button',source).forEach(button=>{button.style.transitionDuration=`${m.duration}ms`;button.style.transitionTimingFunction=m.easing;});
      if(family==='ios-liquid'){
        if(hasCustomAccent(id,value))applyAccent(liquid,value.accentColor||'#4c7fdf');
        const opacity=Math.max(20,Math.min(100,num(value.surfaceOpacity,54)))/100,lower=Math.max(.16,opacity*.74);
        liquid.style.setProperty('background',`linear-gradient(180deg,rgba(249,251,254,${opacity}),rgba(237,242,249,${lower}))`,'important');
        const filter=`blur(${num(value.blur,15)}px) saturate(125%)`;
        liquid.style.setProperty('backdrop-filter',filter,'important');
        liquid.style.setProperty('-webkit-backdrop-filter',filter,'important');
        requestAnimationFrame(()=>liquid.__photoLiquidController?.update?.({instant:true}));
      }else if(family==='ios-flat'){
        const opacity=Math.max(20,Math.min(100,num(value.surfaceOpacity,92)))/100;iosFlat.style.background=`rgba(235,238,244,${opacity})`;iosFlat.style.backdropFilter=`blur(${num(value.blur,8)}px) saturate(115%)`;iosFlat.style.webkitBackdropFilter=iosFlat.style.backdropFilter;
      }else{
        const opacity=Math.max(20,Math.min(100,num(value.surfaceOpacity,100)))/100;material.style.setProperty('--platform-material-fill-opacity',String(opacity));material.style.background='transparent';material.style.backdropFilter='none';material.style.webkitBackdropFilter='none';
      }
    }else if(id==='horizontal-card-rail'){
      const rail=$('[data-platform-module="horizontal-card-rail"]',root);if(!rail)return value;
      rail.dataset.builderDesktopDrag=String(bool(value.desktopDrag,true));rail.dataset.builderDragThreshold=String(num(value.dragThreshold,5));rail.dataset.builderClickSuppressMs=String(num(value.clickSuppressMs,220));rail.dataset.moduleScrollbar=value.scrollbar==='auto'?'auto':'hidden';
      rail.style.setProperty('padding-left',`${bool(value.leftShadowGuard,true)?num(value.leftPaintRunway,16):0}px`,'important');
      rail.style.setProperty('padding-right',`${num(value.rightContentPadding,122)}px`,'important');
      const left=bool(value.leftFade,false),right=bool(value.rightFade,true),rightWidth=num(value.rightFadeWidth,112),leftWidth=Math.max(18,num(value.leftPaintRunway,16)+18);
      if(left||right){
        let mask;if(left&&right)mask=`linear-gradient(to right,transparent 0,#000 ${leftWidth}px,#000 calc(100% - ${rightWidth}px),transparent 100%)`;else if(left)mask=`linear-gradient(to right,transparent 0,#000 ${leftWidth}px,#000 100%)`;else mask=`linear-gradient(to right,#000 0,#000 calc(100% - ${rightWidth}px),transparent 100%)`;
        rail.style.setProperty('-webkit-mask-image',mask,'important');
        rail.style.setProperty('mask-image',mask,'important');
      }else{
        rail.style.setProperty('-webkit-mask-image','none','important');
        rail.style.setProperty('mask-image','none','important');
      }
      if(value.scrollbar==='hidden'){
        rail.style.setProperty('scrollbar-width','none','important');
      }else{
        rail.style.setProperty('scrollbar-width','auto','important');
        rail.style.setProperty('overflow-x','auto','important');
      }
    }else if(id==='collection-bottom-sheet'){
      const layer=$('[data-platform-module="collection-bottom-sheet"]',root),sheet=$('#collectionSheet',root),backdrop=$('#collectionBackdrop',root),fab=$('#collectionFab',root);if(!sheet)return value;
      if(!bool(value.enabled,true)){if(layer)layer.dataset.moduleDisabled='true';sheet.hidden=true;if(backdrop)backdrop.hidden=true;if(fab)fab.hidden=true;return value;}
      if(layer)delete layer.dataset.moduleDisabled;if(fab)fab.hidden=false;
      if(backdrop){
        backdrop.hidden=!bool(value.backdrop,true);
        if(!bool(value.backdrop,true))backdrop.style.setProperty('background','transparent','important');
        const blur=bool(value.backdrop,true)?num(value.backdropBlur,12):0,filter=`blur(${blur}px)`;
        backdrop.style.setProperty('backdrop-filter',filter,'important');
        backdrop.style.setProperty('-webkit-backdrop-filter',filter,'important');
      }
      sheet.style.setProperty('width',`min(100%,${num(value.maxWidth,760)}px)`,'important');
      sheet.style.setProperty('height',`min(${num(value.maxHeightDvh,84)}dvh,780px)`,'important');
      const radius=num(value.radiusTop,30);
      sheet.style.setProperty('border-radius',`${radius}px ${radius}px 0 0`,'important');
      const sheetFilter=`blur(${num(value.sheetBlur,26)}px) saturate(${num(value.sheetSaturation,135)}%)`;
      sheet.style.setProperty('backdrop-filter',sheetFilter,'important');
      sheet.style.setProperty('-webkit-backdrop-filter',sheetFilter,'important');
      const toggles=[['handle','.collection-handle-wrap'],['tabs','.collection-tabs'],['search','.collection-search'],['filters','.collection-filters'],['deviceHandoff','#collectionDeviceLink'],['themeSelector','.theme-setting-card']];for(const [key,selector] of toggles){const node=$(selector,sheet);if(node&&has(value,key))node.hidden=!bool(value[key],true);}
      if(has(value,'bulkSelection')){const enabled=bool(value.bulkSelection,true),toggle=$('.collection-select-toggle',sheet),bar=$('.collection-bulkbar',sheet);if(layer)layer.dataset.moduleBulkSelection=String(enabled);if(toggle)toggle.hidden=!enabled;if(!enabled&&bar)bar.hidden=true;}
    }else if(id==='device-handoff-accordion'){
      const link=$('#collectionDeviceLink',root),panel=$('.collection-device-panel-v2',root);if(link)link.hidden=!bool(value.enabled,true);if(panel){const m=motion(value.response,'none',1);panel.style.setProperty('transition-duration',`${m.duration}ms`,'important');panel.style.setProperty('transition-timing-function',m.easing,'important');$$('[data-device-panel-copy]',panel).forEach(node=>node.hidden=!bool(value.copyAction,true));$$('[data-device-panel-connect]',panel).forEach(node=>node.hidden=!bool(value.connectAction,true));$$('.collection-device-panel__status',panel).forEach(node=>node.hidden=!bool(value.statusMessage,true));}
    }else if(id==='floating-action'){
      const fab=$('[data-platform-module="floating-action"],#collectionFab',root);if(!fab)return value;
      const family=['flat','glass','liquid'].includes(value.family)?value.family:'glass';fab.dataset.moduleStyleFamily=family;const accent=value.accentColor||'#315fc9';let background;if(family==='flat')background=accent;else if(family==='liquid')background=`linear-gradient(145deg,color-mix(in srgb,${accent} 78%,white),color-mix(in srgb,${accent} 88%,black))`;else background=`linear-gradient(145deg,color-mix(in srgb,${accent} 88%,white),${accent})`;fab.style.setProperty('background',background,'important');const m=motion(value.response,value.overshoot,1);fab.style.setProperty('transition-duration',`${m.duration}ms`,'important');fab.style.setProperty('transition-timing-function',m.easing,'important');
    }
    return value;
  }

  window.PlatformModuleStyleRuntime={apply,reset,defaults,controlsFor,fontStack};
})();