(function(){
  if(window.__platformAdminSurfaceV1)return;
  window.__platformAdminSurfaceV1=true;

  function details(label,className){
    const node=document.createElement('details');
    node.className=`admin-surface-menu ${className}`;
    node.innerHTML=`<summary>${label}</summary><div class="admin-surface-menu__panel"></div>`;
    return node;
  }

  function groupBlockLab(){
    const controls=document.querySelector('.block-lab:not(.editor-lab) .lab-controls');
    if(!controls||controls.dataset.adminGrouped==='true')return false;
    const server=controls.querySelector('.lab-review-server');
    const exportButton=controls.querySelector('#labReviewExport');
    const theme=[...controls.querySelectorAll('.lab-segment')].find(node=>node.querySelector('[data-theme-value]'));
    const preview=[...controls.querySelectorAll('.lab-segment')].find(node=>node.querySelector('[data-preview-value]'));
    if(!server||!theme||!preview)return false;

    const sync=details('동기화','admin-lab-sync');
    const syncPanel=sync.querySelector('.admin-surface-menu__panel');
    syncPanel.appendChild(server);
    if(exportButton)syncPanel.appendChild(exportButton);

    const view=details('보기','admin-lab-view');
    const viewPanel=view.querySelector('.admin-surface-menu__panel');
    const themeRow=document.createElement('div');themeRow.className='admin-surface-menu__row';themeRow.innerHTML='<span>테마</span>';themeRow.appendChild(theme);
    const previewRow=document.createElement('div');previewRow.className='admin-surface-menu__row';previewRow.innerHTML='<span>화면 폭</span>';previewRow.appendChild(preview);
    viewPanel.append(themeRow,previewRow);

    controls.append(sync,view);
    controls.dataset.adminGrouped='true';
    return true;
  }

  function groupEditor(){
    const actions=document.querySelector('.editor-lab .editor-top-actions');
    if(!actions||actions.dataset.adminGrouped==='true')return false;
    const server=actions.querySelector('.editor-server-controls');
    const theme=[...actions.querySelectorAll('.editor-segment')].find(node=>node.querySelector('[data-editor-theme]'));
    if(!server||!theme)return false;

    const draft=details('초안','admin-editor-draft');
    draft.querySelector('.admin-surface-menu__panel').appendChild(server);
    const view=details('테마','admin-editor-view');
    const row=document.createElement('div');row.className='admin-surface-menu__row';row.innerHTML='<span>캔버스</span>';row.appendChild(theme);view.querySelector('.admin-surface-menu__panel').appendChild(row);

    const utility=actions.querySelector('.admin-utility-menu');
    if(utility){actions.insertBefore(draft,utility);actions.insertBefore(view,utility);}else actions.append(draft,view);
    actions.dataset.adminGrouped='true';
    return true;
  }

  function bindMenus(){
    if(document.documentElement.dataset.adminSurfaceMenuBound==='true')return;
    document.documentElement.dataset.adminSurfaceMenuBound='true';
    document.addEventListener('pointerdown',event=>{
      if(event.target.closest('.admin-surface-menu'))return;
      document.querySelectorAll('.admin-surface-menu[open]').forEach(menu=>menu.open=false);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.admin-surface-menu[open]').forEach(menu=>menu.open=false);});
    document.addEventListener('click',event=>{
      const summary=event.target.closest('.admin-surface-menu>summary');
      if(!summary)return;
      const current=summary.parentElement;
      queueMicrotask(()=>{if(current.open)document.querySelectorAll('.admin-surface-menu[open]').forEach(menu=>{if(menu!==current)menu.open=false;});});
    });
  }

  function run(){groupBlockLab();groupEditor();bindMenus();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  let tries=0;const timer=setInterval(()=>{run();tries+=1;if(tries>16||document.querySelector('[data-admin-grouped="true"]'))clearInterval(timer);},180);
})();