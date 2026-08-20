(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const topActions=document.querySelector('.ui-dashboard__top-actions');
  if(!manifest||!topActions)return;

  const TOKEN_KEY='platformEditorAdminToken';
  const PRESET_KEY='platformUiCapabilityPresetsV1';
  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function setToken(value){try{if(value)sessionStorage.setItem(TOKEN_KEY,value);else sessionStorage.removeItem(TOKEN_KEY);}catch{}}
  function readLocal(){try{const value=JSON.parse(localStorage.getItem(PRESET_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeLocal(value){localStorage.setItem(PRESET_KEY,JSON.stringify(value));}

  const wrap=document.createElement('div');
  wrap.className='ui-dashboard-server';
  wrap.innerHTML='<button type="button" id="uiDashConnect">서버 연결</button><button type="button" id="uiDashLoad" disabled>설정 불러오기</button><button type="button" id="uiDashSave" disabled>설정 저장</button><span id="uiDashServerStatus">이 브라우저에 저장</span>';
  topActions.prepend(wrap);

  const dialog=document.createElement('dialog');
  dialog.className='ui-dashboard-server-dialog';
  dialog.innerHTML='<div class="ui-dashboard-server-card"><small>UI 설정</small><h2>관리자 서버 연결</h2><p>저장한 페이지 UI 설정을 Google Sheets와 동기화합니다. 토큰은 이 탭이 열려 있는 동안에만 보관합니다.</p><label>관리자 토큰<input id="uiDashToken" type="password" autocomplete="off" spellcheck="false"></label><span id="uiDashConnectMessage" role="status"></span><div class="ui-dashboard-server-actions"><button type="button" data-ui-dash-cancel>취소</button><button type="button" data-ui-dash-submit>연결</button></div></div>';
  document.body.appendChild(dialog);

  const connect=wrap.querySelector('#uiDashConnect');
  const load=wrap.querySelector('#uiDashLoad');
  const save=wrap.querySelector('#uiDashSave');
  const status=wrap.querySelector('#uiDashServerStatus');
  const tokenInput=dialog.querySelector('#uiDashToken');
  const message=dialog.querySelector('#uiDashConnectMessage');

  function setStatus(text,kind='idle'){status.textContent=text;status.dataset.status=kind;}
  function syncButtons(){const connected=Boolean(getToken());connect.textContent=connected?'서버 연결됨':'서버 연결';load.disabled=!connected;save.disabled=!connected;}

  async function request(path,{method='GET',body}={}){
    const token=getToken();if(!token)throw new Error('먼저 서버에 연결하세요.');
    const response=await fetch(path,{method,credentials:'same-origin',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));if(!response.ok||data?.ok===false)throw new Error(data?.message||`요청 실패 (${response.status})`);return data;
  }

  async function verify(token){const response=await fetch('/api/editor/health',{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok||!data?.ok)throw new Error(data?.message||'관리자 연결을 확인하지 못했습니다.');}

  async function submit(){const token=String(tokenInput.value||'').trim();if(!token){message.textContent='관리자 토큰을 입력하세요.';return;}message.textContent='연결 확인 중';try{await verify(token);setToken(token);tokenInput.value='';dialog.close();syncButtons();setStatus('서버 연결됨','ok');}catch(error){message.textContent=error?.message||'연결하지 못했습니다.';}}

  async function loadPresets(){setStatus('설정 불러오는 중');load.disabled=true;save.disabled=true;try{const data=await request('/api/editor/ui-presets');const current=readLocal();const byId=new Map(current.map(item=>[item.id,item]));for(const item of data.presets||[])byId.set(item.id,item);writeLocal([...byId.values()]);setStatus(`설정 ${data.count||0}개 불러옴`,'ok');window.location.reload();}catch(error){setStatus(error?.message||'설정을 불러오지 못했습니다.','error');syncButtons();}}

  async function savePresets(){setStatus('설정 저장 중');load.disabled=true;save.disabled=true;try{const presets=readLocal();const data=await request('/api/editor/ui-presets',{method:'POST',body:{presets}});setStatus(`설정 ${data.count||presets.length}개 저장됨`,'ok');}catch(error){setStatus(error?.message||'설정을 저장하지 못했습니다.','error');}finally{syncButtons();}}

  connect.addEventListener('click',()=>{if(getToken()){if(window.confirm('이 탭의 관리자 연결을 해제할까요?')){setToken('');syncButtons();setStatus('이 브라우저에 저장');}return;}message.textContent='';dialog.showModal();setTimeout(()=>tokenInput.focus(),0);});
  load.addEventListener('click',loadPresets);save.addEventListener('click',savePresets);
  dialog.querySelector('[data-ui-dash-cancel]').addEventListener('click',()=>dialog.close());dialog.querySelector('[data-ui-dash-submit]').addEventListener('click',submit);tokenInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit();}});dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  syncButtons();if(getToken())setStatus('서버 연결됨','ok');
})();
