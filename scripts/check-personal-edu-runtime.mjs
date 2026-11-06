#!/usr/bin/env node
/* Run against the committed static site in CI. No API/backend success is implied. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {chromium} from 'playwright';

const ROOT=path.resolve(import.meta.dirname,'..');
const BASE=(process.env.PERSONAL_EDU_BASE_URL||process.env.UI_DASHBOARD_BASE_URL||process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT=path.join(ROOT,'artifacts/personal-edu-runtime');
const PACKS=[{id:'photography',route:'/',chapters:10},...['video','sns','ai','community','real-estate','auction'].map(id=>({id,route:`/${id}/`,chapters:id==='real-estate'?10:9}))];
const MODULES=['learning-guide-hero','learning-guide-section','subject-navigation','learning-resource-rail'];
const PRACTICE_CHAPTER={video:'editing',sns:'content',ai:'images',community:'education','real-estate':'inspection',auction:'inspection'};
const VIEWPORTS=[{name:'desktop1440',width:1440,height:1000,mobile:false},{name:'mobile375',width:375,height:812,mobile:true},{name:'mobile375-short667',width:375,height:667,mobile:true,packs:['photography','video'],shortOnly:true}];
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[],diagnostics:[],limitations:['Static-server checks use bundled content, not the production APIs.','The standalone export fixture verifies declared canonical dependencies. It is not an HTML/ZIP export product.']};
fs.mkdirSync(OUT,{recursive:true});
const assert=(value,message)=>{if(!value)throw new Error(message);};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const slug=text=>text.replace(/[^a-z0-9-]+/gi,'-').toLowerCase();
async function wait(fn,message,timeout=20000){const end=Date.now()+timeout;let last;while(Date.now()<end){try{if(await fn())return;}catch(error){last=error;}await delay(100);}throw new Error(`${message}${last?`: ${last.message}`:''}`);}
async function shot(page,name){const file=`${slug(name)}.png`;await page.screenshot({path:path.join(OUT,file),fullPage:false});report.screenshots.push(file);}
async function check(name,fn,page){const started=Date.now();try{const detail=await fn();report.checks.push({name,status:'pass',ms:Date.now()-started,detail});console.log(`PASS ${name}`);return true;}catch(error){report.checks.push({name,status:'fail',ms:Date.now()-started,error:error.stack||String(error)});console.error(`FAIL ${name}: ${error.message}`);if(page&&!page.isClosed())await shot(page,`failure-${name}`).catch(()=>{});return false;}}
function observe(page,label){page.on('pageerror',error=>report.diagnostics.push({surface:label,type:'pageerror',message:error.message}));}
async function ready(page,pack){await wait(()=>page.evaluate(id=>document.documentElement.dataset.contentPack===id,pack.id),`route did not load ${pack.id}`,30000);await wait(()=>page.locator('#app .chapter[data-chapter]').count().then(n=>n===pack.chapters),`${pack.id}: expected ${pack.chapters} chapters`,30000);const fab=page.locator('#subjectFab');await fab.waitFor({state:'visible'});await wait(()=>fab.evaluate(n=>n.closest('[data-subject-instance]')?.dataset.subjectBound==='true'),'subject picker did not hydrate');await page.locator('#collectionFab').waitFor({state:'visible'});}
async function openPack(page,pack){await page.goto(`${BASE}${pack.route}`,{waitUntil:'domcontentloaded'});await ready(page,pack);}
async function overflow(page,label){const metric=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,width:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),inner:innerWidth}));assert(metric.width<=metric.viewport+1,`${label}: horizontal page overflow ${JSON.stringify(metric)}`);return metric;}
async function settledScroll(page){let last=null,stable=0;await wait(async()=>{const y=await page.evaluate(()=>scrollY);stable=last!==null&&Math.abs(y-last)<1?stable+1:0;last=y;return stable>=3;},'scroll position did not settle');}
async function jump(page,id){await page.locator(`.nav-shell .nav-chip[data-target="${id}"]`).click();await wait(()=>page.locator(`.nav-shell .nav-chip[data-target="${id}"]`).evaluate(n=>n.classList.contains('is-active')),`chapter did not become active: ${id}`);await wait(()=>page.locator(`#app .chapter[data-chapter="${id}"]`).evaluate(n=>{const r=n.getBoundingClientRect();return r.top<innerHeight*.5&&r.bottom>90;}),`chapter not in viewport: ${id}`);await settledScroll(page);}
async function counts(page,expected){await wait(()=>page.locator('#collectionFabCount').textContent().then(t=>Number(t)===expected),`collection count should be ${expected}`);assert(await page.locator('#collectionFabCount').isHidden()===(expected===0),'collection badge visibility disagrees with count');}
async function closeCollection(page){await page.locator('#collectionClose').click();await page.locator('#collectionSheet').waitFor({state:'hidden'});}
async function publicFabAlignment(page){
  const fab=page.locator('#subjectFab');await fab.waitFor({state:'visible'});
  const rects=await fab.evaluate(n=>{const s=n.getBoundingClientRect(),c=document.getElementById('collectionFab')?.getBoundingClientRect();return c?{s:{top:s.top,bottom:s.bottom,right:s.right,left:s.left,center:s.left+s.width/2,width:s.width,height:s.height},c:{top:c.top,center:c.left+c.width/2,width:c.width,height:c.height},width:document.documentElement.clientWidth,height:innerHeight}:null;});
  assert(rects&&rects.s.bottom<=rects.c.top-8&&Math.abs(rects.s.center-rects.c.center)<=.75,'subject FAB must sit above and share the collection FAB horizontal center');
  assert(Math.abs(rects.s.width-rects.c.width)<=1&&Math.abs(rects.s.height-rects.c.height)<=1,'the two FABs have different button bounds');
  assert(rects.s.left>=0&&rects.s.right<=rects.width+1&&rects.s.top>=0&&rects.s.bottom<=rects.height,'subject FAB is off-screen');
}
function colorChannels(value){const rgb=value.match(/[\d.]+/g)?.slice(0,3).map(Number);assert(rgb?.length===3,`unsupported computed color ${value}`);return rgb;}
function contrastRatio(foreground,background){const luminance=value=>colorChannels(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
async function pickerPresentation(dialog){
  assert(await dialog.locator('.subject-picker__eyebrow,.subject-current').count()===0,'removed picker helper copy has returned');
  const appearance=await dialog.evaluate(node=>{
    const selected=node.querySelector('[aria-current="page"]'),other=node.querySelector('.subject-picker__grid a:not([aria-current])'),close=node.querySelector('.subject-picker__close'),svg=close?.querySelector('svg');
    const d=node.getBoundingClientRect(),c=close?.getBoundingClientRect(),s=svg?.getBoundingClientRect();
    return {background:selected?getComputedStyle(selected).backgroundColor:'',otherBackground:other?getComputedStyle(other).backgroundColor:'',title:selected?getComputedStyle(selected.querySelector('.subject-label')).color:'',description:selected?getComputedStyle(selected.querySelector('.subject-description')).color:'',topGap:c?c.top-d.top:null,rightGap:c?d.right-c.right:null,svgCenterDelta:c&&s?Math.max(Math.abs(c.left+c.width/2-s.left-s.width/2),Math.abs(c.top+c.height/2-s.top-s.height/2)):null};
  });
  assert(appearance.background!==appearance.otherBackground,'current subject card has no distinct filled surface');
  assert(colorChannels(appearance.title).every(value=>value>=245)&&colorChannels(appearance.description).every(value=>value>=245),'current subject card text is not white');
  assert(contrastRatio(appearance.title,appearance.background)>=4.5&&contrastRatio(appearance.description,appearance.background)>=4.5,'current subject card does not meet text contrast');
  assert(Math.abs(appearance.topGap-appearance.rightGap)<=1,'picker close top and right spacing differ');
  assert(appearance.svgCenterDelta!==null&&appearance.svgCenterDelta<=1,'picker close SVG is not visually centered');
}
async function dialogFocusLoop(page,dialog){
  const first=dialog.locator('.subject-picker__close'),last=dialog.locator('.subject-picker__grid a').last();
  await wait(()=>first.evaluate(n=>document.activeElement===n),'subject dialog does not initially focus its close button');
  await page.keyboard.press('Shift+Tab');assert(await last.evaluate(n=>document.activeElement===n),'Shift+Tab did not wrap from the first to the last modal control');
  await page.keyboard.press('Tab');assert(await first.evaluate(n=>document.activeElement===n),'Tab did not wrap from the last to the first modal control');
  const steps=await dialog.locator('button,a[href]').count()+1;
  for(let i=0;i<steps;i++){await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)),'keyboard focus escaped the modal');}
}

async function publicStructure(page,pack){
  const structure=await page.locator('#app .chapter[data-chapter]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.chapter,title:n.querySelector('h2')?.textContent.trim(),height:n.getBoundingClientRect().height})));
  assert(new Set(structure.map(n=>n.id)).size===pack.chapters,'chapter IDs are duplicated');
  assert(structure.every(n=>n.title&&n.height>0),'a chapter is empty or hidden');
  const targets=await page.locator('.nav-shell .nav-chip').evaluateAll(nodes=>nodes.map(n=>n.dataset.target));
  assert(JSON.stringify(targets)===JSON.stringify(structure.map(n=>n.id)),'chapter navigation no longer maps to the rendered chapters');
  const bar=page.locator('#app .hero .subject-nav');
  assert(await bar.locator('a').count()===PACKS.length,'subject bar must contain all configured subjects');
  assert(await bar.locator('[aria-current="page"]').getAttribute('data-subject-id')===pack.id,'current subject is wrong');
  assert(await bar.isVisible(),'subject bar missing from hero');
  const style=await bar.evaluate(n=>getComputedStyle(n).position);
  assert(!['sticky','fixed'].includes(style),'subject bar follows scrolling');
  if(page.viewportSize().width<=640){
    const rail=await bar.evaluate(n=>({client:n.clientWidth,scroll:n.scrollWidth,links:[...n.querySelectorAll('a')].map(a=>{const r=a.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};})}));
    assert(rail.scroll>rail.client,'mobile subject menu is not a horizontal overflow rail');
    assert(Math.max(...rail.links.map(a=>a.top))-Math.min(...rail.links.map(a=>a.top))<=1,'mobile subject menu wraps to multiple rows');
    assert(rail.links.every(a=>a.width>=70&&a.height>=44),'mobile subject touch targets were squeezed');
    await wait(()=>bar.evaluate(n=>{const selected=n.querySelector('[aria-current="page"]'),a=selected?.getBoundingClientRect(),b=n.getBoundingClientRect();return a&&a.left>=b.left+1&&a.right<=b.right-1;}),'current subject is clipped by the mobile menu');
  }
  await publicFabAlignment(page);
  await overflow(page,`${pack.id} hero`);
  if(pack.id!=='photography'){
    assert(await page.locator('[data-platform-module="learning-guide-hero"]').count()===1,'public hero does not use its shared module');
    assert(await page.locator('#app [data-platform-module="learning-guide-section"]').count()===pack.chapters,'public learning chapters do not use the shared module');
    await wait(()=>page.locator('#app .hero__image').evaluate(n=>n.complete&&n.naturalWidth>0),'generated hero image failed to load');
    const education=page.locator('#app .chapter[data-chapter="education"]');
    assert(await education.locator('.edu-block').count()>=3,'education chapter is empty');
    assert(await education.locator('a[href^="http"]').count()>0,'education has no usable source or course links');
    assert(await page.locator('.edu-source-card').count()>0,'official source collection is empty');
    const sources=await page.locator('.edu-source-card').evaluateAll(nodes=>nodes.map(n=>({title:n.querySelector('h3')?.textContent.trim(),url:n.querySelector('.curated-open')?.href,date:n.querySelector('.edu-source-footer')?.textContent})));
    assert(sources.every(s=>s.title&&/^https?:\/\//.test(s.url)&&/\d{4}-\d{2}-\d{2}/.test(s.date)),'a source card is missing its title, link or checked date');
  }
  const entry=page.locator('[data-ebook-entry]'),expectedBook=['sns','video','ai'].includes(pack.id)?`${pack.id}-entry`:null;
  assert(await entry.count()===(expectedBook?1:0),'subject has an incorrect number of published sample entries');
  if(expectedBook){
    assert(await entry.getAttribute('data-ebook-entry')===expectedBook,'sample entry belongs to another subject');
    const destination=new URL(await entry.getAttribute('href'),BASE);
    assert(destination.pathname==='/reader/'&&destination.searchParams.get('book')===expectedBook&&destination.searchParams.get('edition')==='sample-20261106-v1','sample entry does not reach the common reader');
    assert((await entry.textContent()).includes('샘플')&&(await entry.textContent()).includes('본문 24쪽'),'sample entry implies a completed regular textbook');
    const box=await entry.boundingBox();assert(box&&box.height>=44,'sample entry has an undersized touch target');
  }
  return {chapters:structure.length,viewport:await overflow(page,`${pack.id} body`)};
}

async function navigation(page,pack){
  await jump(page,'education');
  await wait(()=>page.locator('#app .hero .subject-nav').evaluate(n=>n.getBoundingClientRect().bottom<0),'main subject nav remains on screen after scrolling');
  const subnav=await page.locator('.nav-shell').boundingBox();
  assert(subnav&&subnav.y>=-2&&subnav.y<=30&&subnav.height>0,'chapter navigation does not remain at the top');
  await publicFabAlignment(page);
  await overflow(page,`${pack.id} chapter`);
  const fab=page.locator('#subjectFab'),dialog=page.locator('#subjectPicker');
  const url=page.url(),before=await page.evaluate(()=>scrollY);
  await fab.click();await dialog.waitFor({state:'visible'});
  assert(await fab.getAttribute('aria-expanded')==='true','subject picker expanded state is missing');
  assert(await dialog.locator('a').count()===PACKS.length,'subject picker is incomplete');
  await pickerPresentation(dialog);
  await shot(page,`picker-${page.viewportSize().width}x${page.viewportSize().height}-${pack.id}`);
  await dialogFocusLoop(page,dialog);
  await overflow(page,`${pack.id} picker`);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await wait(()=>fab.evaluate(n=>document.activeElement===n),'Escape does not return focus to the subject FAB');
  assert(await fab.getAttribute('aria-expanded')==='false','closed picker retains expanded state');
  await fab.click();await dialog.waitFor({state:'visible'});
  await dialog.locator(`[data-subject-id="${pack.id}"]`).click();await dialog.waitFor({state:'hidden'});
  await wait(()=>fab.evaluate(n=>document.activeElement===n),'current-subject selection loses focus');
  assert(page.url()===url,'selecting the current subject navigates away');
  assert(Math.abs((await page.evaluate(()=>scrollY))-before)<=4,'picker close changes the reading position');
  const prior=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,250);
  await wait(()=>page.evaluate(y=>Math.abs(scrollY-y)>30,prior),'modal close leaves document scrolling locked');
}

async function practices(page,pack){
  const ids=await page.locator('#app .chapter:has(.edu-checklist input)').evaluateAll(nodes=>nodes.map(n=>n.dataset.chapter));
  assert(ids.length>=2,'two different chapters are needed for the progress test');
  const a=page.locator(`.chapter[data-chapter="${ids[0]}"] .edu-checklist input`).first();
  const b=page.locator(`.chapter[data-chapter="${ids[1]}"] .edu-checklist input`).first();
  assert(!await a.isChecked()&&!await b.isChecked(),'a fresh reader unexpectedly has progress');
  await a.check();await b.check();await a.uncheck();await a.check();
  await page.reload({waitUntil:'domcontentloaded'});await ready(page,pack);
  assert(await a.isChecked()&&await b.isChecked(),'alternating changes erased another chapter on reload');
  await a.uncheck();await page.reload({waitUntil:'domcontentloaded'});await ready(page,pack);
  assert(!await a.isChecked()&&await b.isChecked(),'unchecking one chapter erased or changed another');
  assert((await b.locator('xpath=ancestor::fieldset').locator('output').textContent()).trim().startsWith('1 /'),'checklist progress output was not restored');
  return {chapters:ids.slice(0,2)};
}

async function bookmarks(page,pack){
  const cards=page.locator('.edu-source-card');const card=cards.first();
  const title=(await card.locator('h3').textContent()).trim();const url=await card.locator('.curated-open').getAttribute('href');
  const button=card.locator('.edu-bookmark');
  await counts(page,0);assert(await button.getAttribute('aria-pressed')==='false','fresh source is already saved');
  await button.click();await counts(page,1);
  assert(await button.getAttribute('aria-pressed')==='true','source bookmark click did not select it');
  await page.reload({waitUntil:'domcontentloaded'});await ready(page,pack);await counts(page,1);
  assert(await button.getAttribute('aria-pressed')==='true','source bookmark was not restored');
  await page.locator('#collectionFab').click();await page.locator('#collectionSheet').waitFor({state:'visible'});
  const articleTab=page.locator('#collectionSheet [data-library-tab="article"]');await articleTab.click();
  await wait(()=>articleTab.evaluate(n=>n.classList.contains('is-active')),'collection did not switch to the article tab');
  const items=page.locator('#collectionSheet .collection-item[data-library-type="article"]');
  await wait(()=>items.count().then(n=>n===1),'saved source is missing or duplicated in the collection');
  assert((await items.first().locator('strong').textContent()).trim()===title,'collection restored the wrong source title');
  assert(await items.first().locator('a.collection-item__main').getAttribute('href')===url,'collection restored the wrong source link');
  // The existing collection polish exposes this trash control as "삭제".
  await items.first().getByRole('button',{name:'삭제',exact:true}).click();await counts(page,0);
  await closeCollection(page);assert(await button.getAttribute('aria-pressed')==='false','removing from collection leaves the source selected');
  await page.reload({waitUntil:'domcontentloaded'});await ready(page,pack);await counts(page,0);
  assert(await button.getAttribute('aria-pressed')==='false','removed bookmark reappears after reload');
  return {source:title};
}

async function copyTemplate(page,context){
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(BASE).origin});
  await page.bringToFront();
  const template=page.locator('.edu-template').first();
  const original=await template.locator('pre').textContent();assert(original?.length>0,'copy template is empty');
  await template.locator('.edu-copy-btn').click();
  await wait(()=>template.locator('[role="status"]').textContent().then(text=>text.includes('복사했습니다.')),'copy action did not report success');
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert(copied===original,'clipboard text differs from the visible template');
  return {characters:copied.length,sha256:sha(copied)};
}

async function publicReferenceCases(page,view){
  const course=JSON.parse(fs.readFileSync(path.join(ROOT,'content/learning-guides/v1/real-estate.json'),'utf8'));
  const blocks=course.chapters.find(chapter=>chapter.id==='references')?.blocks.filter(block=>block.type==='case-studies')||[];
  assert(blocks.length>=2,'real-estate references must contain analyzed cases and profile references');
  await jump(page,'references');
  const chapter=page.locator('#app .chapter[data-chapter="references"]'),rails=chapter.locator('[data-platform-module="reference-case-rail"]');
  assert(await rails.count()===blocks.length,'published reference rails differ from their source blocks');
  const inventory=[];
  for(let index=0;index<blocks.length;index++){
    const rail=rails.nth(index),cards=rail.locator('[data-reference-case-id]'),track=rail.locator('.platform-horizontal-rail__track');
    assert(await rail.getAttribute('data-reference-bound')==='true','published reference rail did not hydrate');
    assert(await cards.count()===blocks[index].items.length,'published reference cards are missing or duplicated');
    const geometry=await track.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,bound:node.dataset.platformRailBoundV2==='true'}));
    assert(geometry.bound&&geometry.scroll>geometry.width,'published cases lost the canonical horizontal rail');
    inventory.push({block:blocks[index].id,cards:await cards.count(),...geometry});
  }
  const observed=[];
  try{
    // Open the actual presenter-led analysis and an actual profile reference.
    // Source data supplies expected text/links; fixture content never replaces it.
    for(const kind of ['analysis','profile']){
      const blockIndex=blocks.findIndex(block=>block.items.some(item=>item.kind===kind));
      assert(blockIndex>=0,`published ${kind} references are missing`);
      const itemIndex=blocks[blockIndex].items.findIndex(item=>item.kind===kind),item=blocks[blockIndex].items[itemIndex];
      const rail=rails.nth(blockIndex),opener=rail.locator('[data-reference-case-id]').nth(itemIndex),dialog=rail.locator('dialog');
      await opener.scrollIntoViewIfNeeded();await settledScroll(page);
      const before=await page.evaluate(()=>({y:scrollY,bodyPosition:document.body.style.position,htmlOverflow:document.documentElement.style.overflow,url:location.href}));
      const railBefore=await rail.locator('.platform-horizontal-rail__track').evaluate(node=>node.scrollLeft);
      await opener.click();await dialog.waitFor({state:'visible'});
      await dialog.evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
      assert(await dialog.evaluate(node=>node.matches(':modal')),'published detail did not enter the native modal layer');
      assert(await chapter.locator('dialog[open]').count()===1,'one reference click opened multiple details');
      assert((await dialog.locator('h2').textContent()).trim()===item.title,'published detail selected the wrong case');
      assert(await dialog.locator('.edu-detail-section').count()===item.sections.length,'published detail lost its analysis sections');
      assert((await dialog.locator('.edu-detail-meta__evidence').textContent()).trim()===item.evidenceLabel,'published evidence label differs from source');
      if(item.observedAt)assert(await dialog.locator('time').getAttribute('datetime')===item.observedAt,'published observation date differs from source');
      if(item.exercise)assert((await dialog.locator('.edu-detail-exercise__output').textContent()).includes(item.exercise.output),'published practical exercise is missing');
      const external=await dialog.locator('a[href]').evaluateAll(nodes=>nodes.map(node=>({href:node.href,target:node.target,rel:node.rel})));
      assert(external.every(link=>/^https?:\/\//.test(link.href)&&link.target==='_blank'&&link.rel.includes('noopener')),'published source links do not open safely in a new tab');
      if(kind==='profile')assert(external.some(link=>link.href===new URL(item.profileUrl||item.url).href),'published profile link differs from the selected reference');
      const reading=await dialog.evaluate(node=>{const body=node.querySelector('.edu-detail-dialog__body'),rect=node.getBoundingClientRect();return {bodyHeight:body.clientHeight,bodyScroll:body.scrollHeight,top:rect.top,bottom:rect.bottom,viewport:innerHeight,header:node.querySelector('header').getBoundingClientRect().top,footer:node.querySelector('footer').getBoundingClientRect().bottom,locked:document.body.style.position==='fixed'};});
      assert(reading.locked&&reading.top>=0&&reading.bottom<=reading.viewport+1,'published detail leaves the viewport or background scrolling unlocked');
      if(kind==='analysis'){
        assert(reading.bodyScroll>reading.bodyHeight&&reading.bodyHeight>100,'actual long analysis does not have a readable internal scroller');
        await dialog.locator('.edu-detail-dialog__body').evaluate(node=>{node.scrollTop=node.scrollHeight;});
        const pinned=await dialog.evaluate(node=>({header:node.querySelector('header').getBoundingClientRect().top,footer:node.querySelector('footer').getBoundingClientRect().bottom}));
        assert(Math.abs(pinned.header-reading.header)<=1&&Math.abs(pinned.footer-reading.footer)<=1,'scrolling actual analysis moves the modal heading/footer');
        await shot(page,`${view.name}-real-estate-reference-detail`);
      }
      await dialog.locator(kind==='analysis'?'.edu-detail-dialog__close':'.edu-detail-done').click();await dialog.waitFor({state:'hidden'});await settledScroll(page);
      const after=await page.evaluate(()=>({y:scrollY,bodyPosition:document.body.style.position,htmlOverflow:document.documentElement.style.overflow,url:location.href}));
      assert(Math.abs(after.y-before.y)<=4,'closing an actual reference changed the reading position');
      assert(after.bodyPosition===before.bodyPosition&&after.htmlOverflow===before.htmlOverflow,'closing an actual reference did not restore scroll styles');
      assert(after.url===before.url&&await opener.evaluate(node=>document.activeElement===node),'closing an actual reference lost its route or opener focus');
      assert(Math.abs(await rail.locator('.platform-horizontal-rail__track').evaluate(node=>node.scrollLeft)-railBefore)<=1,'closing a reference moved its horizontal rail');
      observed.push({kind,id:item.id,sections:item.sections.length,sourceLinks:external.length,beforeY:before.y,afterY:after.y,delta:after.y-before.y,reading});
    }
    const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,180);await wait(()=>page.evaluate(prior=>Math.abs(scrollY-prior)>20,y),'actual reference close leaves page scrolling locked');
    await overflow(page,'real-estate reference cards');return {inventory,observed};
  }finally{
    for(const dialog of await chapter.locator('dialog[open]').all())await dialog.evaluate(node=>node.close('qa-cleanup')).catch(()=>{});
  }
}

async function discoveryModules(browser){
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const page=await context.newPage();observe(page,'discovery');page.setDefaultTimeout(15000);
  const start=Date.parse('2026-11-06T03:00:00Z');
  await page.clock.install({time:new Date(start)});
  let unavailable=false;
  const items=[
    {id:'busan-education',title:'QA 부산 교육 공고',summary:'접수 기간과 갱신 상태를 검증하는 테스트 자료입니다.',url:'https://kcmf.or.kr/',provider:'QA 기관',region:'busan',type:'education',status:'open',startsAt:'2026-11-01T00:00:00+09:00',endsAt:'2026-11-30T23:59:59+09:00',checkedAt:new Date(start).toISOString()},
    {id:'busan-deadline',title:'QA 마감 경계 공고',url:'https://kcmf.or.kr/?qa=deadline',provider:'QA 기관',region:'busan',type:'education',status:'open',endsAt:new Date(start+60000).toISOString()},
    {id:'seogu-unknown',title:'QA 서구 확인 중 공고',url:'https://www.bsseogu.go.kr/',provider:'QA 기관',region:'seo-gu',type:'education',status:'unknown'},
    {id:'any-support',title:'QA 지역 구분 없는 지원사업',url:'https://www.bizinfo.go.kr/',provider:'QA 기관',region:'any',type:'grant',status:'open'},
    {id:'closed-source',title:'QA 원문 종료 공고',url:'https://www.bizinfo.go.kr/?qa=closed',provider:'QA 기관',region:'any',type:'grant',status:'closed',endsAt:'2027-01-01T23:59:59+09:00'}
  ];
  await page.route('**/api/learning-opportunities?**',route=>route.fulfill({status:unavailable?503:200,contentType:'application/json',body:JSON.stringify(unavailable?{ok:false}:{ok:true,items,lastCheckedAt:new Date(start).toISOString(),providers:[{id:'fixture',status:'ok',checkedAt:new Date(start).toISOString()}]})}));
  const videos=['one','two','three','four'].map((id,i)=>({id,title:`QA 실습 영상 ${i+1}`,url:`https://www.youtube.com/watch?v=5T6J3FyLKAU&qa=${id}`,platform:'YouTube',description:'가로 레일과 북마크를 검증하는 테스트 영상입니다.',checkedAt:new Date(start).toISOString()}));
  await page.route('**/content-discovery/learning-videos.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({checkedAt:new Date(start).toISOString(),subjects:{video:{items:[]}}})}));
  await page.route('**/api/learning-videos?**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,items:videos,checkedAt:new Date(start).toISOString(),source:'fixture',nextCursor:null})}));
  try{
    await check('discovery/region-type-filters-deadline-failure-and-bookmark',async()=>{
      await openPack(page,PACKS.find(p=>p.id==='video'));await jump(page,'education');
      const feed=page.locator('#app [data-resource-kind="opportunities"]');await feed.scrollIntoViewIfNeeded();
      await wait(()=>feed.locator('.edu-discovery-card').count().then(n=>n===5),'notice fixtures did not render');
      const region=feed.locator('[data-resource-filter="region"] .platform-filter-chip-source--liquid');
      const type=feed.locator('[data-resource-filter="type"] .platform-filter-chip-source--liquid');
      assert(await region.locator('.collection-v33-indicator').count()===1,'notice filter has no canonical liquid indicator');
      await region.locator('[data-platform-filter-id="busan"]').click();assert(await feed.locator('.edu-discovery-card').count()===2,'Busan filter leaked another region');
      await type.locator('[data-platform-filter-id="grant"]').click();assert(await feed.locator('.edu-discovery-card').count()===0&&await feed.locator('.edu-resource-empty').isVisible(),'empty combined filters are not explained');
      await type.locator('[data-platform-filter-id="all"]').click();await region.locator('[data-platform-filter-id="seo-gu"]').click();
      assert(await feed.locator('.edu-discovery-card').count()===1&&await feed.locator('.edu-discovery-card').getAttribute('data-notice-status')==='unknown','unverified Seo-gu source was promoted to an open/closed status');
      await region.locator('[data-platform-filter-id="all"]').click();
      const deadline=feed.locator('[data-resource-id="busan-deadline"]');assert(await deadline.getAttribute('data-notice-status')==='open','deadline fixture was not initially open');
      await page.clock.fastForward(70000);
      await wait(()=>deadline.getAttribute('data-notice-status').then(x=>x==='closed'),'page left open did not automatically mark the elapsed deadline');
      assert(await feed.locator('[data-resource-id="closed-source"]').getAttribute('data-notice-status')==='closed','explicit source closure was ignored');
      unavailable=true;await feed.locator('.edu-resource-refresh').click();await wait(()=>feed.getAttribute('data-resource-state').then(x=>x==='stale'),'network outage did not expose stale state');
      assert(await feed.locator('.edu-discovery-card').count()===5,'network outage erased last-good cards');
      assert(await feed.locator('[data-resource-id="busan-education"]').getAttribute('data-notice-status')==='open','network outage falsely closed an active notice');
      const saved=feed.locator('[data-resource-id="busan-education"] .edu-resource-save');await saved.click();await counts(page,1);assert(await saved.getAttribute('aria-pressed')==='true','notice bookmark is inert');
      await overflow(page,'notice rail');await shot(page,'mobile375-live-notices-fixture');
      return {providers:'fixture',filterCombinations:4,deadline:'live clock advanced',outage:'last-good preserved'};
    },page);
    await check('discovery/video-rail-scroll-and-collection',async()=>{
      await jump(page,'resources');const feed=page.locator('#app [data-resource-kind="videos"]');await feed.scrollIntoViewIfNeeded();await wait(()=>feed.locator('.edu-discovery-card').count().then(n=>n===4),'video fixtures did not render');
      const track=feed.locator('.platform-horizontal-rail__track');const geometry=await track.evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth}));assert(geometry.scroll>geometry.width,'video cards do not form a horizontal rail');
      await track.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await wait(()=>track.evaluate(n=>n.scrollLeft>0),'canonical rail did not scroll using keyboard');
      await feed.locator('.edu-resource-save').first().click();await counts(page,2);
      await page.locator('#collectionFab').click();await page.locator('#collectionSheet').waitFor({state:'visible'});const tab=page.locator('#collectionSheet [data-library-tab="video"]');await tab.click();await wait(()=>page.locator('#collectionSheet .collection-item[data-library-type="video"]').count().then(n=>n===1),'recommended video is absent from the original collection');
      const saved=page.locator('#collectionSheet .collection-item[data-library-type="video"]');assert((await saved.locator('strong').textContent()).includes('QA 실습 영상'),'wrong video restored');await saved.getByRole('button',{name:'삭제',exact:true}).click();await counts(page,1);await closeCollection(page);assert(await feed.locator('.edu-resource-save').first().getAttribute('aria-pressed')==='false','video removal did not sync to source');
      await shot(page,'mobile375-recommended-videos-fixture');return geometry;
    },page);
  }finally{await context.close();}
}

