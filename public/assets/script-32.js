/* v3: desktop-only mouse-drag hardening, saved-sheet outside close, and nav liquid self-heal. */
(function(){
  if(window.__photoDesktopRailPolishV1Installed)return;
  window.__photoDesktopRailPolishV1Installed=true;

  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,#curatedLinksRow,#skillsInfiniteRow';

  function bindRail(rail){
    if(!rail||rail.dataset.desktopRailPolishV1==='true')return;
    rail.dataset.desktopRailPolishV1='true';

    rail.addEventListener('dragstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      rail.classList.add('is-desktop-pointerdown');
    },true);

    const clearPointerState=()=>rail.classList.remove('is-desktop-pointerdown');
    rail.addEventListener('pointerup',clearPointerState,true);
    rail.addEventListener('pointercancel',clearPointerState,true);
    rail.addEventListener('lostpointercapture',clearPointerState,true);
    rail.addEventListener('mouseleave',()=>{
      if(!rail.classList.contains('is-desktop-dragging'))clearPointerState();
    },true);
  }

  function repairNavIndicator(){
    if(!desktop.matches)return;
    const nav=document.querySelector('.nav-scroll');
    const active=nav?.querySelector('.nav-chip.is-active');
    let indicator=nav?.querySelector('.nav-v33-indicator');
    if(!nav||!active||!indicator)return;

    let skin=indicator.querySelector(':scope > .v37-liquid-skin');
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }

    const w=active.offsetWidth;
    const h=active.offsetHeight;
    if(!w||!h)return;
    indicator.style.width=w+'px';
    indicator.style.height=h+'px';
    indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    indicator.dataset.x=String(active.offsetLeft);
    indicator.dataset.y=String(active.offsetTop);
    indicator.dataset.w=String(w);
    indicator.dataset.h=String(h);
    indicator.dataset.ready='true';
    nav.classList.add('v41-skin-ready','v33-liquid-ready');
  }

  function refresh(){
    if(!desktop.matches)return;
    document.querySelectorAll(RAIL_SELECTOR).forEach(bindRail);
    repairNavIndicator();
  }

  function collectionSheetIsOpen(sheet){
    if(!sheet||sheet.hidden)return false;
    const style=getComputedStyle(sheet);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  document.addEventListener('click',event=>{
    if(!desktop.matches)return;

    if(event.target.closest?.('.nav-chip')){
      /* Let the existing Breeze controller own the motion, then only heal the
         final geometry in case an earlier stylesheet left the indicator hidden. */
      setTimeout(repairNavIndicator,430);
    }

    const sheet=document.getElementById('collectionSheet');
    if(!collectionSheetIsOpen(sheet))return;
    const target=event.target;
    if(!(target instanceof Element))return;
    if(target.closest('#collectionSheet,#collectionFab'))return;

    const backdrop=document.getElementById('collectionBackdrop');
    if(backdrop){
      backdrop.click();
      return;
    }
    const close=sheet.querySelector('[data-collection-close],.collection-close,[aria-label="닫기"]');
    close?.click();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  [80,220,520,1200,2200].forEach(delay=>setTimeout(refresh,delay));
  window.addEventListener('pageshow',()=>setTimeout(refresh,120),{passive:true});
  window.addEventListener('resize',()=>setTimeout(repairNavIndicator,80),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
