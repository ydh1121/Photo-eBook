(function(){
  const api=window.BlockLabStylePresets;
  if(!api)return;

  const STATUS_OPTIONS=['draft','approved','redesign','deprecated'];
  const STATUS_LABELS={draft:'미결정',approved:'승인',redesign:'재설계',deprecated:'폐기'};
  let scheduled=false;

  function currentPreset(panel){
    const id=String(panel.querySelector('[data-style-preset-select]')?.value||'');
    if(!id)return null;
    return (api.exportPayload?.()||[]).find(item=>item?.id===id)||null;
  }

  function updatePresetStatus(id,status){
    if(!id||!STATUS_OPTIONS.includes(status))return;
    const now=new Date().toISOString();
    const items=(api.exportPayload?.()||[]).map(item=>item?.id===id?{...item,status,updatedAt:now}:item);
    api.replaceFromServer?.(items);
  }

  function enhancePanel(panel){
    const preset=currentPreset(panel);
    let lifecycle=panel.querySelector('[data-style-lifecycle]');
    if(!preset){lifecycle?.remove();return;}
    const status=STATUS_OPTIONS.includes(preset.status)?preset.status:'draft';
    const signature=`${preset.id}:${status}:${preset.updatedAt||''}`;
    if(lifecycle?.dataset.styleLifecycle===signature)return;

    const host=document.createElement('label');
    host.className='lab-style-lifecycle';
    host.dataset.styleLifecycle=signature;
    host.innerHTML=`<span>검토 상태</span><select data-style-lifecycle-select>${STATUS_OPTIONS.map(value=>`<option value="${value}" ${value===status?'selected':''}>${STATUS_LABELS[value]}</option>`).join('')}</select>`;
    if(lifecycle)lifecycle.replaceWith(host);
    else panel.querySelector('.lab-style-editor__head')?.appendChild(host);
    host.querySelector('select')?.addEventListener('change',event=>updatePresetStatus(preset.id,event.target.value));
  }

  function enhanceAll(){
    scheduled=false;
    document.querySelectorAll('.lab-style-editor').forEach(enhancePanel);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhanceAll);}

  const observer=new MutationObserver(schedule);
  observer.observe(document.querySelector('#labSpecimens')||document.body,{childList:true,subtree:true});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-style-preset-select],[data-variant-for]'))setTimeout(schedule,0);},true);
  schedule();
})();
