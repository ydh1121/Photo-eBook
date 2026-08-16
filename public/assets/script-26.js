/* v46: iOS-safe horizontal drag for the top chapter rail.
   The rail keeps native vertical page scrolling, while horizontal movement is
   owned explicitly by pointer events. */
(function(){
  if(window.__photoV46NavDragInstalled)return;
  window.__photoV46NavDragInstalled=true;

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const bound=new WeakSet();
  const inertiaJobs=new WeakMap();

  function cancelInertia(rail){
    const raf=inertiaJobs.get(rail);
    if(raf)cancelAnimationFrame(raf);
    inertiaJobs.delete(rail);
  }

  function cancelLegacyLead(rail){
    clearTimeout(rail.__v32NavTimer);
    clearTimeout(rail.__v32LeadTimer);
  }

  function maxScroll(rail){
    return Math.max(0,rail.scrollWidth-rail.clientWidth);
  }

  function applyTouchPolicy(rail){
    rail.style.setProperty('overflow-x','auto','important');
    rail.style.setProperty('overflow-y','hidden','important');
    rail.style.setProperty('-webkit-overflow-scrolling','touch','important');
    rail.style.setProperty('touch-action','pan-y','important');
    rail.style.setProperty('overscroll-behavior-x','contain','important');
    rail.style.setProperty('scroll-behavior','auto','important');
    rail.querySelectorAll('.nav-chip').forEach(chip=>{
      chip.style.setProperty('touch-action','pan-y','important');
      chip.style.setProperty('flex','0 0 auto','important');
    });
  }

  function startInertia(rail,velocity){
    cancelInertia(rail);
    const max=maxScroll(rail);
    if(max<=0||!Number.isFinite(velocity)||Math.abs(velocity)<0.015)return;

    let v=clamp(velocity*16,-34,34);
    let previous=performance.now();
    const tick=now=>{
      const dt=Math.min(34,Math.max(8,now-previous));
      previous=now;
      v*=Math.pow(0.91,dt/16.67);

      const before=rail.scrollLeft;
      const next=clamp(before+v*(dt/16.67),0,maxScroll(rail));
      rail.scrollLeft=next;

      const atEdge=(next<=0&&v<0)||(next>=maxScroll(rail)&&v>0);
      if(atEdge||Math.abs(v)<0.18){
        inertiaJobs.delete(rail);
        return;
      }
      const raf=requestAnimationFrame(tick);
      inertiaJobs.set(rail,raf);
    };
    const raf=requestAnimationFrame(tick);
    inertiaJobs.set(rail,raf);
  }

  function bind(rail){
    if(!rail||bound.has(rail))return;
    bound.add(rail);
    rail.dataset.v46HorizontalScroll='true';
    applyTouchPolicy(rail);

    let gesture=null;
    let suppressClickUntil=0;

    rail.addEventListener('pointerdown',event=>{
      if(!event.isPrimary)return;
      if(event.pointerType==='mouse'&&event.button!==0)return;
      applyTouchPolicy(rail);
      cancelInertia(rail);
      cancelLegacyLead(rail);
      gesture={
        id:event.pointerId,
        startX:event.clientX,
        startY:event.clientY,
        startScroll:rail.scrollLeft,
        axis:null,
        dragging:false,
        lastScroll:rail.scrollLeft,
        lastTime:performance.now(),
        velocity:0
      };
    },{capture:true,passive:true});

    rail.addEventListener('pointermove',event=>{
      const g=gesture;
      if(!g||event.pointerId!==g.id)return;

      const dx=event.clientX-g.startX;
      const dy=event.clientY-g.startY;
      if(!g.axis){
        const ax=Math.abs(dx),ay=Math.abs(dy);
        if(Math.max(ax,ay)<5)return;
        if(ax>ay*1.06)g.axis='x';
        else if(ay>ax*1.06){
          g.axis='y';
          return;
        }else return;
      }
      if(g.axis!=='x')return;

      if(!g.dragging){
        g.dragging=true;
        rail.classList.add('is-horizontal-dragging');
        try{rail.setPointerCapture(event.pointerId);}catch{}
      }
      if(event.cancelable)event.preventDefault();
      cancelLegacyLead(rail);

      const next=clamp(g.startScroll-dx,0,maxScroll(rail));
      rail.scrollLeft=next;

      const now=performance.now();
      const dt=Math.max(1,now-g.lastTime);
      const instant=(next-g.lastScroll)/dt;
      g.velocity=g.velocity*.45+instant*.55;
      g.lastScroll=next;
      g.lastTime=now;
    },{capture:true,passive:false});

    function finish(event){
      const g=gesture;
      if(!g||event.pointerId!==g.id)return;
      if(g.dragging){
        suppressClickUntil=performance.now()+420;
        rail.classList.remove('is-horizontal-dragging');
        try{if(rail.hasPointerCapture?.(g.id))rail.releasePointerCapture(g.id);}catch{}
        startInertia(rail,g.velocity);
      }
      gesture=null;
    }

    rail.addEventListener('pointerup',finish,{capture:true,passive:true});
    rail.addEventListener('pointercancel',event=>{
      const g=gesture;
      if(!g||event.pointerId!==g.id)return;
      rail.classList.remove('is-horizontal-dragging');
      gesture=null;
    },{capture:true,passive:true});

    rail.addEventListener('click',event=>{
      if(performance.now()<suppressClickUntil){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);

    /* Desktop trackpads / shift-wheel should remain useful as well. */
    rail.addEventListener('wheel',event=>{
      const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY)
        ? event.deltaX
        : (event.shiftKey?event.deltaY:0);
      if(!horizontal)return;
      const before=rail.scrollLeft;
      const next=clamp(before+horizontal,0,maxScroll(rail));
      if(next===before)return;
      cancelInertia(rail);
      cancelLegacyLead(rail);
      rail.scrollLeft=next;
      if(event.cancelable)event.preventDefault();
    },{passive:false});
  }

  function scan(root=document){
    if(root.matches?.('.nav-scroll'))bind(root);
    root.querySelectorAll?.('.nav-scroll').forEach(bind);
  }

  function init(){
    scan();
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType===1)scan(node);
        }
      }
      document.querySelectorAll('.nav-scroll').forEach(applyTouchPolicy);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(()=>{scan();document.querySelectorAll('.nav-scroll').forEach(applyTouchPolicy);},80),{passive:true});
})();
