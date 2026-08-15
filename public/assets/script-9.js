/* v18: no competing work while vertical scrolling */
(function(){
  function setupNavigationV18(){
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
    let navHeight=76;
    let activeRaf=0;
    let progressRaf=0;
    let fallbackScrollEndTimer=0;
    let layoutTimer=0;
    let clickLockId='';
    let lastProgress=-1;
    let lastY=0;
    let direction=1;
    let isTouching=false;

    const ENTER_DOWN=18;
    const LEAVE_UP=18;
    const supportsScrollEnd=('onscrollend' in document);

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
      progressMax=Math.max(1,(Number(root.scrollHeight)||0)-(Number(root.clientHeight)||0));

      if(activeId){
        const idx=metrics.findIndex(item=>item.id===activeId);
        if(idx>=0)activeIndex=idx;
      }
    }

    function rawIndexAt(y){
      if(!metrics.length)return 0;
      const line=y+navHeight+20;
      let lo=0,hi=metrics.length-1,answer=0;
      while(lo<=hi){
        const mid=(lo+hi)>>1;
        if(metrics[mid].top<=line){answer=mid;lo=mid+1;}
        else hi=mid-1;
      }
      return answer;
    }

    function stableIndexAt(y){
      if(!metrics.length)return 0;
      if(!activeId)return rawIndexAt(y);

      let idx=Math.max(0,Math.min(activeIndex,metrics.length-1));
      const line=y+navHeight+20;
      if(direction>=0){
        while(idx<metrics.length-1&&line>=metrics[idx+1].top+ENTER_DOWN)idx++;
      }else{
        while(idx>0&&line<metrics[idx].top-LEAVE_UP)idx--;
      }
      return idx;
    }

    function alignChipToFront(chip){
      if(!chip)return;
      const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
      const wanted=Math.max(0,chip.offsetLeft-8);
      const next=Math.min(max,wanted);
      if(Math.abs(next-navScroll.scrollLeft)>1)navScroll.scrollLeft=next;
    }

    function setActiveChip(id,{queueAlign=true,alignNow=false}={}){
      if(!id)return false;
      const nextChip=chipMap.get(id);
      if(!nextChip)return false;

      const changed=id!==activeId;
      if(changed){
        if(activeChip)activeChip.classList.remove('is-active');
        nextChip.classList.add('is-active');
        activeChip=nextChip;
        activeId=id;
        const idx=metrics.findIndex(item=>item.id===id);
        if(idx>=0)activeIndex=idx;
      }

      if(alignNow){
        pendingAlignChip=null;
        alignChipToFront(nextChip);
      }else if(changed&&queueAlign){
        pendingAlignChip=nextChip;
      }
      return changed;
    }

    /* Only cached numbers are read while the finger / momentum scroll is moving. */
    function updateActiveChip(){
      activeRaf=0;
      if(clickLockId){
        setActiveChip(clickLockId,{queueAlign:false});
        return;
      }
      const idx=stableIndexAt(scrollY());
      setActiveChip(metrics[idx]?.id||metrics[0]?.id||'',{queueAlign:true});
    }

    function scheduleActiveChip(){
      if(activeRaf)return;
      activeRaf=requestAnimationFrame(updateActiveChip);
    }

    /* Progress is independent from chapter state and never reads section geometry. */
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

    function finishVerticalScroll(){
      clearTimeout(fallbackScrollEndTimer);
      if(isTouching)return;

      /* Horizontal nav movement is allowed only after the browser reports the
         vertical scroll has actually ended. No layout measurement happens here. */
      if(pendingAlignChip){
        const chip=pendingAlignChip;
        pendingAlignChip=null;
        requestAnimationFrame(()=>alignChipToFront(chip));
      }

      if(clickLockId){
        clickLockId='';
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{queueAlign:false});
      }
    }

    function scheduleFallbackScrollEnd(){
      if(supportsScrollEnd)return;
      clearTimeout(fallbackScrollEndTimer);
      fallbackScrollEndTimer=setTimeout(finishVerticalScroll,380);
    }

    function onScroll(){
      const y=scrollY();
      const delta=y-lastY;
      if(Math.abs(delta)>.5)direction=delta>0?1:-1;
      lastY=y;
      scheduleProgress();
      scheduleActiveChip();
      scheduleFallbackScrollEnd();
    }

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const id=chip.dataset.target;
      const target=document.getElementById(id);
      if(!id||!target)return;

      /* Re-measure before an explicit jump, never during an ordinary gesture. */
      measure();
      clickLockId=id;
      const idx=metrics.findIndex(item=>item.id===id);
      if(idx>=0)activeIndex=idx;
      setActiveChip(id,{queueAlign:false,alignNow:true});

      const absoluteTop=target.getBoundingClientRect().top+scrollY();
      const destination=Math.max(0,absoluteTop-navHeight+4);
      window.scrollTo({top:destination,behavior:reduceMotion()?'auto':'smooth'});
      if(!supportsScrollEnd)scheduleFallbackScrollEnd();
    }));

    function remeasureWhenIdle(delay=180){
      clearTimeout(layoutTimer);
      layoutTimer=setTimeout(()=>{
        if(isTouching){remeasureWhenIdle(220);return;}
        measure();
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{queueAlign:false});
        updateProgress();
      },delay);
    }

    addEventListener('touchstart',()=>{isTouching=true;},{passive:true});
    addEventListener('touchend',()=>{isTouching=false;if(!supportsScrollEnd)scheduleFallbackScrollEnd();},{passive:true});
    addEventListener('touchcancel',()=>{isTouching=false;if(!supportsScrollEnd)scheduleFallbackScrollEnd();},{passive:true});
    if(supportsScrollEnd)addEventListener('scrollend',finishVerticalScroll,{passive:true});

    measure();
    lastY=scrollY();
    activeIndex=rawIndexAt(lastY);
    setActiveChip(metrics[activeIndex]?.id||metrics[0]?.id||'',{queueAlign:false,alignNow:true});
    updateProgress();
    addEventListener('scroll',onScroll,{passive:true});

    if(document.fonts?.ready)document.fonts.ready.then(()=>remeasureWhenIdle(40)).catch(()=>{});
    addEventListener('load',()=>remeasureWhenIdle(70),{once:true});
    addEventListener('pageshow',()=>remeasureWhenIdle(90),{passive:true});
    addEventListener('orientationchange',()=>remeasureWhenIdle(340),{passive:true});
    setTimeout(()=>remeasureWhenIdle(20),1000);
    setTimeout(()=>remeasureWhenIdle(20),2800);
  }

  window.setupNavigation=setupNavigationV18;

  if(typeof window.__photoUiReadyResolve==='function'){
    window.__photoUiReadyResolve();
    window.__photoUiReadyResolve=null;
  }
})();
