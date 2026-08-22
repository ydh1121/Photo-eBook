(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderPageLiveV2)return;
  window.__platformBuilderPageLiveV2=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const frame=document.querySelector('#builderFrame');
  if(!manifest||!frame)return;

  const LIVE='platformBuilderCapabilityConfigsV2';
  const LEGACY='platformBuilderCapabilityConfigsV1';
  function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function capability(id){return manifest.capabilities.find(item=>item.id===id);}
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}

  function ensureCompat(){
    const doc=frame.contentDocument;if(!doc||doc.querySelector('script[data-builder-compat-v1]'))return;
    const script=doc.createElement('script');
    script.src='/ui-dashboard/sandbox/builder-compat-v1.js?v=1';
    script.dataset.builderCompatV1='true';
    doc.head.appendChild(script);
  }
  function syncCapability(id){
    if(!capability(id))return;
    const config=read(LIVE)[id];
    post({type:'platform-ui-reset',capabilityId:id});
    if(config&&Object.keys(config).length)post({type:'platform-ui-config',capabilityId:id,config});
  }
  function syncAll(){for(const item of manifest.capabilities)syncCapability(item.id);}
  function saveOne(id,key,value){
    if(!capability(id))return;
    const all=read(LIVE);
    const next={...(all[id]||{})};next[key]=value;all[id]=next;
    write(LIVE,all);write(LEGACY,all);
    queueMicrotask(()=>syncCapability(id));
    setTimeout(()=>syncCapability(id),0);
  }
  function clearCapability(id){
    const all=read(LIVE);delete all[id];write(LIVE,all);write(LEGACY,all);
    queueMicrotask(()=>syncCapability(id));
    setTimeout(()=>syncCapability(id),0);
  }
  function controlValue(input,definition){
    if(input.type==='checkbox')return input.checked;
    const raw=input.value;
    if(definition?.type==='range'||definition?.type==='number')return Number(raw);
    return raw;
  }

  document.addEventListener('input',event=>{
    const input=event.target instanceof Element?event.target.closest('[data-builder-control]'):null;
    if(!input)return;
    const id=input.closest('.builder-inspector')?.dataset.inspectorId;
    const key=input.dataset.builderControl;
    const definition=capability(id)?.controls.find(item=>item.id===key);
    if(id&&definition)saveOne(id,key,controlValue(input,definition));
  },true);
  document.addEventListener('change',event=>{
    const input=event.target instanceof Element?event.target.closest('[data-builder-control]'):null;
    if(!input)return;
    const id=input.closest('.builder-inspector')?.dataset.inspectorId;
    const key=input.dataset.builderControl;
    const definition=capability(id)?.controls.find(item=>item.id===key);
    if(id&&definition)saveOne(id,key,controlValue(input,definition));
  },true);
  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-reset-inspector]'):null;
    if(!button)return;
    const id=button.closest('.builder-inspector')?.dataset.inspectorId;
    if(id)clearCapability(id);
  },true);

  function scheduleSync(){
    ensureCompat();
    [40,130,300,780,1900,3600,4140].forEach(delay=>setTimeout(()=>{ensureCompat();syncAll();},delay));
  }
  frame.addEventListener('load',scheduleSync);
  window.addEventListener('pageshow',()=>setTimeout(()=>{ensureCompat();syncAll();},120),{passive:true});
  if(frame.contentDocument?.readyState==='complete')scheduleSync();
})();
