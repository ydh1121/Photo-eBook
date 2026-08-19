(function(){
  if(window.PlatformUiCapabilityRuntime)return;

  const railState=new WeakMap();
  const progressState=new WeakMap();
  const DESKTOP_QUERY='(min-width:1024px)';
  const RAIL_SELECTOR='.pb-rail';

  function plainObject(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value));}
  function cleanNumber(value,fallback,min,max){const number=Number(value);return Number.isFinite(number)?Math.min(max,Math.max(min,number)):fallback;}
  function cleanString(value,fallback=''){return typeof value==='string'?value:fallback;}
  function truthy(value){return value===true;}

  function normalizeItem(input={}){
    const capabilityId=cleanString(input.capabilityId).trim();
    return {
      capabilityId,
      enabled:input.enabled===true,
      presetId:cleanString(input.presetId).trim(),
      config:plainObject(input.config)?{...input.config}:{}
    };
  }

  function clearCapabilityAttributes(root){
    [...root.attributes].forEach(attribute=>{
      if(attribute.name.startsWith('data-ui-capability-')||attribute.name.startsWith('data-ui-rail-')||attribute.name.startsWith('data-ui-progress-'))root.removeAttribute(attribute.name);
    });
    [
      '--ui-rail-left-runway','--ui-rail-right-padding','--ui-rail-right-fade',
      '--ui-rail-drag-threshold','--ui-rail-click-suppress-ms',
      '--ui-progress-color','--ui-progress-thickness','--ui-progress-opacity'
    ].forEach(name=>root.style.removeProperty(name));
  }

  function applyCapabilityAttributes(root,items){
    clearCapabilityAttributes(root);
    const enabled=items.filter(item=>item.enabled&&item.capabilityId);
    root.dataset.uiCapabilityCount=String(enabled.length);
    for(const item of enabled)root.setAttribute(`data-ui-capability-${item.capabilityId}`,'true');

    const rail=enabled.find(item=>item.capabilityId==='horizontal-card-rail');
    if(rail){
      const config=rail.config||{};
      const leftRunway=cleanNumber(config.leftPaintRunway,16,0,96);
      const rightPadding=cleanNumber(config.rightContentPadding,122,0,240);
      const rightFade=cleanNumber(config.rightFadeWidth,112,0,240);
      const dragThreshold=cleanNumber(config.dragThreshold,5,2,24);
      const clickSuppressMs=cleanNumber(config.clickSuppressMs,220,0,800);

      root.style.setProperty('--ui-rail-left-runway',`${leftRunway}px`);
      root.style.setProperty('--ui-rail-right-padding',`${rightPadding}px`);
      root.style.setProperty('--ui-rail-right-fade',`${rightFade}px`);
      root.style.setProperty('--ui-rail-drag-threshold',String(dragThreshold));
      root.style.setProperty('--ui-rail-click-suppress-ms',String(clickSuppressMs));
      root.dataset.uiRailLeftShadowGuard=truthy(config.leftShadowGuard)?'true':'false';
      root.dataset.uiRailLeftFade=truthy(config.leftFade)?'true':'false';
      root.dataset.uiRailRightFade=truthy(config.rightFade)?'true':'false';
      root.dataset.uiRailScrollbar=cleanString(config.scrollbar,'hidden')==='auto'?'auto':'hidden';
      root.dataset.uiRailDesktopDrag=config.desktopDrag===false?'false':'true';
      root.dataset.uiRailNativeTouch=config.nativeTouch===false?'false':'true';
    }

    const progress=enabled.find(item=>item.capabilityId==='reading-progress');
    if(progress){
      const config=progress.config||{};
      root.style.setProperty('--ui-progress-color',cleanString(config.color,'#4081ef'));
      root.style.setProperty('--ui-progress-thickness',`${cleanNumber(config.thickness,2,1,8)}px`);
      root.style.setProperty('--ui-progress-opacity',String(cleanNumber(config.opacity,100,0,100)/100));
    }
  }

  function installRailInteractions(root){
    const existing=railState.get(root);
    if(existing)return existing;

    const state={
      rail:null,pointerId:null,startX:0,startScroll:0,dragging:false,
      suppressRail:null,suppressUntil:0
    };
    const desktop=window.matchMedia?.(DESKTOP_QUERY);

    function enabled(){return root.dataset.uiCapabilityHorizontalCardRail==='true';}
    function dragEnabled(){return enabled()&&root.dataset.uiRailDesktopDrag!=='false'&&desktop?.matches===true;}
    function railFrom(target){const rail=target?.closest?.(RAIL_SELECTOR)||null;return rail&&root.contains(rail)?rail:null;}
    function threshold(){return cleanNumber(root.style.getPropertyValue('--ui-rail-drag-threshold'),5,2,24);}
    function suppressMs(){return cleanNumber(root.style.getPropertyValue('--ui-rail-click-suppress-ms'),220,0,800);}

    function pointerDown(event){
      if(!dragEnabled()||event.pointerType!=='mouse'||event.button!==0)return;
      const rail=railFrom(event.target);
      if(!rail||event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      state.rail=rail;state.pointerId=event.pointerId;state.startX=event.clientX;state.startScroll=rail.scrollLeft;state.dragging=false;
      rail.classList.add('is-ui-pointerdown');
    }

    function pointerMove(event){
      if(!dragEnabled()||!state.rail||state.pointerId===null||event.pointerId!==state.pointerId)return;
      const dx=event.clientX-state.startX;
      if(!state.dragging&&Math.abs(dx)<threshold())return;
      if(!state.dragging){
        state.dragging=true;
        state.rail.classList.add('is-ui-dragging');
        try{state.rail.setPointerCapture(state.pointerId);}catch{}
      }
      state.rail.scrollLeft=state.startScroll-dx;
      if(event.cancelable)event.preventDefault();
    }

    function finish(event){
      if(!state.rail||state.pointerId===null||event.pointerId!==state.pointerId)return;
      const rail=state.rail;const didDrag=state.dragging;
      rail.classList.remove('is-ui-pointerdown','is-ui-dragging');
      try{rail.releasePointerCapture(state.pointerId);}catch{}
      state.rail=null;state.pointerId=null;state.dragging=false;
      if(didDrag){state.suppressRail=rail;state.suppressUntil=performance.now()+suppressMs();}
    }

    function preventNativeDrag(event){if(dragEnabled()&&railFrom(event.target))event.preventDefault();}
    function preventSelection(event){if(dragEnabled()&&state.dragging&&railFrom(event.target))event.preventDefault();}
    function suppressClick(event){
      if(!state.suppressRail||performance.now()>state.suppressUntil){state.suppressRail=null;return;}
      if(railFrom(event.target)!==state.suppressRail)return;
      event.preventDefault();event.stopImmediatePropagation();state.suppressRail=null;
    }

    root.addEventListener('pointerdown',pointerDown,true);
    root.addEventListener('pointermove',pointerMove,{capture:true,passive:false});
    root.addEventListener('pointerup',finish,true);
    root.addEventListener('pointercancel',finish,true);
    root.addEventListener('dragstart',preventNativeDrag,true);
    root.addEventListener('selectstart',preventSelection,true);
    root.addEventListener('click',suppressClick,true);

    const api={state};railState.set(root,api);return api;
  }

  function configureReadingProgress(root){
    const enabled=root.dataset.uiCapabilityReadingProgress==='true';
    let state=progressState.get(root);

    if(!enabled){
      if(state){
        window.removeEventListener('scroll',state.update);
        window.removeEventListener('resize',state.update);
        state.node.remove();
        progressState.delete(root);
      }
      return;
    }

    if(!state){
      const node=document.createElement('div');
      node.className='platform-reading-progress';
      node.setAttribute('aria-hidden','true');
      node.innerHTML='<i></i>';
      root.prepend(node);
      const update=()=>{
        const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
        const ratio=max>0?Math.min(1,Math.max(0,window.scrollY/max)):1;
        node.style.setProperty('--ui-reading-progress',String(ratio));
      };
      state={node,update};
      progressState.set(root,state);
      window.addEventListener('scroll',update,{passive:true});
      window.addEventListener('resize',update,{passive:true});
    }
    state.update();
  }

  function apply(root,input,{snapshot}={}){
    if(!root)return {items:[],enabled:[]};
    const items=(Array.isArray(input)?input:[]).map(normalizeItem).filter(item=>item.capabilityId);
    applyCapabilityAttributes(root,items);
    installRailInteractions(root);
    configureReadingProgress(root);
    const enabled=items.filter(item=>item.enabled);
    root.dispatchEvent(new CustomEvent('platform-ui-capabilities-applied',{detail:{items,enabled,snapshotId:String(snapshot?.snapshotId||'')}}));
    return {items,enabled};
  }

  function clear(root){
    if(!root)return;
    clearCapabilityAttributes(root);
    root.dataset.uiCapabilityCount='0';
    const state=progressState.get(root);
    if(state){
      window.removeEventListener('scroll',state.update);
      window.removeEventListener('resize',state.update);
      state.node.remove();
      progressState.delete(root);
    }
  }

  window.PlatformUiCapabilityRuntime={apply,clear,normalizeItem};
})();
