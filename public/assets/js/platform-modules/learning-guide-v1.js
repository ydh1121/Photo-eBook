/* Canonical learning content. All consumers use these render/hydrate owners. */
(function(){
  const registry=window.PlatformModuleRegistry;
  if(!registry||registry.get('learning-guide-hero'))return;
  const esc=registry.escapeHtml;
  const attr=registry.attr;
  const consumers=['public','library','editor','export'];
  const owner='public/assets/js/platform-modules/learning-guide-v1.js';
  const css='public/assets/styles/components/learning-guide-v1.css';
  const foundation=[
    'public/assets/styles/core/tokens.css','public/assets/styles/core/base-layout.css',
    'public/assets/styles/core/base-components.css','public/assets/styles/components/cards.css',
    'public/assets/styles/core/responsive-accessibility.css',
    'public/assets/styles/ui/progress-theme.css',
    'public/assets/styles/desktop/layout-hit-targets.css'
  ];
  function safeUrl(value){
    const url=String(value||'').trim();
    return /^(https?:\/\/|\/(?!\/)|#)/i.test(url)?url:'';
  }
  function paras(value){return (Array.isArray(value)?value:[value]).filter(Boolean).map(text=>`<p>${esc(text)}</p>`).join('');}
  function link(item,cls=''){
    const url=safeUrl(item?.url);if(!url)return '';
    const external=/^https?:\/\//i.test(url);
    return `<a class="${attr(cls)}" href="${attr(url)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${esc(item.label||item.title||'자료 열기')}${external?'<span aria-hidden="true"> ↗</span>':''}</a>`;
  }
  function renderHero(props={}){
    return `<header class="hero" data-platform-module="learning-guide-hero">
      <img class="hero__image" src="${attr(safeUrl(props.image))}" alt="${attr(props.imageAlt||'')}" fetchpriority="high">
      <div class="hero__body">
        <div class="hero__eyebrow">${esc(props.eyebrow||'')}</div>
        <h1>${esc(props.title||'')}</h1>
        <p>${esc(props.description||'')}</p>
        <div class="hero__facts">${(props.facts||[]).map(item=>`<div class="hero__fact"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('')}</div>
      </div>
    </header>`;
  }
  function renderBlock(block,context={}){
    const title=block.title?`<h3>${esc(block.title)}</h3>`:'';
    const id=String(block.id||context.blockId||'practice');
    const head=`<article class="guide-block edu-block edu-block--${attr(block.type||'prose')}">`;
    let body='';
    switch(block.type){
      case 'cards':
        body=`${title}<div class="edu-card-grid">${(block.items||[]).map(item=>`<div class="group-card edu-card">${item.eyebrow?`<div class="eyebrow">${esc(item.eyebrow)}</div>`:''}<h4>${esc(item.title)}</h4>${paras(item.body)}${item.bullets?.length?`<ul>${item.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${item.meta?`<p class="micro">${esc(item.meta)}</p>`:''}${item.link?link(item.link,'edu-text-link'):''}</div>`).join('')}</div>`;break;
      case 'steps':
        body=`${title}<ol class="edu-steps">${(block.items||[]).map((item,index)=>`<li class="group-card"><span class="edu-step-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h4>${esc(item.title)}</h4>${paras(item.body)}${item.output?`<p class="edu-output"><strong>남길 결과물</strong> ${esc(item.output)}</p>`:''}</div></li>`).join('')}</ol>`;break;
      case 'checklist':
        body=`<fieldset class="group-card edu-checklist" data-practice-id="${attr(id)}"><legend>${esc(block.title||'실습 점검')}</legend><div class="edu-checklist__meta"><span>이 기기에 자동 저장</span><output aria-live="polite">0 / ${(block.items||[]).length}</output></div>${(block.items||[]).map((item,index)=>`<label class="edu-check-item"><input type="checkbox" data-practice-item="${attr(item)}" aria-label="${attr(item)}"><span>${esc(item)}</span></label>`).join('')}</fieldset>`;break;
      case 'template':
        body=`<div class="group-card edu-template"><div class="edu-template__head">${title}<button type="button" class="edu-copy-btn" aria-label="${attr(block.title||'문안')} 복사">복사</button></div><pre tabindex="0">${esc(block.text||'')}</pre><span class="edu-copy-status micro" role="status"></span></div>`;break;
      case 'table':
        body=`${title}<div class="edu-table-wrap" role="region" aria-label="${attr(block.title||'비교표')}" tabindex="0"><table class="edu-table"><thead><tr>${(block.columns||[]).map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${(block.rows||[]).map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${esc(cell)}</th>`:`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${block.caption?`<p class="micro edu-table-caption">${esc(block.caption)}</p>`:''}`;break;
      case 'callout':
        body=`<aside class="callout-card edu-callout">${title}${paras(block.body)}</aside>`;break;
      case 'related':
        body=`${title}<div class="edu-related">${(block.items||[]).map(item=>link(item,'edu-related-link')).join('')}</div>`;break;
      default:body=`${title}<div class="guide-block__body">${paras(block.body)}</div>`;
    }
    return head+body+'</article>';
  }
  function renderSource(source,packId){
    const id=`${packId}:${source.id}`;
    return `<article class="curated-card edu-source-card" data-curated-id="${attr(id)}" data-source-id="${attr(source.id)}" data-content-pack="${attr(packId)}">
      <div class="curated-card__body">
        <div class="edu-source-top"><span class="curated-platform">${esc(source.publisher||'공식 자료')}</span><button type="button" class="curated-bookmark edu-bookmark" aria-label="${attr(source.title)} 저장" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg></button></div>
        <h3>${esc(source.title)}</h3><p>${esc(source.description||'')}</p>
        ${source.status?`<span class="edu-source-status">${esc(source.status)}</span>`:''}
        ${source.note?`<p class="edu-source-note">${esc(source.note)}</p>`:''}
        <div class="edu-source-footer"><span class="micro">확인 ${esc(source.checkedAt||'')}</span>${link({label:'공식 자료',url:source.url},'curated-open edu-text-link')}</div>
      </div>
    </article>`;
  }
  function renderSection(props={}){
    const chapter=props.chapter||{};
    const packId=String(props.packId||'guide');
    const chapterId=props.instanceId?`${props.instanceId}-${chapter.id||'chapter'}`:chapter.id;
    const index=Number(props.index||0);
    const sources=props.sources||[];
    const cited=(chapter.sourceIds||[]).map(id=>sources.find(source=>source.id===id)).filter(Boolean);
    const heading=chapter.image?`<div class="chapter-hero"><div class="wide"><div class="chapter-hero__card"><img loading="lazy" src="${attr(safeUrl(chapter.image))}" alt="${attr(chapter.imageAlt||'실습 상황을 보여주는 AI 생성 이미지')}"><div class="chapter-hero__copy"><div class="index">${String(index+1).padStart(2,'0')} / ${esc(chapter.label)}</div><h2>${esc(chapter.title)}</h2><p>${esc(chapter.description)}</p></div></div></div></div>`:`<div class="content edu-chapter-heading"><div class="eyebrow">${String(index+1).padStart(2,'0')} / ${esc(chapter.label)}</div><h2>${esc(chapter.title)}</h2><p>${esc(chapter.description)}</p></div>`;
    const resources=props.showSources?`<div class="edu-source-library"><div class="section-heading"><div class="eyebrow">공식 출처</div><h3>직접 확인할 자료</h3><p class="micro">교육 일정과 이용 조건은 링크의 최신 안내를 확인해 주세요. 북마크를 누르면 내 모음에 저장됩니다.</p></div><div class="edu-resource-grid">${sources.map(source=>renderSource(source,packId)).join('')}</div></div>`:'';
    return `<section id="${attr(chapterId)}" class="chapter edu-chapter" data-chapter="${attr(chapterId)}" data-platform-module="learning-guide-section" data-learning-pack="${attr(packId)}">
      ${heading}<div class="section grouped"><div class="content edu-reading">
        ${chapter.outcome?`<div class="edu-outcome"><span>이번 장의 결과물</span><strong>${esc(chapter.outcome)}</strong></div>`:''}
        <div class="guide-stack">${(chapter.blocks||[]).map((block,i)=>renderBlock(block,{blockId:`${chapter.id}-${i}`})).join('')}</div>
        ${cited.length?`<aside class="edu-evidence"><span>이 장의 근거</span><div>${cited.map(source=>link({label:source.title,url:source.url})).join('')}</div></aside>`:''}
        ${resources}
      </div></div>
    </section>`;
  }
  function hydrateSection(host,props={},context={}){
    const root=host.matches?.('[data-learning-pack]')?host:host.querySelector('[data-learning-pack]');
    if(!root||root.dataset.learningBound==='true')return;
    root.dataset.learningBound='true';
    const key=`personalEduPracticeV1:${props.packId||root.dataset.learningPack||'guide'}${props.instanceId?`:${props.instanceId}`:''}`;
    const persist=context.consumer==='public'||context.consumer==='export';
    let saved={};
    try{if(persist)saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
    const fields=[...root.querySelectorAll('[data-practice-id]')];
    const bookmarkStore=persist?window.ContentBookmarkStore:window.ContentBookmarkStore?.create({persistent:false});
    const sourceButtons=[...root.querySelectorAll('.edu-bookmark')];
    function syncBookmarks(){sourceButtons.forEach(button=>{const card=button.closest('[data-curated-id]');const active=Boolean(bookmarkStore?.has('article',card.dataset.curatedId));button.classList.toggle('is-favorite',active);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${card.querySelector('h3').textContent} ${active?'저장 취소':'저장'}`);});}
    syncBookmarks();
    function sync(field){const boxes=[...field.querySelectorAll('input[type=checkbox]')];const count=boxes.filter(input=>input.checked).length;field.querySelector('output').textContent=`${count} / ${boxes.length}`;}
    fields.forEach(field=>{field.querySelectorAll('input').forEach(input=>input.checked=Boolean(saved[`${field.dataset.practiceId}:${input.dataset.practiceItem}`]));sync(field);});
    const change=event=>{
      const input=event.target.closest?.('[data-practice-item]');if(!input)return;
      const field=input.closest('[data-practice-id]');
      try{if(persist){const current=JSON.parse(localStorage.getItem(key)||'{}');if(current&&typeof current==='object'&&!Array.isArray(current))saved=current;}}catch{}
      saved[`${field.dataset.practiceId}:${input.dataset.practiceItem}`]=input.checked;
      try{if(persist)localStorage.setItem(key,JSON.stringify(saved));}catch{field.querySelector('.edu-checklist__meta span').textContent='이 기기에 저장하지 못했습니다.';}
      sync(field);
    };
    const click=async event=>{
      const bookmark=event.target.closest?.('.edu-bookmark');
      if(bookmark){
        const card=bookmark.closest('[data-curated-id]'),source=(props.sources||[]).find(item=>item.id===card.dataset.sourceId);
        if(source&&bookmarkStore){
          try{bookmarkStore.set('article',{id:card.dataset.curatedId,title:source.title,og_title:source.title,url:safeUrl(source.url),thumbnail_url:'',platform:source.publisher||'공식 자료',summary:source.description||'',pack_id:props.packId||root.dataset.learningPack},!bookmarkStore.has('article',card.dataset.curatedId));syncBookmarks();}
          catch{bookmark.setAttribute('aria-label',`${source.title} 저장 공간을 확인해 주세요`);}
        }
        return;
      }
      const button=event.target.closest?.('.edu-copy-btn');if(!button)return;
      const card=button.closest('.edu-template'),status=card.querySelector('[role=status]');
      try{await navigator.clipboard.writeText(card.querySelector('pre').textContent);status.textContent='복사했습니다. 대괄호 안의 내용을 바꿔 사용하세요.';button.textContent='복사됨';}
      catch{status.textContent='문안을 길게 누르거나 선택해 복사해 주세요.';card.querySelector('pre').focus();}
    };
    root.addEventListener('change',change);root.addEventListener('click',click);
    const storeChange=event=>{if(event.detail?.persistent===persist)syncBookmarks();};
    document.addEventListener('content-bookmarks-changed',storeChange);
    return ()=>{root.removeEventListener('change',change);root.removeEventListener('click',click);document.removeEventListener('content-bookmarks-changed',storeChange);delete root.dataset.learningBound;};
  }
  const heroPreview={eyebrow:'실습 가이드',title:'배운 내용을\n작은 결과물로',description:'목표를 정하고 직접 만든 결과물을 점검해 보세요.',image:'/assets/images/generated/personal-edu-v1/video-hero.webp',imageAlt:'스마트폰 촬영 실습을 묘사한 AI 생성 이미지',facts:[{label:'도구',value:'지금 쓰는 스마트폰'},{label:'결과물',value:'첫 실습 한 편'},{label:'학습',value:'실습과 피드백'},{label:'기록',value:'다음 작업에 재사용'}]};
  const sectionPreview={packId:'preview',index:0,chapter:{id:'practice',label:'실습',title:'작은 결과물을 완성해 보세요',description:'목표와 확인 기준을 함께 적습니다.',outcome:'검토할 결과물 한 개',blocks:[{type:'checklist',id:'preview',title:'완성 후 점검',items:['사용할 목적을 적었다','결과물을 직접 확인했다']},{type:'template',title:'실습 기록',text:'목적: [사용 목적]\n결과: [만든 결과물]\n다음 수정: [한 가지]'}]},sources:[]};
  registry.register({id:'learning-guide-hero',label:'학습 가이드 표지',category:'content',status:'approved',source:'public-extracted',sourceRoute:'/',version:1,consumers,ownerFiles:[owner,...foundation,css],previewProps:heroPreview,editorProps:heroPreview,render:renderHero});
  registry.register({id:'learning-guide-section',label:'학습·실습 본문',category:'content',status:'approved',source:'platform-core',version:1,consumers,isolateInstances:true,ownerFiles:['public/assets/js/core/content-bookmark-store.js',owner,...foundation,css],previewProps:sectionPreview,editorProps:sectionPreview,render:renderSection,hydrate:hydrateSection});
})();
