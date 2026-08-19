(function(){
  const registry=window.PlatformBlockRegistry;
  if(!registry)return;

  const arr=value=>Array.isArray(value)?value:[];
  const text=(e,value,fallback='')=>e(value??fallback);
  const image=(e,src,alt='',className='')=>src?`<img class="${e(className)}" src="${e(src)}" alt="${e(alt)}" loading="lazy">`:'';
  const eyebrow=(e,value)=>value?`<div class="pb-eyebrow">${e(value)}</div>`:'';
  const description=(e,value)=>value?`<p class="pb-description">${e(value)}</p>`:'';
  const tags=(e,values)=>arr(values).length?`<div class="pb-tags">${arr(values).map(item=>`<span>${e(item)}</span>`).join('')}</div>`:'';

  registry.register({
    type:'hero',label:'Hero',category:'foundation',status:'candidate',editorialProfile:'hero',variants:['image-metrics','minimal'],
    render(block,{escapeHtml:e}){
      const c=block.content;
      const facts=arr(c.facts);
      return `<header class="pb-block pb-hero pb-hero--${e(block.variant)}">
        ${image(e,c.image,c.imageAlt||'','pb-hero__image')}
        <div class="pb-hero__overlay"></div>
        <div class="pb-hero__content">
          ${eyebrow(e,c.eyebrow)}
          <h1>${text(e,c.title)}</h1>
          ${description(e,c.description)}
          ${block.variant==='image-metrics'&&facts.length?`<div class="pb-hero__facts">${facts.map(f=>`<div class="pb-hero__fact"><span>${text(e,f.label)}</span><strong>${text(e,f.value)}</strong>${f.note?`<small>${text(e,f.note)}</small>`:''}</div>`).join('')}</div>`:''}
        </div>
      </header>`;
    }
  });

  registry.register({
    type:'chapter-hero',label:'Chapter Hero',category:'foundation',status:'candidate',editorialProfile:'section-heading',variants:['image','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content;
      return `<section class="pb-block pb-chapter-hero pb-chapter-hero--${e(block.variant)}">
        ${block.variant==='image'?`<div class="pb-chapter-hero__media">${image(e,c.image,c.imageAlt||c.title||'')}</div>`:''}
        <div class="pb-chapter-hero__copy">
          ${c.index?`<div class="pb-index">${text(e,c.index)}</div>`:''}
          ${eyebrow(e,c.eyebrow)}
          <h2>${text(e,c.title)}</h2>
          ${description(e,c.description)}
        </div>
      </section>`;
    }
  });

  registry.register({
    type:'section-heading',label:'Section Heading',category:'foundation',status:'candidate',editorialProfile:'section-heading',variants:['default','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content;
      return `<header class="pb-block pb-section-heading pb-section-heading--${e(block.variant)}">
        ${eyebrow(e,c.eyebrow)}
        <h2>${text(e,c.title)}</h2>
        ${description(e,c.description)}
      </header>`;
    }
  });

  registry.register({
    type:'rich-text',label:'Rich Text',category:'content',status:'candidate',editorialProfile:'rich-text',referenceProfiles:['editorial-daleseo-korean-skills','editorial-nomadamas-korean-humanizer'],variants:['default','lead'],
    render(block,{escapeHtml:e}){
      const c=block.content;
      const paragraphs=arr(c.paragraphs);
      return `<article class="pb-block pb-rich-text pb-rich-text--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        <div class="pb-prose">${paragraphs.map(p=>`<p>${text(e,p)}</p>`).join('')}</div>
      </article>`;
    }
  });

  registry.register({
    type:'process',label:'Process / Ranking',category:'content',status:'candidate',editorialProfile:'process',variants:['sequence','ranking'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-process pb-process--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-process__list">${items.map((item,i)=>`<div class="pb-process__row">
          <span class="pb-step">${text(e,item.step||String(i+1).padStart(2,'0'))}</span>
          <div><small>${text(e,item.label||((block.variant==='ranking')?`우선순위 ${i+1}`:`STEP ${String(i+1).padStart(2,'0')}`))}</small><strong>${text(e,item.title||item)}</strong>${item.description?`<p>${text(e,item.description)}</p>`:''}</div>
        </div>`).join('')}</div>
        ${c.note?`<div class="pb-inline-note">${text(e,c.note)}</div>`:''}
      </section>`;
    }
  });

  registry.register({
    type:'metric-grid',label:'Metric Grid',category:'data',status:'candidate',editorialProfile:'metrics',variants:['default','emphasis'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-metrics pb-metrics--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-metric-grid">${items.map(item=>`<article class="pb-metric"><span>${text(e,item.label)}</span><strong>${text(e,item.value)}</strong>${item.note?`<p>${text(e,item.note)}</p>`:''}${item.source?`<small>${text(e,item.source)}</small>`:''}</article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'offer-rail',label:'Offer / Pricing Rail',category:'data',status:'candidate',editorialProfile:'comparison',variants:['cards','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-offers pb-offers--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-rail">${items.map(item=>`<article class="pb-offer-card"><small>${text(e,item.label)}</small><h4>${text(e,item.title)}</h4>${item.price?`<strong class="pb-price">${text(e,item.price)}</strong>`:''}<p>${text(e,item.description)}</p>${tags(e,item.tags)}</article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'notice',label:'Notice / Warning',category:'content',status:'candidate',editorialProfile:'callout',variants:['info','key','warning'],
    render(block,{escapeHtml:e}){
      const c=block.content;
      return `<aside class="pb-block pb-notice pb-notice--${e(block.variant)}">
        ${c.label?`<span class="pb-notice__label">${text(e,c.label)}</span>`:''}
        <div><strong>${text(e,c.title)}</strong>${description(e,c.description)}${c.action?`<p class="pb-notice__action">${text(e,c.action)}</p>`:''}</div>
      </aside>`;
    }
  });

  registry.register({
    type:'comparison-cards',label:'Comparison Cards',category:'data',status:'candidate',editorialProfile:'comparison',variants:['generic','scored','market'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items),columns=arr(c.columns);
      return `<section class="pb-block pb-comparison pb-comparison--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-rail">${items.map((item,i)=>`<article class="pb-comparison-card">
          ${item.image?`<div class="pb-card-media">${image(e,item.image,item.imageAlt||item.title||'')}</div>`:''}
          <div class="pb-comparison-card__body">
            <div class="pb-comparison-card__top">${item.label?`<small>${text(e,item.label)}</small>`:''}${item.rank?`<span class="pb-rank">${text(e,item.rank)}</span>`:''}</div>
            <h4>${text(e,item.title)}</h4>
            ${item.description?`<p>${text(e,item.description)}</p>`:''}
            <dl>${columns.map(col=>`<div><dt>${text(e,col.label)}</dt><dd>${text(e,item.values?.[col.key]||'—')}</dd></div>`).join('')}</dl>
            ${tags(e,item.tags)}
          </div>
        </article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'checklist',label:'Checklist',category:'content',status:'candidate',editorialProfile:'checklist',variants:['numbered','checkable'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-checklist pb-checklist--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-check-grid">${items.map((item,i)=>`<div class="pb-check-item">${block.variant==='checkable'?`<span class="pb-check-mark" aria-hidden="true">✓</span>`:`<b>${String(i+1).padStart(2,'0')}</b>`}<span>${text(e,item.title||item)}</span>${item.note?`<small>${text(e,item.note)}</small>`:''}</div>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'media-rail',label:'Media Rail',category:'media',status:'candidate',editorialProfile:'media-rail',variants:['skill','video','mixed'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-media-rail pb-media-rail--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-rail">${items.map(item=>`<article class="pb-media-card">
          <div class="pb-card-media">${image(e,item.image,item.imageAlt||item.title||'')}</div>
          <div class="pb-media-card__body">${item.kicker?`<small>${text(e,item.kicker)}</small>`:''}<h4>${text(e,item.title)}</h4>${item.description?`<p>${text(e,item.description)}</p>`:''}${tags(e,item.tags)}${item.meta?`<div class="pb-meta">${text(e,item.meta)}</div>`:''}</div>
        </article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'case-study-rail',label:'Case Study Rail',category:'media',status:'candidate',editorialProfile:'case-study',variants:['project','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-case-studies pb-case-studies--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}
        ${description(e,c.description)}
        <div class="pb-rail">${items.map(item=>`<article class="pb-case-card">
          <div class="pb-card-media">${image(e,item.image,item.imageAlt||item.title||'')}</div>
          <div class="pb-case-card__body">${item.kind?`<span class="pb-case-kind">${text(e,item.kind)}</span>`:''}<h4>${text(e,item.title)}</h4><p>${text(e,item.description)}</p>${arr(item.deliverables).length?`<div class="pb-deliverables">${arr(item.deliverables).map((d,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${text(e,d)}</span></div>`).join('')}</div>`:''}</div>
        </article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'product-tool',label:'Product / Tool',category:'data',status:'candidate',editorialProfile:'product-tool',variants:['rail','list','detail'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      const cards=items.map(item=>`<article class="pb-product-card">
        ${item.image?`<div class="pb-product-card__media">${image(e,item.image,item.imageAlt||item.title||'')}</div>`:''}
        <div class="pb-product-card__body">${item.kind?`<small>${text(e,item.kind)}</small>`:''}<h4>${text(e,item.title)}</h4>${item.price?`<strong class="pb-price">${text(e,item.price)}</strong>`:''}<p>${text(e,item.description)}</p>${tags(e,item.tags)}${item.source?`<div class="pb-source-line">${text(e,item.source)}</div>`:''}</div>
      </article>`).join('');
      return `<section class="pb-block pb-products pb-products--${e(block.variant)}">${c.title?`<h3>${text(e,c.title)}</h3>`:''}${description(e,c.description)}<div class="${block.variant==='rail'?'pb-rail':'pb-product-list'}">${cards}</div></section>`;
    }
  });

  registry.register({
    type:'roadmap',label:'Roadmap',category:'data',status:'candidate',editorialProfile:'roadmap',variants:['phases','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-roadmap pb-roadmap--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}${description(e,c.description)}
        <div class="pb-roadmap__grid">${items.map((item,i)=>`<article class="pb-phase"><span class="pb-phase__index">${String(i+1).padStart(2,'0')}</span><small>${text(e,item.period)}</small><h4>${text(e,item.title)}</h4>${item.outcome?`<strong>${text(e,item.outcome)}</strong>`:''}<p>${text(e,item.action)}</p></article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'script-copy',label:'Script / Copy',category:'action',status:'candidate',editorialProfile:'script-copy',referenceProfiles:['editorial-daleseo-korean-skills','editorial-nomadamas-korean-humanizer'],variants:['messages','compact'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-scripts pb-scripts--${e(block.variant)}">
        ${c.title?`<h3>${text(e,c.title)}</h3>`:''}${description(e,c.description)}
        <div class="pb-script-list">${items.map((item,i)=>`<article class="pb-script-card" data-copy-text="${text(e,item.message)}"><div class="pb-script-card__head"><div><small>${text(e,item.channel)}</small><h4>${text(e,item.title)}</h4></div><button type="button" class="pb-copy-btn" data-copy-index="${i}">복사</button></div>${item.when?`<div class="pb-meta">${text(e,item.when)}</div>`:''}<div class="pb-message">${text(e,item.message)}</div></article>`).join('')}</div>
      </section>`;
    }
  });

  registry.register({
    type:'tutorial',label:'Tutorial',category:'content',status:'candidate',editorialProfile:'process',variants:['preview-rail','preset-rail','detail'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      if(block.variant==='detail'){
        return `<article class="pb-block pb-tutorial-detail">${eyebrow(e,c.eyebrow)}<h3>${text(e,c.title)}</h3>${description(e,c.description)}${c.image?`<div class="pb-tutorial-detail__media">${image(e,c.image,c.imageAlt||c.title||'')}</div>`:''}<div class="pb-tutorial-panels">${items.map(item=>`<section><small>${text(e,item.label)}</small><h4>${text(e,item.title)}</h4>${arr(item.steps).length?`<ol>${arr(item.steps).map(step=>`<li>${text(e,step)}</li>`).join('')}</ol>`:`<p>${text(e,item.description)}</p>`}</section>`).join('')}</div>${c.mission?`<div class="pb-mission"><strong>직접 해보기</strong><p>${text(e,c.mission)}</p></div>`:''}</article>`;
      }
      return `<section class="pb-block pb-tutorial-rail pb-tutorial-rail--${e(block.variant)}">${c.title?`<h3>${text(e,c.title)}</h3>`:''}${description(e,c.description)}<div class="pb-rail">${items.map((item,i)=>`<article class="pb-tutorial-card">${item.image?`<div class="pb-card-media">${image(e,item.image,item.imageAlt||item.title||'')}</div>`:''}<div class="pb-tutorial-card__body"><small>${text(e,item.label||String(i+1).padStart(2,'0'))}</small><h4>${text(e,item.title)}</h4>${item.value?`<strong>${text(e,item.value)}</strong>`:''}<p>${text(e,item.description)}</p></div></article>`).join('')}</div></section>`;
    }
  });

  registry.register({
    type:'resources',label:'Resources',category:'resource',status:'candidate',editorialProfile:'source-evidence',variants:['curated-rail','official-list'],
    render(block,{escapeHtml:e}){
      const c=block.content,items=arr(c.items);
      if(block.variant==='official-list'){
        return `<section class="pb-block pb-resources"><h3>${text(e,c.title)}</h3>${description(e,c.description)}<div class="pb-source-list">${items.map(item=>`<a class="pb-source-card" href="${text(e,item.url||'#')}" target="_blank" rel="noopener"><small>${text(e,item.publisher)}</small><strong>${text(e,item.title)}</strong>${item.supports?`<p>${text(e,item.supports)}</p>`:''}${item.checkedAt?`<span>확인 ${text(e,item.checkedAt)}</span>`:''}</a>`).join('')}</div></section>`;
      }
      return `<section class="pb-block pb-resources"><h3>${text(e,c.title)}</h3>${description(e,c.description)}<div class="pb-rail">${items.map(item=>`<article class="pb-resource-card">${item.image?`<div class="pb-card-media">${image(e,item.image,item.imageAlt||item.title||'')}</div>`:''}<div class="pb-resource-card__body"><small>${text(e,item.publisher)}</small><h4>${text(e,item.title)}</h4><p>${text(e,item.description)}</p>${tags(e,item.tags)}</div></article>`).join('')}</div></section>`;
    }
  });
})();
