/* v34: question actions, ChatGPT handoff, and collection swipe polish. */
(function(){
  if(window.__photoV34PolishInstalled)return;
  window.__photoV34PolishInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function waitFor(selector,timeout=18000){
    return new Promise(resolve=>{
      const found=$(selector);
      if(found)return resolve(found);
      const started=performance.now();
      const timer=setInterval(()=>{
        const node=$(selector);
        if(node||performance.now()-started>timeout){clearInterval(timer);resolve(node||null);}
      },80);
    });
  }

  function buildPromptFromDom(){
    const quote=String($('#askQuote')?.textContent||'').trim();
    const question=String($('#askInput')?.value||'').trim();
    const hasQuote=quote&&quote!=='문장을 선택하면 여기에 표시됩니다.';
    if(!question)return '';
    if(!hasQuote)return question;
    return `아래 선택 문장을 바탕으로 질문에 답해줘.\n\n선택 문장:\n"${quote}"\n\n질문:\n${question}`;
  }

  async function copyText(value){
    if(!value)return false;
    try{
      await navigator.clipboard.writeText(value);
      return true;
    }catch{
      try{
        const area=document.createElement('textarea');
        area.value=value;
        area.setAttribute('readonly','');
        area.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(area);
        area.select();
        const ok=document.execCommand('copy');
        area.remove();
        return ok;
      }catch{return false;}
    }
  }

  function platformStore(){
    const ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua)){
      return {label:'App Store',url:'https://apps.apple.com/app/openai-chatgpt/id6448311069'};
    }
    if(/Android/i.test(ua)){
      return {label:'Google Play',url:'https://play.google.com/store/apps/details?id=com.openai.chatgpt'};
    }
    return null;
  }

  function installQuestionActions(){
    const panel=$('#askWritePanel');
    if(!panel||panel.dataset.v34Actions==='true')return;
    panel.dataset.v34Actions='true';

    const actions=$('.ask-actions',panel);
    if(!actions)return;

    const wrap=document.createElement('div');
    wrap.className='v34-question-actions';
    wrap.innerHTML=`<button id="askOpenChatGPT" class="v34-chatgpt-open" type="button">ChatGPT 열기</button><a id="askInstallChatGPT" class="v34-chatgpt-install" target="_blank" rel="noopener">앱 받기</a>`;
    actions.insertAdjacentElement('afterend',wrap);

    const note=document.createElement('div');
    note.className='v34-gpt-note';
    note.textContent='ChatGPT 열기를 누르면 현재 질문을 복사한 뒤 새 창에서 이어서 사용할 수 있습니다.';
    wrap.insertAdjacentElement('afterend',note);

    const store=platformStore();
    const install=$('#askInstallChatGPT',panel);
    if(store&&install){
      install.href=store.url;
      install.textContent=store.label;
    }else if(install){
      install.hidden=true;
    }

    const open=$('#askOpenChatGPT',panel);
    open?.addEventListener('click',async()=>{
      const prompt=buildPromptFromDom();
      if(!prompt){
        note.textContent='질문 내용을 입력해 주세요.';
        note.classList.remove('is-success');
        return;
      }
      const copied=await copyText(prompt);
      note.textContent=copied?'프롬프트를 복사했습니다. ChatGPT에서 붙여넣어 이어서 질문할 수 있습니다.':'ChatGPT를 열었습니다. 질문 내용을 복사해 붙여넣어 주세요.';
      note.classList.toggle('is-success',copied);
      window.open('https://chatgpt.com/','_blank','noopener');
    });

    const originalNote=$('.ask-note',panel);
    if(originalNote)originalNote.textContent='질문을 저장해 두면 나중에 다시 열어보고, 복사하거나 ChatGPT에서 이어서 사용할 수 있습니다.';
  }

  function trashSvg(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 7.2h14.4M9.2 7.2V4.8h5.6v2.4M7.4 7.2l.7 11h7.8l.7-11M10 10.2v5.2M14 10.2v5.2"/></svg>';
  }

  function normalizeRemoveButtons(root=document){
    $$('.collection-item__remove',root).forEach(button=>{
      if(button.dataset.v34Remove==='true')return;
      button.dataset.v34Remove='true';
      button.innerHTML=trashSvg();
      button.setAttribute('aria-label','삭제');
      button.title='삭제';
    });
  }

  function closeOtherSwipeCards(except=null){
    $$('.collection-item.is-swipe-open').forEach(card=>{if(card!==except)card.classList.remove('is-swipe-open');});
  }

  function installSwipeDelete(){
    if(document.documentElement.dataset.v34Swipe==='true')return;
    document.documentElement.dataset.v34Swipe='true';

    let active=null;
    let startX=0;
    let startY=0;
    let horizontal=false;

    document.addEventListener('touchstart',event=>{
      const card=event.target.closest?.('.collection-item');
      if(!card||!event.touches?.length)return;
      active=card;
      startX=event.touches[0].clientX;
      startY=event.touches[0].clientY;
      horizontal=false;
      closeOtherSwipeCards(card);
    },{passive:true});

    document.addEventListener('touchmove',event=>{
      if(!active||!event.touches?.length)return;
      const dx=event.touches[0].clientX-startX;
      const dy=event.touches[0].clientY-startY;
      if(!horizontal&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.25)horizontal=true;
      if(!horizontal)return;
      if(event.cancelable)event.preventDefault();
      if(dx<-34)active.classList.add('is-swipe-open');
      else if(dx>18)active.classList.remove('is-swipe-open');
    },{passive:false});

    document.addEventListener('touchend',event=>{
      if(!active)return;
      active=null;
      horizontal=false;
    },{passive:true});

    document.addEventListener('click',event=>{
      const remove=event.target.closest?.('.collection-item__remove');
      if(remove){
        const card=remove.closest('.collection-item');
        card?.classList.remove('is-swipe-open');
        return;
      }
      const card=event.target.closest?.('.collection-item');
      if(!card)closeOtherSwipeCards();
    },true);
  }

  async function setupCollectionWatcher(){
    const body=await waitFor('#collectionBody');
    if(!body)return;
    normalizeRemoveButtons(body);
    const observer=new MutationObserver(()=>{
      normalizeRemoveButtons(body);
      installQuestionActions();
    });
    observer.observe(body,{childList:true,subtree:true});
  }

  async function init(){
    installSwipeDelete();
    const panel=await waitFor('#askWritePanel');
    if(panel)installQuestionActions();
    setupCollectionWatcher();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(()=>{
    installQuestionActions();
    normalizeRemoveButtons();
  },140),{passive:true});
})();
