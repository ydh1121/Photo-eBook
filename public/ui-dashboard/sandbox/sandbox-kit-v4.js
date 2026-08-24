(function(){
  if(window.__platformSandboxPageRuntimeV1)return;
  window.__platformSandboxPageRuntimeV1=true;
  const $=(selector,root=document)=>root.querySelector(selector);
  document.documentElement.dataset.builderSandbox='true';

  function installEditorNavPin(){
    const shell=$('.nav-shell');
    if(!shell||shell.dataset.editorNavPinBound==='true')return;
    if(document.documentElement.classList.contains('ios-webkit-chrome'))return;
    shell.dataset.editorNavPinBound='true';

    document.documentElement.style.setProperty('overflow-x','clip','important');
    document.body?.style.setProperty('overflow-x','clip','important');
    $('#app')?.style.setProperty('overflow','visible','important');

    const spacer=document.createElement('div');
    spacer.className='sandbox-nav-pin-spacer';
    spacer.setAttribute('aria-hidden','true');
    shell.before(spacer);
    let pinned=false;
    let raf=0;
    const props=['position','top','left','right','width','z-index','transform'];
    const shellHeight=()=>Math.max(1,Math.ceil(shell.getBoundingClientRect().height||shell.offsetHeight||0));

    function setPinned(next){
      if(next===pinned)return;
      pinned=next;
      shell.classList.toggle('is-sandbox-editor-pinned',pinned);
      if(pinned){
        spacer.style.height=`${shellHeight()}px`;
        shell.style.setProperty('position','fixed','important');
        shell.style.setProperty('top','0','important');
        shell.style.setProperty('left','0','important');
        shell.style.setProperty('right','0','important');
        shell.style.setProperty('width','100%','important');
        shell.style.setProperty('z-index','100','important');
        shell.style.setProperty('transform','none','important');
      }else{
        props.forEach(prop=>shell.style.removeProperty(prop));
        spacer.style.height='0px';
      }
    }
    function update(){
      raf=0;
      setPinned(spacer.getBoundingClientRect().top<=0);
      if(pinned)spacer.style.height=`${shellHeight()}px`;
    }
    function queue(){if(!raf)raf=requestAnimationFrame(update);}
    document.addEventListener('scroll',queue,{passive:true,capture:true});
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue,{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(queue).observe(shell);
    queue();
  }

  function bindInlineOpen(){
    const button=$('#sandboxOpenCollection');
    if(!button||button.dataset.bound==='true')return;
    button.dataset.bound='true';
    button.addEventListener('click',()=>$('#collectionFab')?.click());
  }

  function init(){
    bindInlineOpen();
    if(typeof window.setupNavigation==='function')window.setupNavigation();
    [0,180,520].forEach(delay=>setTimeout(installEditorNavPin,delay));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
