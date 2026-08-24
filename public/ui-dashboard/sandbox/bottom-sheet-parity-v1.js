(function(){
  const preview=new URLSearchParams(location.search).get('preview')||'';
  if(preview!=='collection-bottom-sheet'||window.__platformBottomSheetParityV3)return;
  window.__platformBottomSheetParityV3=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  let currentTab='all';
  let repairRaf=0;

  function installStyle(){
    if($('#platform-bottom-sheet-parity-v3-style'))return;
    const style=document.createElement('style');
    style.id='platform-bottom-sheet-parity-v3-style';
    style.textContent=`
      html[data-sandbox-preview="collection-bottom-sheet"],html[data-sandbox-preview="collection-bottom-sheet"] body{overflow:hidden!important;background:#f5f6f8!important}
      html[data-theme="dark"][data-sandbox-preview="collection-bottom-sheet"],html[data-theme="dark"][data-sandbox-preview="collection-bottom-sheet"] body{background:#12151a!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #sandboxPreviewRoot{position:absolute!important;inset:0!important;min-height:0!important;height:0!important;padding:0!important;background:transparent!important;pointer-events:none!important;overflow:visible!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionLayer{display:block!important;position:static!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionFab{display:none!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionBackdrop{position:fixed!important;inset:0!important;display:block!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionSheet{
        position:fixed!important;display:grid!important;left:0!important;right:0!important;bottom:0!important;
        width:min(100%,760px)!important;height:min(84dvh,780px)!important;margin:0 auto!important;
        transform:translateY(0)!important;transition:transform .2s cubic-bezier(.22,.75,.2,1)!important
      }
    `;
    document.head.appendChild(style);
  }

  function unlockDocument(){
    document.documentElement.classList.remove('collection-open');
    document.body.classList.remove('collection-open');
    for(const prop of ['top','position','left','right','width','overflow'])document.body.style.removeProperty(prop);
  }

  function keepOnly(root,layer){
    [...document.body.children].forEach(node=>{
      if(node===root||node===layer||node.tagName==='SCRIPT'||node.tagName==='STYLE')return;
      node.style.setProperty('display','none','important');
    });
  }

  function ensureHierarchy(){
    const root=$('#sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"]')||$('#sandboxPreviewRoot');
    const layer=$('#collectionLayer');
    if(!root||!layer)return null;
    if(layer.parentElement!==document.body)document.body.insertBefore(layer,root);
    keepOnly(root,layer);
    return {root,layer};
  }

  function stabilize({clickTab=false}={}){
    installStyle();
    const nodes=ensureHierarchy();
    if(!nodes)return false;
    const {root,layer}=nodes;
    unlockDocument();
    $('#collectionFab',layer)?.style.setProperty('display','none','important');
    const tab=layer.querySelector(`.collection-tab[data-library-tab="${currentTab}"]`);
    if(clickTab&&tab&&!tab.classList.contains('is-active'))tab.click();
    const sheet=$('#collectionSheet',layer),backdrop=$('#collectionBackdrop',layer);
    if(!sheet)return false;
    sheet.hidden=false;
    sheet.removeAttribute('hidden');
    sheet.classList.add('is-open');
    sheet.classList.remove('is-dragging');
    sheet.style.setProperty('--drag-y','0px');
    sheet.style.setProperty('transform','translateY(0)','important');
    if(backdrop){backdrop.hidden=false;backdrop.removeAttribute('hidden');}
    root.dataset.bottomSheetParityReady='true';
    root.dataset.bottomSheetTab=currentTab;
    return true;
  }

  function queueStabilize(clickTab=false){
    if(repairRaf)return;
    repairRaf=requestAnimationFrame(()=>{repairRaf=0;stabilize({clickTab});});
  }

  function repair(tab='all'){
    currentTab=['all','video','article','question','settings'].includes(tab)?tab:'all';
    if(stabilize({clickTab:true}))return;
    $('#collectionFab')?.click();
    [40,120,240].forEach(delay=>setTimeout(()=>stabilize({clickTab:true}),delay));
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-kit-state'&&data.capabilityId==='collection-bottom-sheet'){
      currentTab=['all','video','article','question','settings'].includes(data.state)?data.state:'all';
      stabilize({clickTab:true});
      [20,60,120,240,420].forEach(delay=>setTimeout(()=>stabilize({clickTab:false}),delay));
    }
  });

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.collection-tab[data-library-tab]');
    if(!tab)return;
    currentTab=tab.dataset.libraryTab||currentTab;
    [0,30,80,180,360].forEach(delay=>setTimeout(()=>stabilize({clickTab:false}),delay));
  },true);

  new MutationObserver(records=>{
    if(!records.some(record=>{
      const target=record.target;
      return target?.id==='collectionSheet'||target?.id==='collectionBackdrop'||target?.id==='collectionLayer'||
        target?.classList?.contains('collection-body')||target?.classList?.contains('collection-tools')||
        [...record.addedNodes,...record.removedNodes].some(node=>node?.nodeType===1&&(node.id==='collectionSheet'||node.id==='collectionLayer'||node.querySelector?.('#collectionSheet')));
    }))return;
    queueStabilize(false);
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style']});

  [90,180,360,720,1400].forEach(delay=>setTimeout(()=>repair(currentTab),delay));
})();
