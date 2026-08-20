(function(){
  const STORAGE='platformBuilderCapabilityConfigsV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function rgba(hex,alpha){
    const value=String(hex||'#315fc9').replace('#','').trim();
    const h=value.length===3?value.split('').map(x=>x+x).join(''):value.padEnd(6,'0').slice(0,6);
    const n=parseInt(h,16);if(!Number.isFinite(n))return `rgba(49,95,201,${alpha})`;
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;
  }
  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function bool(v,fallback=true){return typeof v==='boolean'?v:fallback;}
  function num(v,fallback){const n=Number(v);return Number.isFinite(n)?n:fallback;}
  function style(){
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
      .collection-filters .collection-filter.is-active{background:var(--builder-filter-accent,#202226)!important;color:#fff!important}
      .scroll-row[data-builder-scrollbar="hidden"]{scrollbar-width:none!important}.scroll-row[data-builder-scrollbar="hidden"]::-webkit-scrollbar{display:none!important}
      .scroll-row[data-builder-fade="right"]{-webkit-mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,#000 0,#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .scroll-row[data-builder-fade="left"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 100%)!important}
      .scroll-row[data-builder-fade="both"]{-webkit-mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important;mask-image:linear-gradient(to right,transparent 0,#000 var(--builder-fade-left,28px),#000 calc(100% - var(--builder-fade-right,112px)),transparent 100%)!important}
      .collection-fab[data-builder-family="flat"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important}
      .collection-fab[data-builder-family="liquid"]{backdrop-filter:blur(18px) saturate(145%)!important;-webkit-backdrop-filter:blur(18px) saturate(145%)!important;box-shadow:0 8px 22px rgba(34,76,165,.22),inset 0 1px 0 rgba(255,255,255,.35)!important}
    `;
    document.head.appendChild(node);return node;
  }

  function applyNav(c={}){
    const shell=$('.nav-shell'),nav=$('.nav-scroll');if(!shell||!nav)return;
    shell.hidden=!bool(c.enabled,true);
    const sticky=c.stickyMode||'deferred-sticky';
    document.documentElement.dataset.builderNavSticky=sticky==='static'?'static':sticky==='sticky'?'sticky':'deferred';
    if(sticky==='deferred-sticky'){shell.style.removeProperty('position');shell.style.removeProperty('top');shell.style.removeProperty('transform');}
    nav.dataset.builderFamily=c.chipFamily||'ios-liquid';
    const accent=c.accentColor||'#437ce7';nav.style.setProperty('--builder-nav-accent',accent);
    const gap=innerWidth<1024?num(c.mobileChipGap,6):num(c.desktopChipGap,9);nav.style.gap=`${gap}px`;
    const inset=num(c.railInset,5.5);nav.style.paddingTop=`${inset}px`;nav.style.paddingBottom=`${inset}px`;
    const progress=$('.nav-chapter-progress',nav);if(progress){
      progress.hidden=!bool(c.progressEnabled,true);
      const color=c.progressColor||'#4081ef';
      const a=num(c.progressOpacityStart,24)/100,b=num(c.progressOpacityEnd,16)/100;
      progress.style.background=`linear-gradient(90deg,${rgba(color,a)},${rgba(color,b)})`;
      if((c.progressMode||'chapter-wash')==='line'){progress.style.top='auto';progress.style.bottom='0';progress.style.height='2px';progress.style.borderRadius='999px';}
      else{progress.style.removeProperty('top');progress.style.removeProperty('bottom');progress.style.removeProperty('height');progress.style.removeProperty('border-radius');}
    }
    const duration=num(c.durationScale,1.1);nav.style.setProperty('--builder-motion-duration',`${Math.round(260*duration)}ms`);
    const indicator=$('.nav-v33-indicator',nav);if(indicator)indicator.style.transitionDuration=`${Math.round(260*duration)}ms`;
  }

  function applyRail(c={}){
    $$('.scroll-row').forEach(row=>{
      const left=bool(c.leftShadowGuard,true)?num(c.leftPaintRunway,16):0;
      const right=num(c.rightContentPadding,122);
      row.style.paddingLeft=`${left}px`;row.style.paddingRight=`${right}px`;
      row.style.setProperty('--builder-fade-right',`${num(c.rightFadeWidth,112)}px`);
      row.style.setProperty('--builder-fade-left',`${Math.max(18,left)}px`);
      const l=bool(c.leftFade,false),r=bool(c.rightFade,true);row.dataset.builderFade=l&&r?'both':l?'left':r?'right':'none';
      if(!l&&!r){row.style.removeProperty('-webkit-mask-image');row.style.removeProperty('mask-image');}
      row.dataset.builderScrollbar=c.scrollbar||'hidden';
      row.dataset.builderDesktopDrag=String(bool(c.desktopDrag,true));
      row.dataset.builderDragThreshold=String(num(c.dragThreshold,5));
      row.dataset.builderClickSuppressMs=String(num(c.clickSuppressMs,220));
    });
  }

  function applyFilters(c={}){
    $$('.collection-filters').forEach(root=>{
      root.dataset.builderFamily=c.family||'ios-flat';
      root.style.gap=`${num(c.gap,7)}px`;root.style.paddingInline=`${num(c.runway,0)}px`;
      root.style.setProperty('--builder-filter-accent',c.accentColor||'#202226');
      root.style.setProperty('--builder-filter-opacity',String(num(c.surfaceOpacity,100)/100));
      root.style.setProperty('--builder-filter-blur',`${num(c.blur,0)}px`);
      const ms=(c.response||'calm')==='lively'?140:(c.response||'calm')==='standard'?190:240;
      $$('.collection-filter',root).forEach(button=>button.style.transitionDuration=`${ms}ms`);
    });
  }

  function applySheet(c={}){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');if(!sheet)return;
    if(!bool(c.enabled,true)){sheet.hidden=true;if(backdrop)backdrop.hidden=true;return;}
    if(backdrop){backdrop.style.backdropFilter=`blur(${bool(c.backdrop,true)?num(c.backdropBlur,12):0}px)`;backdrop.style.webkitBackdropFilter=backdrop.style.backdropFilter;if(!bool(c.backdrop,true))backdrop.style.background='transparent';else backdrop.style.removeProperty('background');}
    sheet.style.maxWidth=`${num(c.maxWidth,760)}px`;sheet.style.maxHeight=`${num(c.maxHeightDvh,84)}dvh`;sheet.style.borderRadius=`${num(c.radiusTop,30)}px ${num(c.radiusTop,30)}px 0 0`;
    sheet.style.backdropFilter=`blur(${num(c.sheetBlur,26)}px) saturate(${num(c.sheetSaturation,135)}%)`;sheet.style.webkitBackdropFilter=sheet.style.backdropFilter;
    const handle=$('.collection-handle-wrap',sheet);if(handle)handle.hidden=!bool(c.handle,true);
    const tabs=$('.collection-tabs',sheet);if(tabs)tabs.hidden=!bool(c.tabs,true);
    const search=$('.collection-search',sheet);if(search)search.hidden=!bool(c.search,true);
    const filters=$('.collection-filters',sheet);if(filters)filters.hidden=!bool(c.filters,true);
    $$('.collection-select-toggle',sheet).forEach(x=>x.hidden=!bool(c.bulkSelection,true));
    $$('.theme-choice',sheet).forEach(x=>x.hidden=!bool(c.themeSelector,true));
    const device=$('#collectionDeviceLink',sheet);if(device)device.hidden=!bool(c.deviceHandoff,true);
  }

  function applyDevice(c={}){
    const enabled=bool(c.enabled,true);
    const row=$('#collectionDeviceLink'),panel=$('.collection-device-panel');if(row)row.hidden=!enabled;
    if(panel&&!enabled)panel.hidden=true;
    if(panel){
      panel.style.transitionDuration=(c.response||'standard')==='lively'?'140ms':(c.response||'standard')==='calm'?'260ms':'190ms';
      $$('[data-device-sync-copy]',panel).forEach(x=>x.hidden=!bool(c.copyAction,true));
      $$('[data-device-sync-connect]',panel).forEach(x=>x.hidden=!bool(c.connectAction,true));
      $$('.collection-device-panel__status',panel).forEach(x=>x.hidden=!bool(c.statusMessage,true));
    }
  }

  function applyProgress(c={}){
    const nodes=$$('.nav-chapter-progress,.read-progress');nodes.forEach(node=>{node.hidden=!bool(c.enabled,true);node.style.opacity=String(num(c.opacity,100)/100);});
    const progress=$('.nav-chapter-progress');if(progress){
      progress.style.background=rgba(c.color||'#4081ef',num(c.opacity,100)/100);
      if(num(c.thickness,2)>2){progress.style.top='auto';progress.style.bottom='0';progress.style.height=`${num(c.thickness,2)}px`;}
      else{progress.style.removeProperty('top');progress.style.removeProperty('bottom');progress.style.removeProperty('height');}
    }
  }

  function applyFab(c={}){
    const fab=$('#collectionFab');if(!fab)return;fab.dataset.builderFamily=c.family||'glass';
    const accent=c.accentColor||'#315fc9';fab.style.background=accent;fab.style.borderColor=rgba(accent,.22);
    const ms=(c.response||'standard')==='lively'?130:(c.response||'standard')==='calm'?240:180;fab.style.transitionDuration=`${ms}ms`;
  }

  function apply(id,c){
    style();
    if(id==='top-chapter-navigation')applyNav(c);
    else if(id==='horizontal-card-rail')applyRail(c);
    else if(id==='filter-chip-rail')applyFilters(c);
    else if(id==='collection-bottom-sheet')applySheet(c);
    else if(id==='device-handoff-accordion')applyDevice(c);
    else if(id==='reading-progress')applyProgress(c);
    else if(id==='floating-action')applyFab(c);
  }
  function applyAll(){const all=read();Object.entries(all).forEach(([id,c])=>apply(id,c||{}));}

  window.addEventListener('message',event=>{const d=event.data||{};if(d.type==='platform-ui-config'&&d.capabilityId)apply(d.capabilityId,d.config||{});if(d.type==='platform-ui-config-all')Object.entries(d.configs||{}).forEach(([id,c])=>apply(id,c||{}));});
  window.addEventListener('storage',event=>{if(event.key===STORAGE)applyAll();});
  document.addEventListener('click',()=>setTimeout(applyAll,0),true);
  [0,120,500,1200].forEach(delay=>setTimeout(applyAll,delay));
  window.__applySandboxCapabilityConfig=apply;
})();
