/* Case summaries compose the canonical rail and canonical reading dialog. */
(function(){
  const registry=window.PlatformModuleRegistry,ID='reference-case-rail';
  if(!registry||registry.get(ID))return;
  const esc=registry.escapeHtml,attr=registry.attr,array=value=>Array.isArray(value)?value:[],mounts=new WeakMap();
  function itemsOf(value){const seen=new Set();return array(value).filter(item=>item&&typeof item==='object'&&item.id&&item.title&&!seen.has(String(item.id))&&seen.add(String(item.id)));}
  function safeImage(value){
    const text=String(value||'');if(/^\/(?!\/)[^\\\u0000-\u001f]*$/.test(text))return text;
    try{const url=new URL(text);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}
  }
  function card(item,index){
    const profile=item.kind==='profile',image=safeImage(item.image),number=String(index+1).padStart(2,'0');
    return `<article class="edu-reference-card" data-reference-kind="${profile?'profile':'analysis'}">
      ${image?`<div class="edu-reference-card__image"><img src="${attr(image)}" alt="${attr(item.imageAlt||'')}" loading="lazy" draggable="false"></div>`:`<div class="edu-reference-card__graphic" aria-hidden="true"><span class="edu-reference-card__number">${number}</span><span class="edu-reference-card__graphic-label">${profile?'참고 계정':'사례 분석'}</span><i></i></div>`}
      <div class="edu-reference-card__body"><p class="edu-reference-card__kicker">${esc(item.kicker||(profile?'참고 계정':'사례 분석'))}</p><h4><button class="edu-reference-card__open" type="button" data-reference-case-id="${attr(item.id)}" aria-haspopup="dialog" aria-label="${attr(item.title)} 상세 보기">${esc(item.title)}</button></h4>
      ${item.creator?`<p class="edu-reference-card__creator">${esc(item.creator)}</p>`:''}${item.summary?`<p class="edu-reference-card__summary">${esc(item.summary)}</p>`:''}
      ${array(item.tags).length?`<ul class="edu-reference-card__tags">${item.tags.slice(0,3).map(tag=>`<li>${esc(tag)}</li>`).join('')}</ul>`:''}
      <div class="edu-reference-card__foot">${item.evidenceLabel?`<small>${esc(item.evidenceLabel)}</small>`:''}<span>${profile?'계정 살펴보기':'분석 읽기'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></div></div>
    </article>`;
  }
  function dialogProps(props){return {instanceId:`${props.instanceId||'reference'}:detail`,launcher:false};}
  function railProps(props,items){return {items,framed:false,ariaLabel:props.title||'콘텐츠 사례'};}
  function render(props={},context={}){
    const items=itemsOf(props.items),title=props.title||'콘텐츠 사례';
    return `<section class="edu-reference" data-platform-module="${ID}" data-reference-instance="${attr(props.instanceId||'')}"><header class="edu-reference__head"><h3>${esc(title)}</h3>${props.description?`<p>${esc(props.description)}</p>`:''}</header>${items.length?registry.renderDependency(ID,'horizontal-rail',railProps(props,items),{...context,renderItem:card}):'<p class="edu-reference__empty">아직 등록된 사례가 없습니다.</p>'}${registry.renderDependency(ID,'content-detail-dialog',dialogProps(props),context)}</section>`;
  }
  function hydrate(host,props={},context={}){
    const root=host.matches?.(`[data-platform-module="${ID}"]`)?host:host.querySelector?.(`[data-platform-module="${ID}"]`);
    if(!root)return;if(mounts.has(root))return mounts.get(root);
    const items=itemsOf(props.items),byId=new Map(items.map(item=>[String(item.id),item]));
    const rail=root.querySelector('[data-platform-module="horizontal-rail"]'),detail=root.querySelector('[data-platform-module="content-detail-dialog"]');
    const railMount=rail?registry.hydrateDependency(ID,rail,'horizontal-rail',railProps(props,items),context):null;
    const detailMount=registry.hydrateDependency(ID,detail,'content-detail-dialog',dialogProps(props),context);
    root.dataset.referenceBound='true';
    const dialog=detail.querySelector('dialog');
    root.querySelectorAll('[data-reference-case-id]').forEach(button=>button.setAttribute('aria-controls',dialog.id));
    const open=(id,trigger)=>{const item=byId.get(String(id));return item?detailMount.api.open(item,trigger):false;};
    const click=event=>{const button=event.target.closest?.('[data-reference-case-id]');if(!button||button.closest(`[data-platform-module="${ID}"]`)!==root||event.defaultPrevented)return;open(button.dataset.referenceCaseId,button);};
    const imageError=event=>{if(event.target.matches?.('.edu-reference-card__image img'))event.target.closest('.edu-reference-card__image').classList.add('is-unavailable');};
    root.addEventListener('click',click);root.addEventListener('error',imageError,true);
    let disposed=false;
    const mount={api:{open,close:()=>detailMount.api.close(),isOpen:()=>detailMount.api.isOpen()},cleanup(){if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('error',imageError,true);detailMount.cleanup();railMount?.cleanup();delete root.dataset.referenceBound;mounts.delete(root);}};
    mounts.set(root,mount);return mount;
  }
  const preview={instanceId:'reference-example',title:'영상에서 배워볼 촬영 구성',description:'카드를 눌러 장면 구성과 연습 방법을 읽어보세요.',items:[
    {id:'example-opening',kind:'analysis',kicker:'첫 장면 예시',title:'방의 특징부터 보여주기',summary:'창이 넓은 방이라면 창문과 들어오는 빛으로 영상을 시작해 보세요.',evidenceLabel:'자체 제작 예시',tags:['도입부','장면 선택'],sections:[{title:'첫 장면 정하기',body:['영상에서 소개할 방의 특징을 한 가지 고르고, 그 특징이 잘 보이는 위치를 찾으세요.','문 앞에서 시작한 영상과 특징을 가까이 보여주는 영상을 각각 만들어 비교합니다.']}],exercise:{title:'첫 장면 두 가지 만들기',steps:['같은 방을 문 앞과 창가에서 촬영하세요.','뒤에 이어질 장면은 같게 두고 시작 화면만 바꾸세요.'],output:'첫 장면이 다른 15초 영상 두 편'}},
    {id:'example-sequence',kind:'analysis',kicker:'촬영 순서 예시',title:'전체 구조에서 작은 공간으로',summary:'방 전체, 창문, 수납 순으로 장면을 나눠 소개하는 연습입니다.',evidenceLabel:'자체 제작 예시',tags:['촬영 순서','자막'],sections:[{title:'장면 연결하기',body:['전체 구조를 보여준 뒤, 창문과 수납을 각각 촬영하세요. 장면을 바꿀 때마다 자막도 화면에 맞게 고칩니다.']}],exercise:{title:'세 장면으로 소개하기',steps:['방 전체를 촬영하세요.','창문과 수납을 가까이 촬영하세요.','세 장면을 이어 붙이세요.'],output:'세 장면으로 구성한 세로 영상'}},
    {id:'example-caption',kind:'analysis',kicker:'자막 예시',title:'장면마다 짧게 설명하기',summary:'한 화면에 적힌 설명을 줄이고, 공간을 볼 시간을 남겨 두세요.',evidenceLabel:'자체 제작 예시',tags:['자막','편집'],sections:[{title:'읽을 시간 남기기',body:['자막을 소리 내어 읽어본 뒤, 화면이 너무 빨리 바뀌는 구간을 늘리세요.']}],exercise:{title:'자막 길이 조절하기',steps:['자막이 두 줄을 넘는 장면을 고르세요.','내용을 두 장면으로 나눠 보세요.'],output:'장면별 자막을 정리한 영상'}},
    {id:'example-profile',kind:'profile',kicker:'계정 살펴보기 예시',title:'게시물을 비교할 때 적어둘 것',summary:'도입 문구, 소개 순서, 마지막 안내를 나눠 기록해 보세요.',evidenceLabel:'관찰 항목 예시',tags:['계정 조사','기록'],sections:[{title:'세 게시물 비교하기',body:['같은 계정에서 게시물 세 개를 골라 반복해서 쓰는 구성을 적어보세요.'],bullets:['첫 화면의 문구','공간을 보여주는 순서','마지막에 안내하는 행동'],links:[{label:'YouTube 도움말',url:'https://support.google.com/youtube/'}]}]}
  ]};
  registry.register({id:ID,label:'콘텐츠 사례 가로 카드',category:'content',status:'approved',source:'platform-core',version:1,consumers:['public','library','editor','export'],isolateInstances:true,dependencies:[{id:'horizontal-rail',kind:'composition',required:true},{id:'content-detail-dialog',kind:'composition',required:true}],ownerFiles:['public/assets/js/platform-modules/reference-case-rail-v1.js','public/assets/styles/components/reference-case-rail-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
