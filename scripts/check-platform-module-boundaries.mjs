import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error(message);};
const expect=(value,message)=>{if(!value)fail(message);};
const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];

const agents=read('AGENTS.md');
expect(agents.includes('Reusable UI module contract'),'AGENTS.md must contain the permanent reusable UI module contract.');
expect(agents.includes('Library → Editor → Public'),'AGENTS.md must require Library → Editor → Public verification.');
expect(agents.includes('preview-only'),'AGENTS.md must explicitly prohibit preview-only module implementations.');

const registry=read('public/assets/js/platform-modules/module-registry-v1.js');
expect(registry.includes("VALID_STATUS=new Set(['approved','candidate','deprecated'])"),'Registry promotion states changed unexpectedly.');
expect(registry.includes("VALID_SOURCE=new Set(['public-extracted','block-lab-approved','platform-core'])"),'Registry provenance states changed unexpectedly.');
expect(registry.includes("VALID_DEPENDENCY_KIND=new Set(['composition','behavior','data'])"),'Registry dependency kinds changed unexpectedly.');
expect(registry.includes("definition.status!=='approved'"),'Normal consumers must reject non-approved modules.');
expect(registry.includes("CONTENT_DEFAULTS_KEY='platformModuleContentDefaultsV1'"),'Library content defaults must snapshot into new Editor instances.');
expect(registry.includes("STYLE_DEFAULTS_KEY='platformModuleDefaultsV1'"),'Library style defaults must snapshot into new Editor instances.');
expect(registry.includes('hydration.api'),'Registry mount must expose real interaction APIs.');
for(const marker of ['normalizeDependencies','resolveDependency','renderDependency','hydrateDependency','dependencyClosure','validateDependencyGraph','Circular platform module dependency','dependencies:clone(def.dependencies||[])'])expect(registry.includes(marker),`Registry dependency graph API missing: ${marker}`);

const modules=read('public/assets/js/platform-modules/photo-core-modules-v1.js');
for(const id of expected)expect(modules.includes(`id:'${id}'`),`Missing approved platform module: ${id}`);
expect((modules.match(/status:'approved'/g)||[]).length>=expected.length,'All first-set modules must be approved explicitly.');
expect(modules.includes("id:'filter-chip-rail'")&&modules.includes("source:'platform-core'"),'Generic filter must be identified as platform-core, not falsely public-extracted.');
for(const marker of ['platform-filter-chip-source--liquid','platform-filter-chip-source--ios-flat','platform-filter-chip-source--material-flat'])expect(modules.includes(marker),`Missing canonical filter family: ${marker}`);
expect(modules.includes("new CustomEvent('platform-filter-select'"),'Filter module must expose a real reusable selection event.');
expect(modules.includes("fontFamily:'system-sans'")&&modules.includes('fontSize:15')&&modules.includes('fontSize:14'),'Navigation/filter typography defaults must be persisted in module definitions.');
expect(!modules.includes("source:'platform-canonical'"),'Unsupported provenance aliases must not be used.');
for(const forbidden of ['function renderNav','function renderCard','function renderCollection','DEFAULT_CARDS','DEFAULT_FILTERS'])expect(!modules.includes(forbidden),`Library imitation renderer leaked into module definitions: ${forbidden}`);
for(const owner of [
  'public/assets/js/navigation/chapter-navigation.js',
  'public/assets/js/ui/liquid-controller.js',
  'public/assets/styles/navigation/mobile-nav-curated.css',
  'public/assets/styles/navigation/native-pan-fab-clearance.css',
  'public/assets/styles/desktop/nav-rails.css',
  'public/assets/styles/desktop/nav-corrections.css'
])expect(modules.includes(owner),`Top navigation provenance is missing photography runtime owner: ${owner}`);

const primitiveExtension=read('public/assets/js/platform-modules/portable-primitives-extension-v2.js');
expect(!primitiveExtension.includes('function renderScreenMode')&&!primitiveExtension.includes('function hydrateScreenMode'),'Screen mode must not keep a duplicate implementation in the primitive extension.');
expect(primitiveExtension.includes("styleComposition='public/assets/js/platform-modules/module-style-runtime-composition-v1.js'"),'Collection composition style owner is missing from provenance.');

