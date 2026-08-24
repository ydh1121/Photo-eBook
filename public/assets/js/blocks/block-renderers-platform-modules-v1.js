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
      const props=block.content&&Object.keys(block.content).length?block.content:modules.editorProps(moduleId);
      const html=modules.render(moduleId,props,{consumer:'editor'});
      return `<div class="platform-editor-module" data-platform-editor-module="${context.escapeHtml(moduleId)}" data-platform-module-source="${context.escapeHtml(definition.source)}">${html}</div>`;
    }
  });
})();
