/* v2: complete Library content-default editors for portable primitives. */
(function(){
  if(window.__platformLibraryPrimitiveContentEditorV2)return;
  window.__platformLibraryPrimitiveContentEditorV2=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  const KEY='platformModuleContentDefaultsV1';
  const IDS=new Set(['horizontal-rail','accordion','bottom-sheet']);
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const uid=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const clone=value=>registry.clone(value);

  function readAll(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeAll(value){try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}}
  function active(){return $('.builder-kit-workspace')?.dataset.activeUi||'';}
  function baseline(id){return clone(registry.previewProps(id)||{});}
  function content(id){return {...baseline(id),...(readAll()[id]||{})};}
  function post(id){const frame=$('#builderFrame');try{frame?.contentWindow?.postMessage({type:'platform-module-props',moduleId:id,props:content(id)},location.origin);}catch{}}
  function save(id,patch){const all=readAll();all[id]={...(all[id]||{}),...(patch||{})};writeAll(all);post(id);}
  function reset(id){const all=readAll();delete all[id];writeAll(all);post(id);requestAnimationFrame(enhance);}
  function move(items,from,to){if(from<0||to<0||from>=items.length||to>=items.length)return items;[items[from],items[to]]=[items[to],items[from]];return items;}
  function splitTags(value){return String(value||'').split(',').map(item=>item.trim()).filter(Boolean);}

  function normalizeRail(){
    const raw=content('horizontal-rail').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>{
      const source=item&&typeof item==='object'?clone(item):{};
      return {...source,
        id:String(source.id||uid('rail')),
        eyebrow:String(source.eyebrow||source.label||''),
        title:String(source.title||source.name||`항목 ${index+1}`),
        description:String(source.description||source.body||''),
        tags:Array.isArray(source.tags)?source.tags.map(String):[],
        meta:String(source.meta||''),
        image:String(source.image||''),
        imageAlt:String(source.imageAlt||''),
        actionLabel:String(source.actionLabel||''),
        actionUrl:String(source.actionUrl||'')
      };
    });
  }
  function railRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="rail" data-index="${index}"><div class="builder-primitive-fields"><label><small>라벨</small><input type="text" data-rail-eyebrow="${index}" value="${esc(item.eyebrow)}"></label><label><small>제목</small><input type="text" data-rail-title="${index}" value="${esc(item.title)}"></label><label class="is-wide"><small>설명</small><textarea rows="2" data-rail-description="${index}">${esc(item.description)}</textarea></label><label class="is-wide"><small>배지 · 쉼표로 구분</small><input type="text" data-rail-tags="${index}" value="${esc(item.tags.join(', '))}"></label><label><small>메타 정보</small><input type="text" data-rail-meta="${index}" value="${esc(item.meta)}"></label><label><small>링크 문구</small><input type="text" data-rail-action-label="${index}" value="${esc(item.actionLabel)}"></label><label class="is-wide"><small>이미지 URL</small><input type="text" data-rail-image="${index}" value="${esc(item.image)}"></label><label class="is-wide"><small>이미지 설명</small><input type="text" data-rail-image-alt="${index}" value="${esc(item.imageAlt)}"></label><label class="is-wide"><small>링크 주소</small><input type="text" data-rail-action-url="${index}" value="${esc(item.actionUrl)}"></label></div><div class="builder-primitive-actions"><button type="button" data-rail-up="${index}" ${index===0?'disabled':''} aria-label="위로 이동">↑</button><button type="button" data-rail-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로 이동">↓</button><button type="button" data-rail-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function railEditor(){const value=content('horizontal-rail'),items=normalizeRail();return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="horizontal-rail"><div class="builder-control-group__title"><strong>가로 레일 내용</strong><small>카드의 배지, 이미지, 메타 정보와 링크까지 같은 모듈 데이터로 저장합니다.</small></div><label class="builder-control"><span>제목</span><input type="text" data-rail-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-rail-root-description>${esc(value.description||'')}</textarea></label><label class="builder-control"><span>접근성 이름</span><input type="text" data-rail-aria-label value="${esc(value.ariaLabel||'')}"></label><div class="builder-primitive-list">${railRows(items)}</div><button type="button" class="builder-menu-add" data-rail-add>+ 카드 추가</button></section>`;}

  function normalizeAccordion(){
    const raw=content('accordion').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>{
      const source=item&&typeof item==='object'?clone(item):{};
      return {...source,id:String(source.id||uid('accordion')),question:String(source.question||source.title||`질문 ${index+1}`),answer:String(source.answer||source.description||''),meta:String(source.meta||source.source||'')};
    });
  }
  function accordionRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="accordion" data-index="${index}"><div class="builder-primitive-fields"><label><small>질문</small><input type="text" data-accordion-question="${index}" value="${esc(item.question)}"></label><label><small>메타 정보</small><input type="text" data-accordion-meta="${index}" value="${esc(item.meta)}"></label><label class="is-wide"><small>답변</small><textarea rows="3" data-accordion-answer="${index}">${esc(item.answer)}</textarea></label></div><div class="builder-primitive-actions"><button type="button" data-accordion-up="${index}" ${index===0?'disabled':''} aria-label="위로 이동">↑</button><button type="button" data-accordion-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로 이동">↓</button><button type="button" data-accordion-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function accordionEditor(){const value=content('accordion'),items=normalizeAccordion(),openIds=Array.isArray(value.openIds)?value.openIds.join(', '):'';return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="accordion"><div class="builder-control-group__title"><strong>아코디언 내용</strong><small>질문, 답변, 기본 열림 상태와 항목별 메타 정보를 저장합니다.</small></div><label class="builder-control"><span>제목</span><input type="text" data-accordion-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-accordion-root-description>${esc(value.description||'')}</textarea></label><label class="builder-control builder-control--boolean"><span>첫 항목을 기본으로 열기</span><input type="checkbox" data-accordion-open-first ${value.openFirst?'checked':''}></label><label class="builder-control builder-control--boolean"><span>한 번에 하나만 열기</span><input type="checkbox" data-accordion-single ${value.singleOpen===false?'':'checked'}></label><label class="builder-control"><span>기본 열림 ID · 쉼표로 구분</span><input type="text" data-accordion-open-ids value="${esc(openIds)}"></label><div class="builder-primitive-list">${accordionRows(items)}</div><button type="button" class="builder-menu-add" data-accordion-add>+ 질문 추가</button></section>`;}

  function normalizeSheet(){
    const raw=content('bottom-sheet').items;
    return (Array.isArray(raw)?raw:[]).map((item,index)=>{
      const source=item&&typeof item==='object'?clone(item):{};
      return {...source,id:String(source.id||uid('sheet')),label:String(source.label||''),title:String(source.title||source.name||`항목 ${index+1}`),description:String(source.description||source.body||'')};
    });
  }
  function sheetAction(slot){
    const value=content('bottom-sheet'),entry=value?.[`${slot}Action`]&&typeof value[`${slot}Action`]==='object'?value[`${slot}Action`]:{},action=entry.action&&typeof entry.action==='object'?entry.action:{};
    return {label:String(entry.label||''),type:String(action.type||'none'),value:String(action.value||''),newTab:Boolean(action.newTab)};
  }
  function actionEditor(slot,label){const action=sheetAction(slot);return `<div class="builder-primitive-action-editor" data-sheet-action-editor="${slot}"><strong>${esc(label)}</strong><label><small>버튼명</small><input type="text" data-sheet-action-label="${slot}" value="${esc(action.label)}"></label><label><small>동작</small><select data-sheet-action-type="${slot}"><option value="none" ${action.type==='none'?'selected':''}>동작 없음</option><option value="click-target" ${action.type==='click-target'?'selected':''}>대상 클릭</option><option value="scroll-to" ${action.type==='scroll-to'?'selected':''}>영역으로 스크롤</option><option value="navigate" ${action.type==='navigate'?'selected':''}>URL 이동</option><option value="custom-event" ${action.type==='custom-event'?'selected':''}>커스텀 이벤트</option></select></label><label class="is-wide"><small>대상 / URL / 이벤트명</small><input type="text" data-sheet-action-value="${slot}" value="${esc(action.value)}"></label><label class="builder-control builder-control--boolean is-wide"><span>새 탭</span><input type="checkbox" data-sheet-action-new-tab="${slot}" ${action.newTab?'checked':''}></label></div>`;}
  function sheetRows(items){return items.map((item,index)=>`<div class="builder-primitive-row" data-primitive-row="sheet" data-index="${index}"><div class="builder-primitive-fields"><label><small>라벨</small><input type="text" data-sheet-label="${index}" value="${esc(item.label)}"></label><label><small>제목</small><input type="text" data-sheet-title="${index}" value="${esc(item.title)}"></label><label class="is-wide"><small>설명</small><textarea rows="2" data-sheet-description="${index}">${esc(item.description)}</textarea></label></div><div class="builder-primitive-actions"><button type="button" data-sheet-up="${index}" ${index===0?'disabled':''} aria-label="위로 이동">↑</button><button type="button" data-sheet-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로 이동">↓</button><button type="button" data-sheet-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div></div>`).join('');}
  function sheetEditor(){const value=content('bottom-sheet'),items=normalizeSheet();return `<section class="builder-control-group builder-primitive-editor" data-primitive-editor="bottom-sheet"><div class="builder-control-group__title"><strong>하단 시트 내용</strong><small>표시 상태, 런처, 닫기 동작과 버튼 action까지 범용 모듈 데이터로 저장합니다.</small></div><label class="builder-control"><span>상단 라벨</span><input type="text" data-sheet-eyebrow value="${esc(value.eyebrow||'')}"></label><label class="builder-control"><span>제목</span><input type="text" data-sheet-root-title value="${esc(value.title||'')}"></label><label class="builder-control"><span>설명</span><textarea rows="2" data-sheet-root-description>${esc(value.description||'')}</textarea></label><label class="builder-control"><span>접근성 이름</span><input type="text" data-sheet-aria-label value="${esc(value.ariaLabel||'')}"></label><label class="builder-control builder-control--boolean"><span>처음부터 열기</span><input type="checkbox" data-sheet-open ${value.open===false?'':'checked'}></label><label class="builder-control builder-control--boolean"><span>열기 버튼 표시</span><input type="checkbox" data-sheet-show-launcher ${value.showLauncher===false?'':'checked'}></label><label class="builder-control"><span>열기 버튼 문구</span><input type="text" data-sheet-launcher-label value="${esc(value.launcherLabel||'')}"></label><label class="builder-control builder-control--boolean"><span>바깥 영역을 눌러 닫기</span><input type="checkbox" data-sheet-dismiss-backdrop ${value.dismissOnBackdrop===false?'':'checked'}></label><div class="builder-primitive-list">${sheetRows(items)}</div><button type="button" class="builder-menu-add" data-sheet-add>+ 항목 추가</button>${actionEditor('secondary','보조 버튼')}${actionEditor('primary','주요 버튼')}</section>`;}

  function ensureReset(id,label){const footer=$('.builder-kit-inspector:not([hidden]) footer');if(!footer||footer.querySelector(`[data-primitive-reset="${id}"]`))return;const button=document.createElement('button');button.type='button';button.dataset.primitiveReset=id;button.textContent=label;footer.prepend(button);}
  function enhance(){
    const inspector=$('.builder-kit-inspector:not([hidden])');if(!inspector)return;const id=active();if(!IDS.has(id)||$(`[data-primitive-editor="${id}"]`,inspector))return;
    const body=$('.builder-library-audit-inspector__body',inspector),anchor=$('.builder-library-origin',body);if(!body||!anchor)return;
    anchor.insertAdjacentHTML('afterend',id==='horizontal-rail'?railEditor():id==='accordion'?accordionEditor():sheetEditor());ensureReset(id,'내용 기본값 복원');
  }
  function rerenderEditor(id){const current=$(`[data-primitive-editor="${id}"]`);if(current)current.remove();requestAnimationFrame(enhance);}

  function saveRailField(target){
    const items=normalizeRail();
    const index=Number(target.dataset.railEyebrow??target.dataset.railTitle??target.dataset.railDescription??target.dataset.railTags??target.dataset.railMeta??target.dataset.railImage??target.dataset.railImageAlt??target.dataset.railActionLabel??target.dataset.railActionUrl);
    if(!items[index])return;
    if(target.matches('[data-rail-eyebrow]'))items[index].eyebrow=target.value;
    else if(target.matches('[data-rail-title]'))items[index].title=target.value;
    else if(target.matches('[data-rail-description]'))items[index].description=target.value;
    else if(target.matches('[data-rail-tags]'))items[index].tags=splitTags(target.value);
    else if(target.matches('[data-rail-meta]'))items[index].meta=target.value;
    else if(target.matches('[data-rail-image]'))items[index].image=target.value;
    else if(target.matches('[data-rail-image-alt]'))items[index].imageAlt=target.value;
    else if(target.matches('[data-rail-action-label]'))items[index].actionLabel=target.value;
    else if(target.matches('[data-rail-action-url]'))items[index].actionUrl=target.value;
    save('horizontal-rail',{items});
  }
  function saveSheetAction(slot,patch){const current=sheetAction(slot),next={...current,...patch};save('bottom-sheet',{[`${slot}Action`]:{label:next.label,action:{type:next.type,value:next.value,newTab:next.newTab}}});}

  document.addEventListener('input',event=>{
    const target=event.target,id=active();if(!IDS.has(id))return;
    if(id==='horizontal-rail'){
      if(target.matches('[data-rail-root-title]')){save(id,{title:target.value});return;}
      if(target.matches('[data-rail-root-description]')){save(id,{description:target.value});return;}
      if(target.matches('[data-rail-aria-label]')){save(id,{ariaLabel:target.value});return;}
      if(target.matches('[data-rail-eyebrow],[data-rail-title],[data-rail-description],[data-rail-tags],[data-rail-meta],[data-rail-image],[data-rail-image-alt],[data-rail-action-label],[data-rail-action-url]')){saveRailField(target);return;}
    }
    if(id==='accordion'){
      if(target.matches('[data-accordion-root-title]')){save(id,{title:target.value});return;}
      if(target.matches('[data-accordion-root-description]')){save(id,{description:target.value});return;}
      if(target.matches('[data-accordion-open-ids]')){save(id,{openIds:splitTags(target.value)});return;}
      if(target.matches('[data-accordion-question],[data-accordion-answer],[data-accordion-meta]')){const items=normalizeAccordion(),index=Number(target.dataset.accordionQuestion??target.dataset.accordionAnswer??target.dataset.accordionMeta);if(!items[index])return;if(target.matches('[data-accordion-question]'))items[index].question=target.value;else if(target.matches('[data-accordion-answer]'))items[index].answer=target.value;else items[index].meta=target.value;save(id,{items});return;}
    }
    if(id==='bottom-sheet'){
      if(target.matches('[data-sheet-eyebrow]')){save(id,{eyebrow:target.value});return;}
      if(target.matches('[data-sheet-root-title]')){save(id,{title:target.value});return;}
      if(target.matches('[data-sheet-root-description]')){save(id,{description:target.value});return;}
      if(target.matches('[data-sheet-aria-label]')){save(id,{ariaLabel:target.value});return;}
      if(target.matches('[data-sheet-launcher-label]')){save(id,{launcherLabel:target.value});return;}
      if(target.matches('[data-sheet-label],[data-sheet-title],[data-sheet-description]')){const items=normalizeSheet(),index=Number(target.dataset.sheetLabel??target.dataset.sheetTitle??target.dataset.sheetDescription);if(!items[index])return;if(target.matches('[data-sheet-label]'))items[index].label=target.value;else if(target.matches('[data-sheet-title]'))items[index].title=target.value;else items[index].description=target.value;save(id,{items});return;}
      if(target.matches('[data-sheet-action-label]')){saveSheetAction(target.dataset.sheetActionLabel,{label:target.value});return;}
      if(target.matches('[data-sheet-action-value]')){saveSheetAction(target.dataset.sheetActionValue,{value:target.value});return;}
    }
  },true);

  document.addEventListener('change',event=>{
    const target=event.target,id=active();if(!IDS.has(id))return;
    if(id==='accordion'){
      if(target.matches('[data-accordion-single]'))save(id,{singleOpen:target.checked});
      else if(target.matches('[data-accordion-open-first]'))save(id,{openFirst:target.checked});
    }
    if(id==='bottom-sheet'){
      if(target.matches('[data-sheet-open]'))save(id,{open:target.checked});
      else if(target.matches('[data-sheet-show-launcher]'))save(id,{showLauncher:target.checked});
      else if(target.matches('[data-sheet-dismiss-backdrop]'))save(id,{dismissOnBackdrop:target.checked});
      else if(target.matches('[data-sheet-action-type]'))saveSheetAction(target.dataset.sheetActionType,{type:target.value});
      else if(target.matches('[data-sheet-action-new-tab]'))saveSheetAction(target.dataset.sheetActionNewTab,{newTab:target.checked});
    }
  },true);

  document.addEventListener('click',event=>{
    const id=active();if(!IDS.has(id))return;
    const resetButton=event.target.closest?.('[data-primitive-reset]');if(resetButton){event.preventDefault();reset(resetButton.dataset.primitiveReset);rerenderEditor(resetButton.dataset.primitiveReset);return;}
    if(id==='horizontal-rail'){
      const button=event.target.closest?.('[data-rail-add],[data-rail-remove],[data-rail-up],[data-rail-down]');if(!button)return;event.preventDefault();const items=normalizeRail();
      if(button.hasAttribute('data-rail-add'))items.push({id:uid('rail'),eyebrow:'',title:`항목 ${items.length+1}`,description:'',tags:[],meta:'',image:'',imageAlt:'',actionLabel:'',actionUrl:''});
      else if(button.hasAttribute('data-rail-remove')&&items.length>1)items.splice(Number(button.dataset.railRemove),1);
      else if(button.hasAttribute('data-rail-up'))move(items,Number(button.dataset.railUp),Number(button.dataset.railUp)-1);
      else if(button.hasAttribute('data-rail-down'))move(items,Number(button.dataset.railDown),Number(button.dataset.railDown)+1);
      save(id,{items});rerenderEditor(id);return;
    }
    if(id==='accordion'){
      const button=event.target.closest?.('[data-accordion-add],[data-accordion-remove],[data-accordion-up],[data-accordion-down]');if(!button)return;event.preventDefault();const items=normalizeAccordion();
      if(button.hasAttribute('data-accordion-add'))items.push({id:uid('accordion'),question:`질문 ${items.length+1}`,answer:'',meta:''});
      else if(button.hasAttribute('data-accordion-remove')&&items.length>1)items.splice(Number(button.dataset.accordionRemove),1);
      else if(button.hasAttribute('data-accordion-up'))move(items,Number(button.dataset.accordionUp),Number(button.dataset.accordionUp)-1);
      else if(button.hasAttribute('data-accordion-down'))move(items,Number(button.dataset.accordionDown),Number(button.dataset.accordionDown)+1);
      save(id,{items});rerenderEditor(id);return;
    }
    if(id==='bottom-sheet'){
      const button=event.target.closest?.('[data-sheet-add],[data-sheet-remove],[data-sheet-up],[data-sheet-down]');if(!button)return;event.preventDefault();const items=normalizeSheet();
      if(button.hasAttribute('data-sheet-add'))items.push({id:uid('sheet'),label:'',title:`항목 ${items.length+1}`,description:''});
      else if(button.hasAttribute('data-sheet-remove')&&items.length>1)items.splice(Number(button.dataset.sheetRemove),1);
      else if(button.hasAttribute('data-sheet-up'))move(items,Number(button.dataset.sheetUp),Number(button.dataset.sheetUp)-1);
      else if(button.hasAttribute('data-sheet-down'))move(items,Number(button.dataset.sheetDown),Number(button.dataset.sheetDown)+1);
      save(id,{items});rerenderEditor(id);
    }
  },true);

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  enhance();
})();