(function(){
  if(window.__platformFilterChipLiveRuntimeV2)return;
  window.__platformFilterChipLiveRuntimeV2=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'';
  const controllers=new WeakMap();
  let currentConfig=null;

  function installStyle(){
    if($('#platform-filter-chip-live-runtime-v2-style'))return;
    const style=document.createElement('style');
    style.id='platform-filter-chip-live-runtime-v2-style';
    style.textContent=`
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{
        display:grid!important;place-items:center!important;align-content:center!important;
        min-height:100%!important;height:100%!important;padding:32px 18px!important;overflow:hidden!important
      }
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]>.collection-filters{
        box-sizing:border-box!important;width:min(100%,760px)!important;max-width:100%!important;
        margin:0!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;
        overscroll-behavior-x:contain!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x!important
      }
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]>.collection-filters::-webkit-scrollbar{display:none!important}
      .collection-filters[data-platform-filter-drag="true"]{cursor:grabbing!important;user-select:none!important}
      @media(max-width:560px){
        html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{padding:24px 14px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function clearGeometry(root){
    if(!root)return;
    for(const prop of ['gap','padding-top','padding-right','padding-bottom','padding-left'])root.style.removeProperty(prop);
    $$('.collection-filter',root).forEach(chip=>{
      chip.style.removeProperty('padding-top');chip.style.removeProperty('padding-right');
      chip.style.removeProperty('padding-bottom');chip.style.removeProperty('padding-left');
    });
  }

  function geometry(config){
    const source=config&&typeof config==='object'?config:{};
    const legacy=has(source,'runway')?Math.max(0,Number(source.runway)||0):null;
    return {
      gap:has(source,'gap')?Math.max(0,Number(source.gap)||0):null,
      top:has(source,'railPaddingTop')?Math.max(0,Number(source.railPaddingTop)||0):legacy,
      right:has(source,'railPaddingRight')?Math.max(0,Number(source.railPaddingRight)||0):legacy,
      bottom:has(source,'railPaddingBottom')?Math.max(0,Number(source.railPaddingBottom)||0):legacy,
      left:has(source,'railPaddingLeft')?Math.max(0,Number(source.railPaddingLeft)||0):legacy,
      chipY:has(source,'chipPaddingY')?Math.max(0,Number(source.chipPaddingY)||0):null,
      chipX:has(source,'chipPaddingX')?Math.max(0,Number(source.chipPaddingX)||0):null
    };
  }

  function applyGeometry(root,config=currentConfig){
    if(!root)return;
    const value=geometry(config);
    if(value.gap!==null)root.style.setProperty('gap',`${value.gap}px`,'important');
    if(value.top!==null)root.style.setProperty('padding-top',`${value.top}px`,'important');
    if(value.right!==null)root.style.setProperty('padding-right',`${value.right}px`,'important');
    if(value.bottom!==null)root.style.setProperty('padding-bottom',`${value.bottom}px`,'important');
    if(value.left!==null)root.style.setProperty('padding-left',`${value.left}px`,'important');
    $$('.collection-filter',root).forEach(chip=>{
      if(value.chipY!==null){chip.style.setProperty('padding-top',`${value.chipY}px`,'important');chip.style.setProperty('padding-bottom',`${value.chipY}px`,'important');}
      if(value.chipX!==null){chip.style.setProperty('padding-left',`${value.chipX}px`,'important');chip.style.setProperty('padding-right',`${value.chipX}px`,'important');}
    });
  }

  function stopMomentum(state){
    if(state.raf)cancelAnimationFrame(state.raf);
    state.raf=0;state.velocity=0;
  }

  function startMomentum(root,state){
    if(state.raf)cancelAnimationFrame(state.raf);
    state.raf=0;
    if(Math.abs(state.velocity)<0.035)return;
    let last=performance.now();
    const started=last;
    const tick=now=>{
      const dt=Math.min(32,Math.max(1,now-last));last=now;
      const before=root.scrollLeft;
      root.scrollLeft=before+(state.velocity*dt);
      const moved=root.scrollLeft-before;
      const atBoundary=Math.abs(moved)<0.1;
      state.velocity*=Math.pow(.92,dt/16.67);
      if(atBoundary||Math.abs(state.velocity)<.018||now-started>1500){stopMomentum(state);return;}
      state.raf=requestAnimationFrame(tick);
    };
    state.raf=requestAnimationFrame(tick);
  }

  function installInertia(root){
    if(!root||controllers.has(root))return;
    const state={pointerId:null,startX:0,startScroll:0,lastScroll:0,lastAt:0,dragging:false,velocity:0,raf:0,suppressUntil:0};
    controllers.set(root,state);

    root.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||event.button!==0)return;
      stopMomentum(state);
      state.pointerId=event.pointerId;state.startX=event.clientX;state.startScroll=root.scrollLeft;
      state.lastScroll=root.scrollLeft;state.lastAt=performance.now();state.dragging=false;state.velocity=0;
    },true);

    root.addEventListener('pointermove',event=>{
      if(state.pointerId===null||event.pointerId!==state.pointerId)return;
      const dx=event.clientX-state.startX;
      if(!state.dragging&&Math.abs(dx)<4)return;
      if(!state.dragging){
        state.dragging=true;root.dataset.platformFilterDrag='true';
        try{root.setPointerCapture(state.pointerId);}catch{}
      }
      const next=state.startScroll-dx;
      root.scrollLeft=next;
      const now=performance.now();const dt=Math.max(1,now-state.lastAt);
      const instant=(root.scrollLeft-state.lastScroll)/dt;
      state.velocity=(state.velocity*.68)+(instant*.32);
      state.lastScroll=root.scrollLeft;state.lastAt=now;
      if(event.cancelable)event.preventDefault();
    },{capture:true,passive:false});

    const finish=event=>{
      if(state.pointerId===null||event.pointerId!==state.pointerId)return;
      const dragged=state.dragging;
      try{root.releasePointerCapture(state.pointerId);}catch{}
      state.pointerId=null;state.dragging=false;delete root.dataset.platformFilterDrag;
      if(dragged){state.suppressUntil=performance.now()+260;startMomentum(root,state);}
    };
    root.addEventListener('pointerup',finish,true);
    root.addEventListener('pointercancel',finish,true);
    root.addEventListener('lostpointercapture',event=>{
      if(state.pointerId===null||event.pointerId!==state.pointerId)return;
      state.pointerId=null;state.dragging=false;delete root.dataset.platformFilterDrag;
    },true);
    root.addEventListener('click',event=>{
      if(performance.now()>state.suppressUntil)return;
      event.preventDefault();event.stopImmediatePropagation();state.suppressUntil=0;
    },true);
  }

  function bindPreviewSelection(root){
    if(preview!=='filter-chip-rail'||!root||root.dataset.platformPreviewSelection==='true')return;
    root.dataset.platformPreviewSelection='true';
    root.addEventListener('click',event=>{
      const button=event.target.closest?.('.collection-filter');
      if(!button||!root.contains(button))return;
      event.preventDefault();event.stopImmediatePropagation();
      $$('.collection-filter',root).forEach(chip=>chip.classList.toggle('is-active',chip===button));
    },true);
  }

  function applyPreviewLabels(labels){
    if(preview!=='filter-chip-rail'||!Array.isArray(labels))return;
    const root=$('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]>.collection-filters')||$('#collectionFilters');
    if(!root)return;
    const cleaned=labels.map(value=>String(value||'').trim()).filter(Boolean).slice(0,16);
    if(!cleaned.length)return;
    const activeText=$('.collection-filter.is-active',root)?.textContent?.trim()||'';
    $$('.collection-filter',root).forEach(button=>button.remove());
    cleaned.forEach((label,index)=>{
      const button=document.createElement('button');button.type='button';button.className='collection-filter';button.textContent=label;
      if(label===activeText||(!activeText&&index===0))button.classList.add('is-active');
      root.appendChild(button);
    });
    if(!$('.collection-filter.is-active',root))$('.collection-filter',root)?.classList.add('is-active');
    applyGeometry(root);
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }

  function prepareRoot(root){
    if(!root)return;
    installInertia(root);bindPreviewSelection(root);applyGeometry(root);
    if(preview==='filter-chip-rail'){
      const previewRoot=$('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]');
      if(previewRoot&&!previewRoot.dataset.liveReady){
        previewRoot.dataset.liveReady='true';
        window.parent?.postMessage({type:'platform-filter-chip-live-ready',capabilityId:'filter-chip-rail'},location.origin);
      }
    }
  }

  function prepareAll(){
    $$('.collection-filters').forEach(prepareRoot);
  }

  function reset(){
    currentConfig=null;
    $$('.collection-filters').forEach(clearGeometry);
  }

  function apply(config){
    currentConfig=config&&typeof config==='object'?{...config}:null;
    $$('.collection-filters').forEach(root=>{clearGeometry(root);applyGeometry(root,currentConfig);prepareRoot(root);});
  }

  function bootstrapFromParent(){
    try{
      if(window.parent===window)return;
      const all=JSON.parse(window.parent.localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}');
      const config=all&&typeof all==='object'?all['filter-chip-rail']:null;
      apply(config&&typeof config==='object'?config:null);
    }catch{}
  }

  installStyle();
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-filter-chip-preview-items'){applyPreviewLabels(data.labels);return;}
    if(data.capabilityId!=='filter-chip-rail')return;
    if(data.type==='platform-ui-reset'){reset();requestAnimationFrame(reset);}
    else if(data.type==='platform-ui-config'){
      const config=data.config||{};apply(config);
      requestAnimationFrame(()=>apply(config));
      setTimeout(()=>apply(config),40);
    }
  });

  new MutationObserver(records=>{
    if(!records.some(record=>record.addedNodes.length||record.removedNodes.length))return;
    requestAnimationFrame(prepareAll);
  }).observe(document.documentElement,{childList:true,subtree:true});

  [0,90,260,620].forEach(delay=>setTimeout(()=>{bootstrapFromParent();prepareAll();},delay));
})();
