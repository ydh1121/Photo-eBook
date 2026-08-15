/* v15: deterministic navigation, compositor progress, cached chapter metrics */
(function(){
  function setupNavigationV15(){
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
    let progressMax=1;
    let activeRaf=0;
    let progressRaf=0;
    let revealTimer=0;
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
      progressMax=Math.max(1,(Number(root.scrollHeight)||0)-(Number(root.clientHeight)||0));
    }

    function currentChapterAt(y){
      if(!metrics.length)return sections[0]?.dataset.chapter||'';
      const line=y+shell.offsetHeight+24;
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

    function revealChipNow(chip){
      if(!chip)return;
      const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
      const safe=10;
      const left=chip.offsetLeft;
      const right=left+chip.offsetWidth;
      const viewLeft=navScroll.scrollLeft+safe;
      const viewRight=navScroll.scrollLeft+navScroll.clientWidth-safe;
      let next=navScroll.scrollLeft;
      if(left<viewLeft)next=Math.max(0,left-safe);
      else if(right>viewRight)next=Math.min(max,right-navScroll.clientWidth+safe);
      if(Math.abs(next-navScroll.scrollLeft)>1)navScroll.scrollLeft=next;
    }

    function revealChipAfterScroll(chip){
      clearTimeout(revealTimer);
      revealTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<110){
          revealChipAfterScroll(chip);
          return;
        }
        revealChipNow(chip);
      },120);
    }

    function setActiveChip(id,{reveal='idle'}={}){
      if(!id)return;
      const changed=id!==activeId;
      if(changed){
        activeId=id;
        chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
      }
      if(!changed)return;
      const chip=chipMap.get(id);
      if(reveal==='now')revealChipNow(chip);
      else if(reveal==='idle')revealChipAfterScroll(chip);
    }

    /* ACTIVE CHIP: cached section coordinates only. No layout reads per frame. */
    function updateActiveChip(){
      activeRaf=0;
      if(clickLockId){
        setActiveChip(clickLockId,{reveal:'none'});
        return;
      }
      setActiveChip(currentChapterAt(scrollY()),{reveal:'idle'});
    }

    function scheduleActiveChip(){
      if(activeRaf)return;
      activeRaf=requestAnimationFrame(updateActiveChip);
    }

    /* PROGRESS: page-wide scroll ratio, fully independent from chip state. */
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

    function releaseClickLockSoon(){
      clearTimeout(clickUnlockTimer);
      clickUnlockTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<120){
          releaseClickLockSoon();
          return;
        }
        clickLockId='';
        updateActiveChip();
      },140);
    }

    function onScroll(){
      lastScrollAt=performance.now();
      scheduleProgress();
      scheduleActiveChip();
      if(clickLockId)releaseClickLockSoon();
    }

    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const id=chip.dataset.target;
      const target=document.getElementById(id);
      if(!id||!target)return;

      /* A tap is infrequent, so refresh all chapter coordinates here for an
         exact landing position. This avoids stale offsets from lazy content. */
      measure();
      clickLockId=id;
      setActiveChip(id,{reveal:'now'});

      const absoluteTop=target.getBoundingClientRect().top+scrollY();
      const destination=Math.max(0,absoluteTop-shell.offsetHeight+2);
      window.scrollTo({
        top:destination,
        behavior:reduceMotion()?'auto':'smooth'
      });
      releaseClickLockSoon();
    }));

    function remeasureWhenIdle(delay=220){
      clearTimeout(layoutTimer);
      layoutTimer=setTimeout(()=>{
        if(performance.now()-lastScrollAt<160){
          remeasureWhenIdle(180);
          return;
        }
        measure();
        updateActiveChip();
        updateProgress();
      },delay);
    }

    measure();
    updateActiveChip();
    updateProgress();
    addEventListener('scroll',onScroll,{passive:true});

    /* Lazy images and remote cards may shift later chapters. Re-measure only
       after vertical scrolling is idle so the gesture itself stays untouched. */
    const app=$('#app');
    if(app&&'ResizeObserver' in window){
      const ro=new ResizeObserver(()=>remeasureWhenIdle(260));
      ro.observe(app);
    }

    if(document.fonts?.ready){
      document.fonts.ready.then(()=>remeasureWhenIdle(40)).catch(()=>{});
    }
    addEventListener('load',()=>remeasureWhenIdle(60),{once:true});
    addEventListener('orientationchange',()=>remeasureWhenIdle(320),{passive:true});
    setTimeout(()=>remeasureWhenIdle(20),600);
    setTimeout(()=>remeasureWhenIdle(20),1800);
  }

  window.setupNavigation=setupNavigationV15;

  if(typeof window.__photoUiReadyResolve==='function'){
    window.__photoUiReadyResolve();
    window.__photoUiReadyResolve=null;
  }
})();
