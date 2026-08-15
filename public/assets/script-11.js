/* v22: immediate boot recovery. Prefer bundled/cache data, then live API. */
(function(){
  if(window.__photoBootRecoveryInstalled)return;
  window.__photoBootRecoveryInstalled=true;

  const BOOT_COPY='사진 수익화 로드맵을 준비하는 중';
  let recovering=false;

  function setBootCopy(text=BOOT_COPY){
    const boot=document.querySelector('#boot');
    const copy=boot?.querySelector('.micro');
    if(copy)copy.textContent=text;
  }

  function appNeedsBoot(){
    const boot=document.querySelector('#boot');
    const app=document.querySelector('#app');
    return Boolean(boot&&app&&app.hidden);
  }

  function bundledData(){
    try{
      if(typeof window.readCachedSiteData==='function'){
        const cached=window.readCachedSiteData();
        if(cached)return cached;
      }
      if(typeof window.readBundledSiteData==='function'){
        const bundled=window.readBundledSiteData();
        if(bundled)return bundled;
      }
    }catch(error){
      console.error('boot bundled data error',error);
    }
    return null;
  }

  function renderIfPossible(data){
    if(!data||typeof window.renderApp!=='function'||!appNeedsBoot())return false;
    try{
      window.renderApp(data);
      return !document.querySelector('#app')?.hidden;
    }catch(error){
      console.error('boot render error',error);
      return false;
    }
  }

  async function recover(){
    if(recovering||!appNeedsBoot())return;
    recovering=true;
    setBootCopy();

    try{
      const local=bundledData();
      if(renderIfPossible(local))return;

      if(typeof window.apiGetSiteData==='function'){
        try{
          const live=await window.apiGetSiteData();
          if(renderIfPossible(live))return;
        }catch(error){
          console.error('boot live data error',error);
        }
      }
    }finally{
      recovering=false;
    }

    if(!appNeedsBoot())return;
    const currentBoot=document.querySelector('#boot');
    if(!currentBoot)return;
    setBootCopy('페이지를 여는 데 시간이 걸리고 있습니다. 다시 시도해 주세요.');
    let retry=currentBoot.querySelector('.boot-retry');
    if(!retry){
      retry=document.createElement('button');
      retry.type='button';
      retry.className='boot-retry';
      retry.textContent='다시 시도';
      retry.style.cssText='margin-top:18px;border:0;border-radius:999px;padding:12px 18px;background:#3568d4;color:#fff;font:700 15px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
      retry.addEventListener('click',()=>{
        retry.disabled=true;
        retry.textContent='확인 중';
        recover().finally(()=>{
          if(document.body.contains(retry)){
            retry.disabled=false;
            retry.textContent='다시 시도';
          }
        });
      });
      currentBoot.querySelector('.boot__lines')?.appendChild(retry);
    }
  }

  function start(){
    setBootCopy();
    // First attempt happens almost immediately after deferred scripts finish.
    setTimeout(recover,80);
    // A few bounded retries cover Safari's occasional deferred-script lag.
    [350,900,1800,3200].forEach(ms=>setTimeout(()=>{if(appNeedsBoot())recover();},ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
