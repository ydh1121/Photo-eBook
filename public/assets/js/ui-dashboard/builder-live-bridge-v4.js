(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;if(!manifest)return;
  const frame=document.querySelector('#builderFrame');const layer=document.querySelector('#builderPanelLayer');const STORAGE='platformBuilderCapabilityConfigsV1';
  const byLabel=new Map(manifest.capabilities.map(c=>[String(c.label||'').trim(),c.id]));
  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function write(v){try{localStorage.setItem(STORAGE,JSON.stringify(v));}catch{}}
  function capFromPanel(panel){
    if(!panel)return'';for(const key of ['capabilityId','capability','builderCapability','id']){const v=panel.dataset?.[key];if(v&&manifest.capabilities.some(c=>c.id===v))return v;}
    const title=panel.querySelector('.builder-inspector__head strong')?.textContent?.trim()||'';if(byLabel.has(title))return byLabel.get(title);
    for(const [label,id] of byLabel){if(title.includes(label)||label.includes(title))return id;}return'';
  }
  function value(input){if(input.type==='checkbox')return input.checked;if(input.type==='range'||input.type==='number')return Number(input.value);return input.value;}
  function post(id,cfg){try{frame?.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config:cfg},location.origin);}catch{}document.querySelectorAll('.builder-library-v3__preview').forEach(f=>{try{f.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config:cfg},location.origin);}catch{}});}
  function updateFrom(input){
    const panel=input.closest('.builder-inspector');const id=capFromPanel(panel);const key=input.dataset.builderControl;if(!id||!key)return;
    const all=read(),cap=manifest.capabilities.find(c=>c.id===id),defaults={};(cap?.controls||[]).forEach(c=>defaults[c.id]=c.default);
    const next={...defaults,...(all[id]||{})};next[key]=value(input);all[id]=next;write(all);post(id,next);
  }
  document.addEventListener('input',event=>{const input=event.target.closest?.('[data-builder-control]');if(input)setTimeout(()=>updateFrom(input),0);},true);
  document.addEventListener('change',event=>{const input=event.target.closest?.('[data-builder-control]');if(input)setTimeout(()=>updateFrom(input),0);},true);
  function postAll(){const all=read();Object.entries(all).forEach(([id,cfg])=>post(id,cfg));}
  frame?.addEventListener('load',()=>[80,380,1000].forEach(d=>setTimeout(postAll,d)));
  if(layer){new MutationObserver(()=>setTimeout(postAll,0)).observe(layer,{childList:true,subtree:false});}
})();
