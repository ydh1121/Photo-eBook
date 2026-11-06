(function(){
  const registry=window.PlatformModuleRegistry;
  if(!registry||registry.get('subject-navigation'))return;
  const esc=registry.escapeHtml,attr=registry.attr;
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="6" height="6" rx="1.6"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.6"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.6"/><rect x="14.5" y="14.5" width="6" height="6" rx="1.6"/></svg>';
  const closeIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  function items(props){return (props.items||[]).filter(item=>/^\/(?!\/)/.test(item.url||''));}
  function links(props,detail=false){return items(props).map(item=>`<a href="${attr(item.url)}" data-subject-id="${attr(item.id)}"${item.id===props.currentId?' aria-current="page"':''}><span class="subject-label">${esc(item.label)}</span>${detail?`<span class="subject-description">${esc(item.description||'')}</span>`:''}</a>`).join('');}
  function render(props={}){
    const id=String(props.instanceId||'subject');
    const view=props.view||'both';
    return `<div class="subject-navigation-module" data-platform-module="subject-navigation" data-subject-instance="${attr(id)}">
      ${view!=='picker'?`<nav class="subject-nav ${props.placement==='hero'?'subject-nav--hero':''}" aria-label="분야">${links(props)}</nav>`:''}
      ${view!=='bar'?`<button id="${attr(id)}Fab" class="subject-fab" type="button" aria-label="분야 선택" aria-haspopup="dialog" aria-expanded="false" aria-controls="${attr(id)}Picker">${icon}<span>분야</span></button>
      <dialog id="${attr(id)}Picker" class="subject-picker" aria-labelledby="${attr(id)}Title"><div class="subject-picker__head"><h2 id="${attr(id)}Title">분야 선택</h2><button class="subject-picker__close" type="button" aria-label="분야 선택 닫기">${closeIcon}</button></div><nav class="subject-picker__grid" aria-label="이동할 분야">${links(props,true)}</nav></dialog>`:''}
    </div>`;
  }
  function hydrate(host,props={},context={}){
    const root=host.querySelector('[data-subject-instance]');if(!root)return;
    const dialog=root.querySelector('dialog'),fab=root.querySelector('.subject-fab');
    let previousFocus=null,oldOverflow='',locked=false;
    function focusableItems(){
      if(!dialog)return [];
      return [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]')].filter(node=>node.tabIndex>=0&&!node.matches(':disabled')&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0&&!['hidden','collapse'].includes(getComputedStyle(node).visibility));
    }
    function trapFocus(event){
      if(event.key!=='Tab'||event.altKey||event.ctrlKey||event.metaKey||!dialog?.open)return;
      const items=focusableItems();if(!items.length){event.preventDefault();return;}
      const first=items[0],last=items[items.length-1],active=document.activeElement;
      // Keep both ends of the modal's keyboard sequence inside the dialog.
      // Native dialog modality alone can hand the final Tab to browser chrome.
      if(event.shiftKey&&(active===first||active===dialog||!dialog.contains(active))){event.preventDefault();last.focus({preventScroll:true});}
      else if(!event.shiftKey&&(active===last||active===dialog||!dialog.contains(active))){event.preventDefault();first.focus({preventScroll:true});}
    }
    function release(){
      fab?.setAttribute('aria-expanded','false');if(!locked)return;
      document.documentElement.style.overflowY=oldOverflow;locked=false;
      const target=previousFocus;previousFocus=null;target?.focus?.({preventScroll:true});
    }
    function close(){if(dialog?.open)dialog.close();release();}
    // Escape must update ARIA and the scroll lock in the same close operation.
    // The native close event can arrive after focus has already been restored.
    const cancel=event=>{event.preventDefault();close();};
    const closed=()=>{if(!dialog?.open)release();};
    function open(){
      if(!dialog||dialog.open)return;
      if(context.consumer==='public')window.PhotoCollectionHub?.close?.();
      previousFocus=document.activeElement;oldOverflow=document.documentElement.style.overflowY;
      document.documentElement.style.overflowY='hidden';locked=true;
      dialog.showModal();fab?.setAttribute('aria-expanded','true');focusableItems()[0]?.focus({preventScroll:true});
    }
    const click=event=>{
      if(event.target.closest?.('.subject-fab')){open();return;}
      if(event.target.closest?.('.subject-picker__close')){close();return;}
      const anchor=event.target.closest?.('[data-subject-id]');
      if(anchor?.dataset.subjectId===props.currentId){event.preventDefault();close();}
      else if(anchor){close();}
      else if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
    };
    root.addEventListener('click',click);dialog?.addEventListener('cancel',cancel);dialog?.addEventListener('close',closed);dialog?.addEventListener('keydown',trapFocus);
    const pagehide=()=>{if(dialog?.open)dialog.close();release();};
    window.addEventListener('pagehide',pagehide);
    let observer=null,resizeObserver=null,navResizeObserver=null,navRaf=0;
    const bar=root.querySelector('.subject-nav');
    function revealCurrentSubject(){
      const active=bar?.querySelector('[aria-current="page"]');if(!active||bar.scrollWidth<=bar.clientWidth)return;
      const bounds=bar.getBoundingClientRect(),selected=active.getBoundingClientRect(),style=getComputedStyle(bar);
      const leftInset=parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth),rightInset=parseFloat(style.paddingRight)+parseFloat(style.borderRightWidth);
      if(selected.left>=bounds.left+leftInset&&selected.right<=bounds.right-rightInset)return;
      const centerDelta=selected.left+selected.width/2-(bounds.left+bounds.width/2);
      bar.scrollLeft=Math.max(0,Math.min(bar.scrollWidth-bar.clientWidth,bar.scrollLeft+centerDelta));
    }
    function scheduleSubjectReveal(){
      if(navRaf)return;
      navRaf=requestAnimationFrame(()=>{navRaf=0;revealCurrentSubject();});
    }
    function alignFab(){
      const collection=document.getElementById('collectionFab');if(!fab||!collection||context.consumer!=='public')return false;
      const rect=collection.getBoundingClientRect();if(rect.width===0)return false;
      fab.style.width=`${rect.width}px`;fab.style.height=`${rect.height}px`;
      fab.style.left=`${rect.left+rect.width/2}px`;fab.style.right='auto';fab.style.transform='translateX(-50%)';
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
      window.addEventListener('pageshow',alignFab,{passive:true});
    }
    if(bar){
      revealCurrentSubject();scheduleSubjectReveal();
      if(typeof ResizeObserver==='function'){navResizeObserver=new ResizeObserver(scheduleSubjectReveal);navResizeObserver.observe(bar);const active=bar.querySelector('[aria-current="page"]');if(active)navResizeObserver.observe(active);}
      document.fonts?.ready.then(()=>{if(root.isConnected)revealCurrentSubject();});
      window.addEventListener('resize',scheduleSubjectReveal,{passive:true});
      window.addEventListener('pageshow',scheduleSubjectReveal,{passive:true});
    }
    root.dataset.subjectBound='true';
    return {api:{open,close},cleanup(){close();root.removeEventListener('click',click);dialog?.removeEventListener('cancel',cancel);dialog?.removeEventListener('close',closed);dialog?.removeEventListener('keydown',trapFocus);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',alignFab);window.visualViewport?.removeEventListener('resize',alignFab);window.removeEventListener('pageshow',alignFab);window.removeEventListener('resize',scheduleSubjectReveal);window.removeEventListener('pageshow',scheduleSubjectReveal);if(navRaf)cancelAnimationFrame(navRaf);observer?.disconnect();resizeObserver?.disconnect();navResizeObserver?.disconnect();delete root.dataset.subjectBound;}};
  }
  const preview={instanceId:'subjectPreview',currentId:'one',items:[{id:'one',label:'첫 분야',url:'/one/',description:'지금 배우는 내용'},{id:'two',label:'다음 분야',url:'/two/',description:'이어지는 실습'}]};
  registry.register({id:'subject-navigation',label:'분야 전환',category:'navigation',version:1,status:'approved',source:'platform-core',isolateInstances:true,consumers:['public','library','editor','export'],ownerFiles:['public/assets/js/platform-modules/subject-navigation-v1.js','public/assets/styles/navigation/subject-navigation-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
