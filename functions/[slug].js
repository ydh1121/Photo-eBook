import {cleanPublicSlugV2,loadActiveSnapshotV2} from './lib/public-snapshot-v2.js';

export async function onRequest(context){
  const {request,params}=context;
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:securityHeaders({'Allow':'GET, HEAD'})});

  const rawSlug=String(params?.slug||'');
  if(!rawSlug)return context.next();
  if(rawSlug.includes('.'))return context.next();

  const slug=cleanPublicSlugV2(rawSlug);
  if(!slug||slug!==rawSlug.toLowerCase())return notFoundResponse(request);

  try{
    const payload=await loadActiveSnapshotV2(context.env,slug);
    if(!payload)return notFoundResponse(request);

    const url=new URL(request.url);
    if(!url.pathname.endsWith('/')){
      url.pathname=`/${encodeURIComponent(slug)}/`;
      return new Response(null,{status:308,headers:securityHeaders({Location:url.href,'Cache-Control':'public, max-age=300'})});
    }

    const canonical=new URL(`/${encodeURIComponent(slug)}/`,request.url).href;
    const html=renderPublicPage(payload,canonical);
    const seo=payload.snapshot?.seo||{};
    const indexable=String(seo.indexPolicy||seo.index_policy||'index')!=='noindex';
    const headers=securityHeaders({
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':'public, max-age=60, stale-while-revalidate=300',
      'X-Robots-Tag':indexable?'index, follow':'noindex, nofollow, noarchive',
      'Vary':'Accept-Encoding'
    });
    return new Response(request.method==='HEAD'?null:html,{status:200,headers});
  }catch(error){
    console.error('Canonical public route failed',error);
    const html=renderErrorPage('페이지를 표시하지 못했습니다.','잠시 후 다시 시도해 주세요.');
    return new Response(request.method==='HEAD'?null:html,{status:500,headers:securityHeaders({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'})});
  }
}

function renderPublicPage(payload,canonical){
  const snapshot=payload.snapshot||{};
  const seo=snapshot.seo&&typeof snapshot.seo==='object'?snapshot.seo:{};
  const title=String(seo.title||snapshot.title||'먹고살기').trim();
  const description=String(seo.description||'').trim();
  const siteName=String(seo.siteName||'먹고살기').trim();
  const indexable=String(seo.indexPolicy||seo.index_policy||'index')!=='noindex';
  const schemaType=String(seo.schemaType||seo.schema_type||'Article')==='WebPage'?'WebPage':'Article';
  const ogImage=String(seo.ogImage||seo.og_image||'').trim();
  const theme=String(snapshot.theme||'light')==='dark'?'dark':'light';
  const jsonLd={
    '@context':'https://schema.org',
    '@type':schemaType,
    headline:title,
    name:String(snapshot.title||title),
    description,
    url:canonical,
    inLanguage:'ko-KR',
    datePublished:snapshot.publishedAt||undefined,
    dateModified:snapshot.sourceUpdatedAt||snapshot.publishedAt||undefined,
    image:ogImage||undefined,
    author:seo.authorName?{'@type':'Person',name:String(seo.authorName)}:undefined,
    isPartOf:siteName?{'@type':'WebSite',name:siteName,url:new URL('/',canonical).href}:undefined
  };
  const payloadJson=escapeJsonForHtml(payload);
  const jsonLdText=escapeJsonForHtml(jsonLd);
  const staticFallback=renderStaticSnapshot(payload);

  return `<!doctype html>
<html lang="ko" data-public-snapshot-route="true">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="${indexable?'index,follow':'noindex,nofollow,noarchive'}">
  <title>${escapeHtml(title)}</title>
  ${description?`<meta name="description" content="${escapeHtml(description)}">`:''}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  ${description?`<meta property="og:description" content="${escapeHtml(description)}">`:''}
  <meta property="og:type" content="${schemaType==='Article'?'article':'website'}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  ${ogImage?`<meta property="og:image" content="${escapeHtml(ogImage)}">`:''}
  <meta name="twitter:card" content="${ogImage?'summary_large_image':'summary'}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  ${description?`<meta name="twitter:description" content="${escapeHtml(description)}">`:''}
  ${ogImage?`<meta name="twitter:image" content="${escapeHtml(ogImage)}">`:''}
  <script id="publicSnapshotJsonLd" type="application/ld+json">${jsonLdText}</script>
  <link rel="stylesheet" href="/assets/styles/block-lab/lab.css?v=1">
  <link rel="stylesheet" href="/assets/styles/block-lab/a11y.css?v=1">
  <link rel="stylesheet" href="/assets/styles/block-lab/refinement-v2.css?v=1">
  <link rel="stylesheet" href="/assets/styles/block-lab/new-blocks-v2.css?v=1">
  <link rel="stylesheet" href="/assets/styles/block-lab/photography-parity-v1.css?v=1">
  <link rel="stylesheet" href="/assets/styles/block-lab/responsive-fixes-v1.css?v=1">
  <link rel="stylesheet" href="/assets/styles/blocks/style-runtime.css?v=1">
  <link rel="stylesheet" href="/assets/styles/ui-capabilities/runtime.css?v=1">
  <link rel="stylesheet" href="/assets/styles/public-snapshot/runtime.css?v=3">
</head>
<body>
  <div class="public-snapshot-shell" data-theme="${theme}">
    <div id="publicSnapshotRoot">${staticFallback}</div>
  </div>
  <script src="/assets/js/blocks/block-registry.js?v=2"></script>
  <script src="/data/block-registry/v1/manifest.js?v=2"></script>
  <script src="/assets/js/blocks/block-renderers.js?v=1"></script>
  <script src="/assets/js/blocks/block-renderers-extended.js?v=1"></script>
  <script src="/assets/js/blocks/block-renderers-parity.js?v=1"></script>
  <script src="/assets/js/blocks/block-style-runtime.js?v=1"></script>
  <script src="/assets/js/ui-capabilities/runtime.js?v=1"></script>
  <script src="/assets/js/public-snapshot/interactions.js?v=1"></script>
  <script src="/assets/js/public-snapshot/runtime-v2.js?v=2"></script>
  <script id="publicSnapshotPayload" type="application/json">${payloadJson}</script>
  <script>
    (function(){
      var root=document.getElementById('publicSnapshotRoot');
      try{
        var payload=JSON.parse(document.getElementById('publicSnapshotPayload').textContent||'{}');
        var runtime=window.PublicSnapshotRuntimeV2;
        if(!runtime)throw new Error('public runtime unavailable');
        var result=runtime.render(payload,{root:root,trustedPublished:true,showStatus:false,canonicalBase:location.origin});
        if(!result.ok)throw new Error('public render validation failed');
      }catch(error){
        console.error(error);
      }
    })();
  </script>
</body>
</html>`;
}

function renderStaticSnapshot(payload){
  const snapshot=payload?.snapshot||{};
  const blocks=Array.isArray(payload?.blocks)?payload.blocks.filter(block=>block&&block.enabled!==false):[];
  const hasHero=blocks.some(block=>block.type==='hero');
  const pageTitle=!hasHero&&snapshot.title?`<header class="public-static-page-head"><h1>${escapeHtml(snapshot.title)}</h1></header>`:'';
  return `<main class="public-static-flow" data-static-snapshot="true">${pageTitle}${blocks.map(renderStaticBlock).join('')}</main>`;
}

function renderStaticBlock(block){
  const content=block?.content&&typeof block.content==='object'?block.content:{};
  const eyebrow=firstText(content.eyebrow,content.label,content.index);
  const title=firstText(content.title,content.name,content.quote);
  const description=firstText(content.description,content.note);
  const headingTag=block.type==='hero'?'h1':'h2';
  const items=Array.isArray(content.items)?content.items:[];
  const paragraphs=Array.isArray(content.paragraphs)?content.paragraphs:[];
  const facts=Array.isArray(content.facts)?content.facts:[];
  const pros=Array.isArray(content.pros)?content.pros:[];
  const cons=Array.isArray(content.cons)?content.cons:[];
  const type=escapeHtml(block?.type||'content');

  let body='';
  if(paragraphs.length)body+=`<div class="public-static-prose">${paragraphs.map(value=>`<p>${escapeHtml(textValue(value))}</p>`).join('')}</div>`;
  if(facts.length)body+=`<dl class="public-static-facts">${facts.map(item=>`<div><dt>${escapeHtml(firstText(item?.label,'정보'))}</dt><dd><strong>${escapeHtml(firstText(item?.value,''))}</strong>${item?.note?`<span>${escapeHtml(textValue(item.note))}</span>`:''}</dd></div>`).join('')}</dl>`;
  if(items.length)body+=renderStaticItems(items,block.type);
  if(pros.length||cons.length)body+=`<div class="public-static-split">${pros.length?`<section><h3>${escapeHtml(firstText(content.proLabel,'장점'))}</h3><ul>${pros.map(item=>`<li>${escapeHtml(textValue(item))}</li>`).join('')}</ul></section>`:''}${cons.length?`<section><h3>${escapeHtml(firstText(content.conLabel,'확인할 점'))}</h3><ul>${cons.map(item=>`<li>${escapeHtml(textValue(item))}</li>`).join('')}</ul></section>`:''}</div>`;

  const primaryUrl=safeHref(content.primaryUrl||content.actionUrl||'');
  const primaryLabel=firstText(content.primaryLabel,content.actionLabel,content.action);
  if(primaryUrl&&primaryLabel)body+=`<p class="public-static-action"><a href="${escapeHtml(primaryUrl)}">${escapeHtml(primaryLabel)}</a></p>`;

  return `<section class="public-static-block" data-static-type="${type}">${eyebrow?`<div class="public-static-eyebrow">${escapeHtml(eyebrow)}</div>`:''}${title?`<${headingTag}>${escapeHtml(title)}</${headingTag}>`:''}${description?`<p class="public-static-description">${escapeHtml(description)}</p>`:''}${body}</section>`;
}

function renderStaticItems(items,type){
  if(type==='faq'){
    return `<div class="public-static-faq">${items.map(item=>`<details><summary>${escapeHtml(firstText(item?.question,item?.title,'질문'))}</summary>${item?.answer?`<p>${escapeHtml(textValue(item.answer))}</p>`:''}</details>`).join('')}</div>`;
  }
  if(type==='resources'){
    return `<ul class="public-static-resources">${items.map(item=>{
      const href=safeHref(item?.url||'');
      const title=firstText(item?.title,item?.publisher,'자료');
      const publisher=firstText(item?.publisher,'');
      const supports=firstText(item?.supports,item?.description,'');
      return `<li>${href?`<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`:`<strong>${escapeHtml(title)}</strong>`}${publisher&&publisher!==title?`<span>${escapeHtml(publisher)}</span>`:''}${supports?`<p>${escapeHtml(supports)}</p>`:''}</li>`;
    }).join('')}</ul>`;
  }
  return `<div class="public-static-items">${items.map((item,index)=>renderStaticItem(item,index)).join('')}</div>`;
}

function renderStaticItem(item,index){
  if(item===null||item===undefined)return '';
  if(typeof item!=='object')return `<article><strong>${escapeHtml(textValue(item))}</strong></article>`;
  const label=firstText(item.label,item.kind,item.channel,item.period,item.step);
  const title=firstText(item.title,item.question,item.name,`항목 ${index+1}`);
  const description=firstText(item.description,item.answer,item.action,item.message,item.note);
  const price=firstText(item.price,item.value,item.outcome);
  const values=item.values&&typeof item.values==='object'&&!Array.isArray(item.values)?Object.entries(item.values):[];
  const tags=Array.isArray(item.tags)?item.tags:[];
  return `<article>${label?`<small>${escapeHtml(label)}</small>`:''}<h3>${escapeHtml(title)}</h3>${price?`<strong class="public-static-value">${escapeHtml(price)}</strong>`:''}${description?`<p>${escapeHtml(description)}</p>`:''}${values.length?`<dl>${values.map(([key,value])=>`<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(textValue(value))}</dd></div>`).join('')}</dl>`:''}${tags.length?`<p class="public-static-tags">${tags.map(tag=>`<span>${escapeHtml(textValue(tag))}</span>`).join('')}</p>`:''}</article>`;
}

function textValue(value){
  if(value===null||value===undefined)return '';
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value);
  if(Array.isArray(value))return value.map(textValue).filter(Boolean).join(', ');
  if(typeof value==='object')return firstText(value.title,value.label,value.value,value.name,'');
  return '';
}

function firstText(...values){
  for(const value of values){const text=textValue(value).trim();if(text)return text;}
  return '';
}

function safeHref(value){
  const text=String(value||'').trim();
  if(/^https?:\/\//i.test(text)||(/^\//.test(text)&&!/^\/\//.test(text)))return text;
  return '';
}

function notFoundResponse(request){
  const html=renderErrorPage('페이지를 찾지 못했습니다.','주소를 다시 확인해 주세요.');
  return new Response(request.method==='HEAD'?null:html,{status:404,headers:securityHeaders({'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=60','X-Robots-Tag':'noindex, nofollow, noarchive'})});
}

function renderErrorPage(title,description){
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/assets/styles/public-snapshot/runtime.css?v=3"></head><body><div class="public-snapshot-shell" data-theme="light"><div id="publicSnapshotRoot"><section class="public-snapshot-error"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></section></div></div></body></html>`;
}

function securityHeaders(extra={}){
  return {
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'X-Frame-Options':'SAMEORIGIN',
    ...extra
  };
}

function escapeHtml(value=''){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function escapeJsonForHtml(value){
  return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}
