(function(){
  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const checkButton=document.querySelector('#editorPublishCheck');
  const publishButton=document.querySelector('#editorPublishNow');
  const status=document.querySelector('#editorPublishStatus');
  const results=document.querySelector('#editorPublishResults');
  if(!checkButton||!publishButton||!status||!results)return;

  let busy=false;
  let lastCheck=null;

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
  function setStatus(text,kind='idle'){status.textContent=text;status.dataset.status=kind;}
  function setBusy(value){busy=Boolean(value);checkButton.disabled=busy;publishButton.disabled=busy||!lastCheck?.canPublish;}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  async function requestApi(path,{body}={}){
    const token=getToken();
    if(!token)throw new Error('먼저 관리자 서버에 연결하세요.');
    const response=await fetch(`/api/editor/${path}`,{
      method:'POST',credentials:'same-origin',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify(body||{})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok&&path!=='publish')throw new Error(data?.message||`요청 실패 (${response.status})`);
    return {response,data};
  }

  async function checkSlugAvailability(draft){
    const token=getToken();
    const slug=String(draft.slug||'').trim();
    if(!slug)throw new Error('URL slug를 입력하세요.');
    const params=new URLSearchParams({slug,pageId:String(draft.pageId||'')});
    const response=await fetch(`/api/editor/slug-check?${params.toString()}`,{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`URL 중복 확인 실패 (${response.status})`);
    if(!data.available)throw new Error('같은 URL slug를 사용하는 다른 페이지가 있습니다.');
    return data;
  }

  function toServerPayload(draft){
    return {page:{pageId:draft.pageId,slug:draft.slug||'',industryId:draft.industryId||'general',title:draft.pageTitle||'새 분야 가이드',theme:draft.theme||'light',seo:draft.seo||{},brief:draft.brief||{},aiStatus:draft.aiStatus||'not_requested',aiReview:draft.aiReview||{}},blocks:Array.isArray(draft.blocks)?draft.blocks:[]};
  }

  async function saveBeforePublish(){
    const draft=readDraft();
    if(!draft.pageId||!Array.isArray(draft.blocks))throw new Error('현재 초안을 확인하세요.');
    await checkSlugAvailability(draft);
    const {response,data}=await requestApi('save-page',{body:toServerPayload(draft)});
    if(!response.ok||data?.ok===false)throw new Error(data?.message||'서버 초안을 저장하지 못했습니다.');
    draft.pageId=data.pageId||draft.pageId;
    draft.slug=data.slug??draft.slug;
    draft.serverUpdatedAt=data.updatedAt||new Date().toISOString();
    writeDraft(draft);
    return draft;
  }

  function renderResult(data){
    const errors=Array.isArray(data?.errors)?data.errors:[];
    const warnings=Array.isArray(data?.warnings)?data.warnings:[];
    const rows=[];
    for(const message of errors)rows.push(`<li data-kind="error"><strong>차단</strong><span>${escapeHtml(message)}</span></li>`);
    for(const message of warnings)rows.push(`<li data-kind="warning"><strong>확인</strong><span>${escapeHtml(message)}</span></li>`);
    results.innerHTML=rows.length?`<ul>${rows.join('')}</ul>`:'<p>발행을 막는 항목이 없습니다.</p>';
    results.hidden=false;
  }

  async function runCheck(){
    lastCheck=null;
    setBusy(true);setStatus('서버 초안 저장 및 검사 중');results.hidden=true;
    try{
      const draft=await saveBeforePublish();
      const {data}=await requestApi('publish-check',{body:{pageId:draft.pageId}});
      lastCheck=data;
      renderResult(data);
      setStatus(data.canPublish?'발행 가능':'수정할 항목이 있습니다.',data.canPublish?'ok':'warning');
      return data;
    }catch(error){
      setStatus(error?.message||'발행 검사를 완료하지 못했습니다.','error');
      lastCheck=null;
      return null;
    }finally{
      setBusy(false);
    }
  }

  async function publish(){
    const check=await runCheck();
    if(!check?.canPublish)return;
    if(!window.confirm('현재 서버 초안을 새 공개 snapshot으로 발행할까요?'))return;
    setBusy(true);setStatus('발행 snapshot 생성 중');
    try{
      const draft=readDraft();
      const {response,data}=await requestApi('publish',{body:{pageId:draft.pageId}});
      renderResult(data);
      if(!response.ok||data?.ok===false)throw new Error(data?.message||'발행하지 못했습니다.');
      draft.publishedSnapshot={snapshotId:data.snapshotId,version:data.version,publishedAt:data.publishedAt};
      draft.serverUpdatedAt=data.publishedAt;
      writeDraft(draft);
      setStatus(`발행 완료 · version ${data.version}`,'ok');
      lastCheck=null;
    }catch(error){setStatus(error?.message||'발행하지 못했습니다.','error');lastCheck=null;}
    finally{setBusy(false);}
  }

  function loadStyleOnce(href,key){
    if(document.querySelector(`link[data-editor-extension="${key}"]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.dataset.editorExtension=key;document.head.appendChild(link);
  }
  function loadScriptOnce(src,key){
    if(document.querySelector(`script[data-editor-extension="${key}"]`))return;
    const script=document.createElement('script');
    script.src=src;script.dataset.editorExtension=key;document.body.appendChild(script);
  }
  function loadEditorExtensions(){
    loadStyleOnce('/assets/styles/editor-lab/snapshot-history.css?v=2','snapshot-history-style');
    loadScriptOnce('/assets/js/editor-lab/snapshot-history.js?v=2','snapshot-history-script');
    loadStyleOnce('/assets/styles/editor-lab/library-status-filter.css?v=1','library-status-style');
    loadScriptOnce('/assets/js/editor-lab/library-status-filter.js?v=1','library-status-script');
  }

  checkButton.addEventListener('click',runCheck);
  publishButton.addEventListener('click',publish);
  publishButton.disabled=true;
  setStatus(getToken()?'서버 저장 후 발행 검사를 실행하세요.':'서버 연결 후 사용할 수 있습니다.');
  loadEditorExtensions();
})();
