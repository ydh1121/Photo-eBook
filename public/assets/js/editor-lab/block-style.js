(function(){
  const inspector=document.querySelector('#editorInspector');
  const canvas=document.querySelector('#editorCanvas');
  const styles=window.PlatformBlockStyles;
  if(!inspector||!canvas||!styles)return;

  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  let serverSyncTried=false;

  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function readPresets(){return styles.readLocalPresets();}
  function writePresets(items){try{localStorage.setItem(styles.storageKey,JSON.stringify(items));}catch{}}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function encodePath(path){return encodeURIComponent(JSON.stringify(path));}
  function originalField(path){const encoded=encodePath(path);return [...inspector.querySelectorAll('[data-edit-path]')].find(field=>field.dataset.editPath===encoded)||null;}
  function selectedId(){return canvas.querySelector('.editor-block.is-selected')?.dataset.editorBlock||null;}
  function selectedBlock(){const id=selectedId();return readDraft().blocks?.find(block=>block.id===id)||null;}
  function matchingPresets(block){return readPresets().filter(item=>item?.blockType===block.type&&item?.variant===block.variant);}

  function hideGenericFields(){
    const styleId=originalField(['stylePresetId']);
    styleId?.closest('.editor-field')?.classList.add('editor-block-style-hidden');
    const overrides=inspector.querySelectorAll('.editor-fieldset legend');
    for(const legend of overrides){if(String(legend.textContent||'').trim()==='styleOverrides')legend.closest('.editor-fieldset')?.classList.add('editor-block-style-hidden');}
  }

  function panelSignature(block){
    const presets=matchingPresets(block).map(item=>`${item.id}:${item.updatedAt||item.version||''}`).join('|');
    return `${block.id}|${block.type}|${block.variant}|${block.stylePresetId||''}|${presets}`;
  }

  function markup(block,signature){
    const presets=matchingPresets(block);
    const selected=String(block.stylePresetId||'');
    const selectedPreset=presets.find(item=>item.id===selected)||null;
    const stale=Boolean(selected&&!selectedPreset);
    return `<section class="editor-block-style" data-block-style-signature="${escapeHtml(signature)}"><div class="editor-block-style__head"><div><small>BLOCK STYLE</small><strong>블록 스타일</strong></div><span>${escapeHtml(block.type)} / ${escapeHtml(block.variant)}</span></div><label>스타일 preset<select data-block-style-select><option value="">기본 디자인 공식</option>${presets.map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===selected?'selected':''}>${escapeHtml(item.name)}</option>`).join('')}</select></label>${selectedPreset?`<div class="editor-block-style__meta"><strong>${escapeHtml(selectedPreset.name)}</strong><span>${escapeHtml(selectedPreset.source||'user')} · ${escapeHtml(selectedPreset.status||'draft')}</span></div>`:''}${stale?'<p class="editor-block-style__empty">현재 variant에서 사용할 수 있는 preset과 연결되지 않았습니다. 기본 디자인 공식으로 미리봅니다.</p>':(!presets.length?'<p class="editor-block-style__empty">현재 variant에 저장된 preset이 없습니다. Block Lab에서 디자인 설정을 저장할 수 있습니다.</p>':'')}<a class="editor-block-style__link" href="/block-lab/" target="_blank" rel="noopener">Block Lab에서 디자인 관리</a><span class="editor-block-style__status" data-block-style-status></span></section>`;
  }

  function enhanceInspector(){
    const meta=inspector.querySelector('.editor-inspector-meta');
    const block=selectedBlock();
    if(!meta||!block)return;
    hideGenericFields();
    const signature=panelSignature(block);
    const current=inspector.querySelector('.editor-block-style');
    if(current?.dataset.blockStyleSignature===signature)return;
    current?.remove();
    const host=document.createElement('div');host.innerHTML=markup(block,signature);const panel=host.firstElementChild;
    const friendly=inspector.querySelector('.editor-friendly-panel');
    if(friendly)friendly.insertAdjacentElement('afterend',panel);else meta.insertAdjacentElement('afterend',panel);
    panel.querySelector('[data-block-style-select]')?.addEventListener('change',event=>{
      const field=originalField(['stylePresetId']);
      if(!field)return;
      field.value=event.target.value;
      field.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }

  function applyCanvasStyles(){
    const draft=readDraft();
    for(const block of draft.blocks||[]){
      const host=canvas.querySelector(`[data-editor-block="${CSS.escape(block.id)}"] .editor-render`);
      if(host)styles.apply(host,block);
    }
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
      enhanceInspector();applyCanvasStyles();
    }catch(error){console.warn('Block style preset sync failed',error);}
  }

  let inspectorQueued=false;
  const observer=new MutationObserver(()=>{
    if(inspectorQueued)return;
    inspectorQueued=true;
    requestAnimationFrame(()=>{inspectorQueued=false;enhanceInspector();applyCanvasStyles();syncServerPresets();});
  });
  observer.observe(inspector,{childList:true,subtree:true});
  let canvasQueued=false;
  const canvasObserver=new MutationObserver(()=>{
    if(canvasQueued)return;
    canvasQueued=true;
    requestAnimationFrame(()=>{canvasQueued=false;applyCanvasStyles();});
  });
  canvasObserver.observe(canvas,{childList:true,subtree:true});
  enhanceInspector();applyCanvasStyles();syncServerPresets();
})();