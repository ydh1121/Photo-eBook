/* v1: Library content-default editors for portable rail, accordion and bottom-sheet primitives. */
(function(){
  if(window.__platformLibraryPrimitiveContentEditorV1)return;
  window.__platformLibraryPrimitiveContentEditorV1=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const KEY='platformModuleContentDefaultsV1';
  const IDS=new Set(['horizontal-rail','accordion','bottom-sheet']);
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const uid=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function readAll(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeAll(value){try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}}
  function active(){return $('.builder-kit-workspace')?.dataset.activeUi||'';}
  function baseline(id){return registry.clone(registry.previewProps(id)||{});}
  function content(id){return {...baseline(id),...(readAll()[id]||{})};}
  function post(id){const frame=$('#builderFrame');try{frame?.contentWindow?.postMessage({type:'platform-module-props',moduleId:id,props:content(id)},location.origin);}catch{}}
  function save(id,patch){const all=readAll();all[id]={...(all[id]||{}),...(patch||{})};writeAll(all);post(id);}
  function reset(id){const all=readAll();delete all[id];writeAll(all);post(id);requestAnimationFrame(enhance);}

  function normalizeRail(){
    const raw=content('horizontal-rail').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>({id:String(item?.id||uid('rail')),eyebrow:String(item?.eyebrow||item?.label||''),title:String(item?.title||`항목 ${index+1}`),description:String(item?.description||'')}));
  }
  function railRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="rail" data-index="${index}"><div class="builder-primitive-fields"><label><small>라벨</small><input type="text" data-rail-eyebrow="${index}" value="${esc(item.eyebrow)}"></label><label><small>제목</small><input type="text" data-rail-title="${index}" value="${esc(item.title)}"></label><label class="is-wide"><small>설명</small><textarea rows="2" data-rail-description="${index}">${esc(item.description)}</textarea></label></div><div class="builder-primitive-actions"><button type="button" data-rail-up="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-rail-down="${index}" ${index===items.length-1?'disabled':''}>↓</button><button type="button" data-rail-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function railEditor(){const value=content('horizontal-rail'),items=normalizeRail();return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="horizontal-rail"><div class="builder-control-group__title"><strong>가로 레일 내용</strong><small>Block Lab의 여러 rail 블록에서 공통으로 분리한 카드 내용입니다.</small></div><label class="builder-control"><span>제목</span><input type="text" data-rail-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-rail-root-description>${esc(value.description||'')}</textarea></label><div class="builder-primitive-list">${railRows(items)}</div><button type="button" class="builder-menu-add" data-rail-add>+ 카드 추가</button></section>`;}
  function saveRail(items=normalizeRail()){const value=content('horizontal-rail');save('horizontal-rail',{title:String(value.title||''),description:String(value.description||''),items});}

  function normalizeAccordion(){
    const raw=content('accordion').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>({id:String(item?.id||uid('accordion')),question:String(item?.question||item?.title||`질문 ${index+1}`),answer:String(item?.answer||item?.description||'')}));
  }
  function accordionRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="accordion" data-index="${index}"><div class="builder-primitive-fields"><label><small>질문</small><input type="text" data-accordion-question="${index}" value="${esc(item.question)}"></label><label class="is-wide"><small>답변</small><textarea rows="3" data-accordion-answer="${index}">${esc(item.answer)}</textarea></label></div><div class="builder-primitive-actions"><button type="button" data-accordion-up="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-accordion-down="${index}" ${index===items.length-1?'disabled':''}>↓</button><button type="button" data-accordion-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function accordionEditor(){const value=content('accordion'),items=normalizeAccordion();return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="accordion"><div class="builder-control-group__title"><strong>아코디언 내용</strong><small>Block Lab FAQ 후보를 승인 primitive로 승격한 내용 편집기입니다.</small></div><label class="builder-control"><span>제목</span><input type="text" data-accordion-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-accordion-root-description>${esc(value.description||'')}</textarea></label><label class="builder-control builder-control--boolean"><span>한 번에 하나만 열기</span><input type="checkbox" data-accordion-single ${value.singleOpen===false?'':'checked'}></label><div class="builder-primitive-list">${accordionRows(items)}</div><button type="button" class="builder-menu-add" data-accordion-add>+ 질문 추가</button></section>`;}

  function normalizeSheet(){
    const raw=content('bottom-sheet').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>({id:String(item?.id||uid('sheet')),label:String(item?.label||''),title:String(item?.title||`항목 ${index+1}`),description:String(item?.description||'')}));
  }
  function sheetAction(){const value=content('bottom-sheet'),primary=value.primaryAction&&typeof value.primaryAction==='object'?value.primaryAction:{},action=primary.action&&typeof primary.action==='object'?primary.action:{};return {label:String(primary.label||'확인'),type:String(action.type||'none'),value:String(action.value||'')};}
  function sheetRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="sheet" data-index="${index}"><div class="builder-primitive-fields"><label><small>라벨</small><input type="text" data-sheet-label="${index}" value="${esc(item.label)}"></label><label><small>제목</small><input type="text" data-sheet-title="${index}" value="${esc(item.title)}"></label><label class="is-wide"><small>설명</small><textarea rows="2" data-sheet-description="${index}">${esc(item.description)}</textarea></label></div><div class="builder-primitive-actions"><button type="button" data-sheet-up="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-sheet-down="${index}" ${index===items.length-1?'disabled':''}>↓</button><button type="button" data-sheet-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function sheetEditor(){const value=content('bottom-sheet'),items=normalizeSheet(),action=sheetAction();return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="bottom-sheet"><div class="builder-control-group__title"><strong>하단 시트 내용</strong><small>사진의 내 모음 기능과 분리된 범용 overlay primitive입니다.</small></div><label class="builder-control"><span>제목</span><input type="text" data-sheet-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-sheet-root-description>${esc(value.description||'')}</textarea></label><div class="builder-primitive-list">${sheetRows(items)}</div><button type="button" class="builder-menu-add" data-sheet-add>+ 항목 추가</button><div class="builder-primitive-action-editor"><strong>주요 버튼</strong><label><small>버튼명</small><input type="text" data-sheet-action-label value="${esc(action.label)}"></label><label><small>동작</small><select data-sheet-action-type><option value="none" ${action.type==='none'?'selected':''}>동작 없음</option><option value="click-target" ${action.type==='click-target'?'selected':''}>대상 클릭</option><option value="scroll-to" ${action.type==='scroll-to'?'selected':''}>영역으로 스크롤</option><option value="navigate" ${action.type==='navigate'?'selected':''}>URL 이동</option><option value="custom-event" ${action.type==='custom-event'?'selected':''}>커스텀 이벤트</option></select></label><label class="is-wide"><small>대상 / URL / 이벤트명</small><input type="text" data-sheet-action-value value="${esc(action.value)}"></label></div></section>`;}

  function ensureReset(id,label){const footer=$('.builder-kit-inspector:not([hidden]) footer');if(!footer||footer.querySelector(`[data-primitive-reset="${id}"]`))return;const button=document.createElement('button');button.type='button';button.dataset.primitiveReset=id;button.textContent=label;footer.prepend(button);}
  function enhance(){
    const inspector=$('.builder-kit-inspector:not([hidden])');if(!inspector)return;const id=active();if(!IDS.has(id)||$(`[data-primitive-editor="${id}"]`,inspector))return;
    const body=$('.builder-library-audit-inspector__body',inspector),anchor=$('.builder-library-origin',body);if(!body||!anchor)return;
    const markup=id==='horizontal-rail'?railEditor():id==='accordion'?accordionEditor():sheetEditor();anchor.insertAdjacentHTML('afterend',markup);ensureReset(id,'내용 기본값 복원');
  }

  function patchRoot(id,patch){save(id,patch);}
  function rerenderEditor(id){const current=$(`[data-primitive-editor="${id}"]`);if(current)current.remove();requestAnimationFrame(enhance);}

  document.addEventListener('input',event=>{
    const target=event.target,id=active();if(!IDS.has(id))return;
    if(id==='horizontal-rail'){
      if(target.matches('[data-rail-root-title]')){patchRoot(id,{title:target.value});return;}
      if(target.matches('[data-rail-root-description]')){patchRoot(id,{description:target.value});return;}
      if(target.matches('[data-rail-eyebrow],[data-rail-title],[data-rail-description]')){const items=normalizeRail(),index=Number(target.dataset.railEyebrow??target.dataset.railTitle??target.dataset.railDescription);if(!items[index])return;if(target.matches('[data-rail-eyebrow]'))items[index].eyebrow=target.value;else if(target.matches('[data-rail-title]'))items[index].title=target.value;else items[index].description=target.value;save(id,{items});return;}
    }
    if(id==='accordion'){
      if(target.matches('[data-accordion-root-title]')){patchRoot(id,{title:target.value});return;}
      if(target.matches('[data-accordion-root-description]')){patchRoot(id,{description:target.value});return;}
      if(target.matches('[data-accordion-question],[data-accordion-answer]')){const items=normalizeAccordion(),index=Number(target.dataset.accordionQuestion??target.dataset.accordionAnswer);if(!items[index])return;if(target.matches('[data-accordion-question]'))items[index].question=target.value;else items[index].answer=target.value;save(id,{items});return;}
    }
    if(id==='bottom-sheet'){
      if(target.matches('[data-sheet-root-title]')){patchRoot(id,{title:target.value});return;}
      if(target.matches('[data-sheet-root-description]')){patchRoot(id,{description:target.value});return;}
      if(target.matches('[data-sheet-label],[data-sheet-title],[data-sheet-description]')){const items=normalizeSheet(),index=Number(target.dataset.sheetLabel??target.dataset.sheetTitle??target.dataset.sheetDescription);if(!items[index])return;if(target.matches('[data-sheet-label]'))items[index].label=target.value;else if(target.matches('[data-sheet-title]'))items[index].title=target.value;else items[index].description=target.value;save(id,{items});return;}
      if(target.matches('[data-sheet-action-label],[data-sheet-action-value]')){const action=sheetAction();if(target.matches('[data-sheet-action-label]'))action.label=target.value;else action.value=target.value;save(id,{primaryAction:{label:action.label,action:{type:action.type,value:action.value}}});}
    }
  },true);

  document.addEventListener('change',event=>{
    const target=event.target,id=active();if(id==='accordion'&&target.matches('[data-accordion-single]'))save(id,{singleOpen:target.checked});
    if(id==='bottom-sheet'&&target.matches('[data-sheet-action-type]')){const action=sheetAction();action.type=target.value;save(id,{primaryAction:{label:action.label,action:{type:action.type,value:action.value}}});}
  },true);

  document.addEventListener('click',event=>{
    const id=active();if(!IDS.has(id))return;
    const resetButton=event.target.closest?.('[data-primitive-reset]');if(resetButton){event.preventDefault();reset(resetButton.dataset.primitiveReset);rerenderEditor(resetButton.dataset.primitiveReset);return;}
    if(id==='horizontal-rail'){
      const button=event.target.closest?.('[data-rail-add],[data-rail-remove],[data-rail-up],[data-rail-down]');if(!button)return;event.preventDefault();const items=normalizeRail();if(button.hasAttribute('data-rail-add'))items.push({id:uid('rail'),eyebrow:'',title:`항목 ${items.length+1}`,description:''});else if(button.hasAttribute('data-rail-remove')&&items.length>1)items.splice(Number(button.dataset.railRemove),1);else if(button.hasAttribute('data-rail-up')){const i=Number(button.dataset.railUp);if(i>0)[items[i-1],items[i]]=[items[i],items[i-1]];}else if(button.hasAttribute('data-rail-down')){const i=Number(button.dataset.railDown);if(i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];}save(id,{items});rerenderEditor(id);return;
    }
    if(id==='accordion'){
      const button=event.target.closest?.('[data-accordion-add],[data-accordion-remove],[data-accordion-up],[data-accordion-down]');if(!button)return;event.preventDefault();const items=normalizeAccordion();if(button.hasAttribute('data-accordion-add'))items.push({id:uid('accordion'),question:`질문 ${items.length+1}`,answer:''});else if(button.hasAttribute('data-accordion-remove')&&items.length>1)items.splice(Number(button.dataset.accordionRemove),1);else if(button.hasAttribute('data-accordion-up')){const i=Number(button.dataset.accordionUp);if(i>0)[items[i-1],items[i]]=[items[i],items[i-1]];}else if(button.hasAttribute('data-accordion-down')){const i=Number(button.dataset.accordionDown);if(i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];}save(id,{items});rerenderEditor(id);return;
    }
    if(id==='bottom-sheet'){
      const button=event.target.closest?.('[data-sheet-add],[data-sheet-remove],[data-sheet-up],[data-sheet-down]');if(!button)return;event.preventDefault();const items=normalizeSheet();if(button.hasAttribute('data-sheet-add'))items.push({id:uid('sheet'),label:'',title:`항목 ${items.length+1}`,description:''});else if(button.hasAttribute('data-sheet-remove')&&items.length>1)items.splice(Number(button.dataset.sheetRemove),1);else if(button.hasAttribute('data-sheet-up')){const i=Number(button.dataset.sheetUp);if(i>0)[items[i-1],items[i]]=[items[i],items[i-1]];}else if(button.hasAttribute('data-sheet-down')){const i=Number(button.dataset.sheetDown);if(i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];}save(id,{items});rerenderEditor(id);
    }
  },true);

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});enhance();
})();
