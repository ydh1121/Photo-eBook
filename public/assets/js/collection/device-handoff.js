/* v7: stable in-place cross-device continuation accordion.
   Build before interaction, keep the panel mounted, and animate its exact
   measured height inside one persistent outer shell. */
(function(){
  if(window.__photoCollectionHandoffV2Installed)return;
  window.__photoCollectionHandoffV2Installed=true;

  const DEVICE_KEY='photoRoadmapDeviceKeyV1';
  const QUESTION_KEY='photoRoadmapQuestionsV2';

  function readQuestions(){
    try{const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
  }
  function writeQuestions(items){try{localStorage.setItem(QUESTION_KEY,JSON.stringify(items.slice(0,100)));}catch{}}

  function makeInternalDeviceKey(){
    const bytes=new Uint8Array(24);
    try{crypto.getRandomValues(bytes);}catch{for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);}
    return 'dev_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }
  function currentInternalDeviceKey(){
    let key=String(localStorage.getItem(DEVICE_KEY)||'').trim().toLowerCase();
    if(/^[a-f0-9]{48}$/.test(key))key='dev_'+key;
    if(!/^dev_[a-f0-9]{48}$/.test(key))key=makeInternalDeviceKey();
    try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    return key;
  }
  function publicCode(internal=currentInternalDeviceKey()){
    return String(internal||'').replace(/^dev_/i,'');
  }
  function internalCode(value){
    const plain=String(value||'').trim().toLowerCase().replace(/^dev_/,'').replace(/[\s-]+/g,'');
    return /^[a-f0-9]{48}$/.test(plain)?'dev_'+plain:'';
  }

  function installRpcOverride(){
    const rpc=window.apiRpc;
    if(typeof rpc!=='function'||rpc.__photoDeviceKeyAwareV2)return;
    const wrapped=function(method,payload,...rest){
      if(['getQuestionHistory','saveQuestionHistory','deleteQuestionHistory'].includes(String(method||''))){
        payload={...(payload||{}),deviceId:currentInternalDeviceKey()};
      }
      return rpc.call(this,method,payload,...rest);
    };
    wrapped.__photoDeviceKeyAwareV2=true;
    wrapped.__photoOriginalRpc=rpc;
    window.apiRpc=wrapped;
  }

  function syncPanelHeight(subject){
    const accordion=subject?.classList?.contains('collection-device-accordion')
      ? subject
      : subject?.closest?.('.collection-device-accordion');
    if(!accordion)return;
    const panel=accordion.querySelector(':scope > .collection-device-panel-v2');
    const clip=panel?.querySelector(':scope > .collection-device-panel-clip');
    if(!panel||!clip)return;
    const height=Math.max(0,Math.ceil(clip.scrollHeight));
    accordion.style.setProperty('--device-panel-height',`${height}px`);
  }

  function status(panel,text,error=false){
    const node=panel?.querySelector('[data-device-panel-status]');
    if(!node)return;
    node.textContent=text||'';
    node.classList.toggle('is-error',Boolean(error));
    requestAnimationFrame(()=>syncPanelHeight(panel));
  }

  function panelMarkup(){
    return `<div class="collection-device-panel-clip">
      <div class="collection-device-panel-inner">
        <div class="collection-device-panel__current">
          <div class="collection-device-panel__current-copy">
            <small>이 기기의 연결 코드</small>
            <code data-device-current-code></code>
          </div>
          <button type="button" class="collection-device-copy" data-device-panel-copy>복사</button>
        </div>
        <div class="collection-device-panel__divider" aria-hidden="true"></div>
        <div class="collection-device-panel__group">
          <label for="deviceCodeIncomingV2">다른 기기의 코드로 연결</label>
          <p class="collection-device-panel__hint">다른 기기에서 복사한 연결 코드를 붙여넣으면 저장한 질문을 이어서 볼 수 있습니다.</p>
          <div class="collection-device-panel__connect-row">
            <input id="deviceCodeIncomingV2" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="48자리 연결 코드">
            <button type="button" class="collection-device-connect" data-device-panel-connect>연결하기</button>
          </div>
        </div>
        <div class="collection-device-panel__status" data-device-panel-status aria-live="polite"></div>
      </div>
    </div>`;
  }

  function ensureAccordion(link){
    const settings=link?.closest('.collection-settings');
    if(!settings)return null;
    let accordion=link.closest('.collection-device-accordion');
    if(!accordion){
      accordion=document.createElement('div');
      accordion.className='collection-device-accordion';
      settings.insertBefore(accordion,link);
      accordion.appendChild(link);
    }
    return accordion;
  }

  function ensurePanel(link){
    const accordion=ensureAccordion(link);
    if(!accordion)return null;
    let panel=accordion.querySelector(':scope > .collection-device-panel-v2');
    if(!panel){
      panel=document.createElement('div');
      panel.className='collection-device-panel-v2';
      panel.innerHTML=panelMarkup();
      accordion.appendChild(panel);
    }else if(!panel.querySelector(':scope > .collection-device-panel-clip')){
      panel.innerHTML=panelMarkup();
    }
    panel.hidden=false;
    panel.removeAttribute('hidden');
    if(!panel.hasAttribute('aria-hidden'))panel.setAttribute('aria-hidden','true');
    syncPanelHeight(accordion);
    return panel;
  }

  function prepareLink(link){
    if(!link)return null;
    let safe=link;
    if(link.dataset.deviceSafeV2!=='true'){
      safe=link.cloneNode(true);
      safe.dataset.deviceSafeV2='true';
      safe.setAttribute('aria-expanded','false');
      safe.querySelectorAll(':scope > b, :scope > .collection-device-chevron').forEach(node=>node.remove());
      link.replaceWith(safe);
    }
    const accordion=ensureAccordion(safe);
    const panel=ensurePanel(safe);
    const expanded=safe.getAttribute('aria-expanded')==='true';
    accordion?.classList.toggle('is-device-expanded',expanded);
    panel?.setAttribute('aria-hidden',expanded?'false':'true');
    syncPanelHeight(accordion);
    return safe;
  }

  function setExpanded(link,next){
    const safe=prepareLink(link);
    if(!safe)return;
    const panel=ensurePanel(safe);
    const accordion=safe.closest('.collection-device-accordion');
    if(!panel||!accordion)return;
    const expanded=Boolean(next);

    if(expanded){
      const code=panel.querySelector('[data-device-current-code]');
      if(code)code.textContent=publicCode();
      status(panel,'');
      syncPanelHeight(accordion);
      /* Measure while still collapsed, then flip state on the next frame so the
         browser has a real 0px -> measured-height transition. */
      accordion.getBoundingClientRect();
      requestAnimationFrame(()=>{
        safe.classList.add('is-device-expanded');
        accordion.classList.add('is-device-expanded');
        safe.setAttribute('aria-expanded','true');
        panel.setAttribute('aria-hidden','false');
        syncPanelHeight(accordion);
      });
      return;
    }

    safe.classList.remove('is-device-expanded');
    accordion.classList.remove('is-device-expanded');
    safe.setAttribute('aria-expanded','false');
    panel.setAttribute('aria-hidden','true');
  }

  function togglePrepared(link){
    setExpanded(link,link.getAttribute('aria-expanded')!=='true');
  }

  async function copyCode(panel){
    const value=publicCode();
    let ok=false;
    try{await navigator.clipboard.writeText(value);ok=true;}catch{
      try{
        const area=document.createElement('textarea');
        area.value=value;area.setAttribute('readonly','');
        area.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(area);area.select();ok=document.execCommand('copy');area.remove();
      }catch{}
    }
    status(panel,ok?'연결 코드를 복사했습니다.':'복사하지 못했습니다. 다시 시도해 주세요.',!ok);
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
    const key=internalCode(input?.value||'');
    if(!key){status(panel,'연결 코드를 다시 확인해 주세요.',true);input?.focus();return;}

    try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    const code=panel?.querySelector('[data-device-current-code]');
    if(code)code.textContent=publicCode(key);
    installRpcOverride();

    if(typeof window.apiRpc!=='function'){
      status(panel,'연결 코드를 저장했습니다.');
      return;
    }

    status(panel,'저장한 질문을 불러오는 중입니다.');
    try{
      const res=await window.apiRpc('getQuestionHistory',{deviceId:key});
      if(!res?.ok)throw new Error('sync');
      const merged=mergeRemote(res.history);
      status(panel,`연결했습니다. 저장한 질문 ${merged.length}개를 확인할 수 있습니다.`);
      if(input)input.value='';
    }catch{
      status(panel,'코드는 저장했지만 질문을 불러오지 못했습니다. 다시 시도해 주세요.',true);
    }
  }

  function refresh(){
    installRpcOverride();
    prepareLink(document.getElementById('collectionDeviceLink'));
  }

  window.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    const rawLink=target.closest('#collectionDeviceLink');
    if(rawLink){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const wasPrepared=rawLink.dataset.deviceSafeV2==='true';
      const safe=prepareLink(rawLink);
      if(!safe)return;
      if(wasPrepared){
        togglePrepared(safe);
      }else{
        safe.getBoundingClientRect();
        requestAnimationFrame(()=>togglePrepared(safe));
      }
      return;
    }

    const panel=target.closest('.collection-device-panel-v2');
    if(!panel)return;
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
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  [80,180,360,700,1200,2200].forEach(ms=>setTimeout(refresh,ms));
  window.addEventListener('pageshow',()=>setTimeout(refresh,80),{passive:true});
  window.addEventListener('resize',()=>requestAnimationFrame(()=>{
    document.querySelectorAll('.collection-device-accordion').forEach(syncPanelHeight);
  }),{passive:true});
})();
