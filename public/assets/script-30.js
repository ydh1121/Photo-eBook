/* v1: keep iOS Safari off hard scroll edges and preserve its page scroller while overlays are open. */
(function(){
  if(window.__photoSafariChromeGuardInstalled)return;
  window.__photoSafariChromeGuardInstalled=true;

  const ua=navigator.userAgent||'';
  const iOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const webkit=/WebKit/i.test(ua);
  if(!iOS||!webkit)return;

  const root=document.documentElement;
  root.classList.add('ios-webkit-chrome');

  let scrollTimer=0;
  let adjusting=false;

  function maxScroll(){
    return Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  }

  function keepOffHardEdge(){
    if(adjusting||document.visibilityState==='hidden')return;
    const max=maxScroll();
    if(max<3)return;
    const y=window.scrollY||window.pageYOffset||0;
    let target=null;
    if(y<=0.5)target=1;
    else if(y>=max-0.5)target=Math.max(0,max-1);
    if(target===null||Math.abs(target-y)<0.25)return;

    adjusting=true;
    window.scrollTo(0,target);
    requestAnimationFrame(()=>{adjusting=false;});
  }

  function scheduleEdgeGuard(delay=100){
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(keepOffHardEdge,delay);
  }

  function refreshChrome(){
    [0,80,220,520].forEach(delay=>setTimeout(()=>{
      keepOffHardEdge();
      window.__photoRepairTopLiquid?.();
    },delay));
  }

  window.addEventListener('scroll',()=>{
    if(!adjusting)scheduleEdgeGuard(120);
  },{passive:true});
  window.addEventListener('resize',()=>scheduleEdgeGuard(80),{passive:true});
  window.visualViewport?.addEventListener?.('resize',()=>scheduleEdgeGuard(80),{passive:true});
  window.visualViewport?.addEventListener?.('scroll',()=>scheduleEdgeGuard(100),{passive:true});
  window.addEventListener('focus',refreshChrome,{passive:true});
  window.addEventListener('pageshow',refreshChrome,{passive:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')refreshChrome();
  },{passive:true});

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#collectionFab')){
      keepOffHardEdge();
      setTimeout(()=>window.__photoRepairTopLiquid?.(),120);
      return;
    }
    if(event.target.closest?.('#collectionClose,#collectionBackdrop')){
      setTimeout(refreshChrome,230);
      return;
    }
    if(event.target.closest?.('.collection-tab')){
      setTimeout(()=>window.__photoRepairTopLiquid?.(),90);
    }
  },true);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshChrome,60),{once:true});
  }else{
    setTimeout(refreshChrome,60);
  }
})();
