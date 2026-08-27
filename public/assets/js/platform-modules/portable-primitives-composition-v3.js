/* v6: explicit module composition. Screen mode depends on the canonical filter-chip module instead of owning a second chip implementation. */
(function(){
  if(window.__platformPortablePrimitivesCompositionV6)return;
  window.__platformPortablePrimitivesCompositionV6=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const sharedPopupCss='public/assets/styles/platform-modules/bottom-popup-shared-v1.css';
  const repairCss='public/assets/styles/platform-modules/portable-primitives-canonical-repairs-v3.css';
  const screenCss='public/assets/styles/platform-modules/screen-mode-segmented-v1.css';
  const filterCss='public/assets/styles/platform-modules/filter-chip-rail-v1.css';
  const liquidOwner='public/assets/js/ui/liquid-controller.js';
  const ownerJs='public/assets/js/platform-modules/portable-primitives-composition-v3.js';
  const uniq=list=>[...new Set((list||[]).filter(Boolean))];
  const e=registry.escapeHtml;
  const a=registry.attr;

  function patch(id,changes={}){
    const current=registry.get(id);
    if(!current)return null;
    return registry.register({...current,...changes});
  }

  const collection=registry.get('collection-bottom-sheet');
  if(collection)patch('collection-bottom-sheet',{ownerFiles:uniq([...(collection.ownerFiles||[]),sharedPopupCss])});

  const rail=registry.get('horizontal-rail');
  if(rail)patch('horizontal-rail',{version:5,ownerFiles:uniq([...(rail.ownerFiles||[]),repairCss,ownerJs])});

  const arr=value=>Array.isArray(value)?value:[];
  function normalizeSheetItems(value){
    return arr(value).map((item,index)=>{const object=item&&typeof item==='object'?item:{};return {id:String(object.id||`item-${index+1}`),label:String(object.label||''),title:String(object.title||object.name||`항목 ${index+1}`),description:String(object.description||object.body||'')};});
  }
  function normalizeAction(value){const action=value&&typeof value==='object'?value:{};return {type:String(action.type||'none'),value:String(action.value||''),newTab:Boolean(action.newTab)};}
  function renderBottomSheet(props={}){
    const items=normalizeSheetItems(props.items);
    const primary=normalizeAction(props.primaryAction?.action);
    const secondary=normalizeAction(props.secondaryAction?.action);
    const open=props.open!==false;
    const showLauncher=props.showLauncher!==false;
    return `<section class="platform-bottom-sheet" data-platform-module="bottom-sheet" data-open="${open?'true':'false'}">
      ${showLauncher?`<button type="button" class="platform-bottom-sheet__launcher" data-bottom-sheet-open ${open?'hidden':''}>${e(props.launcherLabel||'패널 열기')}</button>`:''}
      <div class="platform-bottom-sheet__layer" ${open?'':'hidden'}>
        <button type="button" class="platform-bottom-sheet__backdrop" data-bottom-sheet-close aria-label="닫기"></button>
        <section class="platform-bottom-sheet__panel ${open?'is-open':''}" role="dialog" aria-modal="true" aria-label="${a(props.ariaLabel||props.title||'하단 패널')}">
          <div class="platform-bottom-sheet__handle-wrap" data-bottom-sheet-drag-handle><div class="platform-bottom-sheet__handle" aria-hidden="true"></div></div>
          <header class="platform-bottom-sheet__head"><div>${props.eyebrow?`<small>${e(props.eyebrow)}</small>`:''}<h3>${e(props.title||'하단 패널')}</h3></div><button type="button" data-bottom-sheet-close aria-label="닫기">×</button></header>
          ${props.description?`<p class="platform-bottom-sheet__intro">${e(props.description)}</p>`:''}
          ${items.length?`<div class="platform-bottom-sheet__items">${items.map(item=>`<article data-bottom-sheet-item="${a(item.id)}">${item.label?`<small>${e(item.label)}</small>`:''}<strong>${e(item.title)}</strong>${item.description?`<p>${e(item.description)}</p>`:''}</article>`).join('')}</div>`:'<div class="platform-bottom-sheet__items"></div>'}
          ${(props.primaryAction?.label||props.secondaryAction?.label)?`<footer class="platform-bottom-sheet__actions">${props.secondaryAction?.label?`<button type="button" data-bottom-sheet-action="secondary" data-action-type="${a(secondary.type)}" data-action-value="${a(secondary.value)}" data-action-new-tab="${secondary.newTab}">${e(props.secondaryAction.label)}</button>`:''}${props.primaryAction?.label?`<button type="button" class="is-primary" data-bottom-sheet-action="primary" data-action-type="${a(primary.type)}" data-action-value="${a(primary.value)}" data-action-new-tab="${primary.newTab}">${e(props.primaryAction.label)}</button>`:''}</footer>`:''}
        </section>
      </div>
    </section>`;
  }

  function hydrateBottomSheet(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="bottom-sheet"]')?host:host.querySelector?.('[data-platform-module="bottom-sheet"]');
    if(!module||module.dataset.platformBottomSheetBoundV5==='true')return;
    module.dataset.platformBottomSheetBoundV5='true';
    const layer=module.querySelector('.platform-bottom-sheet__layer');
    const panel=module.querySelector('.platform-bottom-sheet__panel');
    const launcher=module.querySelector('[data-bottom-sheet-open]');
    const handle=module.querySelector('[data-bottom-sheet-drag-handle]');
    let closeTimer=0;
    const setOpen=(value,{immediate=false}={})=>{
      const open=Boolean(value);
      clearTimeout(closeTimer);
      module.dataset.open=String(open);
      if(open){
        if(layer)layer.hidden=false;
        if(launcher)launcher.hidden=true;
        if(panel){panel.style.setProperty('--drag-y','0px');panel.classList.remove('is-dragging');requestAnimationFrame(()=>panel.classList.add('is-open'));}
      }else{
        if(panel){panel.style.setProperty('--drag-y','0px');panel.classList.remove('is-dragging','is-open');}
        if(launcher)launcher.hidden=false;
        const hide=()=>{if(layer&&module.dataset.open!=='true')layer.hidden=true;};
        if(immediate)hide();else closeTimer=setTimeout(hide,210);
      }
      module.dispatchEvent(new CustomEvent('platform-bottom-sheet-state',{bubbles:true,detail:{open}}));
      return open;
    };
    const click=event=>{
      const openButton=event.target.closest?.('[data-bottom-sheet-open]');if(openButton){setOpen(true);return;}
      const closeButton=event.target.closest?.('[data-bottom-sheet-close]');if(closeButton){if(closeButton.classList.contains('platform-bottom-sheet__backdrop')&&props.dismissOnBackdrop===false)return;setOpen(false);return;}
      const actionButton=event.target.closest?.('[data-bottom-sheet-action]');if(!actionButton)return;
      const slot=actionButton.dataset.bottomSheetAction||'';
      const action={type:actionButton.dataset.actionType||'none',value:actionButton.dataset.actionValue||'',newTab:actionButton.dataset.actionNewTab==='true'};
      if(action.type==='none'){setOpen(false);module.dispatchEvent(new CustomEvent('platform-bottom-sheet-action',{bubbles:true,detail:{slot,action,closed:true}}));return;}
      const runtime=window.PlatformModuleActionRuntime;
      if(runtime?.execute)runtime.execute(module,action,context);else module.dispatchEvent(new CustomEvent('platform-bottom-sheet-action',{bubbles:true,detail:{slot,action}}));
    };
    module.addEventListener('click',click);

    let dragging=false,startY=0,delta=0,pointerId=null;
    const begin=y=>{if(!panel)return;dragging=true;startY=y;delta=0;panel.classList.add('is-dragging');};
    const move=y=>{if(!dragging||!panel)return;delta=Math.max(0,y-startY);panel.style.setProperty('--drag-y',`${delta}px`);};
    const end=()=>{
      if(!dragging||!panel)return;
      dragging=false;panel.classList.remove('is-dragging');
      const shouldClose=delta>86;
      delta=0;
      if(shouldClose)setOpen(false);else panel.style.setProperty('--drag-y','0px');
    };
    const touchStart=event=>{const point=event.touches?.[0];if(point)begin(point.clientY);};
    const touchMove=event=>{const point=event.touches?.[0];if(!point)return;move(point.clientY);if(delta>0&&event.cancelable)event.preventDefault();};
    const pointerDown=event=>{if(event.pointerType==='touch'||event.button!==0)return;pointerId=event.pointerId;begin(event.clientY);try{handle?.setPointerCapture(pointerId);}catch{}};
    const pointerMove=event=>{if(pointerId===null||event.pointerId!==pointerId)return;move(event.clientY);};
    const pointerEnd=event=>{if(pointerId!==null&&event.pointerId!==pointerId)return;try{handle?.releasePointerCapture(pointerId);}catch{}pointerId=null;end();};
    handle?.addEventListener('touchstart',touchStart,{passive:true});
    handle?.addEventListener('touchmove',touchMove,{passive:false});
    handle?.addEventListener('touchend',end,{passive:true});
    handle?.addEventListener('touchcancel',end,{passive:true});
    handle?.addEventListener('pointerdown',pointerDown);
    handle?.addEventListener('pointermove',pointerMove);
    handle?.addEventListener('pointerup',pointerEnd);
    handle?.addEventListener('pointercancel',pointerEnd);

    setOpen(props.open!==false,{immediate:true});
    return {api:{open(){return setOpen(true);},close(){return setOpen(false);},toggle(){return setOpen(module.dataset.open!=='true');},isOpen(){return module.dataset.open==='true';}},cleanup(){clearTimeout(closeTimer);module.removeEventListener('click',click);handle?.removeEventListener('touchstart',touchStart);handle?.removeEventListener('touchmove',touchMove);handle?.removeEventListener('touchend',end);handle?.removeEventListener('touchcancel',end);handle?.removeEventListener('pointerdown',pointerDown);handle?.removeEventListener('pointermove',pointerMove);handle?.removeEventListener('pointerup',pointerEnd);handle?.removeEventListener('pointercancel',pointerEnd);}};
  }

  const sheet=registry.get('bottom-sheet');
  if(sheet)patch('bottom-sheet',{version:5,ownerFiles:uniq([...(sheet.ownerFiles||[]),sharedPopupCss,repairCss,ownerJs]),render:renderBottomSheet,hydrate:hydrateBottomSheet});

  /* Filter-chip owns selection state, rail drag and liquid indicator motion for every consumer. */
  const filter=registry.get('filter-chip-rail');
  if(filter){
    const baseRender=filter.render;
    const baseHydrate=filter.hydrate;
    const renderFilter=(props={},context={},helpers={})=>baseRender(props,context,helpers);
    const hydrateFilter=(host,props={},context={},helpers={})=>{
      const base=typeof baseHydrate==='function'?baseHydrate(host,props,context,helpers):null;
      const baseCleanup=typeof base==='function'?base:typeof base?.cleanup==='function'?base.cleanup:()=>{};
      const baseApi=base&&typeof base==='object'&&base.api?base.api:{};
      const module=host.matches?.('[data-platform-module="filter-chip-rail"]')?host:host.querySelector?.('[data-platform-module="filter-chip-rail"]');
      if(!module)return {api:baseApi,cleanup:baseCleanup};
      const liquid=module.querySelector('.platform-filter-chip-source--liquid');
      const attachMotion=()=>window.PhotoLiquidController?.attachFilterRail?.(liquid)||liquid?.__photoLiquidController||null;
      let motion=attachMotion();
      if(!motion)setTimeout(()=>{motion=attachMotion();},0);
      const current=()=>module.dataset.platformFilterValue||module.querySelector('[data-platform-filter-id][aria-pressed="true"]')?.dataset.platformFilterId||'all';
      const setValue=(value,{emit=false,behavior='smooth',instant=false}={})=>{
        const id=String(value||'all');
        module.dataset.platformFilterValue=id;
        module.querySelectorAll('[data-platform-filter-id]').forEach(button=>{
          const active=button.dataset.platformFilterId===id;
          button.classList.toggle('is-active',active);
          button.setAttribute('aria-pressed',String(active));
        });
        requestAnimationFrame(()=>{
          motion=attachMotion()||motion;
          motion?.update?.({instant});
          module.__platformFilterRevealActive?.({behavior});
        });
        if(emit)module.dispatchEvent(new CustomEvent('platform-filter-select',{bubbles:true,detail:{value:id,button:module.querySelector(`[data-platform-filter-id="${CSS.escape(id)}"]`)}}));
        return id;
      };
      setValue(props.activeId||current(),{emit:false,behavior:'auto',instant:true});
      return {api:{...baseApi,setValue,getValue:current},cleanup(){baseCleanup();}};
    };
    registry.register({...filter,version:10,ownerFiles:uniq([...(filter.ownerFiles||[]),filterCss,liquidOwner,ownerJs]),render:renderFilter,hydrate:hydrateFilter});
  }

  const SCREEN_ID='screen-mode-selector';
  const FILTER_ID='filter-chip-rail';
  function normalizeMode(value){return ['light','dark','system'].includes(String(value||''))?String(value):'light';}
  function resolveMode(value){const mode=normalizeMode(value);return mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;}
  function screenFilterProps(mode,title){
    return {items:[{id:'light',label:'화이트'},{id:'dark',label:'다크'},{id:'system',label:'시스템'}],activeId:normalizeMode(mode),ariaLabel:`${title} 선택`};
  }
  function screenCompatibilityAliases(markup){
    return String(markup||'')
      .replace('data-platform-filter-id="light"','data-platform-filter-id="light" data-screen-mode-value="light"')
      .replace('data-platform-filter-id="dark"','data-platform-filter-id="dark" data-screen-mode-value="dark"')
      .replace('data-platform-filter-id="system"','data-platform-filter-id="system" data-screen-mode-value="system"');
  }
  function renderScreenMode(props={},context={}){
    const mode=normalizeMode(props.mode);
    const title=String(props.title||'화면 모드');
    const description=String(props.description||'화이트, 다크 또는 기기 설정에 맞춰 표시합니다.');
    const filterMarkup=screenCompatibilityAliases(registry.renderDependency(SCREEN_ID,FILTER_ID,screenFilterProps(mode,title),context));
    return `<section class="platform-screen-mode" data-platform-module="screen-mode-selector" data-screen-mode="${a(mode)}"><header class="platform-screen-mode__head"><strong>${e(title)}</strong>${description?`<p>${e(description)}</p>`:''}</header><div class="platform-screen-mode__options">${filterMarkup}</div></section>`;
  }
  function hydrateScreenMode(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="screen-mode-selector"]')?host:host.querySelector?.('[data-platform-module="screen-mode-selector"]');
    if(!module||module.dataset.platformScreenModeBoundV6==='true')return;
    module.dataset.platformScreenModeBoundV6='true';
    let mode=normalizeMode(props.mode);
    const title=String(props.title||'화면 모드');
    const filterHost=module.querySelector('[data-platform-module="filter-chip-rail"]');
    const filterMount=registry.hydrateDependency(SCREEN_ID,filterHost||module,FILTER_ID,screenFilterProps(mode,title),context);
    const apply=(value,{syncFilter=true}={})=>{
      mode=normalizeMode(value);
      const resolved=resolveMode(mode);
      module.dataset.screenMode=mode;
      if(syncFilter)filterMount.api?.setValue?.(mode,{emit:false});
      document.documentElement.dataset.themeChoice=mode;
      document.documentElement.dataset.theme=resolved;
      document.documentElement.style.colorScheme=resolved;
      module.dispatchEvent(new CustomEvent('platform-screen-mode-change',{bubbles:true,detail:{mode,resolved}}));
      return resolved;
    };
    const select=event=>{
      const child=event.target?.closest?.('[data-platform-module="filter-chip-rail"]');
      if(!child||!module.contains(child))return;
      apply(event.detail?.value,{syncFilter:false});
    };
    const media=matchMedia('(prefers-color-scheme: dark)');
    const systemChange=()=>{if(mode==='system')apply('system');};
    module.addEventListener('platform-filter-select',select);
    media.addEventListener?.('change',systemChange);
    apply(mode);
    return {api:{setMode:value=>apply(value),getMode:()=>mode},cleanup(){module.removeEventListener('platform-filter-select',select);media.removeEventListener?.('change',systemChange);filterMount.cleanup?.();}};
  }

  registry.register({
    id:SCREEN_ID,
    label:'화면 모드',
    category:'display',
    status:'approved',
    source:'platform-core',
    sourceRoute:'',
    consumers:['public','library','editor'],
    dependencies:[{id:FILTER_ID,kind:'composition',required:true}],
    version:6,
    ownerFiles:[screenCss,ownerJs],
    previewProps:{title:'화면 모드',description:'화이트, 다크 또는 기기 설정에 맞춰 표시합니다.',mode:'light'},
    editorProps:{title:'화면 모드',description:'표시 모드를 선택하세요.',mode:'light'},
    render:renderScreenMode,
    hydrate:hydrateScreenMode
  });
})();
