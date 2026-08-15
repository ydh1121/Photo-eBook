/* v12 navigation interaction: fixed geometry, background-size progress, minimal horizontal motion. */
function setupNavigation(){
  const shell=$('.nav-shell');
  const placeholder=$('.nav-placeholder');
  const navScroll=$('.nav-scroll');
  const progress=$('.read-progress');
  const chips=$$('.nav-chip');
  const sections=$$('.chapter[data-chapter]');
  if(!shell||!navScroll||!chips.length)return;

  if(placeholder)placeholder.remove();

  let glass=$('.nav-glass',shell);
  if(!glass){
    glass=document.createElement('div');
    glass.className='nav-glass';
    shell.insertBefore(glass,navScroll);
    glass.appendChild(navScroll);
    if(progress)glass.appendChild(progress);
  }

  shell.classList.remove('is-compact');
  const chipMap=new Map(chips.map(chip=>[chip.dataset.target,chip]));
  let active='';
  let clickLockUntil=0;
  let raf=0;
  let navStart=0;
  let navEnd=1;
  let layoutWidth=window.innerWidth;

  function computeBounds(){
    const y=window.scrollY||document.documentElement.scrollTop||0;
    const rect=shell.getBoundingClientRect();
    const offsetTop=Number(shell.offsetTop);
    const layoutTop=Number.isFinite(offsetTop)&&offsetTop>0?offsetTop:rect.top+y;
    navStart=Math.max(0,layoutTop);
    navEnd=Math.max(navStart+1,document.documentElement.scrollHeight-window.innerHeight);
  }

  function keepChipInside(chip){
    if(!chip)return;
    const outer=navScroll.getBoundingClientRect();
    const inner=chip.getBoundingClientRect();
    const safe=10;
    let delta=0;
    if(inner.left<outer.left+safe)delta=inner.left-(outer.left+safe);
    else if(inner.right>outer.right-safe)delta=inner.right-(outer.right-safe);
    if(!delta)return;
    const max=Math.max(0,navScroll.scrollWidth-navScroll.clientWidth);
    const next=Math.max(0,Math.min(max,navScroll.scrollLeft+delta));
    if(Math.abs(next-navScroll.scrollLeft)>1)navScroll.scrollTo({left:next,behavior:'auto'});
  }

  function setActive(id,ensureVisible=true){
    if(!id)return;
    const changed=id!==active;
    if(changed){
      active=id;
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
    }
    if(changed&&ensureVisible)keepChipInside(chipMap.get(id));
  }

  function updateScrollState(){
    raf=0;
    const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    const ratio=Math.min(1,Math.max(0,(y-navStart)/(navEnd-navStart)));
    glass.style.setProperty('--progress-pct',`${(ratio*100).toFixed(3)}%`);
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(updateScrollState);
  }

  computeBounds();

  const observer=new IntersectionObserver(entries=>{
    if(Date.now()<clickLockUntil)return;
    const visible=entries.filter(entry=>entry.isIntersecting);
    if(!visible.length)return;
    visible.sort((a,b)=>Math.abs(a.boundingClientRect.top-90)-Math.abs(b.boundingClientRect.top-90));
    setActive(visible[0].target.dataset.chapter,true);
  },{root:null,rootMargin:'-86px 0px -66% 0px',threshold:[0,.01,.15]});
  sections.forEach(section=>observer.observe(section));

  chips.forEach(chip=>chip.addEventListener('click',()=>{
    const target=document.getElementById(chip.dataset.target);
    if(!target)return;
    clickLockUntil=Date.now()+760;
    setActive(chip.dataset.target,true);
    const top=target.getBoundingClientRect().top+window.scrollY-shell.offsetHeight-8;
    window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});
  }));

  let initial=sections[0];
  const line=shell.offsetHeight+14;
  for(const section of sections){
    const rect=section.getBoundingClientRect();
    if(rect.top<=line&&rect.bottom>line){initial=section;break;}
    if(rect.top<=line)initial=section;
  }
  if(initial)setActive(initial.dataset.chapter,false);

  /* Keep the item count next to the curated heading instead of leaving a dead block below the cards. */
  const curatedHead=$('.curated-head');
  const curatedStatus=$('#curatedStatus');
  const curatedCopy=curatedHead?.firstElementChild;
  if(curatedHead&&curatedStatus&&curatedCopy&&curatedStatus.parentElement!==curatedCopy){
    curatedCopy.appendChild(curatedStatus);
  }

  updateScrollState();
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('orientationchange',()=>{
    setTimeout(()=>{
      layoutWidth=window.innerWidth;
      computeBounds();
      updateScrollState();
    },220);
  },{passive:true});
  addEventListener('resize',()=>{
    /* iOS changes viewport height while Safari chrome collapses. Ignore height-only resizes. */
    if(Math.abs(window.innerWidth-layoutWidth)<8)return;
    layoutWidth=window.innerWidth;
    clearTimeout(setupNavigation._resizeTimer);
    setupNavigation._resizeTimer=setTimeout(()=>{computeBounds();updateScrollState();},180);
  },{passive:true});
}
