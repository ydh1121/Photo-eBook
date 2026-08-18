/* v22: chapter-aware nav state + chip-mapped reading progress.
   Active chip and progress are two outputs of the same measured page state.
   Each chapter completes just past its chip by the rail's vertical breathing
   room, while the final chapter still completes the full rail. */
(function(){
  function setupNavigationV22(){
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

    let progressTrack=navScroll.querySelector(':scope > .nav-chapter-progress');
    if(!progressTrack){
      progressTrack=document.createElement('span');
      progressTrack.className='nav-chapter-progress';
      progressTrack.setAttribute('aria-hidden','true');
      navScroll.prepend(progressTrack);
    }

    let metrics=[];
    let activeId='';
    let activeIndex=0;
    let activeChip=navScroll.querySelector('.nav-chip.is-active');
    let pendingAlignChip=null;
    let progressMax=1;
    let navHeight=76;
    let activeRaf=0;
    let progressRaf=0;
    let fallbackScrollEndTimer=0;
    let layoutTimer=0;
    let clickLockId='';
    let lastProgressPx=-1;
    let lastProgressLeft=-1;
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

    function anchorAt(y){
      return y+navHeight+20;
    }

    function rawIndexAt(y){
      if(!metrics.length)return 0;
      const line=anchorAt(y);
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
      const line=anchorAt(y);
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

    function normalizeActiveChip(nextChip,id){
      chips.forEach(chip=>chip.classList.toggle('is-active',chip===nextChip));
      activeChip=nextChip;
      activeId=id;
      const idx=metrics.findIndex(item=>item.id===id);
      if(idx>=0)activeIndex=idx;
    }

    function setActiveChip(id,{queueAlign=true,alignNow=false}={}){
      if(!id)return false;
      const nextChip=chipMap.get(id);
      if(!nextChip)return false;

      const hasWrongActive=chips.some(chip=>chip.classList.contains('is-active')!==(chip===nextChip));
      const changed=id!==activeId||activeChip!==nextChip||hasWrongActive;
      if(changed)normalizeActiveChip(nextChip,id);

      if(alignNow){
        pendingAlignChip=null;
        alignChipToFront(nextChip);
      }else if(changed&&queueAlign){
        pendingAlignChip=nextChip;
      }
      return changed;
    }

    function chapterProgressAt(y,index){
      if(!metrics.length)return 0;
      const idx=Math.max(0,Math.min(index,metrics.length-1));
      const start=metrics[idx]?.top||0;
      const end=idx<metrics.length-1
        ? metrics[idx+1].top
        : Math.max(start+1,progressMax+navHeight+20);
      return Math.max(0,Math.min(1,(anchorAt(y)-start)/Math.max(1,end-start)));
    }

    function rightRailInset(){
      const value=parseFloat(getComputedStyle(navScroll).paddingRight||'0');
      return Number.isFinite(value)?Math.max(0,value):0;
    }

    function chipBreathingInset(chip){
      if(!chip)return 0;
      const railHeight=Math.max(0,Number(navScroll.clientHeight)||0);
      const topGap=Math.max(0,Number(chip.offsetTop)||0);
      const bottomGap=Math.max(0,railHeight-topGap-(Number(chip.offsetHeight)||0));
      const gap=(topGap+bottomGap)/2;
      return Number.isFinite(gap)?Math.max(0,gap):0;
    }

    function firstProgressLeft(){
      const firstItem=metrics[0];
      const firstChip=firstItem?chipMap.get(firstItem.id):chips[0];
      return Math.max(0,Number(firstChip?.offsetLeft)||0);
    }

    function completedEndAt(index){
      const idx=Math.max(0,Math.min(index,metrics.length-1));
      const item=metrics[idx];
      const chip=item?chipMap.get(item.id):chips[idx];
      if(!chip)return firstProgressLeft();
      const chipRight=chip.offsetLeft+chip.offsetWidth;
      if(idx===metrics.length-1)return chipRight+rightRailInset();
      return chipRight+chipBreathingInset(chip);
    }

    function firstProgressEnd(){
      return Math.max(firstProgressLeft(),completedEndAt(0));
    }

    function progressPixelsAt(y,index){
      const idx=Math.max(0,Math.min(index,metrics.length-1));
      if(!metrics[idx])return firstProgressEnd();

      /* Start is a completed checkpoint. Every later chapter interpolates from
         the previous checkpoint to the current chip's completed checkpoint.
         This keeps progress continuous across chip gaps with no visual jump. */
      if(idx===0)return firstProgressEnd();

      const local=chapterProgressAt(y,idx);
      const startPx=completedEndAt(idx-1);
      const endPx=completedEndAt(idx);
      return Math.max(firstProgressEnd(),startPx+((endPx-startPx)*local));
    }

    function paintProgress(y,index){
      if(!progressTrack?.isConnected)return;
      const idx=Math.max(0,Math.min(index,metrics.length-1));
      const leftPx=firstProgressLeft();
      const endPx=progressPixelsAt(y,idx);
      const widthPx=Math.max(0,endPx-leftPx);
      if(Math.abs(widthPx-lastProgressPx)<.25&&Math.abs(leftPx-lastProgressLeft)<.25)return;
      lastProgressPx=widthPx;
      lastProgressLeft=leftPx;
      progressTrack.style.left=`${leftPx.toFixed(2)}px`;
      progressTrack.style.width=`${widthPx.toFixed(2)}px`;
      progressTrack.dataset.chapter=metrics[idx]?.id||'';
      progressTrack.style.setProperty('--chapter-local-progress',chapterProgressAt(y,idx).toFixed(5));
      /* Retire the older absolute-page wash. The semantic progress layer above
         now owns the visible fill. */
      navScroll.style.setProperty('--v32-progress','0%');
      glass.style.setProperty('--progress-scale','0');
    }

    /* Only cached numbers are read while finger / momentum scroll is moving. */
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

    function updateProgress(){
      progressRaf=0;
      const y=scrollY();
      const idx=clickLockId
        ? Math.max(0,metrics.findIndex(item=>item.id===clickLockId))
        : stableIndexAt(y);
      paintProgress(y,idx<0?0:idx);
    }

    function scheduleProgress(){
      if(progressRaf)return;
      progressRaf=requestAnimationFrame(updateProgress);
    }

    function finishVerticalScroll(){
      clearTimeout(fallbackScrollEndTimer);
      if(isTouching)return;

      if(pendingAlignChip){
        const chip=pendingAlignChip;
        pendingAlignChip=null;
        requestAnimationFrame(()=>{
          alignChipToFront(chip);
          requestAnimationFrame(updateProgress);
        });
      }

      if(clickLockId){
        clickLockId='';
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{queueAlign:false});
        requestAnimationFrame(updateProgress);
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

    navScroll.addEventListener('scroll',scheduleProgress,{passive:true});

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const id=chip.dataset.target;
      const target=document.getElementById(id);
      if(!id||!target)return;

      measure();
      clickLockId=id;
      const idx=metrics.findIndex(item=>item.id===id);
      if(idx>=0)activeIndex=idx;
      setActiveChip(id,{queueAlign:false,alignNow:true});
      updateProgress();

      const absoluteTop=target.getBoundingClientRect().top+scrollY();
      const destination=Math.max(0,absoluteTop-navHeight+4);
      window.scrollTo({top:destination,behavior:reduceMotion()?'auto':'smooth'});
      if(!supportsScrollEnd)scheduleFallbackScrollEnd();
    }));

    function remeasureWhenIdle(delay=180,{align=false}={}){
      clearTimeout(layoutTimer);
      layoutTimer=setTimeout(()=>{
        if(isTouching){remeasureWhenIdle(220,{align});return;}
        measure();
        const idx=rawIndexAt(scrollY());
        activeIndex=idx;
        setActiveChip(metrics[idx]?.id||'',{queueAlign:false,alignNow:align});
        lastProgressPx=-1;
        lastProgressLeft=-1;
        updateProgress();
      },delay);
    }

    addEventListener('touchstart',()=>{isTouching=true;},{passive:true});
    addEventListener('touchend',()=>{isTouching=false;if(!supportsScrollEnd)scheduleFallbackScrollEnd();},{passive:true});
    addEventListener('touchcancel',()=>{isTouching=false;if(!supportsScrollEnd)scheduleFallbackScrollEnd();},{passive:true});
    if(supportsScrollEnd)addEventListener('scrollend',finishVerticalScroll,{passive:true});

    navScroll.dataset.chapterProgressOwner='script-9-v22';
    measure();
    lastY=scrollY();
    activeIndex=rawIndexAt(lastY);
    setActiveChip(metrics[activeIndex]?.id||metrics[0]?.id||'',{queueAlign:false,alignNow:true});
    updateProgress();
    addEventListener('scroll',onScroll,{passive:true});

    if(document.fonts?.ready)document.fonts.ready.then(()=>remeasureWhenIdle(40,{align:true})).catch(()=>{});
    addEventListener('load',()=>remeasureWhenIdle(70,{align:true}),{once:true});
    addEventListener('pageshow',()=>remeasureWhenIdle(90,{align:true}),{passive:true});
    addEventListener('orientationchange',()=>remeasureWhenIdle(340,{align:true}),{passive:true});
    setTimeout(()=>remeasureWhenIdle(20,{align:true}),1000);
    setTimeout(()=>remeasureWhenIdle(20,{align:true}),2800);

    if('ResizeObserver' in window){
      const app=$('#app');
      if(app){
        const resizeObserver=new ResizeObserver(()=>remeasureWhenIdle(130));
        resizeObserver.observe(app);
      }
    }
  }

  window.setupNavigation=setupNavigationV22;

  if(typeof window.__photoUiReadyResolve==='function'){
    window.__photoUiReadyResolve();
    window.__photoUiReadyResolve=null;
  }
})();
