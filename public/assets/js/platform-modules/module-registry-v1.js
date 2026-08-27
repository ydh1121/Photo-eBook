(function(){
  if(window.PlatformModuleRegistry)return;

  const definitions=new Map();
  const VALID_STATUS=new Set(['approved','candidate','deprecated']);
  const VALID_SOURCE=new Set(['public-extracted','block-lab-approved','platform-core']);
  const VALID_DEPENDENCY_KIND=new Set(['composition','behavior','data']);
  const EDITOR_STYLE_SNAPSHOT=Symbol.for('platform.module.style.snapshot');
  const CONTENT_DEFAULTS_KEY='platformModuleContentDefaultsV1';
  const STYLE_DEFAULTS_KEY='platformModuleDefaultsV1';

  function escapeHtml(value=''){
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'
    }[char]));
  }

  function attr(value=''){return escapeHtml(value);}
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function readLocalObject(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
  }
  function normalizeDependencies(value,parentId){
    if(!Array.isArray(value))return [];
    const seen=new Set();
    return value.map(entry=>typeof entry==='string'?{id:entry}:entry).filter(entry=>entry&&typeof entry==='object').map(entry=>{
      const id=String(entry.id||'').trim();
      if(!id)throw new Error(`Platform module dependency id is required: ${parentId}`);
      if(id===parentId)throw new Error(`Platform module cannot depend on itself: ${parentId}`);
      if(seen.has(id))throw new Error(`Duplicate platform module dependency: ${parentId} -> ${id}`);
      seen.add(id);
      const kind=VALID_DEPENDENCY_KIND.has(entry.kind)?entry.kind:'composition';
      return Object.freeze({id,kind,required:entry.required!==false});
    });
  }

  function normalizeDefinition(input={}){
    const id=String(input.id||'').trim();
    if(!id)throw new Error('Platform module id is required.');
    if(typeof input.render!=='function')throw new Error(`Platform module render() is required: ${id}`);
    const status=VALID_STATUS.has(input.status)?input.status:'candidate';
    const source=VALID_SOURCE.has(input.source)?input.source:'platform-core';
    const consumers=Array.isArray(input.consumers)&&input.consumers.length
      ? [...new Set(input.consumers.map(String))]
      : ['library','editor'];
    const dependencies=normalizeDependencies(input.dependencies,id);
    return Object.freeze({
      label:id,
      category:'ui',
      version:1,
      status,
      source,
      sourceRoute:'',
      ownerFiles:[],
      consumers,
      dependencies,
      previewProps:{},
      editorProps:{},
      controls:[],
      ...input,
      id,
      status,
      source,
      consumers,
      dependencies,
      ownerFiles:Array.isArray(input.ownerFiles)?[...input.ownerFiles]:[],
      previewProps:input.previewProps&&typeof input.previewProps==='object'?clone(input.previewProps):{},
      editorProps:input.editorProps&&typeof input.editorProps==='object'?clone(input.editorProps):{},
      controls:Array.isArray(input.controls)?[...input.controls]:[]
    });
  }

  function canConsume(definition,consumer,{allowCandidate=false}={}){
    if(!definition)return false;
    if(definition.status==='deprecated')return false;
    if(!allowCandidate&&definition.status!=='approved')return false;
    return definition.consumers.includes(String(consumer||''));
  }
  function dependencySpec(parent,dependencyId){
    return parent?.dependencies?.find(item=>item.id===String(dependencyId||''))||null;
  }
  function resolveDependency(parentId,dependencyId,consumer,{allowCandidate=false}={}){
    const parent=definitions.get(String(parentId||''));
    if(!parent)throw new Error(`Unknown platform module: ${parentId}`);
    const spec=dependencySpec(parent,dependencyId);
    if(!spec)throw new Error(`Undeclared platform module dependency: ${parent.id} -> ${dependencyId}`);
    const dependency=definitions.get(spec.id);
    if(!dependency){
      if(spec.required)throw new Error(`Missing platform module dependency: ${parent.id} -> ${spec.id}`);
      return {parent,spec,definition:null};
    }
    if(!canConsume(dependency,consumer,{allowCandidate})){
      throw new Error(`Platform module dependency is not available for ${consumer}: ${parent.id} -> ${spec.id}`);
    }
    return {parent,spec,definition:dependency};
  }
  function hydrationResult(hydration){
    return {
      cleanup:typeof hydration==='function'?hydration:typeof hydration?.cleanup==='function'?hydration.cleanup:()=>{},
      api:hydration&&typeof hydration==='object'&&hydration.api?hydration.api:null
    };
  }

  const registry={
    register(input){
      const definition=normalizeDefinition(input);
      definitions.set(definition.id,definition);
      return definition;
    },
    get(id){return definitions.get(String(id||''))||null;},
    list(){return [...definitions.values()];},
    listFor(consumer,{allowCandidate=false}={}){
      return [...definitions.values()].filter(def=>canConsume(def,consumer,{allowCandidate}));
    },
    canConsume(id,consumer,options){return canConsume(definitions.get(String(id||'')),consumer,options);},
    dependencies(id){return clone(definitions.get(String(id||''))?.dependencies||[]);},
    resolveDependency(parentId,dependencyId,consumer='library',options={}){
      return resolveDependency(parentId,dependencyId,String(consumer||'library'),options).definition;
    },
    render(id,props={},context={}){
      const definition=definitions.get(String(id||''));
      if(!definition)throw new Error(`Unknown platform module: ${id}`);
      const consumer=String(context.consumer||'library');
      if(!canConsume(definition,consumer,{allowCandidate:Boolean(context.allowCandidate)})){
        throw new Error(`Platform module is not available for ${consumer}: ${definition.id}`);
      }
      return definition.render(props||{},context,{escapeHtml,attr,clone,definition});
    },
    renderDependency(parentId,dependencyId,props={},context={}){
      const consumer=String(context.consumer||'library');
      const {definition}=resolveDependency(parentId,dependencyId,consumer,{allowCandidate:Boolean(context.allowCandidate)});
      if(!definition)return '';
      return this.render(definition.id,props,context);
    },
    hydrateDependency(parentId,target,dependencyId,props={},context={}){
      if(!(target instanceof Element))throw new Error('Platform dependency hydrate target is required.');
      const consumer=String(context.consumer||'library');
      const {definition}=resolveDependency(parentId,dependencyId,consumer,{allowCandidate:Boolean(context.allowCandidate)});
      if(!definition||typeof definition.hydrate!=='function')return {definition,target,cleanup:()=>{},api:null};
      const result=hydrationResult(definition.hydrate(target,props||{},context,{escapeHtml,attr,clone,definition}));
      return {definition,target,...result};
    },
    mount(target,id,props={},context={}){
      if(!(target instanceof Element))throw new Error('Platform module mount target is required.');
      const definition=definitions.get(String(id||''));
      if(!definition)throw new Error(`Unknown platform module: ${id}`);
      target.dataset.platformModuleHost=definition.id;
      target.innerHTML=this.render(definition.id,props,context);
      const result=hydrationResult(typeof definition.hydrate==='function'
        ? definition.hydrate(target,props||{},context,{escapeHtml,attr,clone,definition})
        : null);
      return {definition,target,...result};
    },
    previewProps(id){return clone(definitions.get(String(id||''))?.previewProps||{});},
    editorProps(id){
      const definition=definitions.get(String(id||''));
      const base=clone(definition?.editorProps||{});
      if(!definition)return base;
      const contentDefaults=readLocalObject(CONTENT_DEFAULTS_KEY)[definition.id];
      const styleDefaults=readLocalObject(STYLE_DEFAULTS_KEY)[definition.id];
      const content={...base,...(contentDefaults&&typeof contentDefaults==='object'?clone(contentDefaults):{})};
      Object.defineProperty(content,EDITOR_STYLE_SNAPSHOT,{value:{...(clone(definition.styleDefaults||{})),...(styleDefaults&&typeof styleDefaults==='object'?clone(styleDefaults):{})},enumerable:false,configurable:false});
      return content;
    },
    provenance(id){
      const def=definitions.get(String(id||''));if(!def)return null;
      return {id:def.id,status:def.status,source:def.source,sourceRoute:def.sourceRoute,ownerFiles:[...def.ownerFiles],consumers:[...def.consumers],dependencies:clone(def.dependencies||[]),version:def.version};
    },
    escapeHtml,
    attr,
    clone,
    editorStyleSnapshotSymbol:EDITOR_STYLE_SNAPSHOT
  };

  window.PlatformModuleRegistry=registry;
})();
