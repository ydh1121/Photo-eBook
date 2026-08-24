import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error(message);};
const expect=(value,message)=>{if(!value)fail(message);};

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];

const moduleRegistry=read('public/assets/js/platform-modules/module-registry-v1.js');
expect(moduleRegistry.includes("VALID_STATUS=new Set(['approved','candidate','deprecated'])"),'Module registry must enforce promotion states.');
expect(moduleRegistry.includes("VALID_SOURCE=new Set(['public-extracted','block-lab-approved','platform-core'])"),'Module registry must preserve provenance.');
expect(moduleRegistry.includes("definition.status!=='approved'"),'Non-approved modules must be blocked from normal consumers.');
expect(moduleRegistry.includes('hydration?.cleanup'),'Registry mount must support shared interaction-controller cleanup.');
expect(moduleRegistry.includes('hydration.api'),'Registry mount must expose shared module controller APIs.');

const publicSource=read('public/assets/js/platform-modules/photo-public-module-source-v1.js');
for(const marker of ['renderNavigation','renderHorizontalCardRail','renderFilterRail','renderCollectionShell','hydrateCollection','renderDeviceHandoff','renderFab'])expect(publicSource.includes(marker),`Missing extracted public owner: ${marker}`);
expect(publicSource.includes("if(tab==='video')return ['all',...new Set(source.filter(item=>item.type==='video').map(item=>item.category||'기타'))]"),'Public collection filter must retain the dynamic video-category rule.');
expect(publicSource.includes("if(tab==='article')return ['all',...new Set(source.filter(item=>item.type==='article').map(item=>item.platform||'기타'))]"),'Public collection filter must retain the dynamic article-platform rule.');
expect(publicSource.includes('if(delta>86)shut()'),'Bottom sheet must retain the public drag-dismiss threshold.');

const photoModules=read('public/assets/js/platform-modules/photo-core-modules-v1.js');
for(const id of expected)expect(photoModules.includes(`id:'${id}'`),`Missing canonical photo module: ${id}`);
expect((photoModules.match(/status:'approved'/g)||[]).length>=expected.length,'Photo-extracted modules must be explicitly approved.');
expect(photoModules.includes("source:'public-extracted'"),'Photo modules must record public-page provenance.');
expect(photoModules.includes('window.PhotoPublicModuleSource'),'Module definitions must delegate public-owned modules to the extracted public owner.');
expect(photoModules.includes("class=\"collection-tabs platform-filter-chip-rail\""),'Generic filter chip must be extracted from the public liquid segmented rail, not secondary collection-filter chips.');
expect(photoModules.includes('styleDefaults:'),'Canonical modules must record their public baseline style defaults.');
for(const forbidden of ['function renderNav','function renderCard','function renderCollection','DEFAULT_CARDS','DEFAULT_FILTERS'])expect(!photoModules.includes(forbidden),`photo-core-modules must not contain a Library imitation renderer: ${forbidden}`);

const publicHtml=read('public/index.html');
const publicRegistryIndex=publicHtml.indexOf('/assets/js/platform-modules/module-registry-v1.js');
const publicSourceIndex=publicHtml.indexOf('/assets/js/platform-modules/photo-public-module-source-v1.js');
const publicDefsIndex=publicHtml.indexOf('/assets/js/platform-modules/photo-core-modules-v1.js');
expect(publicRegistryIndex>=0&&publicSourceIndex>publicRegistryIndex&&publicDefsIndex>publicSourceIndex,'Public must load Registry → extracted public source → definitions in that order.');
expect(publicHtml.includes('/assets/js/platform-modules/public-module-adapters-v1.js?v=2'),'Public must load the current canonical public adapter.');
expect(publicHtml.includes('/assets/js/app/postload-enhancements.js?v=2'),'Public must load the canonical postload entry.');

