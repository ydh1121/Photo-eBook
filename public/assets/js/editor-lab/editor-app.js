(function(){
  const registry=window.PlatformBlockRegistry;
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const samples=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];
  if(!registry||!manifest)return;

  const STORAGE_KEY='platformEditorLabDraftV1';
  const root=document.querySelector('.editor-lab');
  const canvas=document.querySelector('#editorCanvas');
  const library=document.querySelector('#editorLibraryList');
  const inspector=document.querySelector('#editorInspector');
  const titleInput=document.querySelector('#editorPageTitle');
  const countNode=document.querySelector('#editorBlockCount');
  const searchInput=document.querySelector('#editorLibrarySearch');
  if(!root||!canvas||!library||!inspector)return;

  const sampleMap=new Map(samples.map(item=>[item.type,item]));
  const labels={
    eyebrow:'상단 라벨',title:'제목',description:'설명',image:'이미지 URL',imageAlt:'이미지 설명',facts:'핵심 정보',items:'항목',label:'라벨',value:'값',note:'메모',source:'출처',tags:'태그',columns:'비교 기준',rows:'행',question:'질문',answer:'답변',pros:'장점',cons:'주의할 점',proLabel:'장점 제목',conLabel:'주의 제목',period:'기간',outcome:'결과',action:'행동',message:'문구',channel:'채널',when:'사용 상황',quote:'인용문',name:'이름',role:'직함',publisher:'발행처',url:'URL',checkedAt:'확인일',supports:'근거 범위',price:'가격',kind:'구분',deliverables:'결과물',points:'핵심 항목',actionLabel:'링크 문구',actionUrl:'링크 URL',primaryLabel:'주요 버튼',primaryUrl:'주요 링크',secondaryLabel:'보조 버튼',secondaryUrl:'보조 링크',category:'분류',meta:'보조 정보',inputs:'입력값',outputLabel:'결과 제목',outputPrefix:'앞 단위',outputSuffix:'뒤 단위',outputNote:'결과 설명',unit:'단위',min:'최솟값',step:'증가 단위',time:'시점',mission:'직접 해보기'
  };

  let selectedId=null;
  let draggedId=null;
  let past=[];
  let future=[];

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function uid(type='block'){return `${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}
  function escapeHtml(value=''){return registry.escapeHtml(value);}
  function pathAttr(path){return encodeURIComponent(JSON.stringify(path));}
  function parsePath(value){try{return JSON.parse(decodeURIComponent(value));}catch{return [];}}
  function fieldLabel(key){return labels[key]||key.replace(/_/g,' ');}

  function freshBlock(type){
    const source=sampleMap.get(type);
    const def=registry.get(type);
    const base=source?clone(source):{type,variant:def?.variants?.[0]||'default',content:{title:def?.label||type,description:''}};
    base.id=uid(type.replace(/[^a-z0-9]+/gi,'_'));
    base.type=type;
    base.variant=base.variant||def?.variants?.[0]||'default';
    base.status='candidate';
    base.enabled=true;
    base.revision={version:1,updatedAt:new Date().toISOString(),updatedBy:'editor-lab'};
    return registry.normalize(base);
  }

  function defaultState(){
    return {
      schema:'platform-editor-lab/v1',
      pageId:uid('page'),
      pageTitle:'새 분야 가이드',
      theme:'light',
      preview:'desktop',
      mode:'edit',
      blocks:['hero','section-heading','rich-text'].map(freshBlock),
      updatedAt:new Date().toISOString()
    };
  }

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||!Array.isArray(parsed.blocks))return defaultState();
      parsed.blocks=parsed.blocks.map(block=>registry.normalize(block));
      return {...defaultState(),...parsed};
    }catch{return defaultState();}
  }

  let state=loadState();
  selectedId=state.blocks[0]?.id||null;

  function snapshot(){return clone(state);}
  function save(){
    state.updatedAt=new Date().toISOString();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
  }
  function remember(){
    past.push(snapshot());
    if(past.length>50)past.shift();
    future=[];
    updateHistoryButtons();
  }
  function restore(next){
    state=clone(next);
    state.blocks=state.blocks.map(block=>registry.normalize(block));
    if(!state.blocks.some(block=>block.id===selectedId))selectedId=state.blocks[0]?.id||null;
    save();
    syncTopState();
    renderCanvas();
    renderInspector();
    updateHistoryButtons();
  }
  function undo(){if(!past.length)return;future.push(snapshot());restore(past.pop());}
  function redo(){if(!future.length)return;past.push(snapshot());restore(future.pop());}
  function updateHistoryButtons(){
    const undoButton=document.querySelector('#editorUndo');
    const redoButton=document.querySelector('#editorRedo');
    if(undoButton)undoButton.disabled=!past.length;
    if(redoButton)redoButton.disabled=!future.length;
  }

  function mutate(fn,{rerender=true,inspectorToo=true}={}){
    remember();
    fn();
    save();
    if(rerender)renderCanvas();
    if(inspectorToo)renderInspector();
  }

  function selectedBlock(){return state.blocks.find(block=>block.id===selectedId)||null;}

  function renderLibrary(){
    const query=String(searchInput?.value||'').trim().toLowerCase();
    const entries=manifest.blocks.filter(item=>{
      if(!query)return true;
      return `${item.type} ${item.label} ${item.category}`.toLowerCase().includes(query);
    });
    library.innerHTML=entries.map(item=>`<button type="button" class="editor-library-item" data-add-block="${escapeHtml(item.type)}"><span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.category)}</small></span><span>${escapeHtml(item.status)}</span></button>`).join('');
    const count=document.querySelector('#editorLibraryCount');
    if(count)count.textContent=String(entries.length);
    library.querySelectorAll('[data-add-block]').forEach(button=>button.addEventListener('click',()=>{
      const block=freshBlock(button.dataset.addBlock);
      mutate(()=>{state.blocks.push(block);selectedId=block.id;});
      requestAnimationFrame(()=>document.querySelector(`[data-editor-block="${CSS.escape(block.id)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}));
    }));
  }

  function toolbar(block,index){
    return `<div class="editor-block-toolbar">
      <span class="editor-block-toolbar__type">${escapeHtml(block.type)}</span>
      <button type="button" data-block-action="up" title="위로" ${index===0?'disabled':''}>↑</button>
      <button type="button" data-block-action="down" title="아래로" ${index===state.blocks.length-1?'disabled':''}>↓</button>
      <button type="button" data-block-action="duplicate" title="복제">복제</button>
      <button type="button" class="editor-block-delete" data-block-action="delete" title="삭제">삭제</button>
    </div>`;
  }

  function renderCanvas(){
    root.dataset.theme=state.theme;
    root.dataset.preview=state.preview;
    root.dataset.mode=state.mode;
    if(!state.blocks.length){
      canvas.innerHTML='<div class="editor-empty-canvas"><strong>아직 블록이 없습니다</strong><p>왼쪽 블록 목록에서 필요한 UI를 추가하세요.</p></div>';
    }else{
      canvas.innerHTML=state.blocks.map((block,index)=>`<section class="editor-block ${block.id===selectedId?'is-selected':''}" data-editor-block="${escapeHtml(block.id)}" draggable="${state.mode==='edit'?'true':'false'}">${toolbar(block,index)}<div class="editor-render">${registry.render(block,{editor:true})}</div></section>`).join('');
    }
    if(countNode)countNode.textContent=`${state.blocks.length}개 블록`;
    bindCanvas();
    if(typeof window.bindBlockLabEnhancements==='function')window.bindBlockLabEnhancements();
  }

  function bindCanvas(){
    canvas.querySelectorAll('[data-editor-block]').forEach(node=>{
      const id=node.dataset.editorBlock;
      node.addEventListener('click',event=>{
        if(state.mode!=='edit')return;
        if(event.target.closest('[data-block-action]'))return;
        selectedId=id;
        renderCanvas();
        renderInspector();
      });
      node.addEventListener('dragstart',event=>{
        if(state.mode!=='edit')return event.preventDefault();
        draggedId=id;
        node.classList.add('is-dragging');
        event.dataTransfer.effectAllowed='move';
        event.dataTransfer.setData('text/plain',id);
      });
      node.addEventListener('dragend',()=>{draggedId=null;node.classList.remove('is-dragging');});
      node.addEventListener('dragover',event=>{if(draggedId&&draggedId!==id)event.preventDefault();});
      node.addEventListener('drop',event=>{
        event.preventDefault();
        const sourceId=draggedId||event.dataTransfer.getData('text/plain');
        if(!sourceId||sourceId===id)return;
        const from=state.blocks.findIndex(block=>block.id===sourceId);
        const to=state.blocks.findIndex(block=>block.id===id);
        if(from<0||to<0)return;
        mutate(()=>{
          const [moved]=state.blocks.splice(from,1);
          state.blocks.splice(to,0,moved);
          selectedId=moved.id;
        });
      });
      node.querySelectorAll('[data-block-action]').forEach(button=>button.addEventListener('click',event=>{
        event.stopPropagation();
        const action=button.dataset.blockAction;
        const index=state.blocks.findIndex(block=>block.id===id);
        if(index<0)return;
        if(action==='up'&&index>0)mutate(()=>{[state.blocks[index-1],state.blocks[index]]=[state.blocks[index],state.blocks[index-1]];selectedId=id;});
        if(action==='down'&&index<state.blocks.length-1)mutate(()=>{[state.blocks[index+1],state.blocks[index]]=[state.blocks[index],state.blocks[index+1]];selectedId=id;});
        if(action==='duplicate')mutate(()=>{const copy=clone(state.blocks[index]);copy.id=uid(copy.type);copy.revision={version:1,updatedAt:new Date().toISOString(),updatedBy:'editor-lab'};state.blocks.splice(index+1,0,copy);selectedId=copy.id;});
        if(action==='delete')mutate(()=>{state.blocks.splice(index,1);selectedId=state.blocks[Math.min(index,state.blocks.length-1)]?.id||null;});
      }));
    });
  }

  function getAt(rootValue,path){return path.reduce((value,key)=>value?.[key],rootValue);}
  function setAt(rootValue,path,value){
    let target=rootValue;
    for(let i=0;i<path.length-1;i++)target=target[path[i]];
    target[path[path.length-1]]=value;
  }
  function removeAt(rootValue,path){
    const parent=getAt(rootValue,path.slice(0,-1));
    const key=path[path.length-1];
    if(Array.isArray(parent))parent.splice(Number(key),1);else if(parent&&typeof parent==='object')delete parent[key];
  }
  function addAt(rootValue,path){
    const target=getAt(rootValue,path);
    if(!Array.isArray(target))return;
    const sample=target[0];
    if(sample&&typeof sample==='object'&&!Array.isArray(sample)){
      const blank={};Object.keys(sample).forEach(key=>blank[key]=typeof sample[key]==='number'?0:Array.isArray(sample[key])?[]:typeof sample[key]==='boolean'?false:'');target.push(blank);
    }else target.push(typeof sample==='number'?0:'');
  }

  function primitiveField(value,path,key){
    const label=fieldLabel(key);
    const pathValue=pathAttr(path);
    if(typeof value==='boolean')return `<div class="editor-field"><label>${escapeHtml(label)}</label><select data-edit-path="${pathValue}" data-value-type="boolean"><option value="true" ${value?'selected':''}>표시</option><option value="false" ${!value?'selected':''}>숨김</option></select></div>`;
    if(typeof value==='number')return `<div class="editor-field"><label>${escapeHtml(label)}</label><input type="number" data-edit-path="${pathValue}" data-value-type="number" value="${escapeHtml(value)}"></div>`;
    const text=String(value??'');
    const long=text.length>70||['description','message','quote','answer','action','mission'].includes(String(key));
    return `<div class="editor-field"><label>${escapeHtml(label)}</label>${long?`<textarea data-edit-path="${pathValue}" data-value-type="string" rows="${Math.min(8,Math.max(3,Math.ceil(text.length/55)))}">${escapeHtml(text)}</textarea>`:`<input type="text" data-edit-path="${pathValue}" data-value-type="string" value="${escapeHtml(text)}">`}</div>`;
  }

  function renderEditorValue(value,path,key,depth=0){
    if(Array.isArray(value)){
      return `<fieldset class="editor-fieldset"><legend>${escapeHtml(fieldLabel(key))}</legend><div class="editor-array">${value.map((item,index)=>`<div class="editor-array-item"><div class="editor-array-item-head"><strong>${index+1}</strong><button type="button" class="editor-small-action" data-array-remove="${pathAttr([...path,index])}">삭제</button></div>${item&&typeof item==='object'&&!Array.isArray(item)?Object.entries(item).map(([childKey,childValue])=>renderEditorValue(childValue,[...path,index,childKey],childKey,depth+1)).join(''):primitiveField(item,[...path,index],String(index+1))}</div>`).join('')}</div><button type="button" class="editor-add-array" data-array-add="${pathAttr(path)}">항목 추가</button></fieldset>`;
    }
    if(value&&typeof value==='object'){
      return `<fieldset class="editor-fieldset"><legend>${escapeHtml(fieldLabel(key))}</legend>${Object.entries(value).map(([childKey,childValue])=>renderEditorValue(childValue,[...path,childKey],childKey,depth+1)).join('')}</fieldset>`;
    }
    return primitiveField(value,path,key);
  }

  function renderInspector(){
    const block=selectedBlock();
    if(!block){inspector.innerHTML='<p class="editor-empty">편집할 블록을 선택하세요.</p>';return;}
    const def=registry.get(block.type);
    const manifestEntry=registry.getManifestEntry(block.type);
    inspector.innerHTML=`
      <div class="editor-inspector-meta"><strong>${escapeHtml(def?.label||block.type)}</strong><span>${escapeHtml(block.type)} · ${escapeHtml(manifestEntry?.status||'unknown')}</span></div>
      <div class="editor-field"><label>Variant</label><select data-edit-variant>${(def?.variants||[]).map(variant=>`<option value="${escapeHtml(variant)}" ${variant===block.variant?'selected':''}>${escapeHtml(variant)}</option>`).join('')}</select></div>
      ${Object.entries(block.content||{}).map(([key,value])=>renderEditorValue(value,['content',key],key)).join('')}
      <div class="editor-inspector-actions"><button type="button" data-inspector-action="duplicate">블록 복제</button><button type="button" class="danger" data-inspector-action="delete">블록 삭제</button></div>`;
    bindInspector();
  }

  function bindInspector(){
    const block=selectedBlock();if(!block)return;
    inspector.querySelector('[data-edit-variant]')?.addEventListener('change',event=>mutate(()=>{block.variant=event.target.value;},{inspectorToo:false}));
    inspector.querySelectorAll('[data-edit-path]').forEach(field=>field.addEventListener('change',()=>{
      const path=parsePath(field.dataset.editPath);
      let value=field.value;
      if(field.dataset.valueType==='number')value=Number(value||0);
      if(field.dataset.valueType==='boolean')value=value==='true';
      mutate(()=>setAt(block,path,value),{inspectorToo:false});
    }));
    inspector.querySelectorAll('[data-array-remove]').forEach(button=>button.addEventListener('click',()=>{
      const path=parsePath(button.dataset.arrayRemove);mutate(()=>removeAt(block,path));
    }));
    inspector.querySelectorAll('[data-array-add]').forEach(button=>button.addEventListener('click',()=>{
      const path=parsePath(button.dataset.arrayAdd);mutate(()=>addAt(block,path));
    }));
    inspector.querySelectorAll('[data-inspector-action]').forEach(button=>button.addEventListener('click',()=>{
      const index=state.blocks.findIndex(item=>item.id===block.id);if(index<0)return;
      if(button.dataset.inspectorAction==='duplicate')mutate(()=>{const copy=clone(block);copy.id=uid(copy.type);state.blocks.splice(index+1,0,copy);selectedId=copy.id;});
      if(button.dataset.inspectorAction==='delete')mutate(()=>{state.blocks.splice(index,1);selectedId=state.blocks[Math.min(index,state.blocks.length-1)]?.id||null;});
    }));
  }

  function syncTopState(){
    if(titleInput)titleInput.value=state.pageTitle;
    root.dataset.theme=state.theme;root.dataset.preview=state.preview;root.dataset.mode=state.mode;
    document.querySelectorAll('[data-editor-theme]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.editorTheme===state.theme?'true':'false'));
    document.querySelectorAll('[data-editor-preview]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.editorPreview===state.preview?'true':'false'));
    document.querySelectorAll('[data-editor-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.editorMode===state.mode?'true':'false'));
  }

  function exportDraft(){
    const payload={...state,exportedAt:new Date().toISOString(),validation:state.blocks.map(block=>({id:block.id,type:block.type,result:registry.validateUsage(block,{production:false})})).map(item=>({id:item.id,type:item.type,ok:item.result.ok,errors:item.result.errors,warnings:item.result.warnings}))};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`platform-page-draft-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  async function importDraft(file){
    try{
      const parsed=JSON.parse(await file.text());
      if(!parsed||!Array.isArray(parsed.blocks))throw new Error('blocks 배열이 없습니다.');
      const blocks=parsed.blocks.map(block=>registry.normalize(block));
      const invalid=blocks.flatMap(block=>registry.validateUsage(block,{production:false}).errors);
      if(invalid.length)throw new Error(invalid.slice(0,3).join('\n'));
      remember();
      state={...defaultState(),...parsed,blocks,updatedAt:new Date().toISOString()};
      selectedId=blocks[0]?.id||null;future=[];save();syncTopState();renderCanvas();renderInspector();updateHistoryButtons();
    }catch(error){alert(`가져오지 못했습니다.\n${error.message||error}`);}
  }

  function bindTop(){
    titleInput?.addEventListener('change',()=>mutate(()=>{state.pageTitle=titleInput.value.trim()||'새 분야 가이드';},{rerender:false,inspectorToo:false}));
    searchInput?.addEventListener('input',renderLibrary);
    document.querySelector('#editorUndo')?.addEventListener('click',undo);
    document.querySelector('#editorRedo')?.addEventListener('click',redo);
    document.querySelector('#editorExport')?.addEventListener('click',exportDraft);
    document.querySelector('#editorImport')?.addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importDraft(file);event.target.value='';});
    document.querySelectorAll('[data-editor-theme]').forEach(button=>button.addEventListener('click',()=>{state.theme=button.dataset.editorTheme;save();syncTopState();renderCanvas();}));
    document.querySelectorAll('[data-editor-preview]').forEach(button=>button.addEventListener('click',()=>{state.preview=button.dataset.editorPreview;save();syncTopState();}));
    document.querySelectorAll('[data-editor-mode]').forEach(button=>button.addEventListener('click',()=>{state.mode=button.dataset.editorMode;save();syncTopState();renderCanvas();}));
  }

  bindTop();
  syncTopState();
  renderLibrary();
  renderCanvas();
  renderInspector();
  updateHistoryButtons();
})();
