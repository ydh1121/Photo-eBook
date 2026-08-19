(function(){
  const runtime=window.PlatformPublicSnapshot;
  const fixture=window.__VIDEO_EDITOR_QA_DRAFT;
  const root=document.querySelector('#publicSnapshotRoot');
  if(!runtime||!fixture||!root){
    if(root)root.innerHTML='<div class="public-snapshot-error">staging 데이터를 불러오지 못했습니다.</div>';
    return;
  }

  const snapshot={
    snapshotId:'staging-video-editor-v1',
    pageId:fixture.page.pageId,
    version:0,
    slug:fixture.page.slug,
    industryId:fixture.page.industryId,
    title:fixture.page.title,
    theme:fixture.page.theme,
    seo:{
      title:'영상편집으로 먹고살기 | 공개 renderer staging',
      description:'영상편집 프리랜서 가이드의 공개 renderer 구조를 검토하기 위한 noindex staging 화면입니다.',
      schemaType:'Article',
      ogImage:'',
      siteName:'먹고살기',
      authorName:'',
      indexPolicy:'noindex',
      reviewedAt:'2026-08-20'
    },
    blocks:fixture.blocks,
    publishedAt:null
  };

  const result=runtime.render(snapshot,{root,indexable:false,allowCandidate:true,showStatus:true});
  const badge=document.querySelector('#publicSnapshotStatus');
  if(badge)badge.textContent=result.validation.ok?'candidate block 포함':'renderer 오류';
})();
