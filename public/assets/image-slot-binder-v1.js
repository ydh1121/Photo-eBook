/* V1 semantic image-slot binder.
   v3 keeps binding through async/re-rendered content and always uses the
   slot runtime URL (including the slot cache revision) for ready assets. */
(function(){
  if(window.__photoImageSlotBinderV1Installed)return;
  window.__photoImageSlotBinderV1Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let bindRaf=0;

  function slotReady(id){
    const slot=window.__PHOTO_IMAGE_SLOTS_V1?.[id];
    return Boolean(slot?.ready&&slot.path);
  }

  function slotUrl(id){
    const slot=window.__PHOTO_IMAGE_SLOTS_V1?.[id];
    if(!slot?.ready||!slot.path)return '';
    if(typeof window.photoImageSlotPath==='function'){
      const runtime=window.photoImageSlotPath(id);
      if(runtime)return runtime;
    }
    return slot.rev?`${slot.path}?v=${encodeURIComponent(slot.rev)}`:slot.path;
  }

  function sameAsset(img,next){
    if(!img||!next)return false;
    const raw=img.getAttribute('src')||'';
    if(raw===next)return true;
    try{
      return new URL(img.src,location.href).href===new URL(next,location.href).href;
    }catch{return false;}
  }

  function apply(img,slotId){
    if(!img||!slotReady(slotId))return false;
    const next=slotUrl(slotId);
    if(!next||sameAsset(img,next))return false;

    const previous=(img.dataset.photoImageFallback||img.getAttribute('src')||'').trim();
    img.dataset.photoImageSlot=slotId;
    if(previous)img.dataset.photoImageFallback=previous;
    img.dataset.photoImageTarget=next;

    if(!img.dataset.photoImageErrorBound){
      img.dataset.photoImageErrorBound='1';
      img.addEventListener('error',()=>{
        const target=img.dataset.photoImageTarget||'';
        const fallback=img.dataset.photoImageFallback||'';
        if(target&&img.getAttribute('src')===target&&fallback&&!sameAsset(img,fallback)){
          img.setAttribute('src',fallback);
        }
      });
    }

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
    if(!app||app.hidden||!app.childElementCount)return 0;
    let applied=0;
    applied+=apply($('.hero__image',app),'hero-main')?1:0;

    const before=$$('[data-photo-image-slot]',app).length;
    chapterHeroes(app);
    market(app);
    skills(app);
    portfolio(app);
    gear(app);
    iphoneLessons(app);
    iphonePresets(app);
    const after=$$('[data-photo-image-slot]',app).length;
    applied+=Math.max(0,after-before);
    return applied;
  }

  function scheduleBind(){
    if(bindRaf)return;
    bindRaf=requestAnimationFrame(()=>{
      bindRaf=0;
      bindAll();
    });
  }

  function start(){
    const app=$('#app');
    if(!app)return;

    const observer=new MutationObserver(scheduleBind);
    observer.observe(app,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['hidden','src']
    });

    scheduleBind();
    [80,220,600,1200,2400,4200,7000].forEach(ms=>setTimeout(scheduleBind,ms));
    addEventListener('load',scheduleBind,{once:true});
    addEventListener('pageshow',()=>setTimeout(scheduleBind,80),{passive:true});

    const stopTimer=setTimeout(()=>observer.disconnect(),10000);
    window.__photoImageRebindV1=()=>{
      clearTimeout(stopTimer);
      scheduleBind();
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();