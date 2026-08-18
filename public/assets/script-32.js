/* v2: desktop-only mouse-drag hardening for horizontal content rails + collection popup outside-click close. */
(function(){
  if(window.__photoDesktopRailPolishV1Installed)return;
  window.__photoDesktopRailPolishV1Installed=true;

  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,#curatedLinksRow,#skillsInfiniteRow';

  function bindRail(rail){
    if(!rail||rail.dataset.desktopRailPolishV1==='true')return;
    rail.dataset.desktopRailPolishV1='true';

    /* Browser-native drag ghosts from anchors/images can cancel pointer panning. */
    rail.addEventListener('dragstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      rail.classList.add('is-desktop-pointerdown');
    },true);

    const clearPointerState=()=>{
      rail.classList.remove('is-desktop-pointerdown');
    };
    rail.addEventListener('pointerup',clearPointerState,true);
    rail.addEventListener('pointercancel',clearPointerState,true);
    rail.addEventListener('lostpointercapture',clearPointerState,true);
    rail.addEventListener('mouseleave',()=>{
      if(!rail.classList.contains('is-desktop-dragging'))clearPointerState();
    },true);
  }

  function refresh(){
    if(!desktop.matches)return;
    document.querySelectorAll(RAIL_SELECTOR).forEach(bindRail);
  }

  function collectionSheetIsOpen(sheet){
    if(!sheet||sheet.hidden)return false;
    const style=getComputedStyle(sheet);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  document.addEventListener('click',event=>{
    if(!desktop.matches)return;
    const sheet=document.getElementById('collectionSheet');
    if(!collectionSheetIsOpen(sheet))return;
    const target=event.target;
    if(!(target instanceof Element))return;
    if(target.closest('#collectionSheet,#collectionFab'))return;

    /* Reuse the popup's own close path so body-lock, focus restoration and
       animation state stay exactly the same as the existing close behavior. */
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

  [120,420,1000,2200].forEach(delay=>setTimeout(refresh,delay));
  window.addEventListener('pageshow',()=>setTimeout(refresh,120),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
