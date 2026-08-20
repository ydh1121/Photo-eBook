(function(){
  const keys=new Set([
    'photoRoadmapVideoFavoritesV1','photoRoadmapVideoFavoriteItemsV2',
    'photoRoadmapCuratedFavoritesV1','photoRoadmapCuratedFavoriteItemsV2',
    'photoRoadmapQuestionsV2','photoRoadmapDeviceKeyV1'
  ]);
  const memory=new Map();
  const now=new Date().toISOString();
  const videos={
    'dummy-video-1':{id:'dummy-video-1',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'더미 영상',savedAt:now}
  };
  const articles={
    'dummy-article-1':{id:'dummy-article-1',title:'인물 촬영 현장 체크리스트',og_title:'인물 촬영 현장 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',platform:'읽을거리',summary:'실제 목록 레이아웃 검증을 위한 더미 항목입니다.',savedAt:now},
    'dummy-article-2':{id:'dummy-article-2',title:'음식 촬영 납품 준비',og_title:'음식 촬영 납품 준비',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',platform:'읽을거리',summary:'실제 사용자 데이터와 연결되지 않습니다.',savedAt:now}
  };
  memory.set('photoRoadmapVideoFavoritesV1',JSON.stringify(Object.keys(videos)));
  memory.set('photoRoadmapVideoFavoriteItemsV2',JSON.stringify(videos));
  memory.set('photoRoadmapCuratedFavoritesV1',JSON.stringify(Object.keys(articles)));
  memory.set('photoRoadmapCuratedFavoriteItemsV2',JSON.stringify(articles));
  memory.set('photoRoadmapQuestionsV2',JSON.stringify([{id:'dummy-question-1',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'더미 질문 문맥',created_at:now}]));
  memory.set('photoRoadmapDeviceKeyV1','dev_0123456789abcdef0123456789abcdef0123456789abcdef');

  const proto=Storage.prototype;
  const get=proto.getItem, set=proto.setItem, remove=proto.removeItem, clear=proto.clear;
  proto.getItem=function(key){return keys.has(String(key))?(memory.has(String(key))?memory.get(String(key)):null):get.call(this,key);};
  proto.setItem=function(key,value){if(keys.has(String(key))){memory.set(String(key),String(value));return;}return set.call(this,key,value);};
  proto.removeItem=function(key){if(keys.has(String(key))){memory.delete(String(key));return;}return remove.call(this,key);};
  proto.clear=function(){keys.forEach(key=>memory.delete(key));return;};
  window.__PLATFORM_SANDBOX_STORAGE__={keys,memory};
  document.documentElement.dataset.builderSandbox='true';
})();
