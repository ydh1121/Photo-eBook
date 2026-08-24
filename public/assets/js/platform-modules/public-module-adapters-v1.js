(function(){
  const modules=window.PlatformModuleRegistry;
  if(!modules||window.__platformPublicModuleAdaptersV1)return;
  window.__platformPublicModuleAdaptersV1=true;

  const legacyNav=typeof window.nav==='function'?window.nav:null;
  window.nav=function(data){
    const items=(data?.nav||[]).map(item=>({id:String(item.id||''),label:String(item['칩']||item.label||'')}));
    try{
      return modules.render('top-chapter-navigation',{items},{consumer:'public'});
    }catch(error){
      if(legacyNav)return legacyNav(data);
      throw error;
    }
  };
})();
