(function(){
  if(window.__platformReferencePreviewV1)return;
  window.__platformReferencePreviewV1=true;

  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'top-chapter-navigation';
  const valid=new Set(['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action']);
  const component=valid.has(preview)?preview:'top-chapter-navigation';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  document.documentElement.dataset.referencePreview='true';
  document.documentElement.dataset.referenceComponent=component;

  function post(type,payload={}){
    try{window.parent?.postMessage({type,capabilityId:component,...payload},location.origin);}catch{}
  }

  async function waitFor(selector,{attempts=120,delay=50,root=document}={}){
    for(let i=0;i<attempts;i++){
      const node=$(selector,root);if(node)return node;
      await sleep(delay);
    }
    return null;
  }

  async function waitForCount(selector,count,{attempts=120,delay=50,root=document}={}){
    let nodes=[];
    for(let i=0;i<attempts;i++){
      nodes=$$(selector,root);if(nodes.length>=count)return nodes;
      await sleep(delay);
    }
    return nodes;
  }

  function theme(value){
    const choice=['light','dark','system'].includes(value)?value:'light';
    const resolved=choice==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):choice;
    document.documentElement.dataset.theme=resolved;
    document.documentElement.dataset.themeChoice=choice;
  }

  function sheetOpen(){
    const sheet=$('#collectionSheet');
    return Boolean(sheet&&!sheet.hidden&&sheet.classList.contains('is-open'));
  }

  async function openCollection(tab='all'){
    const fab=await waitFor('#collectionFab');
    if(!fab)return false;
    if(!sheetOpen()){
      fab.click();
      await sleep(120);
    }
    const button=$(`.collection-tab[data-library-tab="${tab}"]`);
    if(button&&!button.classList.contains('is-active')){
      button.click();
      await sleep(90);
    }
    return sheetOpen();
  }

  function closeCollection(){
    const close=$('#collectionClose');
    if(close&&sheetOpen())close.click();
  }

  function loadFilterPreviewRuntime(){
    return new Promise(resolve=>{
      if(window.__platformFilterChipLiveRuntimeV3){resolve();return;}
      const script=document.createElement('script');
      script.src='/ui-dashboard/sandbox/filter-chip-live-runtime-v3.js?v=2';
      script.async=false;
      script.onload=()=>resolve();script.onerror=()=>resolve();
      document.head.appendChild(script);
    });
  }

  async function prepareNavigation(){
    closeCollection();
    if(typeof window.setupNavigation==='function')window.setupNavigation();
    await waitFor('.nav-shell');
    await sleep(80);
  }

  async function prepareRail(){
    closeCollection();
    const row=await waitFor('.scroll-row');
    if(!row)return;
    await sleep(180);
  }

  async function prepareFilter(){
    if(!await openCollection('video'))return;
    const filters=await waitFor('#collectionFilters');
    if(!filters)return;
    filters.hidden=false;filters.removeAttribute('hidden');
    await waitForCount('.collection-filter',4,{root:filters});
    await loadFilterPreviewRuntime();
    await sleep(160);
  }

  async function prepareSheet(){
    await openCollection('all');
    await waitFor('#collectionSheet.is-open');
    await sleep(80);
  }

  async function prepareDevice(){
    if(!await openCollection('settings'))return;
    await waitFor('.collection-device-accordion');
    const link=await waitFor('#collectionDeviceLink');
    if(link?.getAttribute('aria-expanded')==='true')link.click();
    await sleep(120);
  }

  async function prepareFab(){
    closeCollection();
    await waitFor('#collectionFab');
    await sleep(80);
  }

  async function prepare(){
    if(component==='top-chapter-navigation')await prepareNavigation();
    else if(component==='horizontal-card-rail')await prepareRail();
    else if(component==='filter-chip-rail')await prepareFilter();
    else if(component==='collection-bottom-sheet')await prepareSheet();
    else if(component==='device-handoff-accordion')await prepareDevice();
    else if(component==='floating-action')await prepareFab();
    post('platform-preview-ready',{referenceRuntime:true});
  }

  async function applyState(capabilityId,state){
    if(capabilityId==='collection-bottom-sheet'&&component==='collection-bottom-sheet'){
      const tab=['all','video','article','question','settings'].includes(state)?state:'all';
      await openCollection(tab);
      return;
    }
    if(capabilityId==='device-handoff-accordion'&&component==='device-handoff-accordion'){
      await openCollection('settings');
      const link=await waitFor('#collectionDeviceLink');
      if(!link)return;
      const expanded=link.getAttribute('aria-expanded')==='true';
      const want=state==='expanded';
      if(expanded!==want)link.click();
    }
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-theme'){theme(data.theme);return;}
    if(data.type==='platform-kit-state'&&data.capabilityId)applyState(data.capabilityId,data.state);
  });

  document.addEventListener('click',event=>{
    const tab=event.target instanceof Element?event.target.closest('.collection-tab[data-library-tab]'):null;
    if(tab&&component==='collection-bottom-sheet')post('platform-preview-state-change',{state:tab.dataset.libraryTab||'all'});
  },true);

  const media=matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change',()=>{if(document.documentElement.dataset.themeChoice==='system')theme('system');});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prepare,80),{once:true});
  else setTimeout(prepare,80);
})();
