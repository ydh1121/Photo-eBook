(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;if(!manifest)return;
  const frame=document.querySelector('#builderFrame');
  const layer=document.querySelector('#builderPanelLayer');
  const STORAGE='platformBuilderCapabilityConfigsV2';
  const byLabel=new Map(manifest.capabilities.map(cap=>[String(cap.label||'').trim(),cap.id]));

  function read(){try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(value){try{localStorage.setItem(STORAGE,JSON.stringify(value));}catch{}}
  function capFromPanel(panel){
    if(!panel)return'';
    for(const key of ['capabilityId','capability','builderCapability','id']){
      const value=panel.dataset?.[key];
      if(value&&manifest.capabilities.some(cap=>cap.id===value))return value;
    }
    const title=panel.querySelector('.builder-inspector__head strong')?.textContent?.trim()||'';
    if(byLabel.has(title))return byLabel.get(title);
    for(const [label,id] of byLabel){if(title.includes(label)||label.includes(title))return id;}
    return'';
  }
  function value(input){if(input.type==='checkbox')return input.checked;if(input.type==='range'||input.type==='number')return Number(input.value);return input.value;}
  function previewFrames(){return [document.querySelector('#builderLibraryPreview')].filter(Boolean);}
  function send(target,message){try{target?.contentWindow?.postMessage(message,location.origin);}catch{}}
  function reset(id){
    const message={type:'platform-ui-reset-baseline',capabilityId:id};
    send(frame,message);previewFrames().forEach(target=>send(target,message));
  }
  function post(id,config){
    reset(id);
    if(!config)return;
    const message={type:'platform-ui-config',capabilityId:id,config};
    send(frame,message);previewFrames().forEach(target=>send(target,message));
  }
  function updateFrom(input){
    const panel=input.closest('.builder-inspector');
    const id=capFromPanel(panel),key=input.dataset.builderControl;
    if(!id||!key)return;
    const all=read();
    const next={...(all[id]||{})};
    next[key]=value(input);
    all[id]=next;write(all);
    setTimeout(()=>post(id,next),0);
  }
  function syncAll(){
    const all=read();
    manifest.capabilities.forEach(cap=>post(cap.id,all[cap.id]||null));
  }

  document.addEventListener('input',event=>{const input=event.target.closest?.('[data-builder-control]');if(input)updateFrom(input);},true);
  document.addEventListener('change',event=>{const input=event.target.closest?.('[data-builder-control]');if(input)updateFrom(input);},true);

  frame?.addEventListener('load',()=>[100,900,2200,3900].forEach(delay=>setTimeout(syncAll,delay)));
  if(layer){new MutationObserver(()=>setTimeout(syncAll,0)).observe(layer,{childList:true,subtree:false});}
  window.addEventListener('storage',event=>{if(event.key===STORAGE)syncAll();});
})();
