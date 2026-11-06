#!/usr/bin/env node
/* Refresh the public metadata index. No video stream or signed-in account is used. */
import fs from 'node:fs';
import path from 'node:path';
import {searchLearningYouTubePage,discoveryErrorCode} from '../../functions/lib/learning-video-discovery.js';
const root=path.resolve(import.meta.dirname,'../..');
const file=path.join(root,'public/content-discovery/learning-videos.json');
const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
const selected=process.argv.find(value=>value.startsWith('--subject='))?.slice(10);
const missingOnly=process.argv.includes('--only-missing');
if(selected&&!Object.hasOwn(catalog.subjects,selected))throw new Error('Unknown subject');
const checkedAt=new Date().toISOString(),report=[],jobs=[];
for(const [id,subject]of Object.entries(catalog.subjects)){if(selected&&selected!==id)continue;for(const topic of subject.topics){if(missingOnly&&subject.items.filter(item=>item.topic===topic.id||item.topics?.includes(topic.id)).length>=6)continue;jobs.push({id,subject,topic});}}
let index=0;const found=new Map();
await Promise.all(Array.from({length:2},async()=>{while(index<jobs.length){const {id,topic}=jobs[index++];try{const result=await searchLearningYouTubePage(topic.query,topic.category,{requiredTerms:topic.requiredTerms||[]});const items=result.items.slice(0,12).map(item=>({...item,topic:topic.id,topics:[topic.id],checkedAt,source:'public-metadata-index',verification:'youtube-search-metadata'}));found.set(`${id}:${topic.id}`,items);report.push({subject:id,topic:topic.id,count:items.length,status:'ok'});}catch(error){report.push({subject:id,topic:topic.id,count:0,status:discoveryErrorCode(error),detail:String(error.message||'').slice(0,140)});}}}));
for(const [id,subject]of Object.entries(catalog.subjects)){
  if(selected&&selected!==id)continue;const existing=subject.items||[],items=[],seen=new Map();
  for(const topic of subject.topics){const source=found.get(`${id}:${topic.id}`)||existing.filter(item=>item.topic===topic.id||item.topics?.includes(topic.id));for(const item of source){const key=`${item.platform}:${item.id}`;if(seen.has(key)){const previous=seen.get(key);previous.topics=[...new Set([...(previous.topics||[previous.topic]),topic.id])];continue;}const next={...item,topics:[...new Set([...(item.topics||[item.topic]),topic.id])]};seen.set(key,next);items.push(next);}}
  for(const item of existing){const key=`${item.platform}:${item.id}`;if(seen.has(key))continue;seen.set(key,item);items.push(item);}
  const featured=subject.featuredIds||[],reviewed=items.filter(item=>!subject.excludedIds?.includes(item.id));
  subject.items=reviewed.filter(item=>featured.includes(item.id)).sort((a,b)=>featured.indexOf(a.id)-featured.indexOf(b.id)).concat(reviewed.filter(item=>!featured.includes(item.id)));subject.checkedAt=checkedAt;
}
catalog.checkedAt=checkedAt;catalog.indexVersion=2;catalog.source='public-metadata-index';catalog.verification='public-page-metadata';
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({checkedAt,counts:Object.fromEntries(Object.entries(catalog.subjects).map(([id,s])=>[id,s.items.length])),results:report},null,2));
