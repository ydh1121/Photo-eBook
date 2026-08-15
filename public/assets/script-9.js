/* v16: stable section transitions + front-aligned active chip */
(function(){
  function setupNavigationV16(){
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
    let activeChip=null;
    let pendingAlignChip=null;
    let progressMax=1;
    let measuredScrollHeight=0;
    let activeRaf=0;
    let progressRaf=0;
    let settleTimer=0;
    let layoutTimer=0;
    let clickUnlockTimer=0;
    let clickLockId='';
    let lastScrollAt=0;
    let lastProgress=-1;

    function scrollY(){
      return Math.max(0,Number(root.scrollTop)||0);
    }

    function measure(){
      const y=scrollY();
      metrics=sections.map(section=>({
        id:section.dataset.chapter,
        top:section.getBoundingClientRect().top+y
      })).sort((a,b)=>a.top-b.top);

      measuredScrollHeight=Number(root.scrollHeight)||0;
      progressMax=Math.max(1,measuredScrollHeight-(Number(root.clientHeight)||0));
    }

    function currentChapterAt(y){
      if(!metrics.length)return sections[0]?.dataset.chapter||'';
      const line=y+shell.offsetHeight+20;
      let lo=0;
      let hi=metrics.length-1;
      let answer=0;

      while(lo<=hi){
        const mid=(lo+hi)>>1;
        if(metrics[mid].top<=line){
          answer=mid;
          lo=mid+1;
        }else{
          hi=mid-1;
        }
      }
      return metrics[answer]?.id||metrics[0]?.id||'';
    }

    /* Put the active chip at the leading edge. Once the track reaches its
       maximum scroll position, later chips stay where they naturally fit. */
    function alignChipToFront(chip){
      if(!chip)return;
      const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
      const leadingInset=8;
      const wanted=Math.max(0,chip.offsetLeft-leadingInset);
      const next=Math.min(max,wanted);
      if(Math.abs(next-navScroll.scrollLeft)>1)navScroll.scrollLeft=next;
    }

    function setActiveChip(id,{align='idle'}={}){
      if(!id||id===activeId)return;
      const nextChip=chipMap.get(id);
      if(!nextChip)return;

      if(activeChip)activeChip.classList.remove('is-active');
      nextChip.classList.add('is-active');
      activeChip=nextChip;
      activeId=id;

      if(align==='now'){
        pendingAlignChip=null;
        alignChipToFront(nextChip);
      }else if(align==='idle'){
        pendingAlignChip=nextChip;
      }
    }

    /* ACTIVE CHIP: cached chapter coordinates only. No geometry reads while
       the finger is moving. */
    function updateActiveChip(){
      activeRaf=0;
      if(clickLockId){
        setActiveChip(clickLockId,{align:'none'});
        return;
      }
      setActiveChip(currentChapterAt(scrollY()),{align:'idle'});
    }

    function scheduleActiveChip(){
      if(activeRaf)return;
      activeRaf=requestAnimationFrame(updateActiveChip);
    }

    /* PROGRESS: independent page-wide ratio. */
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
        if(performance.now()-lastScrollAt<100){
          releaseClickLockWhenIdle();
          return;
        }
        clickLockId='';
        updateActiveChip();
      },120);
    }

    function settleAfterVerticalScroll(){
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<85){
          settleAfterVerticalScroll();
          return;
        }

        /* Horizontal navigation movement is deliberately delayed until the
           vertical gesture is idle. This prevents a sticky horizontal scroll
           from competing with Safari's vertical compositor at chapter edges. */
        if(pendingAlignChip){
          const chip=pendingAlignChip;
          pendingAlignChip=null;
          alignChipToFront(chip);
        }

        /* Dynamic content may change the total document height. Re-measure
           only after the gesture finishes, never at the chapter boundary. */
        const currentHeight=Number(root.scrollHeight)||0;
        if(Math.abs(currentHeight-measuredScrollHeight)>6){
          measure();
          updateActiveChip();
          updateProgress();
        }
      },105);
    }

    function onScroll(){
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
      setActiveChip(id,{align:'now'});

      const absoluteTop=target.getBoundingClientRect().top+scrollY();
      const destination=Math.max(0,absoluteTop-shell.offsetHeight+4);
      window.scrollTo({
        top:destination,
        behavior:reduceMotion()?'auto':'smooth'
      });
      releaseClickLockWhenIdle();
    }));

    function remeasureWhenIdle(delay=180){
      clearTimeout(layoutTimer);
      layoutTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<120){
          remeasureWhenIdle(150);
          return;
        }
        measure();
        updateActiveChip();
        updateProgress();
        if(activeChip)alignChipToFront(activeChip);
      },delay);
    }

    measure();
    setActiveChip(currentChapterAt(scrollY()),{align:'now'});
    updateProgress();
    addEventListener('scroll',onScroll,{passive:true});

    /* No ResizeObserver here: repeated size notifications near section
       boundaries were one of the remaining Safari jitter triggers. */
    if(document.fonts?.ready){
      document.fonts.ready.then(()=>remeasureWhenIdle(30)).catch(()=>{});
    }
    addEventListener('load',()=>remeasureWhenIdle(50),{once:true});
    addEventListener('pageshow',()=>remeasureWhenIdle(60),{passive:true});
    addEventListener('orientationchange',()=>remeasureWhenIdle(300),{passive:true});
    setTimeout(()=>remeasureWhenIdle(20),800);
    setTimeout(()=>remeasureWhenIdle(20),2400);
  }

  window.setupNavigation=setupNavigationV16;

  if(typeof window.__photoUiReadyResolve==='function'){
    window.__photoUiReadyResolve();
    window.__photoUiReadyResolve=null;
  }
})();