const composition=read('public/assets/js/platform-modules/portable-primitives-composition-v3.js');
for(const marker of [
  "const SCREEN_ID='screen-mode-selector'",
  "const FILTER_ID='filter-chip-rail'",
  "dependencies:[{id:FILTER_ID,kind:'composition',required:true}]",
  'registry.renderDependency(SCREEN_ID,FILTER_ID',
  'registry.hydrateDependency(SCREEN_ID',
  'PhotoLiquidController?.attachFilterRail',
  "id:SCREEN_ID",
  "consumers:['public','library','editor']"
])expect(composition.includes(marker),`Screen mode dependency composition missing: ${marker}`);

const source=read('public/assets/js/platform-modules/photo-public-module-source-v1.js');
for(const marker of ['renderNavigation','renderHorizontalCardRail','renderCollectionShell','hydrateCollection','renderDeviceHandoff','renderFab'])expect(source.includes(marker),`Missing public-derived module owner: ${marker}`);
expect(source.includes('if(delta>86)shut()'),'Bottom sheet must retain drag-dismiss behavior.');
expect(source.includes("if(tab==='video')return ['all',...new Set"),'Video filter derivation must remain data-driven.');
expect(source.includes("if(tab==='article')return ['all',...new Set"),'Article filter derivation must remain data-driven.');

const liquidController=read('public/assets/js/ui/liquid-controller.js');
expect(liquidController.includes("const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)'"),'Photography Breeze easing must remain the canonical motion baseline.');
expect(liquidController.includes('watchNavigationMounts'),'Canonical liquid owner must survive Library/Editor DOM remounts.');
expect(liquidController.includes("node.matches?.('.nav-scroll')||node.querySelector?.('.nav-scroll')"),'Canonical liquid owner must detect newly mounted top navigation without a preview-only hook.');
expect(liquidController.includes('attachFilterRail'),'Canonical liquid owner must expose filter-chip motion to composed modules.');
expect(!liquidController.includes('themeCardMarkup')&&!liquidController.includes('injectThemeControls'),'Liquid runtime must not inject a separate screen-mode implementation.');

const nativePan=read('public/assets/styles/navigation/native-pan-fab-clearance.css');
expect(nativePan.includes('-webkit-overflow-scrolling:touch!important'),'Photography top nav must retain native touch momentum.');
expect(nativePan.includes('touch-action:pan-x pan-y!important'),'Photography top nav must retain native pan ownership.');

const filterCss=read('public/assets/styles/platform-modules/filter-chip-rail-v1.css');
for(const marker of ['platform-filter-chip-source--liquid','platform-filter-chip-source--ios-flat','platform-filter-chip-source--material-flat','--platform-filter-font-family'])expect(filterCss.includes(marker),`Filter CSS missing runtime family/typography contract: ${marker}`);
expect(filterCss.includes('Shared by Library, Block Editor and published pages'),'Filter stylesheet must document shared runtime ownership.');

const screenCss=read('public/assets/styles/platform-modules/screen-mode-segmented-v1.css');
expect(screenCss.includes('filter-chip-rail + liquid-controller'),'Screen mode stylesheet must document child runtime ownership.');
for(const forbidden of ['.platform-screen-mode__options button','[aria-pressed="true"]','data-screen-mode-value'])expect(!screenCss.includes(forbidden),`Screen mode stylesheet recreates filter-chip paint/state: ${forbidden}`);

const screenBridge=read('public/assets/js/collection/screen-mode-settings-bridge-v1.js');
expect(screenBridge.includes("resolveDependency?.('screen-mode-selector','filter-chip-rail','public')")||screenBridge.includes("resolveDependency('screen-mode-selector','filter-chip-rail','public')"),'Photography screen-mode bridge must resolve the declared filter-chip dependency.');
expect(screenBridge.includes("dependencyClosure?.('screen-mode-selector','public')"),'Photography screen-mode bridge must validate the transitive dependency closure.');
expect(screenBridge.includes('/assets/styles/platform-modules/filter-chip-rail-v1.css'),'Photography screen-mode bridge must load the child filter stylesheet.');
expect(screenBridge.includes('portable-primitives-extension-v2.js?v=5'),'Photography bridge must load the current dependency-aware extension.');

