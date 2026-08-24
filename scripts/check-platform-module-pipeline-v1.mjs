import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-module-pipeline');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=20000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
const seed={
  videos:{
    'fixture-video-product':{id:'fixture-video-product',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'영상',savedAt:'2026-08-24T08:00:00.000Z'},
    'fixture-video-portrait':{id:'fixture-video-portrait',title:'인물 촬영 현장 체크리스트',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',category:'인물 촬영',channel:'영상',savedAt:'2026-08-24T08:00:00.000Z'},
    'fixture-video-food':{id:'fixture-video-food',title:'음식 촬영 납품 준비',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',category:'음식 촬영',channel:'영상',savedAt:'2026-08-24T08:00:00.000Z'}
  },
  articles:{'fixture-article':{id:'fixture-article',title:'상업사진 견적 체크리스트',og_title:'상업사진 견적 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',platform:'읽을거리',summary:'견적과 납품 범위를 확인하는 예시 항목입니다.',savedAt:'2026-08-24T08:00:00.000Z'}},
  questions:[{id:'fixture-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:'2026-08-24T08:00:00.000Z'}]
};
const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function libraryFrame(page,id){
  await waitUntil(()=>page.evaluate(moduleId=>{
    const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModulePreview==='true'&&doc.documentElement.dataset.platformModule===moduleId&&doc.documentElement.dataset.platformModuleConsumer==='library'&&frame.contentWindow?.PhotoPublicModuleSource);
  },id),`library module frame not ready: ${id}`,25000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,`missing library frame: ${id}`);return frame;
}
async function chooseLibrary(page,id){await page.locator(`[data-kit-ui="${id}"]`).click();return libraryFrame(page,id);}
async function styles(scope,selector,names){
  return scope.locator(selector).first().evaluate((node,props)=>{const s=getComputedStyle(node);return Object.fromEntries(props.map(name=>[name,s[name]]));},names);
}
async function box(scope,selector){return scope.locator(selector).first().evaluate(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});}
function equalStyle(a,b,names,label){for(const name of names)assert(a[name]===b[name],`${label}: ${name} differs (${a[name]} vs ${b[name]})`);}

async function openPublic(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.addInitScript(data=>{
    localStorage.setItem('photoRoadmapVideoFavoritesV1',JSON.stringify(Object.keys(data.videos)));
    localStorage.setItem('photoRoadmapVideoFavoriteItemsV2',JSON.stringify(data.videos));
    localStorage.setItem('photoRoadmapCuratedFavoritesV1',JSON.stringify(Object.keys(data.articles)));
    localStorage.setItem('photoRoadmapCuratedFavoriteItemsV2',JSON.stringify(data.articles));
    localStorage.setItem('photoRoadmapQuestionsV2',JSON.stringify(data.questions));
    localStorage.setItem('photoRoadmapDeviceKeyV1','dev_0123456789abcdef0123456789abcdef0123456789abcdef');
    localStorage.setItem('photoRoadmapThemeV1','light');
  },seed);
  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PhotoPublicModuleSource&&window.PlatformModuleRegistry?.listFor('public').length===6&&!document.querySelector('#app')?.hidden)),'Public canonical source did not initialize',30000);
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PhotoCollectionHub&&document.querySelector('#collectionLayer[data-platform-module="collection-bottom-sheet"]'))),'Public collection did not mount canonical module',30000);
  return page;
}

