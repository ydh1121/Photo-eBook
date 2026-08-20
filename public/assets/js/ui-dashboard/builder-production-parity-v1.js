(function(){
  const frame=document.querySelector('#builderFrame');
  if(!frame)return;

  const PARITY_STYLES=['/assets/styles/desktop/nav-corrections.css?v=1'];
  let timer=0;

  function doc(){try{return frame.contentDocument;}catch{return null;}}

  function ensureParityStyles(frameDoc){
    if(!frameDoc?.head)return;
    PARITY_STYLES.forEach(href=>{
      const path=href.split('?')[0];
      const exists=[...frameDoc.querySelectorAll('link[rel="stylesheet"]')].some(link=>(link.getAttribute('href')||'').split('?')[0]===path&&link.dataset.builderParity==='true');
      if(exists)return;
      const link=frameDoc.createElement('link');
      link.rel='stylesheet';link.href=href;link.dataset.builderParity='true';
      frameDoc.head.appendChild(link);
    });
  }

  function repairRuntimeGeometry(frameDoc){
    const runtime=frameDoc?.querySelector('#platform-builder-runtime-style');
    if(runtime&&runtime.textContent.includes('[data-builder-capability]{position:relative!important}')){
      runtime.textContent=runtime.textContent.replace('[data-builder-capability]{position:relative!important}','.platform-builder-anchor{position:relative!important}');
    }
    frameDoc?.querySelectorAll('[data-builder-capability]').forEach(node=>{
      if(node.dataset.builderParityAnchor)return;
      node.classList.remove('platform-builder-anchor');
      const position=frame.contentWindow?.getComputedStyle(node)?.position||'static';
      if(position==='static'){
        node.classList.add('platform-builder-anchor');
        node.dataset.builderParityAnchor='static';
      }else{
        node.dataset.builderParityAnchor='native';
      }
    });
  }

  function repairNav(frameDoc){
    const shell=frameDoc?.querySelector('.nav-shell');
    if(!shell)return;
    shell.dataset.builderParitySource='production';
    const scroll=shell.querySelector('.nav-scroll');
    if(scroll)scroll.dataset.builderParitySource='production';
  }

  function apply(){
    const frameDoc=doc();if(!frameDoc||frameDoc.documentElement.dataset.builderSandbox!=='true')return;
    ensureParityStyles(frameDoc);
    repairRuntimeGeometry(frameDoc);
    repairNav(frameDoc);
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(apply,30);
  }

  frame.addEventListener('load',()=>{
    [20,180,600,1500,3600].forEach(delay=>setTimeout(apply,delay));
    const frameDoc=doc();
    if(frameDoc&&frameDoc.documentElement.dataset.builderParityObserver!=='true'){
      frameDoc.documentElement.dataset.builderParityObserver='true';
      new MutationObserver(schedule).observe(frameDoc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-builder-capability']});
    }
  });
  setInterval(apply,1800);
})();