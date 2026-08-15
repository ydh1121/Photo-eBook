const QUESTION_STORE_KEY='photoRoadmapQuestionsV2';
const QUESTION_DEVICE_KEY='photoRoadmapDeviceKeyV1';

function renderApp(data){
  window.__SITE_DATA=data;

  const navMap=new Map((data.nav||[]).map(n=>[n.id,n]));
  const order=['intro','market','education','skills','portfolio','gear','plan','scripts','iphone','sources'];
  const renderers={intro:introSection,market:marketSection,education:educationSection,skills:skillsSection,portfolio:portfolioSection,gear:gearSection,plan:planSection,scripts:scriptsSection,iphone:iphoneSection,sources:sourcesSection};

  const sections=order.filter(id=>navMap.has(id)).map((id,index)=>renderers[id](data,navMap.get(id),index)).join('');
  const app=$('#app');
  app.innerHTML=hero(data)+nav(data)+sections;
  app.hidden=false;
  const boot=$('#boot');
  if(boot) boot.remove();

  setupNavigation();
  setupCopyButtons();
  setupQuestionDrawer();
}

function setupCopyButtons(){
  $$('.copy-btn').forEach(btn=>{
    if(btn.dataset.bound==='true') return;
    btn.dataset.bound='true';
    btn.addEventListener('click',async()=>{
      const target=document.getElementById(btn.dataset.copy);
      if(!target)return;
      try{
        await navigator.clipboard.writeText(target.innerText);
        const old=btn.textContent;
        btn.textContent='복사됨';
        setTimeout(()=>btn.textContent=old,1000);
      }catch(e){}
    });
  });
}

function readLocalQuestions(){
  try{
    const parsed=JSON.parse(localStorage.getItem(QUESTION_STORE_KEY)||'[]');
    return Array.isArray(parsed)?parsed:[];
  }catch(e){ return []; }
}

function writeLocalQuestions(items){
  localStorage.setItem(QUESTION_STORE_KEY,JSON.stringify(items.slice(0,100)));
}

function saveLocalQuestion(item){
  const items=readLocalQuestions();
  const next=[item,...items.filter(x=>x.id!==item.id)].slice(0,100);
  writeLocalQuestions(next);
  return next;
}

