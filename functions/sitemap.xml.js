import {listIndexableSnapshotRoutesV2} from './lib/public-snapshot-v2.js';

export async function onRequest(context){
  const {request,env}=context;
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});

  try{
    const origin=new URL(request.url).origin;
    const routes=await listIndexableSnapshotRoutesV2(env);
    const urls=[{loc:`${origin}/`,lastmod:''},...routes.map(item=>({
      loc:`${origin}/${encodeURIComponent(item.slug)}/`,
      lastmod:normalizeDate(item.sourceUpdatedAt||item.publishedAt)
    }))];
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item=>`  <url>\n    <loc>${escapeXml(item.loc)}</loc>${item.lastmod?`\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>`:''}\n  </url>`).join('\n')}\n</urlset>\n`;
    return new Response(request.method==='HEAD'?null:xml,{status:200,headers:{
      'Content-Type':'application/xml; charset=utf-8',
      'Cache-Control':'public, max-age=300, stale-while-revalidate=900',
      'X-Content-Type-Options':'nosniff',
      'Vary':'Accept-Encoding'
    }});
  }catch(error){
    console.error('Sitemap generation failed',error);
    return new Response('Sitemap unavailable',{status:500,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
}

function normalizeDate(value){
  const text=String(value||'').trim();
  const match=text.match(/^\d{4}-\d{2}-\d{2}/);
  return match?match[0]:'';
}

function escapeXml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
}
