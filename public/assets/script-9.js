/* v17: chapter-boundary jitter isolation */
(function(){
  function setupNavigationV17(){
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

    const root=document.scrollingElement||document.documentElement;
    const chipMap=new Map(chips.map(chip=>[chip.dataset.target,chip]));

    let metrics=[];
    let activeId='';
    let activeIndex=0;
    let activeChip=null;
    let pendingAlignChip=null;
    let progressMax=1;
    let measuredScrollHeight=0;
    let navHeight=76;
    let activeRaf=0;
    let progressRaf=0;
    let settleTimer=0;
    let layoutTimer=0;
    let clickUnlockTimer=0;
    let clickLockId='';
    let lastScrollAt=0;
    let lastProgress=-1;
    let lastY=0;
    let direction=1;

    /* A small dead band prevents Safari's fractional scroll / toolbar motion
       from flipping the active chapter back and forth at one exact boundary. */
    const ENTER_DOWN=14;
    const LEAVE_UP=14;

    function scrollY(){
      return Math.max(0,Number(root.scrollTop)||0);
    }

    function measure(){
      const y=scrollY();
      navHeight=Math.max(1,Math.round(shell.getBoundingClientRect().height||76));
      metrics=sections.map(section=>({
        id:section.dataset.chapter,
        top:Math.round(section.getBoundingClientRect().top+y)
      })).sort((a,b)=>a.top-b.top);

      measuredScrollHeight=Number(root.scrollHeight)||0;
      progressMax=Math.max(1,measuredScrollHeight-(Number(root.clientHeight)||0));

      if(activeId){
        const idx=metrics.findIndex(item=>item.id===activeId);
        if(idx>=0)activeIndex=idx;
      }
    }

    function rawIndexAt(y){
      if(!metrics.length)return 0;
      const line=y+navHeight+20;
      let lo=0;
      let hi=metrics.length-1;
      let answer=0;
      while(lo<=hi){
        const mid=(lo+hi)>>1;
        if(metrics[mid].top<=line){
          answer=mid;
          lo=mid+1;
        }else hi=mid-1;
      }
      return answer;
    }

    function stableIndexAt(y){
      if(!metrics.length)return 0;
      if(!activeId)return rawIndexAt(y);

      let idx=Math.max(0,Math.min(activeIndex,metrics.length-1));
      const line=y+navHeight+20;

      if(direction>=0){
        while(idx<metrics.length-1 && line>=metrics[idx+1].top+ENTER_DOWN)idx++;
      }else{
        while(idx>0 && line<metrics[idx].top-LEAVE_UP)idx--;
      }
      return idx;
    }

    function alignChipToFront(chip){
      if(!chip)return;
      const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
      const leadingInset=8;
      const wanted=Math.max(0,chip.offsetLeft-leadingInset);
      const next=Math.min(max,wanted);
      if(Math.abs(next-navScroll.scrollLeft)>1)navScroll.scrollLeft=next;
    }

    function setActiveChip(id,{align='idle'}={}){
      if(!id||id===activeId)return false;
      const nextChip=chipMap.get(id);
      if(!nextChip)return false;

      if(activeChip)activeChip.classList.remove('is-active');
      nextChip.classList.add('is-active');
      activeChip=nextChip;
      activeId=id;
      const idx=metrics.findIndex(item=>item.id===id);
      if(idx>=0)activeIndex=idx;

      if(align==='now'){
        pendingAlignChip=null;
        alignChipToFront(nextChip);
      }else if(align==='idle'){
        pendingAlignChip=nextChip;
      }
      return true;
    }

    /* ACTIVE CHIP: no DOM geometry reads during the vertical gesture. */
    function updateActiveChip(){
      activeRaf=0;
      if(clickLockId){
        setActiveChip(clickLockId,{align:'none'});
        return;
      }
      const idx=stableIndexAt(scrollY());
      setActiveChip(metrics[idx]?.id||metrics[0]?.id||'',{align:'idle'});
    }

    function scheduleActiveChip(){
      if(activeRaf)return;
      activeRaf=requestAnimationFrame(updateActiveChip);
    }

    /* PROGRESS remains completely independent of chapter state. */
    function updateProgress(){
      progressRaf=0;
      const ratio=Math.max(0,Math.min(1,scrollY()/Math.max(1,progressMax)));
      if(Math.abs(ratio-lastProgress)<0.0005)return;
      lastProgress=ratio;
      glass.style.setProperty('--progress-scale',ratio.toFixed(5));
    }

    function scheduleProgress(){
      if(progressRaf)return;
      progressRaf=requestAnimationFrame(updateProgress);
    }

    function releaseClickLockWhenIdle(){
      clearTimeout(clickUnlockTimer);
      clickUnlockTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<110){
          releaseClickLockWhenIdle();
          return;
        }
        clickLockId='';
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{align:'none'});
      },130);
    }

    function settleAfterVerticalScroll(){
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<100){
          settleAfterVerticalScroll();
          return;
        }

        /* Horizontal movement happens only after vertical scrolling is idle. */
        if(pendingAlignChip){
          const chip=pendingAlignChip;
          pendingAlignChip=null;
          alignChipToFront(chip);
        }

        const currentHeight=Number(root.scrollHeight)||0;
        if(Math.abs(currentHeight-measuredScrollHeight)>8){
          measure();
          activeIndex=rawIndexAt(scrollY());
          setActiveChip(metrics[activeIndex]?.id||'',{align:'none'});
          updateProgress();
        }
      },125);
    }

    function onScroll(){
      const y=scrollY();
      const delta=y-lastY;
      if(Math.abs(delta)>.5)direction=delta>0?1:-1;
      lastY=y;
      lastScrollAt=performance.now();
      scheduleProgress();
      scheduleActiveChip();
      settleAfterVerticalScroll();
      if(clickLockId)releaseClickLockWhenIdle();
    }

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const id=chip.dataset.target;
      const target=document.getElementById(id);
      if(!id||!target)return;

      measure();
      clickLockId=id;
      const idx=metrics.findIndex(item=>item.id===id);
      if(idx>=0)activeIndex=idx;
      setActiveChip(id,{align:'now'});

      const absoluteTop=target.getBoundingClientRect().top+scrollY();
      const destination=Math.max(0,absoluteTop-navHeight+4);
      window.scrollTo({top:destination,behavior:reduceMotion()?'auto':'smooth'});
      releaseClickLockWhenIdle();
    }));

    function remeasureWhenIdle(delay=180){
      clearTimeout(layoutTimer);
      layoutTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<130){
          remeasureWhenIdle(160);
          return;
        }
        measure();
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{align:'none'});
        updateProgress();
      },delay);
    }

    measure();
    lastY=scrollY();
    activeIndex=rawIndexAt(lastY);
    setActiveChip(metrics[activeIndex]?.id||metrics[0]?.id||'',{align:'now'});
    updateProgress();
    addEventListener('scroll',onScroll,{passive:true});

    if(document.fonts?.ready){
      document.fonts.ready.then(()=>remeasureWhenIdle(30)).catch(()=>{});
    }
    addEventListener('load',()=>remeasureWhenIdle(60),{once:true});
    addEventListener('pageshow',()=>remeasureWhenIdle(70),{passive:true});
    addEventListener('orientationchange',()=>remeasureWhenIdle(320),{passive:true});
    setTimeout(()=>remeasureWhenIdle(20),900);
    setTimeout(()=>remeasureWhenIdle(20),2600);
  }

  window.setupNavigation=setupNavigationV17;

  if(typeof window.__photoUiReadyResolve==='function'){
    window.__photoUiReadyResolve();
    window.__photoUiReadyResolve=null;
  }
})();
