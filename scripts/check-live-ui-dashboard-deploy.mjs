import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=(process.env.UI_DASHBOARD_LIVE_URL||'https://photo-ebook.pages.dev').replace(/\/$/,'');
const ENTRY_MARKER='builder-entry-audit-v1.js?v=12';
const PREVIEW_MARKER='__platformComponentPreviewV1';
const ATTEMPTS=Math.max(1,Number(process.env.LIVE_DEPLOY_ATTEMPTS||90));
const INTERVAL=Math.max(500,Number(process.env.LIVE_DEPLOY_INTERVAL_MS||4000));
const OUT=path.resolve('artifacts/platform-live-deploy');
fs.mkdirSync(OUT,{recursive:true});

const report={startedAt:new Date().toISOString(),base:BASE,entryMarker:ENTRY_MARKER,previewMarker:PREVIEW_MARKER,attempts:[],checks:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function cacheBust(url){const join=url.includes('?')?'&':'?';return `${url}${join}deploy_check=${Date.now()}_${Math.random().toString(36).slice(2)}`;}
async function fetchText(url){const response=await fetch(cacheBust(url),{cache:'no-store',redirect:'follow',headers:{'cache-control':'no-cache','pragma':'no-cache','user-agent':'Photo-eBook-live-deploy-check/2.0'}});if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);return response.text();}

async function waitForLiveEntry(){
  let lastError='';
  for(let attempt=1;attempt<=ATTEMPTS;attempt++){
    const at=new Date().toISOString();
    try{
      const html=await fetchText(`${BASE}/ui-dashboard/`);const matched=html.includes(ENTRY_MARKER);
      report.attempts.push({attempt,at,status:'http-ok',matched,bytes:html.length});
      console.log(`[deploy ${attempt}/${ATTEMPTS}] HTTP OK; ${ENTRY_MARKER}=${matched}`);
      if(matched)return html;
      lastError=`latest HTML did not contain ${ENTRY_MARKER}`;
    }catch(error){lastError=error?.message||String(error);report.attempts.push({attempt,at,status:'error',error:lastError});console.log(`[deploy ${attempt}/${ATTEMPTS}] ${lastError}`);}
    if(attempt<ATTEMPTS)await sleep(INTERVAL);
  }
  throw new Error(`Cloudflare Pages did not expose the expected dashboard entry marker: ${lastError}`);
}

async function waitForComponentFrame(page,component){
  await page.waitForSelector('#builderFrame',{timeout:30000});
  await page.waitForFunction(name=>{
    const frame=document.querySelector('#builderFrame');
    if(!frame?.contentWindow?.__platformComponentPreviewV1)return false;
    const doc=frame.contentDocument;
    if(!doc?.querySelector('#componentPreviewRoot'))return false;
    try{return new URL(frame.src).searchParams.get('component')===name;}catch{return false;}
  },component,{timeout:30000});
  const handle=await page.$('#builderFrame');const frame=await handle?.contentFrame();assert(frame,'component preview iframe missing');return frame;
}

async function verifyLiveAdmin(){
  const runtime=await fetchText(`${BASE}/ui-dashboard/component-preview/component-preview-v1.js`);
  assert(runtime.includes(PREVIEW_MARKER),`live component preview runtime is stale; missing ${PREVIEW_MARKER}`);
  pass('live component preview asset',PREVIEW_MARKER);

  const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found on runner');
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
    await page.goto(cacheBust(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`),{waitUntil:'domcontentloaded',timeout:45000});
    await page.evaluate(()=>{try{localStorage.clear();sessionStorage.clear();}catch{}});
    await page.reload({waitUntil:'domcontentloaded',timeout:45000});
    let frame=await waitForComponentFrame(page,'filter-chip-rail');

    assert(await frame.locator('#app,.sandbox-hero').count()===0,'full sandbox page leaked into live component preview');
    const loadedScripts=await frame.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')||''));
    assert(!loadedScripts.some(src=>/sandbox-kit|filter-chip-live-runtime|bottom-sheet-parity|collection-hub/.test(src)),'legacy extraction/patch runtime loaded in live component preview');
    pass('live isolated preview boot','no full-page sandbox or repair patches');

    await page.locator('[data-kit-mode="material-flat"]').click();
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelector('.component-chip-stage')?.dataset.family==='material-flat',{timeout:15000});
    const material=await frame.locator('.collection-filters').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,overflowX:s.overflowX};});
    assert(material.background==='rgb(241, 243, 246)',`live Material rail drifted: ${material.background}`);
    assert(['auto','scroll'].includes(material.overflowX),'filter rail is not the horizontal scroll owner');
    const overlayIsSibling=await frame.locator('.component-chip-active').evaluate(node=>node.parentElement?.classList.contains('component-chip-viewport')&&!node.closest('.collection-filters'));
    assert(overlayIsSibling,'active chip is not a sibling overlay above the rail');
    pass('live filter ownership','rail scroll + sibling active overlay');

    const input=page.locator('#kitFilterItems input');await input.fill('브랜드 캠페인 촬영');await input.press('Enter');
    await frame.locator('.collection-filter').filter({hasText:'브랜드 캠페인 촬영'}).click();
    await page.locator('#kitFilterItemStyle select').selectOption('ios-liquid');
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelector('.component-chip-active')?.dataset.family==='ios-liquid',{timeout:15000});
    pass('live per-chip override','selected chip can differ from shared family');

    await page.locator('[data-kit-ui="collection-bottom-sheet"]').click();frame=await waitForComponentFrame(page,'collection-bottom-sheet');
    const sheet=frame.locator('.collection-sheet');
    for(const state of ['all','video','article','question','settings','all']){
      await page.locator(`[data-kit-state="${state}"]`).click();
      await page.waitForFunction(value=>document.querySelector('#builderFrame')?.contentDocument?.querySelector(`.collection-tab[data-tab="${value}"]`)?.classList.contains('is-active'),state,{timeout:15000});
      const geometry=await sheet.evaluate(node=>{const r=node.getBoundingClientRect();const s=getComputedStyle(node);return {w:r.width,h:r.height,display:s.display};});
      assert(geometry.w>300&&geometry.h>300&&geometry.display==='grid',`bottom sheet disappeared after ${state}: ${JSON.stringify(geometry)}`);
    }
    pass('live bottom sheet state','one stable sheet across all tabs');

    await page.screenshot({path:path.join(OUT,'live-admin-component-runtime.png'),fullPage:true});
    await context.close();
  }finally{await browser.close();}
}

try{await waitForLiveEntry();pass('live dashboard entry',ENTRY_MARKER);await verifyLiveAdmin();report.status='pass';}
catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));}
