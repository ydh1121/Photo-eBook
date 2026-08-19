(function(){
  const registry=window.PlatformBlockRegistry;
  if(!registry)return;
  const arr=value=>Array.isArray(value)?value:[];
  const e=value=>registry.escapeHtml(value??'');
  const desc=value=>value?`<p class="pb-description">${e(value)}</p>`:'';
  const tags=values=>arr(values).length?`<div class="pb-tags">${arr(values).map(item=>`<span>${e(item)}</span>`).join('')}</div>`:'';

  registry.register({
    type:'faq',label:'FAQ / Accordion',category:'content',status:'candidate',editorialProfile:'faq',referenceProfiles:['design-emilkowalski-skills'],variants:['accordion','open-first'],
    render(block){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-faq pb-faq--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<div class="pb-faq__list">${items.map((item,i)=>`<details class="pb-faq__item" ${block.variant==='open-first'&&i===0?'open':''}><summary>${e(item.question)}</summary><div class="pb-faq__answer"><p>${e(item.answer)}</p>${item.source?`<small>${e(item.source)}</small>`:''}</div></details>`).join('')}</div></section>`;
    }
  });

  registry.register({
    type:'pros-cons',label:'Pros / Cons',category:'data',status:'candidate',editorialProfile:'pros-cons',variants:['split','stacked'],
    render(block){
      const c=block.content;
      const column=(kind,label,items)=>`<section class="pb-procon pb-procon--${kind}"><header><span>${e(label)}</span></header><ul>${arr(items).map(item=>`<li><strong>${e(item.title||item)}</strong>${item.description?`<p>${e(item.description)}</p>`:''}</li>`).join('')}</ul></section>`;
      return `<section class="pb-block pb-pros-cons pb-pros-cons--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<div class="pb-pros-cons__grid">${column('pro',c.proLabel||'장점',c.pros)}${column('con',c.conLabel||'주의할 점',c.cons)}</div></section>`;
    }
  });

  registry.register({
    type:'comparison-table',label:'Comparison Table',category:'data',status:'candidate',editorialProfile:'comparison',variants:['default','compact'],
    render(block){
      const c=block.content,columns=arr(c.columns),rows=arr(c.rows);
      return `<section class="pb-block pb-comparison-table pb-comparison-table--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<div class="pb-table-scroll" tabindex="0" aria-label="${e(c.ariaLabel||c.title||'비교표')}"><table><thead><tr>${columns.map(col=>`<th scope="col">${e(col.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map((col,i)=>i===0?`<th scope="row">${e(row[col.key]??'—')}</th>`:`<td>${e(row[col.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${c.note?`<p class="pb-table-note">${e(c.note)}</p>`:''}</section>`;
    }
  });

  registry.register({
    type:'timeline',label:'Timeline',category:'content',status:'candidate',editorialProfile:'timeline',variants:['vertical','compact'],
    render(block){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-timeline pb-timeline--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<ol class="pb-timeline__list">${items.map(item=>`<li><div class="pb-timeline__marker" aria-hidden="true"></div><div class="pb-timeline__copy"><time>${e(item.time)}</time><h4>${e(item.title)}</h4>${item.description?`<p>${e(item.description)}</p>`:''}${tags(item.tags)}</div></li>`).join('')}</ol></section>`;
    }
  });

  registry.register({
    type:'image-copy-split',label:'Image + Copy',category:'media',status:'candidate',editorialProfile:'rich-text',referenceProfiles:['component-voltagent-apple-design-md'],variants:['image-left','image-right','editorial'],
    render(block){
      const c=block.content;
      return `<section class="pb-block pb-image-copy pb-image-copy--${e(block.variant)}"><div class="pb-image-copy__media">${c.image?`<img src="${e(c.image)}" alt="${e(c.imageAlt||'')}" loading="lazy">`:''}</div><div class="pb-image-copy__body">${c.eyebrow?`<div class="pb-eyebrow">${e(c.eyebrow)}</div>`:''}<h3>${e(c.title)}</h3>${desc(c.description)}${arr(c.points).length?`<ul>${arr(c.points).map(point=>`<li>${e(point)}</li>`).join('')}</ul>`:''}${c.actionLabel?`<a class="pb-inline-action" href="${e(c.actionUrl||'#')}">${e(c.actionLabel)}</a>`:''}</div></section>`;
    }
  });

  registry.register({
    type:'gallery',label:'Gallery',category:'media',status:'candidate',editorialProfile:'media-rail',variants:['grid','strip'],
    render(block){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-gallery pb-gallery--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<div class="pb-gallery__items">${items.map(item=>`<figure><div class="pb-gallery__media"><img src="${e(item.image)}" alt="${e(item.imageAlt||item.caption||'')}" loading="lazy"></div>${item.caption?`<figcaption>${e(item.caption)}</figcaption>`:''}</figure>`).join('')}</div></section>`;
    }
  });

  registry.register({
    type:'quote-expert',label:'Quote / Expert',category:'content',status:'candidate',editorialProfile:'quote-expert',variants:['quote','comment'],
    render(block){
      const c=block.content;
      return `<figure class="pb-block pb-quote pb-quote--${e(block.variant)}"><blockquote>${e(c.quote)}</blockquote><figcaption><div>${c.avatar?`<img src="${e(c.avatar)}" alt="" loading="lazy">`:''}<span><strong>${e(c.name)}</strong>${c.role?`<small>${e(c.role)}</small>`:''}</span></div>${c.source?`<cite>${e(c.source)}</cite>`:''}</figcaption></figure>`;
    }
  });

  registry.register({
    type:'calculator',label:'Calculator / Simulation',category:'action',status:'candidate',editorialProfile:'calculator',variants:['multiply','sum'],
    render(block){
      const c=block.content,inputs=arr(c.inputs);
      return `<section class="pb-block pb-calculator" data-calc-kind="${e(block.variant)}"><div class="pb-calculator__intro">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}</div><div class="pb-calculator__body"><div class="pb-calculator__inputs">${inputs.map(input=>`<label><span>${e(input.label)}</span><span class="pb-number-field"><input type="number" inputmode="decimal" data-calc-input="${e(input.id)}" value="${e(input.value)}" min="${e(input.min??0)}" step="${e(input.step??1)}"><em>${e(input.unit||'')}</em></span>${input.note?`<small>${e(input.note)}</small>`:''}</label>`).join('')}</div><output class="pb-calculator__output"><span>${e(c.outputLabel||'계산 결과')}</span><strong data-calc-output data-prefix="${e(c.outputPrefix||'')}" data-suffix="${e(c.outputSuffix||'')}">—</strong>${c.outputNote?`<small>${e(c.outputNote)}</small>`:''}</output></div></section>`;
    }
  });

  registry.register({
    type:'cta',label:'CTA',category:'action',status:'candidate',editorialProfile:'cta',referenceProfiles:['component-voltagent-apple-design-md'],variants:['band','minimal'],
    render(block){
      const c=block.content;
      return `<section class="pb-block pb-cta pb-cta--${e(block.variant)}"><div><h3>${e(c.title)}</h3>${desc(c.description)}</div><div class="pb-cta__actions">${c.primaryLabel?`<a class="pb-cta__primary" href="${e(c.primaryUrl||'#')}">${e(c.primaryLabel)}</a>`:''}${c.secondaryLabel?`<a class="pb-cta__secondary" href="${e(c.secondaryUrl||'#')}">${e(c.secondaryLabel)}</a>`:''}</div></section>`;
    }
  });

  registry.register({
    type:'service-list',label:'Service / Business List',category:'resource',status:'candidate',editorialProfile:'comparison',variants:['rows','compact'],
    render(block){
      const c=block.content,items=arr(c.items);
      return `<section class="pb-block pb-service-list pb-service-list--${e(block.variant)}">${c.title?`<h3>${e(c.title)}</h3>`:''}${desc(c.description)}<div class="pb-service-list__rows">${items.map(item=>`<article><div class="pb-service-list__main"><small>${e(item.category)}</small><h4>${e(item.title)}</h4>${item.description?`<p>${e(item.description)}</p>`:''}${tags(item.tags)}</div><div class="pb-service-list__meta">${item.meta?`<strong>${e(item.meta)}</strong>`:''}${item.note?`<span>${e(item.note)}</span>`:''}${item.actionLabel?`<a href="${e(item.actionUrl||'#')}">${e(item.actionLabel)}</a>`:''}</div></article>`).join('')}</div></section>`;
    }
  });
})();
