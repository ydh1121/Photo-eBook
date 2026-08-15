/* v20: boot recovery. Never leave the landing page on the skeleton indefinitely. */
(function(){
  if(window.__photoBootRecoveryInstalled)return;
  window.__photoBootRecoveryInstalled=true;

  const BOOT_COPY='사진 수익화 로드맵을 준비하는 중';

  function setBootCopy(text=BOOT_COPY){
    const boot=document.querySelector('#boot');
    const copy=boot?.querySelector('.micro');
    if(copy)copy.textContent=text;
  }

  async function recover(){
    const boot=document.querySelector('#boot');
    const app=document.querySelector('#app');
    if(!boot||!app||!app.hidden)return;
    if(typeof window.apiGetSiteData!=='function'||typeof window.renderApp!=='function')return;

    setBootCopy();
    try{
      const data=await window.apiGetSiteData();
      if(document.querySelector('#boot')&&document.querySelector('#app')?.hidden){
        window.renderApp(data);
      }
    }catch(error){
      const currentBoot=document.querySelector('#boot');
      if(!currentBoot)return;
      setBootCopy('로드맵을 불러오지 못했습니다. 다시 시도해 주세요.');
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
          setTimeout(()=>{retry.disabled=false;retry.textContent='다시 시도';},1800);
          recover();
        });
        currentBoot.querySelector('.boot__lines')?.appendChild(retry);
      }
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      setBootCopy();
      setTimeout(recover,2400);
    },{once:true});
  }else{
    setBootCopy();
    setTimeout(recover,2400);
  }
})();
