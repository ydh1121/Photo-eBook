/* Public video metadata discovery. This module never requests a media stream. */
import {collectVideos,extractInitialData,relevanceScore,viewNumber} from './video-discovery.js';

export const LEARNING_VIDEO_LIMITS=Object.freeze({timeoutMs:7500,maxBytes:6*1024*1024,maxItems:18,maxPages:3});
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const GUARANTEE=/수익\s*(?:보장|확정)|원금\s*보장|무조건\s*(?:돈|수익)|100%\s*(?:수익|성공)/;
const text=value=>typeof value==='string'?value:typeof value?.content==='string'?value.content:typeof value?.simpleText==='string'?value.simpleText:Array.isArray(value?.runs)?value.runs.map(run=>run?.text||'').join(''):'';
const walk=(value,visit)=>{if(!value||typeof value!=='object')return;visit(value);for(const child of Object.values(value))walk(child,visit);};
export const metadataText=item=>`${item.title||''} ${item.channel||''} ${item.description||''} ${item.caption||''} ${(item.hashtags||[]).join(' ')}`.normalize('NFKC').toLowerCase();
export const searchTerms=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/#/g,' ').split(/\s+/).filter(Boolean);
export const matchesMetadata=(item,query)=>searchTerms(query).every(term=>metadataText(item).includes(term));
export function extractHashtags(value){return [...new Set((String(value||'').match(/#[\p{L}\p{N}_]+/gu)||[]).map(tag=>tag.slice(0,48)))].slice(0,12);}
function thumb(value,id){try{const url=new URL(String(value||'').replace(/^\/\//,'https://'));if(url.protocol==='https:'&&['i.ytimg.com','i9.ytimg.com','img.youtube.com'].includes(url.hostname))return url.href;}catch{}return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;}
function normalize(item,query,category){
  if(!VIDEO_ID.test(String(item.id||''))||!item.title||GUARANTEE.test(item.title)||String(item.title).replace(/#[\p{L}\p{N}_]+/gu,'').replace(/[\s\p{P}\p{S}]/gu,'').length<4)return null;
  const out={...item,id:String(item.id),title:String(item.title).slice(0,240),channel:String(item.channel||''),views:String(item.views||''),published:String(item.published||''),duration:String(item.duration||''),description:String(item.description||'').slice(0,360),platform:'YouTube',query,category,metadataOnly:true};
  out.url=`https://www.youtube.com/${item.format==='shorts'?'shorts/':'watch?v='}${out.id}`;out.thumbnail=thumb(item.thumbnail,out.id);out.hashtags=extractHashtags(`${out.title} ${out.description}`);out.matchScore=relevanceScore(out,query);return out;
}
export function collectLearningVideos(initial,query,category,{requiredTerms=[]}={}){
  const found=collectVideos(initial,query,category);
  walk(initial,node=>{
    const short=node.shortsLockupViewModel;
    if(short){const endpoint=short.onTap?.innertubeCommand?.reelWatchEndpoint;const id=endpoint?.videoId||String(short.entityId||'').replace(/^shorts-shelf-item-/,'');found.push({id,title:text(short.overlayMetadata?.primaryText),views:text(short.overlayMetadata?.secondaryText),thumbnail:short.thumbnailViewModel?.image?.sources?.at(-1)?.url||endpoint?.thumbnail?.thumbnails?.at(-1)?.url,format:'shorts'});}
    const reel=node.reelItemRenderer;
    if(reel)found.push({id:reel.videoId,title:text(reel.headline),views:text(reel.viewCountText),thumbnail:reel.thumbnail?.thumbnails?.at(-1)?.url,format:'shorts'});
    const lockup=node.lockupViewModel;
    if(lockup?.contentType==='LOCKUP_CONTENT_TYPE_VIDEO'&&VIDEO_ID.test(lockup.contentId||'')){
      const metadata=lockup.metadata?.lockupMetadataViewModel,rows=metadata?.metadata?.contentMetadataViewModel?.metadataRows||[];
      const parts=rows.flatMap(row=>(row.metadataParts||[]).map(part=>text(part.text))).filter(Boolean);
      const byline=rows.find(row=>row.lockupContentMetadataRowExtension?.contentType==='METADATA_ROW_CONTENT_TYPE_BYLINE');
      const badges=lockup.contentImage?.thumbnailViewModel?.overlays||[];let duration='';walk(badges,node=>{const value=node.thumbnailBadgeViewModel?.text;if(/^\d+:\d{2}(?::\d{2})?$/.test(value||''))duration=value;});
      found.push({id:lockup.contentId,title:text(metadata?.title),channel:text(byline?.metadataParts?.[0]?.text)||parts.find(value=>!/조회|views?|전$|ago$/.test(value))||'',views:parts.find(value=>/조회|views?/i.test(value))||'',published:parts.find(value=>/전$|ago$/i.test(value))||'',description:rows.filter(row=>row.lockupContentMetadataRowExtension?.contentType==='METADATA_ROW_CONTENT_TYPE_DESCRIPTION').flatMap(row=>(row.metadataParts||[]).map(part=>text(part.text))).join(' '),duration,thumbnail:lockup.contentImage?.thumbnailViewModel?.image?.sources?.at(-1)?.url});
    }
  });
  const unique=new Map();for(const item of found){const out=normalize(item,query,category);if(!out||out.matchScore===0)continue;if(requiredTerms.length&&!requiredTerms.some(term=>metadataText(out).includes(String(term).toLowerCase())))continue;if(!unique.has(out.id)||(!unique.get(out.id).description&&out.description))unique.set(out.id,out);}
  const rank=item=>item.matchScore+(/기초|초보|입문|사용법|배우|튜토리얼/.test(item.title)?0.8:0)+(item.channel?0.5:0)+(item.description?0.2:0);
  return [...unique.values()].sort((a,b)=>(rank(b)-rank(a))||(viewNumber(b.views)-viewNumber(a.views))).map(({matchScore,...item})=>item);
}
export function continuationOf(initial){let token='';walk(initial,node=>{const endpoint=node.continuationItemRenderer?.continuationEndpoint;if(!token&&endpoint?.commandMetadata?.webCommandMetadata?.apiUrl==='/youtubei/v1/search')token=endpoint.continuationCommand?.token||'';});return typeof token==='string'&&token.length<=24000&&/^[\w%+=/-]+$/.test(token)?token:'';}
function config(html,name){return String(html||'').match(new RegExp(`"${name}"\\s*:\\s*"([^"\\n]+)"`))?.[1]||'';}
export function learningInitialData(html){
  const legacy=extractInitialData(html);if(legacy)return legacy;
  const source=String(html||''),match=/\b(?:var\s+)?ytInitialData\s*=\s*\{/.exec(source);if(!match)return null;
  const start=source.indexOf('{',match.index);let depth=0,quoted=false,escaped=false;
  for(let index=start;index<source.length;index++){const char=source[index];if(quoted){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')quoted=false;}else if(char==='"')quoted=true;else if(char==='{')depth++;else if(char==='}'&&--depth===0){try{return JSON.parse(source.slice(start,index+1));}catch{return null;}}}return null;
}
export function discoveryErrorCode(error){const code=error?.code;return ['timeout','oversized','blocked','http','unrecognized','empty','network'].includes(code)?code:'network';}
function fail(code){const error=new Error(`Video metadata ${code}`);error.code=code;return error;}
export async function boundedMetadataFetch(url,{fetchImpl=fetch,timeoutMs=LEARNING_VIDEO_LIMITS.timeoutMs,maxBytes=LEARNING_VIDEO_LIMITS.maxBytes,method='GET',body,headers={}}={}){
  const controller=new AbortController();let timer,reader;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reader?.cancel().catch(()=>{});reject(fail('timeout'));},Math.max(1,Math.min(LEARNING_VIDEO_LIMITS.timeoutMs,timeoutMs)));});
  const load=async()=>{let target=new URL(url),response;const origin=target.origin;if(target.protocol!=='https:'||!['www.youtube.com','www.instagram.com'].includes(target.hostname)||target.port||target.username||target.password)throw fail('blocked');
    for(let hop=0;hop<3;hop++){response=await fetchImpl(target.href,{method,body,redirect:'manual',signal:controller.signal,headers:{'Accept-Language':'ko-KR,ko;q=0.9,en;q=0.7',...headers}});if(response.status<300||response.status>=400)break;const location=response.headers.get('Location');await response.body?.cancel();if(!location||hop===2)throw fail('blocked');target=new URL(location,target);if(target.origin!==origin||target.username||target.password)throw fail('blocked');}
    if(!response.ok)throw fail([401,403,429].includes(response.status)?'blocked':'http');const limit=Math.max(1,Math.min(LEARNING_VIDEO_LIMITS.maxBytes,maxBytes));if(Number(response.headers.get('content-length')||0)>limit){await response.body?.cancel();throw fail('oversized');}if(!response.body)throw fail('empty');reader=response.body.getReader();const decoder=new TextDecoder();let size=0,value='';try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>limit)throw fail('oversized');value+=decoder.decode(chunk.value,{stream:true});}return value+decoder.decode();}finally{await reader.cancel().catch(()=>{});reader=null;}};
  try{return await Promise.race([load(),timeout]);}finally{clearTimeout(timer);}
}
export async function searchLearningYouTubePage(query,category,{page=0,requiredTerms=[],previous=null,...options}={}){
  if(!Number.isInteger(page)||page<0||page>=LEARNING_VIDEO_LIMITS.maxPages)throw fail('empty');
  let data,client,token,currentPage=0;
  if(previous?.page===page-1&&previous.continuation&&previous.client){({client,continuation:token}=previous);currentPage=page;}
  else{
    const html=await boundedMetadataFetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=ko&gl=KR`,options);data=learningInitialData(html);
    client={version:config(html,'INNERTUBE_CLIENT_VERSION'),key:config(html,'INNERTUBE_API_KEY'),visitor:config(html,'VISITOR_DATA')};
    if(!data&&validClient(client)&&!/(?:consent\.google\.com|accounts\.google\.com\/ServiceLogin|unusual traffic|confirm you.re not a bot)/i.test(html)){
      const raw=await boundedMetadataFetch(`https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(client.key)}&prettyPrint=false`,{...options,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:{client:{clientName:'WEB',clientVersion:client.version,hl:'ko',gl:'KR'}},query})});try{data=JSON.parse(raw);}catch{}
    }
    if(!data)throw fail('unrecognized');token=continuationOf(data);
  }
  // Follow only the continuation supplied by a successfully read public search
  // response. A blocked/login response never triggers a second endpoint.
  for(let index=currentPage||1;page>0&&index<=page;index++){
    if(!token||!validClient(client))return {items:[],page,continuation:'',client:null};
    const body=JSON.stringify({context:{client:{clientName:'WEB',clientVersion:client.version,hl:'ko',gl:'KR',...(client.visitor&&client.visitor.length<1000?{visitorData:client.visitor}:{})}},continuation:token});
    const raw=await boundedMetadataFetch(`https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(client.key)}&prettyPrint=false`,{...options,method:'POST',body,headers:{'Content-Type':'application/json'}});try{data=JSON.parse(raw);}catch{throw fail('unrecognized');}token=continuationOf(data);
  }
  const items=collectLearningVideos(data,query,category,{requiredTerms});if(!items.length&&page===0)throw fail('empty');
  return {items:items.slice(0,LEARNING_VIDEO_LIMITS.maxItems),page,continuation:token,client};
}
function validClient(client){return /^\d[\w.]{3,80}$/.test(client?.version||'')&&/^[\w-]{10,160}$/.test(client?.key||'');}
function decodeHtml(value){return String(value||'').replace(/&#(x[\da-f]+|\d+);/gi,(_,code)=>{const point=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return point>0&&point<=0x10ffff?String.fromCodePoint(point):'';}).replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');}
export function instagramPostUrl(value){try{const url=new URL(value);if(url.protocol==='https:'&&['www.instagram.com','instagram.com'].includes(url.hostname)&&/^\/(?:reel|p)\/[\w-]{5,32}\/?$/.test(url.pathname))return `https://www.instagram.com${url.pathname.replace(/\/?$/,'/')}`;}catch{}return '';}
export function parseInstagramMetadata(html,url){
  const canonical=instagramPostUrl(url);if(!canonical)throw fail('empty');const tags={};for(const match of String(html||'').matchAll(/<meta\b[^>]*>/gi)){const attrs={};for(const attr of match[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs))attrs[attr[1].toLowerCase()]=decodeHtml(attr[3]);const key=attrs.property||attrs.name;if(key)tags[key]=attrs.content||'';}
  const caption=tags['og:description']||tags.description||'';if(caption.length<12||/^(?:Instagram|Login|Log in|로그인)(?:\s|$)/i.test(caption)||!tags['og:title']||/^Instagram$/i.test(tags['og:title']))throw fail('unrecognized');
  return {title:tags['og:title'].slice(0,240),caption:caption.slice(0,1400),description:caption.slice(0,360),hashtags:extractHashtags(caption),url:canonical,metadataOnly:true};
}
export async function refreshInstagramMetadata(item,options={}){const url=instagramPostUrl(item.url);if(!url)throw fail('empty');const html=await boundedMetadataFetch(url,{...options,maxBytes:2*1024*1024});return {...item,...parseInstagramMetadata(html,url)};}
