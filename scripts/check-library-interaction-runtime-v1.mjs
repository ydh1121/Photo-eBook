import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/library-interaction-runtime');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=18000){
  const started=Date.now();let last;
  while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}
  if(last)throw last;throw new Error(message);
}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}

async function openLibrary(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="filter-chip-rail"]').count().then(Boolean),'Library selector missing');
}
async function moduleFrame(page,id){
  const selector=page.locator(`[data-kit-ui="${id}"]`);assert(await selector.count()===1,`Library selector missing: ${id}`);
  if(await selector.getAttribute('aria-pressed')!=='true')await selector.click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`main [data-platform-module="${moduleId}"]`));},id),`canonical module frame missing: ${id}`,22000);
  return page.frameLocator('#builderFrame');
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'inspector did not open');}
async function closeInspector(page){const close=page.locator('.builder-kit-inspector:not([hidden]) [data-kit-close]');if(await close.count())await close.click();}
async function setViewport(page,value){const button=page.locator(`[data-kit-viewport="${value}"]`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await wait(()=>page.locator('.builder-kit-workspace').evaluate((node,v)=>node.dataset.viewport===v,value),`viewport did not become ${value}`);await sleep(120);}
async function setTheme(page,value){const button=page.locator(`[data-kit-theme="${value}"]`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await wait(()=>page.locator('#builderFrame').evaluate((frame,v)=>frame.contentDocument?.documentElement?.dataset.theme===v,value),`theme did not become ${value}`);await sleep(120);}

async function libraryChromeFlow(page){
  const frame=await moduleFrame(page,'filter-chip-rail');
  await setTheme(page,'dark');await setViewport(page,'mobile');
  assert(await page.evaluate(()=>localStorage.getItem('platformLibraryThemeV3'))==='dark','Library theme did not persist');
  assert(await page.evaluate(()=>localStorage.getItem('platformLibraryViewportV3'))==='mobile','Library viewport did not persist');
  assert((await page.locator('#builderFrame').boundingBox()).width<=400,'mobile frame width contract failed');
  await moduleFrame(page,'top-chapter-navigation');await moduleFrame(page,'filter-chip-rail');
  assert(await page.locator('[data-kit-theme="dark"]').getAttribute('aria-pressed')==='true','theme lost after module switch');
  assert(await page.locator('[data-kit-viewport="mobile"]').getAttribute('aria-pressed')==='true','viewport lost after module switch');
  assert(await frame.locator('.platform-filter-chip-module').count()===1,'filter module lost after Library chrome flow');
  pass('Library chrome persistence','theme + viewport survive module switching');
  await setTheme(page,'light');await setViewport(page,'desktop');
}

async function filterContentFlow(page){
  const frame=await moduleFrame(page,'filter-chip-rail');await openInspector(page);
  const rows=()=>page.locator('.builder-kit-inspector:not([hidden]) [data-menu-index]');
  const initial=await rows().count();assert(initial>=4,'filter menu editor baseline missing');
  await page.locator('[data-menu-add]').click();
  await wait(()=>rows().count().then(count=>count===initial+1),'menu add did not update inspector');
  await wait(()=>frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').count().then(count=>count===initial+1),'menu add did not update canonical filter module');
  const lastInput=page.locator('[data-menu-label]').last();await lastInput.fill('실시간 테스트 메뉴');
  await wait(()=>frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').last().textContent().then(text=>text?.trim()==='실시간 테스트 메뉴'),'menu label input is not live');
  pass('filter menu live edit','add + immediate label propagation');

  const beforeOrder=await page.locator('[data-menu-label]').allInputValues();
  await page.locator('[data-menu-up]').last().click();
  await wait(async()=>{const values=await page.locator('[data-menu-label]').allInputValues();return values.at(-2)==='실시간 테스트 메뉴';},'menu move-up did not reorder inspector');
  const movedOrder=await page.locator('[data-menu-label]').allInputValues();
  const frameOrder=await frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').allTextContents();
  assert(frameOrder.map(v=>v.trim()).join('|')===movedOrder.join('|'),'menu reorder did not propagate to canonical module');
  assert(beforeOrder.join('|')!==movedOrder.join('|'),'menu move-up was a no-op');
  pass('filter menu reorder','up action changes inspector + canonical source order');

  const targetRow=page.locator('[data-menu-label]').filter({hasValue:'실시간 테스트 메뉴'}).locator('..');
  await targetRow.locator('[data-menu-remove]').click();
  await wait(()=>rows().count().then(count=>count===initial),'menu remove did not restore item count');
  pass('filter menu remove','delete updates canonical content');

  for(let i=0;i<11;i++){await page.locator('[data-menu-add]').click();await sleep(35);}
  await wait(()=>frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').count().then(count=>count>=15),'long menu did not reach overflow test size');
  const source=frame.locator('.platform-filter-chip-source--liquid');
  await source.evaluate(node=>{node.scrollLeft=0;});
  const last=frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').last();
  await last.evaluate(node=>node.click());
  await wait(()=>last.getAttribute('aria-pressed').then(value=>value==='true'),'last filter chip did not become active');
  await wait(()=>source.evaluate(node=>node.scrollLeft>0),'active overflow chip did not scroll into view');
  const visible=await last.evaluate(node=>{const rail=node.parentElement,br=node.getBoundingClientRect(),rr=rail.getBoundingClientRect();return {left:br.left,right:br.right,railLeft:rr.left,railRight:rr.right,scrollLeft:rail.scrollLeft};});
  assert(visible.left>=visible.railLeft-1&&visible.right<=visible.railRight+1,`active filter chip remains clipped: ${JSON.stringify(visible)}`);
  pass('filter active-chip visibility',`selected overflow chip fully visible at scrollLeft ${Math.round(visible.scrollLeft)}`);

  const activeId=await last.getAttribute('data-platform-filter-id');
  const family=page.locator('[data-style-control="family"]');await family.selectOption('material-flat');await sleep(220);
  const materialActive=frame.locator(`.platform-filter-chip-source--material-flat [data-platform-filter-id="${activeId}"]`);
  assert(await materialActive.getAttribute('aria-pressed')==='true','active filter state lost across family switch');
  pass('filter family state continuity','active ID survives iOS Liquid → Material switch');

  await page.locator('[data-content-reset]').click();
  await wait(()=>page.locator('[data-menu-label]').count().then(count=>count===4),'menu reset did not restore baseline');
  await wait(()=>frame.locator('.platform-filter-chip-source--liquid [data-platform-filter-id]').count().then(count=>count===4),'menu reset did not update canonical module');
  pass('filter menu reset','content defaults restored in inspector + preview');
  await shot(page,'filter-content-interactions');
}

async function cardDragFlow(page){
  await closeInspector(page);await moduleFrame(page,'horizontal-card-rail');await setViewport(page,'desktop');
  await page.evaluate(()=>{const frame=document.querySelector('#builderFrame'),shell=document.querySelector('#builderCanvasShell');if(frame)frame.style.width='760px';if(shell)shell.style.width='760px';});
  const frame=page.frameLocator('#builderFrame');const rail=frame.locator('[data-platform-module="horizontal-card-rail"]');
  await wait(()=>rail.evaluate(node=>node.scrollWidth>node.clientWidth),'card rail does not overflow in desktop preview');
  const mode=await frame.locator('html').evaluate(()=>window.PlatformModuleViewportMode?.());assert(mode==='desktop',`preview viewport provider returned ${mode}`);
  const moved=await rail.evaluate(async node=>{
    const target=node.querySelector('.market-card')||node;
    node.scrollLeft=0;
    const common={bubbles:true,cancelable:true,pointerId:41,pointerType:'mouse',button:0,buttons:1,clientY:80};
    target.dispatchEvent(new PointerEvent('pointerdown',{...common,clientX:520}));
    document.dispatchEvent(new PointerEvent('pointermove',{...common,clientX:260}));
    document.dispatchEvent(new PointerEvent('pointerup',{...common,buttons:0,clientX:260}));
    await new Promise(resolve=>setTimeout(resolve,40));
    return node.scrollLeft;
  });
  assert(moved>80,`desktop mouse drag did not move canonical card rail: ${moved}`);
  pass('horizontal card desktop drag',`real pointer drag moved scrollLeft to ${Math.round(moved)}`);
}

async function bottomSheetFlow(page){
  await moduleFrame(page,'collection-bottom-sheet');const frame=page.frameLocator('#builderFrame');const sheet=frame.locator('#collectionSheet'),fab=frame.locator('#collectionFab');
  await wait(()=>sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'bottom sheet did not open');
  await frame.locator('#collectionClose').click();await wait(()=>sheet.evaluate(node=>node.hidden),'bottom sheet close button failed');
  await fab.click();await wait(()=>sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'bottom sheet FAB failed to reopen sheet');
  pass('bottom sheet open/close','close button + canonical FAB');

  await frame.locator('[data-library-tab="video"]').click();
  await wait(()=>sheet.evaluate(node=>node.closest('#collectionLayer').__platformCollectionController?.getState?.().tab==='video'),'video tab state failed');
  const types=await frame.locator('#collectionBody [data-library-type]').evaluateAll(nodes=>nodes.map(node=>node.dataset.libraryType));assert(types.length&&types.every(type=>type==='video'),'video tab rendered non-video items');
  const filter=frame.locator('#collectionFilters .collection-filter').nth(1);if(await filter.count()){await filter.click();const selected=await filter.getAttribute('data-library-filter');await wait(()=>sheet.evaluate((node,value)=>node.closest('#collectionLayer').__platformCollectionController?.getState?.().filter===value,selected),'collection filter state failed');}
  await frame.locator('#collectionSearch').fill('제품');await wait(()=>sheet.evaluate(node=>node.closest('#collectionLayer').__platformCollectionController?.getState?.().search==='제품'),'collection search state failed');
  pass('bottom sheet tabs/filter/search','controller state and visible data update');

  const handle=frame.locator('.collection-handle-wrap');
  await handle.evaluate(async node=>{
    const common={bubbles:true,cancelable:true,pointerId:42,pointerType:'mouse',button:0,buttons:1,clientX:200};
    node.dispatchEvent(new PointerEvent('pointerdown',{...common,clientY:20}));
    node.dispatchEvent(new PointerEvent('pointermove',{...common,clientY:140}));
    node.dispatchEvent(new PointerEvent('pointerup',{...common,buttons:0,clientY:140}));
    await new Promise(resolve=>setTimeout(resolve,230));
  });
  assert(await sheet.evaluate(node=>node.hidden),'bottom sheet drag-to-close failed');
  pass('bottom sheet drag close','handle drag over threshold closes sheet');

  await fab.click();await wait(()=>sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'bottom sheet did not reopen after drag close');
  await frame.locator('[data-library-tab="settings"]').click();
  await wait(()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('platformLibraryStateV3')||'{}')['collection-bottom-sheet']==='settings';}catch{return false;}}),'preview state did not persist back to Library');
  pass('bottom sheet state bridge','preview tab state persists to Library state');
}

async function accordionFlow(page){
  await moduleFrame(page,'device-handoff-accordion');const frame=page.frameLocator('#builderFrame');
  const link=frame.locator('#collectionDeviceLink');await wait(()=>link.getAttribute('data-device-safe-v2').then(value=>value==='true'),'device accordion owner did not prepare link');
  assert(await link.getAttribute('aria-expanded')==='false','device accordion baseline should be collapsed');
  await link.click();await wait(()=>link.getAttribute('aria-expanded').then(value=>value==='true'),'device accordion did not expand');
  const panel=frame.locator('.collection-device-panel-v2');assert(await panel.getAttribute('aria-hidden')==='false','device accordion panel remained hidden');
  await link.click();await wait(()=>link.getAttribute('aria-expanded').then(value=>value==='false'),'device accordion did not collapse');
  pass('device accordion toggle','real measured-height owner expands + collapses');

  await link.click();await wait(()=>link.getAttribute('aria-expanded').then(value=>value==='true'),'device accordion re-expand failed');
  await frame.locator('#deviceCodeIncomingV2').fill('invalid-code');await frame.locator('[data-device-panel-connect]').click();
  const status=frame.locator('[data-device-panel-status]');await wait(()=>status.textContent().then(text=>String(text||'').includes('확인')),'invalid device code did not produce validation status');
  assert(await status.evaluate(node=>node.classList.contains('is-error')),'invalid device code status is not marked as error');
  pass('device accordion validation','invalid connect code produces visible error status');
}

try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
  await openLibrary(page);
  await libraryChromeFlow(page);
  await filterContentFlow(page);
  await cardDragFlow(page);
  await bottomSheetFlow(page);
  await accordionFlow(page);
  await shot(page,'interaction-final');
  report.status='pass';
  console.log(`Library interaction runtime OK: ${report.checks.length} user-flow assertions passed.`);
  await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
