import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/library-generalization-batch1');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),checks:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(v,m)=>{if(!v)throw new Error(m);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function wait(fn,msg,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){try{if(await fn())return;}catch{}await sleep(70);}throw new Error(msg);}
async function select(page,id){const button=page.locator(`[data-kit-ui="${id}"]`);await button.click();await wait(()=>page.evaluate(moduleId=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformModule===moduleId,id),`preview missing: ${id}`);return page.frameLocator('#builderFrame');}
async function inspector(page){if(!await page.locator('.builder-kit-inspector:not([hidden])').count())await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'inspector missing');}

try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleContentDefaultsV1','platformModuleDefaultsV1'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="filter-chip-rail"]').count().then(Boolean),'Library unavailable');

  const drift=await page.evaluate(()=>{
    const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST,registry=window.PlatformModuleRegistry;
    const mismatches=[];
    for(const def of registry.listFor('library')){
      const cap=manifest.capabilities.find(item=>item.id===def.id);if(!cap){mismatches.push(`${def.id}:missing`);continue;}
      if(cap.status!=='approved'||cap.source!==def.source)mismatches.push(`${def.id}:meta`);
      for(const control of cap.controls||[]){
        if(Object.prototype.hasOwnProperty.call(def.styleDefaults||{},control.id)&&JSON.stringify(control.default)!==JSON.stringify(def.styleDefaults[control.id]))mismatches.push(`${def.id}:${control.id}`);
      }
    }
    return {mismatches,source:manifest.runtimeSource};
  });
  assert(drift.source==='PlatformModuleRegistry',`manifest runtime source missing: ${drift.source}`);
  assert(!drift.mismatches.length,`capability/Registry drift: ${drift.mismatches.join(', ')}`);
  pass('Registry capability runtime sync','all approved module defaults match');

  let frame=await select(page,'filter-chip-rail');await inspector(page);
  for(let i=0;i<7;i++)await page.locator('[data-menu-add]').click();
  const last=frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').last();
  await last.click();await wait(()=>last.getAttribute('aria-pressed').then(v=>v==='true'),'filter activation failed');
  const activeId=await last.getAttribute('data-platform-filter-id');
  const edit=page.locator('[data-menu-label]').nth(1);await edit.fill('제품 촬영 LIVE');
  await wait(()=>frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').nth(1).textContent().then(v=>v?.trim()==='제품 촬영 LIVE'),'filter label not live');
  assert(await frame.locator(`.platform-filter-chip-source--liquid [data-platform-filter-id="${activeId}"]`).getAttribute('aria-pressed')==='true','filter active state reset during edit');
  const storedFilter=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}')['filter-chip-rail']);
  assert(storedFilter.activeId===activeId,'stored filter activeId reset');
  assert(storedFilter.items.every(item=>item&&typeof item==='object'&&item.id&&item.label),'filter items are not stable-id objects');
  pass('filter live edit preserves selection',`active=${activeId}`);

  frame=await select(page,'top-chapter-navigation');await inspector(page);
  await wait(()=>page.locator('[data-content-editor="top-chapter-navigation"]').count().then(Boolean),'top-nav content editor missing');
  const before=await page.locator('[data-nav-index]').count();await page.locator('[data-nav-add]').click();await wait(()=>page.locator('[data-nav-index]').count().then(n=>n===before+1),'top-nav add failed');
  await page.locator('[data-nav-label]').last().fill('문의하기');await page.locator('[data-nav-target]').last().fill('contact');
  await wait(()=>frame.locator('.nav-chip').last().textContent().then(v=>v?.trim()==='문의하기'),'top-nav label not live');
  assert(await frame.locator('.nav-chip').last().getAttribute('data-target')==='contact','top-nav target not live');
  const storedNav=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}')['top-chapter-navigation']);
  assert(storedNav.items.at(-1).id==='contact'&&storedNav.items.at(-1).label==='문의하기','top-nav content not stored');
  pass('top navigation content editing','add + label + target ID');

  frame=await select(page,'floating-action');await inspector(page);
  await wait(()=>page.locator('[data-content-editor="floating-action"]').count().then(Boolean),'FAB action editor missing');
  const fabSelector='.collection-fab[data-platform-module="floating-action"]';
  const fabDiag=await frame.locator('html').evaluate(()=>{const def=window.PlatformModuleRegistry?.get?.('floating-action'),node=document.querySelector('.collection-fab[data-platform-module="floating-action"]');return {runtime:Boolean(window.PlatformModuleActionRuntime),hydrate:typeof def?.hydrate,version:def?.version||0,baselineType:node?.dataset.platformActionType||''};});
  assert(fabDiag.runtime,`FAB action runtime missing: ${JSON.stringify(fabDiag)}`);
  assert(fabDiag.hydrate==='function',`FAB registry hydrate missing: ${JSON.stringify(fabDiag)}`);
  assert(fabDiag.baselineType==='none',`FAB baseline hydration missing: ${JSON.stringify(fabDiag)}`);
  await page.locator('[data-fab-action]').selectOption('custom-event');
  await page.locator('[data-fab-value]').fill('qa-fab-action');
  await wait(()=>frame.locator(fabSelector).evaluate(node=>node.dataset.platformActionType==='custom-event'&&node.dataset.platformActionValue==='qa-fab-action'),'FAB final action remount not hydrated');
  await sleep(120);
  await frame.locator(fabSelector).evaluate(node=>{window.__qaFabAction=false;node.addEventListener('qa-fab-action',()=>window.__qaFabAction=true,{once:true});});
  await frame.locator(fabSelector).click();
  assert(await frame.locator('html').evaluate(()=>Boolean(window.__qaFabAction)),'FAB custom event did not execute');
  const storedFab=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}')['floating-action']);
  assert(storedFab.action?.type==='custom-event'&&storedFab.action?.value==='qa-fab-action','FAB action not stored');
  pass('portable floating action contract','custom-event executes and persists');

  await page.screenshot({path:path.join(OUT,'library-generalization-batch1.png'),fullPage:true});
  report.status='pass';
  await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
