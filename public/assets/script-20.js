/* v36.1: tiny event-driven liquid-pill settle. No observers, no scroll listeners. */
(function(){
  if(window.__photoV361SettleInstalled)return;
  window.__photoV361SettleInstalled=true;

  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const targets=[
    {item:'.nav-chip',root:'.nav-scroll',indicator:'.nav-v33-indicator'},
    {item:'.collection-tab',root:'.collection-tabs',indicator:'.collection-v33-indicator'},
    {item:'.theme-choice button',root:'.theme-choice',indicator:'.theme-v34-indicator'}
  ];

  document.addEventListener('click',event=>{
    if(reduced())return;
    const config=targets.find(entry=>event.target.closest?.(entry.item));
    if(!config)return;
    const item=event.target.closest(config.item);
    const root=item?.closest(config.root);
    const indicator=root?.querySelector(config.indicator);
    if(!item||!root||!indicator||typeof indicator.animate!=='function')return;

    const rect=indicator.getBoundingClientRect();
    const itemRect=item.getBoundingClientRect();
    const direction=Math.sign(itemRect.left-rect.left)||1;
    window.setTimeout(()=>{
      if(!indicator.isConnected)return;
      const x=item.offsetLeft;
      const y=item.offsetTop;
      const nudge=direction*1.8;
      indicator.animate([
        {transform:`translate3d(${x}px,${y}px,0) scaleX(1)`},
        {offset:.52,transform:`translate3d(${x+nudge}px,${y}px,0) scaleX(1.006)`},
        {transform:`translate3d(${x}px,${y}px,0) scaleX(1)`}
      ],{duration:150,easing:'cubic-bezier(.2,.76,.2,1)'});
    },330);
  },true);
})();
