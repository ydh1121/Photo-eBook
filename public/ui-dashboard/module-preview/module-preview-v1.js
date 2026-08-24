(function(){
  if(window.__platformModulePreviewV5)return;
  window.__platformModulePreviewV5=true;

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
  let styleConfig=registry.clone(registry.get(moduleId)?.styleDefaults||{});
  let mounted=null;
  const scriptLoads=new Map();

  document.documentElement.dataset.platformModulePreview='true';
  document.documentElement.dataset.platformModule=moduleId;
  document.documentElement.dataset.platformModuleConsumer=consumer;

  function post(type,payload={}){try{window.parent?.postMessage({type,capabilityId:moduleId,moduleId,...payload},location.origin);}catch{}}
  function theme(value){const choice=['light','dark','system'].includes(value)?value:'light';const resolved=choice==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):choice;document.documentElement.dataset.themeChoice=choice;document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved;}
  function stageMarkup(){
    let contextClass='',before='',after='';
    if(moduleId==='horizontal-card-rail'){contextClass=' platform-module-context--rail';before='<div class="wide">';after='</div>';}
    else if(moduleId==='filter-chip-rail')contextClass=' platform-module-context--segmented';
    else if(moduleId==='device-handoff-accordion')contextClass=' platform-module-context--device';
    root.innerHTML=`<section class="platform-module-stage" data-module="${registry.attr(moduleId)}"><div class="platform-module-context${contextClass}">${before}<div class="platform-module-host" id="platformModuleHost"></div>${after}</div></section>`;
    return document.getElementById('platformModuleHost');
  }
  function applyStyle(){
    try{styleRuntime?.apply?.(moduleId,root,styleConfig);document.documentElement.removeAttribute('data-platform-style-error');return true;}
    catch(error){document.documentElement.dataset.platformStyleError=String(error?.message||error);post('platform-preview-style-error',{message:String(error?.message||error)});return false;}
  }
  function loadScript(src){
    if(scriptLoads.has(src))return scriptLoads.get(src);
    const promise=new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(script=>(script.getAttribute('src')||'').split('?')[0]===src.split('?')[0]);
      if(existing){resolve(existing);return;}
      const script=document.createElement('script');script.src=src;script.async=false;script.onload=()=>resolve(script);script.onerror=()=>reject(new Error(`스크립트를 불러오지 못했습니다: ${src}`));document.body.appendChild(script);
    });
    scriptLoads.set(src,promise);return promise;
  }
  function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function readObject(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

  function primeQuestionStateThroughOwner(item){
    const text=String(item?.selected_text||'').trim();
    const question=String(item?.question||'').trim();
    const bubble=document.getElementById('askBubble');
    if(!text||!bubble||!window.getSelection)return false;

    let app=document.getElementById('app');
    let createdApp=false;
    if(!app){
      app=document.createElement('div');
      app.id='app';
      app.setAttribute('aria-hidden','true');
      app.style.cssText='position:fixed;left:-10000px;top:0;width:max-content;max-width:600px;opacity:0.001;pointer-events:none;z-index:-1';
      document.body.appendChild(app);
      createdApp=true;
    }
    const marker=document.createElement('span');
    marker.textContent=text;
    app.appendChild(marker);

    try{
      const range=document.createRange();
      range.selectNodeContents(marker);
      const selection=window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      bubble.click();
    }catch{
      marker.remove();
      if(createdApp)app.remove();
      return false;
    }

    document.getElementById('askMinimize')?.click();
    const input=document.getElementById('askInput');
    if(input){
      input.value=question;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    marker.remove();
    if(createdApp)app.remove();
    requestAnimationFrame(()=>window.__photoForceQuestionWrite?.());
    return true;
  }

  function openSavedQuestionThroughOwner(id){
    const key=String(id||'');
    if(!key)return false;
    const item=readArray('photoRoadmapQuestionsV2').find(entry=>String(entry?.id||'')===key);
    if(!item)return false;
    if(primeQuestionStateThroughOwner(item))return true;

    const ownerCard=[...document.querySelectorAll('#historyList .history-item')].find(card=>String(card.dataset.historyId||'')===key);
    const ownerOpen=ownerCard?.querySelector('.history-open');
    if(!ownerOpen)return false;
    ownerOpen.click();
    requestAnimationFrame(()=>window.__photoForceQuestionWrite?.());
    return true;
  }

  if(moduleId==='collection-bottom-sheet'){
    document.addEventListener('click',event=>{
      const trigger=event.target.closest?.('.v41-question-open,.collection-question-open');
      if(!trigger)return;
      const id=trigger.closest('.collection-item')?.dataset.libraryId||'';
      if(!openSavedQuestionThroughOwner(id))return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);
  }

  function previewCollectionSource(){
    const VIDEO_IDS='photoRoadmapVideoFavoritesV1',VIDEO_ITEMS='photoRoadmapVideoFavoriteItemsV2',ARTICLE_IDS='photoRoadmapCuratedFavoritesV1',ARTICLE_ITEMS='photoRoadmapCuratedFavoriteItemsV2',QUESTIONS='photoRoadmapQuestionsV2';
    return {
      getItems(){
        const videos=readObject(VIDEO_ITEMS),articles=readObject(ARTICLE_ITEMS);
        const videoItems=readArray(VIDEO_IDS).map(id=>videos[id]).filter(Boolean).map(item=>({...item,type:'video'}));
        const articleItems=readArray(ARTICLE_IDS).map(id=>articles[id]).filter(Boolean).map(item=>({...item,type:'article'}));
        const questions=readArray(QUESTIONS).map(item=>({...item,type:'question'}));
        return [...videoItems,...articleItems,...questions];
      },
      removeItem(type,id){
        if(type==='video'){writeArray(VIDEO_IDS,readArray(VIDEO_IDS).filter(value=>String(value)!==String(id)));const items=readObject(VIDEO_ITEMS);delete items[id];writeObject(VIDEO_ITEMS,items);}
        else if(type==='article'){writeArray(ARTICLE_IDS,readArray(ARTICLE_IDS).filter(value=>String(value)!==String(id)));const items=readObject(ARTICLE_ITEMS);delete items[id];writeObject(ARTICLE_ITEMS,items);}
        else if(type==='question')writeArray(QUESTIONS,readArray(QUESTIONS).filter(item=>String(item?.id)!==String(id)));
      },
      openQuestion(id){openSavedQuestionThroughOwner(id);},
      openSettings(){}
    };
  }
  async function ensureCollectionBase(){
    if(moduleId!=='collection-bottom-sheet')return;
    await loadScript('/assets/js/app/app-shell.js?v=1');
    await loadScript('/assets/js/questions/drawer-enhancements.js?v=1');
    window.setupQuestionDrawer?.();
  }
  async function ensureCollectionEnhancers(){
    if(moduleId!=='collection-bottom-sheet')return;
    await loadScript('/assets/js/collection/bulk-selection.js?v=1');
    await loadScript('/assets/js/questions/question-actions.js?v=1');
    await loadScript('/assets/js/questions/question-workspace.js?v=1');
    window.dispatchEvent(new Event('pageshow'));
    setTimeout(()=>{window.dispatchEvent(new Event('pageshow'));applyStyle();},180);
  }
  function normalizeStyleConfig(value){
    const next=value&&typeof value==='object'?registry.clone(value):registry.clone(registry.get(moduleId)?.styleDefaults||{});
    if(moduleId==='filter-chip-rail'&&!['ios-liquid','ios-flat'].includes(next.family))next.family='ios-liquid';
    return next;
  }
  async function mount({announce=false}={}){
    mounted?.cleanup?.();
    if(moduleId==='collection-bottom-sheet')await ensureCollectionBase();
    const host=stageMarkup();if(!host)return;
    try{
      const context={consumer};
      if(moduleId==='collection-bottom-sheet')context.collectionSource=previewCollectionSource();
      mounted=registry.mount(host,moduleId,props,context);
      document.documentElement.removeAttribute('data-platform-mount-error');
    }catch(error){
      const message=String(error?.message||error);
      document.documentElement.dataset.platformMountError=message;
      host.textContent=message||'모듈을 불러오지 못했습니다.';
      post('platform-preview-error',{message});
      return;
    }
    applyStyle();
    if(moduleId==='collection-bottom-sheet')await ensureCollectionEnhancers();
    requestAnimationFrame(()=>{window.dispatchEvent(new Event('resize'));applyStyle();});
    if(announce)post('platform-preview-ready',{canonicalModule:true,consumer,provenance:registry.provenance(moduleId),sourceOwner:'photo-public-module-source-v1'});
  }
  function applyState(state){
    if(moduleId==='collection-bottom-sheet'){mounted?.api?.setState?.({tab:String(state||'all'),filter:'all'});mounted?.api?.open?.(String(state||'all'));applyStyle();return;}
    if(moduleId==='device-handoff-accordion'){const want=state==='expanded';const attempt=()=>{const link=root.querySelector('#collectionDeviceLink');if(!link)return false;const expanded=link.getAttribute('aria-expanded')==='true';if(expanded!==want)link.click();applyStyle();return true;};if(!attempt())setTimeout(attempt,160);}
  }

  root.addEventListener('platform-filter-select',event=>post('platform-filter-chip-selection',{value:event.detail?.value||'all'}));
  root.addEventListener('platform-collection-tab',event=>post('platform-preview-state-change',{state:event.detail?.tab||'all'}));
  root.addEventListener('platform-collection-render',()=>setTimeout(()=>{window.dispatchEvent(new Event('pageshow'));applyStyle();},0));

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;const data=event.data||{};
    if(data.type==='platform-theme'){theme(data.theme);requestAnimationFrame(applyStyle);return;}
    if(data.type==='platform-module-style'&&data.moduleId===moduleId){styleConfig=normalizeStyleConfig(data.config);applyStyle();return;}
    if(data.type==='platform-module-props'&&data.moduleId===moduleId){props=data.props&&typeof data.props==='object'?registry.clone(data.props):registry.previewProps(moduleId);mount();return;}
    if(data.type==='platform-editor-module-props'&&consumer==='editor'&&data.moduleId===moduleId){props=data.props&&typeof data.props==='object'?registry.clone(data.props):registry.editorProps(moduleId);styleConfig=normalizeStyleConfig(data.styleConfig);mount();post('platform-editor-module-ready',{consumer:'editor'});return;}
    if(data.type==='platform-kit-state'&&data.capabilityId===moduleId){applyState(data.state);return;}
  });

  const media=matchMedia('(prefers-color-scheme: dark)');media.addEventListener?.('change',()=>{if(document.documentElement.dataset.themeChoice==='system')theme('system');});theme('light');mount({announce:true});
})();
