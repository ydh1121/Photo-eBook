(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderDynamicSyncV1)return;
  window.__platformBuilderDynamicSyncV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  function read(){try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function post(id){
    const config=read()[id];
    try{
      frame.contentWindow?.postMessage({type:'platform-ui-reset',capabilityId:id},location.origin);
      if(config&&Object.keys(config).length)frame.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config},location.origin);
    }catch{}
  }
  function resync(ids,delays=[40,160,420]){for(const delay of delays)setTimeout(()=>ids.forEach(post),delay);}

  function bind(){
    const doc=frame.contentDocument;if(!doc||doc.documentElement.dataset.builderDynamicSyncV1==='true')return;
    doc.documentElement.dataset.builderDynamicSyncV1='true';
    doc.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target:null;
      if(!target)return;
      if(target.closest('#collectionFab')){
        resync(['collection-bottom-sheet','filter-chip-rail','device-handoff-accordion','floating-action']);
        return;
      }
      if(target.closest('.collection-tab')){
        resync(['collection-bottom-sheet','filter-chip-rail','device-handoff-accordion']);
        return;
      }
      if(target.closest('#collectionDeviceLink,[data-device-panel-copy],[data-device-panel-connect]')){
        resync(['device-handoff-accordion'],[60,220,520]);
      }
    },true);
  }
  frame.addEventListener('load',()=>[30,180,600].forEach(delay=>setTimeout(bind,delay)));
  if(frame.contentDocument?.readyState==='complete')bind();
})();