async function videoDiscoveryPaging(browser){
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),page=await context.newPage();observe(page,'video-discovery-paging');page.setDefaultTimeout(15000);
  const checkedAt='2026-11-06T12:00:00Z',calls=[];let failPage=false,noticeRequests=0,releaseNotices;
  const noticesReady=new Promise(resolve=>{releaseNotices=resolve;});
  const lateNotices=Array.from({length:3},(_,index)=>({id:`late-notice-${index}`,title:`QA 늦게 도착한 스마트폰 촬영과 영상 편집 실습 교육 공고 ${index+1}`,summary:'촬영할 주제를 고르고 여러 장면을 편집한 뒤 자막과 목소리를 넣어 완성하는 교육입니다. '.repeat(4),url:'https://kcmf.or.kr/',provider:'QA 지역 교육기관',region:'busan',type:'education',status:'unknown',startsAt:'2026-11-01T00:00:00+09:00',endsAt:'2026-11-30T23:59:59+09:00',checkedAt}));
  const delayedNotices=async route=>{noticeRequests++;await noticesReady;await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,items:lateNotices,lastCheckedAt:checkedAt,providers:[{id:'fixture',status:'ok',checkedAt}]})});};
  await page.route('**/content-discovery/learning-opportunities.json',delayedNotices);
  await page.route('**/api/learning-opportunities?**',delayedNotices);
  const videos=Array.from({length:40},(_,i)=>({id:`qavideo${String(i).padStart(4,'0')}`,title:`QA 촬영 영상 ${i+1}`,url:`https://www.youtube.com/watch?v=qavideo${String(i).padStart(4,'0')}`,platform:'YouTube',description:i===0?'자막과 컷편집을 연습하는 자료입니다.':'촬영 순서와 편집 구성을 살펴보는 테스트 자료입니다.',hashtags:i===0?['#컷편집']:['#촬영'],checkedAt}));
  const instagram=Array.from({length:8},(_,i)=>({id:`ig-qa-post-${i}`,title:`QA 임장 게시물 ${i+1}`,url:`https://www.instagram.com/p/qa_post_${i}/`,platform:'Instagram',description:i===0?'테라스와 창문이 보이는 집':'복층 구조와 실내 공간',caption:i===0?'테라스와 창문이 보이는 집':'복층 구조와 실내 공간',hashtags:['#원룸'],checkedAt}));
  await page.route('**/content-discovery/learning-videos.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({checkedAt,subjects:{video:{items:[...videos,...instagram]}}})}));
  await page.route('**/api/learning-videos?**',async route=>{
    const params=new URL(route.request().url()).searchParams,cursor=Number(params.get('cursor')||0),query=params.get('q')||'',platform=params.get('platform')||'all';calls.push({cursor,query,platform});
    if(failPage&&cursor===6&&!query&&platform==='all'){await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'});return;}
    let items,nextCursor=null;
    if(platform==='instagram'||query){items=(platform==='instagram'?instagram:[...videos,...instagram]).filter(item=>[item.title,item.caption,item.description,...item.hashtags].join(' ').includes(query.replace(/^#/,'')));}
    else{items=videos.slice(cursor/3*12,cursor/3*12+12);nextCursor=cursor<9?cursor+3:null;}
    await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,items,checkedAt,source:'fixture',cursor,nextCursor})});
  });
  try{
    await check('discovery/automatic-pagination-deduplication-and-retry',async()=>{
      await openPack(page,PACKS.find(p=>p.id==='video'));const feed=page.locator('#app [data-resource-kind="videos"]');
      const chapterId=await feed.evaluate(node=>node.closest('.chapter[data-chapter]')?.dataset.chapter),lastChapter=await page.locator('#app .chapter[data-chapter]').last().getAttribute('data-chapter');
      assert(chapterId&&chapterId===lastChapter,'video recommendations are not in the final rendered chapter');
      const chapterMenu=page.locator(`.nav-shell .nav-chip[data-target="${chapterId}"]`),chapter=page.locator(`#app .chapter[data-chapter="${chapterId}"]`);await jump(page,chapterId);
      const landingTop=await chapter.evaluate(node=>node.getBoundingClientRect().top);assert(noticeRequests>0,'first chapter jump did not encounter the delayed education notices');
      releaseNotices();const noticeFeed=page.locator('#app [data-resource-kind="opportunities"]');await wait(async()=>await noticeFeed.locator('.edu-discovery-card').count()===lateNotices.length&&await noticeFeed.getAttribute('aria-busy')==='false','delayed education notices never settled');await settledScroll(page);
      const loadedTop=await chapter.evaluate(node=>node.getBoundingClientRect().top);assert(Math.abs(loadedTop-landingTop)<=2,`late notices moved the first chapter destination: ${landingTop} → ${loadedTop}`);
      assert(await chapterMenu.evaluate(node=>node.classList.contains('is-active')),'late notices changed the selected chapter after the first menu click');
      await feed.scrollIntoViewIfNeeded();
      await wait(async()=>await feed.getAttribute('aria-busy')==='false'&&await feed.locator('.edu-discovery-card').count()>=12,'initial metadata page did not settle with at least twelve cards');
      const before=await feed.locator('.edu-discovery-card').count(),track=feed.locator('.platform-horizontal-rail__track');await track.scrollIntoViewIfNeeded();await track.hover();await page.mouse.wheel(10000,0);
      await wait(()=>calls.some(call=>call.cursor===3),'horizontal end did not trigger the next cursor');await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'append did not settle');
      assert(await feed.locator('.edu-discovery-card').count()>before,'automatic page did not add cards');
      const ids=await feed.locator('.edu-discovery-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.resourceId));assert(new Set(ids).size===ids.length,'overlapping metadata pages duplicated cards');
      failPage=true;await feed.locator('.edu-resource-more').click();await wait(()=>feed.getAttribute('data-resource-state').then(value=>value==='stale'),'failed next page did not retain its retry state');
      const retained=await feed.locator('.edu-discovery-card').count();assert(retained>=ids.length,'failed page discarded earlier metadata');assert(await feed.locator('.edu-resource-more').isVisible(),'failed page removed the retry control');
      failPage=false;await feed.locator('.edu-resource-more').click();await wait(()=>calls.filter(call=>call.cursor===6).length>=2,'retry skipped or discarded the failed cursor');await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'retry did not settle');
      assert(await feed.locator('.edu-discovery-card').count()>=retained,'retry discarded the retained index');await feed.locator('.edu-resource-more').click();await wait(()=>feed.locator('.edu-resource-more').isHidden(),'exhausted source keeps a fake endless cursor');
      assert(await feed.locator('.edu-resource-end').isVisible(),'end of metadata has no clear state');await overflow(page,'video metadata pagination');await shot(page,'mobile375-video-metadata-pagination');return {initial:before,final:await feed.locator('.edu-discovery-card').count(),cursors:calls.map(call=>call.cursor),firstChapterJump:{landingTop,loadedTop,lateNotices:lateNotices.length}};
    },page);
    await check('discovery/platform-caption-and-hashtag-search',async()=>{
      const feed=page.locator('#app [data-resource-kind="videos"]'),instagramFilter=feed.locator('[data-resource-filter="platform"]').getByRole('button',{name:'Instagram',exact:true});await instagramFilter.click();await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'Instagram filter did not settle');
      assert(await feed.locator('.edu-discovery-card').count()===8,'platform selection did not isolate Instagram metadata');assert(await feed.locator('.edu-discovery-card__image--instagram').count()===8,'missing Instagram thumbnails have no stable placeholder');
      const input=feed.getByRole('searchbox',{name:'영상 검색'});await input.fill('테라스');await input.press('Enter');await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'caption search did not settle');assert(await feed.locator('.edu-discovery-card').count()===1,'caption text is not searchable');
      await feed.locator('.edu-resource-tag').first().click();await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'hashtag search did not settle');assert(await input.inputValue()==='#원룸','clicking a hashtag did not update the search');assert(await feed.locator('.edu-discovery-card').count()===8,'hashtag search lost matching posts');
      await feed.locator('.edu-resource-reset').click();await wait(()=>feed.getAttribute('aria-busy').then(value=>value==='false'),'search reset did not settle');assert(await input.inputValue()==='','search reset kept a hidden query');assert(await instagramFilter.getAttribute('aria-pressed')==='true','reset unexpectedly changed the chosen platform');await overflow(page,'Instagram metadata search');await shot(page,'mobile375-instagram-caption-search');return {instagram:8,captionMatches:1,hashtagMatches:8};
    },page);
  }finally{releaseNotices();await context.close();}
}

