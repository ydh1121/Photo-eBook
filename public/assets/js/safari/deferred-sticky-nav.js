/* v4: iOS Safari starts with the navigation in normal flow and only arms
   sticky positioning after Safari's browser chrome has compacted. This
   replaces the old hidden collection open/switch/close composition hack. */
(function(){
  if(window.__photoSafariDeferredStickyInstalled)return;
  window.__photoSafariDeferredStickyInstalled=true;

  const root=document.documentElement;
  if(!root.classList.contains('ios-webkit-chrome'))return;

  const vv=window.visualViewport;
  let baseline=vv?vv.height:window.innerHeight;
  let armed=false;

  function armSticky(){
    if(armed)return;
    armed=true;
    root.classList.add('safari-nav-sticky-armed');
  }

  function check(){
    if(armed)return;
    const current=vv?vv.height:window.innerHeight;
    const compactGrowth=current-baseline;

    /* Prefer the actual Safari toolbar-collapse signal. The scroll fallback
       only arms after a substantial gesture for devices where visualViewport
       reports little or no resize. */
    if(compactGrowth>24||(window.scrollY||0)>140)armSticky();
  }

  window.addEventListener('scroll',check,{passive:true});
  if(vv)vv.addEventListener('resize',check,{passive:true});

  window.addEventListener('pageshow',()=>{
    if(armed)return;
    baseline=vv?vv.height:window.innerHeight;
  },{passive:true});
})();
