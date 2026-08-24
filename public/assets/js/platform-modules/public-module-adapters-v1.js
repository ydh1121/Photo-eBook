(function(){
  const modules=window.PlatformModuleRegistry;
  if(!modules||window.__platformPublicModuleAdaptersV2)return;
  window.__platformPublicModuleAdaptersV2=true;

  const legacyNav=typeof window.nav==='function'?window.nav:null;
  const legacyMarketSection=typeof window.marketSection==='function'?window.marketSection:null;

  window.nav=function canonicalPublicNavigation(data){
    try{return modules.render('top-chapter-navigation',{items:data?.nav||[]},{consumer:'public'});}
    catch(error){if(legacyNav)return legacyNav(data);throw error;}
  };

  window.marketSection=function canonicalPublicMarketSection(data,n,index){
    try{
      const photos=[imageFor('product'),imageFor('profile'),imageFor('food')];
      const items=(data?.market||[]).map((row,i)=>({...row,image:photos[i]||imageFor('product')}));
      const rail=modules.render('horizontal-card-rail',{items},{consumer:'public'});
      return `<section id="market" class="chapter" data-chapter="market">
        ${chapterHero(n,index,'product')}
        <div class="section grouped"><div class="wide">
          <div class="content section-heading"><div class="eyebrow">시장 선택</div><h2>처음에는 세 분야만 비교해도 충분합니다.</h2><p>단가만 보지 말고, 같은 고객이 다시 주문할 이유가 있는지와 한 번의 촬영을 여러 납품물로 묶을 수 있는지를 같이 보세요.</p></div>
          ${rail}
          <div class="content" style="margin-top:2.55rem">${renderGuide(data,'MARKET')}</div>
        </div></div>
      </section>`;
    }catch(error){if(legacyMarketSection)return legacyMarketSection(data,n,index);throw error;}
  };
})();