async function publicMatrix(browser){
  for(const view of VIEWPORTS){for(const pack of PACKS.filter(pack=>!view.packs||view.packs.includes(pack.id))){
    const context=await browser.newContext({viewport:{width:view.width,height:view.height},isMobile:view.mobile,hasTouch:view.mobile,deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(12000);observe(page,`${view.name}/${pack.id}`);
    const label=`${view.name}/${pack.id}`;
    try{
      if(!await check(`${label}/render`,async()=>{await openPack(page,pack);return publicStructure(page,pack);},page))continue;
      await shot(page,`${view.name}-${pack.id}-hero`);
      const navigationPassed=await check(`${label}/navigation-and-focus`,()=>navigation(page,pack),page);
      if(!navigationPassed&&!await check(`${label}/recover-after-navigation`,()=>openPack(page,pack),page))continue;
      if(pack.id==='real-estate'&&!view.shortOnly)await check(`${label}/reference-cases-detail-and-return`,()=>publicReferenceCases(page,view),page);
      if(pack.id!=='photography'&&!view.shortOnly){
        await check(`${label}/education-and-practice-screenshots`,async()=>{
          await jump(page,'education');await shot(page,`${view.name}-${pack.id}-education`);
          const chapter=PRACTICE_CHAPTER[pack.id];await jump(page,chapter);
          await wait(()=>page.locator(`.chapter[data-chapter="${chapter}"] .chapter-hero__card img`).evaluate(n=>n.complete&&n.naturalWidth>0),'generated practice image failed to load after chapter navigation');
          await overflow(page,`${pack.id} practice`);await shot(page,`${view.name}-${pack.id}-practice`);
        },page);
        if(!view.mobile&&pack.id==='video')await check(`${label}/template-copy-to-clipboard`,()=>copyTemplate(page,context),page);
        if(view.mobile){
          await check(`${label}/chapter-progress-reload`,()=>practices(page,pack),page);
          await check(`${label}/bookmarks-and-collection`,()=>bookmarks(page,pack),page);
        }
      }
    }finally{await context.close();}
  }}
}

async function subjectRoundtrip(browser){
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{window.__personalEduHistoryEvents=[];window.addEventListener('pageshow',event=>window.__personalEduHistoryEvents.push({persisted:event.persisted}));});
  const page=await context.newPage();page.setDefaultTimeout(12000);observe(page,'cross-subject');
  try{await check('cross-subject/navigation-bookmark-namespace-and-history',async()=>{
    const video=PACKS.find(p=>p.id==='video'),ai=PACKS.find(p=>p.id==='ai');
    await openPack(page,video);
    const videoSource=page.locator('.edu-source-card[data-source-id="openai-prompts"] .edu-bookmark');
    await videoSource.click();await counts(page,1);
    await page.locator('#subjectFab').click();await page.locator('#subjectPicker [data-subject-id="ai"]').click();await ready(page,ai);
    assert(new URL(page.url()).pathname==='/ai/','picker did not navigate to the selected field');
    const aiSource=page.locator('.edu-source-card[data-source-id="openai-prompts"] .edu-bookmark');
    assert(await aiSource.getAttribute('aria-pressed')==='false','same source ID in another subject collided');
    await aiSource.click();await counts(page,2);
    await page.locator('#collectionFab').click();await page.locator('#collectionSheet').waitFor({state:'visible'});
    assert(await page.locator('#collectionSheet .collection-item[data-library-type="article"]').count()===2,'two subjects must retain two saved source entries');
    await shot(page,'mobile375-cross-subject-collection');
    await page.locator('#collectionSheet .collection-item[data-library-id="video:openai-prompts"]').getByRole('button',{name:'삭제',exact:true}).click();await counts(page,1);
    assert(await aiSource.getAttribute('aria-pressed')==='true','removing the other subject source also removed the current source');
    await closeCollection(page);
    await page.goBack({waitUntil:'commit'});await ready(page,video);await counts(page,1);
    await wait(()=>videoSource.getAttribute('aria-pressed').then(v=>v==='false'),'browser Back restores a stale bookmark removed from another subject');
    assert(await page.locator('#subjectPicker').isHidden(),'browser Back restores an open subject modal');
    const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,-200);
    await wait(()=>page.evaluate(old=>Math.abs(scrollY-old)>20,y),'browser Back leaves scrolling locked');
    const pageshowEvents=await page.evaluate(()=>window.__personalEduHistoryEvents||[]);
    return {historyRestore:pageshowEvents.at(-1)?.persisted?'bfcache':'document-navigation',pageshowEvents,remainingSavedSources:1};
  },page);}finally{await context.close();}
}

