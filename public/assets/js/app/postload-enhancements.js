/* v30: keep optional v27 enhancements off the critical path and prevent self-observer lockups. */
(function(){
  if(window.__photoPostloadV27Installed)return;
  window.__photoPostloadV27Installed=true;

  function appReady(){
    const app=document.querySelector('#app');
    return Boolean(app&&!app.hidden&&app.childElementCount);
  }

  function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[data-postload-src="${src}"]`);
      if(existing){
        if(existing.dataset.loaded==='true')resolve();
        else existing.addEventListener('load',resolve,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.dataset.postloadSrc=src;
      script.addEventListener('load',()=>{script.dataset.loaded='true';resolve();},{once:true});
      script.addEventListener('error',reject,{once:true});
      document.body.appendChild(script);
    });
  }

  function whenAppReady(){
    if(appReady())return Promise.resolve();
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{
        if(done)return;
        done=true;
        observer.disconnect();
        clearInterval(timer);
        resolve();
      };
      const observer=new MutationObserver(()=>{if(appReady())finish();});
      observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
      const timer=setInterval(()=>{if(appReady())finish();},120);
    });
  }

  function releaseStaleInteractionLocks(){
    const askSheet=document.querySelector('#askSheet');
    if(!askSheet||askSheet.hidden){
      document.body.classList.remove('is-modal-open');
    }

    const collectionSheet=document.querySelector('#collectionSheet');
    if(!collectionSheet||collectionSheet.hidden){
      document.documentElement.classList.remove('collection-open');
      document.body.classList.remove('collection-open');
      document.body.style.top='';
    }

    const collectionBackdrop=document.querySelector('#collectionBackdrop');
    if(collectionBackdrop?.hidden)collectionBackdrop.style.pointerEvents='none';
    const askBackdrop=document.querySelector('#askBackdrop');
    if(askBackdrop?.hidden)askBackdrop.style.pointerEvents='none';
  }

  async function loadEnhancementWithoutGlobalSubtreeObserver(src){
    const NativeMutationObserver=window.MutationObserver;
    if(typeof NativeMutationObserver!=='function')return loadScript(src);

    function GuardedMutationObserver(callback){
      const native=new NativeMutationObserver(callback);
      return {
        observe(target,options){
          const isUnsafe=target===document.documentElement&&Boolean(options?.childList)&&Boolean(options?.subtree);
          if(isUnsafe)return;
          native.observe(target,options);
        },
        disconnect(){native.disconnect();},
        takeRecords(){return native.takeRecords();}
      };
    }

    GuardedMutationObserver.prototype=NativeMutationObserver.prototype;
    window.MutationObserver=GuardedMutationObserver;
    try{
      await loadScript(src);
    }finally{
      window.MutationObserver=NativeMutationObserver;
    }
  }

  async function start(){
    await whenAppReady();
    await wait(900);
    if(!appReady())return;
    releaseStaleInteractionLocks();

    await new Promise(resolve=>{
      if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:700});
      else setTimeout(resolve,120);
    });

    try{
      await loadScript('/assets/js/media/generated-image-blob-cache.js?v=1');
    }catch(error){
      console.warn('postload image helper skipped',error);
    }

    try{
      await loadEnhancementWithoutGlobalSubtreeObserver('/assets/js/collection/collection-hub.js?v=1');
    }catch(error){
      console.error('postload enhancement failed',error);
    }

    releaseStaleInteractionLocks();
    setTimeout(releaseStaleInteractionLocks,120);
    setTimeout(releaseStaleInteractionLocks,900);
  }

  window.addEventListener('pageshow',()=>setTimeout(releaseStaleInteractionLocks,80),{passive:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
