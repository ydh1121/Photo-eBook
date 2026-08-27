/* v5: portable primitive refinements. Screen mode is composed later from the canonical filter-chip dependency. */
(function(){
  if(window.__platformPortablePrimitivesExtensionV5)return;
  window.__platformPortablePrimitivesExtensionV5=true;

  const registry=window.PlatformModuleRegistry;
  if(!registry)return;

  const extJs='public/assets/js/platform-modules/portable-primitives-extension-v2.js';
  const extCss='public/assets/styles/platform-modules/portable-primitives-extension-v2.css';
  const styleExt='public/assets/js/platform-modules/module-style-runtime-portable-v1.js';
  const styleComposition='public/assets/js/platform-modules/module-style-runtime-composition-v1.js';
  const uniq=list=>[...new Set((list||[]).filter(Boolean))];

  function registerPatch(id,patch={}){
    const current=registry.get(id);
    if(!current)return null;
    return registry.register({...current,...patch});
  }

  function hydrateHorizontalRail(host){
    const module=host.matches?.('[data-platform-module="horizontal-rail"]')?host:host.querySelector?.('[data-platform-module="horizontal-rail"]');
    const track=module?.querySelector('.platform-horizontal-rail__track');
    if(!module||!track||track.dataset.platformRailBoundV2==='true')return;
    track.dataset.platformRailBoundV2='true';

    let pointerId=null,startX=0,startScroll=0,dragging=false,suppressUntil=0;
    const enabled=()=>track.dataset.moduleDesktopDrag!=='false';
    const threshold=()=>Math.max(0,Number(track.dataset.moduleDragThreshold||5));
    const suppressMs=()=>Math.max(0,Number(track.dataset.moduleClickSuppressMs||220));

    const down=event=>{
      if(!enabled()||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      pointerId=event.pointerId;
      startX=event.clientX;
      startScroll=track.scrollLeft;
      dragging=false;
      track.classList.add('is-pointerdown');
    };
    const move=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      const dx=event.clientX-startX;
      if(!dragging&&Math.abs(dx)<threshold())return;
      if(!dragging){
        dragging=true;
        track.classList.add('is-dragging');
        try{track.setPointerCapture(pointerId);}catch{}
      }
      track.scrollLeft=startScroll-dx;
      if(event.cancelable)event.preventDefault();
    };
    const finish=event=>{
      if(pointerId===null||event.pointerId!==pointerId)return;
      const didDrag=dragging;
      try{track.releasePointerCapture(pointerId);}catch{}
      pointerId=null;
      dragging=false;
      track.classList.remove('is-pointerdown','is-dragging');
      if(didDrag)suppressUntil=performance.now()+suppressMs();
    };
    const click=event=>{
      if(performance.now()>suppressUntil)return;
      if(!event.target.closest?.('a,button'))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressUntil=0;
    };

    track.addEventListener('pointerdown',down,true);
    track.addEventListener('pointermove',move,{capture:true,passive:false});
    track.addEventListener('pointerup',finish,true);
    track.addEventListener('pointercancel',finish,true);
    track.addEventListener('click',click,true);

    return ()=>{
      delete track.dataset.platformRailBoundV2;
      track.removeEventListener('pointerdown',down,true);
      track.removeEventListener('pointermove',move,true);
      track.removeEventListener('pointerup',finish,true);
      track.removeEventListener('pointercancel',finish,true);
      track.removeEventListener('click',click,true);
    };
  }

  const rail=registry.get('horizontal-rail');
  if(rail){
    registerPatch('horizontal-rail',{
      label:'가로 레일',
      version:2,
      ownerFiles:uniq([...rail.ownerFiles,extJs,extCss,styleExt]),
      styleDefaults:{
        nativeTouch:true,
        desktopDrag:true,
        leftShadowGuard:true,
        leftPaintRunway:16,
        leftFade:false,
        rightFade:true,
        rightFadeMode:'alpha-mask',
        rightFadeWidth:112,
        rightContentPadding:122,
        scrollbar:'hidden',
        dragThreshold:5,
        clickSuppressMs:220
      },
      hydrate:hydrateHorizontalRail
    });
  }

  registerPatch('accordion',{label:'기본 아코디언',version:2});
  registerPatch('device-handoff-accordion',{label:'기기 연결 아코디언',version:6});

  const collection=registry.get('collection-bottom-sheet');
  if(collection){
    registerPatch('collection-bottom-sheet',{
      label:'내 모음 하단 팝업',
      version:8,
      ownerFiles:uniq([...(collection.ownerFiles||[]),styleComposition])
    });
  }

  const sheet=registry.get('bottom-sheet');
  if(sheet){
    const preview=registry.clone(sheet.previewProps||{});
    const editor=registry.clone(sheet.editorProps||{});
    preview.eyebrow='BOTTOM SHEET';
    preview.title='범용 하단 시트';
    preview.description='하단에서 열리는 범용 패널입니다.';
    if(preview.secondaryAction)preview.secondaryAction={...preview.secondaryAction,label:''};
    registerPatch('bottom-sheet',{
      label:'범용 하단 시트',
      version:2,
      ownerFiles:uniq([...sheet.ownerFiles,extCss]),
      previewProps:preview,
      editorProps:editor
    });
  }
})();
