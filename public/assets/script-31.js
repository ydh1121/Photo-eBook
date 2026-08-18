/* v4: desktop-only measured nav + delegated mouse-grab rails.
   No wheel translation, no mobile visual/input mutations. */
(function(){
  if(window.__photoDesktopPassV4Installed)return;
  window.__photoDesktopPassV4Installed=true;

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

  function railFrom(target){
    return target?.closest?.(RAIL_SELECTOR)||null;
  }

  function syncDesktopNavWidth(){
    const nav=$('.nav-scroll');
    if(!nav)return;
    if(!desktop.matches){
      nav.style.removeProperty('--desktop-nav-width');
      return;
    }
    const chips=$$('.nav-chip',nav);
    if(!chips.length)return;
    const css=getComputedStyle(nav);
    const gap=parseFloat(css.columnGap||css.gap)||0;
    const padLeft=parseFloat(css.paddingLeft)||0;
    const padRight=parseFloat(css.paddingRight)||0;
    const chipWidth=chips.reduce((sum,chip)=>sum+chip.getBoundingClientRect().width,0);
    const width=Math.ceil(chipWidth+gap*Math.max(0,chips.length-1)+padLeft+padRight+2);
    nav.style.setProperty('--desktop-nav-width',`${width}px`);
    if(nav.scrollWidth<=nav.clientWidth+2)nav.scrollLeft=0;
    requestAnimationFrame(()=>{
      try{nav.__photoLiquidController?.update?.({instant:true});}catch{}
    });
  }

  function ensureRailWindow(rail){
    if(!rail||!rail.isConnected||!desktop.matches)return;
    if(rail.parentElement?.classList.contains('desktop-rail-window'))return;
    const parent=rail.parentNode;
    if(!parent)return;
    const wrapper=document.createElement('div');
    wrapper.className='desktop-rail-window';
    parent.insertBefore(wrapper,rail);
    wrapper.appendChild(rail);
  }

  function prepareRailContent(root=document){
    $$(RAIL_SELECTOR,root).forEach(rail=>{
      ensureRailWindow(rail);
      $$('img,a',rail).forEach(node=>{
        try{node.draggable=false;}catch{}
      });
    });
  }

  function unwrapRailWindows(){
    $$('.desktop-rail-window').forEach(wrapper=>{
      const parent=wrapper.parentNode;
      if(!parent)return;
      while(wrapper.firstChild)parent.insertBefore(wrapper.firstChild,wrapper);
      wrapper.remove();
    });
  }

  function repairDesktopActions(){
    if(!desktop.matches)return;
    $$('#askOpenChatGPT,.v34-chatgpt-open').forEach(button=>{
      if('disabled'in button)button.disabled=false;
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    });
  }

  function prepareDesktop(){
    if(!desktop.matches){
      unwrapRailWindows();
      syncDesktopNavWidth();
      return;
    }
    syncDesktopNavWidth();
    prepareRailContent();
    repairDesktopActions();
  }

  function schedulePrepare(){
    if(prepareRaf)return;
    prepareRaf=requestAnimationFrame(()=>{
      prepareRaf=0;
      prepareDesktop();
    });
  }

  /* Delegated input means dynamically rendered practical/video/article rails do
     not need a second binding pass. overflow-x:hidden on desktop prevents wheel
     and trackpad from owning horizontal movement; only this mouse gesture writes
     scrollLeft. */
  document.addEventListener('dragstart',event=>{
    if(!desktop.matches||!railFrom(event.target))return;
    event.preventDefault();
  },true);

  document.addEventListener('selectstart',event=>{
    if(!desktop.matches||!railFrom(event.target))return;
    event.preventDefault();
  },true);

  document.addEventListener('pointerdown',event=>{
    if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
    const rail=railFrom(event.target);
    if(!rail)return;
    if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;

    activeRail=rail;
    pointerId=event.pointerId;
    startX=event.clientX;
    startScroll=rail.scrollLeft;
    dragging=false;
    suppressRail=null;
    suppressUntil=0;
    rail.classList.add('is-desktop-pointerdown');
  },true);

  document.addEventListener('pointermove',event=>{
    if(!desktop.matches||!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    const dx=event.clientX-startX;
    if(!dragging&&Math.abs(dx)<5)return;
    if(!dragging){
      dragging=true;
      activeRail.classList.add('is-desktop-dragging');
      try{activeRail.setPointerCapture(pointerId);}catch{}
    }
    activeRail.scrollLeft=startScroll-dx;
    if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  function finishPointer(event){
    if(!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    const rail=activeRail;
    const didDrag=dragging;
    rail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');
    try{rail.releasePointerCapture(pointerId);}catch{}
    activeRail=null;
    pointerId=null;
    dragging=false;
    if(didDrag){
      suppressRail=rail;
      suppressUntil=performance.now()+220;
    }
  }

  document.addEventListener('pointerup',finishPointer,true);
  document.addEventListener('pointercancel',finishPointer,true);
  document.addEventListener('lostpointercapture',event=>{
    if(!activeRail||pointerId===null||event.pointerId!==pointerId)return;
    activeRail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');
    activeRail=null;
    pointerId=null;
    dragging=false;
  },true);

  document.addEventListener('click',event=>{
    if(!suppressRail||performance.now()>suppressUntil){
      suppressRail=null;
      return;
    }
    const rail=railFrom(event.target);
    if(rail!==suppressRail)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressRail=null;
  },true);

  function openDeviceSync(){
    const close=$('#collectionClose');
    if(close)close.click();

    const open=()=>{
      const fab=$('#askFab');
      const sheet=$('#askSheet');
      const backdrop=$('#askBackdrop');
      const historyTab=$('#askHistoryTab');

      fab?.click();

      setTimeout(()=>{
        if(sheet?.hidden){
          sheet.hidden=false;
          if(backdrop)backdrop.hidden=false;
          document.body.classList.add('is-modal-open');
        }
        historyTab?.click();
        setTimeout(()=>{
          const login=$('#askHistoryPanel .login-card');
          login?.scrollIntoView?.({block:'nearest'});
          try{$('#copySyncKey')?.focus?.({preventScroll:true});}catch{}
        },90);
      },70);
    };

    setTimeout(open,close?260:0);
  }

  document.addEventListener('click',event=>{
    const deviceLink=event.target.closest?.('#collectionDeviceLink');
    if(deviceLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      openDeviceSync();
      return;
    }

    if(event.target.closest?.('#collectionFab,.collection-tab,[data-v40-qmode]')){
      [0,100,260].forEach(delay=>setTimeout(schedulePrepare,delay));
    }
  },true);

  function watchDynamicRails(){
    const app=$('#app');
    if(!app||app.dataset.desktopRailWatchV4==='true')return;
    app.dataset.desktopRailWatchV4='true';
    const observer=new MutationObserver(()=>schedulePrepare());
    observer.observe(app,{childList:true,subtree:true});
  }

  function init(){
    watchDynamicRails();
    prepareDesktop();
    [120,420,1200].forEach(delay=>setTimeout(schedulePrepare,delay));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(init,100),{passive:true});
  window.addEventListener('resize',schedulePrepare,{passive:true});
  desktop.addEventListener?.('change',()=>{
    if(!desktop.matches)unwrapRailWindows();
    schedulePrepare();
  });
})();
