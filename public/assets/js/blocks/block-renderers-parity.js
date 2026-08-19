(function(){
  const registry=window.PlatformBlockRegistry;
  if(!registry)return;

  const arr=value=>Array.isArray(value)?value:[];
  const e=value=>registry.escapeHtml(value??'');
  const desc=value=>value?`<p class="pb-description">${e(value)}</p>`:'';
  const tags=values=>arr(values).length?`<div class="pb-tags">${arr(values).map(item=>`<span>${e(item)}</span>`).join('')}</div>`:'';
  const image=(src,alt='',className='')=>src?`<img class="${e(className)}" src="${e(src)}" alt="${e(alt)}" loading="lazy">`:'';

  function extend(type,newVariants,advancedRender){
    const base=registry.get(type);
    if(!base)return;
    const variants=[...new Set([...(base.variants||[]),...newVariants])];
    registry.register({...base,variants,render(block,context){return newVariants.includes(block.variant)?advancedRender(block,context):base.render(block,context);}});
  }

  extend('hero',['immersive-metrics'],block=>{
    const c=block.content||{};
    const facts=arr(c.facts);
    return `<header class="pb-block pb-hero pb-hero--immersive-metrics">
      ${image(c.image,c.imageAlt||'','pb-hero__image')}
      <div class="pb-hero__overlay"></div>
      <div class="pb-hero__content">
        ${c.eyebrow?`<div class="pb-eyebrow">${e(c.eyebrow)}</div>`:''}
        <h1>${e(c.title)}</h1>
        ${desc(c.description)}
        ${facts.length?`<div class="pb-hero__facts">${facts.map(f=>`<div class="pb-hero__fact"><span>${e(f.label)}</span><strong>${e(f.value)}</strong>${f.note?`<small>${e(f.note)}</small>`:''}</div>`).join('')}</div>`:''}
      </div>
    </header>`;
  });

  extend('chapter-hero',['image-overlay'],block=>{
    const c=block.content||{};
    return `<section class="pb-block pb-chapter-hero pb-chapter-hero--image-overlay">
      <div class="pb-chapter-overlay__media">${image(c.image,c.imageAlt||c.title||'')}</div>
      <div class="pb-chapter-overlay__shade"></div>
      <div class="pb-chapter-overlay__copy">
        ${c.index?`<div class="pb-index">${e(c.index)}</div>`:''}
        ${c.eyebrow?`<div class="pb-eyebrow">${e(c.eyebrow)}</div>`:''}
        <h2>${e(c.title)}</h2>
        ${desc(c.description)}
      </div>
    </section>`;
  });

  extend('comparison-cards',['visual-metrics'],block=>{
    const c=block.content||{};
    const items=arr(c.items);
    const columns=arr(c.columns).slice(0,3);
    return `<section class="pb-block pb-comparison pb-comparison--visual-metrics">
      ${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}
      <div class="pb-rail">${items.map(item=>`<article class="pb-comparison-card pb-comparison-card--visual-metrics">
        ${item.image?`<div class="pb-card-media">${image(item.image,item.imageAlt||item.title||'')}</div>`:''}
        <div class="pb-comparison-card__body">
          <div class="pb-comparison-card__top">${item.label?`<small>${e(item.label)}</small>`:''}${item.rank?`<span class="pb-rank">${e(item.rank)}</span>`:''}</div>
          <h4>${e(item.title)}</h4>
          ${item.description?`<p>${e(item.description)}</p>`:''}
          ${columns.length?`<div class="pb-visual-metrics">${columns.map(col=>`<div><span>${e(col.label)}</span><strong>${e(item.values?.[col.key]??'—')}</strong></div>`).join('')}</div>`:''}
          ${item.meta?`<div class="pb-visual-metrics__meta">${e(item.meta)}</div>`:''}
          ${tags(item.tags)}
        </div>
      </article>`).join('')}</div>
    </section>`;
  });

  extend('roadmap',['metric-cards'],block=>{
    const c=block.content||{};
    const items=arr(c.items);
    return `<section class="pb-block pb-roadmap pb-roadmap--metric-cards">
      ${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}
      <div class="pb-rail">${items.map((item,i)=>{
        const metrics=arr(item.metrics).slice(0,2);
        return `<article class="pb-roadmap-metric-card"><small>${e(item.period||`단계 ${i+1}`)}</small><h4>${e(item.title)}</h4>${item.outcome?`<strong class="pb-roadmap-metric-card__primary">${e(item.outcome)}</strong>`:''}${metrics.length?`<div class="pb-roadmap-metric-card__metrics">${metrics.map(metric=>`<div><span>${e(metric.label)}</span><b>${e(metric.value)}</b></div>`).join('')}</div>`:''}${item.action?`<p>${e(item.action)}</p>`:''}</article>`;
      }).join('')}</div>
    </section>`;
  });
})();
