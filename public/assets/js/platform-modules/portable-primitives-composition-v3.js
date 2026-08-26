/* v3: compose portable modules from shared canonical owners instead of Library-only skins. */
(function(){
  if(window.__platformPortablePrimitivesCompositionV3)return;
  window.__platformPortablePrimitivesCompositionV3=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const sharedPopupCss='public/assets/styles/platform-modules/bottom-popup-shared-v1.css';
  const repairCss='public/assets/styles/platform-modules/portable-primitives-canonical-repairs-v3.css';
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
  if(collection){
    patch('collection-bottom-sheet',{ownerFiles:uniq([...(collection.ownerFiles||[]),sharedPopupCss])});
  }

  const rail=registry.get('horizontal-rail');
  if(rail){
    patch('horizontal-rail',{version:3,ownerFiles:uniq([...(rail.ownerFiles||[]),repairCss,ownerJs])});
  }

  function hydrateBottomSheet(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="bottom-sheet"]')?host:host.querySelector?.('[data-platform-module="bottom-sheet"]');
    if(!module||module.dataset.platformBottomSheetBoundV3==='true')return;
    module.dataset.platformBottomSheetBoundV3='true';
    const layer=module.querySelector('.platform-bottom-sheet__layer');
    const launcher=module.querySelector('[data-bottom-sheet-open]');
    const setOpen=value=>{
      const open=Boolean(value);
      module.dataset.open=String(open);
      if(layer)layer.hidden=!open;
      if(launcher)launcher.hidden=open;
      module.dispatchEvent(new CustomEvent('platform-bottom-sheet-state',{bubbles:true,detail:{open}}));
      return open;
    };
    const click=event=>{
      const openButton=event.target.closest?.('[data-bottom-sheet-open]');
      if(openButton){setOpen(true);return;}
      const closeButton=event.target.closest?.('[data-bottom-sheet-close]');
      if(closeButton){
        if(closeButton.classList.contains('platform-bottom-sheet__backdrop')&&props.dismissOnBackdrop===false)return;
        setOpen(false);return;
      }
      const actionButton=event.target.closest?.('[data-bottom-sheet-action]');
      if(!actionButton)return;
      const slot=actionButton.dataset.bottomSheetAction||'';
      const action={type:actionButton.dataset.actionType||'none',value:actionButton.dataset.actionValue||'',newTab:actionButton.dataset.actionNewTab==='true'};
      if(action.type==='none'){
        setOpen(false);
        module.dispatchEvent(new CustomEvent('platform-bottom-sheet-action',{bubbles:true,detail:{slot,action,closed:true}}));
        return;
      }
      const runtime=window.PlatformModuleActionRuntime;
      if(runtime?.execute)runtime.execute(module,action,context);
      else module.dispatchEvent(new CustomEvent('platform-bottom-sheet-action',{bubbles:true,detail:{slot,action}}));
    };
    module.addEventListener('click',click);
    return {api:{open(){return setOpen(true);},close(){return setOpen(false);},toggle(){return setOpen(module.dataset.open!=='true');},isOpen(){return module.dataset.open==='true';}},cleanup(){module.removeEventListener('click',click);}};
  }

  const sheet=registry.get('bottom-sheet');
  if(sheet){
    patch('bottom-sheet',{
      version:3,
      ownerFiles:uniq([...(sheet.ownerFiles||[]),sharedPopupCss,repairCss,ownerJs]),
      hydrate:hydrateBottomSheet
    });
  }

  function normalizeMode(value){return ['light','dark','system'].includes(String(value||''))?String(value):'light';}
  function resolveMode(value){const mode=normalizeMode(value);return mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;}
  function renderScreenMode(props={}){
    const title=String(props.title||'화면 모드');
    const description=String(props.description||'화이트, 다크 또는 기기 설정에 맞춰 표시합니다.');
    return `<section class="platform-screen-mode-composed" data-platform-module="screen-mode-selector" data-screen-mode="${a(normalizeMode(props.mode))}">
      <header class="platform-screen-mode-composed__head"><strong>${e(title)}</strong>${description?`<p>${e(description)}</p>`:''}</header>
      <div class="platform-screen-mode-composed__filter" data-screen-mode-filter-host></div>
    </section>`;
  }
  function hydrateScreenMode(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="screen-mode-selector"]')?host:host.querySelector?.('[data-platform-module="screen-mode-selector"]');
    const filterHost=module?.querySelector('[data-screen-mode-filter-host]');
    if(!module||!filterHost||module.dataset.platformScreenModeBoundV3==='true')return;
    module.dataset.platformScreenModeBoundV3='true';
    let mode=normalizeMode(props.mode);
    const consumer=['library','editor','public'].includes(context.consumer)?context.consumer:'library';
    const filterProps={
      items:[{id:'light',label:'화이트'},{id:'dark',label:'다크'},{id:'system',label:'시스템'}],
      activeId:mode,
      ariaLabel:'화면 모드'
    };
    let nested=null;
    try{nested=registry.mount(filterHost,'filter-chip-rail',filterProps,{consumer});}catch(error){filterHost.textContent=String(error?.message||error);}

    const apply=value=>{
      mode=normalizeMode(value);
      const resolved=resolveMode(mode);
      module.dataset.screenMode=mode;
      document.documentElement.dataset.themeChoice=mode;
      document.documentElement.dataset.theme=resolved;
      document.documentElement.style.colorScheme=resolved;
      filterHost.querySelectorAll('[data-platform-filter-id]').forEach(button=>{
        const active=button.dataset.platformFilterId===mode;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      module.dispatchEvent(new CustomEvent('platform-screen-mode-change',{bubbles:true,detail:{mode,resolved}}));
      return resolved;
    };
    const select=event=>{
      const value=event.detail?.value;
      if(value)apply(value);
    };
    const media=matchMedia('(prefers-color-scheme: dark)');
    const systemChange=()=>{if(mode==='system')apply('system');};
    filterHost.addEventListener('platform-filter-select',select);
    media.addEventListener?.('change',systemChange);
    apply(mode);
    return {api:{setMode:apply,getMode:()=>mode},cleanup(){filterHost.removeEventListener('platform-filter-select',select);media.removeEventListener?.('change',systemChange);nested?.cleanup?.();}};
  }

  const screen=registry.get('screen-mode-selector');
  const filter=registry.get('filter-chip-rail');
  if(screen&&filter){
    patch('screen-mode-selector',{
      version:2,
      ownerFiles:uniq([...(screen.ownerFiles||[]),...(filter.ownerFiles||[]),repairCss,ownerJs]),
      render:renderScreenMode,
      hydrate:hydrateScreenMode
    });
  }
})();