async function libraryModule(page,id){
  await page.locator(`[data-kit-ui="${id}"]`).click();
  await wait(()=>page.evaluate(moduleId=>{const doc=document.querySelector('#builderFrame')?.contentDocument;return doc?.documentElement.dataset.platformModule===moduleId&&Boolean(doc.body?.querySelector(`[data-platform-module="${moduleId}"]`));},id),`Library did not mount ${id}`);
  return page.frameLocator('#builderFrame');
}
async function editorWorkspace(page){
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('.platform-admin-shell').evaluate(n=>n.dataset.persistentWorkspaceBound==='true'),'persistent admin shell not ready');
  await page.locator('.platform-admin-shell__nav a[href="/editor-lab/"]').click();
  await wait(()=>page.evaluate(()=>location.pathname==='/editor-lab/'),'Editor route not opened');
  const frame=page.locator('.platform-admin-workspace-host:not([hidden]) iframe');await frame.waitFor({state:'visible'});
  const handle=await frame.elementHandle();const tool=await handle.contentFrame();assert(tool,'Editor workspace frame unavailable');
  await tool.locator('[data-add-module="learning-guide-section"]').waitFor({state:'visible'});return tool;
}
async function editorFrames(tool,id,count,expectedBlocks=null){
  await wait(()=>tool.evaluate(({id,count,expectedBlocks})=>{
    const frames=[...document.querySelectorAll(`[data-platform-editor-module-frame="${id}"]`)];
    return frames.length===count&&frames.every(frame=>{
      const root=frame.contentDocument?.body?.querySelector(`[data-platform-module="${id}"]`);if(!root)return false;
      const blockId=frame.closest('[data-editor-block]')?.dataset.editorBlock;
      const expected=expectedBlocks?.find(block=>block.id===blockId);
      const instance=expected?.content?.instanceId||blockId;
      if(id==='subject-navigation')return root.dataset.subjectInstance===instance;
      if(id==='learning-guide-section')return root.dataset.learningBound==='true'&&root.id.startsWith(`${instance}-`);
      if(id==='learning-resource-rail')return root.dataset.resourceBound==='true';
      return true;
    });
  },{id,count,expectedBlocks}),`Editor ${id}: expected ${count} hydrated instances with their own props`);
}
async function openEditorUtility(tool,control){
  const menu=tool.locator('details.admin-utility-menu').filter({has:tool.locator(control)});
  assert(await menu.count()===1,`Editor utility menu missing for ${control}`);
  if(!await menu.evaluate(n=>n.open))await menu.locator(':scope > summary').click();
  await wait(()=>menu.evaluate(n=>n.open),'Editor More menu did not open');
}

