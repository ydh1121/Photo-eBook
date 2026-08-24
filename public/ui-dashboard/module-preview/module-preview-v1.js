(function(){
  if(window.__platformModulePreviewV1)return;
  window.__platformModulePreviewV1=true;

  const params=new URLSearchParams(location.search);
  const registry=window.PlatformModuleRegistry;
  const root=document.getElementById('platformModulePreviewRoot');
  if(!registry||!root)return;

  const requested=params.get('module')||'top-chapter-navigation';
  const available=registry.listFor('library').map(item=>item.id);
  const moduleId=available.includes(requested)?requested:(available[0]||'');
  let props=registry.previewProps(moduleId)||{};
  let mounted=null;

  document.documentElement.dataset.platformModulePreview='true';
  document.documentElement.dataset.platformModule=moduleId;

  function post(type,payload={}){
    try{window.parent?.postMessage({type,capabilityId:moduleId,moduleId,...payload},location.origin);}catch{}
  }

  function theme(value){
    const choice=['light','dark','system'].includes(value)?value:'light';
    const resolved=choice==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):choice;
    document.documentElement.dataset.themeChoice=choice;
    document.documentElement.dataset.theme=resolved;
    document.documentElement.style.colorScheme=resolved;
  }

  function normalizedFilterItems(value){
    return (Array.isArray(value)?value:[]).map((item,index)=>{
      if(item&&typeof item==='object'){
        const label=String(item.label||'').trim();if(!label)return null;
        return {id:String(item.id||`filter-${index}`),label,family:String(item.family||'inherit')};
      }
      const label=String(item||'').trim();
      return label?{id:`filter-${index}`,label,family:'inherit'}:null;
    }).filter(Boolean).slice(0,24);
  }

  function stageMarkup(){
    root.innerHTML=`<section class="platform-module-stage" data-module="${registry.attr(moduleId)}"><div class="platform-module-host" id="platformModuleHost"></div></section>`;
    return document.getElementById('platformModuleHost');
  }

  function mount({announce=false}={}){
    mounted?.cleanup?.();
    const host=stageMarkup();
    if(!host)return;
    try{
      mounted=registry.mount(host,moduleId,props,{consumer:'library'});
      requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
      if(announce)post('platform-preview-ready',{canonicalModule:true,provenance:registry.provenance(moduleId)});
    }catch(error){
      host.textContent=error?.message||'모듈을 불러오지 못했습니다.';
      post('platform-preview-error',{message:String(error?.message||error)});
    }
  }

  function applyState(state){
    if(moduleId==='collection-bottom-sheet'){
      const tab=root.querySelector(`.collection-tab[data-library-tab="${CSS.escape(String(state||'all'))}"]`);
      tab?.click();
      return;
    }
    if(moduleId==='device-handoff-accordion'){
      const want=state==='expanded';
      const attempt=()=>{
        const link=root.querySelector('#collectionDeviceLink');if(!link)return false;
        const expanded=link.getAttribute('aria-expanded')==='true';
        if(expanded!==want)link.click();
        return true;
      };
      if(!attempt())setTimeout(attempt,120);
    }
  }

  function applyFilterItems(value){
    if(moduleId!=='filter-chip-rail'&&moduleId!=='collection-bottom-sheet')return;
    const items=normalizedFilterItems(value);if(!items.length)return;
    if(moduleId==='filter-chip-rail'){
      const current=String(props.activeId||'');
      props={...props,items,activeId:items.some(item=>item.id===current)?current:items[0].id};
    }else{
      props={...props,filterItems:items};
    }
    mount();
  }

  root.addEventListener('platform-filter-select',event=>{
    const id=String(event.detail?.id||'');if(!id)return;
    props={...props,activeId:id};
    post('platform-filter-chip-selection',{id});
  });
  root.addEventListener('platform-collection-tab',event=>post('platform-preview-state-change',{state:event.detail?.tab||'all'}));

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-theme'){theme(data.theme);return;}
    if(data.type==='platform-kit-state'&&data.capabilityId===moduleId){applyState(data.state);return;}
    if(data.type==='platform-filter-chip-preview-items'){applyFilterItems(data.items||data.labels);return;}
  });

  const media=matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change',()=>{if(document.documentElement.dataset.themeChoice==='system')theme('system');});

  theme('light');
  mount({announce:true});
})();
