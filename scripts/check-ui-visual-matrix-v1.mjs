import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=(process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT=path.resolve('artifacts/ui-visual-matrix-v1');
fs.mkdirSync(OUT,{recursive:true});

const LIBRARY_MODULES=[
  'top-chapter-navigation',
  'filter-chip-rail',
  'horizontal-card-rail',
  'collection-bottom-sheet',
  'device-handoff-accordion',
  'floating-action',
  'horizontal-rail',
  'accordion',
  'bottom-sheet',
  'screen-mode-selector',
  'learning-guide-hero',
  'learning-guide-section',
  'subject-navigation'
];
const LIBRARY_STATES=[
  {name:'desktop-light',viewport:'desktop',theme:'light'},
  {name:'desktop-dark',viewport:'desktop',theme:'dark'},
  {name:'mobile-light',viewport:'mobile',theme:'light'},
  {name:'mobile-dark',viewport:'mobile',theme:'dark'}
];
const ADMIN_ROUTES=[
  {name:'editor',href:'/editor-lab/',ready:'.editor-lab',darkSurface:'.editor-library'},
  {name:'block-lab',href:'/block-lab/',ready:'.block-lab',darkSurface:'.lab-sidebar'},
  {name:'qa',href:'/qa/video-editor/',ready:'.qa-shell,.qa-stage',darkSurface:'.qa-toolbar'}
];
const ADMIN_STATES=[
  {name:'desktop-light',width:1440,height:1000,theme:'light'},
  {name:'desktop-dark',width:1440,height:1000,theme:'dark'},
  {name:'mobile-light',width:390,height:844,theme:'light'},
  {name:'mobile-dark',width:390,height:844,theme:'dark'}
];

const report={startedAt:new Date().toISOString(),base:BASE,library:[],admin:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');

function safe(value){return String(value).replace(/[^a-z0-9-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase();}
function rgbDark(value){const match=String(value||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return Boolean(match)&&Math.max(...match.slice(1,4).map(Number))<100;}
async function wait(fn,message,timeout=24000){
  const started=Date.now();let last;
  while(Date.now()-started<timeout){
    try{if(await fn())return;}catch(error){last=error;}
    await sleep(80);
  }
  if(last)throw new Error(`${message}: ${last.message||last}`);
  throw new Error(message);
}
async function shot(locator,name){
  const file=`${safe(name)}.png`;
  await locator.screenshot({path:path.join(OUT,file)});
  report.screenshots.push(file);
  return file;
}
async function selectLibraryModule(page,id){
  const button=page.locator(`[data-kit-ui="${id}"]`);
  await button.waitFor({state:'visible',timeout:16000});
  if(await button.getAttribute('aria-pressed')!=='true')await button.click();
  await wait(()=>page.evaluate(moduleId=>{
    const frame=document.querySelector('#builderFrame');
    const doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));
  },id),`Library frame did not mount ${id}`);
  return page.frameLocator('#builderFrame');
}
async function moduleReady(frame,id){
  const selectors={
    'top-chapter-navigation':'.nav-shell[data-platform-module="top-chapter-navigation"] .nav-chip',
    'filter-chip-rail':'.platform-filter-chip-module [data-platform-filter-id]',
    'horizontal-card-rail':'[data-platform-module="horizontal-card-rail"]',
    'collection-bottom-sheet':'#collectionSheet.is-open',
    'device-handoff-accordion':'.collection-device-accordion #collectionDeviceLink',
    'floating-action':'[data-platform-module="floating-action"],#collectionFab',
    'horizontal-rail':'.platform-horizontal-rail__card',
    'accordion':'.platform-accordion__item',
    'bottom-sheet':'.platform-bottom-sheet[data-platform-module="bottom-sheet"]',
    'screen-mode-selector':'.platform-screen-mode [data-screen-mode-value]',
    'learning-guide-hero':'[data-platform-module="learning-guide-hero"] h1',
    'learning-guide-section':'[data-platform-module="learning-guide-section"] .edu-checklist',
    'subject-navigation':'[data-platform-module="subject-navigation"] .subject-nav a'
  };
  const minimum={
    'top-chapter-navigation':8,
    'filter-chip-rail':4,
    'horizontal-card-rail':1,
    'collection-bottom-sheet':1,
    'device-handoff-accordion':1,
    'floating-action':1,
    'horizontal-rail':3,
    'accordion':2,
    'bottom-sheet':1,
    'screen-mode-selector':3,
    'learning-guide-hero':1,
    'learning-guide-section':1,
    'subject-navigation':2
  };
  const selector=selectors[id];
  await wait(()=>frame.locator(selector).count().then(count=>count>=minimum[id]),`${id} readiness failed`);
}
async function syncLibraryTheme(page,frame,id,state){
  if(id==='screen-mode-selector'){
    const button=frame.locator(`[data-screen-mode-value="${state.theme}"]`);
    await button.waitFor({state:'visible',timeout:10000});
    if(await button.getAttribute('aria-pressed')!=='true')await button.click();
    await wait(()=>frame.locator('html').evaluate((html,want)=>html.dataset.theme===want,state.theme),`${id}/${state.name}: owned theme selection failed`);
    return;
  }
  await wait(()=>page.locator('#builderFrame').evaluate((node,want)=>node.contentDocument?.documentElement?.dataset.theme===want,state.theme),`${id}/${state.name}: parent theme propagation failed`);
}
async function frameMetrics(page,frame,id,state){
  const iframe=page.locator('#builderFrame');
  const iframeWidth=await iframe.evaluate(node=>node.getBoundingClientRect().width);
  if(state.viewport==='mobile')assert(iframeWidth<=405,`${id}/${state.name}: preview width ${iframeWidth} is not mobile`);
  else assert(iframeWidth>405,`${id}/${state.name}: preview width ${iframeWidth} is not desktop`);

  const metrics=await frame.locator('html').evaluate((html,moduleId)=>{
    const doc=html.ownerDocument;
    const body=doc.body;
    const root=doc.querySelector(`[data-platform-module="${moduleId}"]`);
    const rect=root?.getBoundingClientRect();
    const text=body?.innerText||'';
    return {
      theme:html.dataset.theme||'',
      choice:html.dataset.themeChoice||'',
      clientWidth:html.clientWidth,
      scrollWidth:html.scrollWidth,
      bodyScrollWidth:body?.scrollWidth||0,
      bodyBg:getComputedStyle(body).backgroundColor,
      rootBg:root?getComputedStyle(root).backgroundColor:'',
      rootHeight:rect?.height||0,
      rootWidth:rect?.width||0,
      objectLeak:text.includes('[object Object]')
    };
  },id);
  assert(metrics.theme===state.theme,`${id}/${state.name}: iframe theme ${metrics.theme} != ${state.theme}`);
  assert(metrics.scrollWidth-metrics.clientWidth<=3,`${id}/${state.name}: document overflow ${metrics.scrollWidth-metrics.clientWidth}px`);
  assert(metrics.rootHeight>0&&metrics.rootWidth>0,`${id}/${state.name}: module root has zero geometry`);
  assert(!metrics.objectLeak,`${id}/${state.name}: visible [object Object] leak`);

  if(state.theme==='dark'){
    const critical={
      'screen-mode-selector':'.platform-screen-mode',
      'collection-bottom-sheet':'#collectionSheet',
      'bottom-sheet':'.platform-bottom-sheet__panel',
      'learning-guide-section':'.edu-checklist'
    }[id];
    if(critical){
      const value=await frame.locator(critical).first().evaluate(node=>getComputedStyle(node).backgroundColor);
      assert(rgbDark(value),`${id}/${state.name}: dark critical surface is bright (${value})`);
    }
  }
  return {iframeWidth,...metrics};
}

async function runLibraryMatrix(browser){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${LIBRARY_MODULES[0]}`,{waitUntil:'domcontentloaded',timeout:45000});
  await wait(()=>page.locator('.platform-admin-shell').count().then(Boolean),'Library admin shell missing');
  await wait(()=>page.evaluate(ids=>{
    const actual=window.PlatformModuleRegistry?.listFor?.('library')?.map(def=>def.id)||[];
    return actual.length===ids.length&&ids.every(id=>actual.includes(id));
  },LIBRARY_MODULES),`Library Registry did not expose the ${LIBRARY_MODULES.length} approved modules`);

  for(const state of LIBRARY_STATES){
    const theme=page.locator(`[data-kit-theme="${state.theme}"]`);
    const viewport=page.locator(`[data-kit-viewport="${state.viewport}"]`);
    await theme.click();
    await viewport.click();

    for(const id of LIBRARY_MODULES){
      const frame=await selectLibraryModule(page,id);
      await moduleReady(frame,id);
      await syncLibraryTheme(page,frame,id,state);
      await sleep(110);
      const metrics=await frameMetrics(page,frame,id,state);
      const screenshot=await shot(page.locator('#builderFrame'),`library-${id}-${state.name}`);
      report.library.push({module:id,state:state.name,status:'pass',metrics,screenshot});
      console.log(`✓ Library ${id} ${state.name} — ${Math.round(metrics.iframeWidth)}px, overflow ${metrics.scrollWidth-metrics.clientWidth}px`);
    }
  }
  await context.close();
}

async function waitWorkspace(page,route){
  await wait(()=>page.locator('.platform-admin-shell').count().then(Boolean),`${route.name}: admin shell missing`);
  await wait(()=>page.locator('.platform-admin-workspace-host:not([hidden]) iframe').count().then(Boolean),`${route.name}: workspace iframe missing`);
  const iframe=page.locator('.platform-admin-workspace-host:not([hidden]) iframe');
  await wait(()=>iframe.evaluate((node,href)=>{
    const src=node.getAttribute('src')||'';
    const doc=node.contentDocument;
    return src.includes(href)&&Boolean(doc?.querySelector('body'));
  },route.href),`${route.name}: workspace route did not settle`);
  const frame=iframe.contentFrame();
  await wait(()=>frame.locator(route.ready).count().then(Boolean),`${route.name}: ready surface missing`);
  return {iframe,frame};
}
async function setAdminTheme(page,theme,stateName,routeName){
  const button=page.locator(`[data-admin-theme-value="${theme}"]`);
  await wait(()=>button.count().then(Boolean),`${routeName}/${stateName}: admin theme control missing`);
  if(await button.getAttribute('aria-pressed')!=='true')await button.evaluate(node=>node.click());
}
async function runAdminMatrix(browser){
  for(const state of ADMIN_STATES){
    const context=await browser.newContext({viewport:{width:state.width,height:state.height}});
    const page=await context.newPage();
    for(const route of ADMIN_ROUTES){
      await page.goto(`${BASE}${route.href}`,{waitUntil:'domcontentloaded',timeout:45000});
      const {iframe,frame}=await waitWorkspace(page,route);
      await setAdminTheme(page,state.theme,state.name,route.name);
      await wait(()=>iframe.evaluate((node,want)=>node.contentDocument?.documentElement?.dataset.adminThemeResolved===want,state.theme),`${route.name}/${state.name}: embedded theme propagation failed`);
      await sleep(90);

      const metrics=await frame.locator('html').evaluate(html=>({
        theme:html.dataset.adminThemeResolved||'',
        clientWidth:html.clientWidth,
        scrollWidth:html.scrollWidth,
        bodyScrollWidth:html.ownerDocument.body?.scrollWidth||0
      }));
      assert(metrics.theme===state.theme,`${route.name}/${state.name}: embedded theme ${metrics.theme}`);
      assert(metrics.scrollWidth-metrics.clientWidth<=4,`${route.name}/${state.name}: embedded document overflow ${metrics.scrollWidth-metrics.clientWidth}px`);
      if(state.theme==='dark'){
        const surface=frame.locator(route.darkSurface).first();
        await wait(()=>surface.count().then(Boolean),`${route.name}/${state.name}: dark surface missing`);
        const bg=await surface.evaluate(node=>getComputedStyle(node).backgroundColor);
        assert(rgbDark(bg),`${route.name}/${state.name}: representative dark surface is bright (${bg})`);
        metrics.darkSurface=bg;
      }
      const screenshot=await shot(page.locator('body'),`admin-${route.name}-${state.name}`);
      report.admin.push({route:route.name,state:state.name,status:'pass',metrics,screenshot});
      console.log(`✓ Admin ${route.name} ${state.name} — ${state.width}×${state.height}, overflow ${metrics.scrollWidth-metrics.clientWidth}px`);
    }
    await context.close();
  }
}

const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  await runLibraryMatrix(browser);
  await runAdminMatrix(browser);
  report.status='pass';
  report.summary={libraryStates:report.library.length,adminStates:report.admin.length,totalStates:report.library.length+report.admin.length};
  console.log(`UI visual matrix OK: ${report.summary.totalStates} states (${report.summary.libraryStates} Library + ${report.summary.adminStates} admin).`);
}catch(error){
  report.status='fail';
  report.error=error?.stack||String(error);
  console.error(report.error);
  process.exitCode=1;
}finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
