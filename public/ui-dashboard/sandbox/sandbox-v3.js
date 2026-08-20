(function(){
  if(window.__platformSandboxPreviewV3)return;
  window.__platformSandboxPreviewV3=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'';
  document.documentElement.dataset.builderSandbox='true';
  if(preview)document.documentElement.dataset.sandboxPreview=preview;

  function waitFor(selector,{root=document,attempts=80,delay=70}={}){
    return new Promise(resolve=>{
      let count=0;
      const tick=()=>{
        const node=$(selector,root);
        if(node){resolve(node);return;}
        if(++count>=attempts){resolve(null);return;}
        setTimeout(tick,delay);
      };
      tick();
    });
  }

  function createRoot(kind=preview){
    let root=$('#sandboxPreviewRoot');
    if(!root){root=document.createElement('main');root.id='sandboxPreviewRoot';document.body.appendChild(root);}
    root.dataset.previewKind=kind;
    return root;
  }

  function installPreviewCss(){
    if(!preview||$('#sandbox-preview-v3-style'))return;
    const style=document.createElement('style');
    style.id='sandbox-preview-v3-style';
    style.textContent=`
      html[data-sandbox-preview],html[data-sandbox-preview] body{min-height:100%;background:#fff!important;background-color:#fff!important}
      html[data-sandbox-preview] body{margin:0!important;overflow:auto!important;position:static!important;inset:auto!important;width:auto!important}
      html[data-sandbox-preview] .sandbox-side-ad{display:none!important}
      #sandboxPreviewRoot{box-sizing:border-box;width:100%;min-height:100vh;margin:0;display:grid;place-items:center;padding:36px clamp(18px,4vw,56px);background:#fff}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"]{align-content:start;padding-top:34px;min-height:190px}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .nav-shell{position:relative!important;top:auto!important;width:100%!important;height:auto!important;padding-top:0!important;background:transparent!important}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .nav-placeholder{display:none!important}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .read-progress{display:none!important}
      #sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]{place-items:start center;align-content:center;min-height:520px;overflow:hidden}
      #sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]>.desktop-rail-window,#sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]>.scroll-row{width:min(100%,1180px)!important;max-width:100%!important}
      #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{place-items:center start;min-height:220px;padding-inline:44px}
      #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"] .collection-filters{width:100%;margin:0!important;overflow-x:auto}
      #sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]{min-height:520px;background:var(--canvas,#fff)!important}
      #sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"] .sandbox-preview-device-context{width:min(100%,680px);padding:0!important;background:transparent!important}
      #sandboxPreviewRoot[data-preview-kind="floating-action"]{min-height:300px;position:relative}
      #sandboxPreviewRoot[data-preview-kind="floating-action"] .collection-fab{position:absolute!important;right:42px!important;bottom:36px!important}
      html[data-theme="dark"][data-sandbox-preview] body,html[data-theme="dark"][data-sandbox-preview] #sandboxPreviewRoot{background:#0d0f13!important;background-color:#0d0f13!important}
      html[data-theme="dark"][data-sandbox-preview="collection-bottom-sheet"] body{background:#0d0f13!important}
      html[data-sandbox-preview="collection-bottom-sheet"] body{overflow:hidden!important;background:#eef0f3!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionFab{display:none!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionLayer{display:block!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionBackdrop{position:fixed!important;inset:0!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionSheet{position:fixed!important}
      @media(max-width:560px){#sandboxPreviewRoot{padding:24px 14px}#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{padding-inline:16px}#sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]{min-height:440px}}
    `;
    document.head.appendChild(style);
  }

  function hideEverythingExcept(nodes=[]){
    const keep=new Set(nodes.filter(Boolean));
    [...document.body.children].forEach(node=>{
      if(node.tagName==='SCRIPT'||node.tagName==='STYLE'||keep.has(node))return;
      node.style.setProperty('display','none','important');
    });
  }

  function unlockDocument(){
    document.documentElement.classList.remove('collection-open');
    document.body.classList.remove('collection-open');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('left');
    document.body.style.removeProperty('right');
    document.body.style.removeProperty('width');
  }

  function clickLibraryTab(name){
    const button=$(`.collection-tab[data-library-tab="${name}"]`);button?.click();
  }

  async function openCollection(tab='all'){
    const fab=await waitFor('#collectionFab');
    if(!fab)return false;
    fab.click();
    await new Promise(resolve=>setTimeout(resolve,90));
    clickLibraryTab(tab);
    await new Promise(resolve=>setTimeout(resolve,120));
    return true;
  }

  function closeCollection(){
    $('#collectionClose')?.click();
    setTimeout(unlockDocument,240);
  }

  async function previewNavigation(){
    const shell=await waitFor('.nav-shell');if(!shell)return;
    const root=createRoot();
    root.appendChild(shell);
    shell.querySelector('.read-progress')?.remove();
    hideEverythingExcept([root]);
  }

  async function previewRail(){
    const row=await waitFor('.scroll-row');if(!row)return;
    await new Promise(resolve=>setTimeout(resolve,120));
    const source=row.parentElement?.classList.contains('desktop-rail-window')?row.parentElement:row;
    const root=createRoot();root.appendChild(source);
    hideEverythingExcept([root]);
  }

  async function previewFilters(){
    if(!await openCollection('video'))return;
    const filters=await waitFor('#collectionFilters');if(!filters)return;
    const root=createRoot();root.appendChild(filters);
    closeCollection();
    setTimeout(()=>hideEverythingExcept([root]),260);
  }

  async function previewSheet(){
    if(!await openCollection('all'))return;
    const layer=await waitFor('#collectionLayer');if(!layer)return;
    $('#collectionFab')?.style.setProperty('display','none','important');
    hideEverythingExcept([layer]);
    unlockDocument();
    document.body.style.overflow='hidden';
  }

  async function previewDevice(){
    if(!await openCollection('settings'))return;
    const link=await waitFor('#collectionDeviceLink');if(!link)return;
    link.click();
    await new Promise(resolve=>setTimeout(resolve,160));
    const accordion=await waitFor('.collection-device-accordion');if(!accordion)return;
    const root=createRoot();
    const context=document.createElement('div');context.className='collection-settings sandbox-preview-device-context';context.appendChild(accordion);root.appendChild(context);
    closeCollection();
    setTimeout(()=>hideEverythingExcept([root]),260);
  }

  async function previewFab(){
    const fab=await waitFor('#collectionFab');if(!fab)return;
    const root=createRoot();root.appendChild(fab);
    fab.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
    hideEverythingExcept([root]);
  }

  async function installPreview(){
    if(!preview)return;
    installPreviewCss();
    if(preview==='top-chapter-navigation')await previewNavigation();
    else if(preview==='horizontal-card-rail')await previewRail();
    else if(preview==='filter-chip-rail')await previewFilters();
    else if(preview==='collection-bottom-sheet')await previewSheet();
    else if(preview==='device-handoff-accordion')await previewDevice();
    else if(preview==='floating-action')await previewFab();
    window.parent?.postMessage({type:'platform-preview-ready',capabilityId:preview},location.origin);
  }

  function bindInlineOpen(){
    const button=$('#sandboxOpenCollection');if(!button||button.dataset.bound==='true')return;
    button.dataset.bound='true';button.addEventListener('click',()=>$('#collectionFab')?.click());
  }

  function init(){
    bindInlineOpen();
    if(typeof window.setupNavigation==='function')window.setupNavigation();
    if(preview)setTimeout(installPreview,80);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
