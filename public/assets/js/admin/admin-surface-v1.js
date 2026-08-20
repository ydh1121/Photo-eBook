(function(){
  if(window.__platformAdminSurfaceV1)return;
  window.__platformAdminSurfaceV1=true;

  function installStyle(){
    if(document.querySelector('#admin-surface-menu-style'))return;
    const style=document.createElement('style');style.id='admin-surface-menu-style';style.textContent=`
      .admin-surface-menu{position:relative;flex:0 0 auto}.admin-surface-menu>summary{list-style:none;display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border:1px solid #e2e5e9;border-radius:9px;background:#fff;color:#4c545e;font-size:9px;font-weight:730;cursor:pointer}.admin-surface-menu>summary::-webkit-details-marker{display:none}.admin-surface-menu[open]>summary{border-color:#cfd8ee;background:#f5f8ff;color:#315fc9}.admin-surface-menu__panel{position:absolute;z-index:120;right:0;top:38px;display:grid;gap:8px;min-width:230px;padding:9px;border:1px solid #e1e4e8;border-radius:12px;background:#fff;box-shadow:0 18px 42px rgba(20,28,42,.15)}.admin-surface-menu__row{display:grid;gap:6px}.admin-surface-menu__row>span{color:#8a919b;font-size:8px;font-weight:700}.admin-surface-menu__panel .lab-segment,.admin-surface-menu__panel .editor-segment{width:100%;justify-content:stretch}.admin-surface-menu__panel .lab-segment button,.admin-surface-menu__panel .editor-segment button{flex:1}.admin-surface-menu__panel .lab-review-server,.admin-surface-menu__panel .editor-server-controls{display:grid!important;grid-template-columns:1fr!important;gap:5px!important;width:100%!important;margin:0!important}.admin-surface-menu__panel .lab-review-server button,.admin-surface-menu__panel .lab-review-server select,.admin-surface-menu__panel .editor-server-controls button,.admin-surface-menu__panel .editor-server-controls select,.admin-surface-menu__panel>#labReviewExport{width:100%!important;min-height:31px!important;margin:0!important;border-radius:8px!important;font-size:9px!important}.admin-surface-menu__panel .lab-review-server span{padding:3px 2px;color:#8a919b;font-size:8px}.admin-editor-draft .admin-surface-menu__panel{min-width:190px}@media(max-width:820px){.admin-surface-menu__panel{position:fixed;left:8px;right:8px;top:auto;bottom:10px;min-width:0}}
    `;document.head.appendChild(style);
  }

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

  function run(){installStyle();groupBlockLab();groupEditor();bindMenus();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  let tries=0;const timer=setInterval(()=>{run();tries+=1;if(tries>24||document.querySelector('[data-admin-grouped="true"]'))clearInterval(timer);},180);
})();