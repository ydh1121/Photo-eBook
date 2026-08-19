(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const industryInput=document.querySelector('#editorIndustryId');
  const slugInput=document.querySelector('#editorSlug');
  const idLabel=document.querySelector('#editorPageIdLabel');
  const newButton=document.querySelector('#editorNewPage');
  const duplicateButton=document.querySelector('#editorDuplicatePage');
  if(!industryInput||!slugInput||!idLabel)return;

  const slugStatus=document.createElement('span');
  slugStatus.className='editor-slug-status';
  slugStatus.setAttribute('role','status');
  slugInput.insertAdjacentElement('afterend',slugStatus);

  function readDraft(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));}
  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
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

  function setSlugStatus(text,kind='idle'){
    slugStatus.textContent=text;
    slugStatus.dataset.status=kind;
  }

  async function checkSlug(){
    const draft=readDraft();
    const slug=normalizeSlug(draft.slug||slugInput.value);
    if(!slug){setSlugStatus('URL slug를 입력하세요.','warning');return null;}
    const token=getToken();
    if(!token){setSlugStatus('서버 연결 후 중복 여부를 확인합니다.');return null;}
    setSlugStatus('중복 확인 중');
    try{
      const params=new URLSearchParams({slug,pageId:String(draft.pageId||'')});
      const response=await fetch(`/api/editor/slug-check?${params.toString()}`,{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok===false)throw new Error(data?.message||`확인 실패 (${response.status})`);
      setSlugStatus(data.available?'사용할 수 있는 URL입니다.':'이미 다른 페이지에서 사용 중입니다.',data.available?'ok':'error');
      return data;
    }catch(error){setSlugStatus(error?.message||'중복 여부를 확인하지 못했습니다.','error');return null;}
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
    draft.publishedSnapshot=null;
    draft.blocks=draft.blocks.map(block=>({...block,revision:{version:1,updatedAt:new Date().toISOString(),updatedBy:'editor-lab-copy'}}));
    writeDraft(draft);
    window.location.reload();
  });

  function ensureStyle(href){
    if([...document.styleSheets].some(sheet=>String(sheet.href||'').includes(href)))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  function loadScript(src){return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(script=>String(script.src||'').includes(src));if(existing){if(window.__PLATFORM_UI_CAPABILITY_MANIFEST||src.includes('page-ui.js'))return resolve();}const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.appendChild(script);});}
  async function installPageUi(){
    ensureStyle('/assets/styles/editor-lab/page-ui.css?v=1');
    try{
      if(!window.__PLATFORM_UI_CAPABILITY_MANIFEST)await loadScript('/data/ui-capabilities/v1/manifest.js?v=1');
      await loadScript('/assets/js/editor-lab/page-ui.js?v=1');
    }catch(error){console.error('page-ui extension load failed',error);}
  }

  sync();
  checkSlug();
  installPageUi();
})();