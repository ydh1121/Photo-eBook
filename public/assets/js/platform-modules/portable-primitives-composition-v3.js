/* v4: restore dedicated screen-mode owner and align generic bottom sheet with the finished Photography popup. */
(function(){
  if(window.__platformPortablePrimitivesCompositionV4)return;
  window.__platformPortablePrimitivesCompositionV4=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const sharedPopupCss='public/assets/styles/platform-modules/bottom-popup-shared-v1.css';
  const repairCss='public/assets/styles/platform-modules/portable-primitives-canonical-repairs-v3.css';
  const screenCss='public/assets/styles/platform-modules/screen-mode-segmented-v1.css';
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
  if(rail)patch('horizontal-rail',{version:4,ownerFiles:uniq([...(rail.ownerFiles||[]),repairCss,ownerJs])});

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
          <header class="platform-bottom-sheet__head"><div>${props.eyebrow?`<small>${e(props.eyebrow)}</small>`:''}<h3>${e(props.title||'하단 패널')}</h3>${props.description?`<p>${e(props.description)}</p>`:''}</div><button type="button" data-bottom-sheet-close aria-label="닫기">×</button></header>
          ${items.length?`<div class="platform-bottom-sheet__items">${items.map(item=>`<article data-bottom-sheet-item="${a(item.id)}">${item.label?`<small>${e(item.label)}</small>`:''}<strong>${e(item.title)}</strong>${item.description?`<p>${e(item.description)}</p>`:''}</article>`).join('')}</div>`:'<div class="platform-bottom-sheet__items"></div>'}
          ${(props.primaryAction?.label||props.secondaryAction?.label)?`<footer class="platform-bottom-sheet__actions">${props.secondaryAction?.label?`<button type="button" data-bottom-sheet-action="secondary" data-action-type="${a(secondary.type)}" data-action-value="${a(secondary.value)}" data-action-new-tab="${secondary.newTab}">${e(props.secondaryAction.label)}</button>`:''}${props.primaryAction?.label?`<button type="button" class="is-primary" data-bottom-sheet-action="primary" data-action-type="${a(primary.type)}" data-action-value="${a(primary.value)}" data-action-new-tab="${primary.newTab}">${e(props.primaryAction.label)}</button>`:''}</footer>`:''}
        </section>
      </div>
    </section>`;
  }

  function hydrateBottomSheet(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="bottom-sheet"]')?host:host.querySelector?.('[data-platform-module="bottom-sheet"]');
    if(!module||module.dataset.platformBottomSheetBoundV4==='true')return;
    module.dataset.platformBottomSheetBoundV4='true';
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

    let pointerId=null,startY=0,lastY=0,lastTime=0,dragY=0;
    const down=event=>{
      if(!handle||!panel||event.button!==0)return;
      pointerId=event.pointerId;startY=lastY=event.clientY;lastTime=performance.now();dragY=0;
      panel.classList.add('is-dragging');
      try{handle.setPointerCapture(pointerId);}catch{}
      if(event.cancelable)event.preventDefault();
    };
    const move=event=>{
      if(pointerId===null||event.pointerId!==pointerId||!panel)return;
      dragY=Math.max(0,event.clientY-startY);
      panel.style.setProperty('--drag-y',`${dragY}px`);
      lastY=event.clientY;lastTime=performance.now();
      if(event.cancelable)event.preventDefault();
    };
    const finish=event=>{
      if(pointerId===null||event.pointerId!==pointerId||!panel)return;
      const now=performance.now();
      const dt=Math.max(1,now-lastTime);
      const velocity=Math.max(0,(event.clientY-lastY)/dt);
      try{handle?.releasePointerCapture(pointerId);}catch{}
      pointerId=null;panel.classList.remove('is-dragging');
      if(dragY>90||velocity>.65)setOpen(false);
      else{dragY=0;panel.style.setProperty('--drag-y','0px');}
    };
    handle?.addEventListener('pointerdown',down,{passive:false});
    handle?.addEventListener('pointermove',move,{passive:false});
    handle?.addEventListener('pointerup',finish);
    handle?.addEventListener('pointercancel',finish);

    setOpen(props.open!==false,{immediate:true});
    return {api:{open(){return setOpen(true);},close(){return setOpen(false);},toggle(){return setOpen(module.dataset.open!=='true');},isOpen(){return module.dataset.open==='true';}},cleanup(){clearTimeout(closeTimer);module.removeEventListener('click',click);handle?.removeEventListener('pointerdown',down);handle?.removeEventListener('pointermove',move);handle?.removeEventListener('pointerup',finish);handle?.removeEventListener('pointercancel',finish);}};
  }

  const sheet=registry.get('bottom-sheet');
  if(sheet)patch('bottom-sheet',{version:4,ownerFiles:uniq([...(sheet.ownerFiles||[]),sharedPopupCss,repairCss,ownerJs]),render:renderBottomSheet,hydrate:hydrateBottomSheet});

  function normalizeMode(value){return ['light','dark','system'].includes(String(value||''))?String(value):'light';}
  function resolveMode(value){const mode=normalizeMode(value);return mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;}
  function renderScreenMode(props={}){
    const mode=normalizeMode(props.mode),title=String(props.title||'화면 모드'),description=String(props.description||'화이트, 다크 또는 기기 설정에 맞춰 표시합니다.');
    const options=[['light','화이트'],['dark','다크'],['system','시스템']];
    return `<section class="platform-screen-mode" data-platform-module="screen-mode-selector" data-screen-mode="${a(mode)}"><header class="platform-screen-mode__head"><strong>${e(title)}</strong>${description?`<p>${e(description)}</p>`:''}</header><div class="platform-screen-mode__options" role="group" aria-label="${a(title)}">${options.map(([value,label])=>`<button type="button" data-screen-mode-value="${value}" aria-pressed="${mode===value?'true':'false'}">${label}</button>`).join('')}</div></section>`;
  }
  function hydrateScreenMode(host,props={}){
    const module=host.matches?.('[data-platform-module="screen-mode-selector"]')?host:host.querySelector?.('[data-platform-module="screen-mode-selector"]');
    if(!module||module.dataset.platformScreenModeBoundV4==='true')return;
    module.dataset.platformScreenModeBoundV4='true';let mode=normalizeMode(props.mode);
    const apply=value=>{mode=normalizeMode(value);const resolved=resolveMode(mode);module.dataset.screenMode=mode;module.querySelectorAll('[data-screen-mode-value]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.screenModeValue===mode)));document.documentElement.dataset.themeChoice=mode;document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved;module.dispatchEvent(new CustomEvent('platform-screen-mode-change',{bubbles:true,detail:{mode,resolved}}));return resolved;};
    const click=event=>{const button=event.target.closest?.('[data-screen-mode-value]');if(button&&module.contains(button))apply(button.dataset.screenModeValue);};
    const media=matchMedia('(prefers-color-scheme: dark)'),systemChange=()=>{if(mode==='system')apply('system');};
    module.addEventListener('click',click);media.addEventListener?.('change',systemChange);apply(mode);
    return {api:{setMode:apply,getMode:()=>mode},cleanup(){module.removeEventListener('click',click);media.removeEventListener?.('change',systemChange);}};
  }

  const screen=registry.get('screen-mode-selector');
  if(screen)patch('screen-mode-selector',{version:3,ownerFiles:uniq([...(screen.ownerFiles||[]).filter(file=>!String(file).includes('filter-chip')),screenCss,ownerJs]),render:renderScreenMode,hydrate:hydrateScreenMode});
})();