async function resourceFixture(module){
  const region=module.locator('[data-resource-filter="region"] .platform-filter-chip-source--liquid');
  await region.locator('[data-platform-filter-id="busan"]').click();
  assert(await module.locator('.edu-discovery-card').count()===1,'canonical resource filter is inert');
  const save=module.locator('.edu-resource-save').first();await save.click();assert(await save.getAttribute('aria-pressed')==='true','canonical resource bookmark is inert');await save.click();
  await region.locator('[data-platform-filter-id="all"]').click();assert(await module.locator('.edu-discovery-card').count()===3,'canonical resource filter did not restore its dataset');
}

async function commonPipeline(browser){
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(16000);observe(page,'canonical-pipeline');
  let metadata=null,exported=null,orderedAssets=null;
  try{
    if(!await check('common/registry-and-library',async()=>{
      await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
      await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry?.get('subject-navigation'))),'new Registry entries are missing');
      metadata=await page.evaluate(ids=>ids.map(id=>({id,provenance:window.PlatformModuleRegistry.provenance(id),closure:window.PlatformModuleRegistry.dependencyClosure(id,'export').map(key=>window.PlatformModuleRegistry.provenance(key))})),MODULES);
      orderedAssets=await page.evaluate(ids=>window.PlatformModuleRegistry.assetFiles(ids,'export'),MODULES);
      for(const item of metadata){assert(item.provenance.status==='approved',`${item.id}: not approved`);for(const consumer of ['public','library','editor','export'])assert(item.provenance.consumers.includes(consumer),`${item.id}: missing ${consumer} consumer`);assert(item.closure.every(d=>d.ownerFiles.length>0),`${item.id}: missing canonical owners`);}
      for(const id of MODULES){const frame=await libraryModule(page,id);const module=frame.locator(`body [data-platform-module="${id}"]`);assert(await module.count()===1&&await module.isVisible(),`${id}: Library module root is missing, duplicated or empty`);if(id==='learning-guide-section'){const input=module.locator('.edu-checklist input').first();await input.check();assert(await input.isChecked(),'Library checklist is inert');}if(id==='learning-resource-rail')await resourceFixture(module);if(id==='subject-navigation'){const fab=module.locator('.subject-fab');await fab.click();const dialog=module.locator('dialog');await dialog.waitFor({state:'visible'});await dialogFocusLoop(page,dialog);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});}}
      await shot(page,'canonical-library');return metadata;
    },page))return;
    if(!await check('common/editor-insert-duplicate-preview-and-json-export',async()=>{
      const tool=await editorWorkspace(page);
      for(const id of MODULES){await tool.locator(`[data-add-module="${id}"]`).click();await editorFrames(tool,id,1);}
      // Exercise the toolbar's real duplicate action, not a fabricated draft.
      for(const id of ['learning-guide-section','subject-navigation']){
        const block=tool.locator('[data-editor-block]').filter({has:tool.locator(`[data-platform-editor-module="${id}"]`)}).first();
        await block.locator('[data-block-action="duplicate"]').click();await editorFrames(tool,id,2);
      }
      await tool.locator('[data-editor-mode="preview"]').click();await editorFrames(tool,'learning-guide-section',2);
      const learning=tool.frameLocator('[data-platform-editor-module-frame="learning-guide-section"]').first();
      const second=tool.frameLocator('[data-platform-editor-module-frame="learning-guide-section"]').nth(1);
      await learning.locator('.edu-checklist input').first().check();assert(!await second.locator('.edu-checklist input').first().isChecked(),'Editor duplicated checklist shares transient state');
      await resourceFixture(tool.frameLocator('[data-platform-editor-module-frame="learning-resource-rail"]').locator('body [data-platform-module="learning-resource-rail"]'));
      await editorFrames(tool,'subject-navigation',2);
      // The FAB is fixed inside its own frame. Bring that frame into the Editor
      // canvas viewport before interacting with its fixed descendant.
      await tool.locator('[data-platform-editor-module-frame="subject-navigation"]').first().scrollIntoViewIfNeeded();
      const subject=tool.frameLocator('[data-platform-editor-module-frame="subject-navigation"]').first();
      const subjectFabBox=await subject.locator('.subject-fab').boundingBox(),viewport=page.viewportSize();
      assert(subjectFabBox&&subjectFabBox.x>=0&&subjectFabBox.y>=0&&subjectFabBox.x+subjectFabBox.width<=viewport.width&&subjectFabBox.y+subjectFabBox.height<=viewport.height,'Editor subject FAB is outside the viewport after scrolling its frame into view');
      await subject.locator('.subject-fab').click();await subject.locator('dialog[open]').waitFor({state:'visible'});await dialogFocusLoop(page,subject.locator('dialog'));await page.keyboard.press('Escape');await subject.locator('dialog').waitFor({state:'hidden'});
      await openEditorUtility(tool,'#editorExport');
      const [download]=await Promise.all([page.waitForEvent('download'),tool.locator('#editorExport').click()]);
      const file=path.join(OUT,'editor-export.json');await download.saveAs(file);exported=JSON.parse(fs.readFileSync(file,'utf8'));
      assert(exported.blocks.length===6,'real export lost or added blocks');
      assert(exported.validation?.every(item=>item.ok),'Editor validation rejected exported modules');
      for(const id of ['learning-guide-section','subject-navigation']){const instances=exported.blocks.filter(b=>b.variant===id).map(b=>b.content.instanceId);assert(instances.length===2&&new Set(instances).size===2,`${id}: duplicate exported instance IDs`);}
      await shot(page,'canonical-editor-preview');return {blocks:exported.blocks.map(b=>({type:b.type,variant:b.variant,id:b.id}))};
    },page))return;
    await check('common/json-import-into-fresh-editor',async()=>{
      const fresh=await browser.newContext({viewport:{width:1440,height:1000}});const importedPage=await fresh.newPage();
      observe(importedPage,'canonical-editor-import');
      try{const tool=await editorWorkspace(importedPage);await openEditorUtility(tool,'#editorImport');await tool.locator('#editorImport').setInputFiles(path.join(OUT,'editor-export.json'));for(const id of MODULES)await editorFrames(tool,id,['learning-guide-section','subject-navigation'].includes(id)?2:1,exported.blocks);await tool.locator('[data-editor-mode="preview"]').click();await editorFrames(tool,'learning-guide-section',2,exported.blocks);const input=tool.frameLocator('[data-platform-editor-module-frame="learning-guide-section"]').first().locator('.edu-checklist input').first();await input.check();assert(await input.isChecked(),'imported learning module is inert');await shot(importedPage,'canonical-editor-import');}finally{await fresh.close();}
    },page);
    await standalone(browser,metadata,exported,orderedAssets);
  }finally{await context.close();}
}

