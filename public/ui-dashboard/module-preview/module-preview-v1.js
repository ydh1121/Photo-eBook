(function(){
  if(window.__platformModulePreviewV3)return;
  window.__platformModulePreviewV3=true;

  const params=new URLSearchParams(location.search);
  const registry=window.PlatformModuleRegistry;
  const styleRuntime=window.PlatformModuleStyleRuntime;
  const root=document.getElementById('platformModulePreviewRoot');
  if(!registry||!root)return;

  const consumer=params.get('embed')==='editor'?'editor':'library';
  const requested=params.get('module')||'top-chapter-navigation';
  const available=registry.listFor(consumer).map(item=>item.id);
  const moduleId=available.includes(requested)?requested:(available[0]||'');
  let props=consumer==='editor'?(registry.editorProps(moduleId)||{}):(registry.previewProps(moduleId)||{});
  let styleConfig={};
  let mounted=null;

  document.documentElement.dataset.platformModulePreview='true';
  document.documentElement.dataset.platformModule=moduleId;
  document.documentElement.dataset.platformModuleConsumer=consumer;

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
  function stageMarkup(){
    let contextClass='';
    let before='',after='';
    if(moduleId==='horizontal-card-rail'){
      contextClass=' platform-module-context--rail';before='<div class="wide">';after='</div>';
    }else if(moduleId==='filter-chip-rail'){
      contextClass=' platform-module-context--segmented';
    }else if(moduleId==='device-handoff-accordion'){
      contextClass=' platform-module-context--device';
    }
    root.innerHTML=`<section class="platform-module-stage" data-module="${registry.attr(moduleId)}"><div class="platform-module-context${contextClass}">${before}<div class="platform-module-host" id="platformModuleHost"></div>${after}</div></section>`;
    return document.getElementById('platformModuleHost');
  }
  function applyStyle(){styleRuntime?.apply?.(moduleId,root,styleConfig);}
  function mount({announce=false}={}){
    mounted?.cleanup?.();
    const host=stageMarkup();if(!host)return;
    try{
      mounted=registry.mount(host,moduleId,props,{consumer});
      applyStyle();
      requestAnimationFrame(()=>{window.dispatchEvent(new Event('resize'));applyStyle();});
      if(announce)post('platform-preview-ready',{canonicalModule:true,consumer,provenance:registry.provenance(moduleId),sourceOwner:'photo-public-module-source-v1'});
    }catch(error){
      host.textContent=error?.message||'모듈을 불러오지 못했습니다.';
      post('platform-preview-error',{message:String(error?.message||error)});
    }
  }
  function applyState(state){
    if(moduleId==='collection-bottom-sheet'){
      mounted?.api?.setState?.({tab:String(state||'all'),filter:'all'});
      mounted?.api?.open?.(String(state||'all'));
      applyStyle();
      return;
    }
    if(moduleId==='device-handoff-accordion'){
      const want=state==='expanded';
      const attempt=()=>{
        const link=root.querySelector('#collectionDeviceLink');if(!link)return false;
        const expanded=link.getAttribute('aria-expanded')==='true';if(expanded!==want)link.click();applyStyle();return true;
      };
      if(!attempt())setTimeout(attempt,160);
    }
  }

  root.addEventListener('platform-filter-select',event=>post('platform-filter-chip-selection',{value:event.detail?.value||'all'}));
  root.addEventListener('platform-collection-tab',event=>post('platform-preview-state-change',{state:event.detail?.tab||'all'}));
  root.addEventListener('platform-collection-render',event=>{if(event.detail?.tab==='settings')setTimeout(()=>{window.dispatchEvent(new Event('pageshow'));applyStyle();},0);});

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-theme'){theme(data.theme);requestAnimationFrame(applyStyle);return;}
    if(data.type==='platform-module-style'&&data.moduleId===moduleId){styleConfig=data.config&&typeof data.config==='object'?registry.clone(data.config):{};applyStyle();return;}
    if(data.type==='platform-module-props'&&data.moduleId===moduleId){
      props=data.props&&typeof data.props==='object'?registry.clone(data.props):registry.previewProps(moduleId);mount();return;
    }
    if(data.type==='platform-editor-module-props'&&consumer==='editor'&&data.moduleId===moduleId){
      props=data.props&&typeof data.props==='object'?registry.clone(data.props):registry.editorProps(moduleId);
      if(data.styleConfig&&typeof data.styleConfig==='object')styleConfig=registry.clone(data.styleConfig);
      mount();post('platform-editor-module-ready',{consumer:'editor'});return;
    }
    if(data.type==='platform-kit-state'&&data.capabilityId===moduleId){applyState(data.state);return;}
  });

  const media=matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change',()=>{if(document.documentElement.dataset.themeChoice==='system')theme('system');});
  theme('light');mount({announce:true});
})();