function makeDeviceKey(){
  const bytes=new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'dev_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}

function getDeviceKey(){
  let key=localStorage.getItem(QUESTION_DEVICE_KEY)||'';
  if(!/^dev_[a-f0-9]{48}$/.test(key)){
    key=makeDeviceKey();
    localStorage.setItem(QUESTION_DEVICE_KEY,key);
  }
  return key;
}

function setupQuestionDrawer(){
  if($('#askLayer')) return;

  const layer=document.createElement('div');
  layer.id='askLayer';
  layer.innerHTML=`
    <button id="askBubble" class="ask-bubble" hidden>GPT에 질문</button>
    <button id="askFab" class="ask-fab" hidden>질문함</button>
    <div id="askBackdrop" class="ask-backdrop" hidden></div>

    <section id="askSheet" class="ask-sheet" hidden aria-label="질문함">
      <div id="askHandleWrap" class="ask-sheet__handle-wrap"><div id="askHandle" class="ask-sheet__handle"></div></div>
      <div class="ask-sheet__top">
        <div class="ask-sheet__title">질문함</div>
        <button id="askMinimize" class="ask-sheet__min" type="button" aria-label="축소">−</button>
      </div>

      <div class="ask-tabs">
        <button id="askWriteTab" class="ask-tab is-active" type="button">질문 작성</button>
        <button id="askHistoryTab" class="ask-tab" type="button">저장한 질문</button>
      </div>

      <div id="askWritePanel">
        <div id="askQuote" class="ask-sheet__quote">문장을 선택하면 여기에 표시됩니다.</div>
        <label class="ask-sheet__label" for="askInput">질문</label>
        <textarea id="askInput" placeholder="이 부분을 쉽게 설명해줘. 예시를 보여줘. 내 상황에 맞게 바꿔줘."></textarea>
        <div class="ask-actions">
          <button id="askCopy" class="ask-secondary" type="button">프롬프트 복사</button>
          <button id="askSave" class="ask-primary" type="button">질문 저장</button>
        </div>
        <button id="askClear" class="ask-tertiary" type="button">선택 해제</button>
        <div class="ask-note">OpenAI API를 사용하지 않습니다. 질문은 이 기기와 Google Sheet에 함께 저장됩니다.</div>
      </div>

      <div id="askHistoryPanel" hidden>
        <div class="login-card">
          <h4>질문 기록</h4>
          <p>이 브라우저에 자동으로 발급된 동기화 키로 Google Sheet와 기록을 맞춥니다. 앱스크립트나 별도 로그인은 사용하지 않습니다.</p>
          <div class="ask-actions">
            <button id="copySyncKey" class="ask-secondary" type="button">동기화 키 복사</button>
            <button id="changeSyncKey" class="ask-secondary" type="button">다른 기기 연결</button>
          </div>
          <div id="syncState" class="login-state"></div>
        </div>
        <div id="historyList" class="history-list"></div>
      </div>
    </section>`;

  document.body.appendChild(layer);

  const bubble=$('#askBubble');
  const fab=$('#askFab');
  const backdrop=$('#askBackdrop');
  const sheet=$('#askSheet');
  const handleWrap=$('#askHandleWrap');
  const minBtn=$('#askMinimize');
  const writeTab=$('#askWriteTab');
  const historyTab=$('#askHistoryTab');
  const writePanel=$('#askWritePanel');
  const historyPanel=$('#askHistoryPanel');
  const quote=$('#askQuote');
  const input=$('#askInput');
  const copyBtn=$('#askCopy');
  const saveBtn=$('#askSave');
  const clearBtn=$('#askClear');
  const historyList=$('#historyList');
  const syncState=$('#syncState');
  const copySyncKey=$('#copySyncKey');
  const changeSyncKey=$('#changeSyncKey');

  const state={
    selectedText:'',
    used:readLocalQuestions().length>0,
    deviceId:getDeviceKey(),
    remoteHistory:[]
  };

  fab.hidden=!state.used;

  function blockBackgroundMove(e){
    if(sheet.hidden) return;
    if(sheet.contains(e.target)) return;
    e.preventDefault();
  }

  function lockPageScroll(){
    if(document.body.classList.contains('is-modal-open')) return;
    document.body.classList.add('is-modal-open');
    document.addEventListener('touchmove',blockBackgroundMove,{passive:false,capture:true});
    document.addEventListener('wheel',blockBackgroundMove,{passive:false,capture:true});
  }

  function unlockPageScroll(){
    if(!document.body.classList.contains('is-modal-open')) return;
    document.body.classList.remove('is-modal-open');
    document.removeEventListener('touchmove',blockBackgroundMove,{capture:true});
    document.removeEventListener('wheel',blockBackgroundMove,{capture:true});
  }

  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const nowText=()=>new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date());

  function currentSelection(){
    const sel=window.getSelection();
    if(!sel || sel.rangeCount===0 || sel.isCollapsed) return null;
    const text=sel.toString().replace(/\s+/g,' ').trim();
    if(text.length<2) return null;
    const range=sel.getRangeAt(0);
    let node=range.commonAncestorContainer;
    if(node.nodeType===3) node=node.parentElement;
    const app=$('#app');
    if(!app || !app.contains(node)) return null;
    const rect=range.getBoundingClientRect();
    if(!rect || (!rect.width && !rect.height)) return null;
    return {text,rect};
  }

  function setSelectedText(text,resetQuestion=true){
    state.selectedText=String(text||'').trim();
    quote.textContent=state.selectedText || '문장을 선택하면 여기에 표시됩니다.';
    if(resetQuestion) input.value=state.selectedText ? '이 부분을 쉽게 설명해줘.' : '';
  }

  function hideBubble(){ bubble.hidden=true; }

  function showBubble(info){
    setSelectedText(info.text,true);
    const topAbove=info.rect.top-122;
    const topBelow=info.rect.bottom+72;
    const top=topAbove>96?topAbove:topBelow;
    const left=clamp(info.rect.left+info.rect.width/2,78,window.innerWidth-78);
    bubble.style.top=`${top}px`;
    bubble.style.left=`${left}px`;
    bubble.style.transform='translateX(-50%)';
    bubble.hidden=false;
  }

  function setTab(tab){
    const history=tab==='history';
    writeTab.classList.toggle('is-active',!history);
    historyTab.classList.toggle('is-active',history);
    writePanel.hidden=history;
    historyPanel.hidden=!history;
    if(history){ renderHistory(); refreshRemoteHistory(); }
  }

  function openSheet(tab='write'){
    const info=currentSelection();
    if(info) setSelectedText(info.text,true);
    hideBubble();
    if(window.getSelection) window.getSelection().removeAllRanges();
    lockPageScroll();
    backdrop.hidden=false;
    sheet.hidden=false;
    sheet.style.transform='translateY(0)';
    fab.hidden=true;
    setTab(tab);
    if(tab==='write' && state.selectedText) setTimeout(()=>input.focus(),reduceMotion()?0:80);
  }

  function minimizeSheet(){
    sheet.style.transform='translateY(0)';
    sheet.classList.remove('is-dragging');
    backdrop.hidden=true;
    sheet.hidden=true;
    unlockPageScroll();
    fab.hidden=!(state.used || readLocalQuestions().length);
  }

  function buildPrompt(){
    const selected=state.selectedText.trim();
    const question=(input.value||'').trim();
    if(!selected || !question) return '';
    return `아래 선택 문장을 바탕으로 질문에 답해줘.\n\n선택 문장:\n"${selected}"\n\n질문:\n${question}`;
  }

  async function copyPrompt(){
    const prompt=buildPrompt();
    if(!prompt) return;
    try{
      await navigator.clipboard.writeText(prompt);
      copyBtn.textContent='복사됨';
      setTimeout(()=>copyBtn.textContent='프롬프트 복사',1000);
    }catch(e){}
  }

  function mergeHistory(){
    const map=new Map();
    [...state.remoteHistory,...readLocalQuestions()].forEach(item=>{ if(item?.id) map.set(item.id,item); });
    return [...map.values()].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }

  function renderHistory(){
    const items=mergeHistory();
    if(!items.length){
      historyList.innerHTML=`<div class="ask-note">저장한 질문이 없습니다. 본문에서 문장을 선택한 뒤 질문을 저장해 보세요.</div>`;
      return;
    }
    historyList.innerHTML=items.map(item=>`
      <div class="history-item" data-history-id="${attr(item.id)}">
        <button class="history-open" type="button">
          <div class="history-item__q">${esc(item.question||'')}</div>
          <div class="history-item__s">${esc(item.selected_text||'')}</div>
          <div class="history-item__time">${esc(item.created_at||'')}</div>
        </button>
        <button class="history-delete" type="button" aria-label="질문 삭제">삭제</button>
      </div>`).join('');

    $$('.history-item',historyList).forEach(card=>{
      const id=String(card.dataset.historyId||'');
      $('.history-open',card).addEventListener('click',()=>{
        const item=items.find(x=>String(x.id)===id);
        if(!item)return;
        setSelectedText(item.selected_text||'',false);
        input.value=item.question||'';
        setTab('write');
      });
      $('.history-delete',card).addEventListener('click',()=>deleteQuestion(id));
    });
  }

  async function refreshRemoteHistory(){
    syncState.textContent='Google Sheet와 동기화 중…';
    try{
      const res=await apiRpc('getQuestionHistory',{deviceId:state.deviceId});
      if(!res?.ok) throw new Error(res?.message||'동기화 실패');
      state.remoteHistory=Array.isArray(res.history)?res.history:[];
      syncState.textContent='Google Sheet와 동기화됨';
      renderHistory();
    }catch(e){
      syncState.textContent='이 기기 기록은 유지됩니다. Google Sheet 동기화는 현재 확인이 필요합니다.';
    }
  }

  async function saveRemote(item){
    try{
      const res=await apiRpc('saveQuestionHistory',{
        deviceId:state.deviceId,
        payload:{id:item.id,selectedText:item.selected_text,question:item.question}
      });
      if(res?.ok && res.item){
        state.remoteHistory=[res.item,...state.remoteHistory.filter(x=>x.id!==res.item.id)];
        renderHistory();
      }
    }catch(e){}
  }

  async function deleteQuestion(id){
    if(!id) return;
    writeLocalQuestions(readLocalQuestions().filter(item=>String(item.id)!==String(id)));
    state.remoteHistory=state.remoteHistory.filter(item=>String(item.id)!==String(id));
    renderHistory();
    try{ await apiRpc('deleteQuestionHistory',{deviceId:state.deviceId,id}); }catch(e){}
  }

  function saveQuestion(){
    const selected=state.selectedText.trim();
    const question=(input.value||'').trim();
    if(!selected || !question){
      saveBtn.textContent='문장·질문 확인';
      setTimeout(()=>saveBtn.textContent='질문 저장',1100);
      return;
    }

    const item={
      id:'q_'+Date.now()+'_'+Math.random().toString(36).slice(2,10),
      selected_text:selected,
      question,
      created_at:nowText(),
      updated_at:nowText()
    };
    saveLocalQuestion(item);
    state.used=true;
    fab.hidden=false;
    saveRemote(item);
    saveBtn.textContent='저장됨';
    setTimeout(()=>saveBtn.textContent='질문 저장',1000);
    renderHistory();
  }

  let selectTimer;
  function refreshSelection(){
    clearTimeout(selectTimer);
    selectTimer=setTimeout(()=>{
      if(!sheet.hidden) return;
      const info=currentSelection();
      if(info) showBubble(info);
    },420);
  }

  document.addEventListener('selectionchange',refreshSelection);
  document.addEventListener('mouseup',refreshSelection);
  document.addEventListener('touchend',refreshSelection,{passive:true});
  document.addEventListener('scroll',()=>{if(sheet.hidden)hideBubble()},{passive:true});

  bubble.addEventListener('click',()=>openSheet('write'));
  fab.addEventListener('click',()=>openSheet('history'));
  backdrop.addEventListener('click',minimizeSheet);
  minBtn.addEventListener('click',minimizeSheet);

  let dragStartY=0,dragY=0,dragging=false;
  const dragStart=(clientY)=>{dragging=true;dragStartY=clientY;dragY=0;sheet.classList.add('is-dragging');};
  const dragMove=(clientY)=>{
    if(!dragging)return;
    dragY=Math.max(0,clientY-dragStartY);
    sheet.style.transform=`translateY(${dragY}px)`;
    backdrop.style.background=`rgba(0,0,0,${Math.max(.08,.22-(dragY/900))})`;
  };
  const dragEnd=()=>{
    if(!dragging)return;
    dragging=false;sheet.classList.remove('is-dragging');backdrop.style.background='';
    const threshold=Math.min(150,window.innerHeight*.16);
    if(dragY>=threshold) minimizeSheet(); else sheet.style.transform='translateY(0)';
    dragY=0;
  };

  handleWrap.addEventListener('touchstart',e=>{if(e.touches?.length)dragStart(e.touches[0].clientY);},{passive:true});
  handleWrap.addEventListener('touchmove',e=>{if(!e.touches?.length)return;e.preventDefault();dragMove(e.touches[0].clientY);},{passive:false});
  handleWrap.addEventListener('touchend',dragEnd,{passive:true});
  handleWrap.addEventListener('touchcancel',dragEnd,{passive:true});
  handleWrap.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;handleWrap.setPointerCapture?.(e.pointerId);dragStart(e.clientY);});
  handleWrap.addEventListener('pointermove',e=>{if(!dragging||e.pointerType==='touch')return;dragMove(e.clientY);});
  handleWrap.addEventListener('pointerup',dragEnd);
  handleWrap.addEventListener('pointercancel',dragEnd);

  writeTab.addEventListener('click',()=>setTab('write'));
  historyTab.addEventListener('click',()=>setTab('history'));
  copyBtn.addEventListener('click',copyPrompt);
  saveBtn.addEventListener('click',saveQuestion);
  clearBtn.addEventListener('click',()=>{
    setSelectedText('',true);
    if(window.getSelection) window.getSelection().removeAllRanges();
    hideBubble();
  });

  copySyncKey.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(state.deviceId);
      copySyncKey.textContent='복사됨';
      setTimeout(()=>copySyncKey.textContent='동기화 키 복사',1000);
    }catch(e){}
  });

  changeSyncKey.addEventListener('click',()=>{
    const next=prompt('다른 기기에서 복사한 동기화 키를 붙여넣으세요.');
    if(!next)return;
    const key=String(next).trim();
    if(!/^dev_[a-f0-9]{48}$/.test(key)){
      syncState.textContent='동기화 키 형식이 맞지 않습니다.';
      return;
    }
    state.deviceId=key;
    localStorage.setItem(QUESTION_DEVICE_KEY,key);
    state.remoteHistory=[];
    refreshRemoteHistory();
  });

  ['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));
  let lastTouchEnd=0;
  document.addEventListener('touchend',e=>{
    const now=Date.now();
    if(now-lastTouchEnd<=280 && !e.target.closest('input,textarea')) e.preventDefault();
    lastTouchEnd=now;
  },{passive:false});

  renderHistory();
}

function fail(err){
  const boot=$('#boot');
  if(boot){
    boot.innerHTML=`<div class="content" style="padding-top:18vh"><div class="eyebrow">연결 오류</div><h2>Google Sheet 내용을 불러오지 못했습니다.</h2><p class="muted">${esc(err&&err.message?err.message:err)}</p><button onclick="location.reload()" style="border:0;background:var(--accent);color:#fff;padding:.75rem 1rem;border-radius:14px;font-weight:650">다시 불러오기</button></div>`;
  }
}

apiGetSiteData().then(renderApp).catch(fail);
