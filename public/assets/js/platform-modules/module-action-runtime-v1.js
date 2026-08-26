/* v1: portable action contract for standalone interactive modules. */
(function(){
  if(window.PlatformModuleActionRuntime)return;

  const VALID=new Set(['none','click-target','scroll-to','navigate','custom-event']);

  function normalize(props={}){
    const action=props.action&&typeof props.action==='object'?props.action:{};
    const type=VALID.has(String(action.type||props.actionType||''))?String(action.type||props.actionType):'none';
    const value=String(action.value??props.actionValue??'').trim();
    const newTab=Boolean(action.newTab??props.actionNewTab);
    return {type,value,newTab};
  }

  function dispatch(node,name,detail={}){
    node?.dispatchEvent(new CustomEvent(name,{bubbles:true,detail}));
  }

  function execute(node,action,context={}){
    const detail={moduleId:node?.dataset?.platformModule||'',action:{...action},consumer:context.consumer||'public'};
    node.dataset.platformActionLast=action.type;
    dispatch(node,'platform-module-action',detail);
    if(action.type==='none')return {ok:true,type:'none'};
    if(action.type==='custom-event'){
      const name=action.value||'platform-custom-action';
      dispatch(node,name,detail);
      return {ok:true,type:action.type,value:name};
    }
    if(!action.value)return {ok:false,type:action.type,reason:'missing-value'};
    if(action.type==='click-target'){
      const target=document.querySelector(action.value);
      if(!target)return {ok:false,type:action.type,reason:'target-not-found'};
      target.click();
      return {ok:true,type:action.type,value:action.value};
    }
    if(action.type==='scroll-to'){
      const target=document.querySelector(action.value);
      if(!target)return {ok:false,type:action.type,reason:'target-not-found'};
      target.scrollIntoView({behavior:'smooth',block:'start'});
      return {ok:true,type:action.type,value:action.value};
    }
    if(action.type==='navigate'){
      if(context.consumer==='library'||context.consumer==='editor'){
        dispatch(node,'platform-module-navigation-preview',{...detail,url:action.value,newTab:action.newTab});
        return {ok:true,type:action.type,value:action.value,preview:true};
      }
      if(action.newTab)window.open(action.value,'_blank','noopener');
      else window.location.assign(action.value);
      return {ok:true,type:action.type,value:action.value};
    }
    return {ok:false,type:action.type,reason:'unsupported'};
  }

  function bind(host,props={},context={}){
    const node=host?.matches?.('[data-platform-module="floating-action"]')?host:host?.querySelector?.('[data-platform-module="floating-action"]');
    if(!node)return;
    const action=normalize(props);
    node.dataset.platformActionType=action.type;
    node.dataset.platformActionValue=action.value;
    node.dataset.platformActionNewTab=String(action.newTab);
    const click=event=>{
      if(node.disabled||node.getAttribute('aria-disabled')==='true')return;
      const result=execute(node,action,context);
      if(!result.ok)dispatch(node,'platform-module-action-error',result);
      if(action.type!=='none'&&event.cancelable)event.preventDefault();
    };
    node.addEventListener('click',click);
    return ()=>node.removeEventListener('click',click);
  }

  window.PlatformModuleActionRuntime={version:1,normalize,execute,bind,types:[...VALID]};
})();
