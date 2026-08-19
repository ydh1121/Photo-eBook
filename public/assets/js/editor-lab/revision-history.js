(function(){
  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const registry=window.PlatformBlockRegistry;
  const inspector=document.querySelector('#editorInspector');
  const dialog=document.querySelector('#editorRevisionDialog');
  const list=document.querySelector('#editorRevisionList');
  const status=document.querySelector('#editorRevisionStatus');
  const closeButton=document.querySelector('#editorRevisionClose');
  if(!registry||!inspector||!dialog||!list||!status)return;

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function selectedBlockId(){return document.querySelector('.editor-block.is-selected[data-editor-block]')?.dataset.editorBlock||'';}

  async function fetchRevisions(pageId,blockId){
    const token=getToken();
    if(!token)throw new Error('먼저 관리자 서버에 연결하세요.');
    const params=new URLSearchParams({pageId,blockId,limit:'50'});
    const response=await fetch(`/api/editor/revisions?${params.toString()}`,{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`버전 기록 요청 실패 (${response.status})`);
    return Array.isArray(data.revisions)?data.revisions:[];
  }

  function render(revisions,currentType){
    if(!revisions.length){list.innerHTML='<p class="editor-revision-empty">저장된 버전 기록이 없습니다.</p>';return;}
    list.innerHTML=revisions.map(item=>`<article class="editor-revision-row"><div><span>v${escapeHtml(item.version)}</span><strong>${escapeHtml(item.reason||'draft save')}</strong><small>${escapeHtml(item.createdAt||'')} · ${escapeHtml(item.actor||'')}</small></div><button type="button" data-restore-revision="${escapeHtml(item.revisionId)}" ${String(item.snapshot?.type||'')!==String(currentType||'')?'disabled':''}>이 버전 불러오기</button></article>`).join('');
    list.querySelectorAll('[data-restore-revision]').forEach(button=>button.addEventListener('click',()=>{
      const revision=revisions.find(item=>item.revisionId===button.dataset.restoreRevision);
      if(revision)restoreRevision(revision,currentType);
    }));
  }

  function restoreRevision(revision,currentType){
    const draft=readDraft();
    const blockId=selectedBlockId();
    const index=Array.isArray(draft.blocks)?draft.blocks.findIndex(block=>String(block.id)===String(blockId)):-1;
    if(index<0)throw new Error('현재 블록을 찾지 못했습니다.');
    const snapshot=revision?.snapshot;
    if(!snapshot||String(snapshot.id)!==String(blockId)||String(snapshot.type)!==String(currentType))throw new Error('현재 블록과 맞지 않는 버전입니다.');
    if(!window.confirm(`v${revision.version} 내용을 브라우저 초안에 불러올까요? 서버 데이터는 다음 저장 전까지 바뀌지 않습니다.`))return;
    const current=draft.blocks[index];
    const restored=registry.normalize({
      ...current,
      ...snapshot,
      id:current.id,
      type:current.type,
      status:current.status||'candidate',
      editorialProfile:current.editorialProfile||'',
      referenceProfiles:Array.isArray(current.referenceProfiles)?current.referenceProfiles:[],
      layout:current.layout&&typeof current.layout==='object'?current.layout:{},
      revision:{version:Number(revision.version||1),updatedAt:new Date().toISOString(),updatedBy:'revision-restore-preview'}
    });
    draft.blocks[index]=restored;
    writeDraft(draft);
    dialog.close();
    window.location.reload();
  }

  async function openHistory(){
    const draft=readDraft();
    const blockId=selectedBlockId();
    const block=Array.isArray(draft.blocks)?draft.blocks.find(item=>String(item.id)===String(blockId)):null;
    if(!draft.pageId||!block){status.textContent='현재 블록 정보를 찾지 못했습니다.';return;}
    list.innerHTML='';status.textContent='버전 기록 불러오는 중';dialog.showModal();
    try{
      const revisions=await fetchRevisions(draft.pageId,blockId);
      status.textContent=`${revisions.length}개 기록`;
      render(revisions,block.type);
    }catch(error){status.textContent=error?.message||'버전 기록을 불러오지 못했습니다.';list.innerHTML='';}
  }

  function enhanceInspector(){
    const actions=inspector.querySelector('.editor-inspector-actions');
    if(!actions||actions.querySelector('[data-revision-history]'))return;
    const button=document.createElement('button');
    button.type='button';button.dataset.revisionHistory='true';button.className='editor-revision-button';button.textContent='버전 기록';
    button.addEventListener('click',openHistory);
    actions.prepend(button);
  }

  const observer=new MutationObserver(enhanceInspector);
  observer.observe(inspector,{childList:true,subtree:true});
  closeButton?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  enhanceInspector();
})();
