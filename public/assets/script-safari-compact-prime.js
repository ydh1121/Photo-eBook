/* v2: track Safari expanded/compact toolbar cycles and re-prime every compact entry. */
(function(){
  if(window.__photoSafariCompactPrimeInstalled)return;
  window.__photoSafariCompactPrimeInstalled=true;

  const root=document.documentElement;
  if(!root.classList.contains('ios-webkit-chrome'))return;
  const vv=window.visualViewport;
  if(!vv)return;

  let baseline=0;
  let compact=false;
  let primed=false;
  let priming=false;
  let settleTimer=0;
  let lastScrollAt=0;

  function appReady(){
    const app=document.querySelector('#app');
    return Boolean(app&&!app.hidden&&app.childElementCount>0);
  }

  function collectionReady(){
    return Boolean(
      document.querySelector('#collectionFab')&&
      document.querySelector('#collectionSheet')&&
      document.querySelector('#collectionClose')&&
      document.querySelector('.collection-tab[data-library-tab="video"]')
    );
  }

  function collectionOpen(){
    const sheet=document.querySelector('#collectionSheet');
    return root.classList.contains('collection-open')||
      document.body.classList.contains('collection-open')||
      Boolean(sheet&&!sheet.hidden);
  }

  function growth(){return baseline?vv.height-baseline:0;}
  function shouldEnterCompact(){return Boolean(baseline&&growth()>=28&&(window.scrollY||0)>8);}
  function shouldLeaveCompact(){return Boolean(baseline&&(growth()<=12||(window.scrollY||0)<=4));}

  function syncCompactState(){
    if(!baseline)return false;

    if(!compact&&shouldEnterCompact()){
      compact=true;
      primed=false;
      root.classList.add('safari-compact-active');
      schedule();
      return true;
    }

    if(compact&&shouldLeaveCompact()){
      compact=false;
      primed=false;
      clearTimeout(settleTimer);
      root.classList.remove('safari-compact-active','safari-compact-prime');
      return true;
    }

    return false;
  }

  function compactNow(){return compact&&shouldEnterCompact();}
  function nextFrame(){return new Promise(resolve=>requestAnimationFrame(resolve));}
  function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

  async function prime(){
    if(primed||priming||!appReady()||!collectionReady()||collectionOpen()||!compactNow())return false;
    if(Date.now()-lastScrollAt<150)return false;

    priming=true;
    primed=true;
    const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    const layer=document.querySelector('#collectionLayer');

    try{
      root.classList.add('safari-compact-prime');
      if(layer)void layer.offsetHeight;
      await nextFrame();

      /* Replay the exact production interaction that is known to refresh
         Safari's compact scroll-pocket composition. */
      document.querySelector('#collectionFab')?.click();
      await nextFrame();
      await nextFrame();

      document.querySelector('.collection-tab[data-library-tab="video"]')?.click();
      await nextFrame();
      await nextFrame();

      document.querySelector('#collectionClose')?.click();
      await wait(230);
      await nextFrame();
    }catch(error){
      console.warn('Safari compact chrome prime skipped',error);
      primed=false;
    }finally{
      root.classList.remove('safari-compact-prime');
      if(Math.abs((window.scrollY||0)-y)>1)window.scrollTo(0,y);
      priming=false;
      syncCompactState();
    }
    return true;
  }

  function schedule(){
    if(primed||priming||!compact)return;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{
      if(!prime()&&!primed&&compact)schedule();
    },180);
  }

  function captureBaseline(){
    if(baseline||!appReady())return false;
    baseline=vv.height;
    return true;
  }

  function onViewportChange(){
    if(!baseline)captureBaseline();
    syncCompactState();
    if(compact&&!primed)schedule();
  }

  window.addEventListener('scroll',()=>{
    lastScrollAt=Date.now();
    onViewportChange();
  },{passive:true});
  vv.addEventListener('resize',onViewportChange,{passive:true});
  vv.addEventListener('scroll',onViewportChange,{passive:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')setTimeout(onViewportChange,80);
  },{passive:true});

  function boot(){
    if(!captureBaseline()){
      setTimeout(boot,100);
      return;
    }
    syncCompactState();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
