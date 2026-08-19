/* v5: desktop rail polish + non-blocking cross-device handoff inside collection. */
(function(){
  if(window.__photoDesktopRailPolishV1Installed)return;
  window.__photoDesktopRailPolishV1Installed=true;

  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,#curatedLinksRow,#skillsInfiniteRow';
  const DEVICE_KEY='photoRoadmapDeviceKeyV1';
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const VIDEO_IDS_KEY='photoRoadmapVideoFavoritesV1';
  const ARTICLE_IDS_KEY='photoRoadmapCuratedFavoritesV1';

  function bindRail(rail){
    if(!rail||rail.dataset.desktopRailPolishV1==='true')return;
    rail.dataset.desktopRailPolishV1='true';

    rail.addEventListener('dragstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      rail.classList.add('is-desktop-pointerdown');
    },true);

    const clearPointerState=()=>rail.classList.remove('is-desktop-pointerdown');
    rail.addEventListener('pointerup',clearPointerState,true);
    rail.addEventListener('pointercancel',clearPointerState,true);
    rail.addEventListener('lostpointercapture',clearPointerState,true);
    rail.addEventListener('mouseleave',()=>{
      if(!rail.classList.contains('is-desktop-dragging'))clearPointerState();
    },true);
  }

  function repairNavIndicator(){
    if(!desktop.matches)return;
    const nav=document.querySelector('.nav-scroll');
    const active=nav?.querySelector('.nav-chip.is-active');
    const indicator=nav?.querySelector('.nav-v33-indicator');
    if(!nav||!active||!indicator)return;

    let skin=indicator.querySelector(':scope > .v37-liquid-skin');
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }

    const w=active.offsetWidth;
    const h=active.offsetHeight;
    if(!w||!h)return;
    indicator.style.width=w+'px';
    indicator.style.height=h+'px';
    indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    indicator.dataset.x=String(active.offsetLeft);
    indicator.dataset.y=String(active.offsetTop);
    indicator.dataset.w=String(w);
    indicator.dataset.h=String(h);
    indicator.dataset.ready='true';
    nav.classList.add('v41-skin-ready','v33-liquid-ready');
  }

  function refresh(){
    if(desktop.matches){
      document.querySelectorAll(RAIL_SELECTOR).forEach(bindRail);
      repairNavIndicator();
    }
  }

  function collectionSheetIsOpen(sheet){
    if(!sheet||sheet.hidden)return false;
    const style=getComputedStyle(sheet);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  function readArray(key){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function writeQuestions(items){
    try{localStorage.setItem(QUESTION_KEY,JSON.stringify(items.slice(0,100)));}catch{}
  }

  function makeDeviceKey(){
    const bytes=new Uint8Array(24);
    try{crypto.getRandomValues(bytes);}
    catch{
      for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
    }
    return 'dev_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }

  function currentDeviceKey(){
    let key=String(localStorage.getItem(DEVICE_KEY)||'').trim();
    if(!/^dev_[a-f0-9]{48}$/.test(key)){
      key=makeDeviceKey();
      try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    }
    return key;
  }

  function refreshCollectionCounts(){
    const videoCount=readArray(VIDEO_IDS_KEY).length;
    const articleCount=readArray(ARTICLE_IDS_KEY).length;
    const questionCount=readArray(QUESTION_KEY).length;
    const total=videoCount+articleCount+questionCount;
    const badge=document.getElementById('collectionFabCount');
    if(badge){badge.textContent=String(total);badge.hidden=total===0;}
    const savedVideo=document.getElementById('savedVideoCount');
    if(savedVideo)savedVideo.textContent=String(videoCount);
    const savedArticle=document.getElementById('savedArticleCount');
    if(savedArticle)savedArticle.textContent=String(articleCount);
    const summary=document.querySelector('.collection-settings__summary');
    if(summary){
      const strong=summary.querySelector(':scope > strong');
      if(strong)strong.textContent=String(total);
      const counts=summary.querySelectorAll(':scope > div b');
      if(counts[0])counts[0].textContent=String(videoCount);
      if(counts[1])counts[1].textContent=String(articleCount);
      if(counts[2])counts[2].textContent=String(questionCount);
    }
  }

  function mergeRemoteQuestions(history){
    const local=readArray(QUESTION_KEY);
    const map=new Map();
    [...(Array.isArray(history)?history:[]),...local].forEach(item=>{
      if(item?.id)map.set(String(item.id),item);
    });
    const merged=[...map.values()].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
    writeQuestions(merged);
    refreshCollectionCounts();
    return merged;
  }

  function installRpcDeviceOverride(){
    const rpc=window.apiRpc;
    if(typeof rpc!=='function'||rpc.__photoDeviceKeyAware===true)return;
    const wrapped=function(method,payload,...rest){
      if(['getQuestionHistory','saveQuestionHistory','deleteQuestionHistory'].includes(String(method||''))){
        const key=currentDeviceKey();
        payload={...(payload||{}),deviceId:key};
      }
      return rpc.call(this,method,payload,...rest);
    };
    wrapped.__photoDeviceKeyAware=true;
    wrapped.__photoOriginalRpc=rpc;
    window.apiRpc=wrapped;
  }

  function releaseStaleAskModal(){
    const askSheet=document.getElementById('askSheet');
    const askBackdrop=document.getElementById('askBackdrop');
    const bodyLocked=document.body.classList.contains('is-modal-open')||document.body.classList.contains('ask-modal-locked');
    if(bodyLocked&&askSheet&&!askSheet.hidden){
      const min=document.getElementById('askMinimize');
      if(min){min.click();return;}
    }
    if(askSheet)askSheet.hidden=true;
    if(askBackdrop){
      askBackdrop.hidden=true;
      askBackdrop.style.pointerEvents='none';
    }
    document.documentElement.classList.remove('ask-modal-locked');
    document.body.classList.remove('ask-modal-locked','is-modal-open');
  }

  function panelStatus(panel,message,error=false){
    const status=panel?.querySelector('.collection-device-panel__status');
    if(!status)return;
    status.textContent=message||'';
    status.classList.toggle('is-error',Boolean(error));
  }

  function renderDevicePanel(link){
    const settings=link?.closest('.collection-settings');
    if(!settings)return;

    releaseStaleAskModal();
    installRpcDeviceOverride();

    link.hidden=true;
    const note=settings.querySelector('.collection-setting-note');
    if(note)note.hidden=true;

    let panel=settings.querySelector('.collection-device-panel');
    if(!panel){
      panel=document.createElement('div');
      panel.className='collection-device-panel';
      panel.innerHTML=`
        <div class="collection-device-panel__head">
          <div><strong>다른 기기에서 이어보기</strong><p>현재 기기의 연결 코드를 복사하거나, 다른 기기에서 가져온 코드를 입력하세요.</p></div>
          <button class="collection-device-panel__back" type="button" data-device-sync-back>닫기</button>
        </div>
        <div class="collection-device-panel__group">
          <label for="collectionDeviceCurrentCode">이 기기의 연결 코드</label>
          <div class="collection-device-panel__code-row">
            <input id="collectionDeviceCurrentCode" type="text" readonly spellcheck="false">
            <button type="button" data-device-sync-copy>코드 복사</button>
          </div>
        </div>
        <div class="collection-device-panel__group">
          <label for="collectionDeviceIncomingCode">다른 기기의 연결 코드</label>
          <div class="collection-device-panel__connect-row">
            <input id="collectionDeviceIncomingCode" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="dev_로 시작하는 연결 코드">
            <button type="button" data-device-sync-connect>연결</button>
          </div>
        </div>
        <div class="collection-device-panel__status" aria-live="polite"></div>`;
      settings.appendChild(panel);
    }
    const current=panel.querySelector('#collectionDeviceCurrentCode');
    if(current)current.value=currentDeviceKey();
    panelStatus(panel,'연결 코드는 질문 기록을 다른 기기에서 이어볼 때만 사용됩니다.');
  }

  function closeDevicePanel(panel){
    const settings=panel?.closest('.collection-settings');
    panel?.remove();
    const link=settings?.querySelector('#collectionDeviceLink');
    if(link)link.hidden=false;
    const note=settings?.querySelector('.collection-setting-note');
    if(note)note.hidden=false;
  }

  async function copyDeviceCode(panel){
    const code=panel?.querySelector('#collectionDeviceCurrentCode')?.value||currentDeviceKey();
    let copied=false;
    try{
      await navigator.clipboard.writeText(code);
      copied=true;
    }catch{
      try{
        const input=panel?.querySelector('#collectionDeviceCurrentCode');
        input?.select();
        copied=document.execCommand('copy');
        input?.setSelectionRange?.(0,0);
      }catch{}
    }
    panelStatus(panel,copied?'연결 코드를 복사했습니다.':'복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.',!copied);
  }

  async function connectDevice(panel){
    const input=panel?.querySelector('#collectionDeviceIncomingCode');
    const key=String(input?.value||'').trim().toLowerCase();
    if(!/^dev_[a-f0-9]{48}$/.test(key)){
      panelStatus(panel,'연결 코드 형식이 맞지 않습니다. dev_로 시작하는 전체 코드를 확인해 주세요.',true);
      input?.focus();
      return;
    }

    try{localStorage.setItem(DEVICE_KEY,key);}catch{}
    const current=panel?.querySelector('#collectionDeviceCurrentCode');
    if(current)current.value=key;
    installRpcDeviceOverride();
    panelStatus(panel,'다른 기기의 질문 기록을 확인하고 있습니다.');

    if(typeof window.apiRpc!=='function'){
      panelStatus(panel,'연결 코드는 저장했습니다. 페이지를 다시 열면 이 코드로 질문 기록을 이어봅니다.');
      return;
    }

    try{
      const res=await window.apiRpc('getQuestionHistory',{deviceId:key});
      if(!res?.ok)throw new Error(res?.message||'연결 실패');
      const merged=mergeRemoteQuestions(res.history);
      panelStatus(panel,`연결했습니다. 현재 질문 기록 ${merged.length}개를 확인할 수 있습니다.`);
      if(input)input.value='';
    }catch(error){
      panelStatus(panel,'코드는 저장했지만 원격 질문 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',true);
    }
  }

  /* Intercept the legacy row before its target listener can close the current
     collection sheet and open the retired question modal. This path works on
     both desktop and mobile. */
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    const deviceLink=target.closest('#collectionDeviceLink');
    if(deviceLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      renderDevicePanel(deviceLink);
      return;
    }

    const panel=target.closest('.collection-device-panel');
    if(panel){
      if(target.closest('[data-device-sync-back]')){
        event.preventDefault();
        event.stopImmediatePropagation();
        closeDevicePanel(panel);
        return;
      }
      if(target.closest('[data-device-sync-copy]')){
        event.preventDefault();
        event.stopImmediatePropagation();
        copyDeviceCode(panel);
        return;
      }
      if(target.closest('[data-device-sync-connect]')){
        event.preventDefault();
        event.stopImmediatePropagation();
        connectDevice(panel);
        return;
      }
    }
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    const input=event.target instanceof Element?event.target.closest('#collectionDeviceIncomingCode'):null;
    if(!input)return;
    const panel=input.closest('.collection-device-panel');
    if(panel){event.preventDefault();connectDevice(panel);}
  },true);

  document.addEventListener('click',event=>{
    if(!desktop.matches)return;

    if(event.target.closest?.('.nav-chip')){
      setTimeout(repairNavIndicator,430);
    }

    const sheet=document.getElementById('collectionSheet');
    if(!collectionSheetIsOpen(sheet))return;
    const target=event.target;
    if(!(target instanceof Element))return;
    if(target.closest('#collectionSheet,#collectionFab'))return;

    const backdrop=document.getElementById('collectionBackdrop');
    if(backdrop){
      backdrop.click();
      return;
    }
    const close=sheet.querySelector('[data-collection-close],.collection-close,[aria-label="닫기"]');
    close?.click();
  },true);

  function init(){
    installRpcDeviceOverride();
    refresh();
    const collection=document.getElementById('collectionSheet');
    const ask=document.getElementById('askSheet');
    if(collectionSheetIsOpen(collection)&&ask&&!ask.hidden)releaseStaleAskModal();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  [80,220,520,1200,2200].forEach(delay=>setTimeout(()=>{installRpcDeviceOverride();refresh();},delay));
  window.addEventListener('pageshow',()=>setTimeout(init,120),{passive:true});
  window.addEventListener('resize',()=>setTimeout(repairNavIndicator,80),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
