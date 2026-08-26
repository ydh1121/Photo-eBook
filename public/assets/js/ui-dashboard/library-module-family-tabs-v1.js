/* v1: visual hierarchy for related approved Library modules. */
(function(){
  if(window.__platformLibraryModuleFamilyTabsV1)return;
  window.__platformLibraryModuleFamilyTabsV1=true;

  const groups=[
    {id:'bottom-popup',label:'하단 팝업',children:['collection-bottom-sheet','bottom-sheet']},
    {id:'accordion',label:'아코디언',children:['device-handoff-accordion','accordion']}
  ];
  const selector=document.querySelector('.builder-kit-selector');
  if(!selector)return;

  function buttonFor(id){return selector.querySelector(`[data-kit-ui="${CSS.escape(id)}"]`);}
  function currentChild(group){return group.children.find(id=>buttonFor(id)?.getAttribute('aria-pressed')==='true')||'';}

  for(const group of groups){
    const buttons=group.children.map(buttonFor).filter(Boolean);
    if(buttons.length!==group.children.length)continue;
    const first=buttons[0];
    const wrapper=document.createElement('div');
    wrapper.className='builder-kit-family-group';
    wrapper.dataset.moduleFamily=group.id;

    const parent=document.createElement('button');
    parent.type='button';
    parent.className='builder-kit-family-parent';
    parent.dataset.moduleFamilyParent=group.id;
    parent.textContent=group.label;
    parent.setAttribute('aria-pressed','false');
    parent.addEventListener('click',()=>{
      const id=currentChild(group)||group.children[0];
      buttonFor(id)?.click();
    });

    const children=document.createElement('div');
    children.className='builder-kit-family-children';
    children.setAttribute('role','group');
    children.setAttribute('aria-label',`${group.label} 하위 모듈`);

    first.before(wrapper);
    wrapper.append(parent,children);
    buttons.forEach(button=>children.appendChild(button));
  }

  function sync(){
    for(const group of groups){
      const wrapper=selector.querySelector(`[data-module-family="${group.id}"]`);
      if(!wrapper)continue;
      const active=Boolean(currentChild(group));
      const next=String(active);
      if(wrapper.dataset.active!==next)wrapper.dataset.active=next;
      const parent=wrapper.querySelector('[data-module-family-parent]');
      if(parent&&parent.getAttribute('aria-pressed')!==next)parent.setAttribute('aria-pressed',next);
    }
  }

  selector.addEventListener('click',()=>requestAnimationFrame(sync));
  const observer=new MutationObserver(sync);
  observer.observe(selector,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  sync();
})();