async function standalone(browser,metadata,exported,orderedAssets){
  const directory=path.join(OUT,'standalone');fs.mkdirSync(directory,{recursive:true});
  // The Registry exposes dependencyClosure + provenance, rather than an HTML exporter.
  // This fixture only copies those owners byte-for-byte, plus the Registry bootstrap
  // and content-referenced images. No application, Library or preview CSS is added.
  const owners=orderedAssets;assert(Array.isArray(owners)&&owners.length>0,'Registry did not resolve an ordered asset manifest');
  const registry='public/assets/js/platform-modules/module-registry-v1.js';
  const contentAssets=[];
  function assets(value){if(typeof value==='string'&&value.startsWith('/assets/images/'))contentAssets.push(`public${value}`);else if(Array.isArray(value))value.forEach(assets);else if(value&&typeof value==='object')Object.values(value).forEach(assets);}
  exported.blocks.forEach(b=>assets(b.content));
  const files=[...new Set([registry,...owners,...contentAssets])];const manifest=[];
  for(const file of files){assert(file.startsWith('public/')&&!file.includes('..'),`unsafe declared dependency: ${file}`);const source=path.join(ROOT,file),relative=file.slice('public/'.length),target=path.join(directory,relative);assert(fs.existsSync(source),`declared owner is absent: ${file}`);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);const digest=sha(fs.readFileSync(source));assert(digest===sha(fs.readFileSync(target)),`dependency copy changed ${file}`);manifest.push({file,sha256:digest});}
  const payload=JSON.stringify(exported.blocks).replace(/</g,'\\u003c');
  const css=owners.filter(f=>f.endsWith('.css')).map(f=>`<link rel="stylesheet" href="/${f.slice(7)}">`).join('\n');
  const scripts=[registry,...owners.filter(f=>f.endsWith('.js')&&f!==registry)].map(f=>`<script defer src="/${f.slice(7)}"></script>`).join('\n');
  const html=`<!doctype html><html lang="ko" data-theme="dark" data-theme-choice="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Canonical export dependency fixture</title>${css}${scripts}<script defer src="/fixture.js"></script></head><body><main id="export-root"></main></body></html>`;
  fs.writeFileSync(path.join(directory,'index.html'),html);
  fs.writeFileSync(path.join(directory,'fixture.js'),`const blocks=${payload};for(const block of blocks){const host=document.createElement('div');host.dataset.exportBlock=block.id;document.getElementById('export-root').appendChild(host);window.PlatformModuleRegistry.mount(host,block.variant,block.content,{consumer:'export'});}document.documentElement.dataset.exportReady='true';\n`);
  fs.writeFileSync(path.join(directory,'dependency-manifest.json'),JSON.stringify({kind:'qa-fixture-not-product-export',canonicalFiles:manifest},null,2)+'\n');
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp'};
  const server=http.createServer((req,res)=>{try{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''),file=path.resolve(directory,relative||'index.html');if(!file.startsWith(directory+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(400);res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();observe(page,'standalone-export');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const missing=[];page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
  try{await check('common/canonical-export-dependencies-isolation-and-dark-layout',async()=>{
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'load'});
    await wait(()=>page.locator('html').getAttribute('data-export-ready').then(v=>v==='true'),'export dependency fixture did not mount');
    assert(errors.length===0,`standalone errors: ${errors.join('; ')}`);
    assert(missing.length===0,`standalone missing dependencies: ${JSON.stringify(missing)}`);
    assert(await page.locator('html').getAttribute('data-theme')==='dark','standalone dark choice was not applied');
    const filterOwner=await page.evaluate(()=>{const definition=window.PlatformModuleRegistry.get('filter-chip-rail');return {hydrate:definition.hydrate.name,composition:definition.ownerFiles.some(file=>file.endsWith('/portable-primitives-composition-v3.js'))};});assert(filterOwner.hydrate==='hydrateFilter'&&filterOwner.composition,'portable filter lost its canonical composition owner');
    const duplicates=await page.locator('[id]').evaluateAll(nodes=>{const counts=new Map();for(const n of nodes)counts.set(n.id,(counts.get(n.id)||0)+1);return [...counts].filter(([,n])=>n>1).map(([id])=>id);});
    assert(duplicates.length===0,`duplicate exported DOM IDs: ${duplicates.join(', ')}`);
    const facts=await page.locator('.hero__fact').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));assert(facts.length===4&&Math.max(...facts)-Math.min(...facts)<=2,'desktop hero facts lost their four-column layout');
    const publication=page.locator('[data-ebook-entry="video-entry"]');
    assert(await publication.count()===1&&await publication.getAttribute('href')==='https://photo-ebook.pages.dev/reader/?book=video-entry&edition=sample-20261106-v1','portable hero does not link to its published reader');
    assert(await publication.getAttribute('target')==='_blank'&&(await publication.getAttribute('rel')).includes('noopener'),'portable publication link does not open safely in a new tab');
    await wait(()=>page.locator('.hero__image').evaluate(n=>n.complete&&n.naturalWidth>0),'standalone hero image missing');
    const fields=page.locator('.edu-checklist');const first=fields.nth(0).locator('input').first(),second=fields.nth(1).locator('input').first();
    await first.check();assert(!await second.isChecked(),'exported instances share checklist state');
    await page.reload({waitUntil:'load'});await wait(()=>page.locator('html').getAttribute('data-export-ready').then(v=>v==='true'),'standalone reload failed');
    assert(await first.isChecked()&&!await second.isChecked(),'exported instance progress did not restore independently');
    const colors=await fields.first().evaluate(n=>({foreground:getComputedStyle(n.querySelector('.edu-check-item span')).color,background:getComputedStyle(n).backgroundColor}));
    const contrast=contrastRatio(colors.foreground,colors.background);assert(contrast>=4.5,`standalone dark checklist contrast is ${contrast.toFixed(2)}`);
    await resourceFixture(page.locator('[data-platform-module="learning-resource-rail"]'));
    for(const fab of await page.locator('.subject-fab').all()){
      const id=await fab.getAttribute('aria-controls');const dialog=page.locator(`[id="${id}"]`);await fab.focus();await page.keyboard.press('Enter');await dialog.waitFor({state:'visible'});assert(await page.locator('dialog[open]').count()===1,'one trigger opened multiple exported dialogs');await dialogFocusLoop(page,dialog);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await fab.evaluate(n=>document.activeElement===n),'exported picker does not restore focus');
    }
    await overflow(page,'standalone desktop');await shot(page,'canonical-export-dark-desktop');
    await page.setViewportSize({width:375,height:812});await overflow(page,'standalone mobile');await shot(page,'canonical-export-dark-mobile');
    return {canonicalFiles:manifest.length,contrast:Number(contrast.toFixed(2)),blocks:exported.blocks.length,fixture:'standalone/dependency-manifest.json'};
  },page);}finally{await context.close();await new Promise(resolve=>server.close(resolve));}
}

let browser;
try{
  const executable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--disable-back-forward-cache'],...(executable?{executablePath:executable}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  await publicMatrix(browser);
  await subjectRoundtrip(browser);
  await discoveryModules(browser);
  await videoDiscoveryPaging(browser);
  await commonPipeline(browser);
  await check('runtime/no-uncaught-browser-errors',async()=>{assert(report.diagnostics.length===0,`uncaught browser errors: ${JSON.stringify(report.diagnostics)}`);});
}catch(error){report.checks.push({name:'runner',status:'fail',error:error.stack||String(error)});console.error(error);}
finally{
  await browser?.close();report.finishedAt=new Date().toISOString();report.status=report.checks.some(c=>c.status==='fail')?'fail':'pass';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Personal Edu runtime: ${report.status}; ${report.checks.filter(c=>c.status==='pass').length} passed, ${report.checks.filter(c=>c.status==='fail').length} failed.`);
  if(report.status!=='pass')process.exitCode=1;
}
