/* v2: desktop content-rail input + current cross-device sync routing. No mobile visual mutations. */
(function(){
  if(window.__photoDesktopPassV2Installed)return;
  window.__photoDesktopPassV2Installed=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,#curatedLinksRow,#skillsInfiniteRow';

  function bindDesktopRail(rail){
    if(!rail||rail.dataset.desktopRailV2==='true')return;
    rail.dataset.desktopRailV2='true';

    let pointerId=null;
    let startX=0;
    let startScroll=0;
    let dragging=false;
    let suppressClick=false;

    rail.addEventListener('wheel',event=>{
      if(!desktop.matches)return;
      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      if(max<2)return;
      const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
      if(!delta)return;
      const canMove=delta>0?rail.scrollLeft<max-1:rail.scrollLeft>1;
      if(!canMove)return;
      event.preventDefault();
      rail.scrollLeft+=delta;
    },{passive:false});

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      pointerId=event.pointerId;
      startX=event.clientX;
      startScroll=rail.scrollLeft;
      dragging=false;
      suppressClick=false;
      try{rail.setPointerCapture(pointerId);}catch{}
    });

    rail.addEventListener('pointermove',event=>{
      if(!desktop.matches||pointerId===null||event.pointerId!==pointerId)return;
      const dx=event.clientX-startX;
      if(!dragging&&Math.abs(dx)<4)return;
      dragging=true;
      rail.classList.add('is-desktop-dragging');
      rail.scrollLeft=startScroll-dx;
      event.preventDefault();
    },{passive:false});

    const finishPointer=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      suppressClick=dragging;
      dragging=false;
      rail.classList.remove('is-desktop-dragging');
      try{rail.releasePointerCapture(pointerId);}catch{}
      pointerId=null;
      if(suppressClick)setTimeout(()=>{suppressClick=false;},140);
    };
    rail.addEventListener('pointerup',finishPointer);
    rail.addEventListener('pointercancel',finishPointer);

    rail.addEventListener('click',event=>{
      if(!suppressClick)return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);
  }

  function bindDesktopRails(){
    if(!desktop.matches)return;
    $$(RAIL_SELECTOR).forEach(bindDesktopRail);
  }

  function repairDesktopActions(){
    if(!desktop.matches)return;
    $$('#askOpenChatGPT,.v34-chatgpt-open').forEach(button=>{
      if('disabled'in button)button.disabled=false;
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    });
  }

  function openDeviceSync(){
    const close=$('#collectionClose');
    if(close)close.click();

    const open=()=>{
      const fab=$('#askFab');
      const sheet=$('#askSheet');
      const backdrop=$('#askBackdrop');
      const historyTab=$('#askHistoryTab');

      /* Use the current drawer owner first. HTMLElement.click() also works
         while the launcher is visually hidden. */
      fab?.click();

      setTimeout(()=>{
        /* Defensive fallback for a stale launcher state. This changes only the
           opened sync workflow, never the normal mobile/desktop layout. */
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

  /* script-14 still points this setting at a retired .ask-settings-btn.
     Capture the dynamic settings row before that stale element listener and
     route it to the live sync-key controls in script-5. */
  document.addEventListener('click',event=>{
    const deviceLink=event.target.closest?.('#collectionDeviceLink');
    if(deviceLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      openDeviceSync();
      return;
    }

    if(event.target.closest?.('#collectionFab,.collection-tab,[data-v40-qmode]')){
      [0,80,220].forEach(delay=>setTimeout(()=>{
        bindDesktopRails();
        repairDesktopActions();
      },delay));
    }
  },true);

  function refresh(){
    bindDesktopRails();
    repairDesktopActions();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  [120,420,1000,2200].forEach(delay=>setTimeout(refresh,delay));
  window.addEventListener('pageshow',()=>setTimeout(refresh,120),{passive:true});
  window.addEventListener('resize',()=>setTimeout(refresh,80),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
