/* v48: low-cost Safari cleanup.
   Top navigation panning is fully native. No pointermove/touchmove handlers,
   no custom momentum loop, no MutationObserver. */
(function(){
  if(window.__photoV48SafariCleanupInstalled)return;
  window.__photoV48SafariCleanupInstalled=true;

  function removeThemeColor(){
    document.querySelectorAll('meta[name="theme-color"]').forEach(node=>node.remove());
  }

  function applyNativeRail(rail){
    if(!rail)return false;
    rail.dataset.v48NativeScroll='true';
    rail.style.setProperty('display','flex','important');
    rail.style.setProperty('flex-wrap','nowrap','important');
    rail.style.setProperty('width','100%','important');
    rail.style.setProperty('max-width','100%','important');
    rail.style.setProperty('min-width','0','important');
    rail.style.setProperty('overflow-x','auto','important');
    rail.style.setProperty('overflow-y','hidden','important');
    rail.style.setProperty('-webkit-overflow-scrolling','touch','important');
    rail.style.setProperty('touch-action','auto','important');
    rail.style.setProperty('overscroll-behavior-x','auto','important');
    rail.style.setProperty('scroll-snap-type','none','important');
    rail.style.setProperty('scroll-behavior','auto','important');

    rail.querySelectorAll('.nav-chip').forEach(chip=>{
      chip.style.setProperty('flex','0 0 auto','important');
      chip.style.setProperty('touch-action','auto','important');
      chip.style.setProperty('-webkit-user-select','none','important');
      chip.style.setProperty('user-select','none','important');
    });
    rail.querySelectorAll('.nav-v33-indicator,.nav-liquid-indicator,.v37-liquid-skin,.nav-progress-liquid').forEach(node=>{
      node.style.setProperty('pointer-events','none','important');
    });
    return true;
  }

  function applyAll(){
    removeThemeColor();
    const rails=[...document.querySelectorAll('.nav-scroll')];
    rails.forEach(applyNativeRail);
    return rails.length>0;
  }

  function init(attempt=0){
    if(applyAll()||attempt>=40)return;
    setTimeout(()=>init(attempt+1),100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(applyAll,80),{passive:true});
  window.addEventListener('photo-theme-change',removeThemeColor,{passive:true});
})();
