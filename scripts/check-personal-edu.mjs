#!/usr/bin/env node
/* Read-only V1 checks. External URL checks are structural, not live availability checks. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline='16669aca400a343d772680e47e08a2a48ca708e7';
const origin='https://photo-ebook.pages.dev';
const expected={video:37,ai:38,community:41,'real-estate':39,auction:39};
const ids=Object.keys(expected);
const practice={video:'editing',ai:'images',community:'education','real-estate':'inspection',auction:'inspection'};
const types=new Set(['prose','cards','steps','checklist','template','table','callout','related']);
const officialDomains=['go.kr','gov.kr','ac.kr','samsung.com','samsungsvc.co.kr','support.google.com','help.openai.com','kcmf.or.kr','docs.band.us','edu.sbiz.or.kr','kamco.or.kr'];
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help'){
  console.log('Usage: node scripts/check-personal-edu.mjs [--drafts <directory>]\nDefault: validate reviewed sources, generated output, links, canonical renderers and photography baseline.\n--drafts: validate the supplied authoring drafts plus renderers/catalog/baseline; generated output is explicitly skipped.');
  process.exit(0);
}
if(args.length&&!(args.length===2&&args[0]==='--drafts')){
  console.error('Unknown arguments. Use --help.');process.exit(2);
}
const drafts=args[0]==='--drafts';
const sourceDir=drafts?path.resolve(args[1]):path.join(root,'content/learning-guides/v1');
const errors=[];
const notes=[];
let checks=0;
const counts={courses:0,chapters:0,blocks:0,sources:0,links:0,renderedChapters:0,photographyFiles:0};
function check(value,where,message){checks++;if(!value)errors.push(`${where}: ${message}`);return Boolean(value);}
function attempt(where,fn){try{return fn();}catch(error){check(false,where,error.message);return null;}}
function read(file){const full=path.isAbsolute(file)?file:path.join(root,file);return attempt(path.relative(root,full),()=>fs.readFileSync(full,'utf8'));}
function json(file){const raw=read(file);return raw===null?null:attempt(file,()=>JSON.parse(raw));}
function same(a,b){return isDeepStrictEqual(JSON.parse(JSON.stringify(a??null)),JSON.parse(JSON.stringify(b??null)));}
function list(value,where,{min=0}={}){if(!check(Array.isArray(value),where,'expected an array'))return [];check(value.length>=min,where,`expected at least ${min} items`);return value;}
function text(value,where){return check(typeof value==='string'&&Boolean(value.trim()),where,'expected non-empty text');}
function slug(value,where){return check(typeof value==='string'&&/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value),where,'expected a lowercase hyphenated ID');}
function date(value,where){return check(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value,where,'expected a valid YYYY-MM-DD date');}
function strings(value,where,{min=1,unique=false}={}){const values=list(value,where,{min});values.forEach((item,i)=>text(item,`${where}[${i}]`));if(unique)check(new Set(values).size===values.length,where,'duplicate text creates ambiguous checklist state');return values;}
function body(value,where){if(Array.isArray(value))strings(value,where);else text(value,where);}
function unique(values,where){check(new Set(values).size===values.length,where,'duplicate IDs');}
function walk(value,visit,where='$',key=''){
  if(typeof value==='string')visit(value,where,key);
  else if(Array.isArray(value))value.forEach((item,i)=>walk(item,visit,`${where}[${i}]`,key));
  else if(value&&typeof value==='object')Object.entries(value).forEach(([name,item])=>walk(item,visit,`${where}.${name}`,name));
}
function isOfficial(host){return officialDomains.some(domain=>host===domain||host.endsWith(`.${domain}`));}
function externalUrl(value,where,{official=false}={}){
  if(!text(value,where))return;
  const url=attempt(where,()=>new URL(value));if(!url)return;
  check(url.protocol==='https:',where,'external URLs must use HTTPS');
  check(!url.username&&!url.password&&!url.port,where,'credentials or custom ports are not allowed');
  check(!/\s/.test(value)&&value===value.trim(),where,'URL contains whitespace');
  check(!/^(?:localhost|127\.|0\.|192\.168\.|10\.)/.test(url.hostname),where,'local/test destinations are not public sources');
  check(!['example.com','example.org','example.net'].some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`)),where,'placeholder destination');
  check(!/(^|\.)(?:drive\.google\.com|docs\.google\.com|chatgpt\.com)$/.test(url.hostname),where,'private authoring/session links must not enter public copy');
  if(official)check(isOfficial(url.hostname),where,'source host is outside the reviewed official-domain set');
}
const linked=[];
function link(value,where,courseId){
  if(!check(value&&typeof value==='object'&&!Array.isArray(value),where,'expected a labelled link'))return;
  text(value.label||value.title,`${where}.label`);text(value.url,`${where}.url`);
  if(typeof value.url==='string')linked.push({url:value.url,where:`${where}.url`,courseId});
}
function scanPublicCopy(course){
  walk(course,(value,where,key)=>{
    if(['url','route','id','image','checkedAt','reviewedAt'].includes(key))return;
    const at=`${course.id}${where}`;
    check(!/<\/?[a-z][^>]*>/i.test(value)&&! /\[[^\]]+\]\(https?:\/\//i.test(value),at,'authoring copy must be plain text; use structured links');
    const privatePatterns=[
      /(?:우리|저희|사용자의)\s*(?:엄마|어머니|아들|삼촌|여자친구)/,
      /(?:엄마|어머니|아버지|삼촌|여자친구).{0,45}(?:년생|정년|전세|퇴직|코인)/,
      /\b\d{6}[ -]?[1-4]\d{6}\b/,
      /\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    ];
    check(!privatePatterns.some(pattern=>pattern.test(value)),at,'possible private household detail or personal identifier; inspect the authoring record');
    check(!/(?:범죄자\s*집단|대통령이\s*하는|정권\s*때문|코인\s*(?:매매|거래)\s*수익)/.test(value),at,'unrelated political or personal trading narrative');
    const promises=[
      /(?:수익|수입|소득|원금)[을이가은는\s]*(?:\d+(?:[.,]\d+)?%?\s*)?(?:보장합니다|보장됩니다|확정입니다|보장해\s*드립니다)/,
      /(?:무조건|반드시|누구나).{0,30}(?:고수익|월\s*\d[\d,]*\s*만\s*원)/,
      /(?:100%\s*수익|손실\s*(?:제로|없습니다)|원금\s*손실\s*없(?:이|음|습니다))/
    ];
    check(!promises.some(pattern=>pattern.test(value)),at,'unsupported guaranteed-income or no-loss wording');
  });
}
function validateBlock(block,where,courseId,interactiveIds){
  if(!check(block&&typeof block==='object'&&!Array.isArray(block),where,'expected a block'))return;
  check(types.has(block.type),`${where}.type`,'unsupported renderer block type');text(block.title,`${where}.title`);
  if(block.id!==undefined){slug(block.id,`${where}.id`);interactiveIds.push(block.id);}
  switch(block.type){
    case 'prose':case 'callout':body(block.body,`${where}.body`);break;
    case 'cards':
      list(block.items,`${where}.items`,{min:1}).forEach((item,i)=>{
        const at=`${where}.items[${i}]`;text(item?.title,`${at}.title`);body(item?.body,`${at}.body`);
        if(item?.bullets!==undefined)strings(item.bullets,`${at}.bullets`);
        if(item?.link)link(item.link,`${at}.link`,courseId);
      });break;
    case 'steps':
      list(block.items,`${where}.items`,{min:1}).forEach((item,i)=>{const at=`${where}.items[${i}]`;text(item?.title,`${at}.title`);body(item?.body,`${at}.body`);if(item?.output!==undefined)text(item.output,`${at}.output`);});break;
    case 'checklist':
      slug(block.id,`${where}.id`);strings(block.items,`${where}.items`,{unique:true});break;
    case 'template':
      slug(block.id,`${where}.id`);text(block.text,`${where}.text`);break;
    case 'table':{
      const columns=strings(block.columns,`${where}.columns`,{min:2});
      list(block.rows,`${where}.rows`,{min:1}).forEach((row,i)=>{const cells=strings(row,`${where}.rows[${i}]`);check(cells.length===columns.length,`${where}.rows[${i}]`,'cell count differs from table headers');});
      if(block.caption!==undefined)check(typeof block.caption==='string',`${where}.caption`,'table caption must be text when provided');break;
    }
    case 'related':list(block.items,`${where}.items`,{min:1}).forEach((item,i)=>link(item,`${where}.items[${i}]`,courseId));break;
  }
}
function validateCourse(course,id){
  if(!check(course&&typeof course==='object'&&!Array.isArray(course),id,'expected a course object'))return;
  counts.courses++;
  check(course.schemaVersion===1,id,'schemaVersion must be 1');check(course.id===id,id,'file/course ID mismatch');
  check(course.route===`/${id}/`,id,'unexpected public route');
  for(const field of ['label','title','description'])text(course[field],`${id}.${field}`);
  if(date(course.reviewedAt,`${id}.reviewedAt`))check(course.reviewedAt<=new Date().toISOString().slice(0,10),id,'review date is in the future');
  const hero=course.hero||{};
  for(const field of ['eyebrow','title','description'])text(hero[field],`${id}.hero.${field}`);
  const facts=list(hero.facts,`${id}.hero.facts`,{min:4});check(facts.length===4,id,'hero must retain four concise facts');
  facts.forEach((fact,i)=>{text(fact?.label,`${id}.hero.facts[${i}].label`);text(fact?.value,`${id}.hero.facts[${i}].value`);});
  const sources=list(course.sources,`${id}.sources`,{min:1});counts.sources+=sources.length;
  unique(sources.map(source=>source.id),`${id}.sources`);
  const sourceIds=new Set(sources.map(source=>source.id));
  sources.forEach((source,i)=>{
    const at=`${id}.sources[${i}]`;slug(source.id,`${at}.id`);
    for(const field of ['title','publisher','description'])text(source[field],`${at}.${field}`);
    externalUrl(source.url,`${at}.url`,{official:true});
    if(date(source.checkedAt,`${at}.checkedAt`))check(source.checkedAt<=course.reviewedAt,at,'source check is later than the recorded course review');
  });
  const chapters=list(course.chapters,`${id}.chapters`,{min:9});counts.chapters+=chapters.length;
  check(chapters.length===9,id,'V1 requires nine complete chapters');unique(chapters.map(chapter=>chapter.id),`${id}.chapters`);
  check(chapters.some(chapter=>chapter.id==='education'),id,'missing the education route chapter');
  const interactiveIds=[];
  let blockCount=0;
  chapters.forEach((chapter,i)=>{
    const at=`${id}.chapters[${i}]`;slug(chapter.id,`${at}.id`);
    for(const field of ['label','title','description','outcome'])text(chapter[field],`${at}.${field}`);
    const refs=list(chapter.sourceIds,`${at}.sourceIds`);unique(refs,`${at}.sourceIds`);
    refs.forEach(ref=>check(sourceIds.has(ref),`${at}.sourceIds`,`unknown source ID ${String(ref)}`));
    const blocks=list(chapter.blocks,`${at}.blocks`,{min:3});check(blocks.length<=5,at,'chapter has more than five V1 reading blocks');
    blockCount+=blocks.length;
    blocks.forEach((block,n)=>validateBlock(block,`${at}.blocks[${n}]`,id,interactiveIds));
  });
  unique(interactiveIds,`${id}.interactiveIds`);counts.blocks+=blockCount;
  check(blockCount===expected[id],id,`expected ${expected[id]} reviewed V1 blocks, received ${blockCount}`);
  scanPublicCopy(course);
}
function execute(source,file,window={}){
  const context=vm.createContext({window,localStorage:{getItem:()=>null}});
  new vm.Script(source,{filename:file}).runInContext(context,{timeout:1000});
  return context;
}
function fileExists(file,where){return check(fs.existsSync(path.join(root,file)),where,`missing ${file}`);}
function validateRenderers(courses){
  const registryFile='public/assets/js/platform-modules/module-registry-v1.js';
  const guideFile='public/assets/js/platform-modules/learning-guide-v1.js';
  const subjectFile='public/assets/js/platform-modules/subject-navigation-v1.js';
  const dependencyFiles=['photo-public-module-source-v1.js','photo-core-modules-v1.js','portable-primitives-v1.js','portable-primitives-extension-v2.js','portable-primitives-composition-v3.js','learning-resource-rail-v1.js'].map(name=>`public/assets/js/platform-modules/${name}`);
  const source=read(guideFile),registrySource=read(registryFile),subjectSource=read(subjectFile);
  if([source,registrySource,subjectSource].includes(null))return null;
  const cases=new Set([...source.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map(match=>match[1]));
  for(const type of types)if(type!=='prose')check(cases.has(type),guideFile,`missing explicit renderer case ${type}`);
  const context=attempt('canonical modules',()=>execute(`${registrySource}\n${dependencyFiles.map(read).join('\n')}\n${source}\n${subjectSource}`,guideFile));
  const registry=context?.window.PlatformModuleRegistry;if(!registry)return null;
  for(const id of ['learning-guide-hero','learning-guide-section','subject-navigation','learning-resource-rail']){
    const definition=registry.get(id);if(!check(definition,id,'not registered'))continue;
    for(const consumer of ['public','library','editor','export'])check(registry.canConsume(id,consumer),id,`unavailable to ${consumer}`);
    for(const file of definition.ownerFiles)fileExists(file,id);
    for(const consumer of ['public','library','editor','export'])attempt(`${id} ${consumer} dependencies`,()=>registry.dependencyClosure(id,consumer));
  }
  for(const course of courses.values())attempt(`${course.id} canonical render`,()=>{
    const fragments=[registry.render('learning-guide-hero',course.hero,{consumer:'public'})];
    course.chapters.forEach((chapter,index)=>{
      const discovery=chapter.id==='education'?[{kind:'opportunities',live:true}]:index===course.chapters.length-1?[{kind:'videos',live:true}]:[];
      const html=registry.render('learning-guide-section',{packId:course.id,chapter,index,sources:course.sources,showSources:index===course.chapters.length-1,discovery},{consumer:'public'});
      check(html.includes(`id="${chapter.id}"`),`${course.id}/${chapter.id}`,'semantic chapter anchor missing');
      check(!/(?:>undefined<|\[object Object\])/.test(html),`${course.id}/${chapter.id}`,'renderer leaked a missing value');
      if(chapter.blocks.some(block=>block.type==='cards'))check(html.includes('data-platform-module="horizontal-rail"'),`${course.id}/${chapter.id}`,'comparison cards must compose the canonical rail');
      if(discovery.length)check(html.includes('data-platform-module="learning-resource-rail"'),`${course.id}/${chapter.id}`,'discovery module is absent');
      fragments.push(html);counts.renderedChapters++;
    });
    unique([...fragments.join('').matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]),`${course.id} rendered DOM`);
  });
  attempt('resource status and escaping',()=>{
    const html=registry.render('learning-resource-rail',{kind:'opportunities',items:[{id:'past',title:'<script>unsafe</script>',url:'https://example.org/',status:'open',endsAt:'2020-01-01'},{id:'failed',title:'원문 확인 중',url:'https://example.org/unknown',status:'unknown'},{id:'bad',title:'unsafe link',url:'javascript:alert(1)'}]},{consumer:'public'});
    check(html.includes('data-notice-status="closed"'),'resource status','elapsed deadline did not close');
    check(html.includes('data-notice-status="unknown"'),'resource status','unknown status became open/closed');
    check(!html.includes('<script>')&&!html.includes('javascript:')&&html.includes('&lt;script&gt;'),'resource content','untrusted content was not escaped/filtered');
  });
  attempt('portable canonical bootstrap order',()=>{
    const files=registry.assetFiles(['learning-guide-hero','learning-guide-section','subject-navigation','learning-resource-rail'],'export');
    unique(files,'portable assets');
    const at=name=>files.indexOf(`public/assets/js/platform-modules/${name}.js`);
    check(at('photo-core-modules-v1')<at('portable-primitives-composition-v3'),'portable assets','filter base owner executes after its composition patch');
    check(at('portable-primitives-v1')<at('portable-primitives-extension-v2')&&at('portable-primitives-extension-v2')<at('portable-primitives-composition-v3'),'portable assets','rail bootstrap order changed');
  });
  return context;
}
function git(args){return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:24*1024*1024,stdio:['ignore','pipe','pipe']});}
function filesUnder(directory){if(!fs.existsSync(directory))return [];return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?filesUnder(path.join(directory,entry.name)):[path.relative(root,path.join(directory,entry.name)).split(path.sep).join('/')]).sort();}
function validatePhotography(context){
  const prefix='public/content-packs/photography/';
  const previous=attempt('photography baseline',()=>git(['ls-tree','-r','--name-only',baseline,'--',prefix]).trim().split('\n').filter(Boolean).sort());
  if(!previous?.length){check(false,'photography baseline','baseline tree is unavailable; the check was not skipped');return [];}
  check(same(previous,filesUnder(path.join(root,prefix))),'photography baseline','pack file set changed');
  const renderer=`${prefix}runtime/chapter-renderers.js`;
  for(const file of previous){
    const old=attempt(file,()=>git(['show',`${baseline}:${file}`])),current=read(file);if(old===null||current===null)continue;
    counts.photographyFiles++;
    if(file!==renderer){check(current===old,file,'photography baseline file changed');continue;}
    const boundary='\nfunction nav(data){';
    const before=old.indexOf(boundary),after=current.indexOf(boundary);
    if(!check(before>0&&after>0,file,'cannot isolate the allowed hero adapter'))continue;
    check(current.slice(after)===old.slice(before),file,'changes outside the allowed hero adapter');
    check(/PlatformModuleRegistry\.render\(['"]learning-guide-hero['"]/.test(current.slice(0,after)),file,'hero is not using the canonical owner');
    if(context)attempt('photography hero equivalence',()=>{
      const fixture={window:context.window,esc:context.window.PlatformModuleRegistry.escapeHtml,imageFor:()=>'/fixture-hero.webp'};
      const oldContext=vm.createContext({...fixture}),newContext=vm.createContext({...fixture});
      new vm.Script(old.slice(0,before)).runInContext(oldContext,{timeout:1000});
      new vm.Script(current.slice(0,after)).runInContext(newContext,{timeout:1000});
      const clean=html=>html.replace(/\sdata-platform-module="learning-guide-hero"/g,'').replace(/\sfetchpriority="high"/g,'').replace(/>\s+</g,'><').trim();
      for(const data of [{},{content:{hero_title:'제목 & <검증>',hero_subtitle:'설명 "검증"',goal_profit:'목표',education_route:'교육',gear_budget:'장비',year_core:'결과'}}])check(clean(oldContext.hero(data))===clean(newContext.hero(data)),file,'hero adapter changes existing content or markup');
    });
  }
  for(const file of ['public/assets/js/navigation/chapter-navigation.js','public/assets/js/ui/liquid-controller.js']){
    const old=attempt(file,()=>git(['show',`${baseline}:${file}`]));if(old!==null)check(read(file)===old,file,'canonical photography navigation/motion owner changed');
  }
  const packSource=read(`${prefix}pack.js`);const packs=[];
  if(packSource)attempt('photography pack',()=>execute(packSource,`${prefix}pack.js`,{registerContentPack:pack=>packs.push(pack),applyContentPackBootMessage(){}}));
  return packs[0]?.sections?.map(section=>section.id)||[];
}
function validateCatalog(courses,photoChapters){
  const source=read('public/assets/js/core/subject-catalog.js');if(source===null)return;
  const catalog=attempt('subject catalog',()=>execute(source,'subject-catalog.js').window.PersonalEduSubjects);
  if(!Array.isArray(catalog)){check(false,'subject catalog','missing subject list');return;}
  check(same(catalog.map(item=>item.id),['photography',...ids]),'subject catalog','expected photography plus five new subjects');
  const routes=new Map([['/',new Set(photoChapters)]]);
  for(const course of courses.values())routes.set(course.route,new Set(course.chapters.map(chapter=>chapter.id)));
  for(const item of catalog){const route=item.id==='photography'?'/':`/${item.id}/`;check(item.url===route,'subject catalog','wrong subject destination');text(item.label,`subject catalog ${item.id}.label`);}
  for(const {url,where,courseId} of linked){
    counts.links++;
    if(/^https:\/\//i.test(url)){externalUrl(url,where);continue;}
    if(!check(/^(?:\/(?!\/)|#)/.test(url),where,'internal links must be rooted routes or chapter anchors'))continue;
    const parsed=attempt(where,()=>new URL(url,`${origin}/${courseId}/`));if(!parsed)continue;
    check(parsed.origin===origin,where,'crosslink escaped the site origin');
    const target=routes.get(parsed.pathname);if(!check(target,where,`unknown subject route ${parsed.pathname}`))continue;
    if(parsed.hash){const anchor=attempt(where,()=>decodeURIComponent(parsed.hash.slice(1)));if(anchor!==null)check(target.has(anchor),where,`unknown chapter anchor ${parsed.hash}`);}
  }
}
function stripPresentation(course){const value=JSON.parse(JSON.stringify(course));delete value.hero.image;delete value.hero.imageAlt;delete value.hero.layout;delete value.hero.mobileImageFocus;for(const chapter of value.chapters){delete chapter.image;delete chapter.imageAlt;}return value;}
function decode(value=''){return value.replace(/&(?:amp|quot|lt|gt|#39|#x27);/g,item=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&#39;':"'",'&#x27;':"'"}[item]));}
function tags(html,name){return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'gi'))].map(match=>({raw:match[0],...Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(attr=>[attr[1],decode(attr[2]??attr[3])]))}));}
function validatePage(course){
  const file=`public/${course.id}/index.html`,html=read(file);if(html===null)return;
  const htmlTag=tags(html,'html')[0]||{};
  check(htmlTag['data-content-pack']===course.id&&htmlTag['data-learning-guide']==='true',file,'missing active learning-pack attributes');
  const titles=[...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  check(titles.length===1&&decode(titles[0]?.[1])===`${course.title} | Personal Edu`,file,'incorrect or duplicate title');
  const canonical=tags(html,'link').filter(tag=>tag.rel==='canonical');
  check(canonical.length===1&&canonical[0].href===`${origin}${course.route}`,file,'incorrect canonical URL');
  const metas=tags(html,'meta');
  check(metas.find(tag=>tag.name==='description')?.content===course.description,file,'missing or mismatched description');
  check(metas.find(tag=>tag.property==='og:url')?.content===`${origin}${course.route}`,file,'incorrect social URL');
  check(!/(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:,|$))/.test(metas.find(tag=>tag.name==='viewport')?.content||''),file,'new learning pages must permit zoom');
  const scripts=tags(html,'script').filter(tag=>tag.src);
  const scriptPaths=scripts.map(tag=>new URL(tag.src,origin).pathname);
  unique(scriptPaths,`${file} scripts`);
  check(!scriptPaths.some(value=>value.startsWith('/content-packs/photography/')),file,'new subject still loads photography data/runtime');
  const required=[
    '/assets/js/core/content-pack-runtime.js',`/content-packs/${course.id}/pack.js`,`/content-packs/${course.id}/data/course.js`,
    '/assets/js/core/site-data-client.js','/assets/js/platform-modules/module-registry-v1.js','/assets/js/platform-modules/learning-guide-v1.js',
    '/assets/js/core/content-bookmark-store.js','/assets/js/platform-modules/subject-navigation-v1.js','/assets/js/platform-modules/learning-resource-rail-v1.js','/assets/js/platform-modules/portable-primitives-v1.js','/assets/js/app/learning-pack-renderer.js','/assets/js/app/app-shell.js','/assets/js/app/subject-navigation.js'
  ];
  for(const src of required){check(scriptPaths.includes(src),file,`missing script ${src}`);const tag=scripts.find(item=>new URL(item.src,origin).pathname===src);if(tag)check(/\bdefer\b/.test(tag.raw),file,`script is not deferred: ${src}`);}
  for(const [before,after] of [
    [required[0],required[1]],[required[1],required[2]],[required[2],required[3]],
    [required[4],required[9]],[required[9],required[8]],[required[8],required[5]],
    [required[6],required[5]],[required[4],required[7]],[required[5],required[10]],[required[10],required[11]],[required[11],required[12]]
  ])check(scriptPaths.indexOf(before)<scriptPaths.indexOf(after),file,`incorrect script order: ${before} before ${after}`);
  for(const tag of [...scripts,...tags(html,'link').filter(item=>item.rel==='stylesheet')]){
    const url=new URL(tag.src||tag.href,origin);if(url.origin===origin)fileExists(`public${decodeURIComponent(url.pathname)}`,file);
  }
}
function validateGenerated(courses,rawSources){
  const manifest=json('public/content-packs/personal-edu-manifest.json');
  if(manifest){check(manifest.schemaVersion===1,'manifest','schemaVersion must be 1');check(same(manifest.courses?.map(item=>item.id),ids),'manifest','course inventory/order mismatch');}
  for(const course of courses.values())attempt(`${course.id} generated output`,()=>{
    const base=`public/content-packs/${course.id}`,compiled=json(`${base}/data/course.json`);
    if(!compiled)return;
    check(same(stripPresentation(compiled),stripPresentation(course)),base,'generated course differs from the reviewed source');
    const hero=`/assets/images/generated/personal-edu-v1/${course.id}-hero.webp`;
    const practiceImage=`/assets/images/generated/personal-edu-v1/${course.id}-practice.webp`;
    const versioned=image=>`${image}?v=${crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',image))).digest('hex').slice(0,12)}`;
    check(compiled.hero.image===versioned(hero),base,'wrong hero image slot or stale asset revision');
    check(compiled.hero.layout==='learning',base,'missing scoped learning hero layout');
    check(Number.isFinite(compiled.hero.mobileImageFocus)&&compiled.hero.mobileImageFocus>=0&&compiled.hero.mobileImageFocus<=100,base,'invalid mobile image focal position');
    check(compiled.chapters.filter(chapter=>chapter.image).length===1,base,'expected exactly one bound practice image');
    const chapter=compiled.chapters.find(item=>item.id===practice[course.id]);
    check(chapter?.image===versioned(practiceImage),base,'wrong practice image slot or stale asset revision');
    for(const [image,alt] of [[hero,compiled.hero.imageAlt],[practiceImage,chapter?.imageAlt]]){
      check(typeof alt==='string'&&alt.includes('AI'),base,'generated image alt must disclose AI origin');
      if(fileExists(`public${image}`,base)){const bytes=fs.readFileSync(path.join(root,`public${image}`));check(bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP',image,'invalid WebP asset');}
    }
    const packScript=read(`${base}/pack.js`),dataScript=read(`${base}/data/course.js`),packs=[];
    if(packScript){execute(packScript,`${base}/pack.js`,{registerContentPack:pack=>packs.push(pack),applyContentPackBootMessage(){}});check(packs.length===1,base,'pack script must register one course');}
    const pack=packs[0];
    if(pack){
      check(pack.id===course.id&&pack.kind==='learning-guide'&&same(pack.routes,[course.route]),base,'pack identity/route mismatch');
      check(pack.data?.staticSnapshot===true&&pack.data.bundledKey==='__LEARNING_GUIDE_SITE_DATA'&&pack.data.cacheKey===`personalEduSiteDataV1:${course.id}`,base,'unsafe or mismatched snapshot/cache configuration');
      check(same(pack.sections,course.chapters.map(item=>({id:item.id,renderer:'learningSection'}))),base,'chapter order or renderer mismatch');
    }
    if(dataScript){
      const window=execute(dataScript,`${base}/data/course.js`).window,data=window.__LEARNING_GUIDE_SITE_DATA;
      check(same(data?.guide,compiled),base,'JS snapshot and JSON snapshot differ');
      check(same(data?.nav,course.chapters.map(item=>({id:item.id,'칩':item.label,'제목':item.title,'설명':item.description}))),base,'snapshot chapter navigation differs from source');
      check(data?.content?.hero_title===course.hero.title&&data?.content?.hero_subtitle===course.hero.description,base,'snapshot hero content mismatch');
      check(typeof window.contentPackImageFor==='function'&&window.contentPackImageFor()===versioned(hero),base,'pack image adapter mismatch');
    }
    const entry=manifest?.courses?.find(item=>item.id===course.id);
    if(check(entry,base,'manifest entry missing')){
      for(const field of ['label','route','title','reviewedAt'])check(entry[field]===course[field],base,`manifest ${field} mismatch`);
      check(entry.chapters===9&&entry.blocks===expected[course.id]&&entry.sources===course.sources.length,base,'manifest content counts mismatch');
      check(entry.sourceSha256===crypto.createHash('sha256').update(rawSources.get(course.id)).digest('hex'),base,'manifest hash does not match reviewed source bytes');
      check(entry.heroImage===versioned(hero),base,'manifest hero slot mismatch');
    }
    validatePage(course);
  });
  const home=read('public/index.html');if(home!==null)check(home.includes('/content-packs/photography/pack.js')&&!/data-content-pack="(?:video|ai|community|real-estate|auction)"/.test(home),'public/index.html','root route no longer owns photography');
}

const courses=new Map(),rawSources=new Map();
for(const id of ids){
  const file=path.join(sourceDir,`${id}.json`),raw=read(file);if(raw===null)continue;
  const course=attempt(`${id}.json`,()=>JSON.parse(raw));if(!course)continue;
  rawSources.set(id,raw);courses.set(id,course);attempt(`${id} schema`,()=>validateCourse(course,id));
}
check(counts.courses===5,'inventory','expected five complete courses');
check(counts.chapters===45,'inventory',`expected 45 chapters, received ${counts.chapters}`);
check(counts.blocks===194,'inventory',`expected 194 blocks, received ${counts.blocks}`);
const context=validateRenderers(courses);
const photoChapters=validatePhotography(context);
validateCatalog(courses,photoChapters);
if(drafts)notes.push('Generated routes, images, snapshots and manifest: SKIPPED in --drafts mode. Run the default command after building.');
else validateGenerated(courses,rawSources);
notes.push('External sources: HTTPS, reviewed host and URL syntax checked offline. Availability, current course seats and factual/legal accuracy still require source review.');
notes.push('Privacy and income checks are targeted publication guards, not a substitute for editorial review. No detected private text is printed.');
console.log(JSON.stringify({mode:drafts?'drafts-only':'full-static',checks,counts,notes,errors},null,2));
if(errors.length){console.error(`Personal Edu ${drafts?'draft':'static'} validation failed (${errors.length} issues).`);process.exitCode=1;}
else console.log(`Personal Edu ${drafts?'draft-only':'full static'} validation passed.`);
