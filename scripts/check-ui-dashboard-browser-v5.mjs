import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/ui-dashboard-browser');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
async function waitUntil(fn,message,timeout=12000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
async function previewFrame(page,id){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(component=>{
    const frame=document.querySelector('#builderFrame');
    return frame?.contentWindow?.__platformComponentPreviewV1===true&&frame?.contentDocument?.querySelector('#componentPreviewRoot')&&new URL(frame.src).searchParams.get('component')===component;
  },id),`component preview not ready: ${id}`,15000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'preview iframe missing');return frame;
}
async function selectComponent(page,id){await page.locator(`[data-kit-ui="${id}"]`).click();return previewFrame(page,id);}
async function switchValue(page,attr,value){await page.locator(`[${attr}="${value}"]`).click();}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});

  let frame=await previewFrame(page,'top-chapter-navigation');
  assert(await frame.locator('#app').count()===0,'full sandbox page leaked into component preview');
  assert(await frame.locator('.sandbox-hero').count()===0,'sandbox hero flashed inside library preview');
  const scripts=await frame.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')));
  assert(!scripts.some(src=>/sandbox-kit|filter-chip-live-runtime|bottom-sheet-parity|collection-hub/.test(src||'')),'legacy extraction/patch runtime loaded in component preview');
  pass('isolated preview boot','no full-page sandbox or extraction patches');

  const ids=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  for(const id of ids){
    frame=id==='top-chapter-navigation'?frame:await selectComponent(page,id);
    for(const theme of ['light','dark','system']){
      await switchValue(page,'data-kit-theme',theme);
      await waitUntil(()=>frame.evaluate(()=>['light','dark'].includes(document.documentElement.dataset.theme)),'theme did not reach preview');
    }
    await switchValue(page,'data-kit-theme','light');
    for(const viewport of ['mobile','desktop']){
      await switchValue(page,'data-kit-viewport',viewport);
      await waitUntil(()=>page.locator('.builder-kit-workspace').evaluate((node,value)=>node.dataset.viewport===value,viewport),`viewport state missing: ${id}/${viewport}`);
      const width=await page.locator('.builder-kit-frame-shell').evaluate(node=>node.getBoundingClientRect().width);
      assert(viewport==='mobile'?width<=430:width>700,`${id}: unexpected ${viewport} width ${width}`);
    }
    pass(`${id} theme/viewport`,'White/Dark/System × PC/Mobile');
  }

  frame=await selectComponent(page,'filter-chip-rail');
  const stage=frame.locator('.component-chip-stage');
  const rail=frame.locator('.collection-filters');
  const overlay=frame.locator('.component-chip-active');
  assert(await stage.count()===1&&await rail.count()===1&&await overlay.count()===1,'filter chip stage missing');
  assert(await overlay.evaluate(node=>node.parentElement?.classList.contains('component-chip-viewport')),'active chip is not a sibling overlay above the rail');
  assert(await rail.evaluate(node=>!node.contains(document.querySelector('.component-chip-active'))),'active chip incorrectly lives inside scroll rail');
  assert(await frame.locator('.platform-filter-chip-indicator,.platform-filter-chip-float').count()===0,'legacy filter selector owner remains');
  const input=page.locator('#kitFilterItems input');await input.fill('브랜드 캠페인 촬영');await input.press('Enter');
  await waitUntil(()=>rail.locator('.collection-filter').filter({hasText:'브랜드 캠페인 촬영'}).count().then(n=>n===1),'sample chip was not added');
  await rail.locator('.collection-filter').filter({hasText:'브랜드 캠페인 촬영'}).click();
  await waitUntil(()=>page.locator('#kitFilterItemStyle strong').textContent().then(text=>text?.includes('브랜드 캠페인 촬영')),'selected chip did not sync to parent controls');
  await page.locator('#kitFilterItemStyle select').selectOption('material-flat');
  await waitUntil(()=>overlay.evaluate(node=>node.dataset.family==='material-flat'),'per-chip style override did not reach active overlay');
  await switchValue(page,'data-kit-mode','ios-liquid');
  assert(await overlay.evaluate(node=>node.dataset.family==='material-flat'),'global style overwrote per-chip override');
  await rail.locator('.collection-filter').first().click();
  await waitUntil(()=>overlay.evaluate(node=>node.dataset.family==='ios-liquid'),'inherited chip did not use global style');
  pass('filter chip ownership','native scroll rail + sibling active overlay + per-chip override');

  frame=await selectComponent(page,'collection-bottom-sheet');
  const sheet=frame.locator('.collection-sheet');
  assert(await sheet.count()===1,'bottom sheet missing');
  for(const state of ['all','video','article','question','settings','all']){
    await switchValue(page,'data-kit-state',state);
    await waitUntil(()=>frame.locator(`.collection-tab[data-tab="${state}"]`).evaluate(node=>node.classList.contains('is-active')),`bottom sheet state failed: ${state}`);
    const geometry=await sheet.evaluate(node=>{const r=node.getBoundingClientRect();const s=getComputedStyle(node);return {w:r.width,h:r.height,display:s.display,transform:s.transform};});
    assert(geometry.w>300&&geometry.h>300&&geometry.display==='grid',`bottom sheet disappeared after ${state}: ${JSON.stringify(geometry)}`);
  }
  await frame.locator('.collection-tab[data-tab="question"]').click();
  await waitUntil(()=>page.locator('[data-kit-state="question"]').getAttribute('aria-pressed').then(value=>value==='true'),'preview tab did not sync parent state');
  assert(await sheet.count()===1,'bottom sheet DOM was replaced or lost after internal tab click');
  pass('bottom sheet state','one stable sheet; tab changes replace content only');

  frame=await selectComponent(page,'device-handoff-accordion');
  await switchValue(page,'data-kit-state','expanded');
  await waitUntil(()=>frame.locator('[data-device-panel]').evaluate(node=>!node.hidden),'device accordion did not expand');
  await frame.locator('[data-device-toggle]').click();
  await waitUntil(()=>page.locator('[data-kit-state="collapsed"]').getAttribute('aria-pressed').then(value=>value==='true'),'device preview did not sync collapsed state');
  pass('device accordion state','single direct component');

  frame=await selectComponent(page,'horizontal-card-rail');
  assert(await frame.locator('.component-card').count()===4,'card rail fixture missing');
  assert(await frame.locator('.component-card-rail').evaluate(node=>node.scrollWidth>node.clientWidth),'card rail does not have a real horizontal overflow case');
  pass('card rail fixture','direct component with overflow');

  await page.screenshot({path:path.join(OUT,'admin-component-runtime-v1.png'),fullPage:true});
  report.status='pass';
  await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report-v5.json'),JSON.stringify(report,null,2));await browser.close();}
