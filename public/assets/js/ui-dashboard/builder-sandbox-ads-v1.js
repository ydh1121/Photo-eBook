(function(){
  const frame=document.querySelector('#builderFrame');
  const panelLayer=document.querySelector('#builderPanelLayer');
  const leftButton=document.querySelector('#builderAdLeft');
  const rightButton=document.querySelector('#builderAdRight');
  if(!frame||!panelLayer)return;

  const STORAGE_KEY='platformBuilderSideAdsV1';
  const DEFAULTS={enabled:false,width:120,height:430,top:148,gap:10,follow:true};
  const panels=new Map();

  function read(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(value){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch{}}
  function config(side){const all=read();return {...DEFAULTS,...(all[side]||{})};}
  function save(side,next){const all=read();all[side]=next;write(all);}
  function doc(){return frame.contentDocument;}
  function slot(side){return doc()?.querySelector(`[data-builder-ad-slot="${side}"]`)||null;}
  function sideLabel(side){return side==='left'?'좌측':'우측';}

  function apply(side){
    const node=slot(side);if(!node)return;
    const cfg=config(side);
    node.dataset.adEnabled=String(Boolean(cfg.enabled));
    node.dataset.adFollow=String(Boolean(cfg.follow));
    node.style.setProperty('--sandbox-ad-width',`${Number(cfg.width)||120}px`);
    node.style.setProperty('--sandbox-ad-height',`${Number(cfg.height)||430}px`);
    node.style.setProperty('--sandbox-ad-top',`${Number(cfg.top)||148}px`);
    node.style.setProperty('--sandbox-ad-gap',`${Number(cfg.gap)||10}px`);
    const strong=node.querySelector('.sandbox-side-ad__inner strong');
    if(strong)strong.textContent=`${sideLabel(side)} 플로팅 배너`;
  }

  function bindFrame(){
    const frameDoc=doc();if(!frameDoc||frameDoc.documentElement.dataset.builderSandbox!=='true')return;
    ['left','right'].forEach(side=>{
      apply(side);
      const button=frameDoc.querySelector(`[data-ad-slot-settings="${side}"]`);
      if(button&&button.dataset.parentBound!=='true'){
        button.dataset.parentBound='true';
        button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPanel(side);});
      }
    });
    const status=document.querySelector('#builderFrameStatus');
    if(status&&!status.hidden)status.textContent='더미 UI 캔버스를 준비하는 중';
  }

  function control(label,key,value,{min=0,max=1000,step=1,unit='px'}={}){
    return `<label class="builder-control"><span>${label}<small>${value}${unit}</small></span><input type="range" data-ad-control="${key}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
  }

  function openPanel(side){
    if(panels.has(side)){focus(side);return;}
    const cfg=config(side);
    const panel=document.createElement('section');
    panel.className='builder-inspector builder-ad-inspector is-active';
    panel.dataset.adInspector=side;
    panel.innerHTML=`<header class="builder-inspector__head"><div><small>광고 영역</small><strong>${sideLabel(side)} 플로팅 배너</strong></div><button type="button" data-close-ad-inspector aria-label="닫기">×</button></header><div class="builder-inspector__body"><div class="builder-inspector__actual"><span>배치<b>PC ${sideLabel(side)} 여백</b></span><span>동작<b>스크롤 추적</b></span></div><section class="builder-control-group"><strong>표시</strong><div class="builder-control-grid"><label class="builder-control builder-control--boolean"><span>사용</span><input type="checkbox" data-ad-control="enabled" ${cfg.enabled?'checked':''}></label><label class="builder-control builder-control--boolean"><span>스크롤 따라가기</span><input type="checkbox" data-ad-control="follow" ${cfg.follow?'checked':''}></label></div></section><section class="builder-control-group"><strong>크기와 위치</strong><div class="builder-control-grid">${control('폭','width',cfg.width,{min:90,max:220,step:2})}${control('높이','height',cfg.height,{min:180,max:700,step:10})}${control('상단 위치','top',cfg.top,{min:90,max:320,step:2})}${control('본문 간격','gap',cfg.gap,{min:0,max:48,step:1})}</div></section><section class="builder-inspector__memo"><p>이 슬롯은 더미 캔버스에만 존재합니다. 실제 광고 네트워크나 운영 페이지에는 연결되지 않습니다.</p></section></div><footer class="builder-inspector__foot"><button type="button" data-ad-reset>초기값</button><button type="button" data-primary data-ad-enable>${cfg.enabled?'사용 중':'광고 켜기'}</button></footer>`;
    panel.style.left=side==='left'?'16px':'auto';
    panel.style.right=side==='right'?'16px':'auto';
    panel.style.top='118px';
    panelLayer.appendChild(panel);panels.set(side,panel);installDrag(panel,side);bindPanel(panel,side);focus(side);
  }

  function bindPanel(panel,side){
    panel.querySelector('[data-close-ad-inspector]')?.addEventListener('click',()=>closePanel(side));
    panel.querySelector('[data-ad-reset]')?.addEventListener('click',()=>{save(side,{...DEFAULTS});refreshPanel(side);apply(side);});
    panel.querySelector('[data-ad-enable]')?.addEventListener('click',()=>{const next=config(side);next.enabled=!next.enabled;save(side,next);refreshPanel(side);apply(side);});
    panel.querySelectorAll('[data-ad-control]').forEach(input=>input.addEventListener('input',()=>{
      const key=input.dataset.adControl;const next=config(side);next[key]=input.type==='checkbox'?input.checked:Number(input.value);save(side,next);apply(side);
      const small=input.closest('.builder-control')?.querySelector('small');if(small&&input.type!=='checkbox')small.textContent=`${input.value}px`;
      const enable=panel.querySelector('[data-ad-enable]');if(enable)enable.textContent=next.enabled?'사용 중':'광고 켜기';
    }));
    panel.addEventListener('pointerdown',()=>focus(side));
  }

  function installDrag(panel,side){
    const head=panel.querySelector('.builder-inspector__head');let drag=null;
    head?.addEventListener('pointerdown',event=>{if(event.target.closest('button')||matchMedia('(max-width:760px)').matches)return;const rect=panel.getBoundingClientRect();drag={x:event.clientX-rect.left,y:event.clientY-rect.top};head.setPointerCapture?.(event.pointerId);focus(side);});
    head?.addEventListener('pointermove',event=>{if(!drag)return;panel.style.left=`${Math.max(6,Math.min(innerWidth-panel.offsetWidth-6,event.clientX-drag.x))}px`;panel.style.top=`${Math.max(70,Math.min(innerHeight-panel.offsetHeight-6,event.clientY-drag.y))}px`;panel.style.right='auto';});
    head?.addEventListener('pointerup',event=>{if(!drag)return;drag=null;head.releasePointerCapture?.(event.pointerId);});
  }

  function focus(side){panels.forEach((panel,key)=>{panel.classList.toggle('is-active',key===side);panel.style.zIndex=key===side?'45':'30';});}
  function closePanel(side){panels.get(side)?.remove();panels.delete(side);}
  function refreshPanel(side){const old=panels.get(side);if(!old)return;const rect=old.getBoundingClientRect();old.remove();panels.delete(side);openPanel(side);const next=panels.get(side);if(next){next.style.left=`${rect.left}px`;next.style.top=`${rect.top}px`;next.style.right='auto';}}
  function enableAndOpen(side){const next=config(side);next.enabled=true;save(side,next);apply(side);openPanel(side);}

  leftButton?.addEventListener('click',()=>enableAndOpen('left'));
  rightButton?.addEventListener('click',()=>enableAndOpen('right'));
  frame.addEventListener('load',()=>[40,350,900].forEach(delay=>setTimeout(bindFrame,delay)));
  setInterval(bindFrame,1400);
})();
