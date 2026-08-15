function setupNavigation(){
  const shell=$('.nav-shell');
  const placeholder=$('.nav-placeholder');
  const chips=$$('.nav-chip');
  const sections=$$('.chapter[data-chapter]');
  const chipMap=new Map(chips.map(c=>[c.dataset.target,c]));
  let active='';
  let ticking=false;
  let clickLockUntil=0;
  let anchorY=0;

  if(!shell || !placeholder) return;

  const topTap=document.createElement('button');
  topTap.type='button';
  topTap.className='top-tap';
  topTap.setAttribute('aria-label','맨 위로');
  document.body.appendChild(topTap);

  const topBtn=document.createElement('button');
  topBtn.type='button';
  topBtn.className='nav-top-btn';
  topBtn.setAttribute('aria-label','맨 위로');
  topBtn.textContent='↑';
  topBtn.hidden=true;
  shell.appendChild(topBtn);

  function measureAnchor(){
    if(!shell.classList.contains('is-fixed')){
      anchorY=placeholder.getBoundingClientRect().top + window.scrollY;
    }
  }

  function updateFixed(){
    const shouldFix=window.scrollY>=anchorY;
    if(shouldFix && !shell.classList.contains('is-fixed')){
      placeholder.style.height=shell.offsetHeight+'px';
      shell.classList.add('is-fixed');
    }else if(!shouldFix && shell.classList.contains('is-fixed')){
      shell.classList.remove('is-fixed');
      placeholder.style.height='0px';
      measureAnchor();
    }
    topTap.hidden=window.scrollY<120;
    topBtn.hidden=window.scrollY<520;
  }

  function scanLine(){
    return shell.classList.contains('is-fixed')
      ? shell.getBoundingClientRect().bottom + 12
      : Math.max(82,shell.getBoundingClientRect().bottom + 12);
  }

  function setActive(id,center=true){
    if(!id || id===active) return;
    active=id;
    chips.forEach(c=>c.classList.toggle('is-active',c.dataset.target===id));
    const chip=chipMap.get(id);
    if(chip && center){
      chip.scrollIntoView({
        behavior:reduceMotion()?'auto':'smooth',
        inline:'center',
        block:'nearest'
      });
    }
  }

  function compute(){
    ticking=false;
    updateFixed();

    const line=scanLine();
    let current=sections[0]?.dataset.chapter||'';

    for(const section of sections){
      const r=section.getBoundingClientRect();
      if(r.top<=line && r.bottom>line){
        current=section.dataset.chapter;
        break;
      }
      if(r.top<=line) current=section.dataset.chapter;
    }

    if(Date.now()>=clickLockUntil) setActive(current,true);

    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=Math.min(1,Math.max(0,scrollY/max));
    const bar=$('.read-progress__bar');
    if(bar) bar.style.transform=`scaleX(${p})`;
  }

  function schedule(){
    if(!ticking){
      ticking=true;
      requestAnimationFrame(compute);
    }
  }

  chips.forEach(chip=>{
    chip.addEventListener('click',()=>{
      const target=document.getElementById(chip.dataset.target);
      if(!target)return;

      clickLockUntil=Date.now()+760;
      setActive(chip.dataset.target,true);

      const fixedHeight=shell.offsetHeight;
      const y=target.getBoundingClientRect().top+window.scrollY-fixedHeight-10;
      window.scrollTo({
        top:Math.max(0,y),
        behavior:reduceMotion()?'auto':'smooth'
      });

      setTimeout(compute,820);
    });
  });

  function goTop(){
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    window.scrollTo({top:0,left:0,behavior:reduceMotion()?'auto':'smooth'});

    setTimeout(()=>{
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      window.scrollTo(0,0);
    },260);
  }

  topTap.addEventListener('click',goTop);
  topTap.addEventListener('touchend',(e)=>{
    e.preventDefault();
    goTop();
  },{passive:false});
  topBtn.addEventListener('click',goTop);

  document.addEventListener('click',(e)=>{
    if(e.clientY<=22 && !e.target.closest('button,a,input,textarea')){
      goTop();
    }
  });

  measureAnchor();
  updateFixed();

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{
    if(!shell.classList.contains('is-fixed')) measureAnchor();
    schedule();
  },{passive:true});

  if(window.visualViewport){
    visualViewport.addEventListener('resize',schedule,{passive:true});
  }

  compute();
}
