(function(){
  const registry=window.PlatformModuleRegistry;
  const source=window.PhotoPublicModuleSource;
  if(!registry||!source||window.__photoCorePlatformModulesV6)return;
  window.__photoCorePlatformModulesV6=true;

  const shared=['public/assets/js/platform-modules/photo-public-module-source-v1.js'];
  const origin={
    nav:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/navigation/chapter-navigation.js','public/assets/styles/desktop/nav-corrections.css'],
    card:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/desktop/rail-drag.js','public/assets/styles/collection/horizontal-rails.css'],
    collection:[
      'public/assets/js/collection/collection-hub.js',
      'public/assets/js/collection/bulk-selection.js',
      'public/assets/js/questions/question-workspace.js',
      'public/assets/js/questions/question-actions.js',
      'public/assets/js/app/app-shell.js',
      'public/assets/styles/collection/hub.css',
      'public/assets/styles/collection/selection-state.css',
      'public/assets/styles/collection/bulk-actions.css',
      'public/assets/styles/questions/workspace-controls.css',
      'public/assets/styles/questions/workspace-stability.css',
      'public/assets/styles/questions/workspace-final.css'
    ],
    liquid:['public/assets/js/ui/liquid-controller.js','public/assets/styles/ui/liquid-flat-canonical.css','public/assets/styles/ui/liquid-skin.css','public/assets/styles/ui/pill-hierarchy.css'],
    filterFamilies:['public/assets/styles/platform-modules/filter-chip-rail-v1.css'],
    device:['public/assets/js/collection/device-handoff.js','public/assets/styles/collection/device-accordion.css']
  };
  const consumers=['public','library','editor'];
  const esc=registry.escapeHtml;
  const attr=registry.attr;

  function normalizeGenericFilterItems(items){
    const fallback=['전체','제품 촬영','인물 촬영','음식 촬영'];
    const sourceItems=Array.isArray(items)&&items.length?items:fallback;
    return sourceItems.map((item,index)=>{
      if(item&&typeof item==='object')return {id:String(item.id||item.value||`filter-${index}`),label:String(item.label||item.value||`필터 ${index+1}`)};
      const label=String(item||'').trim()||`필터 ${index+1}`;
      return {id:index===0?'all':`filter-${index}`,label};
    });
  }

  function renderButtons(items,activeId,className){
    return items.map((item,index)=>`<button type="button" class="${className} ${item.id===activeId||(!activeId&&index===0)?'is-active':''}" data-platform-filter-id="${attr(item.id)}" aria-pressed="${item.id===activeId||(!activeId&&index===0)?'true':'false'}">${esc(item.label)}</button>`).join('');
  }

  function renderGenericFilterRail(props={}){
    const items=normalizeGenericFilterItems(props.items||props.options);
    const activeId=String(props.activeId||items[0]?.id||'all');
    const label=attr(props.ariaLabel||'필터');
    const liquidButtons=renderButtons(items,activeId,'collection-tab');
    const flatButtons=renderButtons(items,activeId,'platform-filter-button');
    const materialButtons=renderButtons(items,activeId,'platform-filter-button');
    return `<div class="platform-filter-chip-module" data-platform-module="filter-chip-rail" data-platform-filter-family="ios-liquid">
      <div class="collection-tabs platform-filter-chip-source platform-filter-chip-source--liquid" role="group" aria-label="${label}">${liquidButtons}</div>
      <div class="platform-filter-chip-source platform-filter-chip-source--ios-flat" role="group" aria-label="${label}" hidden>${flatButtons}</div>
      <div class="platform-filter-chip-source platform-filter-chip-source--material-flat" role="group" aria-label="${label}" hidden>${materialButtons}</div>
    </div>`;
  }

  function hydrateGenericFilterRail(host){
    const module=host.matches?.('[data-platform-module="filter-chip-rail"]')?host:host.querySelector('[data-platform-module="filter-chip-rail"]');
    if(!module||module.dataset.platformFilterBound==='true')return;
    module.dataset.platformFilterBound='true';
    function sync(id){
      module.querySelectorAll('[data-platform-filter-id]').forEach(button=>{
        const active=button.dataset.platformFilterId===id;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      const liquid=module.querySelector('.platform-filter-chip-source--liquid');
      requestAnimationFrame(()=>liquid?.__photoLiquidController?.update?.({instant:false}));
    }
    const click=event=>{
      const button=event.target.closest?.('[data-platform-filter-id]');
      if(!button||!module.contains(button))return;
      const id=button.dataset.platformFilterId||'all';
      sync(id);
      module.dataset.platformFilterValue=id;
      module.dispatchEvent(new CustomEvent('platform-filter-select',{bubbles:true,detail:{value:id,button}}));
    };
    module.addEventListener('click',click);
    setTimeout(()=>window.dispatchEvent(new Event('pageshow')),0);
    return ()=>module.removeEventListener('click',click);
  }

  registry.register({
    id:'top-chapter-navigation',label:'상단 메뉴',category:'navigation',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:6,
    ownerFiles:[...shared,...origin.nav],previewProps:{items:source.fixtures.nav},editorProps:{items:source.fixtures.nav},
    styleDefaults:{enabled:true,stickyMode:'deferred-sticky',chipFamily:'ios-liquid',accentColor:'#437ce7',fontFamily:'system-sans',fontSize:15,fontWeight:680,letterSpacing:-.38,progressEnabled:true,progressMode:'chapter-wash',progressColor:'#4081ef',progressOpacityStart:24,progressOpacityEnd:16,mobileChipGap:6,desktopChipGap:9,railInset:5.5,response:'standard',overshoot:'high',durationScale:1.1,safariSafety:true},
    render:source.navigation.render,hydrate:source.navigation.hydrate
  });
  registry.register({
    id:'filter-chip-rail',label:'범용 필터칩',category:'navigation',status:'approved',source:'platform-core',sourceRoute:'/',consumers,version:7,
    ownerFiles:[...origin.liquid,...origin.filterFamilies],previewProps:{items:['전체','제품 촬영','인물 촬영','음식 촬영'],activeId:'all'},editorProps:{items:['전체','제품 촬영','인물 촬영','음식 촬영'],activeId:'all'},
    styleDefaults:{family:'ios-liquid',accentColor:'#4c7fdf',fontFamily:'system-sans',fontSize:14,fontWeight:680,letterSpacing:-.28,surfaceOpacity:54,blur:15,response:'standard',overshoot:'medium',gap:8,runway:4},
    render:renderGenericFilterRail,hydrate:hydrateGenericFilterRail
  });
  registry.register({
    id:'horizontal-card-rail',label:'가로 카드',category:'content',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:5,
    ownerFiles:[...shared,...origin.card],previewProps:{items:source.fixtures.market},editorProps:{items:source.fixtures.market},
    styleDefaults:{nativeTouch:true,desktopDrag:true,leftShadowGuard:true,leftPaintRunway:16,leftFade:false,rightFade:true,rightFadeMode:'alpha-mask',rightFadeWidth:112,rightContentPadding:122,scrollbar:'hidden',dragThreshold:5,clickSuppressMs:220},
    render:source.horizontalCardRail.render
  });
  registry.register({
    id:'collection-bottom-sheet',label:'하단 팝업',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:6,
    ownerFiles:[...shared,...origin.collection,...origin.liquid,...origin.device],previewProps:{open:true,activeTab:'all'},editorProps:{open:true,activeTab:'all'},
    styleDefaults:{enabled:true,backdrop:true,backdropBlur:12,sheetBlur:26,sheetSaturation:135,maxWidth:760,maxHeightDvh:84,radiusTop:30,handle:true,tabs:true,search:true,filters:true,bulkSelection:true,themeSelector:true,deviceHandoff:true},
    render:source.collectionBottomSheet.render,hydrate:source.collectionBottomSheet.hydrate
  });
  registry.register({
    id:'device-handoff-accordion',label:'아코디언 탭',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:5,
    ownerFiles:[...shared,...origin.device],previewProps:{},editorProps:{},styleDefaults:{enabled:true,heightMode:'measured',response:'standard',copyAction:true,connectAction:true,statusMessage:true},render:source.deviceHandoff.render,
    hydrate(){setTimeout(()=>window.dispatchEvent(new Event('pageshow')),0);}
  });
  registry.register({
    id:'floating-action',label:'플로팅 버튼',category:'action',status:'approved',source:'public-extracted',sourceRoute:'/',consumers,version:5,
    ownerFiles:[...shared,...origin.collection],previewProps:{domId:'collectionFabPreview'},editorProps:{domId:'collectionFabPreview'},styleDefaults:{family:'glass',accentColor:'#315fc9',response:'standard',overshoot:'low'},render:source.floatingAction.render
  });
})();
