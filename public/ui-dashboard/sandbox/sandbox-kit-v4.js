(function(){
  if(window.__platformSandboxKitV4)return;
  window.__platformSandboxKitV4=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'';
  document.documentElement.dataset.builderSandbox='true';
  if(preview)document.documentElement.dataset.sandboxPreview=preview;

  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function waitFor(selector,{root=document,attempts=100,delay=60}={}){
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
  function waitForCount(selector,count,{root=document,attempts=100,delay=60}={}){
    return new Promise(resolve=>{
      let tries=0;
      const tick=()=>{
        const nodes=$$(selector,root);
        if(nodes.length>=count){resolve(nodes);return;}
        if(++tries>=attempts){resolve(nodes);return;}
        setTimeout(tick,delay);
      };
      tick();
    });
  }

  function createRoot(kind=preview){
    let root=$('#sandboxPreviewRoot');
    if(!root){
      root=document.createElement('main');
      root.id='sandboxPreviewRoot';
      document.body.appendChild(root);
    }
    root.dataset.previewKind=kind;
    return root;
  }

  function installPreviewCss(){
    if(!preview||$('#sandbox-kit-v4-style'))return;
    const style=document.createElement('style');
    style.id='sandbox-kit-v4-style';
    style.textContent=`
      html[data-sandbox-preview]{--kit-floor:#fff;--kit-floor-2:#f5f6f8;--kit-border:rgba(27,39,63,.08)}
      html[data-theme="dark"][data-sandbox-preview]{--kit-floor:#0d0f13;--kit-floor-2:#12151a;--kit-border:rgba(255,255,255,.09)}
      html[data-sandbox-preview],html[data-sandbox-preview] body{min-height:100%;background:var(--kit-floor)!important;background-color:var(--kit-floor)!important}
      html[data-sandbox-preview] body{margin:0!important;overflow:auto!important;position:static!important;inset:auto!important;width:auto!important}
      html[data-sandbox-preview] .sandbox-side-ad{display:none!important}
      #sandboxPreviewRoot{box-sizing:border-box;position:relative;width:100%;min-height:100vh;margin:0;display:grid;place-items:center;padding:42px clamp(20px,5vw,72px);background:var(--kit-floor)!important;color:inherit}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"]{align-content:start;padding-top:42px;min-height:220px}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .nav-shell{position:relative!important;top:auto!important;left:auto!important;right:auto!important;width:100%!important;height:auto!important;margin:0!important;padding-top:0!important;background:transparent!important;transform:none!important}
      #sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .nav-placeholder,#sandboxPreviewRoot[data-preview-kind="top-chapter-navigation"] .read-progress{display:none!important}
      #sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]{place-items:center;align-content:center;min-height:560px;overflow:hidden}
      #sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]>.desktop-rail-window,#sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]>.scroll-row{width:min(100%,1180px)!important;max-width:100%!important}
      #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{place-items:center;min-height:260px}
      #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"] .collection-filters{width:max-content;max-width:100%;margin:0!important;overflow-x:auto;padding:0!important}
      #sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]{min-height:520px}
      #sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]>.collection-device-accordion{width:min(100%,680px);margin:0!important}
      #sandboxPreviewRoot[data-preview-kind="floating-action"]{min-height:300px;position:relative}
      #sandboxPreviewRoot[data-preview-kind="floating-action"] .collection-fab{position:absolute!important;right:42px!important;bottom:36px!important}
      #sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"]{display:block;min-height:100vh;padding:0;background:var(--kit-floor-2)!important;overflow:hidden}
      #sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"] #collectionLayer{display:block!important}
      #sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"] #collectionFab{display:none!important}
      #sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"] #collectionBackdrop{position:fixed!important;inset:0!important}
      #sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"] #collectionSheet{position:fixed!important}
      @media(max-width:560px){
        #sandboxPreviewRoot{padding:28px 14px}
        #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{padding-inline:18px}
        #sandboxPreviewRoot[data-preview-kind="horizontal-card-rail"]{min-height:460px}
      }
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
    document.body.style.removeProperty('overflow');
  }

  function clickLibraryTab(name){
    const button=$(`.collection-tab[data-library-tab="${name}"]`);
    button?.click();
  }

  async function openCollection(tab='all'){
    const fab=await waitFor('#collectionFab');
    if(!fab)return false;
    fab.click();
    await sleep(110);
    clickLibraryTab(tab);
    await sleep(150);
    return true;
  }

  function closeCollection(){
    $('#collectionClose')?.click();
    setTimeout(unlockDocument,240);
  }

  async function previewNavigation(){
    const shell=await waitFor('.nav-shell');
    if(!shell)return;
    const root=createRoot();
    root.appendChild(shell);
    shell.querySelector('.read-progress')?.remove();
    hideEverythingExcept([root]);
  }

  async function previewRail(){
    const row=await waitFor('.scroll-row');
    if(!row)return;
    await sleep(120);
    const source=row.parentElement?.classList.contains('desktop-rail-window')?row.parentElement:row;
    const root=createRoot();
    root.appendChild(source);
    hideEverythingExcept([root]);
  }

  async function previewFilters(){
    if(!await openCollection('video'))return;
    const filters=await waitFor('#collectionFilters');
    if(!filters)return;
    await waitForCount('.collection-filter',4,{root:filters,attempts:60,delay:50});
    const root=createRoot();
    filters.hidden=false;
    filters.removeAttribute('hidden');
    root.appendChild(filters);
    closeCollection();
    await sleep(240);
    hideEverythingExcept([root]);
  }

  async function previewSheet(){
    if(!await openCollection('all'))return;
    const layer=await waitFor('#collectionLayer');
    if(!layer)return;
    const root=createRoot();
    root.appendChild(layer);
    $('#collectionFab',layer)?.style.setProperty('display','none','important');
    hideEverythingExcept([root]);
    unlockDocument();
  }

  async function previewDevice(){
    if(!await openCollection('settings'))return;
    const accordion=await waitFor('.collection-device-accordion');
    if(!accordion)return;
    const root=createRoot();
    root.appendChild(accordion);
    const link=$('#collectionDeviceLink',accordion);
    if(link?.getAttribute('aria-expanded')==='true')link.click();
    closeCollection();
    await sleep(240);
    hideEverythingExcept([root]);
  }

  async function previewFab(){
    const fab=await waitFor('#collectionFab');
    if(!fab)return;
    const root=createRoot();
    root.appendChild(fab);
    fab.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
    hideEverythingExcept([root]);
  }

  async function setBottomSheetTab(tab){
    const valid=['all','video','article','question','settings'].includes(tab)?tab:'all';
    let sheet=$('#collectionSheet');
    if(!sheet||sheet.hidden||!sheet.classList.contains('is-open')){
      const layer=$('#collectionLayer');
      const root=createRoot('collection-bottom-sheet');
      if(layer&&!root.contains(layer))root.appendChild(layer);
      await openCollection(valid);
      sheet=$('#collectionSheet');
      $('#collectionFab')?.style.setProperty('display','none','important');
      hideEverythingExcept([root]);
      unlockDocument();
      return;
    }
    clickLibraryTab(valid);
  }

  function setDeviceState(state){
    const root=$('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');
    const link=root?.querySelector('#collectionDeviceLink');
    if(!link)return;
    const expanded=link.getAttribute('aria-expanded')==='true';
    const wantExpanded=state==='expanded';
    if(expanded!==wantExpanded)link.click();
  }

  function applyKitState(capabilityId,state){
    if(capabilityId==='device-handoff-accordion')setDeviceState(state);
    else if(capabilityId==='collection-bottom-sheet')setBottomSheetTab(state);
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

  function installEditorNavPin(){
    if(preview)return;
    const shell=$('.nav-shell');
    if(!shell||shell.dataset.editorNavPinBound==='true')return;
    if(document.documentElement.classList.contains('ios-webkit-chrome'))return;
    shell.dataset.editorNavPinBound='true';

    document.documentElement.style.setProperty('overflow-x','clip','important');
    document.body?.style.setProperty('overflow-x','clip','important');
    $('#app')?.style.setProperty('overflow','visible','important');

    const spacer=document.createElement('div');
    spacer.className='sandbox-nav-pin-spacer';
    spacer.setAttribute('aria-hidden','true');
    shell.before(spacer);
    let pinned=false;
    let raf=0;
    const props=['position','top','left','right','width','z-index','transform'];
    const shellHeight=()=>Math.max(1,Math.ceil(shell.getBoundingClientRect().height||shell.offsetHeight||0));

    function setPinned(next){
      if(next===pinned)return;
      pinned=next;
      shell.classList.toggle('is-sandbox-editor-pinned',pinned);
      if(pinned){
        spacer.style.height=`${shellHeight()}px`;
        shell.style.setProperty('position','fixed','important');
        shell.style.setProperty('top','0','important');
        shell.style.setProperty('left','0','important');
        shell.style.setProperty('right','0','important');
        shell.style.setProperty('width','100%','important');
        shell.style.setProperty('z-index','100','important');
        shell.style.setProperty('transform','none','important');
      }else{
        props.forEach(prop=>shell.style.removeProperty(prop));
        spacer.style.height='0px';
      }
    }
    function update(){
      raf=0;
      setPinned(spacer.getBoundingClientRect().top<=0);
      if(pinned)spacer.style.height=`${shellHeight()}px`;
    }
    function queue(){if(!raf)raf=requestAnimationFrame(update);}
    document.addEventListener('scroll',queue,{passive:true,capture:true});
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue,{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(queue).observe(shell);
    queue();
  }

  function bindInlineOpen(){
    const button=$('#sandboxOpenCollection');
    if(!button||button.dataset.bound==='true')return;
    button.dataset.bound='true';
    button.addEventListener('click',()=>$('#collectionFab')?.click());
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-kit-state'&&data.capabilityId)applyKitState(data.capabilityId,data.state);
  });

  function init(){
    bindInlineOpen();
    if(typeof window.setupNavigation==='function')window.setupNavigation();
    if(preview)setTimeout(installPreview,90);
    else{
      setTimeout(installEditorNavPin,0);
      setTimeout(installEditorNavPin,180);
      setTimeout(installEditorNavPin,520);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
