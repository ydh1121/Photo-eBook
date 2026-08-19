(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const registry=window.PlatformBlockRegistry;
  const fields={
    topic:document.querySelector('#editorBriefTopic'),
    audience:document.querySelector('#editorBriefAudience'),
    goal:document.querySelector('#editorBriefGoal'),
    context:document.querySelector('#editorBriefContext'),
    mustCover:document.querySelector('#editorBriefMustCover'),
    avoid:document.querySelector('#editorBriefAvoid'),
    toneNotes:document.querySelector('#editorBriefTone'),
    sourcePreferences:document.querySelector('#editorBriefSources'),
    researchPolicy:document.querySelector('#editorBriefResearch'),
    factSensitivity:document.querySelector('#editorBriefSensitivity')
  };
  const statusSelect=document.querySelector('#editorAiStatus');
  const statusLabel=document.querySelector('#editorAiStatusLabel');
  const saveButton=document.querySelector('#editorBriefSave');
  const exportButton=document.querySelector('#editorBriefExport');
  if(!fields.topic||!statusSelect||!saveButton)return;

  const STATUS_LABELS={not_requested:'미요청',brief_ready:'기준 준비됨',drafting:'작성 중',needs_review:'검토 필요',approved:'승인됨'};
  function readDraft(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));}
  function lines(value){return String(value||'').split(/\r?\n/).map(item=>item.trim()).filter(Boolean);}
  function toLines(value){return Array.isArray(value)?value.join('\n'):'';}

  function readBriefForm(){
    return {
      topic:String(fields.topic.value||'').trim(),
      audience:String(fields.audience.value||'').trim(),
      goal:String(fields.goal.value||'').trim(),
      context:String(fields.context.value||'').trim(),
      mustCover:lines(fields.mustCover.value),
      avoid:lines(fields.avoid.value),
      toneNotes:String(fields.toneNotes.value||'').trim(),
      researchPolicy:fields.researchPolicy.value||'current_sources_required',
      sourcePreferences:lines(fields.sourcePreferences?.value),
      factSensitivity:fields.factSensitivity.value||'normal'
    };
  }

  function hasBrief(brief){return Boolean(brief.topic||brief.audience||brief.goal||brief.context||brief.toneNotes||brief.mustCover?.length||brief.avoid?.length||brief.sourcePreferences?.length);}

  function sync(){
    const draft=readDraft();
    const brief=draft.brief&&typeof draft.brief==='object'?draft.brief:{};
    fields.topic.value=brief.topic||'';
    fields.audience.value=brief.audience||'';
    fields.goal.value=brief.goal||'';
    fields.context.value=brief.context||'';
    fields.mustCover.value=toLines(brief.mustCover);
    fields.avoid.value=toLines(brief.avoid);
    fields.toneNotes.value=brief.toneNotes||'';
    if(fields.sourcePreferences)fields.sourcePreferences.value=toLines(brief.sourcePreferences);
    fields.researchPolicy.value=brief.researchPolicy||'current_sources_required';
    fields.factSensitivity.value=brief.factSensitivity||'normal';
    statusSelect.value=draft.aiStatus||'not_requested';
    updateStatusLabel();
  }

  function updateStatusLabel(){statusLabel.textContent=STATUS_LABELS[statusSelect.value]||statusSelect.value;}
  statusSelect.addEventListener('change',updateStatusLabel);

  saveButton.addEventListener('click',()=>{
    const draft=readDraft();
    const brief=readBriefForm();
    let aiStatus=statusSelect.value||'not_requested';
    if(aiStatus==='not_requested'&&hasBrief(brief))aiStatus='brief_ready';
    draft.brief=brief;
    draft.aiStatus=aiStatus;
    writeDraft(draft);
    window.location.reload();
  });

  exportButton?.addEventListener('click',()=>{
    const draft=readDraft();
    const brief=readBriefForm();
    const aiStatus=statusSelect.value||draft.aiStatus||'not_requested';
    const blocks=Array.isArray(draft.blocks)?draft.blocks:[];
    const payload={
      schema:'platform-ai-content-request/v1',
      exportedAt:new Date().toISOString(),
      page:{pageId:draft.pageId||'',industryId:draft.industryId||'general',slug:draft.slug||'',title:draft.pageTitle||'새 분야 가이드',brief,aiStatus,aiReview:draft.aiReview||null},
      blocks:blocks.map(block=>({
        id:block.id,
        type:block.type,
        variant:block.variant,
        editorialProfile:block.editorialProfile||registry?.get(block.type)?.editorialProfile||'',
        referenceProfiles:Array.isArray(block.referenceProfiles)&&block.referenceProfiles.length?block.referenceProfiles:(registry?.get(block.type)?.referenceProfiles||[]),
        content:block.content||{},
        evidence:block.evidence||[],
        aiPolicy:block.aiPolicy||{mode:'full',factState:'needs_verification',fields:{}}
      })),
      instructions:{preserveUserContent:true,doNotChangeLockedFields:true,doNotChangeBlockIdentity:true,factsRequireEvidence:true,finalStatus:'needs_review',responseSchema:'platform-ai-content-response/v1'}
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`ai-content-request-${String(draft.slug||draft.industryId||'page').replace(/[^a-z0-9가-힣-]+/gi,'-')}.json`;
    document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
  });

  sync();
})();
