/* Shared bookmark storage. Legacy keys remain unchanged. Preview stores stay in memory. */
(function(){
  if(window.ContentBookmarkStore)return;
  const keys={video:['photoRoadmapVideoFavoritesV1','photoRoadmapVideoFavoriteItemsV2'],article:['photoRoadmapCuratedFavoritesV1','photoRoadmapCuratedFavoriteItemsV2']};
  function read(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}}
  function create({persistent=false}={}){
    const memory={video:{ids:[],items:{}},article:{ids:[],items:{}}};
    function state(type){const pair=keys[type];if(!pair)throw new Error('Unknown bookmark type');if(!persistent)return memory[type];const rawIds=read(pair[0],[]),rawItems=read(pair[1],{});return {ids:Array.isArray(rawIds)?rawIds:[],items:rawItems&&!Array.isArray(rawItems)?rawItems:{}};}
    return {
      has(type,id){return state(type).ids.includes(String(id));},
      items(type){return Object.values(state(type).items);},
      set(type,item,selected){
        const id=String(item?.id||'');if(!id)return;
        const current=state(type),ids=new Set(current.ids),items={...current.items};
        if(selected){ids.add(id);items[id]={...item,savedAt:item.savedAt||new Date().toISOString()};}else{ids.delete(id);delete items[id];}
        const next={ids:[...ids],items};
        if(persistent){localStorage.setItem(keys[type][0],JSON.stringify(next.ids));localStorage.setItem(keys[type][1],JSON.stringify(next.items));}
        else memory[type]=next;
        document.dispatchEvent(new CustomEvent('content-bookmarks-changed',{detail:{type,id,selected,persistent}}));
      }
    };
  }
  const shared=create({persistent:true});
  window.ContentBookmarkStore={...shared,create,keys};
})();
