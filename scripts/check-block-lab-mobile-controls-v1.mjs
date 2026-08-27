import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=(process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT=path.resolve('artifacts/block-lab-mobile-controls-v1');
fs.mkdirSync(OUT,{recursive:true});
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!executable)throw new Error('Chrome/Chromium missing');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
async function wait(fn,message,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){try{if(await fn())return;}catch{}await sleep(80);}throw new Error(message);}

const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded',timeout:45000});
  await wait(()=>page.locator('.platform-admin-workspace-host:not([hidden]) iframe').count().then(Boolean),'Block Lab workspace missing');
  const iframe=page.locator('.platform-admin-workspace-host:not([hidden]) iframe');
  await wait(()=>iframe.evaluate(node=>Boolean(node.contentDocument?.querySelector('.lab-controls > a[href="/ui-dashboard/"]'))),'Block Lab control link missing');
  const frame=iframe.contentFrame();
  const link=frame.locator('.lab-controls > a[href="/ui-dashboard/"]');
  const filter=frame.locator('.lab-controls > .lab-filter');
  const segments=frame.locator('.lab-controls > .lab-segment');
  const state=await link.evaluate(node=>{
    const style=getComputedStyle(node);
    const rect=node.getBoundingClientRect();
    const controls=node.parentElement;
    return {
      text:(node.textContent||'').trim(),
      width:rect.width,
      height:rect.height,
      whiteSpace:style.whiteSpace,
      flexShrink:style.flexShrink,
      controlsClientWidth:controls?.clientWidth||0,
      controlsScrollWidth:controls?.scrollWidth||0,
      documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  assert(state.text==='UI 라이브러리',`unexpected Library control label: ${state.text}`);
  assert(state.whiteSpace==='nowrap',`Library control wraps on mobile: white-space=${state.whiteSpace}`);
  assert(state.flexShrink==='0',`Library control still shrinks on mobile: flex-shrink=${state.flexShrink}`);
  assert(state.width>=70,`Library control collapsed to ${state.width}px`);
  assert(state.height<=44,`Library control stacked vertically to ${state.height}px`);
  assert(await filter.evaluate(node=>getComputedStyle(node).flexShrink)==='0','Block Lab filter shrinks in mobile control rail');
  const segmentShrink=await segments.evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).flexShrink));
  assert(segmentShrink.length>=2&&segmentShrink.every(value=>value==='0'),`Block Lab segments shrink in mobile rail: ${segmentShrink.join(',')}`);
  assert(state.documentOverflow<=2,`Block Lab document overflow ${state.documentOverflow}px`);
  assert(state.controlsScrollWidth>=state.controlsClientWidth,'Block Lab control rail geometry is invalid');
  await page.screenshot({path:path.join(OUT,'block-lab-mobile-controls.png'),fullPage:false});
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({status:'pass',state},null,2)+'\n');
  console.log(`Block Lab mobile controls OK: link ${Math.round(state.width)}×${Math.round(state.height)}px, rail ${state.controlsClientWidth}/${state.controlsScrollWidth}px.`);
  await context.close();
}finally{
  await browser.close();
}
