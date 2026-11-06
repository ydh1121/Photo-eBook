import {videoCatalog as snapshot} from '../lib/learning-discovery-catalog.js';
import {searchLearningYouTube,json} from '../lib/video-discovery.js';

const TOPICS=snapshot.subjects;
const FRESH_MS=10*60*1000;
const FAILURE_MS=2*60*1000;
const STALE_MS=24*60*60*1000;
const CACHE_ENTRIES=32;
const ALLOWED_PARAMETERS=new Set(['subject','topic','cursor']);

function requestError(message,code='invalid_request',status=400){return json({ok:false,items:[],nextCursor:null,code,message},status,{'Cache-Control':'no-store'});}
function selectRequest(request){
  if(request.method!=='GET')return {error:requestError('GET 요청을 사용해 주세요.','method_not_allowed',405)};
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>!ALLOWED_PARAMETERS.has(key)||url.searchParams.getAll(key).length!==1))return {error:requestError('지원하지 않는 검색 조건입니다.')};
  const subject=String(url.searchParams.get('subject')||'').trim();
  if(!Object.hasOwn(TOPICS,subject))return {error:requestError('지원하는 분야를 선택해 주세요.','unsupported_subject')};
  const topic=url.searchParams.get('topic');
  const topics=topic===null?TOPICS[subject].topics:TOPICS[subject].topics.filter(item=>item.id===topic);
  if(!topics.length)return {error:requestError('선택한 분야의 주제를 확인해 주세요.','unsupported_topic')};
  const raw=url.searchParams.get('cursor')||'0';
  if(!/^(0|[1-9]\d{0,5})$/.test(raw))return {error:requestError('페이지 번호를 확인해 주세요.','invalid_cursor')};
  const cursor=Number(raw);
  return {subject,topics,cursor,preset:topics[cursor]||null,nextCursor:cursor+1<topics.length?cursor+1:null};
}
function verifiedRecommendations(subject,topic){
  const all=TOPICS[subject].items;
  const matching=all.filter(item=>item.topic===topic);
  const items=(matching.length?matching:all).map(item=>({...item}));
  return {ok:items.length>0,items,checkedAt:items.map(item=>item.checkedAt).sort()[0]||snapshot.checkedAt,source:'verified-recommendations',isFallback:true,fallbackScope:matching.length?'topic':'subject'};
}

// Each worker isolate keeps at most 32 canonical topic entries. Single-flight
// requests share the fetch; only fixed, committed subject/topic queries are used.
export function createLearningVideosHandler({fetchImpl=fetch,now=Date.now,timeoutMs=6000,maxBytes=2*1024*1024,maxEntries=CACHE_ENTRIES}={}){
  const cache=new Map(),inflight=new Map();
  const capacity=Math.max(1,Math.min(CACHE_ENTRIES,Number(maxEntries)||CACHE_ENTRIES));
  function remember(key,entry){cache.delete(key);cache.set(key,entry);while(cache.size>capacity)cache.delete(cache.keys().next().value);}
  async function discover(subject,preset){
    const key=`${subject}:${preset.id}`;
    const time=now(),cached=cache.get(key);
    if(cached&&time<cached.until){remember(key,cached);return cached.payload;}
    if(inflight.has(key))return inflight.get(key);
    const job=(async()=>{
      try{
        const found=await searchLearningYouTube(preset.query,preset.category,{fetchImpl,timeoutMs,maxBytes});
        const checkedAt=new Date(now()).toISOString();
        const items=found.map(item=>({...item,topic:preset.id,checkedAt,source:'youtube-search'}));
        const payload={ok:true,items,checkedAt,source:'youtube-search',isFallback:false,stale:false};
        remember(key,{payload,until:now()+FRESH_MS,good:{items,checkedAt,at:now()}});
        return payload;
      }catch{
        const good=cached?.good&&now()-cached.good.at<=STALE_MS?cached.good:null;
        const payload=good?{ok:true,items:good.items,checkedAt:good.checkedAt,source:'cached-youtube-search',isFallback:false,stale:true}:verifiedRecommendations(subject,preset.id);
        remember(key,{payload,until:now()+FAILURE_MS,good});
        return payload;
      }
    })();
    inflight.set(key,job);
    try{return await job;}finally{inflight.delete(key);}
  }
  return async context=>{
    const selected=selectRequest(context.request);if(selected.error)return selected.error;
    const {subject,preset,cursor,nextCursor}=selected;
    if(!preset)return json({ok:true,subject,items:[],checkedAt:null,source:'end',isFallback:false,cursor,nextCursor:null},200,{'Cache-Control':'public, max-age=120, s-maxage=600'});
    const result=await discover(subject,preset);
    const payload={...result,subject,topic:preset.id,query:preset.query,category:preset.category,cursor,nextCursor:result.isFallback?null:nextCursor};
    if(!payload.ok)return json({...payload,code:'unavailable',message:'영상 자료를 불러오지 못했습니다.'},503,{'Cache-Control':'no-store'});
    return json(payload,200,{'Cache-Control':result.isFallback||result.stale?'public, max-age=30, s-maxage=120':'public, max-age=120, s-maxage=600'});
  };
}

export const onRequestGet=createLearningVideosHandler();
