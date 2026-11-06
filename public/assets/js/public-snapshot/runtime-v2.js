(function(){
  const registry=window.PlatformBlockRegistry;
  if(!registry)return;

  const scriptLoads=new Map();
  const styleLoads=new Map();
  const SAFE_RUNTIME_SCRIPTS=new Set([
    '/assets/js/ui/liquid-controller.js',
    '/assets/js/navigation/chapter-navigation.js',
    '/assets/js/desktop/rail-drag.js',
    '/assets/js/collection/bulk-selection.js',
    '/assets/js/collection/device-handoff-compat.js',
    '/assets/js/collection/device-handoff.js',
    '/assets/js/collection/modal-shield.js'
  ]);

  function escapeHtml(value=''){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }
  function assetPath(value){
    const path=String(value||'').trim().replace(/^public\//,'/');
    return path.startsWith('/')?path:`/${path}`;
  }
  function loadScript(src){
    const clean=assetPath(src);
    if(scriptLoads.has(clean))return scriptLoads.get(clean);
    const existing=[...document.scripts].find(node=>(node.getAttribute('src')||'').split('?')[0]===clean);
    if(existing){const ready=Promise.resolve(existing);scriptLoads.set(clean,ready);return ready;}
    const promise=new Promise((resolve,reject)=>{
      const node=document.createElement('script');
      node.src=clean;node.async=false;
      node.onload=()=>resolve(node);
      node.onerror=()=>reject(new Error(`모듈 스크립트를 불러오지 못했습니다: ${clean}`));
      document.body.appendChild(node);
    });
    scriptLoads.set(clean,promise);
    return promise;
  }
  function loadStyle(href){
    const clean=assetPath(href);
    if(styleLoads.has(clean))return styleLoads.get(clean);
    const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(node=>(node.getAttribute('href')||'').split('?')[0]===clean);
    if(existing){const ready=Promise.resolve(existing);styleLoads.set(clean,ready);return ready;}
    const promise=new Promise((resolve,reject)=>{
      const node=document.createElement('link');
      node.rel='stylesheet';node.href=clean;
      node.onload=()=>resolve(node);
      node.onerror=()=>reject(new Error(`모듈 스타일을 불러오지 못했습니다: ${clean}`));
      document.head.appendChild(node);
    });
    styleLoads.set(clean,promise);
    return promise;
  }
  async function ensureModuleRuntime(){
    await loadScript('/assets/js/platform-modules/module-registry-v1.js');
    await loadScript('/assets/js/platform-modules/photo-public-module-source-v1.js');
    await loadScript('/assets/js/platform-modules/photo-core-modules-v1.js');
    await loadScript('/assets/js/platform-modules/portable-primitives-v1.js');
    await loadScript('/assets/js/platform-modules/portable-primitives-extension-v2.js');
    await loadScript('/assets/js/platform-modules/portable-primitives-composition-v3.js');
    await loadScript('/assets/js/platform-modules/filter-chip-rail-edge-repair-v1.js');
    await loadScript('/assets/js/core/content-bookmark-store.js');
    await loadScript('/assets/js/platform-modules/learning-resource-rail-v1.js');
    await loadScript('/assets/js/platform-modules/content-detail-dialog-v1.js');
    await loadScript('/assets/js/platform-modules/reference-case-rail-v1.js');
    await loadScript('/assets/js/platform-modules/ebook-reader-model-v1.js');
    await loadScript('/assets/js/platform-modules/ebook-reader-v1.js');
    await loadScript('/assets/js/platform-modules/learning-guide-v1.js');
    await loadScript('/assets/js/platform-modules/subject-navigation-v1.js');
    await loadScript('/assets/js/platform-modules/module-style-runtime-v1.js');
    return window.PlatformModuleRegistry;
  }
  async function ensureDefinitionAssets(definition){
    const files=Array.isArray(definition?.ownerFiles)?definition.ownerFiles:[];
    await Promise.all(files.filter(file=>String(file).endsWith('.css')).map(loadStyle));
    for(const file of files.filter(file=>String(file).endsWith('.js'))){
      const src=assetPath(file);
      if(SAFE_RUNTIME_SCRIPTS.has(src))await loadScript(src);
    }
  }
  function moduleStyle(block){
    if(block?.styleOverrides&&typeof block.styleOverrides==='object'&&Object.keys(block.styleOverrides).length)return block.styleOverrides;
    if(block?.resolvedStyle&&typeof block.resolvedStyle==='object')return block.resolvedStyle;
    return {};
  }
  async function mountUiModules(root,blocks){
    const uiBlocks=blocks.filter(block=>block?.type==='ui-module'&&block.enabled!==false);
    if(!uiBlocks.length)return [];
    const modules=await ensureModuleRuntime();
    if(!modules)throw new Error('PlatformModuleRegistry를 불러오지 못했습니다.');
    const mounted=[];
    for(const block of uiBlocks){
      const moduleId=String(block.variant||'');
      const definition=modules.get(moduleId);
      const host=root.querySelector(`[data-public-ui-module-host="${CSS.escape(String(block.id))}"]`);
      if(!definition||!host||!modules.listFor('public').some(item=>item.id===moduleId)){
        if(host){host.dataset.platformPublicModuleError='unsupported';host.textContent='지원하지 않는 UI 모듈입니다.';}
        continue;
      }
      for(const id of modules.dependencyClosure(moduleId,'public'))await ensureDefinitionAssets(modules.get(id));
      try{
        const instance=modules.mount(host,moduleId,block.content&&typeof block.content==='object'?block.content:{},{consumer:'public'});
        window.PlatformModuleStyleRuntime?.apply?.(moduleId,host,moduleStyle(block));
        host.dataset.platformPublicModuleReady='true';
        host.dataset.platformPublicModule=moduleId;
        mounted.push({blockId:block.id,moduleId,instance});
        requestAnimationFrame(()=>window.dispatchEvent(new Event('pageshow')));
      }catch(error){
        host.dataset.platformPublicModuleError=String(error?.message||error);
        host.textContent='UI 모듈을 표시하지 못했습니다.';
      }
    }
    document.dispatchEvent(new CustomEvent('platform:public-modules-mounted',{detail:{mounted:mounted.map(item=>({blockId:item.blockId,moduleId:item.moduleId}))}}));
    return mounted;
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

  function render(payload,{root,statusNode,allowCandidate=false,trustedPublished=false,showStatus=false,canonicalBase=location.origin}={}){
    const snapshot=payload?.snapshot||{};
    const blocks=Array.isArray(payload?.blocks)?payload.blocks:[];
    const uiCapabilities=Array.isArray(payload?.uiCapabilities)?payload.uiCapabilities:[];
    if(!root)throw new Error('public snapshot root가 필요합니다.');

    const errors=[];
    const rendered=[];
    blocks.forEach((block,index)=>{
      if(block?.type==='ui-module'){
        const moduleId=escapeHtml(block.variant||'');
        rendered.push(`<div class="public-snapshot-block public-snapshot-block--ui-module" data-public-block="${escapeHtml(block.id)}" data-block-style-host="true" data-public-ui-module="${moduleId}"><div class="platform-public-module-host" data-public-ui-module-host="${escapeHtml(block.id)}"></div></div>`);
        return;
      }
      const productionCheck=!allowCandidate&&!trustedPublished;
      const validation=registry.validateUsage?.(block,{production:productionCheck});
      if(validation&&!validation.ok){errors.push(...validation.errors.map(message=>`#${index+1} ${message}`));return;}
      const html=registry.render(block,{publicSnapshot:true,snapshot,uiCapabilities});
      rendered.push(`<div class="public-snapshot-block" data-public-block="${escapeHtml(block.id)}" data-block-style-host="true">${html}</div>`);
    });

    if(errors.length){
      root.innerHTML=`<section class="public-snapshot-error"><strong>페이지를 표시하지 못했습니다.</strong><ul>${errors.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
      if(statusNode)statusNode.textContent='검사 실패';
      return {ok:false,errors};
    }

    const statusHtml=showStatus?`<div class="public-snapshot-status"><strong>Snapshot V2</strong><span>v${escapeHtml(snapshot.version||'—')} · ${escapeHtml(snapshot.publishedAt||'미발행')}</span></div>`:'';
    root.innerHTML=`${statusHtml}<main class="public-snapshot-flow">${rendered.join('')}</main>`;
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
    if(trustedPublished)document.documentElement.dataset.publicSnapshotTrust='publish-gated';
    else delete document.documentElement.dataset.publicSnapshotTrust;
    if(statusNode)statusNode.textContent=`v${snapshot.version||'—'} · ${blocks.length} blocks`;
    const modulePromise=mountUiModules(root,blocks).catch(error=>{console.error('Public UI module mount failed',error);return [];});
    window.__PUBLIC_SNAPSHOT_MODULES_READY=modulePromise;
    document.dispatchEvent(new CustomEvent('platform:public-snapshot-rendered',{detail:{snapshot,blocks,uiCapabilities,trustedPublished}}));
    return {ok:true,errors:[],snapshot,blocks,uiCapabilities,trustedPublished,modulePromise};
  }

  async function fetchAndRender(slug,options={}){
    const value=String(slug||'').trim();
    if(!value)throw new Error('slug가 필요합니다.');
    const response=await fetch(`/api/public/snapshot-v2?slug=${encodeURIComponent(value)}`,{credentials:'same-origin'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`공개 snapshot을 불러오지 못했습니다. (${response.status})`);
    return render(data,{...options,trustedPublished:true});
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

  window.PublicSnapshotRuntimeV2={render,fetchAndRender,applyMetadata,mountUiModules};
})();
