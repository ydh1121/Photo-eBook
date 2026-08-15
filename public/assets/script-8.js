/* v13: stable nav state + question drawer behavior */
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
    let metrics=[];
    let maxScroll=1;
    let navStart=0;
    let active='';
    let raf=0;
    let lastProgress=-1;
    let resizeTimer=0;
    let horizontalTimer=0;

    function computeMetrics(){
      const y=window.scrollY||document.documentElement.scrollTop||0;
      navStart=shell.getBoundingClientRect().top+y;
      maxScroll=Math.max(navStart+1,document.documentElement.scrollHeight-window.innerHeight);
      metrics=sections.map(section=>({
        id:section.dataset.chapter,
        top:section.getBoundingClientRect().top+y
      })).sort((a,b)=>a.top-b.top);
    }

    function keepChipVisible(chip){
      if(!chip)return;
      clearTimeout(horizontalTimer);
      horizontalTimer=setTimeout(()=>{
        const left=chip.offsetLeft;
        const right=left+chip.offsetWidth;
        const viewLeft=navScroll.scrollLeft+8;
        const viewRight=navScroll.scrollLeft+navScroll.clientWidth-8;
        let next=navScroll.scrollLeft;
        if(left<viewLeft)next=Math.max(0,left-8);
        else if(right>viewRight)next=Math.min(navScroll.scrollWidth-navScroll.clientWidth,right-navScroll.clientWidth+8);
        if(Math.abs(next-navScroll.scrollLeft)>2)navScroll.scrollLeft=next;
      },70);
    }

    function setActive(id,ensureVisible=true){
      if(!id||id===active)return;
      active=id;
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
      if(ensureVisible)keepChipVisible(chipMap.get(id));
    }

    function activeAt(y){
      const line=y+shell.offsetHeight+18;
      let current=metrics[0]?.id||'';
      for(let i=0;i<metrics.length;i++){
        if(metrics[i].top<=line)current=metrics[i].id;
        else break;
      }
      return current;
    }

    function update(){
      raf=0;
      const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
      const denominator=Math.max(1,maxScroll-navStart);
      const ratio=Math.max(0,Math.min(1,(y-navStart)/denominator));
      const rounded=Math.round(ratio*500)/5;
      if(Math.abs(rounded-lastProgress)>=.2){
        lastProgress=rounded;
        glass.style.setProperty('--progress-stop',`${rounded}%`);
      }
      setActive(activeAt(y),true);
    }

    function schedule(){
      if(raf)return;
      raf=requestAnimationFrame(update);
    }

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const target=document.getElementById(chip.dataset.target);
      if(!target)return;
      setActive(chip.dataset.target,true);
      const top=target.getBoundingClientRect().top+window.scrollY-shell.offsetHeight-10;
      window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});
    }));

    computeMetrics();
    update();

    addEventListener('scroll',schedule,{passive:true});

    /* Ignore Safari toolbar height-only resizes. Re-measure only when layout width changes. */
    let lastWidth=document.documentElement.clientWidth;
    addEventListener('resize',()=>{
      const width=document.documentElement.clientWidth;
      if(Math.abs(width-lastWidth)<2)return;
      lastWidth=width;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{computeMetrics();update();},180);
    },{passive:true});

    addEventListener('orientationchange',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{computeMetrics();update();},260);
    },{passive:true});

    /* Lazy images and remote cards can change chapter offsets after first paint. */
    const app=$('#app');
    if(app&&'ResizeObserver' in window){
      const ro=new ResizeObserver(()=>{
        clearTimeout(resizeTimer);
        resizeTimer=setTimeout(()=>{computeMetrics();update();},220);
      });
      ro.observe(app);
    }
  }

  window.setupNavigation=stableSetupNavigation;

  function enhanceQuestionDrawer(){
    const sheet=$('#askSheet');
    if(!sheet||sheet.dataset.v13==='true')return;
    sheet.dataset.v13='true';

    const top=$('.ask-sheet__top',sheet);
    const minBtn=$('#askMinimize');
    const tabs=$('.ask-tabs',sheet);
    const writePanel=$('#askWritePanel');
    const historyPanel=$('#askHistoryPanel');
    const loginCard=$('.login-card',sheet);
    const note=$('.ask-note',sheet);
    const backdrop=$('#askBackdrop');
    if(!top||!minBtn||!tabs||!writePanel||!historyPanel)return;

    if(note)note.textContent='질문을 저장해 두면 나중에 다시 열어볼 수 있습니다.';

    let actions=$('.ask-sheet__top-actions',top);
    if(!actions){
      actions=document.createElement('div');
      actions.className='ask-sheet__top-actions';
      top.appendChild(actions);
    }

    const settingsBtn=document.createElement('button');
    settingsBtn.type='button';
    settingsBtn.className='ask-settings-btn';
    settingsBtn.setAttribute('aria-label','질문함 설정');
    settingsBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"/><path d="M19.1 13.4a7.9 7.9 0 0 0 .1-1.4 7.9 7.9 0 0 0-.1-1.4l2-1.5-2-3.4-2.5 1a8.5 8.5 0 0 0-2.4-1.4L13.8 2h-4l-.4 3.3A8.5 8.5 0 0 0 7 6.7l-2.5-1-2 3.4 2 1.5a7.9 7.9 0 0 0-.1 1.4 7.9 7.9 0 0 0 .1 1.4l-2 1.5 2 3.4 2.5-1a8.5 8.5 0 0 0 2.4 1.4l.4 3.3h4l.4-3.3a8.5 8.5 0 0 0 2.4-1.4l2.5 1 2-3.4-2-1.5Z"/></svg>';
    actions.appendChild(settingsBtn);
    actions.appendChild(minBtn);

    const settingsPanel=document.createElement('div');
    settingsPanel.className='ask-settings-panel';
    settingsPanel.innerHTML='<div class="ask-settings-panel__head"><strong>기록 연결 설정</strong><button class="ask-settings-close" type="button" aria-label="설정 닫기">←</button></div><p class="ask-settings-panel__copy">휴대폰이나 PC를 바꿔도 저장한 질문을 이어서 볼 수 있습니다. 필요한 경우에만 연결하세요.</p>';
    sheet.appendChild(settingsPanel);

    if(loginCard){
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
    function closeSettings(){
      sheet.classList.remove('is-settings-open');
      settingsBtn.classList.remove('is-active');
    }
    function openSettings(){
      sheet.classList.add('is-settings-open');
      settingsBtn.classList.add('is-active');
    }
    settingsBtn.addEventListener('click',()=>sheet.classList.contains('is-settings-open')?closeSettings():openSettings());
    settingsClose?.addEventListener('click',closeSettings);
    $('#askWriteTab')?.addEventListener('click',closeSettings);
    $('#askHistoryTab')?.addEventListener('click',closeSettings);

    let locked=false;
    let lockedY=0;
    let previousScrollBehavior='';

    function lockDocument(){
      if(locked)return;
      locked=true;
      lockedY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
      previousScrollBehavior=document.documentElement.style.scrollBehavior;
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
      document.body.style.left='';
      document.body.style.right='';
      document.body.style.width='';
      document.body.style.position='';
      window.scrollTo(0,restoreY);
      requestAnimationFrame(()=>{document.documentElement.style.scrollBehavior=previousScrollBehavior;});
    }

    const modalObserver=new MutationObserver(()=>{
      if(sheet.hidden)unlockDocument();
      else lockDocument();
    });
    modalObserver.observe(sheet,{attributes:true,attributeFilter:['hidden']});
    if(!sheet.hidden)lockDocument();

    backdrop?.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    sheet.addEventListener('touchmove',e=>{
      const allowed=e.target.closest('textarea,.history-list,.ask-settings-panel');
      if(!allowed&&!e.target.closest('.ask-sheet__handle-wrap'))e.preventDefault();
    },{passive:false});
  }

  const originalSetupQuestionDrawer=window.setupQuestionDrawer;
  if(typeof originalSetupQuestionDrawer==='function'){
    window.setupQuestionDrawer=function(){
      originalSetupQuestionDrawer();
      requestAnimationFrame(enhanceQuestionDrawer);
    };
  }

  /* Fallback if the drawer was already mounted before this file executed. */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhanceQuestionDrawer),{once:true});
  else requestAnimationFrame(enhanceQuestionDrawer);
})();
