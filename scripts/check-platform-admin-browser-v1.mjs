import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-admin-browser');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],widths:[],screenshots:[]};
function assert(value,message){if(!value)throw new Error(message);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitUntil(fn,message,timeout=12000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function chromePath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function frameFor(page){await page.waitForSelector('#builderFrame',{timeout:15000});await waitUntil(()=>page.evaluate(()=>{const doc=document.querySelector('#builderFrame')?.contentDocument;return Boolean(doc?.documentElement?.dataset?.builderSandbox&&doc.querySelector('#app'));}),'builder sandbox not ready',20000);const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'builder frame missing');return frame;}

const executablePath=chromePath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyBlockReorder(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1100});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});const frame=await frameFor(page);
  await waitUntil(()=>frame.locator('.platform-builder-block-handle').count().then(n=>n>0),'block handles missing',16000);
  const before=await frame.evaluate(()=>[...document.querySelectorAll('#app > [data-builder-block-id]')].map(node=>node.dataset.builderBlockId));
  const sourceId=await frame.locator('#dummy-content').getAttribute('data-builder-block-id');
  const targetId=await frame.locator('#dummy-actions').getAttribute('data-builder-block-id');
  assert(sourceId&&targetId,'reorder source/target ids missing');
  assert(before.indexOf(sourceId)<before.indexOf(targetId),'unexpected initial block order');
  await frame.evaluate(()=>{
    const source=document.querySelector('#dummy-content');
    const target=document.querySelector('#dummy-actions');
    const dataTransfer=new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer}));
    const rect=target.getBoundingClientRect();
    target.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer,clientY:rect.bottom-1}));
    target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer,clientY:rect.bottom-1}));
    source.dispatchEvent(new DragEvent('dragend',{bubbles:true,cancelable:true,dataTransfer}));
  });
  await waitUntil(()=>frame.evaluate(([source,target])=>{const ids=[...document.querySelectorAll('#app > [data-builder-block-id]')].map(node=>node.dataset.builderBlockId);return ids.indexOf(source)>ids.indexOf(target);},[sourceId,targetId]),'DOM block order did not change');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformBuilderLayoutV1')||'null'));
  assert(saved?.ids?.indexOf(sourceId)>saved?.ids?.indexOf(targetId),'persisted block order did not follow drop');
  const nav=frame.locator('.nav-shell');assert(!(await nav.evaluate(node=>node.classList.contains('platform-builder-block'))),'fixed nav became draggable after reorder');
  pass('block drag/drop','DragEvent moves content block and persists new order');
  await shot(page,'block-reorder-desktop');
  await page.close();
}

