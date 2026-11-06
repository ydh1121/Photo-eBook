import {videoCatalog as snapshot} from '../lib/learning-discovery-catalog.js';
import {json,relevanceScore} from '../lib/video-discovery.js';
import {searchLearningYouTubePage,refreshInstagramMetadata,matchesMetadata,discoveryErrorCode,LEARNING_VIDEO_LIMITS} from '../lib/learning-video-discovery.js';

const FRESH_MS=10*60*1000,FAILURE_MS=2*60*1000,STALE_MS=24*60*60*1000,CACHE_ENTRIES=96;
const PAGES=LEARNING_VIDEO_LIMITS.maxPages,PAGE_SIZE=LEARNING_VIDEO_LIMITS.maxItems;
const ALLOWED_PARAMETERS=new Set(['subject','topic','cursor','q','platform']);
const SCOPES={video:'스마트폰 영상',ai:'AI 챗GPT',community:'모임 커뮤니티','real-estate':'부동산 룸투어',auction:'부동산 경매',sns:'SNS'};
const unique=items=>[...new Map(items.map(item=>[`${item.platform}:${item.id}`,item])).values()];
function requestError(message,code='invalid_request',status=400){return json({ok:false,items:[],nextCursor:null,code,message},status,{'Cache-Control':'no-store'});}
function selectRequest(request,catalog){
  if(request.method!=='GET')return {error:requestError('GET 요청을 사용해 주세요.','method_not_allowed',405)};
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>!ALLOWED_PARAMETERS.has(key)||url.searchParams.getAll(key).length!==1))return {error:requestError('지원하지 않는 검색 조건입니다.')};
  const subject=String(url.searchParams.get('subject')||'').trim();
  if(!Object.hasOwn(catalog.subjects,subject))return {error:requestError('지원하는 분야를 선택해 주세요.','unsupported_subject')};
  const record=catalog.subjects[subject],platform=url.searchParams.get('platform')||'all';if(!['all','youtube','instagram'].includes(platform))return {error:requestError('영상 출처를 확인해 주세요.','unsupported_platform')};
  const topic=url.searchParams.get('topic');if(topic!==null&&!record.topics.some(item=>item.id===topic)&&topic!=='instagram')return {error:requestError('선택한 분야의 주제를 확인해 주세요.','unsupported_topic')};
  const query=String(url.searchParams.get('q')||'').trim().replace(/\s+/g,' ');if(query.length>80||/[\x00-\x1f<>]|https?:\/\//i.test(query))return {error:requestError('검색어는 80자 이내로 입력해 주세요.','invalid_query')};
  const raw=url.searchParams.get('cursor')||'0';if(!/^(0|[1-9]\d{0,5})$/.test(raw))return {error:requestError('페이지 번호를 확인해 주세요.','invalid_cursor')};
  let topics=platform==='instagram'||topic==='instagram'?[]:record.topics.filter(item=>topic===null||item.id===topic).map(item=>({...item,kind:'youtube'}));
  if(query&&topics.length)topics=[{id:'search',kind:'youtube',query:`${SCOPES[subject]} ${query.replace(/#/g,'')}`,category:'검색 결과',requiredTerms:subject==='sns'?[...new Set(record.topics.flatMap(item=>item.requiredTerms||[]))]:record.topics[0]?.requiredTerms||[]}];
  const instagram=record.items.filter(item=>item.platform==='Instagram'&&(!query||matchesMetadata(item,query)));
  if(platform!=='youtube'&&(topic===null||topic==='instagram')&&(instagram.length||platform==='instagram'))topics.push({id:'instagram',kind:'instagram',query:query||'임장 룸투어',category:'Instagram 게시물',items:instagram});
  const cursor=Number(raw),index=Math.floor(cursor/PAGES),page=cursor%PAGES,preset=topics[index]||null;
  return {subject,record,topics,preset,cursor,page,query,platform,topic,nextTopic:(index+1)<topics.length?(index+1)*PAGES:null};
}
function recommendations(selected,catalog){
  const {record,preset,page,query}=selected;
  let candidates=preset.kind==='instagram'?preset.items:record.items.filter(item=>item.platform==='YouTube'&&(query?matchesMetadata(item,query):item.topic===preset.id||item.topics?.includes(preset.id)));
  // A sparse topic must not collapse the whole subject rail to one card. Keep
  // explicit topic/keyword requests narrow; the unfiltered rail can offer other
  // previously checked lessons from the same subject while its source recovers.
  const scope=preset.kind==='youtube'&&!query&&selected.topic===null&&candidates.length<6?'subject':'topic';
  if(scope==='subject')candidates=record.items.filter(item=>item.platform==='YouTube').sort((a,b)=>relevanceScore(b,preset.query)-relevanceScore(a,preset.query));
  const items=unique(candidates).slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map(item=>({...item}));
  return {items,checkedAt:items.map(item=>item.checkedAt).filter(Boolean).sort()[0]||catalog.checkedAt,source:'public-metadata-index',isFallback:true,fallbackScope:scope,stale:false,hasMore:scope==='topic'&&(page+1)*PAGE_SIZE<candidates.length};
}

