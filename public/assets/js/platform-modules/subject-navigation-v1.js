(function(){
  const registry=window.PlatformModuleRegistry;
  if(!registry||registry.get('subject-navigation'))return;
  const esc=registry.escapeHtml,attr=registry.attr;
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="6" height="6" rx="1.6"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.6"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.6"/><rect x="14.5" y="14.5" width="6" height="6" rx="1.6"/></svg>';
  function items(props){return (props.items||[]).filter(item=>/^\/(?!\/)/.test(item.url||''));}
  function links(props,detail=false){return items(props).map(item=>`<a href="${attr(item.url)}" data-subject-id="${attr(item.id)}"${item.id===props.currentId?' aria-current="page"':''}><span class="subject-label">${esc(item.label)}</span>${detail?`<span class="subject-description">${esc(item.description||'')}</span>`:''}${detail&&item.id===props.currentId?'<span class="subject-current">현재 분야</span>':''}</a>`).join('');}
  function render(props={}){
    const id=String(props.instanceId||'subject');
    const view=props.view||'both';
    return `<div class="subject-navigation-module" data-platform-module="subject-navigation" data-subject-instance="${attr(id)}">
      ${view!=='picker'?`<nav class="subject-nav ${props.placement==='hero'?'subject-nav--hero':''}" aria-label="분야">${links(props)}</nav>`:''}
      ${view!=='bar'?`<button id="${attr(id)}Fab" class="subject-fab" type="button" aria-label="분야 선택" aria-haspopup="dialog" aria-controls="${attr(id)}Picker">${icon}<span>분야</span></button>
      <dialog id="${attr(id)}Picker" class="subject-picker" aria-labelledby="${attr(id)}Title"><div class="subject-picker__head"><div><div class="subject-picker__eyebrow">배우고 실천하는 여섯 분야</div><h2 id="${attr(id)}Title">분야 선택</h2></div><button class="subject-picker__close" type="button" aria-label="분야 선택 닫기">×</button></div><nav class="subject-picker__grid" aria-label="이동할 분야">${links(props,true)}</nav></dialog>`:''}
    </div>`;
  }
  function hydrate(host,props={},context={}){
    const root=host.querySelector('[data-subject-instance]');if(!root)return;
    const dialog=root.querySelector('dialog'),fab=root.querySelector('.subject-fab');
    let previousFocus=null,oldOverflow='',locked=false;
    function release(){if(!locked)return;document.documentElement.style.overflowY=oldOverflow;locked=false;previousFocus?.focus?.({preventScroll:true});fab?.setAttribute('aria-expanded','false');}
    function close(){if(dialog?.open)dialog.close();release();}
    function open(){
      if(!dialog||dialog.open)return;
      if(context.consumer==='public')window.PhotoCollectionHub?.close?.();
      previousFocus=document.activeElement;oldOverflow=document.documentElement.style.overflowY;
      document.documentElement.style.overflowY='hidden';locked=true;
      dialog.showModal();fab?.setAttribute('aria-expanded','true');
    }
    const click=event=>{
      if(event.target.closest?.('.subject-fab')){open();return;}
      if(event.target.closest?.('.subject-picker__close')){close();return;}
      const anchor=event.target.closest?.('[data-subject-id]');
      if(anchor?.dataset.subjectId===props.currentId){event.preventDefault();close();}
      else if(anchor){close();}
      else if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
    };
    root.addEventListener('click',click);dialog?.addEventListener('close',release);
    const pagehide=()=>{if(dialog?.open)dialog.close();release();};
    window.addEventListener('pagehide',pagehide);
    let observer=null,resizeObserver=null;
    function alignFab(){
      const collection=document.getElementById('collectionFab');if(!fab||!collection||context.consumer!=='public')return false;
      const rect=collection.getBoundingClientRect();if(rect.width===0)return false;
      fab.style.right=`${Math.max(12,innerWidth-rect.right)}px`;
      fab.style.bottom=`${Math.max(78,innerHeight-rect.top+12)}px`;
      return true;
    }
    function connect(){
      if(!alignFab())return;
      observer?.disconnect();
      if(typeof ResizeObserver==='function'&&!resizeObserver){resizeObserver=new ResizeObserver(alignFab);resizeObserver.observe(document.getElementById('collectionFab'));}
    }
    if(fab&&context.consumer==='public'){
      connect();if(!resizeObserver){observer=new MutationObserver(connect);observer.observe(document.body,{childList:true,subtree:true});}
      window.addEventListener('resize',alignFab,{passive:true});
      window.visualViewport?.addEventListener('resize',alignFab,{passive:true});
    }
    return {api:{open,close},cleanup(){close();root.removeEventListener('click',click);dialog?.removeEventListener('close',release);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',alignFab);window.visualViewport?.removeEventListener('resize',alignFab);observer?.disconnect();resizeObserver?.disconnect();}};
  }
  const preview={instanceId:'subjectPreview',currentId:'one',items:[{id:'one',label:'첫 분야',url:'/one/',description:'지금 배우는 내용'},{id:'two',label:'다음 분야',url:'/two/',description:'이어지는 실습'}]};
  registry.register({id:'subject-navigation',label:'분야 전환',category:'navigation',version:1,status:'approved',source:'platform-core',isolateInstances:true,consumers:['public','library','editor','export'],ownerFiles:['public/assets/js/platform-modules/subject-navigation-v1.js','public/assets/styles/navigation/subject-navigation-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