async function verifyTrueParity(context){
  const publicPage=await openPublic(context);
  const library=await context.newPage();await library.setViewportSize({width:1440,height:1000});
  await library.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>library.evaluate(()=>Boolean(window.PhotoPublicModuleSource&&window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length===6)),'UI Library did not initialize true public source',25000);

  const libInfo=await library.evaluate(()=>({
    ids:window.PlatformModuleRegistry.listFor('library').map(item=>item.id),
    versions:window.PlatformModuleRegistry.listFor('library').map(item=>item.version),
    scripts:[...document.scripts].map(script=>script.src),
    buttons:[...document.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi),
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  assert(libInfo.ids.length===6&&expected.every(id=>libInfo.ids.includes(id)),'Library approved module set mismatch');
  assert(libInfo.versions.every(version=>version>=3),'Library still exposes pre-extraction module definitions');
  assert(libInfo.buttons.join('|')===libInfo.ids.join('|'),'Library selector is not registry-driven');
  assert(!libInfo.scripts.some(src=>src.includes('/ui-dashboard/sandbox/')),'Library parent still imports sandbox runtime');
  assert(libInfo.overflow<=2,`Library outer horizontal overflow: ${libInfo.overflow}px`);

  const publicSource=await publicPage.evaluate(()=>({version:window.PhotoPublicModuleSource?.version,modules:window.PlatformModuleRegistry.listFor('public').map(item=>({id:item.id,version:item.version,source:item.source}))}));
  assert(publicSource.version===1,'Public did not load extracted module owner');
  assert(publicSource.modules.length===6&&publicSource.modules.every(item=>item.version>=3&&item.source==='public-extracted'),'Public module registry is not on extracted definitions');

  // 1. Top navigation: same renderer classes, typography and native horizontal rail behavior.
  let frame=await chooseLibrary(library,'top-chapter-navigation');
  assert(await publicPage.locator('.nav-shell[data-platform-module="top-chapter-navigation"]').count()===1,'Public navigation is not canonical');
  assert(await frame.locator('.nav-shell[data-platform-module="top-chapter-navigation"]').count()===1,'Library navigation is not canonical');
  const publicNavLabels=await publicPage.locator('.nav-shell .nav-chip').allTextContents();
  const libraryNavLabels=await frame.locator('.nav-shell .nav-chip').allTextContents();
  assert(publicNavLabels.join('|')===libraryNavLabels.join('|'),'Navigation labels differ between Public and Library');
  const navProps=['display','overflowX','borderRadius','gap'];
  equalStyle(await styles(publicPage,'.nav-scroll',navProps),await styles(frame,'.nav-scroll',navProps),navProps,'navigation rail');
  const chipProps=['fontSize','fontWeight','borderRadius','paddingLeft','paddingRight','minHeight'];
  equalStyle(await styles(publicPage,'.nav-chip',chipProps),await styles(frame,'.nav-chip',chipProps),chipProps,'navigation chip');
  await library.locator('[data-kit-viewport="mobile"]').click();
  await waitUntil(()=>library.locator('#builderFrame').evaluate(node=>node.getBoundingClientRect().width<=400),'Library mobile viewport did not apply');
  frame=await libraryFrame(library,'top-chapter-navigation');
  const navScroll=await frame.locator('.nav-scroll').evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth}));
  assert(navScroll.scrollWidth>navScroll.clientWidth,'Top chapter navigation has no horizontal overflow on mobile');
  await frame.locator('.nav-scroll').evaluate(node=>{node.scrollLeft=100;});
  assert(await frame.locator('.nav-scroll').evaluate(node=>node.scrollLeft)>0,'Top chapter navigation cannot scroll horizontally');
  await library.locator('[data-kit-viewport="desktop"]').click();
  pass('Top navigation parity','same public renderer/styles; mobile horizontal scroll confirmed');

  // 2. Market horizontal card rail: actual public 3-card data, same card skin and desktop drag owner.
  frame=await chooseLibrary(library,'horizontal-card-rail');
  const publicCards=publicPage.locator('#market [data-platform-module="horizontal-card-rail"] .market-card');
  const libraryCards=frame.locator('[data-platform-module="horizontal-card-rail"] .market-card');
  assert(await publicCards.count()===3,'Public market rail is not routed through canonical 3-card source');
  assert(await libraryCards.count()===3,'Library invented a different market-card set');
  assert((await publicCards.first().innerText()).trim()===(await libraryCards.first().innerText()).trim(),'Market card content differs between Public and Library');
  const cardProps=['borderRadius','backgroundColor','boxShadow','width','minWidth'];
  equalStyle(await styles(publicPage,'#market .market-card',cardProps),await styles(frame,'.market-card',cardProps),cardProps,'market card');
  assert(await frame.locator('.desktop-rail-window [data-platform-module="horizontal-card-rail"]').count()===1,'Library card rail did not use actual public desktop rail owner');
  pass('Horizontal card parity','3 actual public market cards + same public rail runtime');

  // 3. Filter chips: public saved-video categories drive both module appearance and behavior.
  await publicPage.evaluate(()=>window.PhotoCollectionHub.open('video'));
  await waitUntil(()=>publicPage.locator('#collectionSheet.is-open .collection-filter').count().then(n=>n===4),'Public video filters did not render dynamically');
  frame=await chooseLibrary(library,'filter-chip-rail');
  const pubFilter=publicPage.locator('#collectionSheet .collection-filter');
  const libFilter=frame.locator('.collection-filter');
  const pubLabels=await pubFilter.allTextContents(),libLabels=await libFilter.allTextContents();
  assert(pubLabels.join('|')===libLabels.join('|'),`Filter labels differ (${pubLabels.join('|')} vs ${libLabels.join('|')})`);
  assert(pubLabels.every(label=>label&&!label.includes('[object Object]')),'Public filter labels contain invalid object serialization');
  const filterProps=['fontSize','fontWeight','borderRadius','paddingLeft','paddingRight','backgroundColor','color'];
  equalStyle(await styles(publicPage,'#collectionSheet .collection-filter',filterProps),await styles(frame,'.collection-filter',filterProps),filterProps,'filter chip');
  await libFilter.nth(1).click();
  assert(await libFilter.nth(1).evaluate(node=>node.classList.contains('is-active')),'Library filter selection is not owned by canonical module');
  await library.locator('[data-kit-viewport="mobile"]').click();frame=await libraryFrame(library,'filter-chip-rail');
  const filterRail=frame.locator('.collection-filters');
  await frame.evaluate(()=>window.parent.postMessage({type:'noop'},location.origin));
  const filterOverflow=await filterRail.evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth}));
  if(filterOverflow.scrollWidth>filterOverflow.clientWidth){await filterRail.evaluate(node=>node.scrollLeft=80);assert(await filterRail.evaluate(node=>node.scrollLeft)>0,'Filter rail overflow cannot be scrolled');}
  await library.locator('[data-kit-viewport="desktop"]').click();
  pass('Filter chip parity','dynamic public categories + same chip CSS/interaction');

  // 4. Bottom sheet: exact public shell, max geometry, tabs/search/drag all from same controller.
  frame=await chooseLibrary(library,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('#collectionSheet.is-open').count().then(n=>n===1),'Library bottom sheet did not open');
  const sheetProps=['position','width','height','borderRadius','display','gridTemplateRows','overflow'];
  equalStyle(await styles(publicPage,'#collectionSheet',sheetProps),await styles(frame,'#collectionSheet',sheetProps),sheetProps,'bottom sheet');
  const publicSheetBox=await box(publicPage,'#collectionSheet'),librarySheetBox=await box(frame,'#collectionSheet');
  assert(Math.abs(publicSheetBox.width-librarySheetBox.width)<=1,`Bottom sheet width differs: ${publicSheetBox.width} vs ${librarySheetBox.width}`);
  await frame.locator('.collection-tab[data-library-tab="video"]').click();
  await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="video"].is-active').count().then(n=>n===1),'Library bottom sheet video tab failed');
  assert(await frame.locator('.collection-filter').count()===4,'Library bottom sheet did not derive filters from actual video items');
  await frame.locator('#collectionSearch').fill('제품');
  assert(await frame.locator('.collection-item').count()===1,'Library bottom sheet search is not using canonical controller');
  await frame.locator('#collectionSearch').fill('');
  const handle=frame.locator('.collection-handle-wrap');
  const handleBox=await handle.boundingBox();assert(handleBox,'Bottom sheet drag handle missing');
  await library.mouse.move(handleBox.x+handleBox.width/2,handleBox.y+handleBox.height/2);
  await library.mouse.down();await library.mouse.move(handleBox.x+handleBox.width/2,handleBox.y+handleBox.height/2+120,{steps:5});await library.mouse.up();
  await waitUntil(()=>frame.locator('#collectionSheet').evaluate(node=>node.hidden),'Library bottom sheet did not close after public 86px drag threshold');
  await frame.locator('#collectionFab').click();await waitUntil(()=>frame.locator('#collectionSheet.is-open').count().then(n=>n===1),'Bottom sheet did not reopen from canonical FAB');
  pass('Bottom sheet parity','same geometry + tabs + filters + search + drag-dismiss controller');

  // 5. Device handoff: same real public interaction script and panel markup.
  await publicPage.evaluate(()=>window.PhotoCollectionHub.open('settings'));
  await waitUntil(()=>publicPage.locator('#collectionDeviceLink').count().then(n=>n===1),'Public device row missing');
  const publicDevice=publicPage.locator('#collectionDeviceLink');if(await publicDevice.getAttribute('aria-expanded')!=='true')await publicDevice.click();
  await waitUntil(()=>publicPage.locator('.collection-device-accordion #collectionDeviceLink[aria-expanded="true"]').count().then(n=>n===1),'Public device accordion failed');
  frame=await chooseLibrary(library,'device-handoff-accordion');
  await waitUntil(()=>frame.locator('#collectionDeviceLink').count().then(n=>n===1),'Library device row missing');
  const libDevice=frame.locator('#collectionDeviceLink');if(await libDevice.getAttribute('aria-expanded')!=='true')await libDevice.click();
  await waitUntil(()=>frame.locator('.collection-device-accordion #collectionDeviceLink[aria-expanded="true"]').count().then(n=>n===1),'Library device accordion failed');
  assert(await frame.locator('.collection-device-panel-v2[aria-hidden="false"]').count()===1,'Library device panel did not use actual public runtime');
  const deviceProps=['borderRadius','backgroundColor','paddingTop','paddingBottom'];
  equalStyle(await styles(publicPage,'#collectionDeviceLink',deviceProps),await styles(frame,'#collectionDeviceLink',deviceProps),deviceProps,'device handoff row');
  pass('Device handoff parity','same device-handoff.js interaction and accordion panel');

  // 6. Floating action: exact public button renderer and CSS.
  frame=await chooseLibrary(library,'floating-action');
  const fabProps=['width','height','borderRadius','position','right','bottom','color'];
  equalStyle(await styles(publicPage,'#collectionFab',fabProps),await styles(frame,'.collection-fab',fabProps),fabProps,'collection FAB');
  const pubFabBox=await box(publicPage,'#collectionFab'),libFabBox=await box(frame,'.collection-fab');
  assert(Math.abs(pubFabBox.width-libFabBox.width)<=1&&Math.abs(pubFabBox.height-libFabBox.height)<=1,'FAB dimensions differ between Public and Library');
  pass('Floating action parity','same public renderer and exact dimensions');

  const previewScripts=await frame.evaluate(()=>[...document.scripts].map(script=>script.src));
  assert(!previewScripts.some(src=>src.includes('/ui-dashboard/sandbox/')),'Shared module preview still imports sandbox runtime');

  await library.locator('[data-kit-ui="top-chapter-navigation"]').click();await libraryFrame(library,'top-chapter-navigation');
  await library.locator('[data-kit-theme="dark"]').click();
  await waitUntil(()=>library.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='dark'),'Dark theme did not reach canonical preview');
  await shot(library,'ui-library-public-parity');
  await shot(publicPage,'public-canonical-modules');
  pass('True Public → Library extraction','all six Library modules execute the extracted public owner instead of imitation renderers');

  await publicPage.close();await library.close();
}

