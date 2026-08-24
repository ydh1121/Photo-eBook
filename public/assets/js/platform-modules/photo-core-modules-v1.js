(function(){
  const registry=window.PlatformModuleRegistry;
  const source=window.PhotoPublicModuleSource;
  if(!registry||!source||window.__photoCorePlatformModulesV2)return;
  window.__photoCorePlatformModulesV2=true;

  const shared=['public/assets/js/platform-modules/photo-public-module-source-v1.js'];
  const origin={
    nav:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/navigation/chapter-navigation.js','public/assets/styles/desktop/nav-corrections.css'],
    card:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/desktop/rail-drag.js','public/assets/styles/collection/horizontal-rails.css'],
    collection:['public/assets/js/collection/collection-hub.js','public/assets/styles/collection/hub.css'],
    device:['public/assets/js/collection/device-handoff.js','public/assets/styles/collection/device-accordion.css']
  };
  const consumers=['public','library','editor'];

  registry.register({
    id:'top-chapter-navigation',label:'상단 메뉴',category:'navigation',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.nav],previewProps:{items:source.fixtures.nav},editorProps:{items:source.fixtures.nav},
    render:source.navigation.render,hydrate:source.navigation.hydrate
  });
  registry.register({
    id:'filter-chip-rail',label:'범용 필터칩',category:'navigation',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.collection],previewProps:{tab:'video',items:source.fixtures.collectionItems,activeFilter:'all'},editorProps:{tab:'video',items:source.fixtures.collectionItems,activeFilter:'all'},
    render:source.filterChipRail.render,hydrate:source.filterChipRail.hydrate
  });
  registry.register({
    id:'horizontal-card-rail',label:'가로 카드',category:'content',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.card],previewProps:{items:source.fixtures.market},editorProps:{items:source.fixtures.market},
    render:source.horizontalCardRail.render
  });
  registry.register({
    id:'collection-bottom-sheet',label:'하단 팝업',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.collection,...origin.device],previewProps:{open:true,activeTab:'all',items:source.fixtures.collectionItems},editorProps:{open:true,activeTab:'all',items:source.fixtures.collectionItems},
    render:source.collectionBottomSheet.render,hydrate:source.collectionBottomSheet.hydrate
  });
  registry.register({
    id:'device-handoff-accordion',label:'다른 기기',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.device],previewProps:{},editorProps:{},render:source.deviceHandoff.render,
    hydrate(){setTimeout(()=>window.dispatchEvent(new Event('pageshow')),0);}
  });
  registry.register({
    id:'floating-action',label:'플로팅 버튼',category:'action',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:3,
    ownerFiles:[...shared,...origin.collection],previewProps:{domId:'collectionFabPreview'},editorProps:{domId:'collectionFabPreview'},render:source.floatingAction.render
  });
})();
