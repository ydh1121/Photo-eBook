import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=(process.env.UI_DASHBOARD_LIVE_URL||'https://photo-ebook.pages.dev').replace(/\/$/,'');
const ENTRY_MARKER='builder-entry-audit-v1.js?v=11';
const RUNTIME_MARKER='__platformGlobalChipRuntimeV4';
const STYLE_MARKER='platform-global-chip-style-v4';
const ATTEMPTS=Math.max(1,Number(process.env.LIVE_DEPLOY_ATTEMPTS||90));
const INTERVAL=Math.max(500,Number(process.env.LIVE_DEPLOY_INTERVAL_MS||4000));
const OUT=path.resolve('artifacts/platform-live-deploy');
fs.mkdirSync(OUT,{recursive:true});

const report={startedAt:new Date().toISOString(),base:BASE,entryMarker:ENTRY_MARKER,runtimeMarker:RUNTIME_MARKER,attempts:[],checks:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function cacheBust(url){const join=url.includes('?')?'&':'?';return `${url}${join}deploy_check=${Date.now()}_${Math.random().toString(36).slice(2)}`;}

async function fetchText(url){
  const response=await fetch(cacheBust(url),{cache:'no-store',redirect:'follow',headers:{'cache-control':'no-cache','pragma':'no-cache','user-agent':'Photo-eBook-live-deploy-check/1.0'}});
  if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function waitForLiveEntry(){
  let lastError='';
  for(let attempt=1;attempt<=ATTEMPTS;attempt++){
    const at=new Date().toISOString();
    try{
      const html=await fetchText(`${BASE}/ui-dashboard/`);const matched=html.includes(ENTRY_MARKER);
      report.attempts.push({attempt,at,status:'http-ok',matched,bytes:html.length});console.log(`[deploy ${attempt}/${ATTEMPTS}] HTTP OK; ${ENTRY_MARKER}=${matched}`);
      if(matched)return html;lastError=`latest HTML did not contain ${ENTRY_MARKER}`;
    }catch(error){lastError=error?.message||String(error);report.attempts.push({attempt,at,status:'error',error:lastError});console.log(`[deploy ${attempt}/${ATTEMPTS}] ${lastError}`);}
    if(attempt<ATTEMPTS)await sleep(INTERVAL);
  }
  throw new Error(`Cloudflare Pages did not expose the expected dashboard entry marker: ${lastError}`);
}

async function waitForFrame(page,kind){
  await page.waitForSelector('#builderFrame',{timeout:30000});
  await page.waitForFunction(previewKind=>{
    const frame=document.querySelector('#builderFrame');const doc=frame?.contentDocument;
    if(!doc?.documentElement?.dataset?.builderSandbox)return false;
    if(!frame.contentWindow?.__platformGlobalChipRuntimeV4)return false;
    if(!doc.querySelector('#platform-global-chip-style-v4'))return false;
    return previewKind?Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${previewKind}"]`)):true;
  },kind,{timeout:30000});
  const handle=await page.$('#builderFrame');const frame=await handle?.contentFrame();assert(frame,'sandbox iframe missing');return frame;
}

async function verifyLiveRuntime(){
  const runtime=await fetchText(`${BASE}/ui-dashboard/sandbox/global-chip-runtime-v1.js`);
  assert(runtime.includes(RUNTIME_MARKER),`live global chip runtime is stale; missing ${RUNTIME_MARKER}`);pass('live runtime asset',RUNTIME_MARKER);
  const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found on runner');
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
    await page.goto(cacheBust(`${BASE}/ui-dashboard/`),{waitUntil:'domcontentloaded',timeout:45000});await page.evaluate(()=>{try{localStorage.clear();sessionStorage.clear();}catch{}});

    await page.goto(cacheBust(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`),{waitUntil:'domcontentloaded',timeout:45000});
    let frame=await waitForFrame(page,'filter-chip-rail');await page.locator('[data-kit-mode="material-flat"]').click();
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformChipFamily==='material-flat',{timeout:15000});
    const materialFilter=await frame.locator('#collectionFilters').evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,shadow:style.boxShadow,backdrop:style.backdropFilter,scrollOwner:node.dataset.platformScrollOwner};});
    assert(materialFilter.background==='rgb(241, 243, 246)',`live Material filter rail drifted: ${materialFilter.background}`);
    assert(materialFilter.shadow==='none'&&materialFilter.backdrop==='none','live Material filter surface drifted');
    assert(materialFilter.scrollOwner==='photo-native','live filter rail is not using the photo-page native scroll owner');pass('live filter Material parity',materialFilter.background);

    await page.goto(cacheBust(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`),{waitUntil:'domcontentloaded',timeout:45000});frame=await waitForFrame(page,'top-chapter-navigation');
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformChipFamily==='material-flat',{timeout:15000});
    const materialNav=await frame.locator('.nav-scroll').evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,shadow:style.boxShadow,backdrop:style.backdropFilter};});
    assert(materialNav.background==='rgb(241, 243, 246)'&&materialNav.shadow==='none'&&materialNav.backdrop==='none','live Material nav surface drifted');pass('live filter → nav propagation','Material');

    await page.goto(cacheBust(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`),{waitUntil:'domcontentloaded',timeout:45000});frame=await waitForFrame(page,'filter-chip-rail');await page.locator('[data-kit-mode="ios-liquid"]').click();
    await page.waitForFunction(()=>{
      const doc=document.querySelector('#builderFrame')?.contentDocument;const floater=doc?.querySelector('.platform-filter-chip-float[data-family="ios-liquid"]');
      return doc?.documentElement?.dataset.platformChipFamily==='ios-liquid'&&floater&&getComputedStyle(floater).display!=='none';
    },{timeout:15000});
    const liquidFilter=await frame.locator('#collectionFilters').evaluate(node=>{const style=getComputedStyle(node);const stage=node.parentElement;const floater=stage?.querySelector(':scope > .platform-filter-chip-float');const old=node.querySelector(':scope > .platform-filter-chip-indicator');return {backdrop:style.backdropFilter,stage:Boolean(stage?.classList.contains('platform-filter-chip-stage')),floatVisible:Boolean(floater&&getComputedStyle(floater).display!=='none'),oldIndicatorHidden:Boolean(old&&getComputedStyle(old).display==='none')};});
    assert(liquidFilter.backdrop.includes('blur(22px)')&&liquidFilter.backdrop.includes('saturate(1.38)'),`live iOS Liquid filter glass drifted: ${liquidFilter.backdrop}`);
    assert(liquidFilter.stage&&liquidFilter.floatVisible&&liquidFilter.oldIndicatorHidden,'live iOS Liquid filter is not floating above the rail');pass('live filter iOS Liquid parity',liquidFilter.backdrop);

    await page.goto(cacheBust(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`),{waitUntil:'domcontentloaded',timeout:45000});frame=await waitForFrame(page,'top-chapter-navigation');
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformChipFamily==='ios-liquid',{timeout:15000});
    const liquidNav=await frame.locator('.nav-scroll').evaluate(node=>getComputedStyle(node).backdropFilter);
    assert(liquidNav.includes('blur(22px)')&&liquidNav.includes('saturate(1.38)'),`live iOS Liquid nav glass drifted: ${liquidNav}`);pass('live filter → nav propagation','iOS Liquid');

    await page.screenshot({path:path.join(OUT,'live-global-chip-parity.png'),fullPage:true});await context.close();
  }finally{await browser.close();}
}

try{await waitForLiveEntry();pass('live dashboard entry',ENTRY_MARKER);await verifyLiveRuntime();report.status='pass';}
catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));}
