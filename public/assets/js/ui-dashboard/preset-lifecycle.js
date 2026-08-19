(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const presetList=document.querySelector('#uiPresetList');
  if(!manifest||!presetList)return;

  const STORAGE_KEY='platformUiCapabilityPresetsV1';
  const STATUS_OPTIONS=['draft','approved','redesign','deprecated'];
  const STATUS_LABELS={draft:'미결정',approved:'승인',redesign:'재설계',deprecated:'폐기'};
  let scheduled=false;

  function readLocal(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeLocal(items){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}catch{}}
  function currentCapabilityId(){return document.querySelector('[data-capability-id][aria-pressed="true"]')?.dataset.capabilityId||'';}
  function builtinById(capabilityId,id){const capability=(manifest.capabilities||[]).find(item=>item.id===capabilityId);return (capability?.presets||[]).find(item=>item.id===id)||null;}
  function localById(capabilityId,id){return readLocal().find(item=>item?.capabilityId===capabilityId&&item?.id===id)||null;}

  function upsertStatus(capabilityId,id,status){
    if(!STATUS_OPTIONS.includes(status))return;
    const items=readLocal();
    const index=items.findIndex(item=>item?.capabilityId===capabilityId&&item?.id===id);
    const builtin=builtinById(capabilityId,id);
    const previous=index>=0?items[index]:null;
    if(!previous&&!builtin)return;
    const now=new Date().toISOString();
    const next={
      id,
      capabilityId,
      name:String(previous?.name||builtin?.name||id),
      config:previous?.config&&typeof previous.config==='object'?previous.config:JSON.parse(JSON.stringify(builtin?.config||{})),
      source:String(previous?.source||builtin?.source||'system'),
      status,
      createdAt:String(previous?.createdAt||now),
      updatedAt:now,
      notes:String(previous?.notes||''),
      version:Number(previous?.version||1)||1
    };
    if(index>=0)items[index]=next;else items.push(next);
    writeLocal(items);
  }

  function enhance(){
    scheduled=false;
    const capabilityId=currentCapabilityId();
    if(!capabilityId)return;
    const seen=new Set();
    [...presetList.querySelectorAll('.ui-preset')].forEach(card=>{
      const button=card.querySelector('[data-preset-id]');
      const id=String(button?.dataset.presetId||'');
      if(!id)return;
      if(seen.has(id)){card.remove();return;}
      seen.add(id);

      const builtin=builtinById(capabilityId,id);
      const local=localById(capabilityId,id);
      const effective=local||builtin;
      if(!effective)return;
      const status=STATUS_OPTIONS.includes(effective.status)?effective.status:'draft';
      const meta=card.querySelector('span');
      if(meta)meta.textContent=`${effective.source||'user'} · ${STATUS_LABELS[status]||status}`;

      let control=card.querySelector('[data-ui-preset-status]');
      if(!control){
        control=document.createElement('label');
        control.className='ui-preset-status';
        control.innerHTML=`<span>검토 상태</span><select data-ui-preset-status>${STATUS_OPTIONS.map(value=>`<option value="${value}">${STATUS_LABELS[value]}</option>`).join('')}</select>`;
        card.appendChild(control);
      }
      const select=control.querySelector('select');
      select.value=status;
      if(select.dataset.bound!=='true'){
        select.dataset.bound='true';
        select.addEventListener('change',()=>{
          upsertStatus(capabilityId,id,select.value);
          const updated=localById(capabilityId,id)||builtinById(capabilityId,id);
          if(meta)meta.textContent=`${updated?.source||'user'} · ${STATUS_LABELS[select.value]||select.value}`;
        });
      }
    });
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance);}
  const observer=new MutationObserver(schedule);
  observer.observe(presetList,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-capability-id]'))setTimeout(schedule,0);},true);
  schedule();
})();
