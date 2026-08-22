(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderProgressOwnerAuditV1)return;
  window.__platformBuilderProgressOwnerAuditV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  let observer=null;

  function closeRetiredInspector(){
    const panel=document.querySelector('.builder-inspector[data-inspector-id="reading-progress"]');
    panel?.querySelector('[data-close-inspector]')?.click();
  }

  function repair(){
    const doc=frame.contentDocument;if(!doc)return;
    const legacy=doc.querySelector('.read-progress');
    if(legacy){
      legacy.hidden=true;
      legacy.style.setProperty('display','none','important');
      legacy.removeAttribute('data-builder-capability');
      legacy.removeAttribute('data-builder-primary');
      legacy.querySelector(':scope > .platform-builder-gear')?.remove();
    }
    doc.querySelectorAll('.nav-chapter-progress').forEach(progress=>{
      progress.removeAttribute('data-builder-capability');
      progress.removeAttribute('data-builder-primary');
      progress.querySelector(':scope > .platform-builder-gear')?.remove();
    });
    closeRetiredInspector();
  }

  function bind(){
    const doc=frame.contentDocument;if(!doc?.body)return;
    observer?.disconnect();
    observer=new MutationObserver(()=>queueMicrotask(repair));
    observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-builder-capability']});
    repair();
  }

  frame.addEventListener('load',()=>[60,320,900,2100,3800].forEach(delay=>setTimeout(()=>{bind();repair();},delay)));
  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element)||!event.target.closest('[data-mobile-panel="reading-progress"]'))return;
    queueMicrotask(repair);
  },true);
  if(frame.contentDocument?.readyState==='complete')bind();
})();