const publicAdapters=read('public/assets/js/platform-modules/public-module-adapters-v1.js');
expect(publicAdapters.includes("modules.render('top-chapter-navigation'"),'Public navigation must call the canonical module renderer.');
expect(publicAdapters.includes("modules.render('horizontal-card-rail'"),'Public market rail must call the canonical module renderer.');
const postload=read('public/assets/js/app/postload-enhancements.js');
expect(postload.includes('/assets/js/collection/collection-hub-canonical-v1.js'),'Public postload must load the canonical collection hub.');
expect(!postload.includes("'/assets/js/collection/collection-hub.js?v=1'"),'Public postload must not load the retired duplicated collection UI.');
const publicCollection=read('public/assets/js/collection/collection-hub-canonical-v1.js');
expect(publicCollection.includes("modules.mount(host,'collection-bottom-sheet'"),'Public collection hub must mount the canonical bottom sheet.');
expect(publicCollection.includes('const publicCollectionSource'),'Public collection data/business callbacks must remain outside the shared UI renderer.');

const dashboardHtml=read('public/ui-dashboard/index.html');
expect(dashboardHtml.includes('data-builder-view="library"'),'/ui-dashboard/ must be the UI Library.');
expect(!dashboardHtml.includes('builderOpenBlockPalette'),'Legacy screen composer controls must not remain on the UI Library route.');
expect(!dashboardHtml.includes('/ui-dashboard/sandbox/'),'UI Library must not boot from the old sandbox.');
expect(dashboardHtml.includes('/data/ui-capabilities/v1/manifest.js'),'UI Library must load capability metadata for real module style controls.');
expect(!dashboardHtml.includes('capability-runtime-v3.js')&&!dashboardHtml.includes('global-chip-runtime-v1.js'),'UI Library must not restore sandbox capability emulation.');
expect(dashboardHtml.includes('/assets/js/platform-modules/photo-public-module-source-v1.js'),'UI Library must load the exact public module owner.');

const libraryController=read('public/assets/js/ui-dashboard/builder-library-reference-v1.js');
expect(libraryController.includes("registry.listFor('library')"),'UI Library catalog must come from approved modules.');
expect(libraryController.includes('/ui-dashboard/module-preview/'),'UI Library must render through the shared module preview host.');
expect(libraryController.includes("STYLE_KEY='platformModuleDefaultsV1'"),'Library style changes must be stored as module defaults.');
expect(libraryController.includes('data-style-control'),'Library style controls must be restored.');
expect(!libraryController.includes('kitStatebar'),'State controls must not be rendered above the canvas.');
expect(!libraryController.includes('platformBuilderCapabilityConfigs'),'UI Library must not retain old capability-emulation config.');
expect(!libraryController.includes('/ui-dashboard/reference-preview/'),'UI Library must not use the retired reference fixture.');

const previewHtml=read('public/ui-dashboard/module-preview/index.html');
expect(!previewHtml.includes('/ui-dashboard/sandbox/'),'Shared module preview must have zero sandbox imports.');
expect(previewHtml.includes('/assets/js/platform-modules/preview-storage-fixture-v1.js'),'Preview storage isolation must be a neutral module fixture.');
expect(previewHtml.includes('/data/ui-capabilities/v1/manifest.js'),'Preview must load style-control metadata.');
expect(previewHtml.includes('/assets/js/platform-modules/module-style-runtime-v1.js'),'Preview must apply styles through the shared module style runtime.');
expect(previewHtml.includes('/assets/js/platform-modules/photo-public-module-source-v1.js'),'Preview must execute the same public module owner.');
expect(previewHtml.includes('/assets/js/collection/device-handoff.js'),'Preview must execute the actual public device interaction owner.');

const previewCss=read('public/assets/styles/ui-dashboard/module-preview-v1.css');
for(const forbidden of ['.nav-shell{position:','.collection-sheet{position:','.collection-filters{max-width:','.collection-fab{display:grid!important;position:'])expect(!previewCss.includes(forbidden),`Preview CSS must not override public component geometry: ${forbidden}`);

const modulePreview=read('public/ui-dashboard/module-preview/module-preview-v1.js');
expect(modulePreview.includes("const consumer=params.get('embed')==='editor'?'editor':'library'"),'Shared preview host must serve Library and Editor.');
expect(modulePreview.includes('platform-editor-module-props'),'Shared preview host must accept Editor props.');
expect(modulePreview.includes('platform-module-style'),'Shared preview host must accept standard module style config.');
expect(modulePreview.includes("sourceOwner:'photo-public-module-source-v1'"),'Preview must identify the actual public source owner.');

