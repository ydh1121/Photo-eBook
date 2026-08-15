/* v32.1: compositor-only capsule progress fill. */
(function(){
  if(window.__photoV321Progress)return;
  window.__photoV321Progress=true;

  function waitForNav(){
    const nav=document.querySelector('.nav-scroll');
    if(nav){install(nav);return;}
    let tries=0;
    const timer=setInterval(()=>{
      const node=document.querySelector('.nav-scroll');
      if(node||++tries>140){clearInterval(timer);if(node)install(node);}
    },80);
  }

  function install(nav){
    if(nav.dataset.v321Progress==='true')return;
    nav.dataset.v321Progress='true';
    let ticking=false;
    const update=()=>{
      ticking=false;
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const value=Math.min(1,Math.max(0,(window.scrollY||0)/max));
      nav.style.setProperty('--v32-progress',`${(value*100).toFixed(2)}%`);
    };
    const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    update();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForNav,{once:true});
  else waitForNav();
})();
