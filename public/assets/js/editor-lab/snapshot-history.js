(function(){
  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const registry=window.PlatformBlockRegistry;
  const actions=document.querySelector('.editor-publish__actions');
  if(!registry||!actions)return;

  const historyButton=document.createElement('button');
  historyButton.type='button';
  historyButton.id='editorSnapshotHistory';
  historyButton.textContent='발행 기록';
  actions.insertAdjacentElement('afterend',historyButton);

  const dialog=document.createElement('dialog');
  dialog.className='editor-snapshot-dialog';
  dialog.innerHTML=`<div class="editor-snapshot-card"><div class="editor-snapshot-head"><div><small>PUBLISH HISTORY</small><h2>발행 기록</h2><p>공개된 버전을 확인하거나 브라우저 초안으로 복원할 수 있습니다.</p></div><button type="button" class="editor-snapshot-close">닫기</button></div><div class="editor-snapshot-status" role="status"></div><div class="editor-snapshot-list"></div></div>`;
  document.body.appendChild(dialog);

  const previewDialog=document.createElement('dialog');
  previewDialog.className='editor-snapshot-preview-dialog';
  previewDialog.innerHTML=`<div class="editor-snapshot-preview-card"><header class="editor-snapshot-preview-head"><div><small>PUBLISH PREVIEW</small><h2 class="editor-snapshot-preview-title">미리보기</h2><p class="editor-snapshot-preview-meta"></p></div><div class="editor-snapshot-preview-controls" aria-label="미리보기 화면 폭"><button type="button" data-snapshot-width="390">390</button><button type="button" data-snapshot-width="768">768</button><button type="button" data-snapshot-width="1180" aria-pressed="true">1180</button><button type="button" class="editor-snapshot-preview-close">닫기</button></div></header><div class="editor-snapshot-preview-stage"><div class="block-lab editor-snapshot-preview-surface" data-theme="light" data-width="1180"></div></div></div>`;
  document.body.appendChild(previewDialog);

  const status=dialog.querySelector('.editor-snapshot-status');
  const list=dialog.querySelector('.editor-snapshot-list');
  const closeButton=dialog.querySelector('.editor-snapshot-close');
  const previewTitle=previewDialog.querySelector('.editor-snapshot-preview-title');
  const previewMeta=previewDialog.querySelector('.editor-snapshot-preview-meta');
  const previewSurface=previewDialog.querySelector('.editor-snapshot-preview-surface');
  const previewClose=previewDialog.querySelector('.editor-snapshot-preview-close');
  const widthButtons=[...previewDialog.querySelectorAll('[data-snapshot-width]')];

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  async function api(params){
    const token=getToken();
    if(!token)throw new Error('먼저 관리자 서버에 연결하세요.');
    const query=new URLSearchParams(params);
    const response=await fetch(`/api/editor/snapshots?${query.toString()}`,{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`발행 기록 요청 실패 (${response.status})`);
    return data;
  }

  function renderList(items){
    if(!items.length){list.innerHTML='<p class="editor-snapshot-empty">아직 발행 기록이 없습니다.</p>';return;}
    list.innerHTML=items.map(item=>`<article class="editor-snapshot-row" data-state="${escapeHtml(item.state||'')}"><div class="editor-snapshot-version"><strong>v${escapeHtml(item.version)}</strong><span>${escapeHtml(item.state==='active'?'현재 공개':'이전 버전')}</span></div><div class="editor-snapshot-copy"><strong>${escapeHtml(item.title||item.slug||'페이지')}</strong><small>${escapeHtml(item.slug||'')} · ${escapeHtml(item.publishedAt||'')}</small></div><div class="editor-snapshot-row-actions"><button type="button" data-snapshot-preview="${escapeHtml(item.snapshotId)}">미리보기</button><button type="button" data-snapshot-restore="${escapeHtml(item.snapshotId)}">초안으로 복원</button></div></article>`).join('');
    list.querySelectorAll('[data-snapshot-preview]').forEach(button=>button.addEventListener('click',()=>previewSnapshot(button.dataset.snapshotPreview)));
    list.querySelectorAll('[data-snapshot-restore]').forEach(button=>button.addEventListener('click',()=>restoreSnapshot(button.dataset.snapshotRestore)));
  }

  async function openHistory(){
    const draft=readDraft();
    if(!draft.pageId)return;
    status.textContent='발행 기록 불러오는 중';
    list.innerHTML='';
    dialog.showModal();
    try{
      const data=await api({pageId:draft.pageId});
      const snapshots=Array.isArray(data.snapshots)?data.snapshots:[];
      status.textContent=`발행 기록 ${snapshots.length}개`;
      renderList(snapshots);
    }catch(error){status.textContent=error?.message||'발행 기록을 불러오지 못했습니다.';list.innerHTML='';}
  }

  function setPreviewWidth(width){
    const value=['390','768','1180'].includes(String(width))?String(width):'1180';
    previewSurface.dataset.width=value;
    previewSurface.style.width=`${value}px`;
    widthButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.snapshotWidth===value)));
  }

  function renderSnapshotPreview(snapshot){
    const blocks=Array.isArray(snapshot.blocks)?snapshot.blocks:[];
    previewTitle.textContent=`${snapshot.title||'페이지'} · v${snapshot.version||''}`;
    previewMeta.textContent=`${snapshot.state==='active'?'현재 공개':'이전 버전'} · ${snapshot.publishedAt||''}`;
    previewSurface.dataset.theme=snapshot.theme==='dark'?'dark':'light';
    previewSurface.innerHTML=blocks.length?blocks.map(block=>`<section class="editor-snapshot-preview-block" data-block-type="${escapeHtml(block.type||'')}">${registry.render(registry.normalize(block),{editor:false})}</section>`).join(''):'<p class="editor-snapshot-preview-empty">표시할 블록이 없습니다.</p>';
    setPreviewWidth('1180');
    if(typeof window.bindBlockLabEnhancements==='function')window.bindBlockLabEnhancements();
  }

  async function previewSnapshot(snapshotId){
    const draft=readDraft();
    status.textContent='미리보기 불러오는 중';
    try{
      const data=await api({pageId:draft.pageId,snapshotId});
      const snapshot=data.snapshot;
      if(!snapshot||!Array.isArray(snapshot.blocks))throw new Error('snapshot 내용을 찾지 못했습니다.');
      renderSnapshotPreview(snapshot);
      previewDialog.showModal();
      status.textContent='';
    }catch(error){status.textContent=error?.message||'미리보기를 불러오지 못했습니다.';}
  }

  async function restoreSnapshot(snapshotId){
    const draft=readDraft();
    status.textContent='snapshot 불러오는 중';
    try{
      const data=await api({pageId:draft.pageId,snapshotId});
      const snapshot=data.snapshot;
      if(!snapshot||!Array.isArray(snapshot.blocks))throw new Error('snapshot 내용을 찾지 못했습니다.');
      if(!window.confirm(`v${snapshot.version} 내용을 브라우저 초안으로 복원할까요? 서버 초안은 저장하기 전까지 바뀌지 않습니다.`))return;

      const currentById=new Map((Array.isArray(draft.blocks)?draft.blocks:[]).map(block=>[String(block.id),block]));
      const blocks=snapshot.blocks.map(block=>{
        const current=currentById.get(String(block.id));
        return registry.normalize({
          ...(current||{}),
          ...block,
          id:block.id,
          type:block.type,
          enabled:true,
          aiPolicy:current?.aiPolicy||{mode:'full',factState:'needs_verification',fields:{}},
          editorialProfile:current?.editorialProfile||registry.get(block.type)?.editorialProfile||'',
          referenceProfiles:current?.referenceProfiles||registry.get(block.type)?.referenceProfiles||[],
          revision:{version:Number(block?.revision?.version||1),updatedAt:new Date().toISOString(),updatedBy:'snapshot-restore-preview'}
        });
      });

      draft.slug=snapshot.slug||draft.slug||'';
      draft.industryId=snapshot.industryId||draft.industryId||'general';
      draft.pageTitle=snapshot.title||draft.pageTitle||'새 분야 가이드';
      draft.theme=snapshot.theme==='dark'?'dark':'light';
      draft.seo=snapshot.seo||draft.seo||{};
      draft.blocks=blocks;
      draft.aiStatus='needs_review';
      draft.aiReview={
        summary:`발행 snapshot v${snapshot.version}을 브라우저 초안으로 복원했습니다. 다시 발행하기 전에 현재 기준으로 내용을 검토하세요.`,
        issues:[],researchNotes:[],blockNotes:[],importedAt:new Date().toISOString(),warnings:[]
      };
      draft.publishedSnapshot={snapshotId:snapshot.snapshotId,version:snapshot.version,publishedAt:snapshot.publishedAt};
      draft.serverUpdatedAt=null;
      writeDraft(draft);
      dialog.close();
      window.location.reload();
    }catch(error){status.textContent=error?.message||'snapshot을 불러오지 못했습니다.';}
  }

  historyButton.addEventListener('click',openHistory);
  closeButton.addEventListener('click',()=>dialog.close());
  widthButtons.forEach(button=>button.addEventListener('click',()=>setPreviewWidth(button.dataset.snapshotWidth)));
  previewClose.addEventListener('click',()=>previewDialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  previewDialog.addEventListener('click',event=>{if(event.target===previewDialog)previewDialog.close();});
})();
