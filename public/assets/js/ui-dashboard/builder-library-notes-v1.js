(function(){
  if(new URLSearchParams(location.search).get('view')!=='library')return;
  if(window.__platformBuilderLibraryNotesV1)return;
  window.__platformBuilderLibraryNotesV1=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;
  const NOTES='platformBuilderNotesV1';
  const PRESETS='platformUiCapabilityPresetsV1';
  const CONFIGS='platformBuilderCapabilityConfigsV2';
  const TOKEN='platformEditorAdminToken';

  function readObject(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function active(){return new URL(location.href).searchParams.get('ui')||'top-chapter-navigation';}
  function capability(id){return manifest.capabilities.find(item=>item.id===id);}
  function token(){try{return sessionStorage.getItem(TOKEN)||'';}catch{return '';}}

  function toast(message){
    let node=document.querySelector('#builderLibraryNoteToast');
    if(!node){node=document.createElement('div');node.id='builderLibraryNoteToast';node.className='builder-system-toast';document.body.appendChild(node);}
    node.textContent=message;node.classList.add('is-visible');
    clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('is-visible'),2400);
  }

  async function save(id,inspector){
    const item=capability(id);if(!item)return;
    const textarea=inspector.querySelector('[data-kit-note]');
    const note=String(textarea?.value||'').trim();
    const notes=readObject(NOTES);notes[id]=note;writeObject(NOTES,notes);

    const now=new Date().toISOString();
    const memo={
      id:`builder_note_${id}`,
      capabilityId:id,
      name:`${item.label} · 수정 요청`,
      config:readObject(CONFIGS)[id]||{},
      source:'user',status:'draft',updatedAt:now,notes:note,version:1
    };
    const presets=readArray(PRESETS);
    const index=presets.findIndex(entry=>entry?.id===memo.id);
    if(index>=0){memo.createdAt=presets[index].createdAt||now;presets[index]={...presets[index],...memo};}
    else{memo.createdAt=now;presets.push(memo);}
    writeArray(PRESETS,presets.slice(-200));

    const adminToken=token();
    if(!adminToken){toast('메모를 브라우저에 저장했습니다.');return;}
    try{
      const response=await fetch('/api/editor/ui-presets',{method:'POST',credentials:'same-origin',headers:{Authorization:`Bearer ${adminToken}`,'Content-Type':'application/json'},body:JSON.stringify({presets:[memo]})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok===false)throw new Error(data?.message||'메모 저장 실패');
      toast('메모를 서버에도 저장했습니다.');
    }catch(error){
      toast(error?.message||'서버에는 저장하지 못했습니다.');
    }
  }

  function ensure(){
    const inspector=document.querySelector('.builder-kit-inspector');
    if(!inspector||inspector.hidden)return;
    const id=active();
    if(inspector.dataset.noteOwner===id&&inspector.querySelector('[data-kit-note]'))return;
    inspector.dataset.noteOwner=id;
    const body=inspector.querySelector('.builder-library-audit-inspector__body');
    const footer=inspector.querySelector(':scope > footer');
    if(!body||!footer)return;

    body.querySelector('[data-kit-note-wrap]')?.remove();
    footer.querySelector('[data-kit-save-note]')?.remove();
    const section=document.createElement('section');
    section.className='builder-inspector__memo';section.dataset.kitNoteWrap='true';
    section.innerHTML='<label>수정 요청 메모<textarea data-kit-note placeholder="예: 선택된 칩 그림자를 조금 줄이고 PC에서는 좌우 여백을 맞춰주세요."></textarea></label><p>메모는 승인과 별개로 저장됩니다.</p>';
    section.querySelector('[data-kit-note]').value=readObject(NOTES)[id]||'';
    body.appendChild(section);

    const button=document.createElement('button');
    button.type='button';button.dataset.kitSaveNote='true';button.textContent='메모 저장';
    button.addEventListener('click',()=>save(id,inspector));
    footer.appendChild(button);
  }

  const observer=new MutationObserver(()=>queueMicrotask(ensure));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',()=>queueMicrotask(ensure),true);
  ensure();
})();
