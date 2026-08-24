(function(){
  if(window.__PLATFORM_MODULE_PREVIEW_STORAGE_V1__)return;
  const keys=new Set(['photoRoadmapVideoFavoritesV1','photoRoadmapVideoFavoriteItemsV2','photoRoadmapCuratedFavoritesV1','photoRoadmapCuratedFavoriteItemsV2','photoRoadmapQuestionsV2','photoRoadmapDeviceKeyV1','photoRoadmapThemeV1']);
  const memory=new Map();
  const now=new Date().toISOString();

  const videos=[
    {id:'preview-video-product',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'영상',savedAt:now},
    {id:'preview-video-portrait',title:'인물 촬영 현장 체크리스트',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',category:'인물 촬영',channel:'영상',savedAt:now},
    {id:'preview-video-food',title:'음식 촬영 납품 준비',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',category:'음식 촬영',channel:'영상',savedAt:now}
  ];
  const articles=[
    {id:'preview-article',title:'상업사진 견적 체크리스트',og_title:'상업사진 견적 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',platform:'읽을거리',summary:'견적과 납품 범위를 확인하는 예시 항목입니다.',savedAt:now}
  ];
  const questions=[
    {id:'preview-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:now}
  ];

  memory.set('photoRoadmapVideoFavoritesV1',JSON.stringify(videos.map(item=>item.id)));
  memory.set('photoRoadmapVideoFavoriteItemsV2',JSON.stringify(Object.fromEntries(videos.map(item=>[item.id,item]))));
  memory.set('photoRoadmapCuratedFavoritesV1',JSON.stringify(articles.map(item=>item.id)));
  memory.set('photoRoadmapCuratedFavoriteItemsV2',JSON.stringify(Object.fromEntries(articles.map(item=>[item.id,item]))));
  memory.set('photoRoadmapQuestionsV2',JSON.stringify(questions));
  memory.set('photoRoadmapDeviceKeyV1','dev_0123456789abcdef0123456789abcdef0123456789abcdef');
  memory.set('photoRoadmapThemeV1','light');

  const proto=Storage.prototype;
  const get=proto.getItem,set=proto.setItem,remove=proto.removeItem;
  proto.getItem=function(key){const id=String(key);return keys.has(id)?(memory.has(id)?memory.get(id):null):get.call(this,key);};
  proto.setItem=function(key,value){const id=String(key);if(keys.has(id)){memory.set(id,String(value));return;}return set.call(this,key,value);};
  proto.removeItem=function(key){const id=String(key);if(keys.has(id)){memory.delete(id);return;}return remove.call(this,key);};
  window.__PLATFORM_MODULE_PREVIEW_STORAGE__={keys,memory};
  window.__PLATFORM_MODULE_PREVIEW_STORAGE_V1__=true;
})();
