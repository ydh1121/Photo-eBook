/* Ensure the async data bootstrap cannot render with an older navigation setup. */
(function(){
  if(typeof window.apiGetSiteData!=='function'||window.__photoUiGateInstalled)return;
  window.__photoUiGateInstalled=true;

  const original=window.apiGetSiteData;
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  let resolved=false;

  window.__photoUiReadyResolve=function(){
    if(resolved)return;
    resolved=true;
    resolveReady();
  };

  /* Never leave the page stuck if a later enhancement asset fails to load. */
  setTimeout(()=>window.__photoUiReadyResolve?.(),1800);

  window.apiGetSiteData=function(...args){
    return ready.then(()=>original(...args));
  };
})();