async function enableSide(page,side){
  const id=side==='left'?'#builderAdLeft':'#builderAdRight';
  const menu=page.locator('.builder-action-menu').filter({has:page.locator(id)});
  if(!(await menu.getAttribute('open')))await menu.locator('summary').click();
  await page.locator(id).click();
  const panel=page.locator(`.builder-ad-inspector[data-ad-inspector="${side}"]`);await panel.waitFor({state:'visible'});
  if(side==='left'){
    const geometry=await page.evaluate(()=>{
      const admin=document.querySelector('.platform-admin-shell')?.getBoundingClientRect();
      const panel=document.querySelector('.builder-ad-inspector[data-ad-inspector="left"]')?.getBoundingClientRect();
      return {adminRight:admin?.right||0,panelLeft:panel?.left||0};
    });
    assert(geometry.panelLeft>=geometry.adminRight,`left ad inspector overlaps admin shell (${geometry.panelLeft} < ${geometry.adminRight})`);
  }
  const enabled=panel.locator('[data-ad-control="enabled"]');if(!(await enabled.isChecked()))await enabled.check();
  await panel.locator('[data-close-ad-inspector]').click();
}
async function bodyZone(frame){
  await frame.locator('#dummy-content .section .content').evaluate(node=>{const top=node.getBoundingClientRect().top+window.scrollY;window.scrollTo({top:Math.max(0,top+140),behavior:'instant'});});
  await sleep(260);
}
async function expectedSideState(frame){
  return frame.evaluate(()=>{
    const viewportH=innerHeight;
    const candidates=[...document.querySelectorAll('.chapter .section .content')]
      .map(node=>({rect:node.getBoundingClientRect()}))
      .filter(({rect})=>rect.width>260&&rect.height>120&&rect.bottom>90&&rect.top<viewportH-40)
      .map(item=>({...item,visible:Math.max(0,Math.min(item.rect.bottom,viewportH)-Math.max(item.rect.top,0))}))
      .filter(item=>item.visible>100)
      .sort((a,b)=>b.visible-a.visible);
    const body=candidates[0]?.rect;
    const preferredTop=108,width=110,gap=40;
    const heroAtAnchor=[...document.querySelectorAll('.hero,.chapter-hero')].some(node=>{const rect=node.getBoundingClientRect();return rect.bottom>preferredTop&&rect.top<preferredTop;});
    if(!body)return {innerWidth,left:false,right:false,leftRoom:0,rightRoom:0,heroAtAnchor,visibleHeight:0};
    const visibleTop=Math.max(body.top,18),visibleBottom=Math.min(body.bottom,innerHeight-18),visibleHeight=visibleBottom-visibleTop;
    const leftX=body.left-gap-width,rightX=body.right+gap;
    const base=innerWidth>=1360&&!heroAtAnchor&&visibleHeight>=150;
    const left=base&&leftX>=10&&leftX+width<=innerWidth-10;
    const right=base&&rightX>=10&&rightX+width<=innerWidth-10;
    return {innerWidth,left,right,leftRoom:body.left,rightRoom:innerWidth-body.right,heroAtAnchor,visibleHeight,leftX,rightX};
  });
}
async function verifySideWidths(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1100});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});let frame=await frameFor(page);
  await enableSide(page,'left');await enableSide(page,'right');
  for(const width of [1280,1440,1536,1600,1920]){
    await page.setViewportSize({width,height:1100});frame=await frameFor(page);await bodyZone(frame);
    const expected=await expectedSideState(frame);
    await waitUntil(async()=>{
      const actual=await frame.evaluate(()=>({left:document.querySelector('[data-builder-ad-slot="left"]')?.dataset.adZoneActive==='true',right:document.querySelector('[data-builder-ad-slot="right"]')?.dataset.adZoneActive==='true'}));
      return actual.left===expected.left&&actual.right===expected.right;
    },`side ad geometry mismatch at outer width ${width}`,5000);
    const actual=await frame.evaluate(()=>({left:document.querySelector('[data-builder-ad-slot="left"]')?.dataset.adZoneActive==='true',right:document.querySelector('[data-builder-ad-slot="right"]')?.dataset.adZoneActive==='true'}));
    report.widths.push({outerWidth:width,...expected,actual});
  }
  assert(report.widths.find(item=>item.outerWidth===1280)?.actual.left===false,'left ad visible at narrow desktop');
  assert(report.widths.find(item=>item.outerWidth===1920)?.actual.left===true,'left ad hidden at wide desktop');
  assert(report.widths.find(item=>item.outerWidth===1920)?.actual.right===true,'right ad hidden at wide desktop');
  pass('side ad width boundaries','left/right geometry verified at 1280/1440/1536/1600/1920');
  await shot(page,'side-ads-wide-desktop');
  await page.close();
}

async function verifyAdminPages(context){
  const pages=[
    {path:'/block-lab/',current:'/block-lab/',name:'block-lab'},
    {path:'/editor-lab/',current:'/editor-lab/',name:'editor-lab'},
    {path:'/qa/video-editor/',current:'/qa/video-editor/',name:'qa'}
  ];
  const page=await context.newPage();
  for(const spec of pages){
    await page.setViewportSize({width:1440,height:1000});await page.goto(`${BASE}${spec.path}`,{waitUntil:'domcontentloaded'});await page.locator('.platform-admin-shell').waitFor({state:'visible'});
    assert((await page.locator('meta[name="robots"]').getAttribute('content')||'').includes('noindex'),`${spec.name}: noindex missing`);
    assert(await page.locator('.platform-admin-shell__nav a').count()===5,`${spec.name}: management nav item count mismatch`);
    const current=page.locator('.platform-admin-shell__nav a[aria-current="page"]');assert(await current.count()===1,`${spec.name}: current management item missing`);
    assert((await current.getAttribute('href'))===spec.current,`${spec.name}: wrong current management href`);
    const desktopShell=await page.locator('.platform-admin-shell').evaluate(node=>({position:getComputedStyle(node).position,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));
    assert(desktopShell.position==='fixed'&&desktopShell.width>=190,`${spec.name}: desktop sidebar geometry wrong`);

    await page.setViewportSize({width:390,height:844});await page.reload({waitUntil:'domcontentloaded'});await page.locator('.platform-admin-shell').waitFor({state:'visible'});
    const mobile=await page.locator('.platform-admin-shell').evaluate(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height,top:getComputedStyle(node).top}));
    assert(Math.abs(mobile.width-390)<2,`${spec.name}: mobile admin shell not full width (${mobile.width})`);
    assert(mobile.height<=60,`${spec.name}: mobile admin shell too tall (${mobile.height})`);
    assert(await page.locator('.platform-admin-shell__nav a[aria-current="page"]').count()===1,`${spec.name}: mobile current item missing`);
    await shot(page,`${spec.name}-mobile`);
  }
  pass('management shell','Block Lab / Page Editor / QA desktop+mobile current nav and noindex');
  await page.close();
}

try{
  const context=await browser.newContext();
  await verifyBlockReorder(context);
  await verifySideWidths(context);
  await verifyAdminPages(context);
  await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
