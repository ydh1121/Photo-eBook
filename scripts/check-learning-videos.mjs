#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import snapshot from '../public/content-discovery/learning-videos.json' with {type:'json'};
import {createLearningVideosHandler,onRequestGet} from '../functions/api/learning-videos.js';
import {onRequestGet as photographyHandler} from '../functions/api/videos.js';
import {collectVideos,extractInitialData,searchLearningYouTube} from '../functions/lib/video-discovery.js';

// Transport fixtures are deliberately synthetic. The committed recommendation
// snapshot contains separately verified public YouTube page metadata.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline='16669aca400a343d772680e47e08a2a48ca708e7';
const subjects=['video','ai','community','real-estate','auction'];
const epoch=Date.parse('2026-11-06T12:00:00.000Z');
const failures=[];
let checks=0;
async function check(name,fn){checks++;try{await fn();process.stdout.write(`PASS ${name}\n`);}catch(error){failures.push(`${name}: ${error.stack||error}`);process.stdout.write(`FAIL ${name}: ${error.message}\n`);}}
function renderer(id='fixture0001',title='스마트폰 영상 촬영 기초 갤럭시',extra={}){
  return {videoId:id,title:{runs:[{text:title}]},ownerText:{runs:[{text:'검증용 학습 채널'}]},viewCountText:{simpleText:'조회수 1.2만회'},publishedTimeText:{simpleText:'3일 전'},lengthText:{simpleText:'12:34'},detailedMetadataSnippets:[{snippetText:{runs:[{text:'검증용 설명: {중괄호}와 "따옴표"'}]}}],thumbnail:{thumbnails:[{url:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}]},...extra};
}
function initial(renderers){return {contents:{sectionListRenderer:{contents:renderers.map(videoRenderer=>({videoRenderer}))}}};}
function html(renderers,marker='var ytInitialData = '){return `<html><script>${marker}${JSON.stringify(initial(renderers))};</script></html>`;}
const response=(body,status=200,headers={})=>new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8',...headers}});
function liveFetch(calls=[]){return async(target,options)=>{calls.push({target,options});const query=new URL(target).searchParams.get('search_query');return response(html([renderer('fixture0001',query)]));};}
const request=(search='subject=video',method='GET')=>new Request(`https://example.test/api/learning-videos?${search}`,{method});
async function sample(handler,search='subject=video',method='GET'){const result=await handler({request:request(search,method)});return {status:result.status,headers:result.headers,body:await result.json()};}
function contract(payload){
  assert.equal(typeof payload.ok,'boolean');assert.ok(Array.isArray(payload.items));
  for(const item of payload.items){
    for(const key of ['id','title','channel','url','thumbnail','description','platform','category','query','checkedAt'])assert.equal(typeof item[key],'string',`${key} is serialized`);
    assert.match(item.id,/^[A-Za-z0-9_-]{11}$/);assert.equal(item.platform,'YouTube');assert.ok(Number.isFinite(Date.parse(item.checkedAt)));
    const target=new URL(item.url);assert.equal(target.origin,'https://www.youtube.com');assert.equal(target.pathname,'/watch');assert.equal(target.searchParams.get('v'),item.id);
    const thumb=new URL(item.thumbnail);assert.equal(thumb.protocol,'https:');assert.ok(['i.ytimg.com','i9.ytimg.com','img.youtube.com'].includes(thumb.hostname));
    assert.equal(item.matchScore,undefined);assert.equal(item.isSearchFallback,undefined);
  }
}

await check('five subject snapshots contain nine verified playable URLs',()=>{
  assert.equal(snapshot.schemaVersion,1);assert.equal(snapshot.source,'verified-recommendations');assert.equal(snapshot.verification,'youtube-page-metadata');
  assert.deepEqual(Object.keys(snapshot.subjects),subjects);let count=0;
  for(const [subject,record] of Object.entries(snapshot.subjects)){
    assert.equal(record.topics.length,3);assert.equal(new Set(record.topics.map(topic=>topic.id)).size,3);assert.ok(record.items.length>0);
    contract({ok:true,items:record.items});count+=record.items.length;
    for(const item of record.items){assert.ok(record.topics.some(topic=>topic.id===item.topic));assert.equal(item.source,'verified-recommendations');assert.equal(item.checkedAt,snapshot.checkedAt);assert.equal(item.channel,'');assert.equal(item.published,undefined);assert.equal(item.views,undefined);assert.equal(item.duration,undefined);}
  }
  assert.equal(count,9);
});
await check('parser keeps quoted braces and deduplicates different renderer variants',()=>{
  const record=renderer('fixture0001','영상 "설명 {내용}"');
  const page={one:{videoRenderer:record},nested:[{compactVideoRenderer:record},{gridVideoRenderer:renderer('fixture0002','영상 두 번째')}]};
  for(const marker of ['var ytInitialData = ','window["ytInitialData"] = ','ytInitialData = ']){
    const parsed=extractInitialData(`<script>${marker}${JSON.stringify(page)};</script><div>{noise}</div>`);
    assert.deepEqual(parsed,page);const items=collectVideos(parsed,'영상','검증');assert.equal(items.length,2);assert.equal(items[0].title,'영상 "설명 {내용}"');
  }
  assert.equal(extractInitialData('<html>consent page</html>'),null);
});

