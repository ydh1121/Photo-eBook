import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
async function wait(fn,message,timeout=30000){
  const started=Date.now();let last;
  while(Date.now()-started<timeout){
    try{if(await fn())return;}catch(error){last=error;}
    await sleep(80);
  }
  if(last)throw last;
  throw new Error(message);
}
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function navState(frameOrPage){
  return frameOrPage.locator('.nav-scroll').evaluate(node=>{
    const indicator=node.querySelector(':scope > .nav-v33-indicator');
    const style=getComputedStyle(node);
    const indicatorStyle=indicator?getComputedStyle(indicator):null;
    return {
      controller:Boolean(node.__photoLiquidController),
      indicator:Boolean(indicator),
      canonicalInstalled:Boolean(window.__photoCanonicalLiquidInstalled),
      touchAction:style.touchAction,
      overflowX:style.overflowX,
      moduleMotion:node.dataset.moduleMotion||'',
      transform:indicator?.style.transform||'',
      transitionDuration:indicatorStyle?.transitionDuration||'',
      transitionTimingFunction:indicatorStyle?.transitionTimingFunction||''
    };
  });
}

function ownsNativeHorizontalPan(state){
  const touch=String(state?.touchAction||'').toLowerCase();
  return state?.overflowX==='auto'&&(touch==='auto'||touch==='manipulation'||touch.includes('pan-x'));
}

async function moveIndicator(frameOrPage,index=2){
  const indicator=frameOrPage.locator('.nav-v33-indicator');
  const before=await indicator.evaluate(node=>node.style.transform);
  await frameOrPage.locator('.nav-chip').nth(index).click();
  await wait(()=>indicator.evaluate((node,old)=>node.style.transform!==old,before),'top-nav liquid indicator did not move');
  await sleep(40);
  return indicator.evaluate(node=>({
    transform:node.style.transform,
    duration:getComputedStyle(node).transitionDuration,
    easing:getComputedStyle(node).transitionTimingFunction
  }));
}

try{
  const context=await browser.newContext();

  const publicPage=await context.newPage();
  await publicPage.setViewportSize({width:390,height:844});
  await publicPage.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await wait(()=>publicPage.locator('#app:not([hidden]) .nav-scroll').count().then(Boolean),'photography public nav missing');
  await wait(()=>publicPage.locator('.nav-scroll').evaluate(node=>Boolean(node.__photoLiquidController&&node.querySelector(':scope > .nav-v33-indicator'))),'photography public canonical liquid controller missing');
  const publicBefore=await navState(publicPage);
  const publicMoved=await moveIndicator(publicPage,2);
  assert(publicBefore.canonicalInstalled&&publicBefore.controller&&publicBefore.indicator,'photography public top-nav is not using canonical liquid owner');
  assert(ownsNativeHorizontalPan(publicBefore),`photography public mobile nav lost native pan ownership: touch-action=${publicBefore.touchAction}, overflow-x=${publicBefore.overflowX}`);
  assert(publicMoved.easing.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'),'photography public Breeze easing changed unexpectedly');

  const libraryPage=await context.newPage();
  await libraryPage.setViewportSize({width:1440,height:1000});
  await libraryPage.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await wait(()=>libraryPage.locator('#builderFrame').count().then(Boolean),'Library preview frame missing');
  await libraryPage.locator('[data-kit-viewport="mobile"]').click();
  const frameHandle=await libraryPage.$('#builderFrame');
  const frame=await frameHandle.contentFrame();
  assert(frame,'Library preview iframe missing');
  await wait(()=>frame.locator('.nav-scroll').count().then(Boolean),'Library top-nav missing');
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>Boolean(node.__photoLiquidController&&node.querySelector(':scope > .nav-v33-indicator'))),'Library top-nav canonical liquid controller missing');

  await frame.locator('.nav-scroll').evaluate(node=>{node.dataset.qaBeforeRemount='true';});
  await frame.evaluate(()=>window.postMessage({
    type:'platform-module-props',
    moduleId:'top-chapter-navigation',
    props:{items:[
      {id:'intro','칩':'시작'},{id:'market','칩':'시장'},{id:'education','칩':'교육'},{id:'skills','칩':'실무'},
      {id:'portfolio','칩':'포트폴리오'},{id:'gear','칩':'장비'},{id:'plan','칩':'수익'},{id:'scripts','칩':'영업'},
      {id:'iphone','칩':'아이폰'},{id:'sources','칩':'자료'}
    ]}
  },location.origin));
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.qaBeforeRemount!=='true'),'Library module did not remount for regression test');
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>Boolean(node.__photoLiquidController&&node.querySelector(':scope > .nav-v33-indicator'))),'canonical liquid owner did not reattach after Library remount');

  const libraryBefore=await navState(frame);
  const libraryMoved=await moveIndicator(frame,2);
  assert(libraryBefore.canonicalInstalled&&libraryBefore.controller&&libraryBefore.indicator,'Library top-nav is a visual shell without canonical interaction owner');
  assert(libraryBefore.moduleMotion==='','Library defaults override the photography Breeze motion');
  assert(ownsNativeHorizontalPan(libraryBefore),`Library mobile nav lost native pan ownership: touch-action=${libraryBefore.touchAction}, overflow-x=${libraryBefore.overflowX}`);
  assert(libraryMoved.easing===publicMoved.easing,`Library Breeze easing differs from photography public page: ${libraryMoved.easing} vs ${publicMoved.easing}`);
  assert(libraryMoved.duration!=='0s','Library top-nav Breeze transition has zero duration');

  console.log(`Top navigation runtime parity OK: Photography/Public and Library share canonical liquid owner, native pan, remount recovery, and Breeze easing. Public touch-action=${publicBefore.touchAction}; Library touch-action=${libraryBefore.touchAction}.`);
  await context.close();
}catch(error){
  console.error(error?.stack||String(error));
  process.exitCode=1;
}finally{
  await browser.close();
}
