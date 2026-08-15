/* v28: keep v27 enhancements out of the critical boot path. */
(function(){
  if(window.__photoPostloadV27Installed)return;
  window.__photoPostloadV27Installed=true;

  function appReady(){
    const app=document.querySelector('#app');
    return Boolean(app&&!app.hidden&&app.childElementCount);
  }

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
      const finish=()=>{if(done)return;done=true;observer.disconnect();clearInterval(timer);resolve();};
      const observer=new MutationObserver(()=>{if(appReady())finish();});
      observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
      const timer=setInterval(()=>{if(appReady())finish();},120);
    });
  }

  async function start(){
    await whenAppReady();
    await new Promise(resolve=>{
      if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:900});
      else setTimeout(resolve,180);
    });
    try{
      await loadScript('/assets/script-asset-fix.js?v=28');
    }catch(error){
      console.warn('postload image helper skipped',error);
    }
    try{
      await loadScript('/assets/script-14.js?v=28');
    }catch(error){
      console.error('postload enhancement failed',error);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
