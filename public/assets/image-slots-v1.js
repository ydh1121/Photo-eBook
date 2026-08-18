/* V1 contextual image slots.
   Paths are reserved before generation. A slot only becomes active after its
   WebP exists and ready=true; otherwise the current production image remains. */
(function(){
  const slots={
    'hero-main':{path:'/assets/images/generated/v1/hero/hero-main.webp',fallbackKey:'hero',ready:true,rev:'b003'},
    'chapter-intro':{path:'/assets/images/generated/v1/chapter/intro.webp',fallbackKey:'intro',ready:false},
    'chapter-market':{path:'/assets/images/generated/v1/chapter/market.webp',fallbackKey:'product',ready:false},
    'chapter-education':{path:'/assets/images/generated/v1/chapter/education.webp',fallbackKey:'education',ready:true,rev:'b003'},
    'chapter-skills':{path:'/assets/images/generated/v1/chapter/skills.webp',fallbackKey:'skills',ready:false},
    'chapter-portfolio':{path:'/assets/images/generated/v1/chapter/portfolio.webp',fallbackKey:'portfolio',ready:true,rev:'b003'},
    'chapter-gear':{path:'/assets/images/generated/v1/chapter/gear.webp',fallbackKey:'gear',ready:false},
    'chapter-plan':{path:'/assets/images/generated/v1/chapter/plan.webp',fallbackKey:'plan',ready:false},
    'chapter-scripts':{path:'/assets/images/generated/v1/chapter/scripts.webp',fallbackKey:'scripts',ready:false},
    'chapter-iphone':{path:'/assets/images/generated/v1/chapter/iphone.webp',fallbackKey:'iphone',ready:false},
    'chapter-sources':{path:'/assets/images/generated/v1/chapter/sources.webp',fallbackKey:'gear',ready:false},

    'market-product-commerce':{path:'/assets/images/generated/v1/market/product-commerce.webp',fallbackKey:'product',ready:true,rev:'b003'},
    'market-corporate-profile':{path:'/assets/images/generated/v1/market/corporate-profile.webp',fallbackKey:'profile',ready:true,rev:'b003'},
    'market-food-space':{path:'/assets/images/generated/v1/market/food-space.webp',fallbackKey:'food',ready:true,rev:'b003'},

    'skill-portrait-retouch':{path:'/assets/images/generated/v1/skills/portrait-retouch.webp',fallbackKey:'edit',ready:true,rev:'b007'},
    'skill-product-retouch':{path:'/assets/images/generated/v1/skills/product-retouch.webp',fallbackKey:'product',ready:true,rev:'b007'},
    'skill-space-correction':{path:'/assets/images/generated/v1/skills/space-correction.webp',fallbackKey:'skills',ready:false},
    'skill-raw-culling':{path:'/assets/images/generated/v1/skills/raw-culling.webp',fallbackKey:'portfolio',ready:false},
    'skill-batch-basic-edit':{path:'/assets/images/generated/v1/skills/batch-basic-edit.webp',fallbackKey:'edit',ready:false},
    'skill-tether-shooting':{path:'/assets/images/generated/v1/skills/tether-shooting.webp',fallbackKey:'skills',ready:false},
    'skill-portfolio-building':{path:'/assets/images/generated/v1/skills/portfolio-building.webp',fallbackKey:'portfolio',ready:false},
    'skill-delivery-process':{path:'/assets/images/generated/v1/skills/delivery-process.webp',fallbackKey:'portfolio',ready:false},

    'portfolio-product-brand':{path:'/assets/images/generated/v1/portfolio/product-brand.webp',fallbackKey:'product',ready:true,rev:'b007'},
    'portfolio-professional-profile':{path:'/assets/images/generated/v1/portfolio/professional-profile.webp',fallbackKey:'profile',ready:true,rev:'b007'},
    'portfolio-food-store':{path:'/assets/images/generated/v1/portfolio/food-store.webp',fallbackKey:'food',ready:true,rev:'b007'},
    'portfolio-studio-process':{path:'/assets/images/generated/v1/portfolio/studio-process.webp',fallbackKey:'portfolio',ready:true,rev:'b007'},

    'gear-product-sony-a7-iii':{path:'/assets/images/generated/v1/gear/sony-a7-iii.webp',ready:false},
    'gear-product-tamron-28-75-g2':{path:'/assets/images/generated/v1/gear/tamron-28-75-g2.webp',ready:false},
    'gear-product-sony-fe-85-f18':{path:'/assets/images/generated/v1/gear/sony-fe-85-f18.webp',ready:false},

    'iphone-lesson-setup':{path:'/assets/images/generated/v1/iphone/lessons/setup.webp',fallbackKey:'studio',ready:false},
    'iphone-lesson-focus':{path:'/assets/images/generated/v1/iphone/lessons/focus.webp',fallbackKey:'iphone',ready:false},
    'iphone-lesson-lens':{path:'/assets/images/generated/v1/iphone/lessons/lens.webp',fallbackKey:'profile',ready:false},
    'iphone-lesson-portrait':{path:'/assets/images/generated/v1/iphone/lessons/portrait.webp',fallbackKey:'profile',ready:false},
    'iphone-lesson-product':{path:'/assets/images/generated/v1/iphone/lessons/product.webp',fallbackKey:'product',ready:false},
    'iphone-lesson-night':{path:'/assets/images/generated/v1/iphone/lessons/night.webp',fallbackKey:'night',ready:false},
    'iphone-lesson-macro':{path:'/assets/images/generated/v1/iphone/lessons/macro.webp',fallbackKey:'macro',ready:false},
    'iphone-lesson-edit':{path:'/assets/images/generated/v1/iphone/lessons/edit.webp',fallbackKey:'edit',ready:false},

    'iphone-preset-day-outdoor':{path:'/assets/images/generated/v1/iphone/presets/day-outdoor.webp',fallbackKey:'iphone',ready:false},
    'iphone-preset-window-portrait':{path:'/assets/images/generated/v1/iphone/presets/window-portrait.webp',fallbackKey:'profile',ready:false},
    'iphone-preset-cafe-food':{path:'/assets/images/generated/v1/iphone/presets/cafe-food.webp',fallbackKey:'food',ready:false},
    'iphone-preset-small-product':{path:'/assets/images/generated/v1/iphone/presets/small-product.webp',fallbackKey:'product',ready:false},
    'iphone-preset-night-street':{path:'/assets/images/generated/v1/iphone/presets/night-street.webp',fallbackKey:'night',ready:false},
    'iphone-preset-macro':{path:'/assets/images/generated/v1/iphone/presets/macro.webp',fallbackKey:'product',ready:false},
    'iphone-preset-golden-hour':{path:'/assets/images/generated/v1/iphone/presets/golden-hour.webp',fallbackKey:'profile',ready:false},

    'fallback-curated-article':{path:'/assets/images/generated/v1/fallback/curated-article.webp',fallbackKey:'portfolio',ready:false},
    'fallback-video-general':{path:'/assets/images/generated/v1/fallback/video-general.webp',fallbackKey:'skills',ready:false}
  };

  function runtimePath(slot){
    if(!slot?.path)return '';
    return slot.rev?`${slot.path}?v=${encodeURIComponent(slot.rev)}`:slot.path;
  }

  window.__PHOTO_IMAGE_SLOTS_V1=slots;
  window.photoImageSlot=function(slotId,options={}){
    const slot=slots[slotId];
    if(slot?.ready&&slot.path)return runtimePath(slot);
    if(options.fallbackUrl)return options.fallbackUrl;
    const key=options.fallbackKey||slot?.fallbackKey;
    if(key&&typeof window.imageFor==='function')return window.imageFor(key);
    return options.fallback||'';
  };
  window.photoImageSlotPath=function(slotId){
    const slot=slots[slotId];
    return slot?.ready?runtimePath(slot):'';
  };
})();
