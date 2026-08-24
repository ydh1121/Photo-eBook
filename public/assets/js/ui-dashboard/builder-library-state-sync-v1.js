(function(){
  if(new URLSearchParams(location.search).get('view')!=='library')return;
  if(window.__platformLibraryStateSyncV1)return;
  window.__platformLibraryStateSyncV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const CONFIG_STORE='platformBuilderCapabilityConfigsV2';
  const STATE_STORE='platformBuilderKitStateV2';
  function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function active(){return new URL(location.href).searchParams.get('ui')||'top-chapter-navigation';}
  function stateFor(id){
    const stored=read(STATE_STORE)[id];
    if(stored)return stored;
    if(id==='collection-bottom-sheet')return 'all';
    if(id==='device-handoff-accordion')return 'collapsed';
    return '';
  }
  function sync(){
    const id=active();
    const config=read(CONFIG_STORE)[id];
    const state=stateFor(id);
    try{
      frame.contentWindow?.postMessage({type:'platform-ui-reset',capabilityId:id},location.origin);
      if(config&&Object.keys(config).length)frame.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config},location.origin);
      if(state)frame.contentWindow?.postMessage({type:'platform-kit-state',capabilityId:id,state},location.origin);
    }catch{}
  }
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest('[data-kit-state],[data-kit-reset]'))return;
    [80,220,520].forEach(delay=>setTimeout(sync,delay));
  },true);
})();
