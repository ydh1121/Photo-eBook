import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/portable-primitives-batch2');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function wait(fn,message,timeout=18000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(70);}if(last)throw last;throw new Error(message);}
async function select(page,id){const button=page.locator(`[data-kit-ui="${id}"]`);assert(await button.count()===1,`Library selector missing: ${id}`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await wait(()=>page.evaluate(moduleId=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformModule===moduleId,id),`Preview missing: ${id}`);return page.frameLocator('#builderFrame');}
async function openInspector(page){if(!await page.locator('.builder-kit-inspector:not([hidden])').count())await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'Inspector missing');}
async function closeInspector(page){const close=page.locator('.builder-kit-inspector:not([hidden]) [data-kit-close]');if(await close.count())await close.click();}

try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=horizontal-rail`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleContentDefaultsV1','platformModuleDefaultsV1'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="horizontal-rail"]').count().then(Boolean),'Portable Library selectors unavailable');

  const metadata=await page.evaluate(()=>['horizontal-rail','accordion','bottom-sheet'].map(id=>{const def=window.PlatformModuleRegistry?.get(id);return {id,status:def?.status,source:def?.source,consumers:def?.consumers||[],owners:def?.ownerFiles||[]};}));
  for(const item of metadata){assert(item.status==='approved',`${item.id} not approved`);assert(item.consumers.includes('library')&&item.consumers.includes('editor'),`${item.id} consumers incomplete`);assert(item.owners.some(file=>file.includes('portable-primitives-v1')),`${item.id} portable owner missing`);}
  assert(metadata.find(item=>item.id==='horizontal-rail')?.source==='block-lab-approved','horizontal rail provenance incorrect');
  assert(metadata.find(item=>item.id==='accordion')?.source==='block-lab-approved','accordion provenance incorrect');
  assert(metadata.find(item=>item.id==='bottom-sheet')?.source==='platform-core','bottom sheet provenance incorrect');
  pass('portable primitive Registry contract','3 approved reusable modules');

  let frame=await select(page,'horizontal-rail');
  await openInspector(page);await wait(()=>page.locator('[data-primitive-editor="horizontal-rail"]').count().then(Boolean),'Rail content editor missing');
  await page.locator('[data-rail-title="1"]').fill('클라이언트용 두 번째 카드');
  await wait(()=>frame.locator('.platform-horizontal-rail__card').nth(1).locator('h4').textContent().then(value=>value?.trim()==='클라이언트용 두 번째 카드'),'Rail content did not update live');
  await closeInspector(page);
  const touchAction=await frame.locator('.platform-horizontal-rail__track').evaluate(node=>getComputedStyle(node).touchAction);
  assert(touchAction.includes('pan-x'),`Rail native pan missing: ${touchAction}`);
  const dragged=await frame.locator('.platform-horizontal-rail__track').evaluate(async track=>{
    track.scrollLeft=0;const target=track.querySelector('.platform-horizontal-rail__card')||track;
    const base={bubbles:true,cancelable:true,pointerId:71,pointerType:'mouse',button:0,buttons:1,clientY:100};
    target.dispatchEvent(new PointerEvent('pointerdown',{...base,clientX:520}));
    track.dispatchEvent(new PointerEvent('pointermove',{...base,clientX:240}));
    track.dispatchEvent(new PointerEvent('pointerup',{...base,buttons:0,clientX:240}));
    await new Promise(resolve=>setTimeout(resolve,60));return track.scrollLeft;
  });
  assert(dragged>80,`Portable rail desktop drag failed: ${dragged}`);
  pass('horizontal rail primitive',`live content + native pan + desktop drag ${Math.round(dragged)}px`);

  frame=await select(page,'accordion');
  await openInspector(page);await wait(()=>page.locator('[data-primitive-editor="accordion"]').count().then(Boolean),'Accordion content editor missing');
  await page.locator('[data-accordion-question="1"]').fill('수정된 두 번째 질문');
  await wait(()=>frame.locator('.platform-accordion__item').nth(1).locator('summary span').textContent().then(value=>value?.trim()==='수정된 두 번째 질문'),'Accordion content did not update live');
  await closeInspector(page);
  const details=frame.locator('.platform-accordion__item');assert(await details.first().getAttribute('open')!==null,'Accordion open-first baseline missing');
  await details.nth(1).locator('summary').click();
  await wait(async()=>await details.nth(1).getAttribute('open')!==null,'Second accordion item did not open');
  assert(await details.first().getAttribute('open')===null,'singleOpen did not close first item');
  pass('accordion primitive','Block Lab FAQ promoted with single-open interaction');

  frame=await select(page,'bottom-sheet');
  await openInspector(page);await wait(()=>page.locator('[data-primitive-editor="bottom-sheet"]').count().then(Boolean),'Bottom-sheet content editor missing');
  await page.locator('[data-sheet-root-title]').fill('클라이언트용 하단 시트');
  await wait(()=>frame.locator('.platform-bottom-sheet__head h3').textContent().then(value=>value?.trim()==='클라이언트용 하단 시트'),'Bottom-sheet content did not update live');
  await closeInspector(page);
  const module=frame.locator('.platform-bottom-sheet[data-platform-module="bottom-sheet"]');
  await wait(()=>module.getAttribute('data-open').then(value=>value==='true'),'Bottom sheet not open');
  await frame.locator('.platform-bottom-sheet__head [data-bottom-sheet-close]').click();
  await wait(()=>module.getAttribute('data-open').then(value=>value==='false'),'Bottom sheet header close failed');
  await frame.locator('[data-bottom-sheet-open]').click();
  await wait(()=>module.getAttribute('data-open').then(value=>value==='true'),'Bottom sheet reopen failed');
  const secondary=frame.locator('[data-bottom-sheet-action="secondary"]');
  if(await secondary.count()){
    await secondary.click();
    await wait(()=>module.getAttribute('data-open').then(value=>value==='false'),'Bottom sheet visible secondary close failed');
    await frame.locator('[data-bottom-sheet-open]').click();
    await wait(()=>module.getAttribute('data-open').then(value=>value==='true'),'Bottom sheet second reopen failed');
  }
  await module.evaluate(node=>{window.__portableSheetAction=false;node.addEventListener('platform-bottom-sheet-confirm',()=>window.__portableSheetAction=true,{once:true});});
  await frame.locator('[data-bottom-sheet-action="primary"]').click();
  assert(await frame.locator('html').evaluate(()=>Boolean(window.__portableSheetAction)),'Bottom-sheet custom action did not execute');
  pass('bottom sheet primitive','header close + reopen + visible actions + portable custom action');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}'));
  assert(saved['horizontal-rail']?.items?.[1]?.title==='클라이언트용 두 번째 카드','Rail Library default not persisted');
  assert(saved.accordion?.items?.[1]?.question==='수정된 두 번째 질문','Accordion Library default not persisted');
  assert(saved['bottom-sheet']?.title==='클라이언트용 하단 시트','Bottom-sheet Library default not persisted');
  pass('Library default persistence','portable content defaults saved for new Editor instances');

  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry?.get('bottom-sheet')&&window.PlatformBlockRegistry?.get('ui-module'))),'Editor portable Registry unavailable');
  const editorContract=await page.evaluate(()=>({modules:window.PlatformModuleRegistry.listFor('editor').map(item=>item.id),variants:window.PlatformBlockRegistry.get('ui-module')?.variants||[],rail:window.PlatformModuleRegistry.editorProps('horizontal-rail'),accordion:window.PlatformModuleRegistry.editorProps('accordion'),sheet:window.PlatformModuleRegistry.editorProps('bottom-sheet')}));
  for(const id of ['horizontal-rail','accordion','bottom-sheet']){assert(editorContract.modules.includes(id),`Editor Registry missing ${id}`);assert(editorContract.variants.includes(id),`UI module variant missing ${id}`);}
  assert(editorContract.rail.items?.[1]?.title==='클라이언트용 두 번째 카드','Editor rail did not snapshot Library default');
  assert(editorContract.accordion.items?.[1]?.question==='수정된 두 번째 질문','Editor accordion did not snapshot Library default');
  assert(editorContract.sheet.title==='클라이언트용 하단 시트','Editor sheet did not snapshot Library default');
  pass('Page Editor exposure','same Registry definitions + Library default snapshot');

  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  const publicLinked=await page.locator('script[src*="portable-primitives-v1.js"]').count();
  assert(publicLinked===0,'Portable primitives were linked into final Photography Public page');
  pass('Public isolation','Photography Public final runtime remains untouched');

  await page.screenshot({path:path.join(OUT,'portable-primitives-batch2.png'),fullPage:true});
  report.status='pass';
  console.log(`Portable primitives batch2 OK: ${report.checks.length} contract groups passed.`);
  await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
