(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const anchor=document.querySelector('.editor-page-meta');
  if(!manifest||!anchor)return;

  const DRAFT_KEY='platformEditorLabDraftV1';
  const TOKEN_KEY='platformEditorAdminToken';
  const LOCAL_PRESET_KEY='platformUiCapabilityPresetsV1';

  function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function readLocalPresets(){try{const value=JSON.parse(localStorage.getItem(LOCAL_PRESET_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  function defaults(){
    const config={};
    for(const capability of manifest.capabilities){
      const firstPreset=capability.presets?.[0];
      config[capability.id]={enabled:false,presetId:firstPreset?.id||'',overrides:{}};
    }
    return config;
  }

  function normalizeConfig(value){
    const base=defaults();
    const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    for(const capability of manifest.capabilities){
      const current=input[capability.id]&&typeof input[capability.id]==='object'?input[capability.id]:{};
      base[capability.id]={
        enabled:current.enabled===true,
        presetId:String(current.presetId||base[capability.id].presetId||''),
        overrides:current.overrides&&typeof current.overrides==='object'&&!Array.isArray(current.overrides)?current.overrides:{}
      };
    }
    return base;
  }

  function allPresets(capability){
    const system=(capability.presets||[]).map(item=>({...item,source:'system'}));
    const local=readLocalPresets().filter(item=>item.capabilityId===capability.id);
    return [...system,...local];
  }

  const panel=document.createElement('details');
  panel.className='editor-page-ui';
  panel.innerHTML=`<summary><span><small>PAGE UI</small><strong>페이지 UI</strong></span><span id="editorPageUiCount">0개 사용</span></summary><div class="editor-page-ui__body"><div class="editor-page-ui__intro"><p>상단 메뉴, 필터칩, rail, 하단 팝업 같은 공통 기능을 페이지별로 선택합니다.</p><a href="/ui-dashboard/" target="_blank" rel="noopener">UI 대시보드</a></div><div id="editorPageUiList" class="editor-page-ui-list"></div><div class="editor-page-ui__actions"><button type="button" id="editorPageUiLoad">서버에서 불러오기</button><button type="button" id="editorPageUiSave">서버 저장</button></div><span id="editorPageUiStatus" class="editor-page-ui-status" role="status"></span></div>`;
  anchor.insertAdjacentElement('afterend',panel);

  const list=panel.querySelector('#editorPageUiList');
  const count=panel.querySelector('#editorPageUiCount');
  const loadButton=panel.querySelector('#editorPageUiLoad');
  const saveButton=panel.querySelector('#editorPageUiSave');
  const status=panel.querySelector('#editorPageUiStatus');

  function setStatus(text,kind='idle'){status.textContent=text||'';status.dataset.status=kind;}
  function readConfig(){const draft=readDraft();return normalizeConfig(draft.uiCapabilities);}
  function writeConfig(config){const draft=readDraft();draft.uiCapabilities=normalizeConfig(config);writeDraft(draft);updateCount(draft.uiCapabilities);}
  function updateCount(config){const used=Object.values(config||{}).filter(item=>item?.enabled).length;count.textContent=`${used}개 사용`;}

  function render(){
    const config=readConfig();
    list.innerHTML=manifest.capabilities.map(capability=>{
      const current=config[capability.id];
      const presets=allPresets(capability);
      const options=['<option value="">preset 없음</option>',...presets.map(preset=>`<option value="${escapeHtml(preset.id)}" ${preset.id===current.presetId?'selected':''}>${escapeHtml(preset.name)}</option>`)].join('');
      return `<section class="editor-page-ui-item" data-page-ui-item="${escapeHtml(capability.id)}"><div class="editor-page-ui-item__head"><span><strong>${escapeHtml(capability.label)}</strong><small>${escapeHtml(capability.category)}</small></span><label class="editor-page-ui-toggle"><input type="checkbox" data-page-ui-enabled="${escapeHtml(capability.id)}" ${current.enabled?'checked':''}><i></i></label></div><select data-page-ui-preset="${escapeHtml(capability.id)}" ${current.enabled?'':'disabled'}>${options}</select></section>`;
    }).join('');
    updateCount(config);
    bind();
  }

  function bind(){
    list.querySelectorAll('[data-page-ui-enabled]').forEach(input=>input.addEventListener('change',()=>{
      const config=readConfig();const id=input.dataset.pageUiEnabled;config[id].enabled=input.checked;writeConfig(config);const select=list.querySelector(`[data-page-ui-preset="${CSS.escape(id)}"]`);if(select)select.disabled=!input.checked;
    }));
    list.querySelectorAll('[data-page-ui-preset]').forEach(select=>select.addEventListener('change',()=>{
      const config=readConfig();config[select.dataset.pageUiPreset].presetId=select.value;writeConfig(config);
    }));
  }

  async function request(path,{method='GET',body}={}){
    const token=getToken();if(!token)throw new Error('먼저 관리자 서버에 연결하세요.');
    const response=await fetch(path,{method,credentials:'same-origin',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));if(!response.ok||data?.ok===false)throw new Error(data?.message||`요청 실패 (${response.status})`);return data;
  }

  async function loadServer(){
    const draft=readDraft();if(!draft.pageId){setStatus('page id를 확인해 주세요.','error');return;}
    setStatus('페이지 UI 불러오는 중');
    try{
      const data=await request(`/api/editor/page-ui?pageId=${encodeURIComponent(draft.pageId)}`);
      const config=readConfig();
      for(const item of data.items||[]){if(config[item.capabilityId])config[item.capabilityId]={enabled:item.enabled,presetId:item.presetId,overrides:item.overrides||{}};}
      writeConfig(config);render();setStatus(`페이지 UI ${data.items?.length||0}개 불러옴`,'ok');
    }catch(error){setStatus(error?.message||'페이지 UI를 불러오지 못했습니다.','error');}
  }

  async function saveServer(){
    const draft=readDraft();if(!draft.pageId){setStatus('page id를 확인해 주세요.','error');return;}
    const config=readConfig();
    const items=manifest.capabilities.map(capability=>({capabilityId:capability.id,...config[capability.id]}));
    setStatus('페이지 UI 저장 중');
    try{const data=await request('/api/editor/page-ui',{method:'POST',body:{pageId:draft.pageId,updatedBy:'platform-owner',items}});setStatus(`페이지 UI ${data.count||items.length}개 저장됨`,'ok');}
    catch(error){setStatus(error?.message||'페이지 UI를 저장하지 못했습니다.','error');}
  }

  loadButton.addEventListener('click',loadServer);saveButton.addEventListener('click',saveServer);
  render();
})();
