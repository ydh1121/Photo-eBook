/* v47: native iOS horizontal scrolling for the top chapter rail.
   Previous v46 owned every pointermove + momentum frame in JavaScript. That
   fought Safari's gesture engine and could keep the main thread/GPU busy.
   v47 gives panning back to WebKit and only pauses legacy auto-lead timers
   while the user is touching the rail. */
(function(){
  if(window.__photoV47NavNativeInstalled)return;
  window.__photoV47NavNativeInstalled=true;

  const bound=new WeakSet();

  function cancelLegacyLead(rail){
    clearTimeout(rail.__v32NavTimer);
    clearTimeout(rail.__v32LeadTimer);
  }

  function applyNativePolicy(rail){
    if(!rail)return;

    /* The important part: a gesture that begins on a button must still be
       eligible for native horizontal panning. Global button CSS uses
       touch-action:manipulation, so override both the rail and its chips. */
    rail.style.setProperty('display','flex','important');
    rail.style.setProperty('width','100%','important');
    rail.style.setProperty('max-width','100%','important');
    rail.style.setProperty('min-width','0','important');
    rail.style.setProperty('overflow-x','scroll','important');
    rail.style.setProperty('overflow-y','hidden','important');
    rail.style.setProperty('-webkit-overflow-scrolling','touch','important');
    rail.style.setProperty('touch-action','pan-x pan-y','important');
    rail.style.setProperty('overscroll-behavior-x','contain','important');
    rail.style.setProperty('scroll-behavior','auto','important');
    rail.style.setProperty('scroll-snap-type','none','important');

    rail.querySelectorAll('.nav-chip').forEach(chip=>{
      chip.style.setProperty('flex','0 0 auto','important');
      chip.style.setProperty('touch-action','pan-x pan-y','important');
      chip.style.setProperty('-webkit-user-select','none','important');
      chip.style.setProperty('user-select','none','important');
    });

    /* Moving glass is visual only. Never let it become the gesture target. */
    rail.querySelectorAll('.nav-v33-indicator,.nav-liquid-indicator,.v37-liquid-skin,.nav-progress-liquid').forEach(node=>{
      node.style.setProperty('pointer-events','none','important');
      node.style.setProperty('touch-action','none','important');
    });
  }

  function bind(rail){
    if(!rail)return;
    applyNativePolicy(rail);
    if(bound.has(rail))return;
    bound.add(rail);
    rail.dataset.v47NativeScroll='true';

    let touching=false;
    let moved=false;
    let startX=0;
    let startY=0;

    rail.addEventListener('touchstart',event=>{
      const touch=event.touches&&event.touches[0];
      touching=true;
      moved=false;
      if(touch){startX=touch.clientX;startY=touch.clientY;}
      cancelLegacyLead(rail);
      rail.classList.add('is-native-touching');
    },{passive:true});

    rail.addEventListener('touchmove',event=>{
      if(!touching)return;
      const touch=event.touches&&event.touches[0];
      if(!touch)return;
      const dx=Math.abs(touch.clientX-startX);
      const dy=Math.abs(touch.clientY-startY);
      if(dx>7&&dx>dy)moved=true;
      /* Deliberately do not preventDefault and do not write scrollLeft here.
         WebKit owns the scrolling/momentum path. */
      cancelLegacyLead(rail);
    },{passive:true});

    const endTouch=()=>{
      touching=false;
      rail.classList.remove('is-native-touching');
      /* Keep old auto-leading code from snapping the rail back immediately
         after a manual swipe. */
      if(moved){
        cancelLegacyLead(rail);
        rail.__v47ManualUntil=performance.now()+650;
      }
      moved=false;
    };
    rail.addEventListener('touchend',endTouch,{passive:true});
    rail.addEventListener('touchcancel',endTouch,{passive:true});

    /* Suppress accidental chapter activation after a real swipe, without
       taking ownership of the gesture itself. */
    rail.addEventListener('click',event=>{
      if(performance.now()<(rail.__v47ManualUntil||0)){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);
  }

  function findAndBind(){
    document.querySelectorAll('.nav-scroll').forEach(bind);
  }

  function waitForNav(attempt=0){
    findAndBind();
    if(document.querySelector('.nav-scroll')||attempt>=80)return;
    setTimeout(()=>waitForNav(attempt+1),100);
  }

  function init(){
    waitForNav();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(findAndBind,80),{passive:true});
  window.addEventListener('resize',()=>document.querySelectorAll('.nav-scroll').forEach(applyNativePolicy),{passive:true});
})();
