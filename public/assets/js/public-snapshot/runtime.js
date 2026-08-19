(function(){
  if(window.PlatformPublicSnapshot)return;

  const registry=window.PlatformBlockRegistry;

  function ensureMeta(selector,attributes){
    let node=document.head.querySelector(selector);
    if(!node){node=document.createElement('meta');document.head.appendChild(node);}
    for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
    return node;
  }

  function ensureLink(rel,href){
    let node=document.head.querySelector(`link[rel="${rel}"]`);
    if(!node){node=document.createElement('link');node.rel=rel;document.head.appendChild(node);}
    node.href=href;
    return node;
  }

  function removeLink(rel){document.head.querySelector(`link[rel="${rel}"]`)?.remove();}

  function setJsonLd(snapshot,canonicalUrl){
    document.querySelector('#platformPublicJsonLd')?.remove();
    const seo=snapshot?.seo||{};
    const type=seo.schemaType==='WebPage'?'WebPage':'Article';
    const data={
      '@context':'https://schema.org',
      '@type':type,
      headline:String(seo.title||snapshot?.title||''),
      name:String(snapshot?.title||seo.title||''),
      description:String(seo.description||''),
      inLanguage:'ko-KR'
    };
    if(canonicalUrl){data.url=canonicalUrl;data.mainEntityOfPage=canonicalUrl;}
    if(seo.ogImage)data.image=[String(seo.ogImage)];
    if(seo.authorName)data.author={'@type':'Person',name:String(seo.authorName)};
    if(seo.reviewedAt)data.dateModified=String(seo.reviewedAt);
    if(seo.siteName)data.isPartOf={'@type':'WebSite',name:String(seo.siteName),...(canonicalUrl?{url:new URL('/',canonicalUrl).href}:{})};
    const script=document.createElement('script');
    script.id='platformPublicJsonLd';
    script.type='application/ld+json';
    script.textContent=JSON.stringify(data).replace(/</g,'\\u003c');
    document.head.appendChild(script);
  }

  function applyMetadata(snapshot,{canonicalUrl='',indexable=false}={}){
    const seo=snapshot?.seo||{};
    const title=String(seo.title||snapshot?.title||'먹고살기').trim();
    const description=String(seo.description||'').trim();
    const siteName=String(seo.siteName||'먹고살기').trim();
    const allowIndex=indexable&&seo.indexPolicy!=='noindex';

    document.title=title;
    ensureMeta('meta[name="robots"]',{name:'robots',content:allowIndex?'index,follow':'noindex,nofollow,noarchive'});
    if(description)ensureMeta('meta[name="description"]',{name:'description',content:description});
    ensureMeta('meta[property="og:title"]',{property:'og:title',content:title});
    if(description)ensureMeta('meta[property="og:description"]',{property:'og:description',content:description});
    ensureMeta('meta[property="og:type"]',{property:'og:type',content:seo.schemaType==='Article'?'article':'website'});
    ensureMeta('meta[property="og:site_name"]',{property:'og:site_name',content:siteName});
    ensureMeta('meta[name="twitter:card"]',{name:'twitter:card',content:seo.ogImage?'summary_large_image':'summary'});
    ensureMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    if(description)ensureMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    if(seo.ogImage){
      ensureMeta('meta[property="og:image"]',{property:'og:image',content:String(seo.ogImage)});
      ensureMeta('meta[name="twitter:image"]',{name:'twitter:image',content:String(seo.ogImage)});
    }
    if(canonicalUrl){
      ensureLink('canonical',canonicalUrl);
      ensureMeta('meta[property="og:url"]',{property:'og:url',content:canonicalUrl});
    }else removeLink('canonical');
    setJsonLd(snapshot,canonicalUrl);
  }

  function normalizeSnapshot(input={}){
    const blocks=Array.isArray(input.blocks)?input.blocks:[];
    return {
      snapshotId:String(input.snapshotId||''),
      pageId:String(input.pageId||input.page?.pageId||''),
      version:Number(input.version||0),
      slug:String(input.slug||input.page?.slug||''),
      industryId:String(input.industryId||input.page?.industryId||'general'),
      title:String(input.title||input.page?.title||''),
      theme:['light','dark'].includes(input.theme||input.page?.theme)?(input.theme||input.page?.theme):'light',
      seo:input.seo||input.page?.seo||{},
      publishedAt:input.publishedAt||null,
      blocks:blocks.filter(block=>block&&block.enabled!==false)
    };
  }

  function validate(snapshot,{allowCandidate=false}={}){
    const errors=[];
    if(!registry)errors.push('Block Registry를 불러오지 못했습니다.');
    if(!snapshot.pageId)errors.push('pageId가 없습니다.');
    if(!snapshot.title)errors.push('페이지 제목이 없습니다.');
    if(!snapshot.blocks.length)errors.push('표시할 블록이 없습니다.');
    for(const block of snapshot.blocks){
      const definition=registry?.get(block.type);
      if(!definition){errors.push(`등록되지 않은 block type: ${block.type}`);continue;}
      const manifestItem=(window.__PLATFORM_BLOCK_REGISTRY_MANIFEST?.blocks||[]).find(item=>item.type===block.type);
      const status=manifestItem?.status||definition.status||'candidate';
      if(!allowCandidate&&status!=='approved')errors.push(`승인되지 않은 block type: ${block.type}`);
    }
    return {ok:errors.length===0,errors};
  }

  function render(input,{root,canonicalUrl='',indexable=false,allowCandidate=false,showStatus=false}={}){
    if(!root)throw new Error('렌더링 대상이 필요합니다.');
    const snapshot=normalizeSnapshot(input);
    const validation=validate(snapshot,{allowCandidate});
    root.dataset.theme=snapshot.theme;
    root.dataset.industry=snapshot.industryId;
    root.dataset.pageId=snapshot.pageId;
    if(!validation.ok){
      root.innerHTML=`<div class="public-snapshot-error"><strong>페이지를 표시할 수 없습니다.</strong><ul>${validation.errors.map(message=>`<li>${registry?.escapeHtml?.(message)||String(message)}</li>`).join('')}</ul></div>`;
      return {snapshot,validation};
    }

    applyMetadata(snapshot,{canonicalUrl,indexable});
    const rendered=snapshot.blocks.map(block=>registry.render(block,{publicSnapshot:true})).join('');
    root.innerHTML=`${showStatus?`<aside class="public-snapshot-status" role="note"><strong>공개 renderer 검토</strong><span>${snapshot.blocks.length}개 block · ${snapshot.industryId}</span></aside>`:''}<main class="public-snapshot-flow">${rendered}</main>`;
    return {snapshot,validation};
  }

  window.PlatformPublicSnapshot={render,validate,normalizeSnapshot,applyMetadata};
})();
