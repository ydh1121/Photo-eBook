(function(){
  if(window.__platformFilterChipSpecimensV1)return;
  window.__platformFilterChipSpecimensV1=true;
  const params=new URLSearchParams(location.search);
  if(params.get('preview')!=='filter-chip-rail')return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

  function installStyle(){
    let style=$('#platform-filter-chip-specimens-style');
    if(style)style.remove();
    style=document.createElement('style');
    style.id='platform-filter-chip-specimens-style';
    style.textContent=`
      html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{
        display:block!important;place-items:initial!important;align-content:initial!important;
        min-height:100%!important;height:100%!important;padding:22px!important;overflow:auto!important
      }
      .platform-kit-specimen-board{width:min(100%,980px);margin:0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-content:center;min-height:100%}
      .platform-kit-specimen{min-width:0;display:grid;grid-template-rows:auto minmax(92px,1fr);overflow:hidden;border:1px solid rgba(27,39,63,.075);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 8px 24px rgba(29,42,67,.045);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
      .platform-kit-specimen--wide{grid-column:1/-1}
      .platform-kit-specimen__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px 10px;border-bottom:1px solid rgba(27,39,63,.055)}
      .platform-kit-specimen__head>div{min-width:0}.platform-kit-specimen__head small{display:block;color:#9399a2;font-size:9px;font-weight:730}.platform-kit-specimen__head strong{display:block;margin-top:3px;color:#272b31;font-size:12px;line-height:1.35}.platform-kit-specimen__head span{flex:0 0 auto;color:#a0a5ad;font-size:8.5px;line-height:1.45;text-align:right}
      .platform-kit-specimen__stage{min-width:0;display:flex;align-items:center;padding:17px 16px;overflow:hidden}
      .platform-kit-specimen__stage>.collection-filters{width:max-content;max-width:100%;margin:0!important;padding:7px 2px!important;overflow-x:auto!important;overflow-y:visible!important;scrollbar-width:none!important}
      .platform-kit-specimen__stage>.collection-filters::-webkit-scrollbar{display:none!important}
      .platform-kit-specimen--narrow .platform-kit-specimen__stage{justify-content:flex-start}.platform-kit-specimen--narrow .platform-kit-specimen__viewport{width:320px;max-width:100%;padding:12px;border:1px dashed rgba(27,39,63,.11);border-radius:14px;background:rgba(247,248,250,.82);overflow:hidden}
      .platform-kit-specimen--narrow .platform-kit-specimen__viewport>.collection-filters{max-width:100%;margin:0!important;overflow-x:auto!important;scrollbar-width:none!important}.platform-kit-specimen--narrow .platform-kit-specimen__viewport>.collection-filters::-webkit-scrollbar{display:none!important}
      html[data-theme="dark"] .platform-kit-specimen{border-color:rgba(255,255,255,.085);background:rgba(20,24,31,.78);box-shadow:0 10px 28px rgba(0,0,0,.18)}
      html[data-theme="dark"] .platform-kit-specimen__head{border-color:rgba(255,255,255,.07)}html[data-theme="dark"] .platform-kit-specimen__head small{color:#808b99}html[data-theme="dark"] .platform-kit-specimen__head strong{color:#edf1f6}html[data-theme="dark"] .platform-kit-specimen__head span{color:#727d8b}
      html[data-theme="dark"] .platform-kit-specimen--narrow .platform-kit-specimen__viewport{border-color:rgba(255,255,255,.09);background:rgba(12,15,20,.54)}
      @media(max-width:620px){
        html[data-builder-sandbox="true"][data-sandbox-preview="filter-chip-rail"] #sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]{padding:12px!important}
        .platform-kit-specimen-board{grid-template-columns:1fr;gap:10px;align-content:start}.platform-kit-specimen--wide{grid-column:auto}.platform-kit-specimen{grid-template-rows:auto minmax(82px,auto)}.platform-kit-specimen__head{padding:12px 13px 8px}.platform-kit-specimen__stage{padding:14px 12px}.platform-kit-specimen__head span{display:none}
      }
    `;
    document.head.appendChild(style);
  }

  function bindSelection(root){
    if(!root||root.dataset.kitSelectionBound==='true')return;
    root.dataset.kitSelectionBound='true';
    root.addEventListener('click',event=>{
      const button=event.target.closest?.('.collection-filter');
      if(!button||!root.contains(button))return;
      $$('.collection-filter',root).forEach(node=>node.classList.toggle('is-active',node===button));
    });
  }

  function cloneFilters(source,{active=0,labels=null}={}){
    const clone=source.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('data-platform-liquid-ready');
    clone.removeAttribute('data-kit-selection-bound');
    $(':scope > .platform-filter-chip-indicator',clone)?.remove();
    const buttons=$$('.collection-filter',clone);
    buttons.forEach((button,index)=>{
      button.classList.toggle('is-active',index===active);
      if(labels?.[index])button.textContent=labels[index];
    });
    bindSelection(clone);
    return clone;
  }

  function card(kind,title,note,content,{wide=false,narrow=false}={}){
    const article=document.createElement('article');
    article.className=`platform-kit-specimen${wide?' platform-kit-specimen--wide':''}${narrow?' platform-kit-specimen--narrow':''}`;
    article.dataset.specimen=kind;
    const head=document.createElement('header');
    head.className='platform-kit-specimen__head';
    head.innerHTML=`<div><small>${kind}</small><strong>${title}</strong></div><span>${note}</span>`;
    const stage=document.createElement('div');
    stage.className='platform-kit-specimen__stage';
    if(narrow){
      const viewport=document.createElement('div');viewport.className='platform-kit-specimen__viewport';viewport.appendChild(content);stage.appendChild(viewport);
    }else stage.appendChild(content);
    article.append(head,stage);
    return article;
  }

  function enhance(){
    const root=$('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]');
    const source=root?.querySelector('#collectionFilters');
    if(!root||!source)return false;
    if(root.dataset.specimenReady==='true')return true;

    installStyle();
    bindSelection(source);
    const activeIndex=Math.max(0,$$('.collection-filter',source).findIndex(button=>button.classList.contains('is-active')));
    const selected=cloneFilters(source,{active:(activeIndex+1)%Math.max(1,$$('.collection-filter',source).length)});
    const longLabels=cloneFilters(source,{active:2,labels:['전체','제품·브랜드 촬영','인물·프로필 촬영','음식·매장 촬영']});
    const narrow=cloneFilters(source,{active:1,labels:['전체','제품 촬영','인물 촬영','음식 촬영']});

    source.remove();
    const board=document.createElement('section');
    board.className='platform-kit-specimen-board';
    board.setAttribute('aria-label','범용 필터칩 라이브 UI 키트');
    board.append(
      card('실제 원본','하단 팝업 필터칩','클릭해서 선택 이동',source),
      card('선택 상태','활성 칩 비교','같은 공통 토큰 사용',selected),
      card('긴 라벨','텍스트 길이와 간격','오버플로·간격 확인',longLabels,{wide:true}),
      card('좁은 폭','가로 스크롤 상태','320px 안에서 직접 스크롤',narrow,{wide:true,narrow:true})
    );
    root.replaceChildren(board);
    root.dataset.specimenReady='true';
    window.parent?.postMessage({type:'platform-specimen-ready',capabilityId:'filter-chip-rail'},location.origin);
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(enhance()||attempts>=30)clearInterval(timer);
  },80);
  setTimeout(enhance,0);setTimeout(enhance,220);setTimeout(enhance,620);
})();
