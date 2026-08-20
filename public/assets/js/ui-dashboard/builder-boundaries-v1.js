(function(){
  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  function repair(){
    const doc=frame.contentDocument;if(!doc)return;
    doc.querySelectorAll('#app > .nav-placeholder,#app > .nav-shell').forEach(node=>{
      node.draggable=false;
      node.classList.remove('platform-builder-block','is-builder-drop-target','is-builder-dragging');
      delete node.dataset.builderBlockId;
      node.querySelector(':scope > .platform-builder-block-handle')?.remove();
      if(node.dataset.builderFixedBound==='true')return;
      node.dataset.builderFixedBound='true';
      const block=event=>{event.preventDefault();event.stopImmediatePropagation();};
      node.addEventListener('dragover',block,true);
      node.addEventListener('drop',block,true);
      node.addEventListener('dragstart',block,true);
    });
  }
  frame.addEventListener('load',()=>{[250,900,2100,4200].forEach(delay=>setTimeout(repair,delay));});
  const observer=new MutationObserver(repair);
  setInterval(()=>{const doc=frame.contentDocument;if(doc?.body&&!doc.body.dataset.builderBoundaryObserved){doc.body.dataset.builderBoundaryObserved='true';observer.observe(doc.body,{childList:true,subtree:true});repair();}},700);
})();
