/* v1: desktop-only mouse-drag hardening for horizontal content rails. */
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  [120,420,1000,2200].forEach(delay=>setTimeout(refresh,delay));
  window.addEventListener('pageshow',()=>setTimeout(refresh,120),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
