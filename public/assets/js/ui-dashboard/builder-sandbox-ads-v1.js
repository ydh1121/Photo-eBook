(function(){
  const frame=document.querySelector('#builderFrame');
  const panelLayer=document.querySelector('#builderPanelLayer');
  const leftButton=document.querySelector('#builderAdLeft');
  const rightButton=document.querySelector('#builderAdRight');
  if(!frame||!panelLayer)return;

  const STORAGE_KEY='platformBuilderSideAdsV1';
  const DEFAULTS={enabled:false,width:110,height:430,top:108,gap:40,follow:true};
  const panels=new Map();
  let raf=0;

  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function write(v){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(v));}catch{}}
  function config(side){return {...DEFAULTS,...(read()[side]||{})};}
  function save(side,next){const all=read();all[side]=next;write(all);}
  function doc(){try{return frame.contentDocument;}catch{return null;}}
  function win(){try{return frame.contentWindow;}catch{return null;}}
  function slot(side){return doc()?.querySelector(`[data-builder-ad-slot="${side}"]`)||null;}
  function label(side){return side==='left'?'좌측':'우측';}

  function contentBounds(){
    const d=doc(),w=win();if(!d||!w||w.innerWidth<1360)return null;
    const candidates=[...d.querySelectorAll('.chapter .wide')].map(node=>({node,rect:node.getBoundingClientRect()})).filter(x=>x.rect.width>600);
    if(!candidates.length){const content=d.querySelector('.chapter .section .content');if(!content)return null;candidates.push({node:content,rect:content.getBoundingClientRect()});}
    const widest=candidates.reduce((best,item)=>item.rect.width>best.rect.width?item:best,candidates[0]);
    return widest.rect;
  }

  function pageRange(){
    const d=doc(),w=win();if(!d||!w)return null;
    const hero=d.querySelector('.sandbox-hero,.hero');const app=d.querySelector('#app');if(!hero||!app)return null;
    const y=w.scrollY||d.documentElement.scrollTop||0;
    return {
      start:hero.getBoundingClientRect().bottom+y+18,
      end:app.getBoundingClientRect().bottom+y-80,
      y
    };
  }

  function place(side){
    const node=slot(side),w=win();if(!node||!w)return;
    const cfg=config(side),bounds=contentBounds(),range=pageRange();
    node.dataset.adZoneActive='false';
    if(!cfg.enabled||!bounds||!range)return;

    const width=Math.max(90,Number(cfg.width)||110),height=Math.max(180,Number(cfg.height)||430);
    const gap=Math.max(24,Number(cfg.gap)||40),top=Math.max(82,Number(cfg.top)||108);
    const viewportAnchor=range.y+top;
    if(viewportAnchor<range.start||range.y>range.end-160)return;

    const leftX=bounds.left-gap-width,rightX=bounds.right+gap;
    const x=side==='left'?leftX:rightX;
    if(x<10||x+width>w.innerWidth-10)return;

    node.style.width=`${width}px`;node.style.height=`${height}px`;
    node.style.position=cfg.follow?'fixed':'absolute';
    node.style.top=cfg.follow?`${top}px`:`${Math.max(range.start,range.y+top)}px`;
    node.style.left=`${Math.round(x)}px`;node.style.right='auto';node.style.bottom='auto';
    node.dataset.adZoneActive='true';node.dataset.adFollow=String(Boolean(cfg.follow));
  }

  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;place('left');place('right');});}
  function apply(side){const node=slot(side);if(!node)return;const cfg=config(side);node.dataset.adEnabled=String(Boolean(cfg.enabled));const strong=node.querySelector('.sandbox-side-ad__inner strong');if(strong)strong.textContent=`${label(side)} 광고`;schedule();}

  function bindFrame(){
    const d=doc(),w=win();if(!d||!w||d.documentElement.dataset.builderSandbox!=='true')return;
    ['left','right'].forEach(side=>{
      apply(side);
      const button=d.querySelector(`[data-ad-slot-settings="${side}"]`);
      if(button&&button.dataset.parentBound!=='true'){button.dataset.parentBound='true';button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(side);});}
    });
    if(d.documentElement.dataset.builderAdZoneBound!=='true'){
      d.documentElement.dataset.builderAdZoneBound='true';w.addEventListener('scroll',schedule,{passive:true});w.addEventListener('resize',schedule,{passive:true});
    }
    schedule();
  }

  function control(title,key,value,{min=0,max=1000,step=1,unit='px'}={}){return `<label class="builder-control"><span>${title}<small>${value}${unit}</small></span><input type="range" data-ad-control="${key}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;}
  function openPanel(side){
    if(panels.has(side)){focus(side);return;}
    const cfg=config(side),panel=document.createElement('section');panel.className='builder-inspector builder-ad-inspector is-active';panel.dataset.adInspector=side;
    panel.innerHTML=`<header class="builder-inspector__head"><div><small>광고 영역</small><strong>${label(side)} 광고</strong></div><button type="button" data-close-ad-inspector aria-label="닫기">×</button></header><div class="builder-inspector__body"><div class="builder-inspector__actual"><span>배치<b>콘텐츠 외곽 레일</b></span><span>노출<b>메인 히어로 이후 유지</b></span></div><section class="builder-control-group"><strong>표시</strong><div class="builder-control-grid"><label class="builder-control builder-control--boolean"><span>사용</span><input type="checkbox" data-ad-control="enabled" ${cfg.enabled?'checked':''}></label><label class="builder-control builder-control--boolean"><span>스크롤 따라가기</span><input type="checkbox" data-ad-control="follow" ${cfg.follow?'checked':''}></label></div></section><section class="builder-control-group"><strong>크기와 위치</strong><div class="builder-control-grid">${control('폭','width',cfg.width,{min:90,max:220,step:2})}${control('높이','height',cfg.height,{min:180,max:700,step:10})}${control('상단 기준','top',cfg.top,{min:82,max:260,step:2})}${control('콘텐츠 간격','gap',cfg.gap,{min:24,max:80,step:2})}</div></section><section class="builder-inspector__memo"><p>광고는 첫 메인 히어로를 지나면 콘텐츠 바깥쪽에 유지됩니다. 챕터 히어로와 본문이 바뀌어도 반복해서 사라졌다 나타나지 않습니다.</p></section></div><footer class="builder-inspector__foot"><button type="button" data-ad-reset>초기값</button><button type="button" data-primary data-ad-enable>${cfg.enabled?'광고 끄기':'광고 켜기'}</button></footer>`;
    panel.style.left=side==='left'?'16px':'auto';panel.style.right=side==='right'?'16px':'auto';panel.style.top='86px';panelLayer.appendChild(panel);panels.set(side,panel);drag(panel,side);bindPanel(panel,side);focus(side);
  }
  function bindPanel(panel,side){
    panel.querySelector('[data-close-ad-inspector]')?.addEventListener('click',()=>close(side));
    panel.querySelector('[data-ad-reset]')?.addEventListener('click',()=>{save(side,{...DEFAULTS});refresh(side);apply(side);});
    panel.querySelector('[data-ad-enable]')?.addEventListener('click',()=>{const next=config(side);next.enabled=!next.enabled;save(side,next);refresh(side);apply(side);});
    panel.querySelectorAll('[data-ad-control]').forEach(input=>input.addEventListener('input',()=>{const key=input.dataset.adControl,next=config(side);next[key]=input.type==='checkbox'?input.checked:Number(input.value);save(side,next);apply(side);const small=input.closest('.builder-control')?.querySelector('small');if(small&&input.type!=='checkbox')small.textContent=`${input.value}px`;const enable=panel.querySelector('[data-ad-enable]');if(enable)enable.textContent=next.enabled?'광고 끄기':'광고 켜기';}));
    panel.addEventListener('pointerdown',()=>focus(side));
  }
  function drag(panel,side){const head=panel.querySelector('.builder-inspector__head');let state=null;head?.addEventListener('pointerdown',e=>{if(e.target.closest('button')||matchMedia('(max-width:760px)').matches)return;const r=panel.getBoundingClientRect();state={x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture?.(e.pointerId);focus(side);});head?.addEventListener('pointermove',e=>{if(!state)return;panel.style.left=`${Math.max(6,Math.min(innerWidth-panel.offsetWidth-6,e.clientX-state.x))}px`;panel.style.top=`${Math.max(70,Math.min(innerHeight-panel.offsetHeight-6,e.clientY-state.y))}px`;panel.style.right='auto';});head?.addEventListener('pointerup',e=>{state=null;head.releasePointerCapture?.(e.pointerId);});}
  function focus(side){panels.forEach((panel,key)=>{panel.classList.toggle('is-active',key===side);panel.style.zIndex=key===side?'45':'30';});}
  function close(side){panels.get(side)?.remove();panels.delete(side);}
  function refresh(side){const old=panels.get(side);if(!old)return;const r=old.getBoundingClientRect();old.remove();panels.delete(side);openPanel(side);const next=panels.get(side);if(next){next.style.left=`${r.left}px`;next.style.top=`${r.top}px`;next.style.right='auto';}}

  leftButton?.addEventListener('click',()=>openPanel('left'));rightButton?.addEventListener('click',()=>openPanel('right'));
  frame.addEventListener('load',()=>[40,260,900].forEach(delay=>setTimeout(bindFrame,delay)));
  window.addEventListener('resize',schedule,{passive:true});
})();