const invalidCases=[
  ['','unsupported_subject'],['subject=photo','unsupported_subject'],['subject=__proto__','unsupported_subject'],
  ['subject=video&topic=rights','unsupported_topic'],['subject=video&topic=','unsupported_topic'],
  ['subject=video&cursor=-1','invalid_cursor'],['subject=video&cursor=1.5','invalid_cursor'],['subject=video&cursor=01','invalid_cursor'],['subject=video&cursor=1000000','invalid_cursor'],
  ['subject=video&subject=ai','invalid_request'],['subject=video&cursor=0&cursor=1','invalid_request'],
  ['subject=video&q=arbitrary','invalid_request'],['subject=video&url=https://example.org','invalid_request']
];
for(const [query,code] of invalidCases)await check(`invalid request is rejected before fetching: ${query||'(missing)'}`,async()=>{
  let fetched=false;const handler=createLearningVideosHandler({fetchImpl:async()=>{fetched=true;throw Error('unexpected network');}});
  const result=await sample(handler,query);assert.equal(result.status,400);assert.equal(result.body.ok,false);assert.equal(result.body.code,code);assert.deepEqual(result.body.items,[]);assert.equal(result.headers.get('Cache-Control'),'no-store');assert.equal(fetched,false);
});
await check('method validation and deployed handler share understandable errors',async()=>{
  const result=await sample(createLearningVideosHandler(),'subject=video','POST');assert.equal(result.status,405);assert.equal(result.body.code,'method_not_allowed');
  assert.equal((await sample(onRequestGet,'subject=unsupported')).status,400);
});
await check('live API response preserves source metadata and canonical transport',async()=>{
  const calls=[];const result=await sample(createLearningVideosHandler({fetchImpl:liveFetch(calls),now:()=>epoch}));contract(result.body);
  assert.equal(result.status,200);assert.equal(result.body.source,'youtube-search');assert.equal(result.body.isFallback,false);assert.equal(result.body.stale,false);assert.equal(result.body.checkedAt,new Date(epoch).toISOString());assert.equal(result.body.nextCursor,1);
  assert.equal(result.body.items[0].channel,'검증용 학습 채널');assert.equal(result.body.items[0].views,'조회수 1.2만회');assert.equal(result.body.items[0].duration,'12:34');assert.equal(result.body.items[0].published,'3일 전');
  assert.equal(calls.length,1);const target=new URL(calls[0].target);assert.equal(target.origin,'https://www.youtube.com');assert.equal(target.pathname,'/results');assert.equal(target.searchParams.get('search_query'),snapshot.subjects.video.topics[0].query);assert.equal(calls[0].options.redirect,'error');assert.ok(calls[0].options.signal instanceof AbortSignal);
});
await check('learning ranking uses relevance, validates IDs and thumbnails, and caps cards',async()=>{
  const records=[renderer('invalid/id','영상 편집'),renderer('fixture0001','영상 편집 원금 보장'),renderer('fixture0002','완전히 관계없는 내용'),renderer('fixture0003','영상',{ownerText:{simpleText:'권학봉'},viewCountText:{simpleText:'조회수 10회'}})];
  for(let index=0;index<15;index++)records.push(renderer(`sample${String(index).padStart(5,'0')}`,'영상 편집',{viewCountText:{simpleText:`조회수 ${index}회`},thumbnail:{thumbnails:[{url:'https://example.org/tracking'}]}}));
  const items=await searchLearningYouTube('영상 편집','영상',{fetchImpl:async()=>response(html(records))});
  assert.equal(items.length,12);assert.equal(items[0].id,'sample00014');assert.ok(items.every(item=>item.id.startsWith('sample')));assert.equal(items[0].thumbnail,'https://i.ytimg.com/vi/sample00014/hqdefault.jpg');assert.ok(items.every(item=>item.matchScore===undefined));
});
await check('cursor visits only fixed topics and finishes without another fetch',async()=>{
  const calls=[],handler=createLearningVideosHandler({fetchImpl:liveFetch(calls)});
  for(let index=0;index<3;index++){
    const result=await sample(handler,`subject=ai&cursor=${index}`);assert.equal(result.body.topic,snapshot.subjects.ai.topics[index].id);assert.equal(result.body.nextCursor,index<2?index+1:null);
  }
  const end=await sample(handler,'subject=ai&cursor=3');assert.equal(end.status,200);assert.deepEqual(end.body.items,[]);assert.equal(end.body.nextCursor,null);assert.equal(end.body.source,'end');assert.equal(calls.length,3);
  const one=await sample(handler,'subject=ai&topic=images');assert.equal(one.body.topic,'images');assert.equal(one.body.nextCursor,null);assert.equal(calls.length,3);
  assert.equal((await sample(handler,'subject=ai&topic=images&cursor=1')).body.items.length,0);assert.equal(calls.length,3);
});
for(const subject of subjects)await check(`blocked search returns verified recommendations for ${subject}`,async()=>{
  const handler=createLearningVideosHandler({fetchImpl:async()=>response('blocked',403),now:()=>epoch});const result=await sample(handler,`subject=${subject}`);contract(result.body);
  assert.equal(result.status,200);assert.equal(result.body.source,'verified-recommendations');assert.equal(result.body.isFallback,true);assert.equal(result.body.checkedAt,snapshot.checkedAt);assert.equal(result.body.nextCursor,null);assert.ok(result.body.items.length>0);assert.ok(result.body.items.every(item=>snapshot.subjects[subject].items.some(seed=>seed.id===item.id)));
});
for(const [name,body] of [['unrecognized HTML','<html>blocked</html>'],['empty renderer list',html([])],['irrelevant results',html([renderer('fixture0001','관계없는 내용')])]])await check(`${name} falls back without extra upstream requests`,async()=>{
  let calls=0;const handler=createLearningVideosHandler({fetchImpl:async()=>{calls++;return response(body);}});const result=await sample(handler);assert.equal(result.body.source,'verified-recommendations');assert.equal(calls,1);
});
await check('fresh cache preserves verification time and expires after ten minutes',async()=>{
  let time=epoch;const calls=[],handler=createLearningVideosHandler({fetchImpl:liveFetch(calls),now:()=>time});const first=(await sample(handler)).body;
  time+=599999;assert.deepEqual((await sample(handler)).body,first);assert.equal(calls.length,1);
  time+=2;const renewed=(await sample(handler)).body;assert.equal(calls.length,2);assert.notEqual(renewed.checkedAt,first.checkedAt);
});
await check('simultaneous identical requests share one upstream fetch',async()=>{
  let calls=0,release;const gate=new Promise(resolve=>{release=resolve;});
  const handler=createLearningVideosHandler({fetchImpl:async target=>{calls++;await gate;return liveFetch()(target,{});}});
  const first=sample(handler),second=sample(handler);assert.equal(calls,1);release();const [a,b]=await Promise.all([first,second]);assert.deepEqual(a.body,b.body);assert.equal(calls,1);
});
await check('failed refresh preserves prior search time, then ages out to verified seeds',async()=>{
  let time=epoch,fail=false,calls=0;const handler=createLearningVideosHandler({now:()=>time,fetchImpl:async target=>{calls++;if(fail)throw Error('offline');return liveFetch()(target,{});}});
  const first=(await sample(handler)).body;time+=600001;fail=true;const stale=(await sample(handler)).body;
  assert.equal(stale.source,'cached-youtube-search');assert.equal(stale.stale,true);assert.equal(stale.isFallback,false);assert.equal(stale.checkedAt,first.checkedAt);assert.deepEqual(stale.items,first.items);
  time+=119999;assert.equal((await sample(handler)).body.checkedAt,first.checkedAt);assert.equal(calls,2);
  time=epoch+86400001;const fallback=(await sample(handler)).body;assert.equal(fallback.source,'verified-recommendations');assert.equal(fallback.checkedAt,snapshot.checkedAt);assert.equal(calls,3);
});
await check('failure backoff prevents immediate retries and later recovers',async()=>{
  let time=epoch,fail=true,calls=0;const handler=createLearningVideosHandler({now:()=>time,fetchImpl:async target=>{calls++;return fail?response('unavailable',503):liveFetch()(target,{});}});
  assert.equal((await sample(handler)).body.isFallback,true);fail=false;time+=119999;assert.equal((await sample(handler)).body.isFallback,true);assert.equal(calls,1);
  time+=2;assert.equal((await sample(handler)).body.source,'youtube-search');assert.equal(calls,2);
});
await check('bounded topic cache evicts older entries without unbounded URL keys',async()=>{
  const calls=[],handler=createLearningVideosHandler({maxEntries:2,fetchImpl:liveFetch(calls)});
  await sample(handler,'subject=video&cursor=0');await sample(handler,'subject=video&cursor=1');await sample(handler,'subject=video&cursor=2');await sample(handler,'subject=video&cursor=0');assert.equal(calls.length,4);
});
await check('deadline aborts a stalled request and serves verified seeds',async()=>{
  let aborted=false,calls=0;const handler=createLearningVideosHandler({timeoutMs:15,fetchImpl:async(target,{signal})=>{calls++;return new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true});});}});
  const result=await sample(handler);assert.equal(result.body.source,'verified-recommendations');assert.equal(aborted,true);assert.equal(calls,1);
});
await check('byte budget rejects declared or streamed oversized pages',async()=>{
  for(const headers of [{},{'Content-Length':'400'}]){
    let calls=0;const handler=createLearningVideosHandler({maxBytes:128,fetchImpl:async()=>{calls++;return response('x'.repeat(400),200,headers);}});
    assert.equal((await sample(handler)).body.source,'verified-recommendations');assert.equal(calls,1);
  }
});

