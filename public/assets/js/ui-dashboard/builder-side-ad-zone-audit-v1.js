(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderSideAdZoneAuditV2)return;
  window.__platformBuilderSideAdZoneAuditV2=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderSideAdsV1';
  const DEFAULTS={enabled:false,width:110,height:430,top:108,gap:56,follow:true};
  const EDGE=18;
  let raf=0;

  function read(){try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function config(side){return {...DEFAULTS,...(read()[side]||{})};}
  function doc(){try{return frame.contentDocument;}catch{return null;}}
  function win(){try{return frame.contentWindow;}catch{return null;}}
  function slot(side){return doc()?.querySelector(`[data-builder-ad-slot="${side}"]`)||null;}

  function contentBounds(){
    const d=doc(),w=win();if(!d||!w)return null;
    const viewportW=w.innerWidth||d.documentElement.clientWidth||0;
    const candidates=[...d.querySelectorAll('.hero__body,.chapter .wide,.chapter .section .content,.section .wide')]
      .map(node=>({node,rect:node.getBoundingClientRect()}))
      .filter(({rect})=>rect.width>=520&&rect.width<viewportW-40&&rect.left>=0&&rect.right<=viewportW+1)
      .sort((a,b)=>b.rect.width-a.rect.width);
    const source=candidates[0]?.rect;
    if(!source)return null;
    return {left:source.left,right:source.right,width:source.width};
  }

  function laneX(side,bounds,width,gap,viewportW){
    if(!bounds)return null;
    const leftGutter=bounds.left;
    const rightGutter=viewportW-bounds.right;
    if(side==='left'){
      if(leftGutter<width+EDGE*2)return null;
      const centered=(leftGutter-width)/2;
      const minGapPosition=bounds.left-gap-width;
      return Math.max(EDGE,Math.min(centered,minGapPosition));
    }
    if(rightGutter<width+EDGE*2)return null;
    const centered=bounds.right+(rightGutter-width)/2;
    const minGapPosition=bounds.right+gap;
    return Math.min(viewportW-width-EDGE,Math.max(centered,minGapPosition));
  }

  function place(side){
    const d=doc(),w=win(),node=slot(side);if(!d||!w||!node)return;
    const cfg=config(side);
    node.dataset.adZoneActive='false';
    if(!cfg.enabled||w.innerWidth<1440)return;

    const width=Math.max(90,Number(cfg.width)||110);
    const requestedHeight=Math.max(180,Number(cfg.height)||430);
    const gap=Math.max(24,Number(cfg.gap)||56);
    const preferredTop=Math.max(82,Number(cfg.top)||108);
    const bounds=contentBounds();
    const x=laneX(side,bounds,width,gap,w.innerWidth);
    if(x===null)return;

    const maxHeight=Math.max(180,w.innerHeight-preferredTop-18);
    const height=Math.min(requestedHeight,maxHeight);
    node.style.width=`${width}px`;
    node.style.height=`${height}px`;
    node.style.left=`${Math.round(x)}px`;
    node.style.right='auto';
    node.style.bottom='auto';
    if(cfg.follow){
      node.style.position='fixed';
      node.style.top=`${Math.round(preferredTop)}px`;
    }else{
      node.style.position='absolute';
      node.style.top=`${Math.round((w.scrollY||0)+preferredTop)}px`;
    }
    node.dataset.adZoneActive='true';
    node.dataset.adFollow=String(Boolean(cfg.follow));
    node.dataset.adPlacement='outer-gutter';
    node.dataset.adLaneX=String(Math.round(x));
  }

  function apply(){raf=0;place('left');place('right');}
  function schedule(){if(!raf)raf=requestAnimationFrame(apply);}
  function bindFrame(){
    const d=doc(),w=win();if(!d||!w||d.documentElement.dataset.sideAdAuditV2Bound==='true')return;
    d.documentElement.dataset.sideAdAuditV2Bound='true';
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
  document.addEventListener('platform-builder-side-ad-config-change',()=>[0,80].forEach(delay=>setTimeout(schedule,delay)));
  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element)||!event.target.closest('[data-ad-enable],[data-ad-reset],#builderAdLeft,#builderAdRight,#builderCanvasWideToggle'))return;
    [40,140,260].forEach(delay=>setTimeout(schedule,delay));
  },true);
  window.addEventListener('resize',schedule,{passive:true});
  if(frame.contentDocument?.readyState==='complete'){bindFrame();schedule();}
})();
