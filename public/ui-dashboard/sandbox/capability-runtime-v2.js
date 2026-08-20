(function(){
  const STORAGE='platformBuilderCapabilityConfigsV2';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const bool=(value,fallback=true)=>typeof value==='boolean'?value:fallback;
  const num=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)?n:fallback;};

  function rgba(hex,alpha){
    const value=String(hex||'#315fc9').replace('#','').trim();
    const normalized=value.length===3?value.split('').map(x=>x+x).join(''):value.padEnd(6,'0').slice(0,6);
    const n=parseInt(normalized,16);
    if(!Number.isFinite(n))return `rgba(49,95,201,${alpha})`;
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;
  }
  function read(){try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function clearStyle(node,...names){names.forEach(name=>node?.style?.removeProperty(name));}
  function hideLegacyProgress(){const legacy=$('.read-progress');if(legacy){legacy.hidden=true;clearStyle(legacy,'height','opacity','background','display','visibility');}}

  function liveStyle(){
    let node=$('#sandbox-capability-live-style');
    if(node)return node;
    node=document.createElement('style');node.id='sandbox-capability-live-style';
    node.textContent=`
      html[data-builder-nav-sticky="static"] .nav-shell{position:relative!important;top:auto!important;transform:none!important}
      html[data-builder-nav-sticky="sticky"] .nav-shell{position:sticky!important;top:0!important;transform:none!important}
      .nav-scroll[data-builder-family="material-flat"]{background:#f1f3f6!important;border-color:rgba(22,30,48,.07)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .nav-scroll[data-builder-family="ios-flat"]{background:rgba(244,247,251,.88)!important;border-color:rgba(22,30,48,.075)!important;box-shadow:0 5px 16px rgba(25,38,62,.06)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}
      .nav-scroll[data-builder-family]:not([data-builder-family="ios-liquid"]) .nav-v33-indicator{display:none!important}
      .nav-scroll[data-builder-family]:not([data-builder-family="ios-liquid"]) .nav-chip.is-active{background:var(--builder-nav-accent,#437ce7)!important;color:#fff!important;box-shadow:none!important}
      .collection-filters[data-builder-family="material-flat"] .collection-filter{border-radius:8px!important;background:#f2f3f5!important;box-shadow:none!important;backdrop-filter:none!important}
      .collection-filters[data-builder-family="ios-flat"] .collection-filter{background:rgba(245,247,250,var(--builder-filter-opacity,1))!important;backdrop-filter:blur(var(--builder-filter-blur,0px))!important;-webkit-backdrop-filter:blur(var(--builder-filter-blur,0px))!important}
      .collection-filters[data-builder-family="ios-liquid"] .collection-filter{background:rgba(245,248,253,var(--builder-filter-opacity,.78))!important;backdrop-filter:blur(var(--builder-filter-blur,18px)) saturate(135%)!important;-webkit-backdrop-filter:blur(var(--builder-filter-blur,18px)) saturate(135%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 5px 16px rgba(30,46,76,.08)!important}
      .collection-filters[data-builder-family] .collection-filter.is-active{background:var(--builder-filter-accent,#202226)!important;color:#fff!important}
      .scroll-row[data-builder-scrollbar="hidden"]{scrollbar-width:none!important}.scroll-row[data-builder-scrollbar="hidden"]::-webkit-scrollbar{display:none!important}
      .scroll-row[data-builder-fade="right"]{-webkit-mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .scroll-row[data-builder-fade="left"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important}
      .scroll-row[data-builder-fade="both"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .collection-fab[data-builder-family="flat"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important}
      .collection-fab[data-builder-family="liquid"]{backdrop-filter:blur(18px) saturate(145%)!important;-webkit-backdrop-filter:blur(18px) saturate(145%)!important;box-shadow:0 8px 22px rgba(34,76,165,.22),inset 0 1px 0 rgba(255,255,255,.35)!important}
    `;
    document.head.appendChild(node);return node;
  }

  function resetNav(){
    const shell=$('.nav-shell'),nav=$('.nav-scroll'),progress=$('.nav-chapter-progress',nav||document);
    if(shell){shell.hidden=false;clearStyle(shell,'position','top','transform','display','visibility');}
    delete document.documentElement.dataset.builderNavSticky;
    if(nav){delete nav.dataset.builderFamily;clearStyle(nav,'gap','padding-left','padding-right','padding-top','padding-bottom','--builder-nav-accent','--builder-motion-duration');}
    const indicator=$('.nav-v33-indicator',nav||document);clearStyle(indicator,'transition-duration');
    if(progress){progress.hidden=false;clearStyle(progress,'background','opacity','top','bottom','height','border-radius','visibility','display');}
    hideLegacyProgress();
  }
  function resetRail(){
    $$('.scroll-row').forEach(row=>{
      delete row.dataset.builderFade;delete row.dataset.builderScrollbar;delete row.dataset.builderDesktopDrag;delete row.dataset.builderDragThreshold;delete row.dataset.builderClickSuppressMs;
      clearStyle(row,'padding-left','padding-right','--builder-fade-right','--builder-fade-left','-webkit-mask-image','mask-image','scrollbar-width');
    });
  }
  function resetFilters(){
    $$('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;clearStyle(root,'gap','padding-left','padding-right','padding-inline','--builder-filter-accent','--builder-filter-opacity','--builder-filter-blur');
      $$('.collection-filter',root).forEach(chip=>clearStyle(chip,'background','color','border-color','border-radius','box-shadow','backdrop-filter','-webkit-backdrop-filter','transition-duration'));
    });
  }
  function resetSheet(){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');
    clearStyle(sheet,'max-width','max-height','height','border-radius','backdrop-filter','-webkit-backdrop-filter');
    clearStyle(backdrop,'backdrop-filter','-webkit-backdrop-filter','background');
  }
  function resetDevice(){
    const row=$('#collectionDeviceLink');if(row)row.hidden=false;
    $$('.collection-device-panel,.collection-device-panel-v2').forEach(panel=>clearStyle(panel,'transition-duration'));
  }
  function resetProgress(){
    const progress=$('.nav-chapter-progress');if(progress){progress.hidden=false;clearStyle(progress,'background','opacity','top','bottom','height','border-radius','display','visibility');}
    hideLegacyProgress();
  }
  function resetFab(){
    const fab=$('#collectionFab');if(!fab)return;delete fab.dataset.builderFamily;clearStyle(fab,'background','border-color','transition-duration','box-shadow','backdrop-filter','-webkit-backdrop-filter');
  }
  function resetBaseline(id){
    if(id==='top-chapter-navigation')resetNav();
    else if(id==='horizontal-card-rail')resetRail();
    else if(id==='filter-chip-rail')resetFilters();
    else if(id==='collection-bottom-sheet')resetSheet();
    else if(id==='device-handoff-accordion')resetDevice();
    else if(id==='reading-progress')resetProgress();
    else if(id==='floating-action')resetFab();
  }

  function applyNav(c){
    const shell=$('.nav-shell'),nav=$('.nav-scroll');if(!shell||!nav)return;
    if(has(c,'enabled'))shell.hidden=!bool(c.enabled,true);
    if(has(c,'stickyMode')){
      const sticky=c.stickyMode;
      document.documentElement.dataset.builderNavSticky=sticky==='static'?'static':sticky==='sticky'?'sticky':'deferred';
      if(sticky==='deferred-sticky'){shell.style.removeProperty('position');shell.style.removeProperty('top');shell.style.removeProperty('transform');}
    }
    if(has(c,'chipFamily'))nav.dataset.builderFamily=c.chipFamily;
    if(has(c,'accentColor'))nav.style.setProperty('--builder-nav-accent',c.accentColor||'#437ce7');
    if(has(c,'mobileChipGap')||has(c,'desktopChipGap'))nav.style.gap=`${innerWidth<1024?num(c.mobileChipGap,6):num(c.desktopChipGap,9)}px`;
    if(has(c,'railInset')){nav.style.paddingTop=`${num(c.railInset,5.5)}px`;nav.style.paddingBottom=`${num(c.railInset,5.5)}px`;}
    const progress=$('.nav-chapter-progress',nav);
    if(progress){
      if(has(c,'progressEnabled'))progress.hidden=!bool(c.progressEnabled,true);
      if(has(c,'progressColor')||has(c,'progressOpacityStart')||has(c,'progressOpacityEnd')){
        const color=c.progressColor||'#4081ef',start=num(c.progressOpacityStart,24)/100,end=num(c.progressOpacityEnd,16)/100;
        progress.style.background=`linear-gradient(90deg,${rgba(color,start)},${rgba(color,end)})`;
      }
      if(has(c,'progressMode')){
        if(c.progressMode==='line'){progress.style.top='auto';progress.style.bottom='0';progress.style.height='2px';progress.style.borderRadius='999px';}
        else clearStyle(progress,'top','bottom','height','border-radius');
      }
    }
    if(has(c,'durationScale')){
      const duration=num(c.durationScale,1.1);nav.style.setProperty('--builder-motion-duration',`${Math.round(260*duration)}ms`);
      const indicator=$('.nav-v33-indicator',nav);if(indicator)indicator.style.transitionDuration=`${Math.round(260*duration)}ms`;
    }
  }
  function applyRail(c){
    $$('.scroll-row').forEach(row=>{
      if(has(c,'leftShadowGuard')||has(c,'leftPaintRunway'))row.style.paddingLeft=`${bool(c.leftShadowGuard,true)?num(c.leftPaintRunway,16):0}px`;
      if(has(c,'rightContentPadding'))row.style.paddingRight=`${num(c.rightContentPadding,122)}px`;
      if(has(c,'rightFadeWidth'))row.style.setProperty('--builder-fade-right',`${num(c.rightFadeWidth,112)}px`);
      if(has(c,'leftPaintRunway'))row.style.setProperty('--builder-fade-left',`${Math.max(18,num(c.leftPaintRunway,16))}px`);
      if(has(c,'leftFade')||has(c,'rightFade')){const left=bool(c.leftFade,false),right=bool(c.rightFade,true);row.dataset.builderFade=left&&right?'both':left?'left':right?'right':'none';if(!left&&!right)clearStyle(row,'-webkit-mask-image','mask-image');}
      if(has(c,'scrollbar'))row.dataset.builderScrollbar=c.scrollbar;
      if(has(c,'desktopDrag'))row.dataset.builderDesktopDrag=String(bool(c.desktopDrag,true));
      if(has(c,'dragThreshold'))row.dataset.builderDragThreshold=String(num(c.dragThreshold,5));
      if(has(c,'clickSuppressMs'))row.dataset.builderClickSuppressMs=String(num(c.clickSuppressMs,220));
    });
  }
  function applyFilters(c){
    $$('.collection-filters').forEach(root=>{
      if(has(c,'family'))root.dataset.builderFamily=c.family;
      if(has(c,'gap'))root.style.gap=`${num(c.gap,7)}px`;
      if(has(c,'runway'))root.style.paddingInline=`${num(c.runway,0)}px`;
      if(has(c,'accentColor'))root.style.setProperty('--builder-filter-accent',c.accentColor||'#202226');
      if(has(c,'surfaceOpacity'))root.style.setProperty('--builder-filter-opacity',String(num(c.surfaceOpacity,100)/100));
      if(has(c,'blur'))root.style.setProperty('--builder-filter-blur',`${num(c.blur,0)}px`);
      if(has(c,'response')){const ms=c.response==='lively'?140:c.response==='standard'?190:240;$$('.collection-filter',root).forEach(button=>button.style.transitionDuration=`${ms}ms`);}
    });
  }
  function applySheet(c){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');if(!sheet)return;
    if(has(c,'enabled')&&!bool(c.enabled,true)){sheet.hidden=true;if(backdrop)backdrop.hidden=true;}
    if(backdrop&&(has(c,'backdrop')||has(c,'backdropBlur'))){const blur=bool(c.backdrop,true)?num(c.backdropBlur,12):0;backdrop.style.backdropFilter=`blur(${blur}px)`;backdrop.style.webkitBackdropFilter=backdrop.style.backdropFilter;if(has(c,'backdrop')&&!bool(c.backdrop,true))backdrop.style.background='transparent';}
    if(has(c,'maxWidth'))sheet.style.maxWidth=`${num(c.maxWidth,760)}px`;
    if(has(c,'maxHeightDvh'))sheet.style.maxHeight=`${num(c.maxHeightDvh,84)}dvh`;
    if(has(c,'radiusTop'))sheet.style.borderRadius=`${num(c.radiusTop,30)}px ${num(c.radiusTop,30)}px 0 0`;
    if(has(c,'sheetBlur')||has(c,'sheetSaturation')){sheet.style.backdropFilter=`blur(${num(c.sheetBlur,26)}px) saturate(${num(c.sheetSaturation,135)}%)`;sheet.style.webkitBackdropFilter=sheet.style.backdropFilter;}
    const handle=$('.collection-handle-wrap',sheet);if(handle&&has(c,'handle'))handle.hidden=!bool(c.handle,true);
    const tabs=$('.collection-tabs',sheet);if(tabs&&has(c,'tabs'))tabs.hidden=!bool(c.tabs,true);
    const search=$('.collection-search',sheet);if(search&&has(c,'search'))search.hidden=!bool(c.search,true);
    const filters=$('.collection-filters',sheet);if(filters&&has(c,'filters'))filters.hidden=!bool(c.filters,true);
    const device=$('#collectionDeviceLink',sheet);if(device&&has(c,'deviceHandoff'))device.hidden=!bool(c.deviceHandoff,true);
  }
  function applyDevice(c){
    const row=$('#collectionDeviceLink');if(row&&has(c,'enabled'))row.hidden=!bool(c.enabled,true);
    const panel=$('.collection-device-panel,.collection-device-panel-v2');
    if(panel&&has(c,'response'))panel.style.transitionDuration=c.response==='lively'?'140ms':c.response==='calm'?'260ms':'190ms';
    if(panel&&has(c,'copyAction'))$$('[data-device-sync-copy]',panel).forEach(button=>button.hidden=!bool(c.copyAction,true));
    if(panel&&has(c,'connectAction'))$$('[data-device-sync-connect]',panel).forEach(button=>button.hidden=!bool(c.connectAction,true));
    if(panel&&has(c,'statusMessage'))$$('.collection-device-panel__status',panel).forEach(status=>status.hidden=!bool(c.statusMessage,true));
  }
  function applyProgress(c){
    const progress=$('.nav-chapter-progress');if(!progress)return;
    if(has(c,'enabled'))progress.hidden=!bool(c.enabled,true);
    if(has(c,'opacity'))progress.style.opacity=String(num(c.opacity,100)/100);
    if(has(c,'color'))progress.style.background=rgba(c.color||'#4081ef',num(c.opacity,100)/100);
    if(has(c,'thickness')){const thickness=num(c.thickness,2);if(thickness>2){progress.style.top='auto';progress.style.bottom='0';progress.style.height=`${thickness}px`;}else clearStyle(progress,'top','bottom','height');}
    hideLegacyProgress();
  }
  function applyFab(c){
    const fab=$('#collectionFab');if(!fab)return;
    if(has(c,'family'))fab.dataset.builderFamily=c.family;
    if(has(c,'accentColor')){fab.style.background=c.accentColor||'#315fc9';fab.style.borderColor=rgba(c.accentColor||'#315fc9',.22);}
    if(has(c,'response'))fab.style.transitionDuration=c.response==='lively'?'130ms':c.response==='calm'?'240ms':'180ms';
  }

  function apply(id,config){
    if(!config||typeof config!=='object')return;
    liveStyle();
    if(id==='top-chapter-navigation')applyNav(config);
    else if(id==='horizontal-card-rail')applyRail(config);
    else if(id==='filter-chip-rail')applyFilters(config);
    else if(id==='collection-bottom-sheet')applySheet(config);
    else if(id==='device-handoff-accordion')applyDevice(config);
    else if(id==='reading-progress')applyProgress(config);
    else if(id==='floating-action')applyFab(config);
  }
  function applyAll(){const all=read();Object.entries(all).forEach(([id,config])=>{resetBaseline(id);apply(id,config);});hideLegacyProgress();}

  window.addEventListener('message',event=>{
    const data=event.data||{};
    if(data.type==='platform-ui-reset-baseline'&&data.capabilityId)resetBaseline(data.capabilityId);
    if(data.type==='platform-ui-config'&&data.capabilityId){resetBaseline(data.capabilityId);apply(data.capabilityId,data.config||{});}
    if(data.type==='platform-ui-config-all')Object.entries(data.configs||{}).forEach(([id,config])=>{resetBaseline(id);apply(id,config||{});});
  });
  window.addEventListener('storage',event=>{if(event.key===STORAGE)applyAll();});
  document.addEventListener('click',()=>setTimeout(applyAll,0),true);
  [0,120,500,1200].forEach(delay=>setTimeout(applyAll,delay));
  hideLegacyProgress();
  window.__applySandboxCapabilityConfig=apply;
  window.__resetSandboxCapabilityBaseline=resetBaseline;
})();
