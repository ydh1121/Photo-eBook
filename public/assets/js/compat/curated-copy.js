/* v23: safe user-facing copy cleanup for curated reading links.
   Do not observe or rewrite the rendered app DOM. */
(function(){
  const friendlyCopy='사진을 더 잘 찍는 데 도움이 되는 글을 모았습니다. 관심 있는 글은 즐겨찾기에 저장해 두고 필요할 때 다시 확인해보세요.';

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
      const refresh=document.querySelector('#curatedRefresh');
      if(refresh&&refresh.textContent.trim()==='링크 새로고침') refresh.textContent='새 글 확인';
      return result;
    };
  }
})();
