/* Canonical reader: Library, Editor, Public and portable use this owner. */
(function(){
  'use strict';
  const registry=window.PlatformModuleRegistry,model=window.PersonalEduReaderModelV1,ID='ebook-reader';
  if(!registry||!model||registry.get(ID))return;
  const esc=registry.escapeHtml,attr=registry.attr,mounts=new WeakMap(),locks=new Set();
  let serial=0,previousOverflow='';
  const array=value=>Array.isArray(value)?value:[];
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  function lock(root){if(locks.has(root))return;if(!locks.size){previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';}locks.add(root);}
  function unlock(root){if(!locks.has(root))return;locks.delete(root);if(!locks.size)document.documentElement.style.overflow=previousOverflow;}
  function render(){
    const id=`ebook-reader-${++serial}`;
    return `<section class="ebook-reader" data-platform-module="${ID}" aria-labelledby="${id}-title">
      <header class="ebook-reader__header"><div class="ebook-reader__identity"><p class="ebook-reader__edition" data-reader-edition>교재를 불러오는 중</p><h1 id="${id}-title" data-reader-title>전자책</h1><p class="ebook-reader__subtitle" data-reader-subtitle hidden></p></div><span class="ebook-reader__badge" data-reader-badge></span></header>
      <nav class="ebook-reader__toolbar" aria-label="읽기 도구"><button type="button" data-reader-action="toc" disabled>표지·목차</button><button type="button" data-reader-action="questions" disabled>저장한 질문 <span data-reader-question-count>0</span></button><button type="button" data-reader-action="tools" aria-haspopup="dialog" aria-controls="${id}-tools">글자·파일</button></nav>
      <div class="ebook-reader__tools" id="${id}-tools" hidden><div class="ebook-reader__font-controls" role="group" aria-label="본문 글자 크기"><button type="button" data-reader-action="font-smaller" aria-label="글자 작게">가−</button><output data-reader-font-size aria-live="polite">100%</output><button type="button" data-reader-action="font-larger" aria-label="글자 크게">가+</button><button type="button" data-reader-action="font-reset">기본 크기</button></div><div class="ebook-reader__file-controls"><button type="button" data-reader-action="export">질문 내보내기</button><button type="button" data-reader-action="import">질문 가져오기</button><input type="file" data-reader-import accept="application/json,.json" aria-label="질문 파일 가져오기" hidden></div><p>질문과 읽던 위치는 이 브라우저에 저장됩니다. 내보낸 질문 파일에는 모든 책의 메모가 담깁니다.</p></div>
      <div class="ebook-reader__notice" role="status" data-reader-notice hidden></div>
      <div class="ebook-reader__reading" role="region" tabindex="0" aria-label="교재 본문" aria-busy="true" data-reader-reading><p class="ebook-reader__loading">본문을 준비하고 있습니다.</p></div>
      <div class="ebook-reader__selection"><p data-reader-selection-label>본문에서 문장을 선택해 질문으로 남겨 보세요.</p><button type="button" data-reader-action="selection" disabled aria-hidden="true">질문으로 저장</button></div>
      <nav class="ebook-reader__pagination" aria-label="본문 쪽 이동"><button type="button" data-reader-action="previous" disabled>이전 쪽</button><p data-reader-pagination aria-live="polite"></p><button type="button" data-reader-action="next" disabled>다음 쪽</button></nav>
      <dialog class="ebook-reader__dialog" aria-labelledby="${id}-dialog-title"><header><h2 id="${id}-dialog-title" data-reader-dialog-title></h2><button type="button" data-reader-action="close-dialog" aria-label="창 닫기">닫기</button></header><div class="ebook-reader__dialog-body" data-reader-dialog-body></div></dialog>
    </section>`;
  }
  function hydrate(host,props={},context={}){
    const root=host.matches?.(`[data-platform-module="${ID}"]`)?host:host.querySelector?.(`[data-platform-module="${ID}"]`);
    if(!root)return;if(mounts.has(root))return mounts.get(root);
    const find=selector=>root.querySelector(selector),reading=find('[data-reader-reading]'),dialog=find('dialog'),dialogBody=find('[data-reader-dialog-body]');
    let storage;try{storage=context.readerStorage||window.localStorage;}catch{}
    const store=model.createStore(storage,{prefix:context.readerStoragePrefix||model.PREFIX});
    const toolsPanel=find('.ebook-reader__tools');
    const state={manifest:null,page:null,descriptor:null,index:-1,loading:false,disposed:false,ready:false,restoring:false,nonce:0,cache:new Map(),selection:null,editing:null,dialogMode:'',dialogOpener:null,fontScale:1,lastAnchor:null,saveBlocked:false,restoreSerial:0};
    const baseUrl=props.baseUrl||document.baseURI;
    const adapter=context.readerAdapter||{};
    let sourceBase=baseUrl,controller=null,saveTimer=0,selectionTimer=0,resizeTimer=0,retryPageId='',readyResolve;
    const ready=new Promise(resolve=>{readyResolve=resolve;});
    function notice(message,type='info'){
      const node=find('[data-reader-notice]');node.hidden=!message;node.dataset.kind=type;node.textContent=message||'';
    }
    const readableError=(error,fallback)=>/[가-힣]/.test(String(error?.message||''))?error.message:fallback;
    function storageNotice(result){
      if(result.ok)return true;
      notice('브라우저에 저장하지 못했습니다. 저장 공간이나 접근 설정을 확인하고, 질문 파일을 내보내 보관해 주세요. 기존 기록은 지우지 않았습니다.','error');
      return false;
    }
    function part(blockId,partId,value,tag='span',className=''){
      return `<${tag} data-reader-text="${attr(partId)}" data-reader-text-block="${attr(blockId)}"${className?` class="${attr(className)}"`:''}>${esc(value||'')}</${tag}>`;
    }
    function assetUrl(block){
      let source=block.src;
      if(!source&&block.assetId){const asset=state.manifest?.assets?.[block.assetId];source=typeof asset==='string'?asset:asset?.src;}
      if(!source&&adapter.resolveAsset)source=adapter.resolveAsset(block.assetId,{manifest:state.manifest});
      return model.safeUrl(source,sourceBase);
    }
    function blockHtml(block){
      const id=block.blockId,p=(key,value,tag='span',className='')=>part(id,key,value,tag,className),heading=block.title?p('title',block.title,'h3'):'';
      let body='';
      if(block.type==='paragraph')body=p('text',block.text,'p');
      if(block.type==='heading'){const level=clamp(Number(block.level)||3,3,5);body=p('text',block.text,`h${level}`);}
      if(block.type==='list'){const tag=block.ordered?'ol':'ul';body=`${heading}<${tag}>${block.items.map((item,index)=>p(`item-${index}`,item,'li')).join('')}</${tag}>`;}
      if(block.type==='checklist')body=`${heading}<ul class="ebook-reader__checklist">${block.items.map((item,index)=>`<li><span aria-hidden="true">□</span>${p(`item-${index}`,item)}</li>`).join('')}</ul>`;
      if(block.type==='steps')body=`${heading}<ol class="ebook-reader__steps">${block.items.map((item,index)=>`<li>${item.title?p(`item-${index}-title`,item.title,'h4'):''}${p(`item-${index}-text`,item.text,'p')}${item.output?`<p class="ebook-reader__output"><b>완성할 것</b>${p(`item-${index}-output`,item.output)}</p>`:''}</li>`).join('')}</ol>${block.output?p('output',block.output,'p','ebook-reader__output'):''}`;
      if(block.type==='callout')body=`${heading}${p('text',block.text,'p')}`;
      if(block.type==='template')body=`${heading}<div class="ebook-reader__template">${p('text',block.text,'pre')}</div><button type="button" class="ebook-reader__inline-action" data-reader-copy="${attr(id)}">내용 복사</button>`;
      if(block.type==='table')body=`${heading}<div class="ebook-reader__table-scroll" role="region" tabindex="0" aria-label="${attr(block.caption||block.title||'본문 표')}"><table>${block.caption?`<caption>${p('caption',block.caption)}</caption>`:''}<thead><tr>${block.columns.map((value,index)=>`<th scope="col">${p(`column-${index}`,value)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row,r)=>`<tr>${row.map((value,c)=>`<td>${p(`cell-${r}-${c}`,value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      if(block.type==='image'){
        const url=assetUrl(block);
        body=`<figure>${url?`<button type="button" class="ebook-reader__image-button" data-reader-image="${attr(id)}" aria-label="${attr(`이미지 확대: ${block.alt}`)}"><img src="${attr(url)}" alt="${attr(block.alt)}" width="${attr(block.width)}" height="${attr(block.height)}" loading="lazy" decoding="async"></button>`:`<p class="ebook-reader__asset-error">이미지를 불러올 수 없습니다. ${esc(block.alt)}</p>`}${block.caption||block.credit?`<figcaption>${block.caption?p('caption',block.caption):''}${block.credit?p('credit',block.credit,'small'):''}</figcaption>`:''}</figure>`;
      }
      if(block.type==='exercise')body=`<div class="ebook-reader__exercise">${heading}${block.goal?`<p><b>목표</b>${p('goal',block.goal)}</p>`:''}<ol>${array(block.steps).map((value,index)=>p(`step-${index}`,value,'li')).join('')}</ol>${block.expectedOutput?`<p class="ebook-reader__output"><b>완성할 것</b>${p('expected-output',block.expectedOutput)}</p>`:''}${array(block.checks).length?`<h4>스스로 확인하기</h4><ul>${block.checks.map((value,index)=>p(`check-${index}`,value,'li')).join('')}</ul>`:''}${block.solution?`<details><summary>해설 보기</summary>${p('solution',block.solution,'p')}</details>`:''}</div>`;
      if(block.type==='sources')body=`${heading||'<h3>참고 자료</h3>'}<ul class="ebook-reader__sources">${block.items.map((item,index)=>{const url=model.safeUrl(item.url,sourceBase);return `<li>${url?`<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">${p(`source-${index}`,item.title)}</a>`:p(`source-${index}`,item.title)}${item.publisher?`${p(`publisher-${index}`,item.publisher,'small')}`:''}</li>`;}).join('')}</ul>`;
      return `<section class="ebook-reader__block ebook-reader__block--${attr(block.type)}" data-reader-block="${attr(id)}">${body}</section>`;
    }
    function pageHtml(page,descriptor){
      const chapter=state.manifest.chapters.find(item=>item.chapterId===page.chapterId);
      return `<article class="ebook-reader__page" data-reader-page="${attr(page.pageId)}"><header class="ebook-reader__page-head"><p>${esc(chapter?.title||'')}</p><h2 tabindex="-1" data-reader-page-title>${esc(page.title)}</h2></header>${page.blocks.map(blockHtml).join('')}<footer class="ebook-reader__folio"><span aria-label="본문 ${attr(descriptor.pageNumber)}쪽">${esc(descriptor.pageNumber)}</span></footer></article>`;
    }
    async function getBytes(url,limit,signal){
      const clean=model.safeUrl(url,sourceBase);if(!clean)throw new Error('본문 주소가 올바르지 않습니다.');
      const response=await fetch(clean,{signal,credentials:'same-origin'});if(!response.ok)throw new Error(`본문을 불러오지 못했습니다. (${response.status})`);
      if(Number(response.headers.get('content-length'))>limit)throw new Error('한 번에 불러올 수 있는 본문 크기를 넘었습니다.');
      const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>limit)throw new Error('한 번에 불러올 수 있는 본문 크기를 넘었습니다.');return bytes;
    }
    async function loadManifest(){
      if(props.publication?.manifest)return model.manifest(props.publication.manifest);
      if(adapter.loadManifest)return model.manifest(await adapter.loadManifest(props));
      const url=model.safeUrl(props.manifestUrl,baseUrl);if(!url)throw new Error('교재 목록 주소가 없습니다.');
      sourceBase=url;
      return model.manifest(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await getBytes(url,262144,controller.signal))));
    }
    async function loadPage(descriptor,signal){
      if(state.cache.has(descriptor.pageId))return state.cache.get(descriptor.pageId);
      let bytes;
      const supplied=props.publication?.pages?.[descriptor.pageId];
      if(supplied!==undefined)bytes=new TextEncoder().encode(typeof supplied==='string'?supplied:JSON.stringify(supplied));
      else if(adapter.loadPage){const value=await adapter.loadPage(descriptor,{manifest:state.manifest,signal});bytes=value instanceof Uint8Array?value:new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));}
      else bytes=await getBytes(descriptor.src,524288,signal);
      if(bytes.length>524288)throw new Error('본문 쪽의 크기 제한을 넘었습니다.');
      if(await model.sha256(bytes)!==descriptor.contentHash.toLowerCase())throw new Error('이 편집판의 본문과 확인 정보가 다릅니다. 새로고침 후 다시 열어 주세요.');
      const page=model.page(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),state.manifest,descriptor);
      state.cache.set(descriptor.pageId,page);if(state.cache.size>3)state.cache.delete(state.cache.keys().next().value);return page;
    }
    function buttons(){
      const unavailable=!state.manifest||state.loading;
      find('[data-reader-action="toc"]').disabled=unavailable;
      find('[data-reader-action="questions"]').disabled=!state.manifest;
      find('[data-reader-action="previous"]').disabled=unavailable||state.index<=0;
      find('[data-reader-action="next"]').disabled=unavailable||state.index>=state.manifest.pages.length-1;
      find('[data-reader-pagination]').textContent=state.descriptor?`${state.descriptor.pageNumber} / ${state.manifest.pages.length}쪽`:'';
    }
    function currentPosition(){
      if(!state.page||!state.manifest)return null;
      const edge=reading.getBoundingClientRect().top+18,blocks=[...reading.querySelectorAll('[data-reader-block]')];
      let chosen=blocks[0];for(const block of blocks){if(block.getBoundingClientRect().top<=edge)chosen=block;else break;}
      const box=chosen?.getBoundingClientRect();
      return {schemaVersion:1,bookId:state.manifest.bookId,editionId:state.manifest.editionId,pageId:state.page.pageId,blockId:reading.scrollTop<5?'':chosen?.dataset.readerBlock||'',blockProgress:reading.scrollTop<5?0:box?clamp((edge-box.top)/Math.max(1,box.height),0,1):0,contentHash:state.descriptor.contentHash,updatedAt:new Date().toISOString()};
    }
    function persistPosition(){
      clearTimeout(saveTimer);if(!state.ready||state.restoring||state.loading||state.disposed||state.saveBlocked)return;
      const value=currentPosition();if(value){state.lastAnchor=value;storageNotice(store.savePosition(value));}
    }
    async function restorePosition(saved){
      const restoring=++state.restoreSerial;state.restoring=true;
      await nextFrame();if(state.disposed||restoring!==state.restoreSerial)return;
      const block=saved?.blockId?[...reading.querySelectorAll('[data-reader-block]')].find(node=>node.dataset.readerBlock===saved.blockId):null;
      if(block){const rect=block.getBoundingClientRect();reading.scrollTop=reading.scrollTop+rect.top-reading.getBoundingClientRect().top-18+rect.height*clamp(saved.blockProgress||0,0,1);}
      else reading.scrollTop=0;
      await nextFrame();if(state.disposed||restoring!==state.restoreSerial)return;
      state.restoring=false;state.lastAnchor=currentPosition();
    }
    function clearSelection(){state.selection=null;const button=find('[data-reader-action="selection"]');button.disabled=true;button.setAttribute('aria-hidden','true');find('[data-reader-selection-label]').textContent='본문에서 문장을 선택해 질문으로 남겨 보세요.';}
    async function navigate(pageId,{saved=null,focus=true,initial=false,preservePosition=false}={}){
      const descriptor=state.manifest?.pages.find(item=>item.pageId===pageId);if(!descriptor||state.disposed)return false;
      if(!initial)persistPosition();
      const token=++state.nonce;controller?.abort();controller=new AbortController();state.loading=true;reading.setAttribute('aria-busy','true');buttons();clearSelection();
      try{
        const page=await loadPage(descriptor,controller.signal);if(state.disposed||token!==state.nonce)return false;
        state.page=page;state.descriptor=descriptor;state.index=state.manifest.pages.indexOf(descriptor);state.saveBlocked=preservePosition;
        if(saved?.contentHash&&saved.contentHash!==descriptor.contentHash){saved=null;state.saveBlocked=true;notice('같은 편집판의 본문이 바뀌어 읽던 문단을 자동으로 복원하지 않았습니다. 목차에서 읽을 쪽을 선택하면 새 위치를 저장합니다.','error');}
        reading.innerHTML=pageHtml(page,descriptor);root.dataset.readerCurrentPage=page.pageId;
        await restorePosition(saved);if(state.disposed||token!==state.nonce)return false;
        state.loading=false;state.ready=true;root.dataset.readerReady='true';reading.setAttribute('aria-busy','false');buttons();retryPageId='';if(focus)find('[data-reader-page-title]')?.focus({preventScroll:true});
        if(!state.saveBlocked)persistPosition();
        context.onReaderNavigate?.({bookId:state.manifest.bookId,editionId:state.manifest.editionId,pageId:page.pageId,pageNumber:page.pageNumber});
        root.dispatchEvent(new CustomEvent('ebook-reader:navigate',{bubbles:true,detail:{bookId:state.manifest.bookId,editionId:state.manifest.editionId,pageId:page.pageId,pageNumber:page.pageNumber}}));
        return true;
      }catch(error){
        if(state.disposed||token!==state.nonce||error.name==='AbortError')return false;
        state.loading=false;reading.setAttribute('aria-busy','false');retryPageId=pageId;buttons();notice(readableError(error,'본문을 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.'),'error');
        if(!state.page)reading.innerHTML='<div class="ebook-reader__load-error"><h2>본문을 열지 못했습니다</h2><p>연결 상태를 확인한 뒤 다시 시도해 주세요. 저장한 질문과 읽던 위치는 그대로 남아 있습니다.</p><button type="button" data-reader-action="retry">다시 불러오기</button></div>';
        return false;
      }
    }
    function selectedText(){
      if(!state.page||state.loading||dialog.open)return;
      const selected=window.getSelection();if(!selected||selected.isCollapsed||selected.rangeCount!==1){clearSelection();return;}
      const range=selected.getRangeAt(0),start=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement,end=range.endContainer.nodeType===1?range.endContainer:range.endContainer.parentElement;
      if(!reading.contains(start)||!reading.contains(end)){clearSelection();return;}
      const anchors=[];
      for(const node of reading.querySelectorAll('[data-reader-text]')){
        if(!node.getClientRects().length||!range.intersectsNode(node))continue;
        const full=document.createRange();full.selectNodeContents(node);
        const clipped=range.cloneRange();
        if(clipped.compareBoundaryPoints(Range.START_TO_START,full)<0)clipped.setStart(full.startContainer,full.startOffset);
        if(clipped.compareBoundaryPoints(Range.END_TO_END,full)>0)clipped.setEnd(full.endContainer,full.endOffset);
        const exact=clipped.toString();if(!exact)continue;
        const before=full.cloneRange();before.setEnd(clipped.startContainer,clipped.startOffset);
        const at=model.pointLength(before.toString()),to=at+model.pointLength(exact),quote=model.quoteAt(node.textContent,at,to);
        if(quote.exact!==exact)continue;
        anchors.push({blockId:node.dataset.readerTextBlock,partId:node.dataset.readerText,quote,position:{start:at,end:to}});
      }
      if(!anchors.length){clearSelection();return;}
      const quote=anchors.map(anchor=>anchor.quote.exact).join('\n');
      if(quote.length>100000){clearSelection();notice('선택한 문장이 너무 깁니다. 한 쪽 안에서 필요한 부분을 나눠 저장해 주세요.');return;}
      state.selection={schemaVersion:1,id:model.uuid(),bookId:state.manifest.bookId,editionId:state.manifest.editionId,editionLabel:readableEditionLabel(state.manifest),pageId:state.page.pageId,pageNumberAtSave:state.page.pageNumber,contentHash:state.descriptor.contentHash,quote,anchors,note:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      const button=find('[data-reader-action="selection"]');button.disabled=false;button.setAttribute('aria-hidden','false');find('[data-reader-selection-label]').textContent=`${model.pointLength(quote)}자 선택됨`;
    }
    function scheduleSelection(){clearTimeout(selectionTimer);selectionTimer=setTimeout(selectedText,90);}
    function parkTools(){if(toolsPanel.parentElement===dialogBody){toolsPanel.hidden=true;root.insertBefore(toolsPanel,find('[data-reader-notice]'));}}
    function openDialog(title,body,mode,opener){
      parkTools();state.dialogMode=mode;state.dialogOpener=opener||document.activeElement;find('[data-reader-dialog-title]').textContent=title;dialogBody.innerHTML=body;dialogBody.scrollTop=0;
      if(!dialog.open){lock(root);try{dialog.showModal();}catch{unlock(root);notice('이 브라우저에서는 창을 열 수 없습니다. 최신 브라우저에서 다시 열어 주세요.','error');return;}}
      const initial=dialogBody.querySelector('[data-reader-memo]')||find('[data-reader-action="close-dialog"]');initial.focus({preventScroll:true});
    }
    function closeDialog(){if(dialog.open)dialog.close();}
    function dialogClosed(){if(dialog.open)return;parkTools();unlock(root);state.dialogMode='';state.editing=null;const opener=state.dialogOpener;state.dialogOpener=null;if(opener?.isConnected)opener.focus({preventScroll:true});}
    function toc(opener){
      const book=state.manifest,cover=book.cover,coverUrl=cover?assetUrl(cover):'';
      const body=`<div class="ebook-reader__cover">${coverUrl?`<img src="${attr(coverUrl)}" alt="${attr(cover.alt||book.title)}" width="${attr(cover.width||600)}" height="${attr(cover.height||800)}">`:''}<p>${esc(book.status==='sample'?'샘플 교재':'공개 교재')} · 본문 ${book.pages.length}쪽</p><h3>${esc(book.title)}</h3>${book.subtitle?`<p>${esc(book.subtitle)}</p>`:''}<p>${esc(book.editionLabel||book.editionId)}</p>${book.status==='sample'?'<p>한 단원을 담은 샘플입니다. 정규 교재의 완성 권수에 포함하지 않습니다.</p>':''}<p class="ebook-reader__toc-note">표지와 목차는 본문 쪽수에 포함하지 않습니다.</p></div><nav class="ebook-reader__toc" aria-label="교재 목차">${book.chapters.map(chapter=>`<section><h3>${esc(chapter.title)}</h3><ol>${book.pages.filter(item=>item.chapterId===chapter.chapterId).map(item=>`<li><button type="button" data-reader-go="${attr(item.pageId)}"${item.pageId===state.page?.pageId?' aria-current="page"':''}><span>${esc(item.title)}</span><b>${esc(item.pageNumber)}쪽</b></button></li>`).join('')}</ol></section>`).join('')}</nav>`;
      openDialog('표지·목차',body,'toc',opener);
    }
    function questionsResult(){const result=store.listQuestions(state.manifest?.bookId);storageNotice(result);find('[data-reader-question-count]').textContent=String(result.values.length);return result;}
    function readableEditionLabel(value){const label=typeof value?.editionLabel==='string'?value.editionLabel.trim():'';return label&&label!==value.editionId?label:'';}
    function questionEditionLabel(item){return item.editionId===state.manifest.editionId?readableEditionLabel(state.manifest)||'현재 판본':readableEditionLabel(item)||'다른 판본';}
    function questionList(opener){
      const saved=questionsResult().values;
      const body=`<p class="ebook-reader__storage-help">이 책에서 저장한 질문 ${saved.length}개입니다. 다른 판본의 원문과 메모도 보관합니다.</p>${saved.length?`<ol class="ebook-reader__questions">${saved.map(item=>`<li data-reader-note-id="${attr(item.id)}"><header><span>${esc(item.pageNumberAtSave)}쪽</span><small>${esc(item.editionId===state.manifest.editionId?'현재 판본':readableEditionLabel(item)?`다른 판본 · ${readableEditionLabel(item)}`:'다른 판본')}</small></header><blockquote>${esc(item.quote)}</blockquote><p>${esc(item.note||'아직 메모가 없습니다.')}</p><div><button type="button" data-reader-note-open="${attr(item.id)}">원문으로</button><button type="button" data-reader-note-edit="${attr(item.id)}">메모 편집</button><button type="button" data-reader-note-delete="${attr(item.id)}">삭제</button></div><p data-reader-delete-confirm hidden>이 질문을 삭제할까요? <button type="button" data-reader-note-confirm="${attr(item.id)}">질문 삭제</button><button type="button" data-reader-note-cancel>취소</button></p></li>`).join('')}</ol>`:'<p class="ebook-reader__empty">본문에서 문장을 선택한 뒤 ‘질문으로 저장’을 눌러 보세요.</p>'}`;
      openDialog('저장한 질문',body,'questions',opener);
    }
    function questionById(id){return store.listQuestions(state.manifest.bookId).values.find(item=>item.id===id);}
    function editQuestion(item,opener){
      if(!item)return;state.editing={...item,anchors:item.anchors.map(anchor=>({...anchor}))};
      openDialog('질문 메모',`<p class="ebook-reader__note-location">${esc(item.pageNumberAtSave)}쪽 · ${esc(questionEditionLabel(item))}</p><blockquote class="ebook-reader__quote">${esc(item.quote)}</blockquote><form data-reader-note-form><label>궁금한 점이나 메모<textarea data-reader-memo rows="5" maxlength="20000" placeholder="메모 없이 문장만 저장해도 됩니다.">${esc(item.note)}</textarea></label><p data-reader-form-status role="status"></p><button type="submit" class="ebook-reader__primary">질문 저장</button></form>`,'edit',opener);
    }
    function saveQuestion(event){
      if(!event.target.matches('[data-reader-note-form]'))return;event.preventDefault();if(!state.editing)return;
      const item={...state.editing,note:dialogBody.querySelector('[data-reader-memo]').value,updatedAt:new Date().toISOString()},result=store.saveQuestion(item);
      if(!storageNotice(result)){dialogBody.querySelector('[data-reader-form-status]').textContent='저장하지 못했습니다. 이 창의 원문과 메모를 복사해 보관한 뒤 저장 공간을 확인해 주세요.';return;}
      clearSelection();closeDialog();questionsResult();notice('질문을 저장했습니다. 저장한 질문에서 메모를 고치거나 원문으로 돌아갈 수 있습니다.');
      root.dispatchEvent(new CustomEvent('ebook-reader:question-saved',{bubbles:true,detail:{question:item}}));
    }
    async function openQuestion(id){
      const item=questionById(id);if(!item)return;
      if(item.editionId!==state.manifest.editionId){
        const address=props.editionLinks?.[item.editionId]||context.readerEditionUrl?.({bookId:item.bookId,editionId:item.editionId,pageId:item.pageId}),url=model.safeUrl(address,baseUrl);
        const body=`<p>다른 판본에서 저장한 질문입니다. 현재 판본에서는 원문 위치로 이동할 수 없습니다.</p>${readableEditionLabel(item)?`<p class="ebook-reader__note-location">저장한 판본 · ${esc(readableEditionLabel(item))}</p>`:''}<blockquote class="ebook-reader__quote">${esc(item.quote)}</blockquote><p>${esc(item.note)}</p>${url?`<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">저장 당시 판본 열기</a>`:'<p>저장 당시 판본이 제공되면 그 원문에서 다시 확인할 수 있습니다. 원문과 메모는 그대로 보관합니다.</p>'}<button type="button" data-reader-note-edit="${attr(item.id)}">메모 편집</button>`;
        openDialog('다른 판본의 질문',body,'edition',state.dialogOpener);return;
      }
      const descriptor=state.manifest.pages.find(value=>value.pageId===item.pageId);
      if(!descriptor||descriptor.contentHash!==item.contentHash){notice('저장 당시 본문과 현재 본문이 달라 원문 위치로 이동하지 않았습니다. 인용문과 메모는 그대로 남아 있습니다.','error');return;}
      closeDialog();if(!await navigate(item.pageId,{focus:false}))return;
      const ranges=[];
      for(const anchor of item.anchors){
        const node=[...reading.querySelectorAll('[data-reader-text]')].find(value=>value.dataset.readerTextBlock===anchor.blockId&&value.dataset.readerText===anchor.partId);
        if(!node){notice('저장한 인용문의 위치를 찾지 못했습니다. 메모의 원문을 확인해 주세요.','error');return;}
        node.closest('details')?.setAttribute('open','');
        const match=model.resolveAnchor(node.textContent,anchor);if(!match){notice('저장한 인용문을 정확히 확인할 수 없어 강조하지 않았습니다.','error');return;}
        ranges.push({node,...match});
      }
      const first=ranges[0],last=ranges[ranges.length-1],range=document.createRange();
      // Text parts contain escaped plain text, so every part has one text node.
      if(!first.node.firstChild||!last.node.firstChild)return;
      range.setStart(first.node.firstChild,Array.from(first.node.textContent).slice(0,first.start).join('').length);range.setEnd(last.node.firstChild,Array.from(last.node.textContent).slice(0,last.end).join('').length);
      window.getSelection().removeAllRanges();window.getSelection().addRange(range);
      reading.scrollTop+=first.node.getBoundingClientRect().top-reading.getBoundingClientRect().top-24;reading.focus({preventScroll:true});selectedText();persistPosition();notice('저장한 원문으로 이동했습니다.');
    }
    async function fontSize(value){
      const saved=currentPosition();state.fontScale=clamp(Math.round(value*100)/100,0.9,1.5);root.style.setProperty('--ebook-reader-font-scale',String(state.fontScale));
      find('[data-reader-font-size]').textContent=`${Math.round(state.fontScale*100)}%`;find('[data-reader-action="font-smaller"]').disabled=state.fontScale<=0.9;find('[data-reader-action="font-larger"]').disabled=state.fontScale>=1.5;
      storageNotice(store.saveSettings(state.fontScale));if(saved)await restorePosition(saved);
    }
    function exportQuestions(){
      const result=store.exportQuestions();if(!result.ok)notice('읽을 수 있는 질문만 내보냅니다. 손상되거나 접근할 수 없는 기록은 브라우저에서 지우지 않았습니다.','error');
      const url=URL.createObjectURL(new Blob([JSON.stringify(result.data,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`reader-questions-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    async function importQuestions(event){
      const file=event.target.files?.[0];if(!file)return;
      try{if(file.size>10485760)throw new Error('질문 파일은 10MB 이하로 나눠 가져와 주세요.');const result=store.importQuestions(JSON.parse(await file.text()));questionsResult();
        if(result.ok)notice(`질문 ${result.added}개를 가져왔습니다. 이미 저장된 질문 ${result.skipped}개는 그대로 두었습니다.`);else{storageNotice(result);notice(`질문 ${result.added||0}개를 가져온 뒤 중단했습니다. 파일 형식과 브라우저 저장 공간을 확인해 주세요. 기존 질문은 그대로 남아 있습니다.`,'error');}
      }catch(error){notice(readableError(error,'질문 파일을 읽지 못했습니다. 리더에서 내보낸 JSON 파일인지 확인해 주세요.'),'error');}finally{event.target.value='';}
    }
    async function copyTemplate(id,button){
      const block=state.page.blocks.find(value=>value.blockId===id&&value.type==='template');if(!block)return;
      try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(block.text);else{const node=document.createElement('textarea');node.value=block.text;node.style.cssText='position:fixed;left:-9999px';document.body.appendChild(node);node.select();const copied=document.execCommand('copy');node.remove();button.focus({preventScroll:true});if(!copied)throw new Error('copy');}notice('내용을 복사했습니다.');}catch{notice('자동 복사를 사용할 수 없습니다. 본문을 길게 누르거나 드래그해 복사해 주세요.');}
    }
    function imageDialog(id,opener){const block=state.page.blocks.find(value=>value.blockId===id&&value.type==='image');if(!block)return;openDialog(block.caption||'이미지 확대',`<div class="ebook-reader__image-view" tabindex="0" aria-label="확대한 이미지"><img src="${attr(assetUrl(block))}" alt="${attr(block.alt)}" width="${attr(block.width)}" height="${attr(block.height)}"></div><p>${esc(block.alt)}</p><a class="ebook-reader__image-original" href="${attr(assetUrl(block))}" target="_blank" rel="noopener noreferrer">이미지 원본을 새 탭에서 열기</a>`,'image',opener);}
    function click(event){
      const button=event.target.closest?.('button');if(!button||!root.contains(button)||event.defaultPrevented)return;
      const action=button.dataset.readerAction;
      if(action==='toc')toc(button);
      else if(action==='questions')questionList(button);
      else if(action==='tools'){openDialog('글자·파일','','tools',button);toolsPanel.hidden=false;dialogBody.appendChild(toolsPanel);toolsPanel.querySelector('button')?.focus();}
      else if(action==='selection'&&state.selection)editQuestion(state.selection,button);
      else if(action==='close-dialog')closeDialog();
      else if(action==='previous'||action==='next'){const target=state.manifest.pages[state.index+(action==='next'?1:-1)];if(target)navigate(target.pageId);}
      else if(action==='font-smaller')fontSize(state.fontScale-0.1);
      else if(action==='font-larger')fontSize(state.fontScale+0.1);
      else if(action==='font-reset')fontSize(1);
      else if(action==='export')exportQuestions();
      else if(action==='import')find('[data-reader-import]').click();
      else if(action==='retry'){if(state.manifest)navigate(retryPageId||state.manifest.pages[0].pageId,{initial:true,focus:false});else initialize();}
      if(button.dataset.readerGo){closeDialog();navigate(button.dataset.readerGo);}
      if(button.dataset.readerNoteEdit)editQuestion(questionById(button.dataset.readerNoteEdit),state.dialogOpener||button);
      if(button.dataset.readerNoteOpen)openQuestion(button.dataset.readerNoteOpen);
      if(button.dataset.readerNoteDelete)button.closest('[data-reader-note-id]').querySelector('[data-reader-delete-confirm]').hidden=false;
      if(button.hasAttribute('data-reader-note-cancel'))button.closest('[data-reader-delete-confirm]').hidden=true;
      if(button.dataset.readerNoteConfirm){const result=store.deleteQuestion(button.dataset.readerNoteConfirm);if(storageNotice(result))questionList(state.dialogOpener);}
      if(button.dataset.readerCopy)copyTemplate(button.dataset.readerCopy,button);
      if(button.dataset.readerImage)imageDialog(button.dataset.readerImage,button);
    }
    function keydown(event){
      if(dialog.open&&event.key==='Tab'){
        const focusable=[...dialog.querySelectorAll('button:not([disabled]),a[href],input,textarea,select,[tabindex="0"]')].filter(node=>node.getClientRects().length),first=focusable[0],last=focusable.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;
      }
      if(dialog.open||state.loading||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowLeft','ArrowRight'].includes(event.key)||!window.getSelection()?.isCollapsed)return;
      if(!reading.contains(document.activeElement)||document.activeElement.closest('input,textarea,select,button,a,[contenteditable="true"],.ebook-reader__table-scroll,.ebook-reader__image-view'))return;
      const target=state.manifest?.pages[state.index+(event.key==='ArrowRight'?1:-1)];if(target){event.preventDefault();navigate(target.pageId);}
    }
    function scroll(){if(state.restoring||state.loading||!state.ready)return;state.lastAnchor=currentPosition();clearTimeout(saveTimer);saveTimer=setTimeout(persistPosition,350);}
    function visibility(){if(document.visibilityState==='hidden')persistPosition();}
    function resize(){if(state.restoring||!state.ready||dialog.open)return;const saved=state.lastAnchor;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(saved&&!state.disposed)restorePosition(saved);},80);}
    function changedStorage(event){if(event.key&&event.key.startsWith(store.prefix+'question:')&&state.manifest){questionsResult();if(state.dialogMode==='questions')questionList(state.dialogOpener);}}
    function imageError(event){if(event.target.tagName==='IMG'){event.target.classList.add('is-unavailable');notice('이미지 한 장을 불러오지 못했습니다. 본문과 이미지 설명은 계속 읽을 수 있습니다.');}}
    let pointerOutside=false;
    function dialogPointerDown(event){const rect=dialog.getBoundingClientRect();pointerOutside=event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);}
    function dialogPointerUp(event){const rect=dialog.getBoundingClientRect();if(pointerOutside&&event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))closeDialog();pointerOutside=false;}
    async function initialize(){
      controller?.abort();controller=new AbortController();state.loading=true;buttons();
      try{
        state.manifest=await loadManifest();if(state.disposed)return;
        find('[data-reader-title]').textContent=state.manifest.title;const subtitle=find('[data-reader-subtitle]');subtitle.textContent=state.manifest.subtitle||'';subtitle.hidden=!subtitle.textContent;
        find('[data-reader-edition]').textContent=state.manifest.editionLabel||state.manifest.editionId;find('[data-reader-badge]').textContent=`${state.manifest.status==='sample'?'샘플':'공개 교재'} · 본문 ${state.manifest.pages.length}쪽`;
        root.dataset.readerBook=state.manifest.bookId;root.dataset.readerEdition=state.manifest.editionId;
        const settings=store.loadSettings();if(settings.ok&&settings.value){state.fontScale=settings.value.fontScale;root.style.setProperty('--ebook-reader-font-scale',String(state.fontScale));find('[data-reader-font-size]').textContent=`${Math.round(state.fontScale*100)}%`;}else storageNotice(settings);
        questionsResult();const stored=store.loadPosition(state.manifest.bookId,state.manifest.editionId);storageNotice(stored);
        const requested=state.manifest.pages.find(item=>item.pageId===props.pageId),savedPage=stored.ok?state.manifest.pages.find(item=>item.pageId===stored.value?.pageId):null;
        const target=requested||savedPage||state.manifest.pages[0],saved=stored.ok&&stored.value?.pageId===target.pageId?stored.value:null;
        const missingSaved=Boolean(stored.ok&&stored.value&&!savedPage&&!requested);
        if(missingSaved)notice('저장한 쪽이 이 편집판의 목차에 없습니다. 이전 위치는 보관했습니다. 목차에서 읽을 쪽을 선택하면 새 위치를 저장합니다.','error');
        const loaded=await navigate(target.pageId,{saved,focus:false,initial:true,preservePosition:missingSaved});readyResolve(loaded);
      }catch(error){if(state.disposed||error.name==='AbortError')return;state.loading=false;reading.setAttribute('aria-busy','false');notice(readableError(error,'교재를 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.'),'error');reading.innerHTML='<div class="ebook-reader__load-error"><h2>교재를 열지 못했습니다</h2><button type="button" data-reader-action="retry">다시 불러오기</button></div>';buttons();readyResolve(false);}
    }
    root.addEventListener('click',click);root.addEventListener('keydown',keydown);root.addEventListener('submit',saveQuestion);root.addEventListener('error',imageError,true);reading.addEventListener('scroll',scroll,{passive:true});
    document.addEventListener('selectionchange',scheduleSelection);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',persistPosition);window.addEventListener('resize',resize);window.addEventListener('storage',changedStorage);
    find('[data-reader-import]').addEventListener('change',importQuestions);dialog.addEventListener('close',dialogClosed);dialog.addEventListener('pointerdown',dialogPointerDown);dialog.addEventListener('pointerup',dialogPointerUp);
    const mount={api:{ready,navigate:pageId=>navigate(pageId),openQuestions:()=>questionList(),getState:()=>({bookId:state.manifest?.bookId,editionId:state.manifest?.editionId,pageId:state.page?.pageId,ready:state.ready,loading:state.loading,restoring:state.restoring}),exportQuestions:()=>store.exportQuestions(),savePosition:persistPosition},cleanup(){
      if(state.disposed)return;persistPosition();state.disposed=true;state.nonce++;controller?.abort();clearTimeout(saveTimer);clearTimeout(selectionTimer);clearTimeout(resizeTimer);closeDialog();unlock(root);
      root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);root.removeEventListener('submit',saveQuestion);root.removeEventListener('error',imageError,true);reading.removeEventListener('scroll',scroll);document.removeEventListener('selectionchange',scheduleSelection);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',persistPosition);window.removeEventListener('resize',resize);window.removeEventListener('storage',changedStorage);find('[data-reader-import]').removeEventListener('change',importQuestions);dialog.removeEventListener('close',dialogClosed);dialog.removeEventListener('pointerdown',dialogPointerDown);dialog.removeEventListener('pointerup',dialogPointerUp);delete root.dataset.readerBound;mounts.delete(root);readyResolve(false);
    }};
    mounts.set(root,mount);root.dataset.readerBound='true';initialize();return mount;
  }
  const demoPage={schemaVersion:1,bookId:'reader-example',editionId:'sample-v1',pageId:'reader-example-reading',pageNumber:1,chapterId:'reader-example-start',title:'문장을 읽고 질문 남기기',blocks:[{blockId:'reader-example-intro',type:'paragraph',text:'이 문장에서 궁금한 부분을 선택한 뒤 ‘질문으로 저장’을 눌러 보세요. 메모 없이 문장만 저장할 수도 있습니다.'},{blockId:'reader-example-practice',type:'exercise',title:'읽던 곳으로 돌아오기',goal:'저장한 질문에서 원문을 다시 찾습니다.',steps:['본문의 한 문장을 선택해 질문으로 저장하세요.','저장한 질문에서 메모를 고쳐 보세요.','원문으로 버튼을 눌러 선택한 문장으로 돌아오세요.'],expectedOutput:'원문과 연결된 질문 메모 한 개',checks:['저장한 질문에 책, 편집판, 쪽 번호가 남았나요?'],solution:'질문을 저장한 다음 새로고침해도 이 브라우저의 저장 공간에서 다시 읽어옵니다.'}]};
  const preview={publication:{manifest:{schemaVersion:1,bookId:'reader-example',editionId:'sample-v1',status:'sample',subjectId:'reader',levelId:'entry',title:'전자책 리더 사용 예시',editionLabel:'공통 모듈 예시',chapters:[{chapterId:'reader-example-start',title:'읽기와 질문'}],pages:[{pageId:demoPage.pageId,pageNumber:1,chapterId:demoPage.chapterId,title:demoPage.title,contentHash:'fbb0a4ab59f94c40d774a89ec18f6d56060fdd3d9999b982734d423d2a92d3b2'}]},pages:{[demoPage.pageId]:demoPage}}};
  registry.register({id:ID,label:'전자책 리더',category:'content',status:'approved',source:'platform-core',version:1,consumers:['public','library','editor','export'],isolateInstances:true,dependencies:[],ownerFiles:['public/assets/js/platform-modules/ebook-reader-model-v1.js','public/assets/js/platform-modules/ebook-reader-v1.js','public/assets/styles/components/ebook-reader-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
