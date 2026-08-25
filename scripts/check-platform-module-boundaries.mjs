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
expect(registry.includes("definition.status!=='approved'"),'Normal consumers must reject non-approved modules.');
expect(registry.includes("CONTENT_DEFAULTS_KEY='platformModuleContentDefaultsV1'"),'Library content defaults must snapshot into new Editor instances.');
expect(registry.includes("STYLE_DEFAULTS_KEY='platformModuleDefaultsV1'"),'Library style defaults must snapshot into new Editor instances.');
expect(registry.includes('hydration.api'),'Registry mount must expose real interaction APIs.');

const modules=read('public/assets/js/platform-modules/photo-core-modules-v1.js');
for(const id of expected)expect(modules.includes(`id:'${id}'`),`Missing approved platform module: ${id}`);
expect((modules.match(/status:'approved'/g)||[]).length>=expected.length,'All first-set modules must be approved explicitly.');
expect(modules.includes("id:'filter-chip-rail'")&&modules.includes("source:'platform-core'"),'Generic filter must be identified as platform-core, not falsely public-extracted.');
for(const marker of ['platform-filter-chip-source--liquid','platform-filter-chip-source--ios-flat','platform-filter-chip-source--material-flat'])expect(modules.includes(marker),`Missing canonical filter family: ${marker}`);
expect(modules.includes("new CustomEvent('platform-filter-select'"),'Filter module must expose a real reusable selection event.');
expect(modules.includes("fontFamily:'system-sans'")&&modules.includes('fontSize:15')&&modules.includes('fontSize:14'),'Navigation/filter typography defaults must be persisted in module definitions.');
expect(!modules.includes("source:'platform-canonical'"),'Unsupported provenance aliases must not be used.');
for(const forbidden of ['function renderNav','function renderCard','function renderCollection','DEFAULT_CARDS','DEFAULT_FILTERS'])expect(!modules.includes(forbidden),`Library imitation renderer leaked into module definitions: ${forbidden}`);

const source=read('public/assets/js/platform-modules/photo-public-module-source-v1.js');
for(const marker of ['renderNavigation','renderHorizontalCardRail','renderCollectionShell','hydrateCollection','renderDeviceHandoff','renderFab'])expect(source.includes(marker),`Missing public-derived module owner: ${marker}`);
expect(source.includes('if(delta>86)shut()'),'Bottom sheet must retain drag-dismiss behavior.');
expect(source.includes("if(tab==='video')return ['all',...new Set"),'Video filter derivation must remain data-driven.');
expect(source.includes("if(tab==='article')return ['all',...new Set"),'Article filter derivation must remain data-driven.');

const filterCss=read('public/assets/styles/platform-modules/filter-chip-rail-v1.css');
for(const marker of ['platform-filter-chip-source--liquid','platform-filter-chip-source--ios-flat','platform-filter-chip-source--material-flat','--platform-filter-font-family'])expect(filterCss.includes(marker),`Filter CSS missing runtime family/typography contract: ${marker}`);
expect(filterCss.includes('Shared by Library, Block Editor and published pages'),'Filter stylesheet must document shared runtime ownership.');

const styleRuntime=read('public/assets/js/platform-modules/module-style-runtime-v1.js');
for(const marker of ['FONT_STACKS','fontFamily','fontSize','fontWeight','letterSpacing','progressEnabled','progressMode','progressColor','leftFade','themeSelector','moduleScrollbar'])expect(styleRuntime.includes(marker),`Visible setting has no canonical runtime implementation marker: ${marker}`);
expect(styleRuntime.includes("allowed=['ios-liquid','ios-flat','material-flat']"),'Filter style runtime must support exactly the three canonical families.');
expect(styleRuntime.includes("['themeSelector','.theme-setting-card']"),'Bottom sheet theme-selector control must affect the real node.');
expect(styleRuntime.includes('data-module-scrollbar'),'Card scrollbar control must affect the real horizontal rail.');

const extension=read('public/data/ui-capabilities/v1/module-extension-v1.js');
expect(extension.includes("family.options=['ios-liquid','ios-flat','material-flat']"),'Library must expose all three canonical filter families.');
for(const id of ['fontFamily','fontSize','fontWeight','letterSpacing'])expect(extension.includes(`id:'${id}'`),`Typography control missing from Library metadata: ${id}`);

const dashboard=read('public/ui-dashboard/index.html');
expect(dashboard.includes('data-builder-view="library"'),'/ui-dashboard/ must remain Library-only.');
expect(!dashboard.includes('/ui-dashboard/sandbox/'),'Library must not boot old sandbox runtime.');
expect(dashboard.includes('/assets/js/platform-modules/photo-core-modules-v1.js'),'Library must load the shared Registry definitions.');

const preview=read('public/ui-dashboard/module-preview/index.html');
expect(!preview.includes('/ui-dashboard/sandbox/'),'Shared preview must have zero sandbox dependencies.');
expect(preview.includes('/assets/styles/platform-modules/filter-chip-rail-v1.css'),'Preview must use the shared filter stylesheet.');
expect(preview.includes('/assets/js/platform-modules/module-style-runtime-v1.js'),'Preview must use the canonical style runtime.');

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
expect(editorHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'Block Editor must load PlatformModuleRegistry.');
const editorBridge=read('public/assets/js/editor-lab/module-frame-bridge-v1.js');
expect(editorBridge.includes('block?.styleOverrides'),'Editor preview must use persisted per-instance styles.');
expect(!editorBridge.includes('platformModuleDefaultsV1'),'Existing Editor instances must not reread mutable Library defaults.');
const blockRegistry=read('public/assets/js/blocks/block-registry.js');
expect(blockRegistry.includes('styleOverrides:hasExplicitStyle?explicitStyle:snapshotStyle'),'New Editor modules must snapshot current Library style defaults.');

const lab=read('public/block-lab/index.html');
expect(lab.includes('RESEARCH ONLY'),'Block Lab must remain explicitly research-only.');
expect(!lab.includes('/ui-dashboard/module-preview/'),'Block Lab must not consume approved preview runtime directly.');

console.log('Canonical reusable UI module boundary contract passed.');
