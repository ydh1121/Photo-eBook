(function(){
  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const statusNode=document.querySelector('#editorServerStatus');
  const connectButton=document.querySelector('#editorServerConnect');
  const pagesSelect=document.querySelector('#editorServerPages');
  const loadButton=document.querySelector('#editorServerLoad');
  const saveButton=document.querySelector('#editorServerSave');
  const dialog=document.querySelector('#editorConnectDialog');
  const tokenInput=document.querySelector('#editorAdminToken');
  const messageNode=document.querySelector('#editorConnectMessage');
  const submitButton=document.querySelector('#editorConnectSubmit');
  const cancelButton=document.querySelector('#editorConnectCancel');
  if(!statusNode||!connectButton||!pagesSelect||!loadButton||!saveButton)return;

  let connected=false;
  let busy=false;

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function setToken(value){try{if(value)sessionStorage.setItem(TOKEN_KEY,value);else sessionStorage.removeItem(TOKEN_KEY);}catch{}}
  function setStatus(text,status='idle'){statusNode.textContent=text;statusNode.dataset.status=status;}
  function setConnected(value){connected=Boolean(value);pagesSelect.disabled=!connected;loadButton.disabled=!connected||!pagesSelect.value;saveButton.disabled=!connected;connectButton.textContent=connected?'연결 다시 설정':'서버 연결';}
  function setBusy(value){busy=Boolean(value);connectButton.disabled=busy;saveButton.disabled=busy||!connected;loadButton.disabled=busy||!connected||!pagesSelect.value;pagesSelect.disabled=busy||!connected;}

  async function requestApi(path,{method='GET',body,token=getToken()}={}){
    if(!token)throw new Error('관리자 토큰이 없습니다.');
    const response=await fetch(`/api/editor/${path}`,{method,credentials:'same-origin',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`서버 요청 실패 (${response.status})`);
    return data;
  }

  function readDraft(){
    try{const parsed=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(!parsed||!Array.isArray(parsed.blocks))throw new Error('브라우저 초안을 찾지 못했습니다.');return parsed;}
    catch(error){throw new Error(error?.message||'브라우저 초안을 읽지 못했습니다.');}
  }
  function writeDraft(value){localStorage.setItem(DRAFT_KEY,JSON.stringify(value));}

  function toServerPayload(draft){
    return {page:{pageId:draft.pageId,slug:draft.slug||'',industryId:draft.industryId||'general',title:draft.pageTitle||'새 분야 가이드',theme:draft.theme||'light',seo:draft.seo||{},brief:draft.brief||{},aiStatus:draft.aiStatus||'not_requested',aiReview:draft.aiReview||{}},blocks:draft.blocks||[]};
  }

  function fromServerPage(page,current={}){
    return {...current,schema:'platform-editor-lab/v1',pageId:page.pageId,slug:page.slug||'',industryId:page.industryId||'general',pageTitle:page.title||'새 분야 가이드',theme:page.theme==='system'?'light':(page.theme||'light'),seo:page.seo||{},brief:page.brief||{},aiStatus:page.aiStatus||'not_requested',aiReview:page.aiReview||{},preview:current.preview||'desktop',mode:'edit',blocks:Array.isArray(page.blocks)?page.blocks:[],serverUpdatedAt:page.updatedAt||null,updatedAt:new Date().toISOString()};
  }

  async function refreshPages(){
    const data=await requestApi('pages');
    const pages=Array.isArray(data.pages)?data.pages:[];
    const selected=pagesSelect.value;
    pagesSelect.innerHTML='<option value="">서버 초안</option>'+pages.map(page=>`<option value="${escapeHtml(page.pageId)}">${escapeHtml(page.title||page.slug||page.pageId)}</option>`).join('');
    if(pages.some(page=>page.pageId===selected))pagesSelect.value=selected;
    loadButton.disabled=busy||!connected||!pagesSelect.value;
    return pages;
  }

  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  async function verifyToken(token,{persist=true}={}){
    setBusy(true);setStatus('서버 확인 중');
    try{const health=await requestApi('health',{token});if(!health.ok)throw new Error('서버 설정을 확인해 주세요.');if(persist)setToken(token);setConnected(true);await refreshPages();setStatus('서버 초안 연결됨','connected');return true;}
    catch(error){if(persist)setToken('');setConnected(false);setStatus('서버 미연결','error');throw error;}
    finally{setBusy(false);}
  }

  async function saveServerDraft(){
    setBusy(true);setStatus('서버 저장 중');
    try{
      const draft=readDraft();
      const data=await requestApi('page',{method:'POST',body:toServerPayload(draft)});
      draft.pageId=data.pageId||draft.pageId;draft.slug=data.slug||draft.slug||'';draft.aiStatus=data.aiStatus||draft.aiStatus||'not_requested';draft.serverUpdatedAt=data.updatedAt||new Date().toISOString();writeDraft(draft);
      await refreshPages();pagesSelect.value=draft.pageId;loadButton.disabled=false;setStatus(`서버 저장됨 · ${data.blockCount}개 블록`,'connected');
    }catch(error){setStatus(error.message||'서버 저장 실패','error');}
    finally{setBusy(false);}
  }

  async function loadServerDraft(){
    const pageId=pagesSelect.value;if(!pageId)return;setBusy(true);setStatus('서버 초안 불러오는 중');
    try{const data=await requestApi(`page?id=${encodeURIComponent(pageId)}`);if(!data.page)throw new Error('페이지 데이터를 찾지 못했습니다.');let current={};try{current=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{}writeDraft(fromServerPage(data.page,current));setStatus('서버 초안 불러옴','connected');window.location.reload();}
    catch(error){setStatus(error.message||'불러오기 실패','error');setBusy(false);}
  }

  function openDialog(){if(!dialog)return;if(messageNode){messageNode.textContent='';messageNode.className='editor-connect-message';}if(tokenInput)tokenInput.value=getToken();dialog.showModal();requestAnimationFrame(()=>tokenInput?.focus());}
  async function submitConnection(){
    const token=String(tokenInput?.value||'').trim();
    if(!token){if(messageNode){messageNode.textContent='관리자 토큰을 입력하세요.';messageNode.className='editor-connect-message is-error';}return;}
    if(submitButton)submitButton.disabled=true;
    try{await verifyToken(token,{persist:true});if(messageNode){messageNode.textContent='연결됐습니다.';messageNode.className='editor-connect-message is-ok';}setTimeout(()=>dialog?.close(),250);}
    catch(error){if(messageNode){messageNode.textContent=error.message||'연결하지 못했습니다.';messageNode.className='editor-connect-message is-error';}}
    finally{if(submitButton)submitButton.disabled=false;}
  }

  connectButton.addEventListener('click',openDialog);
  cancelButton?.addEventListener('click',()=>dialog?.close());
  submitButton?.addEventListener('click',submitConnection);
  tokenInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submitConnection();}});
  pagesSelect.addEventListener('change',()=>{loadButton.disabled=busy||!connected||!pagesSelect.value;});
  saveButton.addEventListener('click',saveServerDraft);
  loadButton.addEventListener('click',loadServerDraft);

  setConnected(false);
  const token=getToken();
  if(token)verifyToken(token,{persist:false}).catch(()=>setToken(''));
  else setStatus('브라우저 초안');
})();
