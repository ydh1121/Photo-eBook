import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=14000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
async function frameFor(page,preview=''){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(kind=>{const doc=document.querySelector('#builderFrame')?.contentDocument;if(!doc?.documentElement?.dataset.builderSandbox)return false;return kind?Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${kind}"]`)):Boolean(doc.querySelector('#app'));},preview),`frame not ready: ${preview||'page'}`);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'frame missing');return frame;
}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=collection-bottom-sheet`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.removeItem('platformBuilderKitStateV2');localStorage.removeItem('platformBuilderCapabilityConfigsV2');});
  await page.reload({waitUntil:'domcontentloaded'});
  let frame=await frameFor(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('#sandboxPreviewRoot').evaluate(node=>node.dataset.bottomSheetParityReady==='true'),'bottom sheet parity repair not ready');
  assert(await page.locator('[data-kit-state="all"][aria-pressed="true"]').count()===1,'bottom sheet did not enter on 전체 state');
  const visible=await frame.locator('#collectionSheet').evaluate(node=>{const r=node.getBoundingClientRect();const s=getComputedStyle(node);return {hidden:node.hidden,open:node.classList.contains('is-open'),display:s.display,w:r.width,h:r.height,top:r.top,bottom:r.bottom,viewport:innerHeight};});
  assert(!visible.hidden&&visible.open&&visible.display!=='none','bottom sheet is not visibly open');
  assert(visible.w>360&&visible.w<=780&&visible.h>400&&visible.bottom>visible.viewport-4,'bottom sheet geometry is broken');
  for(const tab of ['video','all','settings']){
    await page.locator(`[data-kit-state="${tab}"]`).click();
    await waitUntil(()=>frame.locator(`.collection-tab[data-library-tab="${tab}"]`).evaluate(node=>node.classList.contains('is-active')),`bottom sheet tab did not change: ${tab}`);
    const state=await frame.locator('#collectionSheet').evaluate(node=>{const r=node.getBoundingClientRect();return {hidden:node.hidden,open:node.classList.contains('is-open'),w:r.width,h:r.height,bottom:r.bottom,viewport:innerHeight};});
    assert(!state.hidden&&state.open&&state.w>360&&state.h>400&&state.bottom>state.viewport-4,`bottom sheet broke after ${tab}`);
  }
  console.log('✓ bottom sheet canonical state + stable layout');

  await page.setViewportSize({width:1920,height:1100});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.setItem('platformBuilderSideAdsV1',JSON.stringify({left:{enabled:true,width:110,height:430,top:108,gap:56,follow:true},right:{enabled:true,width:110,height:430,top:108,gap:56,follow:true}})));
  await page.reload({waitUntil:'domcontentloaded'});
  frame=await frameFor(page);
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adZoneActive==='true'),'left outer ad not active at hero');
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="right"]').evaluate(node=>node.dataset.adZoneActive==='true'),'right outer ad not active at hero');
  const heroPos=await frame.evaluate(()=>({left:Number(document.querySelector('[data-builder-ad-slot="left"]').dataset.adLaneX),right:Number(document.querySelector('[data-builder-ad-slot="right"]').dataset.adLaneX),placement:document.querySelector('[data-builder-ad-slot="left"]').dataset.adPlacement}));
  assert(heroPos.placement==='outer-gutter','side ad is not using outer-gutter placement');
  await frame.locator('#dummy-content .section .content').evaluate(node=>window.scrollTo({top:node.getBoundingClientRect().top+window.scrollY+180,behavior:'instant'}));
  await sleep(260);
  const bodyPos=await frame.evaluate(()=>({leftActive:document.querySelector('[data-builder-ad-slot="left"]').dataset.adZoneActive==='true',rightActive:document.querySelector('[data-builder-ad-slot="right"]').dataset.adZoneActive==='true',left:Number(document.querySelector('[data-builder-ad-slot="left"]').dataset.adLaneX),right:Number(document.querySelector('[data-builder-ad-slot="right"]').dataset.adLaneX)}));
  assert(bodyPos.leftActive&&bodyPos.rightActive,'side ads disappeared while crossing hero/body');
  assert(Math.abs(bodyPos.left-heroPos.left)<=2&&Math.abs(bodyPos.right-heroPos.right)<=2,'side ad x position jumps between hero and body');

  const before=await page.locator('#builderFrame').evaluate(node=>node.getBoundingClientRect().width);
  await page.locator('#builderCanvasWideToggle').click();
  await waitUntil(()=>page.evaluate(()=>document.documentElement.dataset.adminCanvasWide==='true'),'wide canvas flag missing');
  const wide=await page.evaluate(()=>({padding:getComputedStyle(document.body).paddingLeft,sidebar:document.querySelector('.platform-admin-shell')?.getBoundingClientRect().right||0,frame:document.querySelector('#builderFrame')?.getBoundingClientRect().width||0}));
  assert(wide.padding==='0px'&&wide.sidebar<=2&&wide.frame>before+100,`wide canvas did not free the left admin gutter: ${JSON.stringify(wide)}`);
  console.log('✓ stable outer ads + wide canvas');
  await page.close();await context.close();
}finally{await browser.close();}
