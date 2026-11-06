/* Data and persistence contract shared by every ebook-reader consumer. */
(function(){
  'use strict';
  if(window.PersonalEduReaderModelV1)return;
  const VERSION=1,PREFIX='personalEduReaderV1.',ID=/^[a-z0-9][a-z0-9._-]{0,127}$/i,HASH=/^[a-f0-9]{64}$/i;
  const TYPES=new Set(['heading','paragraph','list','steps','callout','table','image','checklist','exercise','sources','template']);
  const object=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
  const text=value=>typeof value==='string';
  const strings=value=>Array.isArray(value)&&value.every(text);
  function require(value,message){if(!value)throw new Error(message);}
  function identifier(value){return text(value)&&ID.test(value);}
  function safeUrl(value,base){
    if(!text(value)||!value.trim()||/[\u0000-\u001f\\]/.test(value))return '';
    try{const url=new URL(value,base||'https://reader.invalid/');return ['https:','http:','file:'].includes(url.protocol)?url.href:'';}catch{return '';}
  }
  function manifest(value){
    require(object(value)&&value.schemaVersion===VERSION,'지원하지 않는 교재 형식입니다.');
    require(identifier(value.bookId)&&identifier(value.editionId),'책 또는 편집판 ID가 올바르지 않습니다.');
    require(text(value.title)&&value.title.trim(),'교재 제목이 없습니다.');
    require(['sample','published'].includes(value.status),'아직 공개되지 않은 편집판입니다.');
    require(Array.isArray(value.chapters)&&value.chapters.length>0,'목차가 없습니다.');
    const chapterIds=new Set();
    for(const chapter of value.chapters){
      require(object(chapter)&&identifier(chapter.chapterId)&&text(chapter.title)&&!chapterIds.has(chapter.chapterId),'장 ID 또는 목차 제목이 올바르지 않습니다.');
      chapterIds.add(chapter.chapterId);
    }
    require(Array.isArray(value.pages)&&value.pages.length>0&&value.pages.length<=2000,'본문 쪽 목록이 올바르지 않습니다.');
    const pageIds=new Set(),numbers=new Set();
    for(const page of value.pages){
      require(object(page)&&identifier(page.pageId)&&!pageIds.has(page.pageId),'본문 쪽 ID가 중복되거나 올바르지 않습니다.');
      require(Number.isInteger(page.pageNumber)&&page.pageNumber>0&&!numbers.has(page.pageNumber),'본문 쪽 번호가 중복되거나 올바르지 않습니다.');
      require(chapterIds.has(page.chapterId)&&text(page.title),'본문 쪽의 목차 정보가 올바르지 않습니다.');
      require(HASH.test(page.contentHash||''),'본문 확인용 해시가 없습니다.');
      pageIds.add(page.pageId);numbers.add(page.pageNumber);
    }
    return value;
  }
  function page(value,book,descriptor){
    require(object(value)&&value.schemaVersion===VERSION,'지원하지 않는 본문 형식입니다.');
    for(const key of ['bookId','editionId'])require(value[key]===book[key],'요청한 책의 편집판과 본문이 다릅니다.');
    for(const key of ['pageId','pageNumber','chapterId'])require(value[key]===descriptor[key],'요청한 본문 쪽과 응답이 다릅니다.');
    require(text(value.title)&&Array.isArray(value.blocks)&&value.blocks.length>0,'본문 내용이 없습니다.');
    const ids=new Set();
    for(const block of value.blocks){
      require(object(block)&&identifier(block.blockId)&&!ids.has(block.blockId),'본문 블록 ID가 중복되거나 올바르지 않습니다.');
      require(TYPES.has(block.type),'지원하지 않는 본문 블록입니다.');ids.add(block.blockId);
      if(['heading','paragraph','callout','template'].includes(block.type))require(text(block.text),'본문 문장이 올바르지 않습니다.');
      if(['list','checklist'].includes(block.type))require(strings(block.items),'본문 목록이 올바르지 않습니다.');
      if(block.type==='steps')require(Array.isArray(block.items)&&block.items.every(item=>object(item)&&text(item.text)&&(!item.title||text(item.title))&&(!item.output||text(item.output))),'실습 단계가 올바르지 않습니다.');
      if(block.type==='table')require(strings(block.columns)&&block.columns.length>0&&Array.isArray(block.rows)&&block.rows.every(row=>strings(row)&&row.length===block.columns.length),'표의 열과 행이 맞지 않습니다.');
      if(block.type==='image')require(text(block.alt)&&Number.isFinite(block.width)&&block.width>0&&Number.isFinite(block.height)&&block.height>0&&(text(block.src)||identifier(block.assetId)),'이미지 설명, 크기 또는 주소가 없습니다.');
      if(block.type==='exercise')require(strings(block.steps||[])&&strings(block.checks||[])&&(!block.solution||text(block.solution)),'실습 또는 해설 형식이 올바르지 않습니다.');
      if(block.type==='sources')require(Array.isArray(block.items)&&block.items.every(item=>object(item)&&text(item.title)&&text(item.url)),'출처 목록이 올바르지 않습니다.');
    }
    return value;
  }
  const points=value=>Array.from(String(value||''));
  const pointLength=value=>points(value).length;
  function quoteAt(value,start,end){
    const chars=points(value),a=Math.max(0,Math.min(chars.length,start)),b=Math.max(a,Math.min(chars.length,end));
    return {exact:chars.slice(a,b).join(''),prefix:chars.slice(Math.max(0,a-40),a).join(''),suffix:chars.slice(b,b+40).join('')};
  }
  function resolveAnchor(value,anchor){
    if(!object(anchor)||!object(anchor.quote)||!anchor.quote.exact)return null;
    const chars=points(value),needle=points(anchor.quote.exact),position=anchor.position||{};
    const matches=at=>chars.slice(at,at+needle.length).join('')===anchor.quote.exact;
    const contextMatches=at=>(!anchor.quote.prefix||chars.slice(Math.max(0,at-pointLength(anchor.quote.prefix)),at).join('')===anchor.quote.prefix)&&(!anchor.quote.suffix||chars.slice(at+needle.length,at+needle.length+pointLength(anchor.quote.suffix)).join('')===anchor.quote.suffix);
    // Even a matching offset must still carry the saved quote and its context.
    if(Number.isInteger(position.start)&&position.end===position.start+needle.length&&matches(position.start)&&contextMatches(position.start))return {start:position.start,end:position.end};
    const candidates=[];
    for(let at=0;at<=chars.length-needle.length;at++)if(matches(at)&&contextMatches(at))candidates.push(at);
    return candidates.length===1?{start:candidates[0],end:candidates[0]+needle.length}:null;
  }
  function question(value){
    require(object(value)&&value.schemaVersion===VERSION&&identifier(value.id),'질문 기록 형식이 올바르지 않습니다.');
    require(identifier(value.bookId)&&identifier(value.editionId)&&identifier(value.pageId),'질문의 책 또는 본문 쪽 ID가 올바르지 않습니다.');
    require(HASH.test(value.contentHash||'')&&Number.isInteger(value.pageNumberAtSave)&&value.pageNumberAtSave>0,'질문의 본문 확인 정보가 없습니다.');
    require(text(value.quote)&&value.quote.length>0&&value.quote.length<=100000&&text(value.note)&&value.note.length<=20000,'질문 메모의 길이 또는 원문이 올바르지 않습니다.');
    require(Array.isArray(value.anchors)&&value.anchors.length>0&&value.anchors.length<=1000,'질문의 원문 위치가 없습니다.');
    for(const anchor of value.anchors){
      require(object(anchor)&&identifier(anchor.blockId)&&identifier(anchor.partId)&&object(anchor.quote)&&text(anchor.quote.exact)&&anchor.quote.exact.length>0&&text(anchor.quote.prefix)&&text(anchor.quote.suffix),'인용문 위치 형식이 올바르지 않습니다.');
      require(object(anchor.position)&&Number.isInteger(anchor.position.start)&&anchor.position.start>=0&&Number.isInteger(anchor.position.end)&&anchor.position.end>anchor.position.start&&anchor.position.end-anchor.position.start===pointLength(anchor.quote.exact),'인용문 범위가 올바르지 않습니다.');
    }
    require(value.quote===value.anchors.map(anchor=>anchor.quote.exact).join('\n'),'표시할 원문과 저장한 인용문 위치가 다릅니다.');
    require(text(value.createdAt)&&Number.isFinite(Date.parse(value.createdAt))&&text(value.updatedAt)&&Number.isFinite(Date.parse(value.updatedAt)),'질문 저장 시각이 올바르지 않습니다.');
    return value;
  }
  function position(value,bookId,editionId){
    require(object(value)&&value.schemaVersion===VERSION&&value.bookId===bookId&&value.editionId===editionId&&identifier(value.pageId),'읽던 위치의 형식이 올바르지 않습니다.');
    require((value.blockId===''||identifier(value.blockId))&&Number.isFinite(value.blockProgress)&&value.blockProgress>=0&&value.blockProgress<=1,'읽던 문단의 위치가 올바르지 않습니다.');
    return value;
  }
  function createStore(storage,options={}){
    const prefix=options.prefix||PREFIX;
    const resultError=error=>({ok:false,error:String(error?.message||error||'브라우저 저장소에 접근할 수 없습니다.')});
    function read(key,validate){
      try{const raw=storage.getItem(prefix+key);if(raw===null)return {ok:true,value:null};const value=JSON.parse(raw);return {ok:true,value:validate?validate(value):value};}catch(error){return resultError(error);}
    }
    function write(key,value,validate){
      try{
        if(validate)validate(value);
        // A malformed/unknown earlier record is preserved for recovery.
        const existing=read(key,validate);if(!existing.ok)return existing;
        storage.setItem(prefix+key,JSON.stringify(value));return {ok:true,value};
      }catch(error){return resultError(error);}
    }
    function listQuestions(bookId){
      const values=[],errors=[];
      try{for(let index=0;index<storage.length;index++){
        const key=storage.key(index);if(!key||!key.startsWith(prefix+'question:'))continue;
        const saved=read(key.slice(prefix.length),question);
        if(saved.ok&&saved.value&&(!bookId||saved.value.bookId===bookId))values.push(saved.value);else if(!saved.ok)errors.push({key,error:saved.error});
      }}catch(error){return {...resultError(error),values,errors};}
      values.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return {ok:errors.length===0,values,errors};
    }
    return {
      prefix,
      listQuestions,
      saveQuestion(value){return write(`question:${value.id}`,value,question);},
      deleteQuestion(id){try{require(identifier(id),'질문 ID가 올바르지 않습니다.');storage.removeItem(prefix+`question:${id}`);return {ok:true};}catch(error){return resultError(error);}},
      loadPosition(bookId,editionId){return read(`position:${bookId}:${editionId}`,value=>position(value,bookId,editionId));},
      savePosition(value){return write(`position:${value.bookId}:${value.editionId}`,value,item=>position(item,value.bookId,value.editionId));},
      loadSettings(){return read('settings',value=>{require(object(value)&&value.schemaVersion===VERSION&&Number.isFinite(value.fontScale)&&value.fontScale>=0.9&&value.fontScale<=1.5,'글자 크기 설정이 올바르지 않습니다.');return value;});},
      saveSettings(fontScale){return write('settings',{schemaVersion:VERSION,fontScale},value=>{require(object(value)&&value.schemaVersion===VERSION&&Number.isFinite(value.fontScale)&&value.fontScale>=0.9&&value.fontScale<=1.5,'글자 크기 설정이 올바르지 않습니다.');return value;});},
      exportQuestions(){const loaded=listQuestions();return {...loaded,data:{schemaVersion:VERSION,kind:'personal-edu-reader-questions',exportedAt:new Date().toISOString(),questions:loaded.values}};},
      importQuestions(value){
        try{
          require(object(value)&&value.schemaVersion===VERSION&&value.kind==='personal-edu-reader-questions'&&Array.isArray(value.questions),'리더에서 내보낸 질문 파일을 선택해 주세요.');
          const ids=new Set();for(const item of value.questions){question(item);require(!ids.has(item.id),'가져올 파일에 같은 질문 ID가 중복되어 있습니다.');ids.add(item.id);}
          let added=0,skipped=0;
          for(const item of value.questions){
            const existing=read(`question:${item.id}`,question);if(!existing.ok)return {...existing,added,skipped};
            if(existing.value){skipped++;continue;}
            const saved=write(`question:${item.id}`,item,question);if(!saved.ok)return {...saved,added,skipped};added++;
          }
          return {ok:true,added,skipped};
        }catch(error){return {...resultError(error),added:0,skipped:0};}
      }
    };
  }
  async function sha256(bytes,crypto=window.crypto){
    require(crypto?.subtle,'이 브라우저에서는 본문을 안전하게 확인할 수 없습니다. 최신 브라우저에서 열어 주세요.');
    const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  function uuid(){return window.crypto?.randomUUID?.()||`note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
  window.PersonalEduReaderModelV1=Object.freeze({VERSION,PREFIX,identifier,safeUrl,manifest,page,question,position,pointLength,quoteAt,resolveAnchor,createStore,sha256,uuid});
})();