const styleRuntime=read('public/assets/js/platform-modules/module-style-runtime-v1.js');
for(const marker of ['FONT_STACKS','fontFamily','fontSize','fontWeight','letterSpacing','progressEnabled','progressMode','progressColor','leftFade','themeSelector','moduleScrollbar'])expect(styleRuntime.includes(marker),`Visible setting has no canonical runtime implementation marker: ${marker}`);
expect(styleRuntime.includes("allowed=['ios-liquid','ios-flat','material-flat']"),'Filter style runtime must support exactly the three canonical families.');
expect(styleRuntime.includes('data-module-scrollbar'),'Card scrollbar control must affect the real horizontal rail.');
expect(styleRuntime.includes("node.style.setProperty('font-size'"),'Typography controls must override the photography baseline CSS on canonical nodes.');
expect(styleRuntime.includes('const customMotion='),'Library default top-nav settings must preserve the photography Breeze motion until the user changes motion controls.');
const compositionStyleRuntime=read('public/assets/js/platform-modules/module-style-runtime-composition-v1.js');
for(const marker of ['themeSelector','[data-collection-screen-mode-slot]','baseApply','baseReset'])expect(compositionStyleRuntime.includes(marker),`Composition style runtime does not target the canonical screen-mode slot: ${marker}`);

const extension=read('public/data/ui-capabilities/v1/module-extension-v1.js');
expect(extension.includes("family.options=['ios-liquid','ios-flat','material-flat']"),'Library must expose all three canonical filter families.');
for(const id of ['fontFamily','fontSize','fontWeight','letterSpacing'])expect(extension.includes(`id:'${id}'`),`Typography control missing from Library metadata: ${id}`);

const dashboard=read('public/ui-dashboard/index.html');
expect(dashboard.includes('data-builder-view="library"'),'/ui-dashboard/ must remain Library-only.');
expect(!dashboard.includes('/ui-dashboard/sandbox/'),'Library must not boot old sandbox runtime.');
expect(dashboard.includes('/assets/js/platform-modules/photo-core-modules-v1.js'),'Library must load the shared Registry definitions.');
expect(dashboard.includes('/assets/js/platform-modules/module-registry-v1.js?v=5'),'Library must load the transitive dependency-aware Registry cache version.');
expect(dashboard.includes('/assets/js/platform-modules/portable-primitives-extension-v2.js?v=5'),'Library must load the current dependency-aware extension.');

const preview=read('public/ui-dashboard/module-preview/index.html');
expect(!preview.includes('/ui-dashboard/sandbox/'),'Shared preview must have zero sandbox dependencies.');
expect(preview.includes('/assets/styles/platform-modules/filter-chip-rail-v1.css?v=6'),'Preview must use the current shared filter stylesheet.');
expect(preview.includes('/assets/js/platform-modules/module-style-runtime-v1.js'),'Preview must use the canonical style runtime.');
expect(preview.includes('/assets/js/platform-modules/module-style-runtime-composition-v1.js?v=1'),'Preview must load the composition-aware style adapter.');
expect(preview.includes('/assets/js/ui/liquid-controller.js?v=3'),'Library/Editor preview must load the same dependency-capable liquid owner as Photography Public.');
expect(preview.includes('/assets/js/platform-modules/portable-primitives-composition-v3.js?v=6'),'Preview must load dependency-aware module composition.');
expect(preview.includes('/assets/js/platform-modules/module-registry-v1.js?v=5'),'Preview must load the transitive dependency-aware Registry.');
expect(preview.includes('/assets/js/platform-modules/portable-primitives-extension-v2.js?v=5'),'Preview must load the current dependency-aware extension.');

