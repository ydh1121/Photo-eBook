(function(){
  const blocks=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];
  const registry=window.PlatformBlockRegistry;
  const comparison=blocks.find(block=>block.type==='comparison-cards');
  if(comparison){
    const images=['/assets/images/generated/v1/portfolio/product-brand.webp?v=b007','/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007','/assets/images/generated/v1/skills/tether-shooting.webp?v=b009'];
    comparison.content.items=(comparison.content.items||[]).map((item,index)=>({...item,image:item.image||images[index%images.length],imageAlt:item.imageAlt||`${item.title||'비교 항목'} 예시`}));
  }
  const roadmap=blocks.find(block=>block.type==='roadmap');
  if(roadmap){
    const metrics=[
      [{label:'월 목표',value:'샘플 80만'},{label:'평균 단가',value:'샘플 10만'}],
      [{label:'월 목표',value:'샘플 150만'},{label:'평균 단가',value:'샘플 15만'}],
      [{label:'월 목표',value:'샘플 240만'},{label:'평균 단가',value:'샘플 20만'}],
      [{label:'월 목표',value:'샘플 320만'},{label:'평균 단가',value:'샘플 25만'}]
    ];
    roadmap.content.items=(roadmap.content.items||[]).map((item,index)=>({...item,metrics:item.metrics||metrics[index%metrics.length]}));
  }

  if(registry&&!registry.get('advertisement')){
    const e=value=>registry.escapeHtml(value??'');
    registry.register({
      type:'advertisement',label:'Advertisement',category:'monetization',status:'candidate',editorialProfile:'advertisement',variants:['inline-banner','native-card','desktop-side-rail','sticky-bottom'],
      render(block){const c=block.content||{};return `<aside class="pb-block pb-ad pb-ad--${e(block.variant)}" aria-label="${e(c.label||'광고')}"><div class="pb-ad__surface"><small>${e(c.label||'광고')}</small><strong>${e(c.title||'광고 영역')}</strong><p>${e(c.description||'실제 광고 소재를 연결하기 전에 크기와 위치를 검토합니다.')}</p>${c.actionLabel?`<span class="pb-ad__action">${e(c.actionLabel)}</span>`:''}</div></aside>`;}
    });
  }
  if(!blocks.some(block=>block.type==='advertisement'))blocks.push({id:'lab_advertisement',type:'advertisement',variant:'inline-banner',status:'candidate',editorialProfile:'advertisement',content:{label:'광고',title:'본문 사이 광고 영역',description:'콘텐츠 흐름을 끊지 않는지, 모바일과 PC에서 실제 읽기 화면을 기준으로 위치와 크기를 검토합니다.',actionLabel:'광고 소재 자리'}});

  if(!document.querySelector('#pb-ad-lab-style')){
    const style=document.createElement('style');style.id='pb-ad-lab-style';style.textContent='.pb-ad{width:100%;margin:0}.pb-ad__surface{display:grid;gap:7px;min-height:120px;padding:22px;border:1px dashed rgba(35,45,62,.22);background:linear-gradient(145deg,#f8f9fb,#eef1f5);color:#656d77}.pb-ad__surface small{font-size:9px;font-weight:800;color:#8a9099}.pb-ad__surface strong{font-size:15px;color:#30353c}.pb-ad__surface p{max-width:620px;margin:0;font-size:11px;line-height:1.55}.pb-ad__action{width:max-content;margin-top:3px;padding:6px 9px;border-radius:999px;background:#fff;color:#69717c;font-size:9px;font-weight:760}.pb-ad--native-card{max-width:360px}.pb-ad--native-card .pb-ad__surface{min-height:210px;border-style:solid;border-radius:20px;box-shadow:0 12px 30px rgba(24,34,56,.08)}.pb-ad--desktop-side-rail{max-width:300px;margin-left:auto}.pb-ad--desktop-side-rail .pb-ad__surface{min-height:420px}.pb-ad--sticky-bottom .pb-ad__surface{min-height:84px;display:flex;align-items:center;gap:12px}.pb-ad--sticky-bottom .pb-ad__surface p{flex:1}@media(max-width:760px){.pb-ad--desktop-side-rail{max-width:none}.pb-ad--desktop-side-rail .pb-ad__surface{min-height:120px}.pb-ad--sticky-bottom .pb-ad__surface{display:grid}}';document.head.appendChild(style);
  }

  const adminTools=document.querySelector('.editor-top-actions,.lab-controls');
  if(adminTools&&!adminTools.querySelector('[data-platform-builder-link]')){const link=document.createElement('a');link.href='/ui-dashboard/';link.dataset.platformBuilderLink='true';link.textContent='플랫폼 빌더';link.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 9px;border:1px solid rgba(20,28,45,.10);border-radius:9px;background:#fff;color:#3f4650;text-decoration:none;font:760 9px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap';adminTools.prepend(link);}
  window.__BLOCK_LAB_DATA=blocks;
})();
