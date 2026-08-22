(function(){
  if(window.__platformSandboxBuilderCompatV1)return;
  window.__platformSandboxBuilderCompatV1=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const preview=new URLSearchParams(location.search).get('preview')||'';
  const remove=(node,names)=>names.forEach(name=>node?.style?.removeProperty(name));

  function cleanLegacy(id){
    if(id==='top-chapter-navigation'){
      const shell=$('.nav-shell'),nav=$('.nav-scroll');
      if(shell)delete shell.dataset.builderStickyMode;
      if(nav)delete nav.dataset.builderStickyMode;
      return;
    }
    if(id==='horizontal-card-rail'){
      $$('.desktop-rail-window,.scroll-row').forEach(node=>{
        remove(node,['--desktop-shadow-runway','scrollbar-width']);
        delete node.dataset.builderDesktopDrag;
      });
      return;
    }
    if(id==='device-handoff-accordion'){
      const link=$('#collectionDeviceLink'),accordion=$('.collection-device-accordion');
      remove(link,['transition-duration']);
      remove(accordion,['transition-duration']);
      return;
    }
    if(id==='reading-progress'){
      const legacy=$('.read-progress');
      if(legacy){
        legacy.hidden=true;
        legacy.style.setProperty('display','none','important');
        legacy.removeAttribute('data-builder-capability');
        legacy.querySelector(':scope > .platform-builder-gear')?.remove();
      }
    }
  }

  function reconcileEditorPin(){
    if(preview||document.documentElement.classList.contains('ios-webkit-chrome'))return;
    const shell=$('.nav-shell');
    const spacer=$('.sandbox-nav-pin-spacer');
    if(!shell||!spacer)return;

    const mode=document.documentElement.dataset.builderNavMode||'deferred-sticky';
    const disabled=mode==='static'||shell.hidden||getComputedStyle(shell).display==='none';
    const shouldPin=!disabled&&spacer.getBoundingClientRect().top<=0;
    const props=['position','top','left','right','width','z-index','transform'];

    if(shouldPin){
      const height=Math.max(1,Math.ceil(shell.getBoundingClientRect().height||shell.offsetHeight||0));
      spacer.style.height=`${height}px`;
      shell.classList.add('is-sandbox-editor-pinned');
      shell.style.setProperty('position','fixed','important');
      shell.style.setProperty('top','0','important');
      shell.style.setProperty('left','0','important');
      shell.style.setProperty('right','0','important');
      shell.style.setProperty('width','100%','important');
      shell.style.setProperty('z-index','100','important');
      shell.style.setProperty('transform','none','important');
      return;
    }

    shell.classList.remove('is-sandbox-editor-pinned');
    props.forEach(prop=>shell.style.removeProperty(prop));
    spacer.style.height='0px';
    if(!disabled&&mode==='sticky'){
      shell.style.setProperty('position','sticky','important');
      shell.style.setProperty('top','0','important');
      shell.style.setProperty('z-index','100','important');
      shell.style.setProperty('transform','none','important');
    }
  }

  let raf=0;
  function queuePin(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;reconcileEditorPin();});}

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-ui-reset'&&data.capabilityId){
      requestAnimationFrame(()=>{cleanLegacy(data.capabilityId);queuePin();});
    }else if(data.type==='platform-ui-config'&&data.capabilityId==='top-chapter-navigation'){
      requestAnimationFrame(queuePin);
    }
  });

  if(!preview){
    document.addEventListener('scroll',queuePin,{passive:true,capture:true});
    window.addEventListener('scroll',queuePin,{passive:true});
    window.addEventListener('resize',queuePin,{passive:true});
    [120,320,820,1900,3700].forEach(delay=>setTimeout(queuePin,delay));
  }
})();
