(function(){
  const blocks=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];
  const comparison=blocks.find(block=>block.type==='comparison-cards');
  if(comparison){
    const images=[
      '/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',
      '/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',
      '/assets/images/generated/v1/skills/tether-shooting.webp?v=b009'
    ];
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
})();
