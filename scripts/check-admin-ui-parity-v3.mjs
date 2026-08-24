import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=14000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
async function pageFrame(page){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(()=>Boolean(document.querySelector('#builderFrame')?.contentDocument?.querySelector('#app'))),'page sandbox not ready');
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'frame missing');return frame;
}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext();const page=await context.newPage();await page.setViewportSize({width:1920,height:1100});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.setItem('platformBuilderSideAdsV1',JSON.stringify({left:{enabled:true,width:110,height:430,top:108,gap:56,follow:true},right:{enabled:true,width:110,height:430,top:108,gap:56,follow:true}})));
  await page.reload({waitUntil:'domcontentloaded'});const frame=await pageFrame(page);
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adZoneActive==='true'),'left outer ad not active');
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="right"]').evaluate(node=>node.dataset.adZoneActive==='true'),'right outer ad not active');
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
  await waitUntil(()=>page.evaluate(()=>{const shell=document.querySelector('.platform-admin-shell');return shell?Math.abs(shell.getBoundingClientRect().right)<=2:false;}),'wide canvas sidebar transition did not finish');
  const wide=await page.evaluate(()=>({padding:getComputedStyle(document.body).paddingLeft,sidebar:document.querySelector('.platform-admin-shell')?.getBoundingClientRect().right||0,frame:document.querySelector('#builderFrame')?.getBoundingClientRect().width||0}));
  assert(wide.padding==='0px'&&Math.abs(wide.sidebar)<=2&&wide.frame>before+100,`wide canvas did not free the left admin gutter: ${JSON.stringify(wide)}`);
  console.log('✓ stable outer ads + wide canvas');
  await page.close();await context.close();
}finally{await browser.close();}
