/* v3: desktop mouse-only content rails + current cross-device sync routing.
   Vertical wheel input always stays vertical; mobile visual/input behavior is untouched. */
(function(){
  if(window.__photoDesktopPassV3Installed)return;
  window.__photoDesktopPassV3Installed=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,.skills-infinite-row,.curated-links-row,#skillsInfiniteRow,#curatedLinksRow';

  function wheelPixels(event){
    if(event.deltaMode===1)return event.deltaY*20;
    if(event.deltaMode===2)return event.deltaY*window.innerHeight;
    return event.deltaY;
  }

  function bindDesktopRail(rail){
    if(!rail||rail.dataset.desktopRailV3==='true')return;
    rail.dataset.desktopRailV3='true';

    let pointerId=null;
    let startX=0;
    let startScroll=0;
    let dragging=false;
    let suppressClick=false;

    /* A wheel/trackpad gesture over a horizontal rail must never consume the
       page's vertical scrolling or move the rail sideways. Horizontal movement
       is owned only by the mouse grab gesture below. */
    rail.addEventListener('wheel',event=>{
      if(!desktop.matches)return;
      const y=wheelPixels(event);
      if(event.cancelable)event.preventDefault();
      event.stopImmediatePropagation();
      if(y){
        const root=document.scrollingElement||document.documentElement;
        root.scrollTop+=y;
      }
    },{capture:true,passive:false});

    rail.addEventListener('dragstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('selectstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      pointerId=event.pointerId;
      startX=event.clientX;
      startScroll=rail.scrollLeft;
      dragging=false;
      suppressClick=false;
      rail.classList.add('is-desktop-pointerdown');
    },true);

    rail.addEventListener('pointermove',event=>{
      if(!desktop.matches||pointerId===null||event.pointerId!==pointerId)return;
      const dx=event.clientX-startX;
      if(!dragging&&Math.abs(dx)<5)return;
      if(!dragging){
        dragging=true;
        rail.classList.add('is-desktop-dragging');
        try{rail.setPointerCapture(pointerId);}catch{}
      }
      rail.scrollLeft=startScroll-dx;
      if(event.cancelable)event.preventDefault();
    },{passive:false});

    const finishPointer=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      suppressClick=dragging;
      dragging=false;
      rail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');
      try{rail.releasePointerCapture(pointerId);}catch{}
      pointerId=null;
      if(suppressClick)setTimeout(()=>{suppressClick=false;},180);
    };
    rail.addEventListener('pointerup',finishPointer,true);
    rail.addEventListener('pointercancel',finishPointer,true);
    rail.addEventListener('lostpointercapture',event=>{
      if(pointerId!==null&&event.pointerId===pointerId){
        rail.classList.remove('is-desktop-pointerdown','is-desktop-dragging');
        pointerId=null;
        dragging=false;
      }
    },true);
    rail.addEventListener('pointerleave',()=>{
      if(pointerId!==null&&!dragging){
        rail.classList.remove('is-desktop-pointerdown');
        pointerId=null;
      }
    },true);

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
