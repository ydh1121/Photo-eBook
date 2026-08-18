/* v1: hard-stop the legacy cross-device modal handoff and keep it inside My Collection. */
(function(){
  if(window.__photoCollectionHandoffV2Installed)return;
  window.__photoCollectionHandoffV2Installed=true;

  const DEVICE_KEY='photoRoadmapDeviceKeyV1';
  const QUESTION_KEY='photoRoadmapQuestionsV2';

  function readQuestions(){
    try{const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
  }
  function writeQuestions(items){try{localStorage.setItem(QUESTION_KEY,JSON.stringify(items.slice(0,100)));}catch{}}
  function makeDeviceKey(){
    const bytes=new Uint8Array(24);
    try{crypto.getRandomValues(bytes);}catch{for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);}
    return 'dev_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }
  function currentDeviceKey(){
    let key=String(localStorage.getItem(DEVICE_KEY)||'').trim().toLowerCase();
    if(!/^dev_[a-f0-9]{48}$/.test(key)){
      key=makeDeviceKey();
      try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    }
    return key;
  }

  function installRpcOverride(){
    const rpc=window.apiRpc;
    if(typeof rpc!=='function'||rpc.__photoDeviceKeyAwareV2)return;
    const wrapped=function(method,payload,...rest){
      if(['getQuestionHistory','saveQuestionHistory','deleteQuestionHistory'].includes(String(method||''))){
        payload={...(payload||{}),deviceId:currentDeviceKey()};
      }
      return rpc.call(this,method,payload,...rest);
    };
    wrapped.__photoDeviceKeyAwareV2=true;
    wrapped.__photoOriginalRpc=rpc;
    window.apiRpc=wrapped;
  }

  function status(panel,text,error=false){
    const node=panel?.querySelector('[data-device-panel-status]');
    if(!node)return;
    node.textContent=text||'';
    node.classList.toggle('is-error',Boolean(error));
  }

  function buildPanel(link){
    const settings=link?.closest('.collection-settings');
    if(!settings)return null;
    let panel=settings.querySelector('.collection-device-panel-v2');
    if(panel)return panel;

    panel=document.createElement('div');
    panel.className='collection-device-panel collection-device-panel-v2';
    panel.innerHTML=`
      <div class="collection-device-panel__head">
        <div><strong>다른 기기에서 이어보기</strong><p>현재 기기의 연결 코드를 복사하거나 다른 기기의 코드를 입력하세요.</p></div>
        <button class="collection-device-panel__back" type="button" data-device-panel-back>닫기</button>
      </div>
      <div class="collection-device-panel__group">
        <label for="deviceCodeCurrentV2">이 기기의 연결 코드</label>
        <div class="collection-device-panel__code-row">
          <input id="deviceCodeCurrentV2" type="text" readonly spellcheck="false">
          <button type="button" data-device-panel-copy>코드 복사</button>
        </div>
      </div>
      <div class="collection-device-panel__group">
        <label for="deviceCodeIncomingV2">다른 기기의 연결 코드</label>
        <div class="collection-device-panel__connect-row">
          <input id="deviceCodeIncomingV2" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="dev_로 시작하는 연결 코드">
          <button type="button" data-device-panel-connect>연결</button>
        </div>
      </div>
      <div class="collection-device-panel__status" data-device-panel-status aria-live="polite"></div>`;
    settings.appendChild(panel);
    return panel;
  }

  function openPanel(link){
    const panel=buildPanel(link);
    if(!panel)return;
    link.hidden=true;
    const note=link.closest('.collection-settings')?.querySelector('.collection-setting-note');
    if(note)note.hidden=true;
    const current=panel.querySelector('#deviceCodeCurrentV2');
    if(current)current.value=currentDeviceKey();
    status(panel,'이 화면 안에서 바로 연결할 수 있습니다.');
    const sheet=document.getElementById('collectionSheet');
    if(sheet)sheet.style.pointerEvents='auto';
  }

  function closePanel(panel){
    const settings=panel?.closest('.collection-settings');
    panel?.remove();
    const link=settings?.querySelector('#collectionDeviceLink');
    if(link)link.hidden=false;
    const note=settings?.querySelector('.collection-setting-note');
    if(note)note.hidden=false;
  }

  async function copyCode(panel){
    const value=panel?.querySelector('#deviceCodeCurrentV2')?.value||currentDeviceKey();
    let ok=false;
    try{await navigator.clipboard.writeText(value);ok=true;}catch{}
    status(panel,ok?'연결 코드를 복사했습니다.':'복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.',!ok);
  }

  function mergeRemote(history){
    const map=new Map();
    [...(Array.isArray(history)?history:[]),...readQuestions()].forEach(item=>{if(item?.id)map.set(String(item.id),item);});
    const merged=[...map.values()].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
    writeQuestions(merged);
    return merged;
  }

  async function connect(panel){
    const input=panel?.querySelector('#deviceCodeIncomingV2');
    const key=String(input?.value||'').trim().toLowerCase();
    if(!/^dev_[a-f0-9]{48}$/.test(key)){
      status(panel,'연결 코드 형식이 맞지 않습니다.',true);
      input?.focus();
      return;
    }
    try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    const current=panel?.querySelector('#deviceCodeCurrentV2');
    if(current)current.value=key;
    installRpcOverride();
    if(typeof window.apiRpc!=='function'){
      status(panel,'연결 코드를 저장했습니다.');
      return;
    }
    status(panel,'질문 기록을 확인하고 있습니다.');
    try{
      const res=await window.apiRpc('getQuestionHistory',{deviceId:key});
      if(!res?.ok)throw new Error('sync');
      const merged=mergeRemote(res.history);
      status(panel,`연결했습니다. 질문 기록 ${merged.length}개를 확인할 수 있습니다.`);
      if(input)input.value='';
    }catch{
      status(panel,'코드는 저장했지만 질문 기록을 불러오지 못했습니다.',true);
    }
  }

  function repairHeader(){
    const head=document.querySelector('#collectionSheet .collection-head');
    if(!head)return;
    const select=head.querySelector('.collection-select-toggle');
    const close=head.querySelector('#collectionClose');
    if(select&&close&&select.nextElementSibling!==close){
      head.appendChild(select);
      head.appendChild(close);
    }else if(close&&head.lastElementChild!==close){
      head.appendChild(close);
    }
  }

  function stripLegacyDeviceListener(){
    const link=document.getElementById('collectionDeviceLink');
    if(!link||link.dataset.deviceSafeV2==='true')return;
    const clone=link.cloneNode(true);
    clone.dataset.deviceSafeV2='true';
    link.replaceWith(clone);
  }

  function refresh(){
    installRpcOverride();
    repairHeader();
    stripLegacyDeviceListener();
  }

  /* Window capture runs before document/target handlers. The old handler that
     closes My Collection and opens the retired question modal never receives
     this click. */
  window.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    const link=target.closest('#collectionDeviceLink');
    if(link){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openPanel(link);
      return;
    }

    const panel=target.closest('.collection-device-panel-v2');
    if(!panel)return;
    if(target.closest('[data-device-panel-back]')){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();closePanel(panel);return;
    }
    if(target.closest('[data-device-panel-copy]')){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();copyCode(panel);return;
    }
    if(target.closest('[data-device-panel-connect]')){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();connect(panel);return;
    }
  },true);

  window.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    const input=event.target instanceof Element?event.target.closest('#deviceCodeIncomingV2'):null;
    if(!input)return;
    const panel=input.closest('.collection-device-panel-v2');
    if(panel){event.preventDefault();connect(panel);}
  },true);

  function init(){
    refresh();
    const body=document.getElementById('collectionBody');
    if(body){
      const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
      observer.observe(body,{childList:true,subtree:true});
    }
    const head=document.querySelector('#collectionSheet .collection-head');
    if(head){
      const observer=new MutationObserver(()=>requestAnimationFrame(repairHeader));
      observer.observe(head,{childList:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  [120,400,1000,2200].forEach(ms=>setTimeout(refresh,ms));
  window.addEventListener('pageshow',()=>setTimeout(refresh,120),{passive:true});
})();
