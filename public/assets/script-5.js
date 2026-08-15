const QUESTION_STORE_KEY='photoRoadmapQuestionsV1';
const QUESTION_LOGIN_TOKEN_KEY='photoRoadmapQuestionTokenV1';
const QUESTION_LOGIN_EMAIL_KEY='photoRoadmapQuestionEmailV1';

function renderApp(data){
  window.__SITE_DATA=data;

  const navMap=new Map((data.nav||[]).map(n=>[n.id,n]));
  const order=['intro','market','education','skills','portfolio','gear','plan','scripts','iphone','sources'];

  const renderers={
    intro:introSection,
    market:marketSection,
    education:educationSection,
    skills:skillsSection,
    portfolio:portfolioSection,
    gear:gearSection,
    plan:planSection,
    scripts:scriptsSection,
    iphone:iphoneSection,
    sources:sourcesSection
  };

  const sections=order
    .filter(id=>navMap.has(id))
    .map((id,index)=>renderers[id](data,navMap.get(id),index))
    .join('');

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
  }catch(e){
    return [];
  }
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

function setupQuestionDrawer(){
  if($('#askLayer')) return;

  const layer=document.createElement('div');
  layer.id='askLayer';
  layer.innerHTML=`
    <button id="askBubble" class="ask-bubble" hidden>GPT에 질문</button>
    <button id="askFab" class="ask-fab" hidden>질문함</button>

    <div id="askBackdrop" class="ask-backdrop" hidden></div>

    <section id="askSheet" class="ask-sheet" hidden aria-label="질문함">
      <div id="askHandleWrap" class="ask-sheet__handle-wrap">
        <div id="askHandle" class="ask-sheet__handle"></div>
      </div>

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
        <div class="ask-note">OpenAI API를 사용하지 않습니다. 질문은 이 웹의 질문함에 저장되고, 필요할 때 프롬프트를 복사해 사용할 수 있습니다.</div>
      </div>

      <div id="askHistoryPanel" hidden>
        <div id="loginCard" class="login-card">
          <h4>질문 기록 동기화</h4>
          <p>이 기기에서는 로그인 없이 저장됩니다. 다른 기기에서도 보려면 이메일 인증으로 Google Sheet와 동기화하세요.</p>

          <div id="emailLoginStep">
            <div class="login-row">
              <input id="loginEmail" type="email" autocomplete="email" placeholder="이메일">
              <button id="sendCode" type="button">코드 받기</button>
            </div>
          </div>

          <div id="codeLoginStep" hidden style="margin-top:.55rem">
            <div class="login-row">
              <input id="loginCode" inputmode="numeric" maxlength="6" placeholder="6자리 코드">
              <button id="verifyCode" type="button">로그인</button>
            </div>
          </div>

          <div id="loginState" class="login-state"></div>
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
  const handle=$('#askHandle');
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

  const emailInput=$('#loginEmail');
  const codeInput=$('#loginCode');
  const sendCodeBtn=$('#sendCode');
  const verifyCodeBtn=$('#verifyCode');
  const codeStep=$('#codeLoginStep');
  const loginState=$('#loginState');

  const state={
    selectedText:'',
    used:readLocalQuestions().length>0,
    token:localStorage.getItem(QUESTION_LOGIN_TOKEN_KEY)||'',
    email:localStorage.getItem(QUESTION_LOGIN_EMAIL_KEY)||'',
    remoteHistory:[],
    pageScrollY:0
  };

  fab.hidden=!state.used;

  function blockBackgroundMove(e){
    if(sheet.hidden) return;
    if(sheet.contains(e.target)) return;
    e.preventDefault();
  }

  function lockPageScroll(){
    if(document.body.classList.contains('is-modal-open')) return;
    state.pageScrollY=window.scrollY||document.documentElement.scrollTop||0;
    document.body.classList.add('is-modal-open');

    document.addEventListener('touchmove',blockBackgroundMove,{passive:false,capture:true});
    document.addEventListener('wheel',blockBackgroundMove,{passive:false,capture:true});
  }

  function unlockPageScroll(){
    if(!document.body.classList.contains('is-modal-open')) return;
    document.body.classList.remove('is-modal-open');

    document.removeEventListener('touchmove',blockBackgroundMove,{capture:true});
    document.removeEventListener('wheel',blockBackgroundMove,{capture:true});

    /* Do not reset scrollTop here. Safari was visibly jumping to 0 then restoring. */
  }

  function clamp(v,min,max){
    return Math.min(max,Math.max(min,v));
  }

  function nowText(){
    return new Intl.DateTimeFormat('ko-KR',{
      year:'numeric',
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit'
    }).format(new Date());
  }

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

    if(resetQuestion){
      input.value=state.selectedText ? '이 부분을 쉽게 설명해줘.' : '';
    }
  }

  function hideBubble(){
    bubble.hidden=true;
  }

  function showBubble(info){
    setSelectedText(info.text,true);

    /* Place the custom bubble farther away from iOS's native selection menu. */
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

    if(history){
      renderHistory();
      refreshRemoteHistory();
    }
  }

  function openSheet(tab='write'){
    const info=currentSelection();
    if(info){
      setSelectedText(info.text,true);
    }

    hideBubble();

    if(window.getSelection){
      window.getSelection().removeAllRanges();
    }

    lockPageScroll();
    backdrop.hidden=false;
    sheet.hidden=false;
    sheet.style.transform='translateY(0)';
    fab.hidden=true;
    setTab(tab);

    if(tab==='write' && state.selectedText){
      setTimeout(()=>input.focus(),reduceMotion()?0:80);
    }
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
    if(!prompt){
      saveBtn.textContent='문장·질문 확인';
      setTimeout(()=>saveBtn.textContent='질문 저장',1000);
      return;
    }

    try{
      await navigator.clipboard.writeText(prompt);
      copyBtn.textContent='복사됨';
      setTimeout(()=>copyBtn.textContent='프롬프트 복사',1000);
    }catch(e){}
  }

  function mergeHistory(){
    const local=readLocalQuestions();
    const map=new Map();

    [...state.remoteHistory,...local].forEach(item=>{
      if(!item || !item.id) return;
      map.set(item.id,item);
    });

    return [...map.values()].sort((a,b)=>
      String(b.created_at||'').localeCompare(String(a.created_at||''))
    );
  }

  function renderHistory(){
    const items=mergeHistory();

    if(!items.length){
      historyList.innerHTML=`<div class="ask-note">저장한 질문이 없습니다. 본문에서 문장을 선택해 질문을 저장하면 여기에 쌓입니다.</div>`;
      return;
    }

    historyList.innerHTML=items.map(item=>`
      <div class="history-item" data-history-id="${attr(item.id)}">
        <button class="history-open" type="button">
          <div class="history-item__q">${esc(item.question||'')}</div>
          <div class="history-item__s">${esc(item.selected_text||item.selectedText||'')}</div>
          <div class="history-item__time">${esc(item.created_at||'')}</div>
        </button>
        <button class="history-delete" type="button" aria-label="질문 삭제">삭제</button>
      </div>
    `).join('');

    $$('.history-item',historyList).forEach(card=>{
      const id=String(card.dataset.historyId||'');

      $('.history-open',card).addEventListener('click',()=>{
        const item=items.find(x=>String(x.id)===id);
        if(!item)return;

        setSelectedText(item.selected_text||item.selectedText||'',false);
        input.value=item.question||'';
        setTab('write');
      });

      $('.history-delete',card).addEventListener('click',()=>{
        deleteQuestion(id);
      });
    });
  }

  function refreshRemoteHistory(){
    if(!state.token){
      loginState.textContent=state.email?`${state.email} 로그인 정보가 만료되었습니다.`:'로그인하지 않아도 이 기기의 기록은 유지됩니다.';
      return;
    }

    loginState.textContent='동기화 확인 중…';

    apiRpc('getQuestionHistory',{token:state.token})
      .then(res=>{
        if(!res || !res.ok){
          state.token='';
          localStorage.removeItem(QUESTION_LOGIN_TOKEN_KEY);
          loginState.textContent=res?.message||'로그인이 만료되었습니다.';
          return;
        }

        state.email=res.email||state.email;
        state.remoteHistory=Array.isArray(res.history)?res.history:[];
        loginState.textContent=`${state.email} · 동기화됨`;
        renderHistory();
      })
      .catch(()=>{
        loginState.textContent='동기화 상태를 확인하지 못했습니다.';
      });
  }

  function saveRemote(item){
    if(!state.token) return;

    apiRpc('saveQuestionHistory',{
      token:state.token,
      payload:{
        id:item.id,
        selectedText:item.selected_text,
        question:item.question
      }
    }).then(res=>{
      if(res?.ok && res.item){
        state.remoteHistory=[
          res.item,
          ...state.remoteHistory.filter(x=>x.id!==res.item.id)
        ];
        renderHistory();
      }
    }).catch(()=>{});
  }

  function deleteQuestion(id){
    if(!id) return;

    const nextLocal=readLocalQuestions().filter(item=>String(item.id)!==String(id));
    writeLocalQuestions(nextLocal);

    state.remoteHistory=state.remoteHistory.filter(item=>String(item.id)!==String(id));
    renderHistory();

    if(!state.token) return;

    apiRpc('deleteQuestionHistory',{token:state.token,id}).catch(()=>{});
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
      id:'local-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
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
      if(info){
        showBubble(info);
      }
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

  let dragStartY=0;
  let dragY=0;
  let dragging=false;

  function dragStart(clientY){
    dragging=true;
    dragStartY=clientY;
    dragY=0;
    sheet.classList.add('is-dragging');
  }

  function dragMove(clientY){
    if(!dragging) return;

    dragY=Math.max(0,clientY-dragStartY);
    sheet.style.transform=`translateY(${dragY}px)`;

    const opacity=Math.max(.08,.22-(dragY/900));
    backdrop.style.background=`rgba(0,0,0,${opacity})`;
  }

  function dragEnd(){
    if(!dragging) return;

    dragging=false;
    sheet.classList.remove('is-dragging');
    backdrop.style.background='';

    const threshold=Math.min(150,window.innerHeight*.16);

    if(dragY>=threshold){
      minimizeSheet();
    }else{
      sheet.style.transform='translateY(0)';
    }

    dragY=0;
  }

  handleWrap.addEventListener('touchstart',(e)=>{
    if(!e.touches?.length)return;
    dragStart(e.touches[0].clientY);
  },{passive:true});

  handleWrap.addEventListener('touchmove',(e)=>{
    if(!e.touches?.length)return;
    e.preventDefault();
    dragMove(e.touches[0].clientY);
  },{passive:false});

  handleWrap.addEventListener('touchend',dragEnd,{passive:true});
  handleWrap.addEventListener('touchcancel',dragEnd,{passive:true});

  handleWrap.addEventListener('pointerdown',(e)=>{
    if(e.pointerType==='touch')return;
    handleWrap.setPointerCapture?.(e.pointerId);
    dragStart(e.clientY);
  });

  handleWrap.addEventListener('pointermove',(e)=>{
    if(!dragging || e.pointerType==='touch')return;
    dragMove(e.clientY);
  });

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

  sendCodeBtn.addEventListener('click',()=>{
    const email=(emailInput.value||'').trim();

    if(!email){
      loginState.textContent='이메일을 입력해 주세요.';
      return;
    }

    sendCodeBtn.disabled=true;
    loginState.textContent='인증 코드 전송 중…';

    apiRpc('requestQuestionLoginCode',{email})
      .then(res=>{
        sendCodeBtn.disabled=false;

        if(!res?.ok){
          loginState.textContent=res?.message||'인증 코드를 보내지 못했습니다.';
          return;
        }

        state.email=email.toLowerCase();
        localStorage.setItem(QUESTION_LOGIN_EMAIL_KEY,state.email);
        codeStep.hidden=false;
        loginState.textContent='이메일로 보낸 6자리 코드를 입력해 주세요.';
        codeInput.focus();
      })
      .catch(()=>{
        sendCodeBtn.disabled=false;
        loginState.textContent='인증 코드를 보내지 못했습니다.';
      });
  });

  verifyCodeBtn.addEventListener('click',()=>{
    const email=(state.email||emailInput.value||'').trim();
    const code=(codeInput.value||'').trim();

    verifyCodeBtn.disabled=true;
    loginState.textContent='로그인 확인 중…';

    apiRpc('verifyQuestionLoginCode',{email,code})
      .then(res=>{
        verifyCodeBtn.disabled=false;

        if(!res?.ok){
          loginState.textContent=res?.message||'로그인하지 못했습니다.';
          return;
        }

        state.token=res.token;
        state.email=res.email;
        state.remoteHistory=Array.isArray(res.history)?res.history:[];

        localStorage.setItem(QUESTION_LOGIN_TOKEN_KEY,state.token);
        localStorage.setItem(QUESTION_LOGIN_EMAIL_KEY,state.email);

        loginState.textContent=`${state.email} · 동기화됨`;
        renderHistory();
      })
      .catch(()=>{
        verifyCodeBtn.disabled=false;
        loginState.textContent='로그인하지 못했습니다.';
      });
  });

  if(state.email){
    emailInput.value=state.email;
  }

  /* iOS/Safari zoom prevention. The viewport meta is also locked in Code.gs/Index.html. */
  ['gesturestart','gesturechange','gestureend'].forEach(type=>{
    document.addEventListener(type,e=>e.preventDefault(),{passive:false});
  });

  let lastTouchEnd=0;
  document.addEventListener('touchend',(e)=>{
    const now=Date.now();
    if(now-lastTouchEnd<=280 && !e.target.closest('input,textarea')){
      e.preventDefault();
    }
    lastTouchEnd=now;
  },{passive:false});

  renderHistory();
  refreshRemoteHistory();
}

function fail(err){
  const boot=$('#boot');

  if(boot){
    boot.innerHTML=`<div class="content" style="padding-top:18vh">
      <div class="eyebrow">연결 오류</div>
      <h2>시트 내용을 불러오지 못했습니다.</h2>
      <p class="muted">${esc(err&&err.message?err.message:err)}</p>
      <button onclick="location.reload()" style="border:0;background:var(--accent);color:#fff;padding:.75rem 1rem;border-radius:14px;font-weight:650">다시 불러오기</button>
    </div>`;
  }
}

apiGetSiteData()
  .then(renderApp)
  .catch(fail);
