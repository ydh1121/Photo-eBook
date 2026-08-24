import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-module-pipeline');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=16000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function libraryFrame(page,id){
  await waitUntil(()=>page.evaluate(moduleId=>{
    const frame=document.querySelector('#builderFrame');
    const doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModulePreview==='true'&&doc.documentElement.dataset.platformModule===moduleId&&doc.documentElement.dataset.platformModuleConsumer==='library'&&frame.contentWindow?.PlatformModuleRegistry);
  },id),`library module frame not ready: ${id}`,20000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,`missing library frame: ${id}`);return frame;
}

async function verifyLibrary(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length)),'UI library did not initialize',20000);
  const info=await page.evaluate(()=>({
    view:document.querySelector('.builder-shell')?.dataset.builderView,
    ids:window.PlatformModuleRegistry.listFor('library').map(item=>item.id),
    entries:window.PlatformModuleRegistry.listFor('library').map(item=>({id:item.id,status:item.status,source:item.source})),
    buttons:[...document.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi),
    sandbox:Boolean(document.querySelector('#builderOpenBlockPalette')),
    outerOverflow:document.documentElement.scrollWidth-innerWidth
  }));
  assert(info.view==='library','/ui-dashboard/ is not the UI Library');
  assert(!info.sandbox,'legacy screen-composer controls remain on the UI Library route');
  assert(info.ids.length===expected.length&&expected.every(id=>info.ids.includes(id)),'approved library module set mismatch');
  assert(info.buttons.join('|')===info.ids.join('|'),'library selector is not registry-driven');
  assert(info.entries.every(item=>item.status==='approved'),'candidate/deprecated module leaked into Library');
  assert(info.entries.every(item=>['public-extracted','block-lab-approved','platform-core'].includes(item.source)),'module provenance missing');
  assert(info.outerOverflow<=2,`library created outer horizontal overflow: ${info.outerOverflow}px`);

  for(const id of info.ids){
    await page.locator(`[data-kit-ui="${id}"]`).click();
    const frame=await libraryFrame(page,id);
    const src=await page.locator('#builderFrame').getAttribute('src');
    assert(src?.includes('/ui-dashboard/module-preview/'),`${id}: Library did not use canonical module preview`);
    assert(!src?.includes('/sandbox/')&&!src?.includes('/reference-preview/'),`${id}: retired sandbox/reference preview still in use`);
    const provenance=await frame.evaluate(moduleId=>window.PlatformModuleRegistry.provenance(moduleId),id);
    assert(provenance?.status==='approved',`${id}: preview provenance is not approved`);

    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell[data-platform-module="top-chapter-navigation"] .nav-chip').count()>=8,'canonical navigation markup missing');
    }
    if(id==='horizontal-card-rail'){
      assert(await frame.locator('[data-platform-module="horizontal-card-rail"] .market-card').count()>=4,'canonical horizontal card rail missing');
    }
    if(id==='filter-chip-rail'){
      const chips=frame.locator('#collectionFilters[data-platform-module="filter-chip-rail"] .collection-filter');
      assert(await chips.count()>=4,'canonical filter chips missing');
      const labels=await chips.allTextContents();assert(labels.every(label=>label&&!label.includes('[object Object]')),'filter data normalization regressed');
      await chips.nth(1).click();assert(await chips.nth(1).evaluate(node=>node.classList.contains('is-active')),'filter selection did not use module interaction owner');
    }
    if(id==='collection-bottom-sheet'){
      const sheet=frame.locator('#collectionLayer[data-platform-module="collection-bottom-sheet"] #collectionSheet');
      await waitUntil(()=>sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'canonical bottom sheet did not open');
      await frame.locator('.collection-tab[data-library-tab="settings"]').click();
      assert(await frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'bottom sheet state transition failed');
    }
    if(id==='device-handoff-accordion'){
      await waitUntil(()=>frame.locator('.collection-device-accordion #collectionDeviceLink').count().then(n=>n===1),'device handoff did not mount in canonical settings context',12000);
      const link=frame.locator('#collectionDeviceLink');if(await link.getAttribute('aria-expanded')!=='true')await link.click();
      await waitUntil(()=>link.getAttribute('aria-expanded').then(value=>value==='true'),'device handoff did not expand');
    }
    if(id==='floating-action'){
      assert(await frame.locator('[data-platform-module="floating-action"].collection-fab').count()===1,'canonical floating action missing');
    }
  }

  await page.locator('[data-kit-ui="top-chapter-navigation"]').click();await libraryFrame(page,'top-chapter-navigation');
  await page.locator('[data-kit-theme="dark"]').click();
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='dark'),'dark theme did not reach module preview');
  await page.locator('[data-kit-viewport="mobile"]').click();
  const width=await page.locator('#builderFrame').evaluate(node=>node.getBoundingClientRect().width);assert(width<=400,`mobile Library preview width is ${width}`);
  await shot(page,'ui-library-canonical-modules');
  pass('UI Library','root route lists only approved PlatformModuleRegistry modules and uses one shared preview host');
  await page.close();
}

