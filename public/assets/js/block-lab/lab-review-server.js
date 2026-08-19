(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const controls=document.querySelector('.lab-controls');
  if(!manifest||!controls)return;

  const STORAGE_KEY='platformBlockReviewV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const VALID=new Set(manifest.decisions||['undecided','approved','redesign','merge','deprecated']);

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function setToken(value){try{if(value)sessionStorage.setItem(TOKEN_KEY,value);else sessionStorage.removeItem(TOKEN_KEY);}catch{}}
  function readLocal(){try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return parsed&&typeof parsed==='object'?parsed:{};}catch{return {};}}
  function writeLocal(value){localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}

  const wrap=document.createElement('div');
  wrap.className='lab-review-server';
  wrap.innerHTML=`
    <button type="button" id="labReviewServerConnect">서버 연결</button>
    <button type="button" id="labReviewServerLoad" disabled>검토 불러오기</button>
    <button type="button" id="labReviewServerSave" disabled>검토 저장</button>
    <span id="labReviewServerStatus" role="status">브라우저 저장</span>`;
  controls.prepend(wrap);

  const dialog=document.createElement('dialog');
  dialog.className='lab-review-server-dialog';
  dialog.innerHTML=`<div class="lab-review-server-card"><div><small>BLOCK REVIEW</small><h2>검토 서버 연결</h2><p>블록 전체와 variant별 검토를 함께 불러오고 저장합니다. 관리자 토큰은 이 탭의 세션에만 보관합니다.</p></div><label>관리자 토큰<input id="labReviewAdminToken" type="password" autocomplete="off" spellcheck="false"></label><span id="labReviewConnectMessage" role="status"></span><div class="lab-review-server-actions"><button type="button" data-review-server-cancel>취소</button><button type="button" data-review-server-submit>연결</button></div></div>`;
  document.body.appendChild(dialog);

  const connect=wrap.querySelector('#labReviewServerConnect');
  const load=wrap.querySelector('#labReviewServerLoad');
  const save=wrap.querySelector('#labReviewServerSave');
  const status=wrap.querySelector('#labReviewServerStatus');
  const tokenInput=dialog.querySelector('#labReviewAdminToken');
  const message=dialog.querySelector('#labReviewConnectMessage');

  function setStatus(text,kind='idle'){status.textContent=text;status.dataset.status=kind;}
  function syncButtons(){const connected=Boolean(getToken());load.disabled=!connected;save.disabled=!connected;connect.textContent=connected?'연결됨':'서버 연결';}

  async function request(path,{method='GET',body}={}){
    const token=getToken();
    if(!token)throw new Error('먼저 서버에 연결하세요.');
    const response=await fetch(path,{method,credentials:'same-origin',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`요청 실패 (${response.status})`);
    return data;
  }

  async function verifyToken(token){
    const response=await fetch('/api/editor/health',{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.ok)throw new Error(data?.message||'관리자 연결을 확인하지 못했습니다.');
    return data;
  }

  async function submitConnection(){
    const token=String(tokenInput.value||'').trim();
    if(!token){message.textContent='관리자 토큰을 입력하세요.';return;}
    message.textContent='연결 확인 중';
    try{
      await verifyToken(token);
      setToken(token);
      tokenInput.value='';
      dialog.close();
      syncButtons();
      setStatus('서버 연결됨','ok');
    }catch(error){message.textContent=error?.message||'연결하지 못했습니다.';}
  }

  function localPayload(){
    const state=readLocal();
    return manifest.blocks.map(item=>{
      const review=state[item.type]&&typeof state[item.type]==='object'?state[item.type]:{};
      return {
        type:item.type,
        decision:VALID.has(review.decision)?review.decision:'undecided',
        note:String(review.note||''),
        updatedAt:review.updatedAt||null
      };
    });
  }

  async function loadReviews(){
    load.disabled=true;save.disabled=true;setStatus('검토 불러오는 중');
    try{
      const [blockData,variantData]=await Promise.all([
        request('/api/editor/review-list'),
        request('/api/editor/variant-reviews')
      ]);
      const current=readLocal();
      for(const item of Array.isArray(blockData.reviews)?blockData.reviews:[]){
        if(!manifest.blocks.some(block=>block.type===item.type))continue;
        current[item.type]={
          decision:VALID.has(item.decision)?item.decision:'undecided',
          note:String(item.note||''),
          updatedAt:item.updatedAt||null
        };
      }
      writeLocal(current);
      window.BlockLabVariantReview?.replaceFromServer?.(variantData.reviews||[]);
      const total=Number(blockData.count||0)+Number(variantData.count||0);
      setStatus(`검토 ${total}개 불러옴`,'ok');
      window.location.reload();
    }catch(error){setStatus(error?.message||'검토를 불러오지 못했습니다.','error');syncButtons();}
  }

  async function saveReviews(){
    load.disabled=true;save.disabled=true;setStatus('검토 저장 중');
    try{
      const reviews=localPayload();
      const variantReviews=window.BlockLabVariantReview?.exportPayload?.()||[];
      const [blockData,variantData]=await Promise.all([
        request('/api/editor/reviews',{method:'POST',body:{reviewer:'platform-owner',reviews}}),
        request('/api/editor/variant-reviews',{method:'POST',body:{reviewer:'platform-owner',reviews:variantReviews}})
      ]);
      const total=Number(blockData.count||reviews.length)+Number(variantData.count||variantReviews.length);
      setStatus(`검토 ${total}개 저장됨`,'ok');
    }catch(error){setStatus(error?.message||'검토를 저장하지 못했습니다.','error');}
    finally{syncButtons();}
  }

  connect.addEventListener('click',()=>{
    if(getToken()){
      if(window.confirm('이 탭의 관리자 연결을 해제할까요?')){setToken('');syncButtons();setStatus('브라우저 저장');}
      return;
    }
    message.textContent='';
    dialog.showModal();
    setTimeout(()=>tokenInput.focus(),0);
  });
  load.addEventListener('click',loadReviews);
  save.addEventListener('click',saveReviews);
  dialog.querySelector('[data-review-server-cancel]').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-review-server-submit]').addEventListener('click',submitConnection);
  tokenInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submitConnection();}});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});

  syncButtons();
  if(getToken())setStatus('서버 연결됨','ok');
})();