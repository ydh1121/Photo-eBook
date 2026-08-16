/* v45: reliable horizontal touch scrolling for the top chapter rail. */
(function(){
  if(window.__photoV45NavDragInstalled)return;
  window.__photoV45NavDragInstalled=true;

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const bound=new WeakSet();
  const inertiaJobs=new WeakMap();

  function cancelInertia(rail){
    const raf=inertiaJobs.get(rail);
    if(raf)cancelAnimationFrame(raf);
    inertiaJobs.delete(rail);
  }

  function startInertia(rail,velocity){
    cancelInertia(rail);
    if(!Number.isFinite(velocity)||Math.abs(velocity)<0.04)return;

    let v=velocity*16;
    let previous=performance.now();
    const tick=now=>{
      const dt=Math.min(32,Math.max(8,now-previous));
      previous=now;
      const decay=Math.pow(0.94,dt/16.67);
      v*=decay;

      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      const before=rail.scrollLeft;
      rail.scrollLeft=clamp(before+v*(dt/16.67),0,max);
      const hitEdge=(rail.scrollLeft<=0&&v<0)||(rail.scrollLeft>=max&&v>0);

      if(hitEdge||Math.abs(v)<0.22){
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
    rail.dataset.v45HorizontalScroll='true';

    /* Keep native scrolling enabled; the touch handler below is an iOS-safe
       fallback for cases where the glass/indicator stack swallows pan-x. */
    rail.style.setProperty('overflow-x','auto','important');
    rail.style.setProperty('overflow-y','hidden','important');
    rail.style.setProperty('-webkit-overflow-scrolling','touch','important');
    rail.style.setProperty('touch-action','pan-x pan-y','important');
    rail.style.setProperty('overscroll-behavior-x','contain','important');

    let gesture=null;
    let suppressClickUntil=0;

    rail.addEventListener('touchstart',event=>{
      if(event.touches.length!==1)return;
      cancelInertia(rail);
      clearTimeout(rail.__v32NavTimer);
      clearTimeout(rail.__v32LeadTimer);
      const touch=event.touches[0];
      gesture={
        x:touch.clientX,
        y:touch.clientY,
        scrollLeft:rail.scrollLeft,
        axis:null,
        moved:false,
        lastScroll:rail.scrollLeft,
        lastTime:performance.now(),
        velocity:0
      };
    },{passive:true,capture:true});

    rail.addEventListener('touchmove',event=>{
      if(!gesture||event.touches.length!==1)return;
      const touch=event.touches[0];
      const dx=touch.clientX-gesture.x;
      const dy=touch.clientY-gesture.y;

      if(!gesture.axis){
        if(Math.max(Math.abs(dx),Math.abs(dy))<6)return;
        gesture.axis=Math.abs(dx)>Math.abs(dy)*1.12?'x':'y';
      }
      if(gesture.axis!=='x')return;

      if(event.cancelable)event.preventDefault();
      gesture.moved=true;
      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      const next=clamp(gesture.scrollLeft-dx,0,max);
      rail.scrollLeft=next;

      const now=performance.now();
      const dt=Math.max(1,now-gesture.lastTime);
      const instant=(next-gesture.lastScroll)/dt;
      gesture.velocity=gesture.velocity*.38+instant*.62;
      gesture.lastScroll=next;
      gesture.lastTime=now;
    },{passive:false,capture:true});

    const finish=()=>{
      if(!gesture)return;
      if(gesture.axis==='x'&&gesture.moved){
        suppressClickUntil=performance.now()+360;
        startInertia(rail,gesture.velocity);
      }
      gesture=null;
    };
    rail.addEventListener('touchend',finish,{passive:true,capture:true});
    rail.addEventListener('touchcancel',finish,{passive:true,capture:true});

    rail.addEventListener('click',event=>{
      if(performance.now()<suppressClickUntil){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);
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
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(()=>scan(),80),{passive:true});
})();
