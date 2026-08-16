/* V1 semantic image-slot binder.
   This layer does not render or generate images. It maps the already-rendered
   production DOM to reserved contextual WebP slots. A slot is applied only
   when image-slots-v1.js marks it ready=true. Until then the existing image
   src remains untouched. */
(function(){
  if(window.__photoImageSlotBinderV1Installed)return;
  window.__photoImageSlotBinderV1Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function slotReady(id){
    const slot=window.__PHOTO_IMAGE_SLOTS_V1?.[id];
    return Boolean(slot?.ready&&slot.path);
  }

  function apply(img,slotId){
    if(!img||!slotReady(slotId))return false;
    const next=window.__PHOTO_IMAGE_SLOTS_V1[slotId].path;
    if(!next||img.src.endsWith(next))return false;
    const previous=img.getAttribute('src')||'';
    img.dataset.photoImageSlot=slotId;
    img.dataset.photoImageFallback=previous;
    img.addEventListener('error',function restore(){
      const fallback=img.dataset.photoImageFallback||'';
      if(fallback&&img.getAttribute('src')!==fallback)img.setAttribute('src',fallback);
    },{once:true});
    img.setAttribute('src',next);
    return true;
  }

  function chapterHeroes(root=document){
    const ids=['intro','market','education','skills','portfolio','gear','plan','scripts','iphone','sources'];
    ids.forEach(id=>apply($(`#${id} .chapter-hero__card img`,root),`chapter-${id}`));
  }

  function market(root=document){
    const cards=$$('#market .market-card',root);
    const ids=['market-product-commerce','market-corporate-profile','market-food-space'];
    cards.forEach((card,index)=>apply($('.market-card__image img',card),ids[index]));
  }

  const SKILL_SLOTS={
    '인물 리터칭':'skill-portrait-retouch',
    '제품 리터칭':'skill-product-retouch',
    '공간 보정':'skill-space-correction',
    'RAW 셀렉':'skill-raw-culling',
    '대량 기본보정':'skill-batch-basic-edit',
    '테더 촬영':'skill-tether-shooting',
    '포트폴리오':'skill-portfolio-building',
    '납품 프로세스':'skill-delivery-process'
  };

  function skills(root=document){
    $$('#skills .skill-card--media',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=SKILL_SLOTS[title];
      if(slot)apply($('.skill-card__visual img',card),slot);
    });
  }

  const PORTFOLIO_SLOTS={
    '가상 향수 / 뷰티 브랜드':'portfolio-product-brand',
    '대표 / CEO 프로필':'portfolio-professional-profile',
    '레스토랑 대표메뉴':'portfolio-food-store',
    '제품 촬영 작업환경':'portfolio-studio-process'
  };

  function portfolio(root=document){
    $$('#portfolio .case-card',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=PORTFOLIO_SLOTS[title];
      if(slot)apply($('.case-card__image img',card),slot);
    });
  }

  const GEAR_SLOTS={
    'Sony A7 III':'gear-product-sony-a7-iii',
    'Tamron 28-75mm F2.8 G2':'gear-product-tamron-28-75-g2',
    'Sony FE 85mm F1.8':'gear-product-sony-fe-85-f18'
  };

  function gear(root=document){
    $$('#gear .product-card',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=GEAR_SLOTS[title];
      if(slot)apply($('.product-card__image img',card),slot);
    });
  }

  const LESSON_SLOTS={
    '찍기 전 5분':'iphone-lesson-setup',
    '초점과 노출':'iphone-lesson-focus',
    '0.5x, 1x, 2x':'iphone-lesson-lens',
    '첫 프로필':'iphone-lesson-portrait',
    '제품 / 음식 첫 세팅':'iphone-lesson-product',
    '야간 거리':'iphone-lesson-night',
    '접사와 작은 물체':'iphone-lesson-macro',
    '사진 앱 60초 보정':'iphone-lesson-edit'
  };

  function iphoneLessons(root=document){
    $$('#iphone .lesson-preview',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=LESSON_SLOTS[title];
      if(slot)apply($('.lesson-preview__image img',card),slot);
    });
    $$('#iphone .lesson',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=LESSON_SLOTS[title];
      if(slot)apply($('.lesson__visual img',card),slot);
    });
  }

  const PRESET_SLOTS={
    '낮 야외 스냅':'iphone-preset-day-outdoor',
    '창가 프로필':'iphone-preset-window-portrait',
    '카페 음식':'iphone-preset-cafe-food',
    '소형 제품':'iphone-preset-small-product',
    '야간 거리':'iphone-preset-night-street',
    '접사':'iphone-preset-macro',
    '골든아워 인물':'iphone-preset-golden-hour'
  };

  function iphonePresets(root=document){
    $$('#iphone .preset-card',root).forEach(card=>{
      const title=$('h3',card)?.textContent?.trim()||'';
      const slot=PRESET_SLOTS[title];
      if(slot)apply($('.preset-card__image img',card),slot);
    });
  }

  function bindAll(){
    const app=$('#app');
    if(!app||app.hidden||!app.childElementCount)return false;
    apply($('.hero__image',app),'hero-main');
    chapterHeroes(app);
    market(app);
    skills(app);
    portfolio(app);
    gear(app);
    iphoneLessons(app);
    iphonePresets(app);
    return true;
  }

  function start(){
    const app=$('#app');
    if(!app)return;
    if(bindAll())return;
    const observer=new MutationObserver(()=>{
      if(bindAll())observer.disconnect();
    });
    observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    setTimeout(()=>observer.disconnect(),5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('pageshow',()=>setTimeout(bindAll,120),{passive:true});
})();
