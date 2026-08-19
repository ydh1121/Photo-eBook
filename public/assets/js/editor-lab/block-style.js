(function(){
  const inspector=document.querySelector('#editorInspector');
  const canvas=document.querySelector('#editorCanvas');
  const styles=window.PlatformBlockStyles;
  if(!inspector||!canvas||!styles)return;

  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const RESTORE_KEY='platformEditorStyleRestoreBlock';
  let serverSyncTried=false;
  let inspectorQueued=false;
  let canvasQueued=false;

  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){try{draft.updatedAt=new Date().toISOString();localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));return true;}catch{return false;}}
  function readPresets(){return styles.readLocalPresets();}
  function writePresets(items){try{localStorage.setItem(styles.storageKey,JSON.stringify(items));}catch{}}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function selectedId(){return canvas.querySelector('.editor-block.is-selected')?.dataset.editorBlock||null;}
  function selectedBlock(){const id=selectedId();return readDraft().blocks?.find(block=>block.id===id)||null;}
  function matchingPresets(block){return readPresets().filter(item=>item?.blockType===block.type&&item?.variant===block.variant);}

  function panelSignature(block,presets){
    const state=presets.map(item=>`${item.id}:${item.version||1}:${item.updatedAt||''}`).join('|');
    return `${block.id}|${block.type}|${block.variant}|${block.stylePresetId||''}|${state}`;
  }

  function markup(block,presets,signature){
    const selected=String(block.stylePresetId||'');
    const selectedPreset=presets.find(item=>item.id===selected)||null;
    const stale=Boolean(selected&&!selectedPreset);
    return `<section class="editor-block-style" data-block-style-signature="${escapeHtml(signature)}"><div class="editor-block-style__head"><div><small>BLOCK STYLE</small><strong>블록 스타일</strong></div><span>${escapeHtml(block.type)} / ${escapeHtml(block.variant)}</span></div><label>스타일 preset<select data-block-style-select><option value="">기본 디자인 공식</option>${presets.map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===selected?'selected':''}>${escapeHtml(item.name)}</option>`).join('')}</select></label>${selectedPreset?`<div class="editor-block-style__meta"><strong>${escapeHtml(selectedPreset.name)}</strong><span>${escapeHtml(selectedPreset.source||'user')} · ${escapeHtml(selectedPreset.status||'draft')}</span></div>`:''}${stale?'<p class="editor-block-style__empty">현재 variant에서 사용할 수 있는 preset과 연결되지 않았습니다. 기본 디자인 공식으로 미리봅니다.</p>':(!presets.length?'<p class="editor-block-style__empty">현재 variant에 저장된 preset이 없습니다. Block Lab에서 디자인 설정을 저장할 수 있습니다.</p>':'')}<a class="editor-block-style__link" href="/block-lab/" target="_blank" rel="noopener">Block Lab에서 디자인 관리</a><span class="editor-block-style__status" data-block-style-status></span></section>`;
  }

  function persistStyle(blockId,presetId){
    const draft=readDraft();
    const block=Array.isArray(draft.blocks)?draft.blocks.find(item=>item.id===blockId):null;
    if(!block)return false;
    block.stylePresetId=String(presetId||'');
    block.styleOverrides={};
    if(!writeDraft(draft))return false;
    try{sessionStorage.setItem(RESTORE_KEY,blockId);}catch{}
    return true;
  }

  function bindPanel(panel,block,presets){
    const select=panel.querySelector('[data-block-style-select]');
    const status=panel.querySelector('[data-block-style-status]');
    select?.addEventListener('change',()=>{
      const presetId=String(select.value||'');
      if(presetId&&!presets.some(item=>item.id===presetId)){
        if(status){status.textContent='현재 variant에서 사용할 수 있는 preset을 선택하세요.';status.dataset.status='error';}
        return;
      }
      if(!persistStyle(block.id,presetId)){
        if(status){status.textContent='블록 스타일을 저장하지 못했습니다.';status.dataset.status='error';}
        return;
      }
      window.location.reload();
    });
  }

  function enhanceInspector(force=false){
    const meta=inspector.querySelector('.editor-inspector-meta');
    const block=selectedBlock();
    if(!meta||!block)return;
    const presets=matchingPresets(block);
    const signature=panelSignature(block,presets);
    const current=inspector.querySelector('.editor-block-style');
    if(!force&&current?.dataset.blockStyleSignature===signature)return;

    const host=document.createElement('div');
    host.innerHTML=markup(block,presets,signature);
    const panel=host.firstElementChild;
    if(current)current.replaceWith(panel);
    else{
      const friendly=inspector.querySelector('.editor-friendly-panel');
      if(friendly)friendly.insertAdjacentElement('afterend',panel);
      else meta.insertAdjacentElement('afterend',panel);
    }
    bindPanel(panel,block,presets);
  }

  function applyCanvasStyles(){
    const draft=readDraft();
    for(const block of draft.blocks||[]){
      const host=canvas.querySelector(`[data-editor-block="${CSS.escape(block.id)}"] .editor-render`);
      if(host)styles.apply(host,block);
    }
  }

  function restoreSelectedBlock(){
    let id='';
    try{id=sessionStorage.getItem(RESTORE_KEY)||'';}catch{}
    if(!id)return;
    const node=canvas.querySelector(`[data-editor-block="${CSS.escape(id)}"]`);
    if(!node)return;
    try{sessionStorage.removeItem(RESTORE_KEY);}catch{}
    if(!node.classList.contains('is-selected'))node.click();
  }

  async function syncServerPresets(){
    if(serverSyncTried)return;
    const token=(()=>{try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}})();
    if(!token)return;
    serverSyncTried=true;
    try{
      const response=await fetch('/api/editor/block-style-presets',{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok===false)throw new Error(data?.message||`preset 불러오기 실패 (${response.status})`);
      const byId=new Map(readPresets().map(item=>[item.id,item]));
      for(const item of data.presets||[])if(item?.id)byId.set(item.id,item);
      writePresets([...byId.values()]);
      enhanceInspector(true);
      applyCanvasStyles();
    }catch(error){console.warn('Block style preset sync failed',error);}
  }

  const observer=new MutationObserver(()=>{
    if(inspectorQueued)return;
    inspectorQueued=true;
    requestAnimationFrame(()=>{inspectorQueued=false;enhanceInspector();applyCanvasStyles();restoreSelectedBlock();syncServerPresets();});
  });
  observer.observe(inspector,{childList:true,subtree:true});

  const canvasObserver=new MutationObserver(()=>{
    if(canvasQueued)return;
    canvasQueued=true;
    requestAnimationFrame(()=>{canvasQueued=false;applyCanvasStyles();restoreSelectedBlock();});
  });
  canvasObserver.observe(canvas,{childList:true,subtree:true});

  enhanceInspector(true);
  applyCanvasStyles();
  restoreSelectedBlock();
  syncServerPresets();
})();
