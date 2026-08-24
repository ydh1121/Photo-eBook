(function(){
  if(window.__PLATFORM_MODULE_PREVIEW_STORAGE_V1__)return;
  const keys=new Set(['photoRoadmapVideoFavoritesV1','photoRoadmapVideoFavoriteItemsV2','photoRoadmapCuratedFavoritesV1','photoRoadmapCuratedFavoriteItemsV2','photoRoadmapQuestionsV2','photoRoadmapDeviceKeyV1','photoRoadmapThemeV1']);
  const memory=new Map();
  const now=new Date().toISOString();
  memory.set('photoRoadmapVideoFavoritesV1','[]');
  memory.set('photoRoadmapVideoFavoriteItemsV2','{}');
  memory.set('photoRoadmapCuratedFavoritesV1','[]');
  memory.set('photoRoadmapCuratedFavoriteItemsV2','{}');
  memory.set('photoRoadmapQuestionsV2',JSON.stringify([{id:'preview-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:now}]));
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