const publicIndex=read('public/index.html');
expect(publicIndex.includes('/assets/js/ui/liquid-controller.js?v=3'),'Photography Public must load the current canonical liquid owner.');
expect(publicIndex.includes('/assets/js/platform-modules/module-registry-v1.js?v=5'),'Photography Public must load the transitive dependency-aware Registry.');
expect(publicIndex.includes('/assets/js/app/postload-enhancements.js?v=6'),'Photography Public must load the current screen-mode bridge loader and shared bookmark storage.');

const previewJs=read('public/ui-dashboard/module-preview/module-preview-v1.js');
expect(previewJs.includes("const consumer=params.get('embed')==='editor'?'editor':'library'"),'Library and Editor must share one preview host.');
expect(previewJs.includes('platform-editor-module-props'),'Editor must pass persisted module props into the same runtime.');
expect(previewJs.includes('platform-module-style'),'Library/Editor must pass style config into the same runtime.');

const publicSnapshot=read('public/assets/js/public-snapshot/runtime-v2.js');
expect(publicSnapshot.includes("block?.type==='ui-module'"),'Published snapshot must recognize UI modules.');
expect(publicSnapshot.includes('modules.mount(host,moduleId'),'Published pages must mount UI modules through PlatformModuleRegistry.');
expect(publicSnapshot.includes('PlatformModuleStyleRuntime?.apply'),'Published pages must apply the persisted module style runtime.');
expect(!publicSnapshot.includes('/ui-dashboard/module-preview/'),'Published pages must never render UI modules through the admin preview iframe.');

const publicAdapters=read('public/assets/js/platform-modules/public-module-adapters-v1.js');
expect(publicAdapters.includes("modules.render('top-chapter-navigation'"),'Public navigation must call the canonical module renderer.');
expect(publicAdapters.includes("modules.render('horizontal-card-rail'"),'Public card rail must call the canonical module renderer.');
const publicCollection=read('public/assets/js/collection/collection-hub-canonical-v1.js');
expect(publicCollection.includes("modules.mount(host,'collection-bottom-sheet'"),'Public collection UI must mount the canonical bottom sheet.');

const editorHtml=read('public/editor-lab/index.html');
expect(!editorHtml.includes('/assets/js/block-lab/'),'Block Editor must not import Block Lab JavaScript.');
expect(!editorHtml.includes('/assets/styles/block-lab/'),'Block Editor must not import Block Lab styles.');
expect(editorHtml.includes('/assets/js/platform-modules/module-registry-v1.js?v=5'),'Block Editor must load the transitive dependency-aware Registry.');
expect(editorHtml.includes('/data/block-registry/v1/editor-module-extension-v1.js?v=2'),'Block Editor must load the dependency-validating module extension.');
const editorExtension=read('public/data/block-registry/v1/editor-module-extension-v1.js');
expect(editorExtension.includes("modules.validateDependencyGraph?.('editor')"),'Block Editor must validate its dependency graph before exposing variants.');
expect(editorExtension.includes('portable-primitives-extension-v2.js?v=5'),'Block Editor must load the current dependency-aware extension.');
const editorBridge=read('public/assets/js/editor-lab/module-frame-bridge-v1.js');
expect(editorBridge.includes('block?.styleOverrides'),'Editor preview must use persisted per-instance styles.');
expect(!editorBridge.includes('platformModuleDefaultsV1'),'Existing Editor instances must not reread mutable Library defaults.');
const blockRegistry=read('public/assets/js/blocks/block-registry.js');
expect(blockRegistry.includes('styleOverrides:hasExplicitStyle?explicitStyle:snapshotStyle'),'New Editor modules must snapshot current Library style defaults.');

const lab=read('public/block-lab/index.html');
expect(lab.includes('RESEARCH ONLY'),'Block Lab must remain explicitly research-only.');
expect(!lab.includes('/ui-dashboard/module-preview/'),'Block Lab must not consume approved preview runtime directly.');

console.log('Canonical reusable UI module boundary and dependency graph contract passed.');
