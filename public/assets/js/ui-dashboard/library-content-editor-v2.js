/* v2: content-default editor for reusable navigation/filter/action modules. */
(function(){
  if(window.__platformLibraryContentEditorV2)return;
  window.__platformLibraryContentEditorV2=true;

  const CONTENT_KEY='platformModuleContentDefaultsV1';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const registry=window.PlatformModuleRegistry;
  if(!registry)return;

  function readAll(){try{const value=JSON.parse(localStorage.getItem(CONTENT_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeAll(value){try{localStorage.setItem(CONTENT_KEY,JSON.stringify(value));}catch{}}
  function activeModule(){return $('.builder-kit-workspace')?.dataset.activeUi||'';}
  function baseline(id){return registry.clone(registry.previewProps(id)||{});}
  function contentFor(id){return {...baseline(id),...(readAll()[id]||{})};}
  function save(id,patch,{post=true}={}){
    const all=readAll();
    all[id]={...(all[id]||{}),...(patch||{})};
    writeAll(all);
    if(post){
      const frame=$('#builderFrame');
      try{frame?.contentWindow?.postMessage({type:'platform-module-props',moduleId:id,props:contentFor(id)},location.origin);}catch{}
    }
  }
  function reset(id){
    const all=readAll();delete all[id];writeAll(all);
    const frame=$('#builderFrame');
    try{frame?.contentWindow?.postMessage({type:'platform-module-props',moduleId:id,props:baseline(id)},location.origin);}catch{}
    requestAnimationFrame(enhanceInspector);
  }
  function uid(prefix='item'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}

  function normalizeFilterItems(){
    const raw=contentFor('filter-chip-rail').items;
    const source=Array.isArray(raw)&&raw.length?raw:['전체'];
    const seen=new Set();
    return source.map((item,index)=>{
      const object=item&&typeof item==='object';
      const label=String(object?(item.label||item.value||item.name||''):item||'').trim()||`메뉴 ${index+1}`;
      let id=String(object?(item.id||item.value||''):(index===0?'all':`filter-${index}`)).trim()||uid('filter');
      if(index===0&&label==='전체')id='all';
      if(seen.has(id))id=uid('filter');seen.add(id);
      return {id,label};
    });
  }
  function currentFilterActive(items=normalizeFilterItems()){
    const requested=String(contentFor('filter-chip-rail').activeId||'all');
    return items.some(item=>item.id===requested)?requested:(items[0]?.id||'all');
  }
  function saveFilter(items,{activeId=currentFilterActive(items)}={}){
    const next=items.length?items:[{id:'all',label:'전체'}];
    const safeActive=next.some(item=>item.id===activeId)?activeId:next[0].id;
    save('filter-chip-rail',{items:next,activeId:safeActive});
  }
  function filterRows(items){
    return items.map((item,index)=>`<div class="builder-menu-row" data-menu-index="${index}" data-content-filter-id="${esc(item.id)}"><input type="text" value="${esc(item.label)}" data-menu-label="${index}" aria-label="메뉴 ${index+1}"><button type="button" data-menu-up="${index}" ${index===0?'disabled':''} aria-label="위로">↑</button><button type="button" data-menu-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로">↓</button><button type="button" data-menu-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div>`).join('');
  }
  function refreshFilterRows(){
    const list=$('.builder-kit-inspector:not([hidden]) .builder-module-content-editor .builder-menu-list');
    if(list&&activeModule()==='filter-chip-rail')list.innerHTML=filterRows(normalizeFilterItems());
  }

  function normalizeNavItems(){
    const raw=contentFor('top-chapter-navigation').items;
    const source=Array.isArray(raw)&&raw.length?raw:[];
    const seen=new Set();
    return source.map((item,index)=>{
      const object=item&&typeof item==='object';
      let id=String(object?(item.id||item.target||''):'').trim()||`section-${index+1}`;
      if(seen.has(id))id=uid('section');seen.add(id);
      const label=String(object?(item['칩']||item.label||item.title||''):item||'').trim()||`메뉴 ${index+1}`;
      return {id,label};
    });
  }
  function saveNav(items){save('top-chapter-navigation',{items:items.map(item=>({id:item.id,label:item.label}))});}
  function navRows(items){
    return items.map((item,index)=>`<div class="builder-content-nav-row" data-nav-index="${index}"><div class="builder-content-nav-fields"><label><small>표시명</small><input type="text" data-nav-label="${index}" value="${esc(item.label)}"></label><label><small>대상 ID</small><input type="text" data-nav-target="${index}" value="${esc(item.id)}" spellcheck="false"></label></div><div class="builder-content-nav-actions"><button type="button" data-nav-up="${index}" ${index===0?'disabled':''} aria-label="위로">↑</button><button type="button" data-nav-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로">↓</button><button type="button" data-nav-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');
  }
  function renderNavEditor(){
    const items=normalizeNavItems();
    return `<section class="builder-control-group builder-module-content-editor-v2" data-content-editor="top-chapter-navigation"><div class="builder-control-group__title"><strong>상단 메뉴 항목</strong><small>표시명과 이동 대상 ID를 함께 저장합니다.</small></div><div class="builder-content-nav-list">${navRows(items)}</div><button type="button" class="builder-menu-add" data-nav-add>+ 메뉴 추가</button></section>`;
  }
  function refreshNavRows(){const list=$('[data-content-editor="top-chapter-navigation"] .builder-content-nav-list');if(list)list.innerHTML=navRows(normalizeNavItems());}

  function fabContent(){
    const value=contentFor('floating-action');
    const action=value.action&&typeof value.action==='object'?value.action:{};
    return {ariaLabel:String(value.ariaLabel||'플로팅 버튼'),type:String(action.type||value.actionType||'none'),value:String(action.value??value.actionValue??''),newTab:Boolean(action.newTab??value.actionNewTab)};
  }
  function renderFabEditor(){
    const value=fabContent();
    return `<section class="builder-control-group builder-module-content-editor-v2" data-content-editor="floating-action"><div class="builder-control-group__title"><strong>클릭 동작</strong><small>새 프로젝트에서도 그대로 사용하는 범용 action contract입니다.</small></div><label class="builder-control"><span>접근성 이름</span><input type="text" data-fab-label value="${esc(value.ariaLabel)}"></label><label class="builder-control"><span>동작</span><select data-fab-action><option value="none" ${value.type==='none'?'selected':''}>동작 없음</option><option value="click-target" ${value.type==='click-target'?'selected':''}>대상 클릭</option><option value="scroll-to" ${value.type==='scroll-to'?'selected':''}>영역으로 스크롤</option><option value="navigate" ${value.type==='navigate'?'selected':''}>URL 이동</option><option value="custom-event" ${value.type==='custom-event'?'selected':''}>커스텀 이벤트</option></select></label><label class="builder-control"><span>대상 / URL / 이벤트명</span><input type="text" data-fab-value value="${esc(value.value)}" placeholder="#contact 또는 /pricing"></label><label class="builder-control builder-control--boolean"><span>새 탭</span><input type="checkbox" data-fab-new-tab ${value.newTab?'checked':''}></label></section>`;
  }
  function saveFab(){
    const root=$('[data-content-editor="floating-action"]');if(!root)return;
    const ariaLabel=$('[data-fab-label]',root)?.value.trim()||'플로팅 버튼';
    const type=$('[data-fab-action]',root)?.value||'none';
    const value=$('[data-fab-value]',root)?.value.trim()||'';
    const newTab=Boolean($('[data-fab-new-tab]',root)?.checked);
    save('floating-action',{ariaLabel,action:{type,value,newTab}});
  }

  function ensureResetButton(id,label){
    const footer=$('.builder-kit-inspector:not([hidden]) footer');if(!footer||footer.querySelector(`[data-content-v2-reset="${id}"]`))return;
    const button=document.createElement('button');button.type='button';button.dataset.contentV2Reset=id;button.textContent=label;footer.prepend(button);
  }
  function enhanceInspector(){
    const inspector=$('.builder-kit-inspector:not([hidden])');if(!inspector)return;
    const id=activeModule();
    const body=$('.builder-library-audit-inspector__body',inspector);if(!body)return;
    if(id==='top-chapter-navigation'&&!$('[data-content-editor="top-chapter-navigation"]',inspector)){
      const anchor=$('.builder-library-origin',body);anchor?.insertAdjacentHTML('afterend',renderNavEditor());ensureResetButton(id,'메뉴 기본값 복원');
    }
    if(id==='floating-action'&&!$('[data-content-editor="floating-action"]',inspector)){
      const anchor=$('.builder-library-origin',body);anchor?.insertAdjacentHTML('afterend',renderFabEditor());ensureResetButton(id,'동작 기본값 복원');
    }
    if(id==='filter-chip-rail'){
      const list=$('.builder-module-content-editor .builder-menu-list',inspector);
      if(list&&!list.dataset.contentV2){list.dataset.contentV2='true';list.innerHTML=filterRows(normalizeFilterItems());}
    }
  }

  document.addEventListener('input',event=>{
    const target=event.target;
    const id=activeModule();
    if(id==='filter-chip-rail'&&target?.matches?.('.builder-kit-inspector [data-menu-label]')){
      event.stopImmediatePropagation();
      const items=normalizeFilterItems(),index=Number(target.dataset.menuLabel);if(!items[index])return;items[index].label=target.value.trim()||`메뉴 ${index+1}`;saveFilter(items);return;
    }
    if(id==='top-chapter-navigation'&&target?.matches?.('[data-nav-label],[data-nav-target]')){
      const items=normalizeNavItems(),index=Number(target.dataset.navLabel??target.dataset.navTarget);if(!items[index])return;
      if(target.matches('[data-nav-label]'))items[index].label=target.value.trim()||`메뉴 ${index+1}`;
      else items[index].id=target.value.trim()||`section-${index+1}`;
      saveNav(items);return;
    }
    if(id==='floating-action'&&target?.matches?.('[data-fab-label],[data-fab-value]'))saveFab();
  },true);

  document.addEventListener('change',event=>{
    const target=event.target;
    if(activeModule()==='filter-chip-rail'&&target?.matches?.('.builder-kit-inspector [data-menu-label]')){event.stopImmediatePropagation();return;}
    if(activeModule()==='floating-action'&&target?.matches?.('[data-fab-action],[data-fab-new-tab]'))saveFab();
  },true);

  document.addEventListener('click',event=>{
    const target=event.target;
    const id=activeModule();
    if(id==='filter-chip-rail'&&target?.closest?.('[data-menu-add],[data-menu-remove],[data-menu-up],[data-menu-down]')){
      const button=target.closest('[data-menu-add],[data-menu-remove],[data-menu-up],[data-menu-down]');event.preventDefault();event.stopImmediatePropagation();
      const items=normalizeFilterItems();const activeId=currentFilterActive(items);
      if(button.hasAttribute('data-menu-add'))items.push({id:uid('filter'),label:`메뉴 ${items.length+1}`});
      else if(button.hasAttribute('data-menu-remove')&&items.length>1)items.splice(Number(button.dataset.menuRemove),1);
      else if(button.hasAttribute('data-menu-up')){const index=Number(button.dataset.menuUp);if(index>0)[items[index-1],items[index]]=[items[index],items[index-1]];}
      else if(button.hasAttribute('data-menu-down')){const index=Number(button.dataset.menuDown);if(index>=0&&index<items.length-1)[items[index+1],items[index]]=[items[index],items[index+1]];}
      saveFilter(items,{activeId});refreshFilterRows();return;
    }
    if(id==='top-chapter-navigation'&&target?.closest?.('[data-nav-add],[data-nav-remove],[data-nav-up],[data-nav-down]')){
      const button=target.closest('[data-nav-add],[data-nav-remove],[data-nav-up],[data-nav-down]');event.preventDefault();event.stopImmediatePropagation();
      const items=normalizeNavItems();
      if(button.hasAttribute('data-nav-add'))items.push({id:uid('section'),label:`메뉴 ${items.length+1}`});
      else if(button.hasAttribute('data-nav-remove')&&items.length>1)items.splice(Number(button.dataset.navRemove),1);
      else if(button.hasAttribute('data-nav-up')){const index=Number(button.dataset.navUp);if(index>0)[items[index-1],items[index]]=[items[index],items[index-1]];}
      else if(button.hasAttribute('data-nav-down')){const index=Number(button.dataset.navDown);if(index>=0&&index<items.length-1)[items[index+1],items[index]]=[items[index],items[index+1]];}
      saveNav(items);refreshNavRows();return;
    }
    const resetButton=target?.closest?.('[data-content-v2-reset]');if(resetButton){event.preventDefault();reset(resetButton.dataset.contentV2Reset);}
  },true);

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type!=='platform-filter-chip-selection')return;
    const items=normalizeFilterItems();const activeId=String(event.data.value||'all');if(!items.some(item=>item.id===activeId))return;
    save('filter-chip-rail',{items,activeId},{post:false});
  });

  const observer=new MutationObserver(()=>requestAnimationFrame(enhanceInspector));
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  enhanceInspector();
})();
