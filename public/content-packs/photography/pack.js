(function(){
  const images={
    hero:'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1900&q=90',
    intro:'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1600&q=88',
    product:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=88',
    profile:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=88',
    food:'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=88',
    education:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=88',
    skills:'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1600&q=88',
    portfolio:'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1600&q=88',
    gear:'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1600&q=88',
    plan:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=88',
    scripts:'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1600&q=88',
    iphone:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=88',
    night:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=88',
    macro:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=88',
    edit:'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1600&q=88'
  };

  window.contentPackImageFor=function contentPackImageFor(key){
    return images[key]||images.hero;
  };

  window.contentPackPresetImageForScenario=function contentPackPresetImageForScenario(name=''){
    const value=String(name||'');
    if(/야간/.test(value))return window.contentPackImageFor('night');
    if(/카페|음식/.test(value))return window.contentPackImageFor('food');
    if(/인물|프로필/.test(value))return window.contentPackImageFor('profile');
    if(/제품|접사/.test(value))return window.contentPackImageFor('product');
    return window.contentPackImageFor('iphone');
  };

  window.registerContentPack?.({
    id:'photography',
    kind:'career-income-guide',
    routes:['/','/photography/'],
    bootMessage:'사진 수익화 로드맵을 준비하는 중',
    data:{
      cacheKey:'photoRoadmapSiteDataV2',
      apiEndpoint:'/api/site-data?pack=photography'
    },
    sections:[
      {id:'intro',renderer:'introSection'},
      {id:'market',renderer:'marketSection'},
      {id:'education',renderer:'educationSection'},
      {id:'skills',renderer:'skillsSection'},
      {id:'portfolio',renderer:'portfolioSection'},
      {id:'gear',renderer:'gearSection'},
      {id:'plan',renderer:'planSection'},
      {id:'scripts',renderer:'scriptsSection'},
      {id:'iphone',renderer:'iphoneSection'},
      {id:'sources',renderer:'sourcesSection'}
    ]
  });
  window.applyContentPackBootMessage?.();
})();
