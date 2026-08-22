(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderSideAdZoneAuditV1)return;
  window.__platformBuilderSideAdZoneAuditV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderSideAdsV1';
  const DEFAULTS={enabled:false,width:110,height:430,top:108,gap:40,follow:true};
  let raf=0;

  function read(){try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function config(side){return {...DEFAULTS,...(read()[side]||{})};}
  function doc(){try{return frame.contentDocument;}catch{return null;}}
  function win(){try{return frame.contentWindow;}catch{return null;}}
  function slot(side){return doc()?.querySelector(`[data-builder-ad-slot="${side}"]`)||null;}

  function hide(side){
    const node=slot(side);if(!node)return;
    node.dataset.adZoneActive='false';
  }

  function visibleBody(){
    const d=doc(),w=win();if(!d||!w)return null;
    const viewportH=w.innerHeight||d.documentElement.clientHeight||0;
    const candidates=[...d.querySelectorAll('.chapter .section .content')]
      .map(node=>({node,rect:node.getBoundingClientRect()}))
      .filter(({rect})=>rect.width>260&&rect.height>120&&rect.bottom>90&&rect.top<viewportH-40)
      .map(item=>{
        const visible=Math.max(0,Math.min(item.rect.bottom,viewportH)-Math.max(item.rect.top,0));
        return {...item,visible};
      })
      .filter(item=>item.visible>100)
      .sort((a,b)=>b.visible-a.visible);
    return candidates[0]||null;
  }

  function heroAtAnchor(anchorY){
    const d=doc();if(!d)return true;
    return [...d.querySelectorAll('.hero,.chapter-hero')].some(node=>{
      const rect=node.getBoundingClientRect();
      return rect.bottom>anchorY&&rect.top<anchorY;
    });
  }

  function place(side){
    const d=doc(),w=win(),node=slot(side);if(!d||!w||!node)return;
    const cfg=config(side);
    node.dataset.adZoneActive='false';
    if(!cfg.enabled||w.innerWidth<1360)return;

    const body=visibleBody();if(!body)return;
    const width=Math.max(90,Number(cfg.width)||110);
    const height=Math.max(180,Number(cfg.height)||430);
    const gap=Math.max(24,Number(cfg.gap)||40);
    const preferredTop=Math.max(82,Number(cfg.top)||108);
    if(heroAtAnchor(preferredTop))return;

    const rect=body.rect;
    const leftX=rect.left-gap-width;
    const rightX=rect.right+gap;
    const x=side==='left'?leftX:rightX;
    if(x<10||x+width>w.innerWidth-10)return;

    const visibleTop=Math.max(rect.top,18);
    const visibleBottom=Math.min(rect.bottom,w.innerHeight-18);
    if(visibleBottom-visibleTop<150)return;

    node.style.width=`${width}px`;
    node.style.height=`${height}px`;
    node.style.left=`${Math.round(x)}px`;
    node.style.right='auto';
    node.style.bottom='auto';
    if(cfg.follow){
      const top=Math.max(preferredTop,visibleTop);
      node.style.position='fixed';
      node.style.top=`${Math.round(top)}px`;
    }else{
      node.style.position='absolute';
      node.style.top=`${Math.round((w.scrollY||0)+visibleTop)}px`;
    }
    node.dataset.adZoneActive='true';
    node.dataset.adFollow=String(Boolean(cfg.follow));
  }

  function apply(){raf=0;place('left');place('right');}
  function schedule(){if(!raf)raf=requestAnimationFrame(apply);}
  function bindFrame(){
    const d=doc(),w=win();if(!d||!w||d.documentElement.dataset.sideAdAuditBound==='true')return;
    d.documentElement.dataset.sideAdAuditBound='true';
    w.addEventListener('scroll',schedule,{passive:true});
    w.addEventListener('resize',schedule,{passive:true});
    d.addEventListener('scroll',schedule,{passive:true,capture:true});
    schedule();
  }

  frame.addEventListener('load',()=>[60,260,900,1800].forEach(delay=>setTimeout(()=>{bindFrame();schedule();},delay)));
  document.addEventListener('input',event=>{
    if(!(event.target instanceof Element)||!event.target.closest('[data-ad-control]'))return;
    setTimeout(schedule,40);
  },true);
  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element)||!event.target.closest('[data-ad-enable],[data-ad-reset],#builderAdLeft,#builderAdRight'))return;
    [40,140].forEach(delay=>setTimeout(schedule,delay));
  },true);
  window.addEventListener('resize',schedule,{passive:true});
  if(frame.contentDocument?.readyState==='complete'){bindFrame();schedule();}
})();
