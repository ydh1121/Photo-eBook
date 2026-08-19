(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const input=document.querySelector('#editorAiResultImport');
  const status=document.querySelector('#editorAiResultStatus');
  if(!input)return;

  const MODES=new Set(['full','wording_only','fact_check_only','locked']);
  const FACT_STATES=new Set(['not_required','needs_verification','verified','stale']);

  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function readDraft(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));}
  function normalizePolicy(value){
    const policy=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {
      mode:MODES.has(policy.mode)?policy.mode:'full',
      factState:FACT_STATES.has(policy.factState)?policy.factState:'needs_verification',
      fields:policy.fields&&typeof policy.fields==='object'&&!Array.isArray(policy.fields)?{...policy.fields}:{}
    };
  }

  function effectiveMode(path,policy){
    let best='';
    let mode=policy.mode;
    for(const [rulePath,ruleMode] of Object.entries(policy.fields||{})){
      if(!MODES.has(ruleMode))continue;
      if(path===rulePath||path.startsWith(`${rulePath}.`)){
        if(rulePath.length>best.length){best=rulePath;mode=ruleMode;}
      }
    }
    return mode;
  }

  function applyValue(current,proposed,path,policy,stats){
    const mode=effectiveMode(path,policy);
    if(mode==='locked'||mode==='fact_check_only'){
      stats.skipped+=1;
      return clone(current);
    }

    if(mode==='wording_only'){
      if(typeof current==='string'&&typeof proposed==='string'){
        if(current!==proposed)stats.applied+=1;
        return proposed;
      }
      if(Array.isArray(current)&&Array.isArray(proposed)){
        return current.map((item,index)=>index<proposed.length?applyValue(item,proposed[index],`${path}.${index}`,policy,stats):clone(item));
      }
      if(current&&typeof current==='object'&&!Array.isArray(current)&&proposed&&typeof proposed==='object'&&!Array.isArray(proposed)){
        const result={};
        for(const key of Object.keys(current)){
          result[key]=Object.prototype.hasOwnProperty.call(proposed,key)
            ?applyValue(current[key],proposed[key],`${path}.${key}`,policy,stats)
            :clone(current[key]);
        }
        return result;
      }
      if(proposed!==undefined&&JSON.stringify(current)!==JSON.stringify(proposed))stats.skipped+=1;
      return clone(current);
    }

    if(Array.isArray(proposed)){
      const currentArray=Array.isArray(current)?current:[];
      const length=Math.max(currentArray.length,proposed.length);
      const result=[];
      for(let i=0;i<length;i++){
        if(i>=proposed.length){result.push(clone(currentArray[i]));continue;}
        if(i>=currentArray.length){
          const childMode=effectiveMode(`${path}.${i}`,policy);
          if(childMode==='locked'||childMode==='fact_check_only'||childMode==='wording_only'){stats.skipped+=1;continue;}
          stats.applied+=1;result.push(clone(proposed[i]));continue;
        }
        result.push(applyValue(currentArray[i],proposed[i],`${path}.${i}`,policy,stats));
      }
      return result;
    }

    if(proposed&&typeof proposed==='object'&&!Array.isArray(proposed)){
      const currentObject=current&&typeof current==='object'&&!Array.isArray(current)?current:{};
      const result={...clone(currentObject)};
      for(const [key,value] of Object.entries(proposed)){
        const childPath=`${path}.${key}`;
        if(Object.prototype.hasOwnProperty.call(currentObject,key))result[key]=applyValue(currentObject[key],value,childPath,policy,stats);
        else{
          const childMode=effectiveMode(childPath,policy);
          if(childMode==='locked'||childMode==='fact_check_only'||childMode==='wording_only'){stats.skipped+=1;continue;}
          result[key]=clone(value);stats.applied+=1;
        }
      }
      return result;
    }

    if(JSON.stringify(current)!==JSON.stringify(proposed))stats.applied+=1;
    return clone(proposed);
  }

  function cleanReview(review){
    const source=review&&typeof review==='object'&&!Array.isArray(review)?review:{};
    const issues=Array.isArray(source.issues)?source.issues.slice(0,200).map(item=>({
      severity:['info','warning','blocker'].includes(item?.severity)?item.severity:'warning',
      blockId:String(item?.blockId||'').slice(0,180),
      message:String(item?.message||'').slice(0,3000)
    })):[];
    const researchNotes=Array.isArray(source.researchNotes)?source.researchNotes.slice(0,100).map(item=>String(item||'').slice(0,3000)):[];
    return {summary:String(source.summary||'').slice(0,10000),issues,researchNotes};
  }

  function applyResponse(payload){
    if(payload?.schema!=='platform-ai-content-response/v1')throw new Error('AI 결과 형식이 맞지 않습니다.');
    const draft=readDraft();
    if(!draft.pageId||String(payload.pageId||'')!==String(draft.pageId))throw new Error('현재 페이지와 AI 결과의 pageId가 다릅니다.');
    if(!Array.isArray(draft.blocks))throw new Error('현재 페이지의 block 데이터를 찾지 못했습니다.');

    const blockMap=new Map(draft.blocks.map(block=>[String(block.id),block]));
    const changes=Array.isArray(payload.blockChanges)?payload.blockChanges:[];
    const stats={applied:0,skipped:0,warnings:[]};
    const blockNotes=[];

    for(const change of changes){
      const block=blockMap.get(String(change?.blockId||''));
      if(!block){stats.warnings.push(`없는 block id: ${String(change?.blockId||'')}`);continue;}
      if(change?.type&&String(change.type)!==String(block.type)){stats.warnings.push(`${block.id}: block type 불일치`);continue;}
      const policy=normalizePolicy(block.aiPolicy);
      block.aiPolicy=policy;

      if(change?.note)blockNotes.push({blockId:block.id,note:String(change.note).slice(0,5000)});

      if(policy.mode==='locked'||policy.mode==='fact_check_only'){
        if(change?.content!==undefined||change?.evidence!==undefined||change?.factState!==undefined)stats.skipped+=1;
        continue;
      }

      if(change?.content&&typeof change.content==='object'&&!Array.isArray(change.content)){
        block.content=applyValue(block.content||{},change.content,'content',policy,stats);
      }

      if(Array.isArray(change?.evidence)){
        block.evidence=clone(change.evidence).slice(0,100);
        stats.applied+=1;
      }

      if(FACT_STATES.has(change?.factState)){
        let next=change.factState;
        if(next==='verified'&&(!Array.isArray(block.evidence)||block.evidence.length===0)){
          next='needs_verification';
          stats.warnings.push(`${block.id}: 근거가 없어 verified를 적용하지 않았습니다.`);
        }
        block.aiPolicy.factState=next;
      }

      block.revision={...(block.revision||{}),updatedAt:new Date().toISOString(),updatedBy:'ai-response-import'};
    }

    const pageReview=cleanReview(payload.pageReview);
    draft.aiReview={...pageReview,blockNotes,importedAt:new Date().toISOString(),warnings:stats.warnings};
    draft.aiStatus='needs_review';
    writeDraft(draft);
    return stats;
  }

  function show(text,kind='idle'){
    if(!status)return;
    status.textContent=text;
    status.dataset.status=kind;
  }

  input.addEventListener('change',async()=>{
    const file=input.files?.[0];
    input.value='';
    if(!file)return;
    show('AI 결과 확인 중');
    try{
      const payload=JSON.parse(await file.text());
      const stats=applyResponse(payload);
      const warningText=stats.warnings.length?` · 경고 ${stats.warnings.length}`:'';
      show(`적용 ${stats.applied} · 건너뜀 ${stats.skipped}${warningText}`,'ok');
      setTimeout(()=>window.location.reload(),500);
    }catch(error){
      show(error?.message||'AI 결과를 적용하지 못했습니다.','error');
    }
  });
})();