// Cursor positions enumerate fixed subject queries and genuine continuations.
// They never wrap around and do not expose upstream tokens.
export function createLearningVideosHandler({fetchImpl=fetch,now=Date.now,timeoutMs=LEARNING_VIDEO_LIMITS.timeoutMs,maxBytes=LEARNING_VIDEO_LIMITS.maxBytes,maxEntries=CACHE_ENTRIES,catalog=snapshot}={}){
  const cache=new Map(),inflight=new Map();const capacity=Math.max(1,Math.min(CACHE_ENTRIES,Number(maxEntries)||CACHE_ENTRIES));
  // A broad subject fallback and an explicitly selected topic have different
  // relevance boundaries even when they request the same upstream query.
  const cacheKey=(selected,page=selected.page)=>JSON.stringify([selected.subject,selected.topic,selected.platform,selected.preset.id,selected.query,page]);
  function remember(key,entry){cache.delete(key);cache.set(key,entry);while(cache.size>capacity)cache.delete(cache.keys().next().value);}
  async function discover(selected){
    const {preset,page,query}=selected,key=cacheKey(selected),time=now(),cached=cache.get(key);
    if(cached&&time<cached.until){remember(key,cached);return cached.payload;}if(inflight.has(key))return inflight.get(key);
    const job=(async()=>{
      if(preset.kind==='instagram'){
        const seed=recommendations(selected,catalog);let refreshed=0,failures=0;
        const items=await Promise.all(seed.items.map(async(item,index)=>{if(index>=4)return item;try{const value=await refreshInstagramMetadata(item,{fetchImpl,timeoutMs,maxBytes});refreshed++;return {...value,checkedAt:new Date(now()).toISOString(),source:'instagram-page-metadata',verification:'instagram-page-metadata'};}catch{failures++;return item;}}));
        const payload={ok:true,...seed,items,isFallback:refreshed===0,source:refreshed?'instagram-page-metadata':seed.source,provider:{id:'instagram',status:refreshed?'ok':failures?'cached':'empty',checked:refreshed,unavailable:failures}};
        remember(key,{payload,until:now()+(refreshed?FRESH_MS:FAILURE_MS)});return payload;
      }
      try{
        const previous=cache.get(cacheKey(selected,page-1))?.paging;
        const found=await searchLearningYouTubePage(preset.query,preset.category,{page,previous,fetchImpl,timeoutMs,maxBytes,requiredTerms:preset.requiredTerms||[]});
        const checkedAt=new Date(now()).toISOString(),items=found.items.filter(item=>!selected.record.excludedIds?.includes(item.id)&&(!query||matchesMetadata(item,query))).map(item=>({...item,topic:preset.id,checkedAt,source:'youtube-search',verification:'youtube-search-metadata'}));
        const payload={ok:true,items,checkedAt,source:'youtube-search',isFallback:false,stale:false,hasMore:Boolean(found.continuation),provider:{id:'youtube',status:items.length?'ok':'empty'}};
        remember(key,{payload,paging:found,until:now()+FRESH_MS,good:{payload,at:now(),paging:found}});return payload;
      }catch(error){
        const good=cached?.good&&now()-cached.good.at<=STALE_MS?cached.good:null,seed=recommendations(selected,catalog);
        const payload=good?{...good.payload,source:'cached-youtube-search',stale:true}:{ok:true,...seed};
        payload.provider={id:'youtube',status:good?'stale':'cached',reason:discoveryErrorCode(error)};
        remember(key,{payload,until:now()+FAILURE_MS,good,paging:good?.paging});return payload;
      }
    })();inflight.set(key,job);try{return await job;}finally{inflight.delete(key);}
  }
  return async context=>{
    const selected=selectRequest(context.request,catalog);if(selected.error)return selected.error;
    const {subject,preset,cursor,page,nextTopic,query,platform}=selected;
    if(!preset)return json({ok:true,subject,items:[],checkedAt:null,source:'end',isFallback:false,cursor,nextCursor:null,exhausted:true},200,{'Cache-Control':'public, max-age=120, s-maxage=600'});
    const result=await discover(selected),nextCursor=result.hasMore&&page+1<PAGES?cursor+1:nextTopic;
    const {hasMore,...published}=result;
    const payload={...published,subject,topic:preset.id,query:query||preset.query,category:preset.category,platform,cursor,nextCursor,exhausted:nextCursor===null};
    return json(payload,200,{'Cache-Control':result.isFallback||result.stale?'public, max-age=30, s-maxage=120':'public, max-age=120, s-maxage=600'});
  };
}
export const onRequestGet=createLearningVideosHandler();
