/* v25: contextual images, richer process cards, Korean video discovery and continuous rails. */
(function(){
  const generated=()=>window.__PHOTO_GENERATED_IMAGES||{};
  const baseImageFor=window.imageFor;
  const baseGuideModule=window.guideModule;
  const baseRenderCuratedItems=window.renderCuratedItems;
  const VIDEO_FAVORITES_KEY='photoRoadmapVideoFavoritesV1';
  let videoCursor=0;
  let videoLoading=false;
  const seenVideos=new Set();

  function generatedImage(name,fallbackKey){
    return generated()[name] || (typeof baseImageFor==='function' ? baseImageFor(fallbackKey) : '');
  }

  window.imageFor=function(key){
    const g=generated();
    const mapped={
      product:g.product_studio,
      skills:g.retouch_workstation,
      edit:g.retouch_workstation,
      retouch:g.retouch_workstation,
      portfolio:g.client_review,
      client:g.client_review
    };
    if(mapped[key]) return mapped[key];
    if(key==='lens') return 'https://images.unsplash.com/photo-1606986628253-487d6d7197e7?auto=format&fit=crop&w=1600&q=90';
    if(key==='portrait') return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=90';
    if(key==='food-detail') return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1600&q=90';
    return typeof baseImageFor==='function' ? baseImageFor(key) : '';
  };

  function processLabel(type,index){
    return type==='ranking' ? `우선순위 ${index+1}` : `STEP ${String(index+1).padStart(2,'0')}`;
  }

  if(typeof baseGuideModule==='function'){
    window.guideModule=function(row){
      const type=row?.['타입']||'prose';
      if(type!=='flow'&&type!=='ranking') return baseGuideModule(row);
      const title=esc(row?.['제목']||'');
      const body=pipe(row?.['본문']||'');
      const key=row?.['강조']||'';
      const helper=row?.['보조']||'';
      return `<article class="guide-block guide-block--process">
        <h3>${title}</h3>
        <div class="group-card flow-card flow-card--refined">
          <div class="flow-list flow-list--refined">${body.map((item,i)=>`<div class="flow-row flow-row--refined">
            <div class="flow-step"><span>${String(i+1).padStart(2,'0')}</span></div>
            <div class="flow-row__copy"><small>${processLabel(type,i)}</small><strong>${esc(item)}</strong></div>
          </div>`).join('')}</div>
        </div>
        ${helper?`<div class="micro flow-helper">${esc(helper)}</div>`:''}
        ${type==='ranking'&&key?calloutHtml('선택 기준',key,helper,'dark'):''}
      </article>`;
    };
  }

  function skillImage(row,index){
    const text=`${row?.['영역']||''} ${row?.['필수 기술']||''}`;
    if(/제품|누끼|스크래치|패키지/.test(text)) return generatedImage('product_studio','product');
    if(/인물|피부|Dodge|Burn|Liquify|리터칭|보정/.test(text)) return generatedImage('retouch_workstation','edit');
    if(/납품|고객|포트폴리오|셀렉|검수/.test(text)) return generatedImage('client_review','portfolio');
    return [generatedImage('retouch_workstation','skills'),generatedImage('product_studio','product'),generatedImage('client_review','portfolio')][index%3];
  }

  function skillQuery(row){
    const text=`${row?.['영역']||''} ${row?.['필수 기술']||''}`;
    if(/제품|누끼|스크래치|패키지/.test(text)) return '권학봉 제품사진 조명';
    if(/인물|피부|Dodge|Burn|Liquify/.test(text)) return '권학봉 인물사진 리터칭';
    if(/라이트룸|색보정|컬러/.test(text)) return '권학봉 라이트룸 사진 보정';
    if(/납품|포트폴리오|고객/.test(text)) return '상업사진 포트폴리오 납품';
    return '상업사진 포토샵 리터칭';
  }

  window.skillsSection=function(data,n,index){
    const cards=(data.skills||[]).map((row,i)=>`<article class="skill-card skill-card--media" data-skill-query="${attr(skillQuery(row))}">
      <div class="skill-card__visual"><img src="${attr(skillImage(row,i))}" alt="${attr(row['영역'])} 작업 예시" loading="lazy"></div>
      <div class="skill-card__body">
        <div class="skill-card__topline"><span>${String(i+1).padStart(2,'0')}</span><small>실무 작업</small></div>
        <h3>${esc(row['영역'])}</h3>
        <p>${esc(row['필수 기술'])}</p>
        <div class="skill-card__tags"><span class="soft-tag">${esc(row['목표 속도'])}</span><span class="soft-tag">${esc(row['실전 산출물'])}</span></div>
        <div class="skill-card__video-slot" aria-live="polite"><span class="video-slot-loading">관련 영상을 찾는 중</span></div>
      </div>
    </article>`).join('');

    return `<section id="skills" class="chapter" data-chapter="skills">
      ${chapterHero(n,index,'skills')}
      <div class="section grouped"><div class="wide">
        <div class="content section-heading"><div class="eyebrow">실무 기술</div><h2>상업사진은 ‘잘 찍기’와 ‘빨리 납품하기’를 같이 연습해야 합니다.</h2><p>작업 예시와 관련 영상을 함께 보면서 결과물의 기준과 실제 작업 흐름을 익혀보세요.</p></div>
        <div class="scroll-row skills-infinite-row" id="skillsInfiniteRow">${cards}<div class="skills-more-sentinel" aria-hidden="true"></div></div>
        <div class="content skills-more-note">옆으로 넘기면 관련 실무 영상이 계속 이어집니다.</div>
        <div class="content" style="margin-top:2.6rem">${renderGuide(data,'SKILLS')}</div>
      </div></div>
    </section>`;
  };

  window.portfolioImage=function(key){
    if(key==='product') return generatedImage('product_studio','product');
    if(key==='profile') return window.imageFor('portrait');
    if(key==='food') return window.imageFor('food');
    return generatedImage('client_review','portfolio');
  };

  window.lessonImage=function(row){
    if(row.lesson_id==='portrait') return window.imageFor('portrait');
    if(row.lesson_id==='product') return generatedImage('product_studio','product');
    if(row.lesson_id==='night') return window.imageFor('night');
    if(row.lesson_id==='macro') return window.imageFor('macro');
    if(row.lesson_id==='edit') return generatedImage('retouch_workstation','edit');
    if(row.lesson_id==='lens') return window.imageFor('lens');
    if(row.lesson_id==='focus') return window.imageFor('iphone');
    return window.imageFor(row.image_key||'iphone');
  };

  function readVideoFavorites(){
    try{
      const value=JSON.parse(localStorage.getItem(VIDEO_FAVORITES_KEY)||'[]');
      return new Set(Array.isArray(value)?value:[]);
    }catch{return new Set();}
  }

  function writeVideoFavorites(set){
    try{localStorage.setItem(VIDEO_FAVORITES_KEY,JSON.stringify([...set]));}catch{}
  }

  function bookmarkSvg(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v15.6l-5-3.1-5 3.1V4.8Z"/></svg>';
  }

  function videoCard(item,{mini=false}={}){
    const id=String(item?.id||'');
    const favorite=readVideoFavorites().has(id);
    const image=item?.thumbnail || generatedImage('retouch_workstation','skills');
    const meta=[item?.channel,item?.views,item?.duration].filter(Boolean);
    return `<article class="skill-video-card ${mini?'skill-video-card--mini':''}" data-video-id="${attr(id)}">
      <a class="skill-video-card__visual" href="${attr(item?.url||'#')}" target="_blank" rel="noopener">
        <img src="${attr(image)}" alt="${attr(item?.title||'관련 영상')}" loading="lazy" onerror="this.src='${attr(generatedImage('retouch_workstation','skills'))}'">
        <span class="skill-video-card__play" aria-hidden="true">▶</span>
        ${item?.duration?`<span class="skill-video-card__duration">${esc(item.duration)}</span>`:''}
      </a>
      <div class="skill-video-card__copy">
        <div class="skill-video-card__source">${esc(meta.join(' / ')||'YouTube')}</div>
        <a href="${attr(item?.url||'#')}" target="_blank" rel="noopener"><strong>${esc(item?.title||'관련 영상 더 보기')}</strong></a>
      </div>
      <button class="skill-video-bookmark ${favorite?'is-favorite':''}" type="button" aria-label="영상 즐겨찾기" aria-pressed="${favorite?'true':'false'}">${bookmarkSvg()}</button>
    </article>`;
  }

  async function requestVideos(params=''){
    const response=await fetch(`/api/videos${params}`,{cache:'no-store'});
    const json=await response.json();
    if(!response.ok||!json?.ok) throw new Error(json?.message||'영상을 불러오지 못했습니다.');
    return json;
  }

  async function fillSkillSlots(){
    const slots=[...document.querySelectorAll('.skill-card--media[data-skill-query]')];
    await Promise.all(slots.map(async card=>{
      const slot=card.querySelector('.skill-card__video-slot');
      if(!slot||slot.dataset.loaded==='true') return;
      slot.dataset.loaded='true';
      try{
        const json=await requestVideos(`?q=${encodeURIComponent(card.dataset.skillQuery||'상업사진 실무')}`);
        const item=(json.items||[]).find(v=>v?.id);
        if(item){
          seenVideos.add(String(item.id));
          slot.innerHTML=videoCard(item,{mini:true});
        }else slot.innerHTML='<span class="video-slot-empty">관련 영상은 새로 확인해 주세요.</span>';
      }catch{
        slot.innerHTML='<span class="video-slot-empty">관련 영상은 새로 확인해 주세요.</span>';
      }
    }));
  }

  async function appendVideoBatch(){
    const row=document.querySelector('#skillsInfiniteRow');
    if(!row||videoLoading) return;
    videoLoading=true;
    const sentinel=row.querySelector('.skills-more-sentinel');
    sentinel?.classList.add('is-loading');
    try{
      const json=await requestVideos(`?cursor=${videoCursor}`);
      videoCursor=Number(json.nextCursor)||videoCursor+1;
      const fresh=(json.items||[]).filter(item=>{
        const id=String(item?.id||'');
        if(!id||seenVideos.has(id)) return false;
        seenVideos.add(id);
        return true;
      });
      if(fresh.length){
        sentinel?.insertAdjacentHTML('beforebegin',fresh.map(item=>videoCard(item)).join(''));
      }
    }catch{}
    finally{
      sentinel?.classList.remove('is-loading');
      videoLoading=false;
    }
  }

  function bindVideoFavorites(root=document){
    if(root.documentElement?.dataset.videoFavoriteDelegated==='true') return;
    if(root.documentElement) root.documentElement.dataset.videoFavoriteDelegated='true';
    document.addEventListener('click',event=>{
      const button=event.target.closest('.skill-video-bookmark');
      if(!button) return;
      event.preventDefault();
      event.stopPropagation();
      const card=button.closest('[data-video-id]');
      const id=String(card?.dataset.videoId||'');
      if(!id) return;
      const set=readVideoFavorites();
      if(set.has(id)) set.delete(id); else set.add(id);
      writeVideoFavorites(set);
      document.querySelectorAll(`[data-video-id="${CSS.escape(id)}"] .skill-video-bookmark`).forEach(mark=>{
        const active=set.has(id);
        mark.classList.toggle('is-favorite',active);
        mark.setAttribute('aria-pressed',active?'true':'false');
      });
    });
  }

  function setupSkillInfiniteRail(){
    const row=document.querySelector('#skillsInfiniteRow');
    if(!row||row.dataset.infiniteBound==='true') return;
    row.dataset.infiniteBound='true';
    let raf=0;
    const check=()=>{
      raf=0;
      const remaining=row.scrollWidth-row.clientWidth-row.scrollLeft;
      if(remaining<Math.max(680,row.clientWidth*1.4)) appendVideoBatch();
    };
    row.addEventListener('scroll',()=>{
      if(raf) return;
      raf=requestAnimationFrame(check);
    },{passive:true});
    appendVideoBatch();
  }

  function bindCloneBookmark(button){
    if(button.dataset.loopBound==='true') return;
    button.dataset.loopBound='true';
    button.addEventListener('click',()=>{
      const card=button.closest('.curated-card');
      const id=String(card?.dataset.curatedId||'');
      if(!id||typeof curatedFavorites!=='function') return;
      const set=curatedFavorites();
      if(set.has(id)) set.delete(id); else set.add(id);
      if(typeof writeCuratedFavorites==='function') writeCuratedFavorites(set);
      document.querySelectorAll(`.curated-card[data-curated-id="${CSS.escape(id)}"]`).forEach(same=>{
        const active=set.has(id);
        same.dataset.favorite=active?'true':'false';
        const mark=same.querySelector('.curated-bookmark');
        mark?.classList.toggle('is-favorite',active);
        mark?.setAttribute('aria-pressed',active?'true':'false');
      });
      if(typeof renderCuratedFavoritesList==='function') renderCuratedFavoritesList();
    });
  }

  function appendCuratedLoopBatch(row){
    if(!row||row.dataset.loopAppending==='true') return;
    const originals=[...row.querySelectorAll('.curated-card:not([data-loop-clone])')];
    if(!originals.length) return;
    row.dataset.loopAppending='true';
    const fragment=document.createDocumentFragment();
    originals.slice(0,Math.min(8,originals.length)).forEach(original=>{
      const clone=original.cloneNode(true);
      clone.dataset.loopClone='true';
      clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      clone.querySelectorAll('.curated-bookmark').forEach(bindCloneBookmark);
      fragment.appendChild(clone);
    });
    row.appendChild(fragment);
    row.dataset.loopAppending='false';
  }

  function installCuratedEndless(){
    const row=document.querySelector('#curatedLinksRow');
    if(!row||!row.querySelector('.curated-card')) return;
    row.querySelectorAll('[data-loop-clone]').forEach(node=>node.remove());
    appendCuratedLoopBatch(row);
    if(row.dataset.endlessBound==='true') return;
    row.dataset.endlessBound='true';
    let raf=0;
    row.addEventListener('scroll',()=>{
      if(raf) return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        if(row.scrollWidth-row.clientWidth-row.scrollLeft<Math.max(700,row.clientWidth*1.5)){
          appendCuratedLoopBatch(row);
        }
      });
    },{passive:true});
  }

  if(typeof baseRenderCuratedItems==='function'){
    window.renderCuratedItems=function(items){
      const result=baseRenderCuratedItems(items);
      requestAnimationFrame(installCuratedEndless);
      setTimeout(()=>{
        const status=document.querySelector('#curatedStatus');
        if(status) status.textContent=`촬영 팁 ${(items||[]).length}개`;
      },0);
      return result;
    };
  }

  function initEnhancements(){
    bindVideoFavorites();
    fillSkillSlots();
    setupSkillInfiniteRail();
    installCuratedEndless();
  }

  const originalRenderApp=window.renderApp;
  if(typeof originalRenderApp==='function'){
    window.renderApp=function(data){
      const result=originalRenderApp(data);
      requestAnimationFrame(initEnhancements);
      return result;
    };
  }
})();
