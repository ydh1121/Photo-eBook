(function(){
  const registry=window.PlatformBlockRegistry;
  if(!registry)return;

  function escapeHtml(value=''){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function applyMetadata(snapshot,{canonicalBase=location.origin}={}){
    const seo=snapshot?.seo&&typeof snapshot.seo==='object'?snapshot.seo:{};
    const title=String(seo.title||snapshot?.title||'').trim();
    const description=String(seo.description||'').trim();
    const slug=String(snapshot?.slug||'').replace(/^\/+|\/+$/g,'');
    const canonical=slug?`${canonicalBase.replace(/\/$/,'')}/${encodeURIComponent(slug)}/`:canonicalBase;
    if(title)document.title=title;
    setMeta('description',description);
    setMeta('robots',String(seo.indexPolicy||seo.index_policy||'index')==='noindex'?'noindex,nofollow':'index,follow');
    setProperty('og:title',title);
    setProperty('og:description',description);
    setProperty('og:type','article');
    setProperty('og:url',canonical);
    if(seo.ogImage||seo.og_image)setProperty('og:image',String(seo.ogImage||seo.og_image));
    setMeta('twitter:card',(seo.ogImage||seo.og_image)?'summary_large_image':'summary');
    setMeta('twitter:title',title);
    setMeta('twitter:description',description);
    setCanonical(canonical);
    setJsonLd(snapshot,canonical,description);
  }

  function render(payload,{root,statusNode,allowCandidate=false,canonicalBase=location.origin}={}){
    const snapshot=payload?.snapshot||{};
    const blocks=Array.isArray(payload?.blocks)?payload.blocks:[];
    const uiCapabilities=Array.isArray(payload?.uiCapabilities)?payload.uiCapabilities:[];
    if(!root)throw new Error('public snapshot root가 필요합니다.');

    const errors=[];
    const rendered=[];
    blocks.forEach((block,index)=>{
      const validation=registry.validateUsage?.(block,{production:!allowCandidate});
      if(validation&&!validation.ok){errors.push(...validation.errors.map(message=>`#${index+1} ${message}`));return;}
      const html=registry.render(block,{publicSnapshot:true,snapshot,uiCapabilities});
      rendered.push(`<div class="public-snapshot-block" data-public-block="${escapeHtml(block.id)}" data-block-style-host="true">${html}</div>`);
    });

    if(errors.length){
      root.innerHTML=`<section class="public-snapshot-error"><strong>공개 renderer 검사를 통과하지 못했습니다.</strong><ul>${errors.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
      if(statusNode)statusNode.textContent='검사 실패';
      return {ok:false,errors};
    }

    root.innerHTML=`<div class="public-snapshot-status"><strong>Snapshot V2</strong><span>v${escapeHtml(snapshot.version||'—')} · ${escapeHtml(snapshot.publishedAt||'미발행')}</span></div><main class="public-snapshot-flow">${rendered.join('')}</main>`;
    const styleRuntime=window.PlatformBlockStyles;
    if(styleRuntime){
      blocks.forEach(block=>{
        const host=root.querySelector(`[data-public-block="${CSS.escape(String(block.id))}"]`);
        if(host)styleRuntime.apply(host,{...block,resolvedStyle:block.resolvedStyle||{}});
      });
    }
    window.PlatformUiCapabilityRuntime?.apply?.(root,uiCapabilities,{snapshot});
    applyMetadata(snapshot,{canonicalBase});
    window.__PUBLIC_SNAPSHOT_UI_CAPABILITIES=uiCapabilities;
    document.documentElement.dataset.publicSnapshotV2='true';
    if(statusNode)statusNode.textContent=`v${snapshot.version||'—'} · ${blocks.length} blocks`;
    document.dispatchEvent(new CustomEvent('platform:public-snapshot-rendered',{detail:{snapshot,blocks,uiCapabilities}}));
    return {ok:true,errors:[],snapshot,blocks,uiCapabilities};
  }

  async function fetchAndRender(slug,options={}){
    const value=String(slug||'').trim();
    if(!value)throw new Error('slug가 필요합니다.');
    const response=await fetch(`/api/public/snapshot-v2?slug=${encodeURIComponent(value)}`,{credentials:'same-origin'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`공개 snapshot을 불러오지 못했습니다. (${response.status})`);
    return render(data,options);
  }

  function setMeta(name,content){
    if(!content)return;
    let node=document.head.querySelector(`meta[name="${CSS.escape(name)}"]`);
    if(!node){node=document.createElement('meta');node.name=name;document.head.appendChild(node);}
    node.content=content;
  }
  function setProperty(property,content){
    if(!content)return;
    let node=document.head.querySelector(`meta[property="${CSS.escape(property)}"]`);
    if(!node){node=document.createElement('meta');node.setAttribute('property',property);document.head.appendChild(node);}
    node.content=content;
  }
  function setCanonical(href){
    let node=document.head.querySelector('link[rel="canonical"]');
    if(!node){node=document.createElement('link');node.rel='canonical';document.head.appendChild(node);}
    node.href=href;
  }
  function setJsonLd(snapshot,canonical,description){
    document.head.querySelector('#publicSnapshotJsonLd')?.remove();
    const seo=snapshot?.seo&&typeof snapshot.seo==='object'?snapshot.seo:{};
    const node=document.createElement('script');node.type='application/ld+json';node.id='publicSnapshotJsonLd';
    node.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@type':seo.schemaType||seo.schema_type||'Article',
      headline:String(seo.title||snapshot?.title||''),
      description,
      url:canonical,
      datePublished:snapshot?.publishedAt||undefined,
      dateModified:snapshot?.sourceUpdatedAt||snapshot?.publishedAt||undefined,
      author:seo.authorName?{'@type':'Person',name:seo.authorName}:undefined,
      image:seo.ogImage||seo.og_image||undefined
    });
    document.head.appendChild(node);
  }

  window.PublicSnapshotRuntimeV2={render,fetchAndRender,applyMetadata};
})();
