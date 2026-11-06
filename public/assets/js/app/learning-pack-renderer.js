/* Composition only. Visual and interaction owners are canonical modules. */
function hero(data){return window.PlatformModuleRegistry.render('learning-guide-hero',data.guide.hero,{consumer:'public'});}
function learningSection(data,n,index){
  const guide=data.guide,chapter=guide.chapters.find(item=>item.id===n.id);
  return window.PlatformModuleRegistry.render('learning-guide-section',{packId:guide.id,chapter,index,sources:guide.sources,showSources:index===guide.chapters.length-1},{consumer:'public'});
}
(function(){
  function hydrate(){
    const guide=window.__SITE_DATA?.guide;if(!guide)return;
    guide.chapters.forEach((chapter,index)=>{
      const host=document.getElementById(chapter.id);if(!host)return;
      window.PlatformModuleRegistry.get('learning-guide-section').hydrate(host,{packId:guide.id,chapter,index,sources:guide.sources},{consumer:'public'});
    });
    if(!document.querySelector('.edu-page-footer')){
      const footer=document.createElement('footer');footer.className='edu-page-footer';
      const p=document.createElement('p');p.textContent=`자료 확인 ${guide.reviewedAt} · 실습 이미지는 AI로 생성했습니다.`;footer.appendChild(p);document.getElementById('app').appendChild(footer);
    }
  }
  document.addEventListener('content-pack-rendered',hydrate);
})();