async function verifyBlockLab(context){
  const page=await context.newPage();await page.setViewportSize({width:1280,height:900});
  await page.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded'});await page.locator('.platform-admin-shell').waitFor({state:'visible'});
  const state=await page.evaluate(()=>({title:document.title,brand:document.querySelector('.lab-brand strong')?.textContent||'',research:[...document.querySelectorAll('.lab-sidebar__intro small,.lab-intro__tag')].map(node=>node.textContent||''),hasLabRuntime:[...document.scripts].some(script=>(script.src||'').includes('/assets/js/block-lab/')),hasEditorRuntime:[...document.scripts].some(script=>(script.src||'').includes('/assets/js/editor-lab/'))}));
  assert(state.title.includes('블록 연구실')&&state.brand.includes('블록 연구실'),'Block Lab role label is wrong');
  assert(state.research.some(text=>text.includes('RESEARCH ONLY')||text.includes('연구용')),'Block Lab research boundary is not visible');
  assert(state.hasLabRuntime&&!state.hasEditorRuntime,'Block Lab isolation failed');
  await shot(page,'block-lab-research-only');pass('Block Lab','research runtime remains isolated');await page.close();
}

async function verifyEditor(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PhotoPublicModuleSource&&window.PlatformModuleRegistry?.listFor('editor').length===6&&document.querySelectorAll('[data-add-module]').length===6)),'Block Editor did not initialize extracted public modules',25000);
  const state=await page.evaluate(()=>({scripts:[...document.scripts].map(script=>script.src),modules:window.PlatformModuleRegistry.listFor('editor').map(item=>({id:item.id,version:item.version})),buttons:[...document.querySelectorAll('[data-add-module]')].map(node=>node.dataset.addModule)}));
  assert(!state.scripts.some(src=>src.includes('/assets/js/block-lab/')),'Block Editor loads Block Lab JavaScript');
  assert(state.modules.every(item=>item.version>=3),'Block Editor still consumes imitation module definitions');
  assert(state.buttons.join('|')===state.modules.map(item=>item.id).join('|'),'Editor insertion catalog differs from Registry');
  const target='collection-bottom-sheet';await page.locator(`[data-add-module="${target}"]`).click();
  await waitUntil(()=>page.locator(`[data-platform-editor-module-frame="${target}"]`).count().then(n=>n===1),'Editor did not add canonical bottom-sheet iframe');
  const frameHandle=await page.$(`[data-platform-editor-module-frame="${target}"]`),frame=await frameHandle.contentFrame();assert(frame,'Editor module frame missing');
  await waitUntil(()=>frame.evaluate(()=>Boolean(window.PhotoPublicModuleSource&&document.documentElement.dataset.platformModuleConsumer==='editor')),'Editor iframe did not load public module owner');
  assert(await frame.locator('#collectionSheet.is-open').count()===1,'Editor did not render actual canonical bottom sheet');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'null'));
  assert(draft?.blocks?.length===1&&draft.blocks[0].type==='ui-module'&&draft.blocks[0].variant===target,'Editor did not persist module id + props');
  await shot(page,'block-editor-public-module');pass('Block Editor','approved public-extracted module id + props + shared preview');await page.close();
}

async function verifyAdminShell(context){
  const page=await context.newPage();
  for(const spec of [{path:'/ui-dashboard/',href:'/ui-dashboard/',label:'UI 라이브러리'},{path:'/block-lab/',href:'/block-lab/',label:'블록 연구실'},{path:'/editor-lab/',href:'/block-editor/',label:'블록 에디터'}]){
    await page.goto(`${BASE}${spec.path}`,{waitUntil:'domcontentloaded'});await page.locator('.platform-admin-shell').waitFor({state:'visible'});
    assert(await page.locator('.platform-admin-shell__nav a').count()===4,`${spec.label}: admin nav must expose four roles`);
    const current=page.locator('.platform-admin-shell__nav a[aria-current="page"]');assert(await current.count()===1,`${spec.label}: current role missing`);
    assert((await current.getAttribute('href'))===spec.href,`${spec.label}: canonical href mismatch`);
  }
  pass('Admin roles','Library / Block Lab / Block Editor / QA stay separated');await page.close();
}

try{
  const context=await browser.newContext();
  await verifyTrueParity(context);
  await verifyBlockLab(context);
  await verifyEditor(context);
  await verifyAdminShell(context);
  await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
