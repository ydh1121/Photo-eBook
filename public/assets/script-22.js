/* v38: explicit spring feedback, question-rail self-heal, and deterministic platform CTA. */
(function(){
  if(window.__photoV38Installed)return;
  window.__photoV38Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const configs=[
    {root:'.nav-scroll',item:'.nav-chip',indicator:'.nav-v33-indicator'},
    {root:'.collection-tabs',item:'.collection-tab',indicator:'.collection-v33-indicator'},
    {root:'.theme-choice',item:'button',indicator:'.theme-v34-indicator'},
    {root:'.v32-question-segment',item:'button',indicator:'.v36-question-indicator'}
  ];
  const previousX=new WeakMap();

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function skinFor(indicator){
    if(!indicator)return null;
    let skin=indicator.querySelector(':scope > .v37-liquid-skin');
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return skin;
  }

  function spring(root,item,forcedDirection=0){
    if(!root||!item||reduced())return;
    const config=configs.find(entry=>root.matches(entry.root));
    if(!config)return;
    const indicator=$(config.indicator,root);
    const skin=skinFor(indicator);
    if(!skin||typeof skin.animate!=='function')return;

    const last=previousX.get(root);
    const next=item.offsetLeft;
    const direction=forcedDirection||Math.sign(next-(last==null?next:last))||1;
    previousX.set(root,next);

    skin.getAnimations().forEach(animation=>animation.cancel());
    skin.animate([
      {transform:'translate3d(0,0,0) scaleX(1) scaleY(1)',offset:0},
      {transform:`translate3d(${-direction*2.5}px,0,0) scaleX(.965) scaleY(1.018)`,offset:.16},
      {transform:`translate3d(${direction*6}px,0,0) scaleX(1.105) scaleY(.945)`,offset:.56},
      {transform:`translate3d(${-direction*2}px,0,0) scaleX(.986) scaleY(1.016)`,offset:.80},
      {transform:`translate3d(${direction*.7}px,0,0) scaleX(1.006) scaleY(.996)`,offset:.92},
      {transform:'translate3d(0,0,0) scaleX(1) scaleY(1)',offset:1}
    ],{
      duration:470,
      easing:'cubic-bezier(.18,.72,.18,1)'
    });
  }

  function ensureQuestionIndicator(){
    const root=$('.v32-question-segment');
    if(!root)return false;
    const active=$('button.is-active',root)||$('button',root);
    if(!active)return false;

    let indicator=$('.v36-question-indicator',root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className='v36-question-indicator';
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    skinFor(indicator);

    const w=active.offsetWidth;
    const h=active.offsetHeight;
    if(!w||!h)return false;
    indicator.style.width=w+'px';
    indicator.style.height=h+'px';
    indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    root.classList.add('v36-liquid-ready','v38-question-ready');
    previousX.set(root,active.offsetLeft);
    return true;
  }

  function setQuestionMode(hub,mode){
    if(!hub)return;
    const saved=mode==='saved';
    const write=hub.querySelector('.v32-question-write');
    const savedPanel=hub.querySelector('.v32-question-saved');
    const writeButton=hub.querySelector('[data-v32-qmode="write"]');
    const savedButton=hub.querySelector('[data-v32-qmode="saved"]');
    if(write)write.hidden=saved;
    if(savedPanel)savedPanel.hidden=!saved;
    writeButton?.classList.toggle('is-active',!saved);
    savedButton?.classList.toggle('is-active',saved);
    requestAnimationFrame(ensureQuestionIndicator);
  }

  function repairQuestionHub(){
    const activeTab=$('.collection-tab.is-active[data-library-tab="question"]');
    const body=$('#collectionBody');
    const askPanel=$('#askWritePanel');
    if(!activeTab||!body||!askPanel)return false;

    let hub=$('.v32-question-hub',body);
    if(!hub){
      const savedNodes=document.createDocumentFragment();
      while(body.firstChild)savedNodes.appendChild(body.firstChild);

      hub=document.createElement('div');
      hub.className='v32-question-hub';
      hub.innerHTML=`<div class="v32-question-segment" role="tablist" aria-label="질문 관리">
        <button type="button" data-v32-qmode="write">질문 작성</button>
        <button type="button" data-v32-qmode="saved" class="is-active">저장한 질문 <span>${readQuestions().length}</span></button>
      </div><div class="v32-question-write" hidden></div><div class="v32-question-saved"></div>`;
      body.appendChild(hub);
      hub.querySelector('.v32-question-write')?.appendChild(askPanel);
      hub.querySelector('.v32-question-saved')?.appendChild(savedNodes);
      const tools=$('#collectionTools');
      if(tools)tools.hidden=true;
    }

    const badge=hub.querySelector('[data-v32-qmode="saved"] span');
    if(badge)badge.textContent=String(readQuestions().length);
    requestAnimationFrame(ensureQuestionIndicator);
    return true;
  }

  function refreshQuestionUi(){
    const delays=[0,50,140,320,650];
    delays.forEach(delay=>setTimeout(()=>{
      if(!ensureQuestionIndicator())repairQuestionHub();
      ensureQuestionIndicator();
    },delay));
  }

  function icon(kind){
    if(kind==='play'){
      return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.7 3.8 19 12 4.7 20.2V3.8Z" fill="currentColor"/></svg></span>';
    }
    if(kind==='store'){
      return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.1 16.7 12 9.8l3.9 6.9M9.2 14.7h5.6M10.5 7.1l1.5 2.7 1.5-2.7" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    }
    return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.8 12h16.4M12 3.4c2.2 2.5 3.3 5.4 3.3 8.6S14.2 18.1 12 20.6M12 3.4C9.8 5.9 8.7 8.8 8.7 12s1.1 6.1 3.3 8.6" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg></span>';
  }

  function platformTarget(){
    const ua=navigator.userAgent||'';
    const standalone=window.matchMedia?.('(display-mode: standalone)').matches===true||navigator.standalone===true;
    if(!standalone){
      return {kind:'web',label:'ChatGPT Web',href:'https://chatgpt.com/'};
    }
    if(/Android/i.test(ua)){
      return {kind:'play',label:'Google Play',href:'https://play.google.com/store/apps/details?id=com.openai.chatgpt'};
    }
    if(/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
      return {kind:'store',label:'App Store',href:'https://apps.apple.com/app/openai-chatgpt/id6448311069'};
    }
    return {kind:'web',label:'ChatGPT Web',href:'https://chatgpt.com/'};
  }

  function polishActions(){
    const open=$('#askOpenChatGPT');
    const targetButton=$('#askInstallChatGPT');
    if(!open&&!targetButton)return false;

    if(open){
      open.innerHTML=icon('web')+'<span>ChatGPT 열기</span>';
      open.dataset.v38Platform='web';
    }
    if(targetButton){
      const target=platformTarget();
      targetButton.hidden=false;
      targetButton.href=target.href;
      targetButton.innerHTML=icon(target.kind)+`<span>${target.label}</span>`;
      targetButton.dataset.v38Platform=target.kind;
    }
    return true;
  }

  function refreshActions(){
    [0,60,160,360,720].forEach(delay=>setTimeout(polishActions,delay));
  }

  document.addEventListener('pointerdown',event=>{
    const item=configs.map(config=>event.target.closest?.(config.item)).find(Boolean);
    if(!item)return;
    const config=configs.find(entry=>item.closest(entry.root));
    const root=config?item.closest(config.root):null;
    if(!root)return;
    const active=$(`${config.item}.is-active`,root);
    if(active)previousX.set(root,active.offsetLeft);
  },{passive:true,capture:true});

  document.addEventListener('click',event=>{
    const hit=configs.map(config=>({config,item:event.target.closest?.(config.item)})).find(entry=>entry.item&&entry.item.closest(entry.config.root));
    if(hit){
      const root=hit.item.closest(hit.config.root);
      const old=previousX.get(root);
      const direction=Math.sign(hit.item.offsetLeft-(old==null?hit.item.offsetLeft:old))||1;
      setTimeout(()=>spring(root,hit.item,direction),34);
    }

    const qmode=event.target.closest?.('[data-v32-qmode]');
    if(qmode){
      const hub=qmode.closest('.v32-question-hub');
      setQuestionMode(hub,qmode.dataset.v32Qmode||'write');
      refreshQuestionUi();
    }

    if(event.target.closest?.('#collectionFab,.collection-tab[data-library-tab="question"]')){
      refreshQuestionUi();
      refreshActions();
    }
    if(event.target.closest?.('#askSave')){
      refreshQuestionUi();
    }
  },true);

  window.addEventListener('photo-theme-change',()=>{
    requestAnimationFrame(ensureQuestionIndicator);
  });
  window.addEventListener('pageshow',()=>{
    refreshQuestionUi();
    refreshActions();
  },{passive:true});

  function init(){
    refreshQuestionUi();
    refreshActions();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
