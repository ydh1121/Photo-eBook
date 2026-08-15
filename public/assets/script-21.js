/* v37: event-driven liquid skin, restrained rubber inertia, and platform CTA polish. */
(function(){
  if(window.__photoV37Installed)return;
  window.__photoV37Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const railConfigs=[
    {root:'.nav-scroll',item:'.nav-chip',indicator:'.nav-v33-indicator'},
    {root:'.collection-tabs',item:'.collection-tab',indicator:'.collection-v33-indicator'},
    {root:'.theme-choice',item:'button',indicator:'.theme-v34-indicator'},
    {root:'.v32-question-segment',item:'button',indicator:'.v36-question-indicator'}
  ];
  const observers=new WeakMap();
  const lastActiveX=new WeakMap();

  function ensureSkin(indicator){
    if(!indicator)return null;
    let skin=$(':scope > .v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return skin;
  }

  function animateSkin(root,item,skin){
    if(!root||!item||!skin||reduced()||typeof skin.animate!=='function')return;
    const previous=lastActiveX.get(root);
    const next=item.offsetLeft;
    lastActiveX.set(root,next);
    if(previous==null)return;

    const dx=next-previous;
    if(Math.abs(dx)<1)return;
    const direction=Math.sign(dx)||1;
    const travel=Math.abs(dx);
    const stretch=Math.min(1.022,1.009+travel/12000);
    const kick=Math.min(3.4,1.5+travel*.012);
    const duration=Math.min(430,300+travel*.18);

    skin.getAnimations().forEach(a=>a.cancel());
    skin.animate([
      {transform:'translate3d(0,0,0) scaleX(1)',offset:0},
      {transform:`translate3d(${direction*kick}px,0,0) scaleX(${stretch})`,offset:.66},
      {transform:`translate3d(${-direction*.75}px,0,0) scaleX(.997)`,offset:.86},
      {transform:'translate3d(0,0,0) scaleX(1)',offset:1}
    ],{
      duration,
      easing:'cubic-bezier(.22,.72,.18,1)'
    });
  }

  function setupRail(config){
    const root=$(config.root);
    if(!root)return;
    const indicator=$(config.indicator,root);
    if(!indicator)return;
    const skin=ensureSkin(indicator);
    const active=$(`${config.item}.is-active`,root)||$(config.item,root);
    if(active&&!lastActiveX.has(root))lastActiveX.set(root,active.offsetLeft);

    if(observers.has(root))return;
    const observer=new MutationObserver(records=>{
      let changed=false;
      for(const record of records){
        if(record.type==='attributes'&&record.attributeName==='class'){
          const node=record.target;
          if(node.matches?.(config.item)&&node.classList.contains('is-active')){
            changed=true;
            break;
          }
        }
      }
      if(!changed)return;
      requestAnimationFrame(()=>{
        const now=$(`${config.item}.is-active`,root)||$(config.item,root);
        const currentIndicator=$(config.indicator,root);
        const currentSkin=ensureSkin(currentIndicator);
        if(now&&currentSkin)animateSkin(root,now,currentSkin);
      });
    });
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    observers.set(root,observer);
  }

  function setupAllRails(){
    railConfigs.forEach(setupRail);
  }

  function iconSvg(kind){
    if(kind==='play'){
      return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.2 3.2 18.9 12 4.2 20.8V3.2Z"/></svg></span>';
    }
    if(kind==='store'){
      return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7.1 7.2h9.8l1.7 12H5.4l1.7-12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m10.1 15.5 2-4 2 4M10.8 14h2.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>';
    }
    return '<span class="v37-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.8 12h16.4M12 3.4c2.2 2.5 3.3 5.4 3.3 8.6S14.2 18.1 12 20.6M12 3.4C9.8 5.9 8.7 8.8 8.7 12s1.1 6.1 3.3 8.6" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg></span>';
  }

  function platform(){
    const ua=navigator.userAgent||'';
    const iOS=/iPhone|iPad|iPod/i.test(ua)||
      (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const android=/Android/i.test(ua);
    if(iOS)return {label:'App Store',kind:'store',href:'https://apps.apple.com/app/openai-chatgpt/id6448311069'};
    if(android)return {label:'Google Play',kind:'play',href:'https://play.google.com/store/apps/details?id=com.openai.chatgpt'};
    return {label:'ChatGPT Web',kind:'web',href:'https://chatgpt.com/'};
  }

  function polishQuestionActions(){
    const open=$('#askOpenChatGPT');
    const install=$('#askInstallChatGPT');
    const target=platform();

    if(open&&open.dataset.v37Icon!=='true'){
      open.dataset.v37Icon='true';
      open.innerHTML=iconSvg('web')+'<span>ChatGPT 열기</span>';
    }
    if(install){
      install.hidden=false;
      install.href=target.href;
      install.dataset.v37Platform=target.kind;
      install.innerHTML=iconSvg(target.kind)+`<span>${target.label}</span>`;
    }
  }

  function scheduleRefresh(delay=0){
    window.setTimeout(()=>{
      setupAllRails();
      polishQuestionActions();
      requestAnimationFrame(setupAllRails);
    },delay);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#collectionFab,.collection-tab,[data-v32-qmode],.theme-choice button')){
      scheduleRefresh(40);
    }
  },true);

  window.addEventListener('photo-theme-change',()=>scheduleRefresh(20));
  window.addEventListener('pageshow',()=>scheduleRefresh(140),{passive:true});

  function init(){
    scheduleRefresh(180);
    scheduleRefresh(700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
