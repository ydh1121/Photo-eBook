import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/ui-dashboard-reference');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=16000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function clickSwitch(page,key,value){await page.locator(`[${key}="${value}"]`).click();}
async function frameFor(page,id){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(kind=>{const f=document.querySelector('#builderFrame');const d=f?.contentDocument;return Boolean(d?.documentElement?.dataset.referencePreview==='true'&&d.documentElement.dataset.referenceComponent===kind&&f.contentWindow?.__platformReferencePreviewV1);},id),`reference frame not ready: ${id}`,20000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'frame missing');return frame;
}
async function openInspector(page){await page.locator('#kitSettings').click();await page.locator('.builder-kit-inspector:not([hidden])').waitFor({state:'visible'});}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyBase(page,id){
  const frame=await frameFor(page,id);
  const src=await page.locator('#builderFrame').getAttribute('src');
  assert(src?.includes('/ui-dashboard/reference-preview/'),`${id}: iframe is not the reference preview`);
  assert(await frame.locator('#sandboxPreviewRoot,#app,.sandbox-hero').count()===0,`${id}: full sandbox/hero leaked into library`);
  const scripts=await frame.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')||''));
  assert(!scripts.some(src=>src.includes('sandbox-kit-v4')||src.includes('bottom-sheet-parity')||src.includes('runtime-audit-patch')),`${id}: extraction/repair runtime leaked into reference preview`);
  const geometry=await frame.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,htmlOverflowX:getComputedStyle(document.documentElement).overflowX,bodyOverflowX:getComputedStyle(document.body).overflowX}));
  assert(geometry.x<=2,`${id}: preview created horizontal page overflow ${JSON.stringify(geometry)}`);
  const parentOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(parentOverflow<=2,`${id}: admin page created outer horizontal scrollbar (${parentOverflow}px)`);
  return frame;
}

async function verifyThemeViewport(page,id){
  for(const theme of ['light','dark','system']){
    await clickSwitch(page,'data-kit-theme',theme);
    await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.themeChoice===v,theme),`${id}: theme ${theme}`);
    for(const viewport of ['desktop','mobile']){
      await clickSwitch(page,'data-kit-viewport',viewport);
      await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.viewport===v,viewport),`${id}: viewport ${viewport}`);
      const width=await page.locator('#builderFrame').evaluate(node=>node.getBoundingClientRect().width);
      assert(viewport==='mobile'?width<=400:width>600,`${id}: wrong ${viewport} frame width ${width}`);
      const parentOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert(parentOverflow<=2,`${id}: ${viewport} mode created outer scrollbar (${parentOverflow}px)`);
    }
  }
  await clickSwitch(page,'data-kit-theme','light');await clickSwitch(page,'data-kit-viewport','desktop');
}

async function filterChecks(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});const frame=await verifyBase(page,'filter-chip-rail');await verifyThemeViewport(page,'filter-chip-rail');
  const root=frame.locator('#collectionFilters');
  await waitUntil(()=>root.count().then(n=>n===1),'filter root missing');
  assert(await root.evaluate(node=>Boolean(node.closest('#collectionSheet')&&node.closest('#collectionTools'))),'filter rail was detached from the real collection sheet DOM');
  await waitUntil(()=>root.evaluate(node=>node.parentElement?.classList.contains('platform-filter-chip-stage')),'filter overlay stage missing');
  const legacy=root.locator(':scope > .platform-filter-chip-indicator');
  if(await legacy.count())assert(await legacy.evaluate(node=>getComputedStyle(node).display==='none'),'legacy in-rail liquid indicator remains visible');
  assert(await frame.locator('.platform-filter-chip-stage>.platform-filter-chip-float').count()===1,'sibling active chip layer missing');
  assert(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'filter preview created horizontal page scrollbar');

  await openInspector(page);
  assert(await page.locator('.builder-filter-item-editor').count()===1,'filter sample editor is not in inspector');
  assert(await page.locator('.builder-kit-controls .builder-filter-item-editor').count()===0,'filter sample editor leaked into top toolbar');
  const before=await root.locator('.collection-filter').count();
  const input=page.locator('[data-filter-add-input]');await input.fill('제품·브랜드 촬영');await input.press('Enter');
  await waitUntil(()=>root.locator('.collection-filter').count().then(n=>n===before+1),'sample chip add failed');
  const added=root.locator('.collection-filter').last();assert(await added.textContent()==='제품·브랜드 촬영','object/string normalization failed');
  await added.click();
  await waitUntil(()=>page.locator('[data-filter-family]').inputValue().then(v=>v==='inherit'),'selected chip editor did not follow clicked chip');
  await page.locator('[data-filter-family]').selectOption('ios-liquid');
  await waitUntil(()=>added.evaluate(node=>node.dataset.platformChipOverride==='ios-liquid'),'per-chip override did not reach the real filter buttons');
  await page.locator('[data-kit-close]').click();
  await shot(page,'filter-reference-runtime');
  pass('filter reference runtime','real collection DOM + sibling liquid layer + inspector item override');
}

