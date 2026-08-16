/* v41: one liquid settle, stable question controls, persistent bulk affordances, and reliable ChatGPT handoff. */
(function(){
  if(window.__photoV41Installed)return;
  window.__photoV41Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const bounceTimers=new WeakMap();
  let repairRaf=0;

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function copyText(value){
    if(!value)return Promise.resolve(false);
    if(navigator.clipboard?.writeText){
      return navigator.clipboard.writeText(value).then(()=>true).catch(()=>legacyCopy(value));
    }
    return Promise.resolve(legacyCopy(value));
  }

  function legacyCopy(value){
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

  function buildPrompt(){
    const quote=String($('#askQuote')?.textContent||'').trim();
    const question=String($('#askInput')?.value||'').trim();
    if(!question)return '';
    if(!quote||quote==='문장을 선택하면 여기에 표시됩니다.')return question;
    return `아래 선택 문장을 바탕으로 질문에 답해줘.\n\n선택 문장:\n"${quote}"\n\n질문:\n${question}`;
  }

  function indicatorSpec(root){
    if(root?.matches('.nav-scroll'))return {indicator:'.nav-v33-indicator',active:'.nav-chip.is-active',ready:'v33-liquid-ready',duration:d=>clamp(245+d*.10,255,380)};
    if(root?.matches('.collection-tabs'))return {indicator:'.collection-v33-indicator',active:'.collection-tab.is-active',ready:'v33-liquid-ready',duration:d=>clamp(300+d*.18,320,470)};
    if(root?.matches('.theme-choice'))return {indicator:'.theme-v34-indicator',active:'button.is-active',ready:'v34-liquid-ready',duration:d=>clamp(300+d*.18,320,470)};
    if(root?.matches('.v32-question-segment'))return {indicator:'.v36-question-indicator',active:'button.is-active',ready:'v36-liquid-ready',duration:()=>340};
    return null;
  }

  function ensureSkin(root){
    const spec=indicatorSpec(root);
    if(!root||!spec)return false;
    const indicators=$$(spec.indicator,root);
    indicators.slice(1).forEach(node=>node.remove());
    const indicator=indicators[0];
    if(!indicator)return false;
    let skin=$(':scope > .v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    root.classList.add('v41-skin-ready','v39-liquid-ready',spec.ready);

    const active=$(spec.active,root);
    if(active&&(!indicator.offsetWidth||!indicator.offsetHeight||indicator.dataset.v41Measured!=='true')){
      const w=active.offsetWidth,h=active.offsetHeight,x=active.offsetLeft,y=active.offsetTop;
      if(w&&h){
        indicator.style.width=w+'px';
        indicator.style.height=h+'px';
        indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
        indicator.dataset.x=String(x);
        indicator.dataset.y=String(y);
        indicator.dataset.w=String(w);
        indicator.dataset.h=String(h);
        indicator.dataset.ready='true';
        indicator.dataset.v41Measured='true';
      }
    }
    return true;
  }

  function repairSkins(){
    const roots=[
      $('.nav-scroll'),
      $('.collection-tabs'),
      $('.theme-choice'),
      $('#v40QuestionControls .v32-question-segment')||$('.v32-question-segment')
    ].filter(Boolean);
    roots.forEach(ensureSkin);
  }

  function moveV40QuestionIndicator(chip){
    const root=chip?.closest?.('.v32-question-segment');
    if(!root||!chip.matches('[data-v40-qmode]'))return false;
    let indicator=$('.v36-question-indicator',root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className='v36-question-indicator';
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    ensureSkin(root);

    const active=$('button.is-active',root)||chip;
    const oldX=Number(indicator.dataset.x||active.offsetLeft||0);
    const oldY=Number(indicator.dataset.y||active.offsetTop||0);
    const oldW=Number(indicator.dataset.w||active.offsetWidth||chip.offsetWidth||1);
    const oldH=Number(indicator.dataset.h||active.offsetHeight||chip.offsetHeight||1);
    const tx=chip.offsetLeft,ty=chip.offsetTop,tw=chip.offsetWidth,th=chip.offsetHeight;
    if(!tw||!th)return true;

    const dx=tx-oldX;
    const direction=Math.sign(dx)||1;
    const distance=Math.abs(dx);
    const overshoot=direction*clamp(distance*.022,2.2,5.8);
    const duration=clamp(300+distance*.16,330,430);

    indicator.dataset.x=String(tx);
    indicator.dataset.y=String(ty);
    indicator.dataset.w=String(tw);
    indicator.dataset.h=String(th);
    indicator.dataset.ready='true';
    indicator.dataset.v41Measured='true';
    indicator.style.width=tw+'px';
    indicator.style.height=th+'px';
    indicator.style.transform=`translate3d(${tx}px,${ty}px,0)`;

    if(typeof indicator.animate==='function'&&distance>.5){
      indicator.getAnimations().forEach(animation=>animation.cancel());
      indicator.animate([
        {transform:`translate3d(${oldX}px,${oldY}px,0) scaleX(${oldW/Math.max(1,tw)}) scaleY(${oldH/Math.max(1,th)})`,offset:0},
        {transform:`translate3d(${tx+overshoot}px,${ty}px,0) scaleX(1.018) scaleY(.992)`,offset:.82},
        {transform:`translate3d(${tx-direction*.75}px,${ty}px,0) scaleX(.998) scaleY(1.002)`,offset:.94},
        {transform:`translate3d(${tx}px,${ty}px,0) scaleX(1) scaleY(1)`,offset:1}
      ],{duration,easing:'cubic-bezier(.18,.76,.18,1)'});
    }
    return true;
  }

  function scheduleBounce(chip){
    const root=chip?.closest?.('.nav-scroll,.collection-tabs,.theme-choice,.v32-question-segment');
    const spec=indicatorSpec(root);
    if(!root||!spec)return;
    const current=$(spec.active,root);
    const oldX=current?.offsetLeft??chip.offsetLeft;
    const dx=chip.offsetLeft-oldX;
    if(Math.abs(dx)<1)return;
    clearTimeout(bounceTimers.get(root));
    const travel=spec.duration(Math.abs(dx));
    const timer=setTimeout(()=>{
      if(!chip.isConnected||!chip.classList.contains('is-active'))return;
      ensureSkin(root);
      const indicator=$(spec.indicator,root);
      if(!indicator||typeof indicator.animate!=='function')return;
      const tx=chip.offsetLeft,ty=chip.offsetTop;
      const direction=Math.sign(dx)||1;
      const overshoot=direction*clamp(Math.abs(dx)*.018,2.1,5.4);
      indicator.getAnimations().forEach(animation=>animation.cancel());
      indicator.animate([
        {transform:`translate3d(${tx}px,${ty}px,0) scaleX(1) scaleY(1)`,offset:0},
        {transform:`translate3d(${tx+overshoot}px,${ty}px,0) scaleX(1.012) scaleY(.994)`,offset:.42},
        {transform:`translate3d(${tx-direction*.7}px,${ty}px,0) scaleX(.998) scaleY(1.002)`,offset:.78},
        {transform:`translate3d(${tx}px,${ty}px,0) scaleX(1) scaleY(1)`,offset:1}
      ],{duration:185,easing:'cubic-bezier(.18,.78,.18,1)'});
    },travel+8);
    bounceTimers.set(root,timer);
  }

  function parking(){
    let node=$('#v41QuestionParking');
    if(!node){
      node=document.createElement('div');
      node.id='v41QuestionParking';
      node.hidden=true;
      document.body.appendChild(node);
    }
    return node;
  }

  function currentQuestionMode(){
    const active=$('#v40QuestionControls [data-v40-qmode].is-active');
    return active?.dataset.v40Qmode==='write'?'write':'saved';
  }

  function stripLegacyQuestionHubs(){
    const body=$('#collectionBody');
    if(!body)return;
    $$('.v32-question-hub',body).forEach(hub=>{
      const panel=$('#askWritePanel',hub);
      if(panel)parking().appendChild(panel);
      const saved=$('.v32-question-saved',hub);
      const keep=currentQuestionMode()==='saved'&&saved?[...saved.childNodes]:[];
      hub.remove();
      keep.forEach(node=>body.appendChild(node));
    });
  }

  function moveQuestionControlsIntoTools(){
    const tools=$('#collectionTools');
    const controls=$('#v40QuestionControls');
    const questionActive=Boolean($('.collection-tab.is-active[data-library-tab="question"]'));
    if(!tools)return;

    if(questionActive){
      tools.hidden=false;
      tools.style.display='grid';
      const search=$('.collection-search',tools);
      if(search){search.hidden=false;search.style.display='flex';}
      const filters=$('#collectionFilters',tools);
      if(filters)filters.hidden=true;
      if(controls){
        if(controls.parentNode!==tools)tools.appendChild(controls);
        controls.hidden=false;
      }
    }else if(controls){
      controls.hidden=true;
    }
  }

  function dedupeQuestionControls(){
    const controls=$$('[id="v40QuestionControls"]');
    controls.slice(1).forEach(node=>node.remove());
    const root=$('#v40QuestionControls .v32-question-segment');
    if(root){
      $$('.v36-question-indicator',root).slice(1).forEach(node=>node.remove());
      ensureSkin(root);
    }
  }

  function rewriteQuestionOpenButtons(){
    $$('.collection-question-open').forEach(button=>{
      button.classList.remove('collection-question-open');
      button.classList.add('v41-question-open');
    });
  }

  function bulkActive(){
    const toggle=$('.collection-select-toggle');
    return Boolean(toggle&&(toggle.classList.contains('is-active')||toggle.textContent.trim()==='완료'));
  }

  function ensureBulkBoxes(){
    const body=$('#collectionBody');
    if(!body||!bulkActive())return;
    body.classList.add('is-bulk-selecting');
    $$('.collection-item',body).forEach(card=>{
      if($('.collection-selectbox',card))return;
      const box=document.createElement('button');
      box.type='button';
      box.className='collection-selectbox';
      box.setAttribute('aria-label','항목 선택');
      box.setAttribute('aria-pressed','false');
      card.prepend(box);
    });
  }

  function loadSavedQuestion(id){
    const item=readQuestions().find(row=>String(row?.id||'')===String(id||''));
    if(!item)return;
    const write=$('#v40QuestionControls [data-v40-qmode="write"]');
    if(write&&!write.classList.contains('is-active'))write.click();
    setTimeout(()=>{
      const quote=$('#askQuote');
      const input=$('#askInput');
      if(quote){
        quote.textContent=String(item.selected_text||item.selection||item.quote||'문장을 선택하면 여기에 표시됩니다.');
      }
      if(input){
        input.value=String(item.question||item.prompt||'');
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      const body=$('#collectionBody');
      if(body)body.scrollTop=0;
    },70);
  }

  function openChatGPTReliably(event){
    const button=event.target.closest?.('#askOpenChatGPT');
    if(!button)return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const prompt=buildPrompt();
    const note=$('.v34-gpt-note');
    if(!prompt){
      if(note)note.textContent='질문 내용을 입력해 주세요.';
      return true;
    }

    const next=window.open('https://chatgpt.com/','_blank');
    copyText(prompt).then(ok=>{
      if(note)note.textContent=ok?'질문을 복사했습니다. 열린 ChatGPT 창에 붙여넣어 이어서 사용할 수 있습니다.':'ChatGPT를 열었습니다. 질문을 복사해 붙여넣어 주세요.';
    });
    if(!next&&note)note.textContent='새 창이 차단되었습니다. 브라우저의 팝업 허용 후 다시 눌러 주세요.';
    return true;
  }

  function repairCollection(){
    stripLegacyQuestionHubs();
    dedupeQuestionControls();
    moveQuestionControlsIntoTools();
    rewriteQuestionOpenButtons();
    ensureBulkBoxes();
    repairSkins();
  }

  function scheduleRepair(){
    if(repairRaf)return;
    repairRaf=requestAnimationFrame(()=>{
      repairRaf=0;
      repairCollection();
    });
  }

  function bindSheetObserver(){
    const sheet=$('#collectionSheet');
    if(!sheet||sheet.dataset.v41Observed==='true')return;
    sheet.dataset.v41Observed='true';
    const observer=new MutationObserver(()=>scheduleRepair());
    observer.observe(sheet,{childList:true,subtree:true});
  }

  document.addEventListener('click',event=>{
    const liquid=event.target.closest?.('.nav-chip,.collection-tab,.theme-choice button,.v32-question-segment button');
    if(liquid){
      if(!moveV40QuestionIndicator(liquid))scheduleBounce(liquid);
    }

    if(openChatGPTReliably(event))return;

    const saved=event.target.closest?.('.v41-question-open');
    if(saved){
      event.preventDefault();
      event.stopImmediatePropagation();
      const id=saved.closest('.collection-item')?.dataset.libraryId||'';
      loadSavedQuestion(id);
      return;
    }

    if(event.target.closest?.('.collection-filter')){
      setTimeout(()=>{ensureBulkBoxes();repairSkins();},0);
      setTimeout(()=>{ensureBulkBoxes();repairSkins();},70);
    }

    if(event.target.closest?.('.collection-select-toggle')){
      setTimeout(()=>{ensureBulkBoxes();scheduleRepair();},0);
      setTimeout(()=>{ensureBulkBoxes();scheduleRepair();},80);
    }

    if(event.target.closest?.('.collection-tab,#collectionFab,[data-v40-qmode]')){
      [0,40,110,240].forEach(delay=>setTimeout(scheduleRepair,delay));
    }
  },true);

  document.addEventListener('input',event=>{
    if(event.target?.matches?.('#collectionSearch'))setTimeout(()=>{ensureBulkBoxes();rewriteQuestionOpenButtons();},0);
  },{passive:true});

  function init(){
    bindSheetObserver();
    repairCollection();
    [80,220,520,1200].forEach(delay=>setTimeout(()=>{bindSheetObserver();repairCollection();},delay));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(init,120),{passive:true});
  window.addEventListener('photo-theme-change',()=>requestAnimationFrame(repairSkins));
})();
