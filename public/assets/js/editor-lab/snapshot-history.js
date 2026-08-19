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
  dialog.innerHTML=`<div class="editor-snapshot-card"><div class="editor-snapshot-head"><div><small>PUBLISH HISTORY</small><h2>발행 기록</h2><p>과거 공개 snapshot을 브라우저 초안으로 불러온 뒤 비교하고 다시 발행할 수 있습니다.</p></div><button type="button" class="editor-snapshot-close">닫기</button></div><div class="editor-snapshot-status" role="status"></div><div class="editor-snapshot-list"></div></div>`;
  document.body.appendChild(dialog);

  const status=dialog.querySelector('.editor-snapshot-status');
  const list=dialog.querySelector('.editor-snapshot-list');
  const closeButton=dialog.querySelector('.editor-snapshot-close');

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
    if(!items.length){list.innerHTML='<p class="editor-snapshot-empty">아직 이 페이지의 발행 기록이 없습니다.</p>';return;}
    list.innerHTML=items.map(item=>`<article class="editor-snapshot-row" data-state="${escapeHtml(item.state||'')}"><div class="editor-snapshot-version"><strong>v${escapeHtml(item.version)}</strong><span>${escapeHtml(item.state==='active'?'현재 공개':'이전 버전')}</span></div><div class="editor-snapshot-copy"><strong>${escapeHtml(item.title||item.slug||'페이지')}</strong><small>${escapeHtml(item.slug||'')} · ${escapeHtml(item.publishedAt||'')}</small></div><button type="button" data-snapshot-restore="${escapeHtml(item.snapshotId)}">초안으로 불러오기</button></article>`).join('');
    list.querySelectorAll('[data-snapshot-restore]').forEach(button=>button.addEventListener('click',()=>restoreSnapshot(button.dataset.snapshotRestore)));
  }

  async function openHistory(){
    const draft=readDraft();
    if(!draft.pageId){return;}
    status.textContent='발행 기록 불러오는 중';
    list.innerHTML='';
    dialog.showModal();
    try{
      const data=await api({pageId:draft.pageId});
      const snapshots=Array.isArray(data.snapshots)?data.snapshots:[];
      status.textContent=`${snapshots.length}개 snapshot`;
      renderList(snapshots);
    }catch(error){status.textContent=error?.message||'발행 기록을 불러오지 못했습니다.';list.innerHTML='';}
  }

  async function restoreSnapshot(snapshotId){
    const draft=readDraft();
    status.textContent='snapshot 불러오는 중';
    try{
      const data=await api({pageId:draft.pageId,snapshotId});
      const snapshot=data.snapshot;
      if(!snapshot||!Array.isArray(snapshot.blocks))throw new Error('snapshot 내용을 찾지 못했습니다.');
      if(!window.confirm(`v${snapshot.version} 공개 내용을 브라우저 초안으로 불러올까요? 서버 초안은 다음 저장 전까지 바뀌지 않습니다.`))return;

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
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
})();
