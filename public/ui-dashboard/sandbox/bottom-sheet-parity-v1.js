(function(){
  const preview=new URLSearchParams(location.search).get('preview')||'';
  if(preview!=='collection-bottom-sheet'||window.__platformBottomSheetParityV1)return;
  window.__platformBottomSheetParityV1=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  function installStyle(){
    if($('#platform-bottom-sheet-parity-v1-style'))return;
    const style=document.createElement('style');
    style.id='platform-bottom-sheet-parity-v1-style';
    style.textContent=`
      html[data-sandbox-preview="collection-bottom-sheet"],html[data-sandbox-preview="collection-bottom-sheet"] body{overflow:hidden!important;background:#f5f6f8!important}
      html[data-theme="dark"][data-sandbox-preview="collection-bottom-sheet"],html[data-theme="dark"][data-sandbox-preview="collection-bottom-sheet"] body{background:#12151a!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #sandboxPreviewRoot{position:absolute!important;inset:0!important;min-height:0!important;height:0!important;padding:0!important;background:transparent!important;pointer-events:none!important;overflow:visible!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionLayer{display:block!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionFab{display:none!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionBackdrop{position:fixed!important;inset:0!important;display:block!important}
      html[data-sandbox-preview="collection-bottom-sheet"] #collectionSheet{position:fixed!important;display:grid!important}
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

  function forceVisible(tab){
    const root=$('#sandboxPreviewRoot[data-preview-kind="collection-bottom-sheet"]')||$('#sandboxPreviewRoot');
    const layer=$('#collectionLayer');
    if(!root||!layer)return false;
    if(layer.parentElement!==document.body)document.body.insertBefore(layer,root);
    keepOnly(root,layer);
    unlockDocument();
    $('#collectionFab',layer)?.style.setProperty('display','none','important');
    const button=layer.querySelector(`.collection-tab[data-library-tab="${tab}"]`);
    button?.click();
    const sheet=$('#collectionSheet',layer),backdrop=$('#collectionBackdrop',layer);
    if(!sheet)return false;
    sheet.hidden=false;
    sheet.classList.add('is-open');
    sheet.style.setProperty('--drag-y','0px');
    if(backdrop)backdrop.hidden=false;
    root.dataset.bottomSheetParityReady='true';
    return true;
  }

  function repair(tab='all'){
    installStyle();
    if(forceVisible(tab))return;
    const fab=$('#collectionFab');
    fab?.click();
    setTimeout(()=>forceVisible(tab),120);
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-kit-state'&&data.capabilityId==='collection-bottom-sheet'){
      const tab=['all','video','article','question','settings'].includes(data.state)?data.state:'all';
      setTimeout(()=>repair(tab),30);
    }
  });

  [120,280,620,1200].forEach(delay=>setTimeout(()=>repair('all'),delay));
})();
