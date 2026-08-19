(function(){
  const TOKEN_KEY='platformEditorAdminToken';
  const inspector=document.querySelector('#editorInspector');
  const dialog=document.querySelector('#editorMediaDialog');
  const list=document.querySelector('#editorMediaList');
  const search=document.querySelector('#editorMediaSearch');
  const status=document.querySelector('#editorMediaStatus');
  const closeButton=document.querySelector('#editorMediaClose');
  const seoImage=document.querySelector('#editorSeoOgImage');
  if(!inspector||!dialog||!list||!search||!status)return;

  let target='';
  let assets=[];

  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}
  function parsePath(value){try{return JSON.parse(decodeURIComponent(value));}catch{return [];}}
  function pathAttr(path){return encodeURIComponent(JSON.stringify(path));}
  function isImageKey(key){return ['image','avatar'].includes(String(key||''));}

  function collectLocalAssets(){
    const result=[];
    const seen=new Set();
    const roots=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];
    function walk(value,context={}){
      if(Array.isArray(value)){value.forEach(item=>walk(item,context));return;}
      if(!value||typeof value!=='object')return;
      const nextContext={
        title:String(value.title||context.title||''),
        alt:String(value.imageAlt||value.alt||context.alt||'')
      };
      for(const [key,item] of Object.entries(value)){
        if(isImageKey(key)&&typeof item==='string'&&item&&!seen.has(item)){
          seen.add(item);
          result.push({assetId:`sample-${result.length+1}`,publicUrl:item,alt:nextContext.alt||nextContext.title,sourceType:'Block Lab sample',status:'sample'});
        }else walk(item,nextContext);
      }
    }
    roots.forEach(root=>walk(root.content||root,{title:root.type||''}));
    return result;
  }

  async function fetchServerAssets(){
    const token=getToken();
    if(!token)return [];
    const response=await fetch('/api/editor/assets',{credentials:'same-origin',headers:{Authorization:`Bearer ${token}`}});
    if(!response.ok)return [];
    const data=await response.json().catch(()=>({}));
    return Array.isArray(data.assets)?data.assets:[];
  }

  function mergeAssets(local,server){
    const map=new Map();
    for(const item of [...server,...local]){
      const url=String(item?.publicUrl||'');
      if(!url||map.has(url))continue;
      map.set(url,item);
    }
    return [...map.values()];
  }

  function render(){
    const query=String(search.value||'').trim().toLowerCase();
    const filtered=assets.filter(item=>`${item.alt||''} ${item.sourceType||''} ${item.assetId||''}`.toLowerCase().includes(query));
    list.innerHTML=filtered.length?filtered.map(item=>`<button type="button" class="editor-media-card" data-media-url="${escapeHtml(item.publicUrl)}" data-media-alt="${escapeHtml(item.alt||'')}"><span class="editor-media-card__thumb"><img src="${escapeHtml(item.publicUrl)}" alt="" loading="lazy"></span><span class="editor-media-card__copy"><strong>${escapeHtml(item.alt||item.assetId||'이미지')}</strong><small>${escapeHtml(item.sourceType||item.status||'asset')}</small></span></button>`).join(''):'<p class="editor-media-empty">조건에 맞는 이미지가 없습니다.</p>';
    list.querySelectorAll('[data-media-url]').forEach(button=>button.addEventListener('click',()=>selectAsset(button.dataset.mediaUrl,button.dataset.mediaAlt||'')));
  }

  function findField(encoded){
    return [...document.querySelectorAll('[data-edit-path]')].find(field=>field.dataset.editPath===encoded)||null;
  }

  function selectAsset(url,alt){
    if(target==='seo-og-image'){
      if(seoImage){seoImage.value=url;seoImage.dispatchEvent(new Event('change',{bubbles:true}));}
      dialog.close();
      return;
    }
    const field=findField(target);
    if(!field)return;
    field.value=url;
    field.dispatchEvent(new Event('change',{bubbles:true}));

    const path=parsePath(target);
    if(alt&&path[path.length-1]==='image'){
      const altPath=[...path.slice(0,-1),'imageAlt'];
      const altField=findField(pathAttr(altPath));
      if(altField&&!String(altField.value||'').trim()){
        altField.value=alt;
        altField.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    dialog.close();
  }

  async function openPicker(nextTarget){
    target=nextTarget;
    search.value='';
    status.textContent=getToken()?'미디어 목록 불러오는 중':'브라우저 샘플 이미지';
    assets=collectLocalAssets();
    render();
    dialog.showModal();
    try{
      const server=await fetchServerAssets();
      assets=mergeAssets(assets,server);
      status.textContent=server.length?`등록 이미지 ${server.length}개 + 샘플 ${collectLocalAssets().length}개`:'브라우저 샘플 이미지';
      render();
    }catch{
      status.textContent='서버 미디어를 불러오지 못해 샘플만 표시합니다.';
    }
  }

  function enhanceInspector(){
    inspector.querySelectorAll('[data-edit-path]').forEach(field=>{
      if(field.dataset.mediaEnhanced==='true')return;
      const path=parsePath(field.dataset.editPath);
      const key=path[path.length-1];
      if(!isImageKey(key))return;
      field.dataset.mediaEnhanced='true';
      const button=document.createElement('button');
      button.type='button';
      button.className='editor-media-pick-button';
      button.textContent='미디어';
      button.addEventListener('click',event=>{event.preventDefault();openPicker(field.dataset.editPath);});
      field.insertAdjacentElement('afterend',button);
    });
  }

  function enhanceSeo(){
    if(!seoImage||seoImage.dataset.mediaEnhanced==='true')return;
    seoImage.dataset.mediaEnhanced='true';
    const button=document.createElement('button');
    button.type='button';
    button.className='editor-media-pick-button';
    button.textContent='미디어';
    button.addEventListener('click',event=>{event.preventDefault();openPicker('seo-og-image');});
    seoImage.insertAdjacentElement('afterend',button);
  }

  const observer=new MutationObserver(enhanceInspector);
  observer.observe(inspector,{childList:true,subtree:true});
  search.addEventListener('input',render);
  closeButton?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  enhanceInspector();
  enhanceSeo();
})();
