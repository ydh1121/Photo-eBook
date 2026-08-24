(function(){
  if(window.__platformFilterChipLiveRuntimeV3)return;
  window.__platformFilterChipLiveRuntimeV3=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const preview=new URLSearchParams(location.search).get('preview')||'';
  const stages=new WeakMap();
  const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)';
  let currentConfig=null;

  function installStyle(){
    if($('#platform-filter-chip-live-runtime-v3-style'))return;
    const style=document.createElement('style');
    style.id='platform-filter-chip-live-runtime-v3-style';
    style.textContent=`
      .platform-filter-chip-stage{position:relative;box-sizing:border-box;max-width:100%;overflow:visible}
      .platform-filter-chip-stage>.collection-filters{position:relative;z-index:2;box-sizing:border-box;max-width:100%;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;overscroll-behavior-x:contain!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x!important}
      .platform-filter-chip-stage>.collection-filters::-webkit-scrollbar{display:none!important}
      .platform-filter-chip-stage>.collection-filters>.platform-filter-chip-indicator{display:none!important}
      .platform-filter-chip-float{position:absolute;z-index:8;left:0;top:0;display:none;place-items:center;box-sizing:border-box;overflow:visible;border-radius:999px;pointer-events:none;transform-origin:center;will-change:transform,width,height}
      .platform-filter-chip-float[data-family="ios-liquid"]{display:grid;color:#fff}
      .platform-filter-chip-float>.v37-liquid-skin{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,0) 34%),linear-gradient(180deg,var(--platform-chip-liquid-top,rgba(102,157,248,.94)) 0%,var(--platform-chip-liquid-mid,rgba(67,124,231,.92)) 52%,var(--platform-chip-liquid-bottom,rgba(44,91,202,.94)) 100%);box-shadow:0 5px 14px var(--platform-chip-liquid-shadow,rgba(35,82,176,.22)),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(18,58,146,.13)}
      .platform-filter-chip-float-label{position:relative;z-index:2;padding:0 1px;color:#fff;font:inherit;font-size:inherit;font-weight:inherit;white-space:nowrap;text-shadow:none}
      .collection-filter[data-platform-effective-family="ios-liquid"].is-active{background:transparent!important;border-color:transparent!important;box-shadow:none!important;color:transparent!important;text-shadow:none!important}
      .collection-filter[data-platform-effective-family="material-flat"].is-active{background:var(--platform-chip-accent,#437ce7)!important;border-color:transparent!important;box-shadow:none!important;color:#fff!important}
      .collection-filter[data-platform-effective-family="ios-flat"].is-active{background:var(--platform-chip-accent,#437ce7)!important;border-color:rgba(255,255,255,.34)!important;box-shadow:0 2px 8px color-mix(in srgb,var(--platform-chip-accent,#437ce7) 20%,transparent)!important;color:#fff!important}
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{display:grid!important;place-items:center!important;align-content:center!important;min-height:100%!important;height:100%!important;padding:32px 18px!important;overflow:visible!important}
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]>.platform-filter-chip-stage{width:min(100%,760px)!important}
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]>.platform-filter-chip-stage>.collection-filters{width:100%!important;margin:0!important}
      @media(max-width:560px){html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{padding:24px 14px!important}}
    `;
    document.head.appendChild(style);
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

  function clearGeometry(root){
    if(!root)return;
    for(const prop of ['gap','padding-top','padding-right','padding-bottom','padding-left'])root.style.removeProperty(prop);
    $$('.collection-filter',root).forEach(chip=>{
      for(const prop of ['padding-top','padding-right','padding-bottom','padding-left'])chip.style.removeProperty(prop);
    });
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

  function responseDuration(distance){
    const response=currentConfig?.response||'standard';
    if(response==='lively')return Math.round(Math.min(315,Math.max(210,205+distance*.08)));
    if(response==='calm')return Math.round(Math.min(470,Math.max(320,300+distance*.18)));
    return Math.round(Math.min(380,Math.max(255,245+distance*.10)));
  }

  function globalFamily(){return document.documentElement.dataset.platformChipFamily||currentConfig?.family||'ios-flat';}
  function effectiveFamily(chip){
    const override=String(chip?.dataset.platformChipOverride||'inherit');
    return override&&override!=='inherit'?override:globalFamily();
  }

  function syncChipFamilies(root){
    $$('.collection-filter',root).forEach(chip=>{
      const family=effectiveFamily(chip);
      chip.dataset.platformEffectiveFamily=family;
    });
  }

  function ensureStage(root){
    if(!root?.isConnected)return null;
    let stage=root.parentElement?.classList.contains('platform-filter-chip-stage')?root.parentElement:null;
    if(!stage){
      stage=document.createElement('div');
      stage.className='platform-filter-chip-stage';
      root.parentNode?.insertBefore(stage,root);
      stage.appendChild(root);
    }
    let floater=$(':scope > .platform-filter-chip-float',stage);
    if(!floater){
      floater=document.createElement('span');
      floater.className='platform-filter-chip-float';
      floater.setAttribute('aria-hidden','true');
      floater.innerHTML='<span class="v37-liquid-skin" aria-hidden="true"></span><span class="platform-filter-chip-float-label"></span>';
      stage.appendChild(floater);
    }
    root.dataset.platformChipStage='true';
    root.dataset.platformScrollOwner='photo-native';
    stages.set(root,{stage,floater,x:0,w:0,ready:false});
    return stages.get(root);
  }

  function updateFloat(root,{instant=false}={}){
    if(!root?.isConnected)return;
    const state=stages.get(root)||ensureStage(root);if(!state)return;
    syncChipFamilies(root);
    const active=$('.collection-filter.is-active',root)||$('.collection-filter',root);
    if(!active){state.floater.style.display='none';return;}
    const family=effectiveFamily(active);
    state.floater.dataset.family=family;
    if(family!=='ios-liquid'){state.floater.style.display='none';return;}
    const stageRect=state.stage.getBoundingClientRect();
    const chipRect=active.getBoundingClientRect();
    const x=chipRect.left-stageRect.left;
    const y=chipRect.top-stageRect.top;
    const w=chipRect.width,h=chipRect.height;
    if(!w||!h)return;
    const distance=Math.max(Math.abs(x-state.x),Math.abs(w-state.w));
    const duration=responseDuration(distance);
    const first=!state.ready;
    state.floater.style.display='grid';
    state.floater.style.transition=(instant||first)?'none':`transform ${duration}ms ${BREEZE},width ${duration}ms ${BREEZE},height ${duration}ms ${BREEZE}`;
    state.floater.style.width=`${w}px`;state.floater.style.height=`${h}px`;
    state.floater.style.transform=`translate3d(${x}px,${y}px,0)`;
    const label=$('.platform-filter-chip-float-label',state.floater);if(label)label.textContent=active.textContent||'';
    state.floater.style.fontSize=getComputedStyle(active).fontSize;
    state.floater.style.fontWeight=getComputedStyle(active).fontWeight;
    state.x=x;state.w=w;state.ready=true;
    if((instant||first))requestAnimationFrame(()=>{if(state.floater.isConnected)state.floater.style.transition=`transform ${duration}ms ${BREEZE},width ${duration}ms ${BREEZE},height ${duration}ms ${BREEZE}`;});
  }

  function normalizeItems(values){
    return (Array.isArray(values)?values:[]).map((value,index)=>{
      if(value&&typeof value==='object'){
        const label=String(value.label||'').trim();
        if(!label)return null;
        return {id:String(value.id||`chip-${index}`),label,family:['inherit','material-flat','ios-flat','ios-liquid'].includes(value.family)?value.family:'inherit'};
      }
      const label=String(value||'').trim();
      return label?{id:`chip-${index}`,label,family:'inherit'}:null;
    }).filter(Boolean).slice(0,16);
  }

  function applyPreviewItems(values){
    if(preview!=='filter-chip-rail')return;
    const root=$('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"] .collection-filters')||$('#collectionFilters');
    if(!root)return;
    const items=normalizeItems(values);if(!items.length)return;
    const activeId=$('.collection-filter.is-active',root)?.dataset.previewChipId||'';
    $$('.collection-filter',root).forEach(button=>button.remove());
    items.forEach((item,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className='collection-filter';button.textContent=item.label;
      button.dataset.previewChipId=item.id;button.dataset.platformChipOverride=item.family;
      if(item.id===activeId||(!activeId&&index===0))button.classList.add('is-active');
      root.appendChild(button);
    });
    if(!$('.collection-filter.is-active',root))$('.collection-filter',root)?.classList.add('is-active');
    applyGeometry(root);syncChipFamilies(root);requestAnimationFrame(()=>updateFloat(root,{instant:true}));
  }

  function bindPreviewSelection(root){
    if(preview!=='filter-chip-rail'||!root||root.dataset.platformPreviewSelectionV3==='true')return;
    root.dataset.platformPreviewSelectionV3='true';
    root.addEventListener('click',event=>{
      const button=event.target.closest?.('.collection-filter');
      if(!button||!root.contains(button))return;
      event.preventDefault();event.stopImmediatePropagation();
      $$('.collection-filter',root).forEach(chip=>chip.classList.toggle('is-active',chip===button));
      syncChipFamilies(root);requestAnimationFrame(()=>updateFloat(root));
      window.parent?.postMessage({type:'platform-filter-chip-selection',capabilityId:'filter-chip-rail',id:button.dataset.previewChipId||'',family:button.dataset.platformChipOverride||'inherit'},location.origin);
    },true);
  }

  function prepareRoot(root){
    if(!root?.isConnected)return;
    const state=ensureStage(root);if(!state)return;
    bindPreviewSelection(root);applyGeometry(root);syncChipFamilies(root);
    if(root.dataset.platformStageBound!=='true'){
      root.dataset.platformStageBound='true';
      root.addEventListener('scroll',()=>requestAnimationFrame(()=>updateFloat(root,{instant:true})),{passive:true});
      const classObserver=new MutationObserver(records=>{
        if(records.some(record=>record.target.matches?.('.collection-filter')&&record.attributeName==='class'))requestAnimationFrame(()=>updateFloat(root));
      });
      classObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['class','data-platform-chip-override']});
      if('ResizeObserver'in window)new ResizeObserver(()=>updateFloat(root,{instant:true})).observe(root);
    }
    requestAnimationFrame(()=>updateFloat(root,{instant:true}));
    if(preview==='filter-chip-rail'){
      const previewRoot=$('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]');
      if(previewRoot&&!previewRoot.dataset.liveReady){previewRoot.dataset.liveReady='true';window.parent?.postMessage({type:'platform-filter-chip-live-ready',capabilityId:'filter-chip-rail'},location.origin);}
    }
  }

  function prepareAll(){$$('.collection-filters').forEach(prepareRoot);}
  function reset(){currentConfig=null;$$('.collection-filters').forEach(root=>{clearGeometry(root);syncChipFamilies(root);updateFloat(root,{instant:true});});}
  function apply(config){currentConfig=config&&typeof config==='object'?{...config}:null;$$('.collection-filters').forEach(root=>{clearGeometry(root);applyGeometry(root,currentConfig);prepareRoot(root);});}

  function bootstrapFromParent(){
    try{
      if(window.parent===window)return;
      const all=JSON.parse(window.parent.localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}');
      apply(all&&typeof all==='object'&&all['filter-chip-rail']?all['filter-chip-rail']:null);
    }catch{}
  }

  installStyle();
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-filter-chip-preview-items'){applyPreviewItems(data.items||data.labels);return;}
    if(data.capabilityId!=='filter-chip-rail')return;
    if(data.type==='platform-ui-reset'){reset();requestAnimationFrame(reset);}
    else if(data.type==='platform-ui-config'){
      apply(data.config||{});
      requestAnimationFrame(()=>apply(data.config||{}));
      setTimeout(()=>apply(data.config||{}),40);
    }
  });

  new MutationObserver(records=>{
    if(!records.some(record=>record.addedNodes.length||record.removedNodes.length))return;
    requestAnimationFrame(prepareAll);
  }).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',()=>$$('.collection-filters').forEach(root=>updateFloat(root,{instant:true})),{passive:true});
  [0,90,260,620].forEach(delay=>setTimeout(()=>{bootstrapFromParent();prepareAll();},delay));
})();
