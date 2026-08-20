/* v7: desktop delegated mouse-grab rails with builder-live tuning support. */
(function(){
  if(window.__photoDesktopPassV7Installed)return;
  window.__photoDesktopPassV7Installed=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,.skills-infinite-row,.curated-links-row,#skillsInfiniteRow,#curatedLinksRow';

  let activeRail=null;
  let pointerId=null;
  let startX=0;
  let startScroll=0;
  let dragging=false;
  let suppressRail=null;
  let suppressUntil=0;
  let prepareRaf=0;

  function railFrom(target){return target?.closest?.(RAIL_SELECTOR)||null;}
  function dragEnabled(rail){return rail?.dataset.builderDesktopDrag!=='false';}
  function dragThreshold(rail){const n=Number(rail?.dataset.builderDragThreshold);return Number.isFinite(n)?Math.max(1,n):5;}
  function clickSuppressMs(rail){const n=Number(rail?.dataset.builderClickSuppressMs);return Number.isFinite(n)?Math.max(0,n):220;}

  function syncRailEdgeState(rail){
    if(!rail)return;
    const wrapper=rail.parentElement;
    if(!wrapper?.classList.contains('desktop-rail-window'))return;
    wrapper.classList.toggle('is-scrolled-x',rail.scrollLeft>1);
  }

  function ensureRailWindow(rail){
    if(!rail||!rail.isConnected||!desktop.matches)return null;
    let wrapper=rail.parentElement?.classList.contains('desktop-rail-window')?rail.parentElement:null;
    if(!wrapper){
      const parent=rail.parentNode;
      if(!parent)return null;
      wrapper=document.createElement('div');
      wrapper.className='desktop-rail-window';
      parent.insertBefore(wrapper,rail);
      wrapper.appendChild(rail);
    }
    syncRailEdgeState(rail);
    return wrapper;
  }

  function prepareRail(rail){
    if(!rail||!desktop.matches)return;
    ensureRailWindow(rail);
    if(dragEnabled(rail))$$('img,a',rail).forEach(node=>{try{node.draggable=false;}catch{}});
  }

  function prepareRailContent(root=document){$$(RAIL_SELECTOR,root).forEach(prepareRail);}
  function unwrapRailWindows(){
    $$('.desktop-rail-window').forEach(wrapper=>{
      const parent=wrapper.parentNode;if(!parent)return;
      while(wrapper.firstChild)parent.insertBefore(wrapper.firstChild,wrapper);
      wrapper.remove();
    });
  }
  function repairDesktopActions(){
    if(!desktop.matches)return;
    $$('#askOpenChatGPT,.v34-chatgpt-open').forEach(button=>{
      if('disabled'in button)button.disabled=false;
      button.removeAttribute('disabled');button.removeAttribute('aria-disabled');
    });
  }
  function prepareDesktop(){if(!desktop.matches){unwrapRailWindows();return;}prepareRailContent();repairDesktopActions();}
  function schedulePrepare(){if(prepareRaf)return;prepareRaf=requestAnimationFrame(()=>{prepareRaf=0;prepareDesktop();});}

  document.addEventListener('dragstart',event=>{
    if(!desktop.matches)return;const rail=railFrom(event.target);if(!rail||!dragEnabled(rail))return;event.preventDefault();
  },true);
  document.addEventListener('selectstart',event=>{
    if(!desktop.matches)return;const rail=railFrom(event.target);if(!rail||!dragEnabled(rail))return;event.preventDefault();
  },true);

  document.addEventListener('pointerdown',event=>{
    if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
    const rail=railFrom(event.target);if(!rail||!dragEnabled(rail))return;
    if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
    activeRail=rail;pointerId=event.pointerId;startX=event.clientX;startScroll=rail.scrollLeft;dragging=false;suppressRail=null;suppressUntil=0;rail.classList.add('is-desktop-pointerdown');
  },true);

  document.addEventListener('pointermove',event=>{
    if(!desktop.matches||!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    if(!dragEnabled(activeRail)){activeRail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');activeRail=null;pointerId=null;dragging=false;return;}
    const dx=event.clientX-startX;
    if(!dragging&&Math.abs(dx)<dragThreshold(activeRail))return;
    if(!dragging){dragging=true;activeRail.classList.add('is-desktop-dragging');try{activeRail.setPointerCapture(pointerId);}catch{}}
    activeRail.scrollLeft=startScroll-dx;syncRailEdgeState(activeRail);if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  function finishPointer(event){
    if(!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    const rail=activeRail,didDrag=dragging;rail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');
    try{rail.releasePointerCapture(pointerId);}catch{}
    activeRail=null;pointerId=null;dragging=false;syncRailEdgeState(rail);
    if(didDrag){suppressRail=rail;suppressUntil=performance.now()+clickSuppressMs(rail);}
  }
  document.addEventListener('pointerup',finishPointer,true);
  document.addEventListener('pointercancel',finishPointer,true);
  document.addEventListener('lostpointercapture',event=>{
    if(!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    const rail=activeRail;rail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');activeRail=null;pointerId=null;dragging=false;syncRailEdgeState(rail);
  },true);
  document.addEventListener('scroll',event=>{if(!desktop.matches)return;const rail=railFrom(event.target);if(rail)syncRailEdgeState(rail);},true);
  document.addEventListener('click',event=>{
    if(!suppressRail||performance.now()>suppressUntil){suppressRail=null;return;}
    const rail=railFrom(event.target);if(rail!==suppressRail)return;event.preventDefault();event.stopImmediatePropagation();suppressRail=null;
  },true);

  function openDeviceSync(){
    const close=$('#collectionClose');if(close)close.click();
    const open=()=>{
      const fab=$('#askFab'),sheet=$('#askSheet'),backdrop=$('#askBackdrop'),historyTab=$('#askHistoryTab');fab?.click();
      setTimeout(()=>{if(sheet?.hidden){sheet.hidden=false;if(backdrop)backdrop.hidden=false;document.body.classList.add('is-modal-open');}historyTab?.click();setTimeout(()=>{const login=$('#askHistoryPanel .login-card');login?.scrollIntoView?.({block:'nearest'});try{$('#copySyncKey')?.focus?.({preventScroll:true});}catch{}},90);},70);
    };
    setTimeout(open,close?260:0);
  }

  document.addEventListener('click',event=>{
    const deviceLink=event.target.closest?.('#collectionDeviceLink');
    if(deviceLink){
      /* The current device-handoff compat owns this row. Do not run the retired
         close-sheet -> question-modal path when that runtime is installed. */
      if(window.__photoDesktopRailPolishV1Installed)return;
      event.preventDefault();event.stopImmediatePropagation();openDeviceSync();return;
    }
    if(event.target.closest?.('#collectionFab,.collection-tab,[data-v40-qmode]'))[0,100,260].forEach(delay=>setTimeout(schedulePrepare,delay));
  },true);

  function nodeMayContainRail(node){return node?.nodeType===1&&(node.matches?.(RAIL_SELECTOR)||node.querySelector?.(RAIL_SELECTOR));}
  function watchDynamicRails(){
    const app=$('#app');if(!app||app.dataset.desktopRailWatchV7==='true')return;app.dataset.desktopRailWatchV7='true';
    new MutationObserver(records=>{if(!desktop.matches)return;for(const record of records){if([...record.addedNodes].some(nodeMayContainRail)){schedulePrepare();return;}}}).observe(app,{childList:true,subtree:true});
  }
  function init(){watchDynamicRails();prepareDesktop();[120,420].forEach(delay=>setTimeout(schedulePrepare,delay));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('pageshow',()=>setTimeout(init,100),{passive:true});window.addEventListener('resize',schedulePrepare,{passive:true});desktop.addEventListener?.('change',()=>{if(!desktop.matches)unwrapRailWindows();schedulePrepare();});
})();
