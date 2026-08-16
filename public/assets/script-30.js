/* v2: apply the iOS Safari edge guard only after the real app has rendered. */
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
  let appReady=false;

  function renderedApp(){
    const app=document.querySelector('#app');
    return Boolean(app&&!app.hidden&&app.childElementCount>0);
  }

  function maxScroll(){
    return Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  }

  function keepOffHardEdge(){
    if(!appReady||adjusting||document.visibilityState==='hidden')return;
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
    if(!appReady)return;
    [0,80,220,520].forEach(delay=>setTimeout(keepOffHardEdge,delay));
  }

  function markAppReady(){
    if(appReady||!renderedApp())return false;
    appReady=true;
    [0,80,240,620,1200].forEach(delay=>setTimeout(keepOffHardEdge,delay));
    return true;
  }

  function watchApp(){
    if(markAppReady())return;
    const app=document.querySelector('#app');
    if(app){
      const observer=new MutationObserver(()=>{
        if(markAppReady())observer.disconnect();
      });
      observer.observe(app,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
    }
    [200,500,900,1500,2600,4200].forEach(delay=>setTimeout(markAppReady,delay));
  }

  window.addEventListener('scroll',()=>{
    if(!adjusting)scheduleEdgeGuard(140);
  },{passive:true});
  window.addEventListener('resize',()=>scheduleEdgeGuard(90),{passive:true});
  window.visualViewport?.addEventListener?.('resize',()=>scheduleEdgeGuard(90),{passive:true});
  window.visualViewport?.addEventListener?.('scroll',()=>scheduleEdgeGuard(110),{passive:true});
  window.addEventListener('focus',refreshChrome,{passive:true});
  window.addEventListener('load',()=>{markAppReady();refreshChrome();},{once:true,passive:true});
  window.addEventListener('pageshow',()=>{markAppReady();refreshChrome();},{passive:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')refreshChrome();
  },{passive:true});

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#collectionFab')){
      markAppReady();
      setTimeout(keepOffHardEdge,40);
      setTimeout(keepOffHardEdge,180);
      return;
    }
    if(event.target.closest?.('#collectionClose,#collectionBackdrop')){
      setTimeout(keepOffHardEdge,230);
      setTimeout(keepOffHardEdge,520);
      return;
    }
    if(event.target.closest?.('.collection-tab')){
      setTimeout(keepOffHardEdge,90);
    }
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchApp,{once:true});
  else watchApp();
})();
