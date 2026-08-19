/* v14: independent nav progress + active-chip state, stable question drawer */
(function(){
  function stableSetupNavigation(){
    const shell=$('.nav-shell');
    const placeholder=$('.nav-placeholder');
    const navScroll=$('.nav-scroll');
    const progress=$('.read-progress');
    const chips=$$('.nav-chip');
    const sections=$$('.chapter[data-chapter]');
    if(!shell||!navScroll||!chips.length||!sections.length)return;

    if(placeholder)placeholder.remove();

    let glass=$('.nav-glass',shell);
    if(!glass){
      glass=document.createElement('div');
      glass.className='nav-glass';
      shell.insertBefore(glass,navScroll);
      glass.appendChild(navScroll);
      if(progress)glass.appendChild(progress);
    }

    shell.classList.remove('is-compact','is-scrolled');

    const chipMap=new Map(chips.map(chip=>[chip.dataset.target,chip]));
    let activeId='';
    let activeRaf=0;
    let progressRaf=0;
    let horizontalTimer=0;

    /* Progress owns its own immutable range. It is never recalculated by
       active-chip changes, ResizeObserver callbacks or sticky geometry. */
    const progressStart=Math.max(0,glass.getBoundingClientRect().top+(window.scrollY||0));
    let progressEnd=Math.max(progressStart+1,document.documentElement.scrollHeight-document.documentElement.clientHeight);
    let lastProgress=-1;

    function keepChipVisible(chip){
      if(!chip)return;
      clearTimeout(horizontalTimer);
      horizontalTimer=setTimeout(()=>{
        const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
        const left=chip.offsetLeft;
        const right=left+chip.offsetWidth;
        const viewLeft=navScroll.scrollLeft+8;
        const viewRight=navScroll.scrollLeft+navScroll.clientWidth-8;
        let next=navScroll.scrollLeft;
        if(left<viewLeft)next=Math.max(0,left-8);
        else if(right>viewRight)next=Math.min(max,right-navScroll.clientWidth+8);
        if(Math.abs(next-navScroll.scrollLeft)>2)navScroll.scrollLeft=next;
      },55);
    }

    function setActiveChip(id,ensureVisible=true){
      if(!id||id===activeId)return;
      activeId=id;
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
      if(ensureVisible)keepChipVisible(chipMap.get(id));
    }

    /* ACTIVE CHIP FUNCTION — independent from progress. */
    function updateActiveChip(){
      activeRaf=0;
      const scanLine=shell.getBoundingClientRect().bottom+10;
      let current=sections[0]?.dataset.chapter||'';
      for(const section of sections){
        const rect=section.getBoundingClientRect();
        if(rect.top<=scanLine)current=section.dataset.chapter;
        else break;
      }
      setActiveChip(current,true);
    }

    function scheduleActiveChip(){
      if(activeRaf)return;
      activeRaf=requestAnimationFrame(updateActiveChip);
    }

    /* PROGRESS FUNCTION — independent from active chips. */
    function updateProgress(){
      progressRaf=0;
      const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
      const ratio=Math.max(0,Math.min(1,(y-progressStart)/Math.max(1,progressEnd-progressStart)));
      const percent=Math.round(ratio*1000)/10;
      if(Math.abs(percent-lastProgress)>=.1){
        lastProgress=percent;
        glass.style.setProperty('--progress-stop',`${percent}%`);
      }
    }

    function scheduleProgress(){
      if(progressRaf)return;
      progressRaf=requestAnimationFrame(updateProgress);
    }

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const target=document.getElementById(chip.dataset.target);
      if(!target)return;
      setActiveChip(chip.dataset.target,true);
      const top=target.getBoundingClientRect().top+(window.scrollY||0)-shell.offsetHeight-10;
      window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});
    }));

    updateActiveChip();
    updateProgress();
    addEventListener('scroll',scheduleActiveChip,{passive:true});
    addEventListener('scroll',scheduleProgress,{passive:true});

    /* Only a real layout-width/orientation change may define a new progress
       range. Safari's collapsing toolbar height changes are ignored. */
    let lastWidth=document.documentElement.clientWidth;
    let resizeTimer=0;
    function recalibrateForRealLayoutChange(){
      const width=document.documentElement.clientWidth;
      if(Math.abs(width-lastWidth)<2)return;
      lastWidth=width;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        progressEnd=Math.max(progressStart+1,document.documentElement.scrollHeight-document.documentElement.clientHeight);
        updateActiveChip();
        updateProgress();
      },180);
    }
    addEventListener('resize',recalibrateForRealLayoutChange,{passive:true});
    addEventListener('orientationchange',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        lastWidth=document.documentElement.clientWidth;
        progressEnd=Math.max(progressStart+1,document.documentElement.scrollHeight-document.documentElement.clientHeight);
        updateActiveChip();
        updateProgress();
      },280);
    },{passive:true});
  }

  window.setupNavigation=stableSetupNavigation;

  function enhanceQuestionDrawer(){
    const sheet=$('#askSheet');
    if(!sheet||sheet.dataset.v14==='true')return;
    sheet.dataset.v14='true';

    const top=$('.ask-sheet__top',sheet);
    const minBtn=$('#askMinimize');
    const writePanel=$('#askWritePanel');
    const historyPanel=$('#askHistoryPanel');
    const loginCard=$('.login-card',sheet);
    const note=$('.ask-note',sheet);
    const backdrop=$('#askBackdrop');
    if(!top||!minBtn||!writePanel||!historyPanel)return;

    if(note)note.textContent='질문을 저장해 두면 나중에 다시 열어볼 수 있습니다.';

    let actions=$('.ask-sheet__top-actions',top);
    if(!actions){
      actions=document.createElement('div');
      actions.className='ask-sheet__top-actions';
      top.appendChild(actions);
    }

    let settingsBtn=$('.ask-settings-btn',actions);
    if(!settingsBtn){
      settingsBtn=document.createElement('button');
      settingsBtn.type='button';
      settingsBtn.className='ask-settings-btn';
      settingsBtn.setAttribute('aria-label','질문함 설정');
      settingsBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"/><path d="M19.1 13.4a7.9 7.9 0 0 0 .1-1.4 7.9 7.9 0 0 0-.1-1.4l2-1.5-2-3.4-2.5 1a8.5 8.5 0 0 0-2.4-1.4L13.8 2h-4l-.4 3.3A8.5 8.5 0 0 0 7 6.7l-2.5-1-2 3.4 2 1.5a7.9 7.9 0 0 0-.1 1.4 7.9 7.9 0 0 0 .1 1.4l-2 1.5 2 3.4 2.5-1a8.5 8.5 0 0 0 2.4 1.4l.4 3.3h4l.4-3.3a8.5 8.5 0 0 0 2.4-1.4l2.5 1 2-3.4-2-1.5Z"/></svg>';
      actions.appendChild(settingsBtn);
    }
    actions.appendChild(minBtn);

    let settingsPanel=$('.ask-settings-panel',sheet);
    if(!settingsPanel){
      settingsPanel=document.createElement('div');
      settingsPanel.className='ask-settings-panel';
      settingsPanel.innerHTML='<div class="ask-settings-panel__head"><strong>기록 연결 설정</strong><button class="ask-settings-close" type="button" aria-label="설정 닫기">←</button></div><p class="ask-settings-panel__copy">휴대폰이나 PC를 바꿔도 저장한 질문을 이어서 볼 수 있습니다. 필요한 경우에만 연결하세요.</p>';
      sheet.appendChild(settingsPanel);
    }

    if(loginCard&&!settingsPanel.contains(loginCard)){
      const h4=$('h4',loginCard);
      const p=$('p',loginCard);
      if(h4)h4.textContent='다른 기기에서 이어보기';
      if(p)p.textContent='현재 기기의 저장 기록을 다른 기기에서도 이어서 보려면 연결 코드를 사용하세요.';
      const copy=$('#copySyncKey',loginCard);
      const change=$('#changeSyncKey',loginCard);
      if(copy)copy.textContent='연결 코드 복사';
      if(change)change.textContent='연결 코드 입력';
      settingsPanel.appendChild(loginCard);
    }

    const settingsClose=$('.ask-settings-close',settingsPanel);
    const closeSettings=()=>{
      sheet.classList.remove('is-settings-open');
      settingsBtn.classList.remove('is-active');
    };
    const openSettings=()=>{
      sheet.classList.add('is-settings-open');
      settingsBtn.classList.add('is-active');
    };
    settingsBtn.addEventListener('click',()=>sheet.classList.contains('is-settings-open')?closeSettings():openSettings());
    settingsClose?.addEventListener('click',closeSettings);
    $('#askWriteTab')?.addEventListener('click',closeSettings);
    $('#askHistoryTab')?.addEventListener('click',closeSettings);

    let locked=false;
    let lockedY=0;
    let oldScrollBehavior='';

    function lockDocument(){
      if(locked||sheet.hidden)return;
      locked=true;
      lockedY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
      oldScrollBehavior=document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior='auto';
      document.documentElement.classList.add('ask-modal-locked');
      document.body.classList.add('ask-modal-locked');
      document.body.style.top=`-${lockedY}px`;
    }

    function unlockDocument(){
      if(!locked)return;
      const restoreY=lockedY;
      locked=false;
      document.documentElement.classList.remove('ask-modal-locked');
      document.body.classList.remove('ask-modal-locked');
      document.body.style.top='';
      window.scrollTo(0,restoreY);
      requestAnimationFrame(()=>{document.documentElement.style.scrollBehavior=oldScrollBehavior;});
    }

    /* hidden is the single source of truth for modal open/closed state. */
    const modalObserver=new MutationObserver(()=>{
      if(sheet.hidden)unlockDocument();
      else lockDocument();
    });
    modalObserver.observe(sheet,{attributes:true,attributeFilter:['hidden']});
    if(!sheet.hidden)lockDocument();

    /* Prevent scroll chaining into the page. Only explicit internal scrollers
       (textarea, history carousel, settings) receive gesture scrolling. */
    backdrop?.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    sheet.addEventListener('touchmove',e=>{
      const allowed=e.target.closest('textarea,.history-list,.ask-settings-panel,.ask-sheet__handle-wrap');
      if(!allowed)e.preventDefault();
    },{passive:false});
  }

  const originalSetupQuestionDrawer=window.setupQuestionDrawer;
  if(typeof originalSetupQuestionDrawer==='function'){
    window.setupQuestionDrawer=function(){
      originalSetupQuestionDrawer();
      requestAnimationFrame(enhanceQuestionDrawer);
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhanceQuestionDrawer),{once:true});
  else requestAnimationFrame(enhanceQuestionDrawer);
})();
