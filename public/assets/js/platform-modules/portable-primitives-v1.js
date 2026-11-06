/* v1: portable UI primitives promoted below project-specific Photography modules. */
(function(){
  if(window.__platformPortablePrimitivesV1)return;
  window.__platformPortablePrimitivesV1=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const consumers=['library','editor'];
  const ownerJs='public/assets/js/platform-modules/portable-primitives-v1.js';
  const ownerCss='public/assets/styles/platform-modules/portable-primitives-v1.css';
  const arr=value=>Array.isArray(value)?value:[];
  const e=registry.escapeHtml;
  const a=registry.attr;

  function normalizeRailItems(value){
    const source=arr(value);
    return source.map((item,index)=>{
      const object=item&&typeof item==='object'?item:{};
      return {
        id:String(object.id||`item-${index+1}`),
        eyebrow:String(object.eyebrow||object.label||''),
        title:String(object.title||object.name||`항목 ${index+1}`),
        description:String(object.description||object.body||''),
        image:String(object.image||''),
        imageAlt:String(object.imageAlt||object.title||''),
        meta:String(object.meta||''),
        tags:arr(object.tags).map(String),
        actionLabel:String(object.actionLabel||''),
        actionUrl:String(object.actionUrl||'#')
      };
    });
  }

  function renderHorizontalRail(props={},context={}){
    const items=normalizeRailItems(props.items);
    // A canonical parent can supply an escaped card renderer through runtime
    // context. JSON props never carry HTML or executable slot content.
    const renderItem=typeof context.renderItem==='function'?context.renderItem:null;
    const title=String(props.title||'');
    const description=String(props.description||'');
    const ariaLabel=a(props.ariaLabel||title||'가로 콘텐츠');
    return `<section class="platform-horizontal-rail${props.framed===false?' platform-horizontal-rail--unframed':''}" data-platform-module="horizontal-rail">
      ${(title||description)?`<header class="platform-horizontal-rail__head">${title?`<h3>${e(title)}</h3>`:''}${description?`<p>${e(description)}</p>`:''}</header>`:''}
      <div class="platform-horizontal-rail__track" role="list" tabindex="0" aria-label="${ariaLabel}">
        ${items.map((item,index)=>renderItem?`<div class="platform-horizontal-rail__slot" role="listitem" data-horizontal-rail-item="${a(item.id)}">${renderItem(arr(props.items)[index],index)}</div>`:`<article class="platform-horizontal-rail__card" role="listitem" data-horizontal-rail-item="${a(item.id)}">
          ${item.image?`<div class="platform-horizontal-rail__media"><img src="${a(item.image)}" alt="${a(item.imageAlt)}" loading="lazy" draggable="false"></div>`:''}
          <div class="platform-horizontal-rail__body">${item.eyebrow?`<small>${e(item.eyebrow)}</small>`:''}<h4>${e(item.title)}</h4>${item.description?`<p>${e(item.description)}</p>`:''}${item.tags.length?`<div class="platform-horizontal-rail__tags">${item.tags.map(tag=>`<span>${e(tag)}</span>`).join('')}</div>`:''}${item.meta?`<div class="platform-horizontal-rail__meta">${e(item.meta)}</div>`:''}${item.actionLabel?`<a href="${a(item.actionUrl)}" data-horizontal-rail-action>${e(item.actionLabel)}</a>`:''}</div>
        </article>`).join('')}
      </div>
    </section>`;
  }

  function hydrateHorizontalRail(host){
    const module=host.matches?.('[data-platform-module="horizontal-rail"]')?host:host.querySelector?.('[data-platform-module="horizontal-rail"]');
    const track=module?.querySelector('.platform-horizontal-rail__track');
    if(!module||!track||track.dataset.platformRailBound==='true')return;
    track.dataset.platformRailBound='true';
    let pointerId=null,startX=0,startScroll=0,dragging=false,suppressUntil=0;
    const threshold=5;
    const down=event=>{
      if(event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      pointerId=event.pointerId;startX=event.clientX;startScroll=track.scrollLeft;dragging=false;track.classList.add('is-pointerdown');
    };
    const move=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      const dx=event.clientX-startX;
      if(!dragging&&Math.abs(dx)<threshold)return;
      if(!dragging){dragging=true;track.classList.add('is-dragging');try{track.setPointerCapture(pointerId);}catch{}}
      track.scrollLeft=startScroll-dx;if(event.cancelable)event.preventDefault();
    };
    const finish=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      const didDrag=dragging;try{track.releasePointerCapture(pointerId);}catch{}
      pointerId=null;dragging=false;track.classList.remove('is-pointerdown','is-dragging');if(didDrag)suppressUntil=performance.now()+220;
    };
    const click=event=>{if(performance.now()<=suppressUntil&&event.target.closest?.('a,button')){event.preventDefault();event.stopImmediatePropagation();suppressUntil=0;}};
    track.addEventListener('pointerdown',down,true);track.addEventListener('pointermove',move,{capture:true,passive:false});track.addEventListener('pointerup',finish,true);track.addEventListener('pointercancel',finish,true);track.addEventListener('click',click,true);
    return ()=>{track.removeEventListener('pointerdown',down,true);track.removeEventListener('pointermove',move,true);track.removeEventListener('pointerup',finish,true);track.removeEventListener('pointercancel',finish,true);track.removeEventListener('click',click,true);};
  }

  function normalizeAccordionItems(value){
    return arr(value).map((item,index)=>{
      const object=item&&typeof item==='object'?item:{};
      return {id:String(object.id||`item-${index+1}`),question:String(object.question||object.title||`질문 ${index+1}`),answer:String(object.answer||object.description||''),meta:String(object.meta||object.source||'')};
    });
  }

  function renderAccordion(props={}){
    const items=normalizeAccordionItems(props.items);
    const title=String(props.title||'');
    const description=String(props.description||'');
    const openIds=new Set(arr(props.openIds).map(String));
    if(props.openFirst&&items[0])openIds.add(items[0].id);
    return `<section class="platform-accordion" data-platform-module="accordion" data-single-open="${props.singleOpen===false?'false':'true'}">
      ${(title||description)?`<header class="platform-accordion__head">${title?`<h3>${e(title)}</h3>`:''}${description?`<p>${e(description)}</p>`:''}</header>`:''}
      <div class="platform-accordion__list">${items.map(item=>`<details class="platform-accordion__item" data-accordion-id="${a(item.id)}" ${openIds.has(item.id)?'open':''}><summary><span>${e(item.question)}</span><i aria-hidden="true"></i></summary><div class="platform-accordion__answer"><p>${e(item.answer)}</p>${item.meta?`<small>${e(item.meta)}</small>`:''}</div></details>`).join('')}</div>
    </section>`;
  }

  function hydrateAccordion(host,props={}){
    const module=host.matches?.('[data-platform-module="accordion"]')?host:host.querySelector?.('[data-platform-module="accordion"]');
    if(!module||module.dataset.platformAccordionBound==='true')return;
    module.dataset.platformAccordionBound='true';
    const details=()=>[...module.querySelectorAll('.platform-accordion__item')];
    const toggle=event=>{
      const current=event.target;if(!(current instanceof HTMLDetailsElement)||!current.open)return;
      if(props.singleOpen!==false)details().forEach(item=>{if(item!==current)item.open=false;});
      module.dispatchEvent(new CustomEvent('platform-accordion-change',{bubbles:true,detail:{id:current.dataset.accordionId||'',open:true}}));
    };
    details().forEach(item=>item.addEventListener('toggle',toggle));
    const api={
      open(id){const target=details().find(item=>item.dataset.accordionId===String(id));if(!target)return false;if(props.singleOpen!==false)details().forEach(item=>item.open=item===target);else target.open=true;return true;},
      closeAll(){details().forEach(item=>item.open=false);},
      getOpen(){return details().filter(item=>item.open).map(item=>item.dataset.accordionId||'');}
    };
    return {api,cleanup(){details().forEach(item=>item.removeEventListener('toggle',toggle));}};
  }

  function normalizeSheetItems(value){
    return arr(value).map((item,index)=>{
      const object=item&&typeof item==='object'?item:{};
      return {id:String(object.id||`item-${index+1}`),label:String(object.label||''),title:String(object.title||object.name||`항목 ${index+1}`),description:String(object.description||object.body||'')};
    });
  }

  function normalizeAction(value){
    const action=value&&typeof value==='object'?value:{};
    return {type:String(action.type||'none'),value:String(action.value||''),newTab:Boolean(action.newTab)};
  }

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
        <section class="platform-bottom-sheet__panel" role="dialog" aria-modal="true" aria-label="${a(props.ariaLabel||props.title||'하단 패널')}">
          <div class="platform-bottom-sheet__handle" aria-hidden="true"></div>
          <header class="platform-bottom-sheet__head"><div>${props.eyebrow?`<small>${e(props.eyebrow)}</small>`:''}<h3>${e(props.title||'하단 패널')}</h3>${props.description?`<p>${e(props.description)}</p>`:''}</div><button type="button" data-bottom-sheet-close aria-label="닫기">×</button></header>
          ${items.length?`<div class="platform-bottom-sheet__items">${items.map(item=>`<article data-bottom-sheet-item="${a(item.id)}">${item.label?`<small>${e(item.label)}</small>`:''}<strong>${e(item.title)}</strong>${item.description?`<p>${e(item.description)}</p>`:''}</article>`).join('')}</div>`:''}
          ${(props.primaryAction?.label||props.secondaryAction?.label)?`<footer class="platform-bottom-sheet__actions">${props.secondaryAction?.label?`<button type="button" data-bottom-sheet-action="secondary" data-action-type="${a(secondary.type)}" data-action-value="${a(secondary.value)}" data-action-new-tab="${secondary.newTab}">${e(props.secondaryAction.label)}</button>`:''}${props.primaryAction?.label?`<button type="button" class="is-primary" data-bottom-sheet-action="primary" data-action-type="${a(primary.type)}" data-action-value="${a(primary.value)}" data-action-new-tab="${primary.newTab}">${e(props.primaryAction.label)}</button>`:''}</footer>`:''}
        </section>
      </div>
    </section>`;
  }

  function hydrateBottomSheet(host,props={},context={}){
    const module=host.matches?.('[data-platform-module="bottom-sheet"]')?host:host.querySelector?.('[data-platform-module="bottom-sheet"]');
    if(!module||module.dataset.platformBottomSheetBound==='true')return;
    module.dataset.platformBottomSheetBound='true';
    const layer=module.querySelector('.platform-bottom-sheet__layer');
    const launcher=module.querySelector('[data-bottom-sheet-open]');
    const setOpen=value=>{
      const open=Boolean(value);module.dataset.open=String(open);if(layer)layer.hidden=!open;if(launcher)launcher.hidden=open;
      module.dispatchEvent(new CustomEvent('platform-bottom-sheet-state',{bubbles:true,detail:{open}}));
      return open;
    };
    const click=event=>{
      const openButton=event.target.closest?.('[data-bottom-sheet-open]');if(openButton){setOpen(true);return;}
      const closeButton=event.target.closest?.('[data-bottom-sheet-close]');if(closeButton){if(closeButton.classList.contains('platform-bottom-sheet__backdrop')&&props.dismissOnBackdrop===false)return;setOpen(false);return;}
      const actionButton=event.target.closest?.('[data-bottom-sheet-action]');if(!actionButton)return;
      const slot=actionButton.dataset.bottomSheetAction||'';
      const action={type:actionButton.dataset.actionType||'none',value:actionButton.dataset.actionValue||'',newTab:actionButton.dataset.actionNewTab==='true'};
      if(slot==='secondary'&&action.type==='none'){setOpen(false);return;}
      const runtime=window.PlatformModuleActionRuntime;
      if(runtime?.execute)runtime.execute(module,action,context);else module.dispatchEvent(new CustomEvent('platform-bottom-sheet-action',{bubbles:true,detail:{slot,action}}));
    };
    module.addEventListener('click',click);
    const api={open(){return setOpen(true);},close(){return setOpen(false);},toggle(){return setOpen(module.dataset.open!=='true');},isOpen(){return module.dataset.open==='true';}};
    return {api,cleanup(){module.removeEventListener('click',click);}};
  }

  registry.register({
    id:'horizontal-rail',label:'가로 레일',category:'content',status:'approved',source:'block-lab-approved',sourceRoute:'/block-lab/',consumers:['public','library','editor','export'],version:2,
    ownerFiles:[ownerJs,ownerCss],
    previewProps:{title:'가로 콘텐츠',description:'카드 종류와 상관없이 같은 스크롤·드래그 동작을 재사용합니다.',items:[
      {id:'one',eyebrow:'항목 01',title:'첫 번째 카드',description:'가격, 사례, 미디어 등 다양한 카드 내용을 넣을 수 있습니다.',tags:['범용','가로 스크롤'],meta:'샘플 메타'},
      {id:'two',eyebrow:'항목 02',title:'두 번째 카드',description:'모바일은 네이티브 스크롤, PC는 마우스 드래그를 지원합니다.',tags:['모바일','PC']},
      {id:'three',eyebrow:'항목 03',title:'세 번째 카드',description:'사진용 가로 카드와 분리된 독립 primitive입니다.',tags:['재사용']},
      {id:'four',eyebrow:'항목 04',title:'네 번째 카드',description:'새 프로젝트에서는 내용만 교체해 사용할 수 있습니다.'}
    ]},
    editorProps:{title:'가로 콘텐츠',description:'카드 내용을 프로젝트에 맞게 바꾸세요.',items:[{id:'one',title:'첫 번째 카드',description:'설명을 입력하세요.'},{id:'two',title:'두 번째 카드',description:'설명을 입력하세요.'},{id:'three',title:'세 번째 카드',description:'설명을 입력하세요.'}]},
    render:renderHorizontalRail,hydrate:hydrateHorizontalRail
  });

  registry.register({
    id:'accordion',label:'아코디언',category:'content',status:'approved',source:'block-lab-approved',sourceRoute:'/block-lab/',consumers,version:1,
    ownerFiles:[ownerJs,ownerCss],
    previewProps:{title:'자주 묻는 질문',description:'Block Lab의 FAQ/Accordion 후보를 범용 모듈로 승격했습니다.',singleOpen:true,openFirst:true,items:[
      {id:'q1',question:'이 모듈은 어디에 사용할 수 있나요?',answer:'FAQ, 상세 설명, 정책 안내처럼 접고 펼치는 구조가 필요한 곳에 사용할 수 있습니다.'},
      {id:'q2',question:'한 번에 여러 항목을 열 수 있나요?',answer:'singleOpen 값을 끄면 여러 항목을 동시에 열 수 있습니다.'},
      {id:'q3',question:'사진 페이지 전용인가요?',answer:'아닙니다. 사진용 기기 연결 아코디언과 분리된 범용 primitive입니다.'}
    ]},
    editorProps:{title:'자주 묻는 질문',description:'질문과 답변을 프로젝트에 맞게 바꾸세요.',singleOpen:true,openFirst:true,items:[{id:'q1',question:'첫 번째 질문',answer:'첫 번째 답변'},{id:'q2',question:'두 번째 질문',answer:'두 번째 답변'}]},
    render:renderAccordion,hydrate:hydrateAccordion
  });

  registry.register({
    id:'bottom-sheet',label:'하단 시트',category:'overlay',status:'approved',source:'platform-core',sourceRoute:'',consumers,version:1,
    ownerFiles:[ownerJs,ownerCss,'public/assets/js/platform-modules/module-action-runtime-v1.js'],
    previewProps:{open:true,showLauncher:true,dismissOnBackdrop:true,eyebrow:'BOTTOM SHEET',title:'범용 하단 시트',description:'사진의 내 모음 팝업과 분리된 독립 primitive입니다.',items:[{id:'item-1',label:'01',title:'첫 번째 항목',description:'프로젝트마다 필요한 내용으로 교체할 수 있습니다.'},{id:'item-2',label:'02',title:'두 번째 항목',description:'FAB나 다른 버튼에서 API로 열 수 있습니다.'}],secondaryAction:{label:'닫기',action:{type:'none'}},primaryAction:{label:'확인',action:{type:'custom-event',value:'platform-bottom-sheet-confirm'}}},
    editorProps:{open:true,showLauncher:true,dismissOnBackdrop:true,title:'하단 시트',description:'내용을 입력하세요.',items:[{id:'item-1',title:'첫 번째 항목',description:'설명을 입력하세요.'}],primaryAction:{label:'확인',action:{type:'none'}}},
    render:renderBottomSheet,hydrate:hydrateBottomSheet
  });
})();
