(function(){
  const blocks=window.PlatformBlockRegistry;
  const modules=window.PlatformModuleRegistry;
  if(!blocks||!modules||blocks.get('ui-module'))return;

  const approved=modules.listFor('editor');
  const variants=approved.map(item=>item.id);
  if(!variants.length)return;

  blocks.register({
    type:'ui-module',
    label:'UI 모듈',
    category:'platform',
    status:'approved',
    editorialProfile:'ui-module',
    variants,
    render(block,context){
      const moduleId=variants.includes(block.variant)?block.variant:variants[0];
      const definition=modules.get(moduleId);
      if(!definition)return '';
      const id=context.escapeHtml(moduleId);
      const label=context.escapeHtml(definition.label||moduleId);
      return `<div class="platform-editor-module" data-platform-editor-module="${id}" data-platform-module-source="${context.escapeHtml(definition.source)}"><iframe class="platform-editor-module-frame" data-platform-editor-module-frame="${id}" title="${label}" src="/ui-dashboard/module-preview/?module=${encodeURIComponent(moduleId)}&embed=editor&v=1" loading="eager"></iframe></div>`;
    }
  });
})();