async function bottomSheetChecks(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=collection-bottom-sheet`,{waitUntil:'domcontentloaded'});const frame=await verifyBase(page,'collection-bottom-sheet');await verifyThemeViewport(page,'collection-bottom-sheet');
  const sheet=frame.locator('#collectionSheet');await waitUntil(()=>sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'bottom sheet did not open');
  await sheet.evaluate(node=>node.dataset.referenceQaIdentity='same-sheet');
  await openInspector(page);
  for(const tab of ['video','article','question','settings','all']){
    await page.locator(`[data-inspector-state="${tab}"]`).click();
    await waitUntil(()=>frame.locator(`.collection-tab[data-library-tab="${tab}"]`).evaluate(node=>node.classList.contains('is-active')),`bottom sheet tab failed: ${tab}`);
    const stable=await sheet.evaluate(node=>({id:node.dataset.referenceQaIdentity,hidden:node.hidden,open:node.classList.contains('is-open'),display:getComputedStyle(node).display}));
    assert(stable.id==='same-sheet'&&!stable.hidden&&stable.open&&stable.display!=='none',`bottom sheet was replaced/closed after ${tab}`);
  }
  await page.locator('[data-kit-close]').click();await shot(page,'bottom-sheet-reference-runtime');
  pass('bottom sheet state','one real sheet remains mounted across all tabs');
}

async function componentChecks(page){
  const ids=['top-chapter-navigation','horizontal-card-rail','device-handoff-accordion','floating-action'];
  for(const id of ids){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});const frame=await verifyBase(page,id);await verifyThemeViewport(page,id);
    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.reference-fixture--navigation>.nav-shell .nav-scroll').count()===1,'real nav DOM missing');
      assert(await frame.locator('.nav-chip').count()>=8,'nav fixture does not exercise real rail width');
    }else if(id==='horizontal-card-rail'){
      const rail=frame.locator('.scroll-row');assert(await rail.count()===1,'real card rail missing');
      await waitUntil(()=>rail.evaluate(node=>node.scrollWidth>node.clientWidth+80),'card rail has no real overflow');
      assert(await frame.locator('.market-card').count()>=4,'real card class fixture missing');
    }else if(id==='device-handoff-accordion'){
      const accordion=frame.locator('.collection-device-accordion');await waitUntil(()=>accordion.count().then(n=>n===1),'device accordion missing');
      assert(await accordion.evaluate(node=>Boolean(node.closest('#collectionSheet')&&node.closest('.collection-settings'))),'device accordion was detached from its actual settings DOM');
      await openInspector(page);await page.locator('[data-inspector-state="expanded"]').click();await waitUntil(()=>frame.locator('#collectionDeviceLink').evaluate(node=>node.getAttribute('aria-expanded')==='true'),'device accordion did not expand');await page.locator('[data-kit-close]').click();
    }else if(id==='floating-action'){
      assert(await frame.locator('#collectionLayer>#collectionFab').count()===1,'real collection FAB missing');
    }
    await shot(page,`${id}-reference`);pass(`${id} reference`,'real DOM/CSS/JS fixture');
  }
}

async function toolbarChecks(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});await frameFor(page,'top-chapter-navigation');
  assert(await page.locator('.builder-kit-controls>.builder-kit-switch').count()===2,'top toolbar contains more than theme/device controls');
  assert(await page.locator('#kitMode,#kitState,.builder-kit-filter-items').count()===0,'legacy crowded top controls remain');
  pass('library control hierarchy','component + theme + viewport on top; state/sample controls in inspector');
}

async function pageBuilderSafety(page){
  await page.setViewportSize({width:1920,height:1100});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#builderFrame');
  await waitUntil(()=>page.evaluate(()=>Boolean(document.querySelector('#builderFrame')?.contentDocument?.querySelector('#app'))),'page builder sandbox missing');
  const src=await page.locator('#builderFrame').getAttribute('src');assert(src?.includes('/ui-dashboard/sandbox/'),'page builder was accidentally moved to reference preview');
  pass('page builder boundary','screen composition still uses sandbox; public publish connection untouched');
}

try{
  const context=await browser.newContext();const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.clear());
  await toolbarChecks(page);await componentChecks(page);await filterChecks(page);await bottomSheetChecks(page);await pageBuilderSafety(page);
  await page.close();await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
