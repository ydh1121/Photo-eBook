(function(){
  if(window.__platformSandboxCapabilityRuntimeV3)return;
  window.__platformSandboxCapabilityRuntimeV3=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const clampNum=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)?n:fallback;};
  const bool=(value,fallback=true)=>typeof value==='boolean'?value:fallback;

  function rgba(hex,alpha){
    const raw=String(hex||'#315fc9').replace('#','').trim();
    const normalized=raw.length===3?raw.split('').map(char=>char+char).join(''):raw.padEnd(6,'0').slice(0,6);
    const n=parseInt(normalized,16);
    if(!Number.isFinite(n))return `rgba(49,95,201,${alpha})`;
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;
  }

  function installStyle(){
    let style=$('#sandbox-capability-runtime-v3-style');
    if(style)return style;
    style=document.createElement('style');
    style.id='sandbox-capability-runtime-v3-style';
    style.textContent=`
      html[data-builder-nav-mode="static"] .nav-shell{position:relative!important;top:auto!important;transform:none!important}
      html[data-builder-nav-mode="sticky"] .nav-shell{position:-webkit-sticky!important;position:sticky!important;top:0!important;transform:none!important}
      .nav-scroll[data-builder-family="material-flat"]{background:#f1f3f6!important;border-color:rgba(22,30,48,.07)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .nav-scroll[data-builder-family="ios-flat"]{background:rgba(244,247,251,.88)!important;border-color:rgba(22,30,48,.075)!important;box-shadow:0 5px 16px rgba(25,38,62,.06)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}
      .nav-scroll[data-builder-family]:not([data-builder-family="ios-liquid"]) .nav-v33-indicator{display:none!important}
      .nav-scroll[data-builder-family]:not([data-builder-family="ios-liquid"]) .nav-chip.is-active{background:var(--builder-nav-accent,#437ce7)!important;color:#fff!important;box-shadow:none!important}
      .collection-filters[data-builder-family="material-flat"] .collection-filter{border-radius:8px!important;background:#f2f3f5!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .collection-filters[data-builder-family="ios-flat"] .collection-filter{background:rgba(243,244,247,var(--builder-filter-opacity,1))!important;backdrop-filter:blur(var(--builder-filter-blur,0px))!important;-webkit-backdrop-filter:blur(var(--builder-filter-blur,0px))!important}
      .collection-filters[data-builder-family="ios-liquid"] .collection-filter{background:rgba(245,248,253,var(--builder-filter-opacity,.78))!important;backdrop-filter:blur(var(--builder-filter-blur,18px)) saturate(135%)!important;-webkit-backdrop-filter:blur(var(--builder-filter-blur,18px)) saturate(135%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 5px 16px rgba(30,46,76,.08)!important}
      .collection-filters[data-builder-family] .collection-filter.is-active{background:var(--builder-filter-accent,#202226)!important;color:#fff!important;border-color:var(--builder-filter-accent,#202226)!important}
      .scroll-row[data-builder-scrollbar="hidden"]{scrollbar-width:none!important}.scroll-row[data-builder-scrollbar="hidden"]::-webkit-scrollbar{display:none!important}
      .scroll-row[data-builder-fade="right"]{-webkit-mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .scroll-row[data-builder-fade="left"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important}
      .scroll-row[data-builder-fade="both"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .collection-fab[data-builder-family="flat"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important}
      .collection-fab[data-builder-family="liquid"]{backdrop-filter:blur(18px) saturate(145%)!important;-webkit-backdrop-filter:blur(18px) saturate(145%)!important;box-shadow:0 8px 22px rgba(34,76,165,.22),inset 0 1px 0 rgba(255,255,255,.35)!important}
    `;
    document.head.appendChild(style);
    return style;
  }

  function removeInline(node,names){for(const name of names)node?.style?.removeProperty(name);}

  function resetNav(){
    const shell=$('.nav-shell'),nav=$('.nav-scroll');
    if(shell){shell.hidden=false;removeInline(shell,['position','top','transform','display']);}
    delete document.documentElement.dataset.builderNavMode;
    if(nav){
      delete nav.dataset.builderFamily;
      removeInline(nav,['gap','padding-left','padding-right','padding-top','padding-bottom','--builder-nav-accent','--builder-motion-duration']);
      const indicator=$('.nav-v33-indicator',nav);removeInline(indicator,['transition-duration']);
    }
  }

  function resetRail(){
    $$('.scroll-row').forEach(row=>{
      delete row.dataset.builderFade;delete row.dataset.builderScrollbar;delete row.dataset.builderDesktopDrag;delete row.dataset.builderDragThreshold;delete row.dataset.builderClickSuppressMs;
      removeInline(row,['padding-left','padding-right','--builder-fade-right','--builder-fade-left','-webkit-mask-image','mask-image']);
    });
  }

  function resetFilters(){
    $$('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;
      removeInline(root,['gap','padding-left','padding-right','padding-inline','--builder-filter-accent','--builder-filter-opacity','--builder-filter-blur']);
      $$('.collection-filter',root).forEach(button=>removeInline(button,['transition-duration','background','color','border-color','border-radius','box-shadow','backdrop-filter','-webkit-backdrop-filter']));
    });
  }

  function resetSheet(){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');
    if(sheet){
      removeInline(sheet,['max-width','max-height','height','border-radius','backdrop-filter','-webkit-backdrop-filter']);
      for(const selector of ['.collection-handle-wrap','.collection-tabs','.collection-search','.collection-filters','#collectionDeviceLink']){
        const node=$(selector,sheet);if(node)node.hidden=false;
      }
      $$('.collection-select-toggle,.theme-choice',sheet).forEach(node=>node.hidden=false);
    }
    if(backdrop){removeInline(backdrop,['backdrop-filter','-webkit-backdrop-filter','background']);}
  }

  function resetDevice(){
    const link=$('#collectionDeviceLink');if(link)link.hidden=false;
    const accordion=$('.collection-device-accordion');if(accordion)removeInline(accordion,['--device-response-ms']);
    const panel=$('.collection-device-panel-v2');if(panel){
      removeInline(panel,['transition-duration']);
      $$('[data-device-panel-copy],[data-device-panel-connect],.collection-device-panel__status',panel).forEach(node=>node.hidden=false);
    }
  }

  function resetProgress(){
    $$('.nav-chapter-progress,.read-progress').forEach(node=>{node.hidden=false;removeInline(node,['opacity','background','height','top','bottom','border-radius','display','visibility']);});
  }

  function resetFab(){
    const fab=$('#collectionFab');if(!fab)return;
    delete fab.dataset.builderFamily;
    removeInline(fab,['background','border-color','transition-duration','backdrop-filter','-webkit-backdrop-filter','box-shadow']);
  }

  function reset(id){
    if(id==='top-chapter-navigation')resetNav();
    else if(id==='horizontal-card-rail')resetRail();
    else if(id==='filter-chip-rail')resetFilters();
    else if(id==='collection-bottom-sheet')resetSheet();
    else if(id==='device-handoff-accordion')resetDevice();
    else if(id==='reading-progress')resetProgress();
    else if(id==='floating-action')resetFab();
  }

  function applyNav(config){
    const shell=$('.nav-shell'),nav=$('.nav-scroll');if(!shell||!nav)return;
    if(has(config,'enabled'))shell.hidden=!bool(config.enabled,true);
    if(has(config,'stickyMode')){
      const mode=config.stickyMode;
      if(mode==='static')document.documentElement.dataset.builderNavMode='static';
      else if(mode==='sticky')document.documentElement.dataset.builderNavMode='sticky';
      else delete document.documentElement.dataset.builderNavMode;
    }
    if(has(config,'chipFamily'))nav.dataset.builderFamily=config.chipFamily;
    if(has(config,'accentColor'))nav.style.setProperty('--builder-nav-accent',config.accentColor||'#437ce7');
    if(innerWidth<1024&&has(config,'mobileChipGap'))nav.style.setProperty('gap',`${clampNum(config.mobileChipGap,6)}px`,'important');
    if(innerWidth>=1024&&has(config,'desktopChipGap'))nav.style.setProperty('gap',`${clampNum(config.desktopChipGap,9)}px`,'important');
    if(has(config,'railInset')){
      const inset=clampNum(config.railInset,5.5);nav.style.setProperty('padding-top',`${inset}px`,'important');nav.style.setProperty('padding-bottom',`${inset}px`,'important');
    }
    const progress=$('.nav-chapter-progress',nav);
    if(progress){
      if(has(config,'progressEnabled'))progress.hidden=!bool(config.progressEnabled,true);
      if(has(config,'progressColor')||has(config,'progressOpacityStart')||has(config,'progressOpacityEnd')){
        const color=config.progressColor||'#4081ef';
        const start=clampNum(config.progressOpacityStart,24)/100,end=clampNum(config.progressOpacityEnd,16)/100;
        progress.style.background=`linear-gradient(90deg,${rgba(color,start)},${rgba(color,end)})`;
      }
      if(has(config,'progressMode')){
        if(config.progressMode==='line'){
          progress.style.top='auto';progress.style.bottom='0';progress.style.height='2px';progress.style.borderRadius='999px';
        }else removeInline(progress,['top','bottom','height','border-radius']);
      }
    }
    if(has(config,'durationScale')){
      const duration=Math.round(260*clampNum(config.durationScale,1.1));
      nav.style.setProperty('--builder-motion-duration',`${duration}ms`);
      const indicator=$('.nav-v33-indicator',nav);if(indicator)indicator.style.transitionDuration=`${duration}ms`;
    }
  }

  function applyRail(config){
    $$('.scroll-row').forEach(row=>{
      if(has(config,'leftPaintRunway')||has(config,'leftShadowGuard')){
        const left=bool(config.leftShadowGuard,true)?clampNum(config.leftPaintRunway,16):0;row.style.paddingLeft=`${left}px`;row.style.setProperty('--builder-fade-left',`${Math.max(18,left)}px`);
      }
      if(has(config,'rightContentPadding'))row.style.paddingRight=`${clampNum(config.rightContentPadding,122)}px`;
      if(has(config,'rightFadeWidth'))row.style.setProperty('--builder-fade-right',`${clampNum(config.rightFadeWidth,112)}px`);
      if(has(config,'leftFade')||has(config,'rightFade')){
        const left=bool(config.leftFade,false),right=bool(config.rightFade,true);row.dataset.builderFade=left&&right?'both':left?'left':right?'right':'none';
        if(!left&&!right)removeInline(row,['-webkit-mask-image','mask-image']);
      }
      if(has(config,'scrollbar'))row.dataset.builderScrollbar=config.scrollbar;
      if(has(config,'desktopDrag'))row.dataset.builderDesktopDrag=String(bool(config.desktopDrag,true));
      if(has(config,'dragThreshold'))row.dataset.builderDragThreshold=String(clampNum(config.dragThreshold,5));
      if(has(config,'clickSuppressMs'))row.dataset.builderClickSuppressMs=String(clampNum(config.clickSuppressMs,220));
    });
  }

  function applyFilters(config){
    $$('.collection-filters').forEach(root=>{
      if(has(config,'family'))root.dataset.builderFamily=config.family;
      if(has(config,'gap'))root.style.gap=`${clampNum(config.gap,7)}px`;
      if(has(config,'runway'))root.style.paddingInline=`${clampNum(config.runway,0)}px`;
      if(has(config,'accentColor'))root.style.setProperty('--builder-filter-accent',config.accentColor||'#202226');
      if(has(config,'surfaceOpacity'))root.style.setProperty('--builder-filter-opacity',String(clampNum(config.surfaceOpacity,100)/100));
      if(has(config,'blur'))root.style.setProperty('--builder-filter-blur',`${clampNum(config.blur,0)}px`);
      if(has(config,'response')){
        const ms=config.response==='lively'?140:config.response==='standard'?190:240;
        $$('.collection-filter',root).forEach(button=>button.style.transitionDuration=`${ms}ms`);
      }
    });
  }

  function applySheet(config){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');if(!sheet)return;
    if(has(config,'enabled')&&!bool(config.enabled,true)){sheet.hidden=true;if(backdrop)backdrop.hidden=true;return;}
    if(backdrop){
      if(has(config,'backdropBlur')||has(config,'backdrop')){
        const blur=bool(config.backdrop,true)?clampNum(config.backdropBlur,12):0;backdrop.style.backdropFilter=`blur(${blur}px)`;backdrop.style.webkitBackdropFilter=backdrop.style.backdropFilter;
      }
      if(has(config,'backdrop')){if(!bool(config.backdrop,true))backdrop.style.background='transparent';else backdrop.style.removeProperty('background');}
    }
    if(has(config,'maxWidth'))sheet.style.maxWidth=`${clampNum(config.maxWidth,760)}px`;
    if(has(config,'maxHeightDvh'))sheet.style.height=`min(${clampNum(config.maxHeightDvh,84)}dvh,780px)`;
    if(has(config,'radiusTop'))sheet.style.borderRadius=`${clampNum(config.radiusTop,30)}px ${clampNum(config.radiusTop,30)}px 0 0`;
    if(has(config,'sheetBlur')||has(config,'sheetSaturation')){
      sheet.style.backdropFilter=`blur(${clampNum(config.sheetBlur,26)}px) saturate(${clampNum(config.sheetSaturation,135)}%)`;sheet.style.webkitBackdropFilter=sheet.style.backdropFilter;
    }
    const toggles=[['handle','.collection-handle-wrap'],['tabs','.collection-tabs'],['search','.collection-search'],['filters','.collection-filters'],['deviceHandoff','#collectionDeviceLink']];
    for(const [key,selector] of toggles)if(has(config,key)){const node=$(selector,sheet);if(node)node.hidden=!bool(config[key],true);}
    if(has(config,'bulkSelection'))$$('.collection-select-toggle',sheet).forEach(node=>node.hidden=!bool(config.bulkSelection,true));
    if(has(config,'themeSelector'))$$('.theme-choice',sheet).forEach(node=>node.hidden=!bool(config.themeSelector,true));
  }

  function applyDevice(config){
    const link=$('#collectionDeviceLink'),accordion=$('.collection-device-accordion'),panel=$('.collection-device-panel-v2');
    if(has(config,'enabled')&&link)link.hidden=!bool(config.enabled,true);
    if(panel){
      if(has(config,'response'))panel.style.transitionDuration=config.response==='lively'?'140ms':config.response==='calm'?'260ms':'190ms';
      if(has(config,'copyAction'))$$('[data-device-panel-copy]',panel).forEach(node=>node.hidden=!bool(config.copyAction,true));
      if(has(config,'connectAction'))$$('[data-device-panel-connect]',panel).forEach(node=>node.hidden=!bool(config.connectAction,true));
      if(has(config,'statusMessage'))$$('.collection-device-panel__status',panel).forEach(node=>node.hidden=!bool(config.statusMessage,true));
    }
    if(accordion&&has(config,'response'))accordion.dataset.builderResponse=config.response;
  }

  function applyProgress(config){
    $$('.nav-chapter-progress,.read-progress').forEach(node=>{
      if(has(config,'enabled'))node.hidden=!bool(config.enabled,true);
      if(has(config,'opacity'))node.style.opacity=String(clampNum(config.opacity,100)/100);
      if(has(config,'color'))node.style.background=config.color||'#4081ef';
      if(has(config,'thickness')){node.style.height=`${clampNum(config.thickness,2)}px`;node.style.top='auto';node.style.bottom='0';}
    });
  }

  function applyFab(config){
    const fab=$('#collectionFab');if(!fab)return;
    if(has(config,'family'))fab.dataset.builderFamily=config.family;
    if(has(config,'accentColor')){const accent=config.accentColor||'#315fc9';fab.style.background=accent;fab.style.borderColor=rgba(accent,.22);}
    if(has(config,'response'))fab.style.transitionDuration=config.response==='lively'?'130ms':config.response==='calm'?'240ms':'180ms';
  }

  function apply(id,config={}){
    installStyle();reset(id);
    if(id==='top-chapter-navigation')applyNav(config);
    else if(id==='horizontal-card-rail')applyRail(config);
    else if(id==='filter-chip-rail')applyFilters(config);
    else if(id==='collection-bottom-sheet')applySheet(config);
    else if(id==='device-handoff-accordion')applyDevice(config);
    else if(id==='reading-progress')applyProgress(config);
    else if(id==='floating-action')applyFab(config);
  }

  function setTheme(choice){
    const normalized=['light','dark','system'].includes(choice)?choice:'light';
    if(typeof window.setPhotoRoadmapTheme==='function'){window.setPhotoRoadmapTheme(normalized);return;}
    const dark=normalized==='dark'||(normalized==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.themeChoice=normalized;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-ui-config'&&data.capabilityId)apply(data.capabilityId,data.config||{});
    else if(data.type==='platform-ui-reset'&&data.capabilityId)reset(data.capabilityId);
    else if(data.type==='platform-theme')setTheme(data.theme);
  });

  window.__applySandboxCapabilityConfig=apply;
  window.__resetSandboxCapabilityConfig=reset;
  window.__setSandboxPreviewTheme=setTheme;
})();
