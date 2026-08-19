(function(){
  const runtime=window.PublicSnapshotRuntimeV2;
  const root=document.querySelector('#publicSnapshotV2Root');
  const status=document.querySelector('#publicSnapshotV2Status');
  if(!runtime||!root)return;

  function findDraft(){
    const candidates=[window.__VIDEO_EDITOR_QA_PAGE,window.__VIDEO_EDITOR_QA_DRAFT,window.__PLATFORM_QA_VIDEO_EDITOR,window.__VIDEO_EDITOR_DRAFT_V1];
    return candidates.find(value=>value&&typeof value==='object')||null;
  }

  function normalizeDraft(source){
    const page=source.page&&typeof source.page==='object'?source.page:source;
    const blocks=Array.isArray(source.blocks)?source.blocks:Array.isArray(page.blocks)?page.blocks:[];
    const snapshot={
      snapshotId:'staging-v2-candidate',
      pageId:String(page.pageId||'page_video_editor_qa_v1'),
      version:'candidate',
      slug:String(page.slug||'video-editor'),
      industryId:String(page.industryId||'video-editor'),
      title:String(page.title||page.pageTitle||'영상편집 QA'),
      theme:String(page.theme||'light'),
      seo:page.seo&&typeof page.seo==='object'?page.seo:{title:String(page.title||page.pageTitle||'영상편집 QA'),description:'Snapshot V2 구조와 디자인 설정을 검토하는 staging 화면입니다.',indexPolicy:'noindex',schemaType:'Article'},
      sourceUpdatedAt:String(page.updatedAt||new Date().toISOString()),
      publishedAt:'staging'
    };
    const decorated=blocks.map((block,index)=>{
      const copy=JSON.parse(JSON.stringify(block));
      if(index===0&&!copy.resolvedStyle)copy.resolvedStyle={radius:'large',border:'subtle',shadow:'none'};
      if(copy.type==='comparison-cards'&&!copy.resolvedStyle)copy.resolvedStyle={density:'standard',surface:'card',radius:'medium',border:'subtle',shadow:'none',accentMode:'accent',mediaRatio:'16:10',edgeTreatment:'runway'};
      if(copy.type==='product-tool'&&!copy.resolvedStyle)copy.resolvedStyle={density:'standard',surface:'grouped',radius:'medium',border:'subtle',shadow:'none',accentMode:'neutral'};
      return copy;
    });
    const uiCapabilities=[
      {capabilityId:'top-chapter-navigation',enabled:false,presetId:'photo-topnav-blue-progress',config:{chipFamily:'ios-liquid',accentColor:'#437ce7',progressEnabled:true,progressMode:'chapter-wash',progressColor:'#4081ef'}},
      {capabilityId:'horizontal-card-rail',enabled:true,presetId:'photo-rail-balanced-fade',config:{nativeTouch:true,desktopDrag:true,leftShadowGuard:true,leftPaintRunway:16,rightFade:true,rightFadeMode:'alpha-mask',rightFadeWidth:112,rightContentPadding:122,scrollbar:'hidden'}},
      {capabilityId:'filter-chip-rail',enabled:false,presetId:'photo-collection-filter-flat',config:{family:'ios-flat',accentColor:'#202226'}}
    ];
    return {snapshot,blocks:decorated,uiCapabilities};
  }

  try{
    const source=findDraft();
    if(!source)throw new Error('영상편집 QA draft 전역 데이터를 찾지 못했습니다.');
    const payload=normalizeDraft(source);
    const result=runtime.render(payload,{root,statusNode:status,allowCandidate:true});
    if(result.ok){
      const note=document.querySelector('#publicSnapshotV2Note');
      if(note)note.textContent=`resolvedStyle ${payload.blocks.filter(block=>block.resolvedStyle&&Object.keys(block.resolvedStyle).length).length}개 · UI context ${payload.uiCapabilities.length}개`;
    }
  }catch(error){
    root.innerHTML=`<section class="public-snapshot-error"><strong>Snapshot V2 staging을 표시하지 못했습니다.</strong><p>${String(error?.message||error)}</p></section>`;
    if(status)status.textContent='오류';
  }
})();
