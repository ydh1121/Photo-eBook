(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const fields={
    title:document.querySelector('#editorSeoTitle'),
    description:document.querySelector('#editorSeoDescription'),
    schemaType:document.querySelector('#editorSeoSchemaType'),
    ogImage:document.querySelector('#editorSeoOgImage'),
    siteName:document.querySelector('#editorSeoSiteName'),
    authorName:document.querySelector('#editorSeoAuthorName'),
    indexPolicy:document.querySelector('#editorSeoIndexPolicy'),
    reviewedAt:document.querySelector('#editorSeoReviewedAt')
  };
  const status=document.querySelector('#editorSeoStatus');
  const saveButton=document.querySelector('#editorSeoSave');
  const copyTitleButton=document.querySelector('#editorSeoUsePageTitle');
  if(!fields.title||!fields.description||!saveButton)return;

  function readDraft(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function writeDraft(draft){draft.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));}
  function setStatus(text,kind='idle'){if(!status)return;status.textContent=text;status.dataset.status=kind;}

  function readForm(){
    return {
      title:String(fields.title.value||'').trim(),
      description:String(fields.description.value||'').trim(),
      schemaType:['Article','WebPage'].includes(fields.schemaType.value)?fields.schemaType.value:'Article',
      ogImage:String(fields.ogImage.value||'').trim(),
      siteName:String(fields.siteName.value||'').trim()||'먹고살기',
      authorName:String(fields.authorName.value||'').trim(),
      indexPolicy:fields.indexPolicy.value==='noindex'?'noindex':'index',
      reviewedAt:String(fields.reviewedAt.value||'').trim()||null
    };
  }

  function sync(){
    const draft=readDraft();
    const seo=draft.seo&&typeof draft.seo==='object'?draft.seo:{};
    fields.title.value=seo.title||'';
    fields.description.value=seo.description||'';
    fields.schemaType.value=['Article','WebPage'].includes(seo.schemaType)?seo.schemaType:'Article';
    fields.ogImage.value=seo.ogImage||'';
    fields.siteName.value=seo.siteName||'먹고살기';
    fields.authorName.value=seo.authorName||'';
    fields.indexPolicy.value=seo.indexPolicy==='noindex'?'noindex':'index';
    fields.reviewedAt.value=seo.reviewedAt||'';
    const missing=[];
    if(!seo.title)missing.push('SEO 제목');
    if(!seo.description)missing.push('설명');
    setStatus(missing.length?`${missing.join(', ')} 입력 필요`:'기본 메타데이터 준비됨',missing.length?'warning':'ok');
  }

  saveButton.addEventListener('click',()=>{
    const draft=readDraft();
    draft.seo=readForm();
    writeDraft(draft);
    setStatus('저장됨','ok');
  });

  copyTitleButton?.addEventListener('click',()=>{
    const draft=readDraft();
    fields.title.value=String(draft.pageTitle||'').trim();
    fields.title.focus();
  });

  sync();
})();
