/* Canonical reading dialog for Library, Editor, Public and portable consumers. */
(function(){
  const registry=window.PlatformModuleRegistry,ID='content-detail-dialog';
  if(!registry||registry.get(ID))return;
  const esc=registry.escapeHtml,attr=registry.attr,array=value=>Array.isArray(value)?value:[];
  const mounts=new WeakMap(),scrollOwners=new Set();
  let nextId=0,scrollSnapshot=null;

  function safeUrl(value){
    try{const url=new URL(String(value||''));return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}
  }
  function safeImage(value){
    const text=String(value||'');
    return /^\/(?!\/)[^\\\u0000-\u001f]*$/.test(text)?text:safeUrl(text);
  }
  function saveStyles(node,properties){return properties.map(name=>[name,node.style.getPropertyValue(name),node.style.getPropertyPriority(name)]);}
  function restoreStyles(node,snapshot){for(const [name,value,priority] of snapshot){if(value)node.style.setProperty(name,value,priority);else node.style.removeProperty(name);}}
  function lockScroll(owner){
    if(scrollOwners.has(owner))return;
    if(!scrollOwners.size){
      const html=document.documentElement,body=document.body,x=window.scrollX,y=window.scrollY;
      const gap=Math.max(0,window.innerWidth-html.clientWidth),padding=parseFloat(getComputedStyle(body).paddingRight)||0;
      scrollSnapshot={x,y,html:saveStyles(html,['overflow','scroll-behavior']),body:saveStyles(body,['position','top','left','width','overflow','padding-right','box-sizing'])};
      html.style.setProperty('overflow','hidden');
      body.style.setProperty('position','fixed');body.style.setProperty('top',`${-y}px`);body.style.setProperty('left',`${-x}px`);
      body.style.setProperty('width','100%');body.style.setProperty('overflow','hidden');body.style.setProperty('box-sizing','border-box');
      if(gap)body.style.setProperty('padding-right',`${padding+gap}px`);
    }
    scrollOwners.add(owner);
  }
  function unlockScroll(owner){
    if(!scrollOwners.delete(owner)||scrollOwners.size||!scrollSnapshot)return;
    const saved=scrollSnapshot;scrollSnapshot=null;
    restoreStyles(document.body,saved.body);restoreStyles(document.documentElement,saved.html);
    document.documentElement.style.setProperty('scroll-behavior','auto');
    window.scrollTo(saved.x,saved.y);
    const behavior=saved.html.find(([name])=>name==='scroll-behavior');
    if(behavior[1])document.documentElement.style.setProperty('scroll-behavior',behavior[1],behavior[2]);else document.documentElement.style.removeProperty('scroll-behavior');
  }
  const externalIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
  function linkMarkup(link,className=''){
    const url=safeUrl(link?.url);if(!url||!link?.label)return '';
    return `<a${className?` class="${className}"`:''} href="${attr(url)}" target="_blank" rel="noopener noreferrer" aria-label="${attr(link.label)} (새 탭)">${esc(link.label)}${externalIcon}</a>`;
  }
  function observedMarkup(value){
    if(!value)return '';
    const text=String(value),match=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
    return `<span>확인 ${match?`<time datetime="${attr(text)}">${match[1]}.${match[2]}.${match[3]}</time>`:esc(text)}</span>`;
  }
  function contentMarkup(item,titleId){
    const profile=item.kind==='profile',image=safeImage(item.image),tags=array(item.tags).filter(Boolean);
    const primary=safeUrl(item.url),profileUrl=safeUrl(item.profileUrl);
    const links=[...(primary?[{label:profile?'계정 보기':'원문 보기',url:primary}]:[]),...(profileUrl&&profileUrl!==primary?[{label:'프로필 보기',url:profileUrl}]:[])];
    const sections=array(item.sections).filter(section=>section&&typeof section==='object').map(section=>`<section class="edu-detail-section">${section.title?`<h3>${esc(section.title)}</h3>`:''}${array(section.body).map(text=>`<p>${esc(text)}</p>`).join('')}${array(section.bullets).length?`<ul>${section.bullets.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`:''}${array(section.links).length?`<div class="edu-detail-section__links">${section.links.map(link=>linkMarkup(link)).join('')}</div>`:''}</section>`).join('');
    const metrics=array(item.metrics).filter(metric=>metric&&metric.label&&metric.value!==undefined);
    const exercise=item.exercise&&typeof item.exercise==='object'?item.exercise:null;
    return `<header class="edu-detail-dialog__head"><div class="edu-detail-dialog__heading"><p class="edu-detail-dialog__kicker">${esc(item.kicker||(profile?'참고 계정':'사례 분석'))}</p><h2 id="${attr(titleId)}" tabindex="-1">${esc(item.title||'상세 내용')}</h2></div><button class="edu-detail-dialog__close" type="button" data-content-detail-close aria-label="상세 내용 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <div class="edu-detail-dialog__body" tabindex="0" role="region" aria-label="상세 본문">
        <div class="edu-detail-meta">${item.creator?`<span class="edu-detail-meta__creator">${esc(item.creator)}</span>`:''}${item.evidenceLabel?`<span class="edu-detail-meta__evidence">${esc(item.evidenceLabel)}</span>`:''}${observedMarkup(item.observedAt)}</div>
        ${item.summary?`<p class="edu-detail-summary">${esc(item.summary)}</p>`:''}
        ${image?`<figure class="edu-detail-image"><img src="${attr(image)}" alt="${attr(item.imageAlt||'')}" loading="lazy"></figure>`:''}
        ${tags.length?`<ul class="edu-detail-tags" aria-label="주요 내용">${tags.map(tag=>`<li>${esc(tag)}</li>`).join('')}</ul>`:''}
        ${metrics.length?`<dl class="edu-detail-metrics">${metrics.map(metric=>`<div><dt>${esc(metric.label)}</dt><dd>${esc(metric.value)}${metric.note?`<small>${esc(metric.note)}</small>`:''}</dd></div>`).join('')}</dl>`:''}
        ${sections}
        ${exercise?`<section class="edu-detail-exercise"><p class="edu-detail-exercise__label">직접 해보기</p><h3>${esc(exercise.title||'따라 해볼 과제')}</h3>${array(exercise.steps).length?`<ol>${exercise.steps.map(text=>`<li>${esc(text)}</li>`).join('')}</ol>`:''}${exercise.output?`<p class="edu-detail-exercise__output"><strong>완성할 결과물</strong>${esc(exercise.output)}</p>`:''}</section>`:''}
      </div>
      <footer class="edu-detail-dialog__foot"><div class="edu-detail-dialog__sources">${links.map(link=>linkMarkup(link,'edu-detail-source')).join('')}</div><button type="button" class="edu-detail-done" data-content-detail-close>닫기</button></footer>`;
  }
  function render(props={}){
    const title=props.item?.title||props.title||'상세 내용';
    return `<section class="edu-content-detail" data-platform-module="${ID}" data-content-detail-instance="${attr(props.instanceId||'')}">${props.launcher===false?'':`<button type="button" class="edu-detail-launcher" data-content-detail-launch aria-haspopup="dialog">${esc(props.launchLabel||`${title} 보기`)}</button>`}<dialog class="edu-detail-dialog" aria-label="${attr(title)}"></dialog></section>`;
  }
  function hydrate(host,props={}){
    const root=host.matches?.(`[data-platform-module="${ID}"]`)?host:host.querySelector?.(`[data-platform-module="${ID}"]`);
    if(!root)return;
    if(mounts.has(root))return mounts.get(root);
    const dialog=root.querySelector('.edu-detail-dialog'),dialogId=`edu-content-detail-${++nextId}`,titleId=`${dialogId}-title`;
    dialog.id=dialogId;root.dataset.contentDetailBound='true';
    root.querySelector('[data-content-detail-launch]')?.setAttribute('aria-controls',dialogId);
    let disposed=false,opened=false,opener=null,activeItem=null,backdropStart=false;
    const emit=(open,reason)=>root.dispatchEvent(new CustomEvent('platform-content-detail-state',{bubbles:true,detail:{open,itemId:String(activeItem?.id||''),reason}}));
    const finish=reason=>{
      if(!opened)return;
      opened=false;backdropStart=false;delete root.dataset.contentDetailOpen;
      unlockScroll(dialog);
      if(opener?.isConnected&&typeof opener.focus==='function')opener.focus({preventScroll:true});
      emit(false,reason||dialog.returnValue||'close');opener=null;
    };
    const close=(reason='close')=>{if(!dialog.open)return false;dialog.close(reason);finish(reason);return true;};
    const open=(item=props.item,trigger)=>{
      if(disposed||!root.isConnected||!item||typeof item!=='object'||typeof dialog.showModal!=='function')return false;
      const wasOpen=dialog.open;activeItem=item;
      if(!wasOpen)opener=trigger?.isConnected?trigger:document.activeElement;
      dialog.innerHTML=contentMarkup(item,titleId);dialog.setAttribute('aria-labelledby',titleId);dialog.removeAttribute('aria-label');
      if(!wasOpen){
        try{dialog.showModal();}catch{return false;}
        lockScroll(dialog);
      }
      opened=true;root.dataset.contentDetailOpen='true';
      dialog.querySelector('.edu-detail-dialog__body').scrollTop=0;
      dialog.querySelector('h2').focus({preventScroll:true});
      emit(true,'open');return true;
    };
    const click=event=>{
      if(event.target.closest?.('[data-content-detail-close]')){close('button');return;}
      const button=event.target.closest?.('[data-content-detail-launch]');if(button&&root.contains(button))open(props.item,button);
    };
    const cancel=event=>{event.preventDefault();close('escape');};
    const onClose=()=>{if(!dialog.open)finish(dialog.returnValue);};
    const outside=event=>{const rect=dialog.getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;};
    const pointerDown=event=>{backdropStart=event.target===dialog&&outside(event);};
    const pointerUp=event=>{const dismiss=backdropStart&&event.target===dialog&&outside(event);backdropStart=false;if(dismiss)close('backdrop');};
    const pointerCancel=()=>{backdropStart=false;};
    const keydown=event=>{
      if(event.key!=='Tab'||!dialog.open)return;
      const controls=[...dialog.querySelectorAll('a[href],button,input,textarea,select,[tabindex]')].filter(node=>!node.disabled&&node.tabIndex>=0&&node.getClientRects().length);
      const first=controls[0],last=controls.at(-1),active=document.activeElement;
      if(!first){event.preventDefault();dialog.querySelector('h2')?.focus({preventScroll:true});return;}
      if(event.shiftKey&&(active===first||!controls.includes(active))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
    };
    root.addEventListener('click',click);dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',onClose);dialog.addEventListener('keydown',keydown);
    dialog.addEventListener('pointerdown',pointerDown);dialog.addEventListener('pointerup',pointerUp);dialog.addEventListener('pointercancel',pointerCancel);
    const mount={api:{open,close,isOpen:()=>dialog.open,getItemId:()=>String(activeItem?.id||'')},cleanup(){
      if(disposed)return;disposed=true;close('cleanup');unlockScroll(dialog);
      root.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',onClose);dialog.removeEventListener('keydown',keydown);
      dialog.removeEventListener('pointerdown',pointerDown);dialog.removeEventListener('pointerup',pointerUp);dialog.removeEventListener('pointercancel',pointerCancel);
      delete root.dataset.contentDetailBound;mounts.delete(root);
    }};
    mounts.set(root,mount);return mount;
  }
  const preview={instanceId:'detail-example',launchLabel:'촬영 순서 예시 보기',item:{id:'detail-example',kind:'analysis',kicker:'촬영 구성 예시',title:'한 장면에 한 가지 정보',summary:'방 전체를 보여주는 장면과 창문·수납을 소개하는 장면을 나눠 편집하는 연습입니다.',evidenceLabel:'자체 제작 예시',tags:['촬영 순서','자막'],sections:[{title:'장면별 역할 나누기',body:['방에 들어서서 전체 구조를 보여준 뒤, 창문과 수납을 각각 가까이 촬영하세요.','한 장면에 여러 조건을 적으면 화면을 읽기 어렵습니다. 자막에는 그 장면에서 확인할 정보 하나를 적습니다.'],links:[{label:'YouTube 도움말',url:'https://support.google.com/youtube/'}]}],exercise:{title:'세 장면으로 방 소개하기',steps:['문 앞에서 방 전체를 세로로 촬영하세요.','창문과 수납을 각각 촬영하세요.','세 장면을 이어 붙이고 장면마다 짧은 자막을 넣으세요.'],output:'세 장면을 연결한 15초 영상'}}};
  registry.register({id:ID,label:'사례 상세 팝업',category:'content',status:'approved',source:'platform-core',version:1,consumers:['public','library','editor','export'],isolateInstances:true,ownerFiles:['public/assets/js/platform-modules/content-detail-dialog-v1.js','public/assets/styles/components/content-detail-dialog-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