const editorHtml=read('public/editor-lab/index.html');
expect(!editorHtml.includes('/assets/js/block-lab/'),'Block Editor must not load Block Lab JavaScript.');
expect(!editorHtml.includes('/assets/styles/block-lab/'),'Block Editor must not load Block Lab styles.');
expect(!/class=["'][^"']*\bblock-lab\b/.test(editorHtml),'Block Editor must not use the Block Lab root class.');
const editorRegistryIndex=editorHtml.indexOf('/assets/js/platform-modules/module-registry-v1.js');
const editorSourceIndex=editorHtml.indexOf('/assets/js/platform-modules/photo-public-module-source-v1.js');
const editorDefsIndex=editorHtml.indexOf('/assets/js/platform-modules/photo-core-modules-v1.js');
expect(editorRegistryIndex>=0&&editorSourceIndex>editorRegistryIndex&&editorDefsIndex>editorSourceIndex,'Block Editor must load Registry → extracted public source → definitions in that order.');
expect(editorHtml.includes('/assets/js/blocks/block-renderers-platform-modules-v1.js'),'Block Editor must use the approved module bridge.');
const editorBridge=read('public/assets/js/editor-lab/module-frame-bridge-v1.js');
expect(editorBridge.includes("MODULE_DEFAULTS_KEY='platformModuleDefaultsV1'"),'Block Editor must inherit Library standard module values.');
expect(editorBridge.includes('styleOverrides'),'Block Editor must allow instance overrides over the Library default.');

const editorJsDir=path.join(root,'public/assets/js/editor-lab');
for(const name of fs.readdirSync(editorJsDir)){
  if(!name.endsWith('.js')&&!name.endsWith('.mjs'))continue;
  const source=fs.readFileSync(path.join(editorJsDir,name),'utf8');
  expect(!source.includes('__BLOCK_LAB_DATA'),`Editor runtime ${name} still consumes Block Lab data.`);
  expect(!source.includes('bindBlockLabEnhancements'),`Editor runtime ${name} still invokes Block Lab interaction code.`);
}
const editorApp=read('public/assets/js/editor-lab/editor-app.js');
expect(editorApp.includes("modules.listFor('editor')"),'Block Editor insertion library must be registry-driven.');
expect(editorApp.includes("type:'ui-module'"),'Block Editor must persist module instances, not research block records.');

const labHtml=read('public/block-lab/index.html');
expect(labHtml.includes('RESEARCH ONLY'),'Block Lab must visibly identify itself as research-only.');
expect(labHtml.includes('/assets/js/block-lab/lab-data.js'),'Block Lab must retain its own research runtime.');
expect(!labHtml.includes('/assets/js/editor-lab/'),'Block Lab must not load Editor runtime.');
expect(!labHtml.includes('/ui-dashboard/module-preview/'),'Block Lab must not directly consume approved-module preview runtime.');

const adminShell=read('public/assets/js/admin/admin-shell-v1.js');
expect(!adminShell.includes("id:'builder'"),'Legacy screen composer must not remain a first-class admin role.');
expect(adminShell.includes("label:'UI 라이브러리'"),'Admin shell must expose UI Library.');
expect(adminShell.includes("label:'블록 연구실'"),'Admin shell must expose Block Lab.');
expect(adminShell.includes("label:'블록 에디터'"),'Admin shell must expose Block Editor.');

const redirects=read('public/_redirects');
expect(redirects.includes('/block-editor /editor-lab/index.html 200'),'Canonical /block-editor route is missing.');
const routes=JSON.parse(read('public/_routes.json'));
expect(routes.exclude?.includes('/block-editor'),'Cloudflare Functions must exclude /block-editor.');
expect(routes.exclude?.includes('/block-editor/*'),'Cloudflare Functions must exclude /block-editor/*.');

console.log('True public module extraction boundary check passed.');