let original='';
await check('photography implementation extraction is identical to the pinned baseline',()=>{
  original=execFileSync('git',['show',`${baseline}:functions/api/videos.js`],{cwd:root,encoding:'utf8'});
  const boundary=original.indexOf('\nasync function searchYouTube(');assert.ok(boundary>0);
  const extracted=fs.readFileSync(path.join(root,'functions/lib/video-discovery.js'),'utf8');
  const helpers=extracted.slice(extracted.indexOf('export async function searchYouTube('),extracted.indexOf('/* Learning discovery')).replace(/^export /gm,'').trim();
  assert.equal(helpers,original.slice(boundary).trim());
  const api=fs.readFileSync(path.join(root,'functions/api/videos.js'),'utf8').replace(/^import[^\n]+\n\n/,'').trim();assert.equal(api,original.slice(0,boundary).trim());
});
function originalPhotography(fetchImpl){
  assert.ok(original,'pinned baseline is available');
  const context=vm.createContext({Request,Response,URL,AbortController,fetch:fetchImpl,setTimeout,clearTimeout,console:{warn(){}}});
  vm.runInContext(original.replace('export async function onRequestGet','async function onRequestGet')+'\nglobalThis.handler=onRequestGet;',context);return context.handler;
}
for(const query of ['', '?cursor=14','?cursor=-4&q=아이폰%20제품%20사진%20촬영','?q=custom%20query'])await check(`photography response and ranking match baseline: ${query||'default'}`,async()=>{
  const body=html([renderer('fixture0001','인물 사진 리터칭 포토샵 피부 보정',{ownerText:{simpleText:'일반 채널'}}),renderer('fixture0002','작업 소개',{ownerText:{simpleText:'권학봉'},viewCountText:{simpleText:'조회수 3회'}})]);
  const fetchImpl=async()=>response(body),legacy=originalPhotography(fetchImpl),saved=globalThis.fetch;
  try{
    globalThis.fetch=fetchImpl;const req={request:new Request(`https://example.test/api/videos${query}`)};const [before,after]=await Promise.all([legacy(req),photographyHandler(req)]);
    assert.equal(after.status,before.status);assert.equal(after.headers.get('Cache-Control'),before.headers.get('Cache-Control'));const beforeBody=await before.json(),afterBody=await after.json();assert.deepEqual(afterBody,beforeBody);assert.equal(afterBody.items[0].channel,'권학봉');
  }finally{globalThis.fetch=saved;}
});
await check('photography failure keeps its original search-link fallback and headers',async()=>{
  const fetchImpl=async()=>response('unavailable',503),legacy=originalPhotography(fetchImpl),saved=globalThis.fetch,warn=console.warn;
  try{
    globalThis.fetch=fetchImpl;console.warn=()=>{};const req={request:new Request('https://example.test/api/videos?cursor=7')};const [before,after]=await Promise.all([legacy(req),photographyHandler(req)]);
    assert.equal(after.status,before.status);assert.equal(after.headers.get('Cache-Control'),before.headers.get('Cache-Control'));const body=await after.json();assert.deepEqual(body,await before.json());assert.equal(body.fallback,true);assert.equal(body.items[0].isSearchFallback,true);
  }finally{globalThis.fetch=saved;console.warn=warn;}
});

process.stdout.write(`\nLearning video checks: ${checks-failures.length}/${checks} passed. No live upstream requests were made.\n`);
if(failures.length){process.stderr.write(failures.join('\n\n')+'\n');process.exitCode=1;}