async function verifyBlockLab(context){
  const page=await context.newPage();await page.setViewportSize({width:1280,height:900});
  await page.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded'});
  await page.locator('.platform-admin-shell').waitFor({state:'visible'});
  const state=await page.evaluate(()=>({
    title:document.title,
    brand:document.querySelector('.lab-brand strong')?.textContent||'',
    research:[...document.querySelectorAll('.lab-sidebar__intro small,.lab-intro__tag')].map(node=>node.textContent||''),
    hasLabRuntime:[...document.scripts].some(script=>(script.src||'').includes('/assets/js/block-lab/')),
    hasModulePreview:Boolean(document.querySelector('[data-platform-editor-module-frame],#builderFrame')),
    hasEditorRuntime:[...document.scripts].some(script=>(script.src||'').includes('/assets/js/editor-lab/'))
  }));
  assert(state.title.includes('블록 연구실')&&state.brand.includes('블록 연구실'),'Block Lab is not labeled as the research surface');
  assert(state.research.some(text=>text.includes('RESEARCH ONLY')||text.includes('연구용')),'Block Lab research boundary is not visible');
  assert(state.hasLabRuntime,'Block Lab lost its research runtime');
  assert(!state.hasModulePreview&&!state.hasEditorRuntime,'Block Lab is directly coupled to Library/Editor runtime');
  await shot(page,'block-lab-research-only');
  pass('Block Lab','research runtime remains isolated from approved module consumers');
  await page.close();
}

async function verifyEditor(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));
  await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-add-module]').length)),'Block Editor did not initialize',20000);
  const state=await page.evaluate(()=>({
    title:document.title,
    scripts:[...document.scripts].map(script=>script.getAttribute('src')||''),
    styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.getAttribute('href')||''),
    modules:window.PlatformModuleRegistry.listFor('editor').map(item=>item.id),
    buttons:[...document.querySelectorAll('[data-add-module]')].map(node=>node.dataset.addModule)
  }));
  assert(state.title.includes('블록 에디터'),'Editor role label is wrong');
  assert(!state.scripts.some(src=>src.includes('/assets/js/block-lab/')),'Block Editor loads Block Lab JavaScript');
  assert(!state.styles.some(href=>href.includes('/assets/styles/block-lab/')),'Block Editor loads Block Lab styles');
  assert(state.modules.length===expected.length&&expected.every(id=>state.modules.includes(id)),'Block Editor approved module set mismatch');
  assert(state.buttons.join('|')===state.modules.join('|'),'Block Editor insertion library is not module-registry driven');

  const target='filter-chip-rail';
  await page.locator(`[data-add-module="${target}"]`).click();
  await waitUntil(()=>page.locator(`[data-platform-editor-module-frame="${target}"]`).count().then(n=>n===1),'Editor did not add canonical module iframe');
  const frameHandle=await page.$(`[data-platform-editor-module-frame="${target}"]`);const frame=await frameHandle.contentFrame();assert(frame,'Editor module iframe missing');
  await waitUntil(()=>frame.evaluate(moduleId=>document.documentElement.dataset.platformModule===moduleId&&document.documentElement.dataset.platformModuleConsumer==='editor',target),'Editor iframe is not shared module preview');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'null'));
  assert(draft?.blocks?.length===1&&draft.blocks[0].type==='ui-module'&&draft.blocks[0].variant===target,'Editor draft did not persist module id + props');
  assert(await frame.locator('.collection-filter').count()>=4,'Editor did not render the same canonical filter module');
  await shot(page,'block-editor-approved-module');
  pass('Block Editor','insertion list and saved page blocks use approved module ids, not Block Lab data');
  await page.close();
}

async function verifyPublicBoundary(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&window.PlatformModuleRegistry.listFor('public').length)),'Public module registry missing',12000);
  const publicModules=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('public').map(item=>({id:item.id,status:item.status,source:item.source})));
  assert(expected.every(id=>publicModules.some(item=>item.id===id)),'Public consumer cannot resolve the approved module set');
  assert(publicModules.every(item=>item.status==='approved'),'non-approved module can be consumed publicly');
  await waitUntil(()=>page.locator('.nav-shell[data-platform-module="top-chapter-navigation"]').count().then(n=>n===1),'public navigation has not migrated to canonical module',20000);
  assert(await page.locator('.nav-chip').count()>=8,'public canonical nav is incomplete');
  await shot(page,'public-canonical-nav');
  pass('Public boundary','public consumer resolves approved modules; top navigation already runs through canonical registry');
  await page.close();
}

async function verifyAdminShell(context){
  const page=await context.newPage();
  for(const spec of [
    {path:'/ui-dashboard/',href:'/ui-dashboard/',label:'UI 라이브러리'},
    {path:'/block-lab/',href:'/block-lab/',label:'블록 연구실'},
    {path:'/editor-lab/',href:'/block-editor/',label:'블록 에디터'}
  ]){
    await page.goto(`${BASE}${spec.path}`,{waitUntil:'domcontentloaded'});await page.locator('.platform-admin-shell').waitFor({state:'visible'});
    assert(await page.locator('.platform-admin-shell__nav a').count()===4,`${spec.label}: admin navigation should expose four roles`);
    const current=page.locator('.platform-admin-shell__nav a[aria-current="page"]');assert(await current.count()===1,`${spec.label}: current role missing`);
    assert((await current.getAttribute('href'))===spec.href,`${spec.label}: canonical href mismatch`);
    assert((await current.textContent()||'').includes(spec.label),`${spec.label}: role label mismatch`);
  }
  pass('Admin role navigation','Library / Block Lab / Block Editor / QA are separated; legacy screen composer is not a role');
  await page.close();
}

try{
  const context=await browser.newContext();
  await verifyLibrary(context);
  await verifyBlockLab(context);
  await verifyEditor(context);
  await verifyPublicBoundary(context);
  await verifyAdminShell(context);
  await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
