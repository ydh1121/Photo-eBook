(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const industryInput=document.querySelector('#editorIndustryId');
  const slugInput=document.querySelector('#editorSlug');
  const idLabel=document.querySelector('#editorPageIdLabel');
  const newButton=document.querySelector('#editorNewPage');
  const duplicateButton=document.querySelector('#editorDuplicatePage');
  if(!industryInput||!slugInput||!idLabel)return;

  function readDraft(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));}
  function uid(type='page'){return `${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}
  function normalizeId(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣_.:-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'general';}
  function normalizeSlug(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160);}

  function sync(){
    const draft=readDraft();
    industryInput.value=draft.industryId||'general';
    slugInput.value=draft.slug||'';
    idLabel.textContent=draft.pageId||'';
    idLabel.title=draft.pageId||'';
  }

  function persistAndReload(patch){
    const draft=readDraft();
    Object.assign(draft,patch);
    writeDraft(draft);
    window.location.reload();
  }

  industryInput.addEventListener('change',()=>persistAndReload({industryId:normalizeId(industryInput.value)}));
  slugInput.addEventListener('change',()=>persistAndReload({slug:normalizeSlug(slugInput.value)}));

  newButton?.addEventListener('click',()=>{
    if(!window.confirm('현재 브라우저 초안을 비우고 새 페이지를 시작할까요? 서버에 저장한 초안은 삭제되지 않습니다.'))return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });

  duplicateButton?.addEventListener('click',()=>{
    const draft=readDraft();
    if(!Array.isArray(draft.blocks))return;
    draft.pageId=uid('page');
    draft.pageTitle=`${String(draft.pageTitle||'새 분야 가이드').trim()} 복사본`;
    draft.slug='';
    draft.aiStatus=draft.brief&&Object.keys(draft.brief).length?'brief_ready':'not_requested';
    draft.serverUpdatedAt=null;
    draft.blocks=draft.blocks.map(block=>({...block,revision:{version:1,updatedAt:new Date().toISOString(),updatedBy:'editor-lab-copy'}}));
    writeDraft(draft);
    window.location.reload();
  });

  sync();
})();
