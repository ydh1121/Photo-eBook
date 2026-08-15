/* v19: user-facing copy cleanup for curated reading links. */
(function(){
  const friendlyCopy='사진을 더 잘 찍는 데 도움이 되는 글을 모았습니다. 관심 있는 글은 즐겨찾기에 저장해 두고 필요할 때 다시 확인해보세요.';

  function cleanCuratedUi(){
    const head=document.querySelector('.curated-head');
    const copy=head?.querySelector('p');
    if(copy)copy.textContent=friendlyCopy;

    const refresh=document.querySelector('#curatedRefresh');
    if(refresh&&refresh.textContent.trim()==='링크 새로고침')refresh.textContent='새 글 확인';

    const status=document.querySelector('#curatedStatus');
    if(status){
      status.textContent=status.textContent
        .replace(/\s*\/\s*SEO 정보\s*\d+개\s*갱신 중/g,' / 새 글 정보를 확인하는 중')
        .replace(/시트의 CURATED_LINKS 연결 상태를 확인해 주세요\.?/g,'촬영 팁을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  if(typeof window.sourcesSection==='function'){
    const originalSourcesSection=window.sourcesSection;
    window.sourcesSection=function(...args){
      return originalSourcesSection(...args)
        .replace('브런치와 티스토리 글을 계속 추가할 수 있습니다. 링크의 대표 이미지와 설명은 원문 SEO 정보를 기준으로 갱신합니다.',friendlyCopy)
        .replace('>링크 새로고침<','>새 글 확인<');
    };
  }

  if(typeof window.loadCuratedLinks==='function'){
    const originalLoadCuratedLinks=window.loadCuratedLinks;
    window.loadCuratedLinks=async function(...args){
      const result=await originalLoadCuratedLinks(...args);
      cleanCuratedUi();
      return result;
    };
  }

  const run=()=>{
    cleanCuratedUi();
    const app=document.querySelector('#app');
    if(app){
      const observer=new MutationObserver(cleanCuratedUi);
      observer.observe(app,{childList:true,subtree:true,characterData:true});
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
