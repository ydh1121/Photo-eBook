(function(){
  const frame=document.querySelector('#builderFrame');
  const status=document.querySelector('#builderFrameStatus');
  if(!frame)return;

  function doc(){try{return frame.contentDocument;}catch{return null;}}

  function repairRuntimeGeometry(frameDoc){
    const runtime=frameDoc?.querySelector('#platform-builder-runtime-style');
    if(runtime&&runtime.textContent.includes('[data-builder-capability]{position:relative!important}')){
      runtime.textContent=runtime.textContent.replace('[data-builder-capability]{position:relative!important}','.platform-builder-anchor{position:relative!important}');
    }
    frameDoc?.querySelectorAll('[data-builder-capability]').forEach(node=>{
      node.classList.remove('platform-builder-anchor');
      const position=frame.contentWindow?.getComputedStyle(node)?.position||'static';
      if(position==='static')node.classList.add('platform-builder-anchor');
    });
  }

  function stabilize(){
    const frameDoc=doc();
    if(!frameDoc)return false;
    const app=frameDoc.querySelector('#app');
    if(!app)return false;

    repairRuntimeGeometry(frameDoc);

    /* Page mode must never inherit the library-only body hiding state. */
    if(new URLSearchParams(location.search).get('view')!=='library'){
      delete frameDoc.documentElement.dataset.builderLibrary;
      frameDoc.querySelector('#platformBuilderLibraryFloor')?.remove();
    }

    app.hidden=false;
    app.style.removeProperty('display');
    frameDoc.documentElement.style.removeProperty('visibility');
    frameDoc.body?.style.removeProperty('visibility');
    frameDoc.body?.style.removeProperty('opacity');
    if(status)status.hidden=true;
    return true;
  }

  function onLoad(){
    if(status){status.hidden=false;status.textContent='더미 캔버스를 준비하는 중';}
    [0,60,220,700,1800].forEach(delay=>setTimeout(stabilize,delay));
    setTimeout(()=>{
      if(stabilize())return;
      if(status){status.hidden=false;status.textContent='캔버스를 불러오지 못했습니다. 새로고침해 주세요.';}
    },2600);
  }

  frame.addEventListener('load',onLoad);
  if(frame.contentDocument?.readyState==='complete')onLoad();
})();