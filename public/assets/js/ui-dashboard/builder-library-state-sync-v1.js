(function(){
  if(new URLSearchParams(location.search).get('view')!=='library')return;
  if(window.__platformLibraryStateSyncV1)return;
  window.__platformLibraryStateSyncV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  function read(){try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function active(){return new URL(location.href).searchParams.get('ui')||'top-chapter-navigation';}
  function sync(){
    const id=active();
    const config=read()[id];
    try{
      frame.contentWindow?.postMessage({type:'platform-ui-reset',capabilityId:id},location.origin);
      if(config&&Object.keys(config).length)frame.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config},location.origin);
    }catch{}
  }
  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-kit-state]'):null;
    if(!button)return;
    [80,220,520].forEach(delay=>setTimeout(sync,delay));
  },true);
})();
