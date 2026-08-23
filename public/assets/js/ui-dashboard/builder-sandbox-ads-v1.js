(function(){
  const frame=document.querySelector('#builderFrame');
  const panelLayer=document.querySelector('#builderPanelLayer');
  const leftButton=document.querySelector('#builderAdLeft');
  const rightButton=document.querySelector('#builderAdRight');
  if(!frame||!panelLayer)return;

  const STORAGE_KEY='platformBuilderSideAdsV1';
  const DEFAULTS={enabled:false,width:110,height:430,top:108,gap:40,follow:true};
  const panels=new Map();

  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function write(v){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(v));}catch{}}
  function config(side){return {...DEFAULTS,...(read()[side]||{})};}
  function save(side,next){const all=read();all[side]=next;write(all);}
  function doc(){try{return frame.contentDocument;}catch{return null;}}
  function slot(side){return doc()?.querySelector(`[data-builder-ad-slot="${side}"]`)||null;}
  function label(side){return side==='left'?'좌측':'우측';}
  function adminInset(){
    if(matchMedia('(max-width:820px)').matches)return 0;
    const shell=document.querySelector('.platform-admin-shell');
    if(!shell)return 0;
    const rect=shell.getBoundingClientRect();
    return rect.width>0&&rect.left<=0?Math.max(0,rect.right):0;
  }
  function panelMinLeft(){return adminInset()+6;}

  /* This module owns only ad configuration and inspector UI.
     Geometry/visibility is owned exclusively by builder-side-ad-zone-audit-v1.js
     so scroll/resize cannot have two writers racing on data-ad-zone-active. */
  function mirror(side){
    const node=slot(side);if(!node)return;
    const cfg=config(side);
    node.dataset.adEnabled=String(Boolean(cfg.enabled));
    const strong=node.querySelector('.sandbox-side-ad__inner strong');
    if(strong)strong.textContent=`${label(side)} 광고`;
  }

  function bindFrame(){
    const d=doc();if(!d||d.documentElement.dataset.builderSandbox!=='true')return;
    ['left','right'].forEach(side=>{
      mirror(side);
      const button=d.querySelector(`[data-ad-slot-settings="${side}"]`);
      if(button&&button.dataset.parentBound!=='true'){
        button.dataset.parentBound='true';
        button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPanel(side);});
      }
    });
  }

  function control(title,key,value,{min=0,max=1000,step=1,unit='px'}={}){
    return `<label class="builder-control"><span>${title}<small>${value}${unit}</small></span><input type="range" data-ad-control="${key}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
  }

  function openPanel(side){
    if(panels.has(side)){focus(side);return;}
    const cfg=config(side);
    const panel=document.createElement('section');
    panel.className='builder-inspector builder-ad-inspector is-active';
    panel.dataset.adInspector=side;
    panel.innerHTML=`<header class="builder-inspector__head"><div><small>광고 영역</small><strong>${label(side)} 광고</strong></div><button type="button" data-close-ad-inspector aria-label="닫기">×</button></header><div class="builder-inspector__body"><div class="builder-inspector__actual"><span>배치<b>콘텐츠 외곽 레일</b></span><span>노출<b>메인 히어로 이후 유지</b></span></div><section class="builder-control-group"><strong>표시</strong><div class="builder-control-grid"><label class="builder-control builder-control--boolean"><span>사용</span><input type="checkbox" data-ad-control="enabled" ${cfg.enabled?'checked':''}></label><label class="builder-control builder-control--boolean"><span>스크롤 따라가기</span><input type="checkbox" data-ad-control="follow" ${cfg.follow?'checked':''}></label></div></section><section class="builder-control-group"><strong>크기와 위치</strong><div class="builder-control-grid">${control('폭','width',cfg.width,{min:90,max:220,step:2})}${control('높이','height',cfg.height,{min:180,max:700,step:10})}${control('상단 기준','top',cfg.top,{min:82,max:260,step:2})}${control('콘텐츠 간격','gap',cfg.gap,{min:24,max:80,step:2})}</div></section><section class="builder-inspector__memo"><p>광고는 첫 메인 히어로를 지나면 현재 보이는 본문 콘텐츠의 바깥쪽 여백에 배치됩니다. 챕터 히어로 위에는 겹치지 않습니다.</p></section></div><footer class="builder-inspector__foot"><button type="button" data-ad-reset>초기값</button><button type="button" data-primary data-ad-enable>${cfg.enabled?'광고 끄기':'광고 켜기'}</button></footer>`;
    panel.style.left=side==='left'?`${adminInset()+16}px`:'auto';
    panel.style.right=side==='right'?'16px':'auto';
    panel.style.top='86px';
    panelLayer.appendChild(panel);
    panels.set(side,panel);
    drag(panel,side);
    bindPanel(panel,side);
    focus(side);
  }

  function notifyGeometry(){
    document.dispatchEvent(new CustomEvent('platform-builder-side-ad-config-change'));
  }

  function bindPanel(panel,side){
    panel.querySelector('[data-close-ad-inspector]')?.addEventListener('click',()=>close(side));
    panel.querySelector('[data-ad-reset]')?.addEventListener('click',()=>{
      save(side,{...DEFAULTS});
      mirror(side);
      notifyGeometry();
      refresh(side);
    });
    panel.querySelector('[data-ad-enable]')?.addEventListener('click',()=>{
      const next=config(side);next.enabled=!next.enabled;save(side,next);
      mirror(side);notifyGeometry();refresh(side);
    });
    panel.querySelectorAll('[data-ad-control]').forEach(input=>input.addEventListener('input',()=>{
      const key=input.dataset.adControl,next=config(side);
      next[key]=input.type==='checkbox'?input.checked:Number(input.value);
      save(side,next);mirror(side);notifyGeometry();
      const small=input.closest('.builder-control')?.querySelector('small');
      if(small&&input.type!=='checkbox')small.textContent=`${input.value}px`;
      const enable=panel.querySelector('[data-ad-enable]');
      if(enable)enable.textContent=next.enabled?'광고 끄기':'광고 켜기';
    }));
    panel.addEventListener('pointerdown',()=>focus(side));
  }

  function drag(panel,side){
    const head=panel.querySelector('.builder-inspector__head');let state=null;
    head?.addEventListener('pointerdown',event=>{
      if(event.target.closest('button')||matchMedia('(max-width:760px)').matches)return;
      const rect=panel.getBoundingClientRect();state={x:event.clientX-rect.left,y:event.clientY-rect.top};
      head.setPointerCapture?.(event.pointerId);focus(side);
    });
    head?.addEventListener('pointermove',event=>{
      if(!state)return;
      panel.style.left=`${Math.max(panelMinLeft(),Math.min(innerWidth-panel.offsetWidth-6,event.clientX-state.x))}px`;
      panel.style.top=`${Math.max(70,Math.min(innerHeight-panel.offsetHeight-6,event.clientY-state.y))}px`;
      panel.style.right='auto';
    });
    head?.addEventListener('pointerup',event=>{state=null;head.releasePointerCapture?.(event.pointerId);keepPanelsClear();});
  }

  function focus(side){panels.forEach((panel,key)=>{panel.classList.toggle('is-active',key===side);panel.style.zIndex=key===side?'45':'30';});}
  function close(side){panels.get(side)?.remove();panels.delete(side);}
  function refresh(side){
    const old=panels.get(side);if(!old)return;
    const rect=old.getBoundingClientRect();old.remove();panels.delete(side);openPanel(side);
    const next=panels.get(side);if(next){next.style.left=`${Math.max(panelMinLeft(),rect.left)}px`;next.style.top=`${rect.top}px`;next.style.right='auto';}
  }
  function keepPanelsClear(){
    if(matchMedia('(max-width:760px)').matches)return;
    const min=panelMinLeft();
    panels.forEach(panel=>{const rect=panel.getBoundingClientRect();if(rect.left<min){panel.style.left=`${min}px`;panel.style.right='auto';}});
  }

  leftButton?.addEventListener('click',()=>openPanel('left'));
  rightButton?.addEventListener('click',()=>openPanel('right'));
  frame.addEventListener('load',()=>[40,260,900].forEach(delay=>setTimeout(bindFrame,delay)));
  window.addEventListener('resize',keepPanelsClear,{passive:true});
  if(frame.contentDocument?.readyState==='complete')bindFrame();
})();
