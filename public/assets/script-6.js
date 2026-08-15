const CURATED_FAVORITES_KEY='photoRoadmapCuratedFavoritesV1';
let curatedItemsCache=[];
let curatedRefreshRetries=0;
let curatedReloadTimer=0;

/*
  Safari stability pass.
  - no fixed/relative switching
  - no transforms on the sticky element
  - no backdrop-filter on the sticky capsule
  - no scroll-direction geometry changes
  Only a pseudo-element progress fill is transformed, so document geometry stays fixed.
*/
function setupNavigation(){
  const shell=$('.nav-shell');
  const placeholder=$('.nav-placeholder');
  const navScroll=$('.nav-scroll');
  const progress=$('.read-progress');
  const chips=$$('.nav-chip');
  const sections=$$('.chapter[data-chapter]');
  if(!shell||!navScroll||!chips.length)return;

  if(placeholder)placeholder.remove();

  let glass=$('.nav-glass',shell);
  if(!glass){
    glass=document.createElement('div');
    glass.className='nav-glass';
    shell.insertBefore(glass,navScroll);
    glass.appendChild(navScroll);
    if(progress)glass.appendChild(progress);
  }

  const chipMap=new Map(chips.map(chip=>[chip.dataset.target,chip]));
  let active='';
  let clickLockUntil=0;
  let raf=0;
  let compact=false;

  function centerChip(chip){
    if(!chip)return;
    const left=Math.max(0,chip.offsetLeft-(navScroll.clientWidth-chip.offsetWidth)/2);
    if(Math.abs(navScroll.scrollLeft-left)>8)navScroll.scrollTo({left,behavior:'auto'});
  }

  function setActive(id,center=true){
    if(!id)return;
    const changed=id!==active;
    if(changed){
      active=id;
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
    }
    if(center&&changed)centerChip(chipMap.get(id));
  }

  function updateScrollState(){
    raf=0;
    const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const ratio=Math.min(1,Math.max(0,y/max));
    glass.style.setProperty('--reading-progress',String(ratio));

    if(!compact&&y>76){
      compact=true;
      shell.classList.add('is-compact');
    }else if(compact&&y<34){
      compact=false;
      shell.classList.remove('is-compact');
    }
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(updateScrollState);
  }

  const observer=new IntersectionObserver(entries=>{
    if(Date.now()<clickLockUntil)return;
    const visible=entries.filter(entry=>entry.isIntersecting);
    if(!visible.length)return;
    visible.sort((a,b)=>Math.abs(a.boundingClientRect.top-92)-Math.abs(b.boundingClientRect.top-92));
    setActive(visible[0].target.dataset.chapter,true);
  },{root:null,rootMargin:'-88px 0px -66% 0px',threshold:[0,.01,.15]});
  sections.forEach(section=>observer.observe(section));

  chips.forEach(chip=>chip.addEventListener('click',()=>{
    const target=document.getElementById(chip.dataset.target);
    if(!target)return;
    clickLockUntil=Date.now()+780;
    setActive(chip.dataset.target,true);
    const top=target.getBoundingClientRect().top+window.scrollY-shell.offsetHeight-8;
    window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});
  }));

  let initial=sections[0];
  const line=shell.offsetHeight+16;
  for(const section of sections){
    const rect=section.getBoundingClientRect();
    if(rect.top<=line&&rect.bottom>line){initial=section;break;}
    if(rect.top<=line)initial=section;
  }
  if(initial)setActive(initial.dataset.chapter,false);
  updateScrollState();
  addEventListener('scroll',schedule,{passive:true});
}

function sourcesSection(data,n,index){
  const cards=(data.sources||[]).map(r=>`<article class="source-card">
    <div class="source-card__topic">${esc(r['주제'])}</div>
    <h3>${esc(r['출처/서비스'])}</h3>
    <p>${esc(r['메모'])}</p>
    <a href="${attr(r['URL'])}" target="_blank" rel="noopener">확인하기 ↗</a>
  </article>`).join('');

  return `<section id="sources" class="chapter" data-chapter="sources">
    ${chapterHero(n,index,'gear')}
    <div class="section grouped"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">사진 관련 자료</div><h2>필요할 때 바로 꺼내 읽을 자료를 모았습니다.</h2><p>촬영 팁은 외부 글을 함께 보고, 교육과 장비 정보는 공식 자료로 다시 확인할 수 있게 구성했습니다.</p></div>

      <div class="content curated-head">
        <div><h3>더 읽어볼 촬영 팁</h3><p>브런치와 티스토리 글을 계속 추가할 수 있습니다. 링크의 대표 이미지와 설명은 원문 SEO 정보를 기준으로 갱신합니다.</p></div>
        <div class="curated-tools">
          <button class="curated-tool" id="curatedFavoritesOpen" type="button">즐겨찾기 <span class="curated-tool__count" id="curatedFavoriteCount">0</span></button>
          <button class="curated-tool" id="curatedRefresh" type="button">링크 새로고침</button>
        </div>
      </div>

      <div class="content curated-favorites-panel" id="curatedFavoritesPanel" hidden>
        <div class="curated-favorites-panel__top"><strong>즐겨찾기 목록</strong><button class="curated-favorites-close" id="curatedFavoritesClose" type="button">닫기</button></div>
        <div class="curated-favorites-list" id="curatedFavoritesList"></div>
      </div>

      <div class="scroll-row curated-links-row" id="curatedLinksRow" aria-live="polite">
        <div class="curated-skeleton"></div><div class="curated-skeleton"></div>
      </div>
      <div class="content curated-status" id="curatedStatus"></div>

      <div class="content source-subheading"><h3>공식 확인 링크</h3></div>
      <div class="scroll-row">${cards}</div>
    </div></div>
  </section>`;
}

function curatedFavorites(){
  try{
    const value=JSON.parse(localStorage.getItem(CURATED_FAVORITES_KEY)||'[]');
    return new Set(Array.isArray(value)?value:[]);
  }catch{return new Set();}
}
function writeCuratedFavorites(set){localStorage.setItem(CURATED_FAVORITES_KEY,JSON.stringify([...set]));}
function curatedBookmarkSvg(){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.8 4.6c0-1 .8-1.8 1.8-1.8h6.8c1 0 1.8.8 1.8 1.8v16l-5.2-3.2-5.2 3.2v-16Z"/></svg>`;}
function curatedTags(value=''){
  return String(value||'').split(/\s*\/\s*|\s*,\s*|\s*\|\s*/).map(x=>x.trim()).filter(Boolean).slice(0,4);
}
function curatedDisplayTitle(item){return item?.og_title||item?.title||'사진 참고 글';}
function curatedDisplayImage(item){return item?.thumbnail_url||imageFor('portfolio');}

function updateFavoriteCount(){
  const count=$('#curatedFavoriteCount');
  if(count)count.textContent=String(curatedFavorites().size);
}

function renderCuratedFavoritesList(){
  const list=$('#curatedFavoritesList');
  if(!list)return;
  const favorites=curatedFavorites();
  const items=curatedItemsCache.filter(item=>favorites.has(String(item.id||'')));
  updateFavoriteCount();

  if(!items.length){
    list.innerHTML='<div class="curated-favorites-empty">아직 저장한 글이 없습니다. 카드 우측 상단의 북마크 버튼으로 추가할 수 있습니다.</div>';
    return;
  }

  list.innerHTML=items.map(item=>`<div class="curated-favorite-row" data-favorite-id="${attr(item.id)}">
    <a href="${attr(item.url)}" target="_blank" rel="noopener"><img src="${attr(curatedDisplayImage(item))}" alt="" loading="lazy" onerror="this.src='${imageFor('portfolio')}'"></a>
    <div class="curated-favorite-row__copy"><small>${esc(item.platform||'외부 글')}</small><a href="${attr(item.url)}" target="_blank" rel="noopener">${esc(curatedDisplayTitle(item))}</a></div>
    <button class="curated-favorite-remove" type="button" aria-label="즐겨찾기에서 삭제">×</button>
  </div>`).join('');

  list.querySelectorAll('.curated-favorite-remove').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.curated-favorite-row');
    const id=String(row?.dataset.favoriteId||'');
    const set=curatedFavorites();
    set.delete(id);
    writeCuratedFavorites(set);
    const card=document.querySelector(`.curated-card[data-curated-id="${CSS.escape(id)}"]`);
    if(card){
      card.dataset.favorite='false';
      const mark=$('.curated-bookmark',card);
      mark?.classList.remove('is-favorite');
      mark?.setAttribute('aria-pressed','false');
    }
    renderCuratedFavoritesList();
  }));
}

function renderCuratedItems(items){
  const row=$('#curatedLinksRow');
  if(!row)return;
  curatedItemsCache=Array.isArray(items)?items:[];
  const favorites=curatedFavorites();

  if(!curatedItemsCache.length){
    row.innerHTML='<div class="curated-skeleton" style="display:grid;place-items:center;padding:1rem;color:#777;background:#fff">표시할 링크가 없습니다.</div>';
    renderCuratedFavoritesList();
    return;
  }

  row.innerHTML=curatedItemsCache.map(item=>{
    const id=String(item.id||'');
    const favorite=favorites.has(id);
    const image=curatedDisplayImage(item);
    const title=curatedDisplayTitle(item);
    const summary=item.og_description||item.summary||'';
    const meta=[item.published_at,item.reaction_text].filter(Boolean);
    const tags=curatedTags(item.tags);
    return `<article class="curated-card" data-curated-id="${attr(id)}" data-favorite="${favorite?'true':'false'}">
      <div class="curated-card__visual">
        <a href="${attr(item.url)}" target="_blank" rel="noopener"><img src="${attr(image)}" alt="${attr(title)}" loading="lazy" onerror="this.src='${imageFor('portfolio')}'"></a>
        <span class="curated-platform">${esc(item.platform||'외부 글')}</span>
        <button class="curated-bookmark ${favorite?'is-favorite':''}" type="button" aria-label="즐겨찾기" aria-pressed="${favorite?'true':'false'}">${curatedBookmarkSvg()}</button>
      </div>
      <div class="curated-card__body">
        <div class="curated-meta"><strong>${esc(item.author||item.platform||'')}</strong>${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
        <a href="${attr(item.url)}" target="_blank" rel="noopener"><h3>${esc(title)}</h3><p>${esc(summary)}</p></a>
        ${tags.length?`<div class="curated-tags">${tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>`:''}
        <a class="curated-open" href="${attr(item.url)}" target="_blank" rel="noopener">바로가기 ↗</a>
      </div>
    </article>`;
  }).join('');

  row.querySelectorAll('.curated-bookmark').forEach(button=>button.addEventListener('click',()=>{
    const card=button.closest('.curated-card');
    const id=String(card?.dataset.curatedId||'');
    if(!id)return;
    const set=curatedFavorites();
    if(set.has(id))set.delete(id);else set.add(id);
    writeCuratedFavorites(set);
    const saved=set.has(id);
    card.dataset.favorite=saved?'true':'false';
    button.classList.toggle('is-favorite',saved);
    button.setAttribute('aria-pressed',saved?'true':'false');
    renderCuratedFavoritesList();
  }));

  renderCuratedFavoritesList();
}

async function loadCuratedLinks({background=false}={}){
  const status=$('#curatedStatus');
  try{
    const response=await fetch('/api/curated',{cache:'no-store'});
    const json=await response.json();
    if(!response.ok||!json?.ok)throw new Error(json?.message||'링크를 불러오지 못했습니다.');
    const items=Array.isArray(json.items)?json.items:[];
    renderCuratedItems(items);
    if(status)status.textContent=`촬영 팁 ${items.length}개${json.pendingRefresh?` / SEO 정보 ${json.pendingRefresh}개 갱신 중`:''}`;

    if(json.pendingRefresh&&curatedRefreshRetries<2){
      curatedRefreshRetries++;
      clearTimeout(curatedReloadTimer);
      curatedReloadTimer=setTimeout(()=>loadCuratedLinks({background:true}),6500);
    }else if(!background){
      curatedRefreshRetries=0;
    }
  }catch(error){
    if(!background){
      const row=$('#curatedLinksRow');
      if(row)row.innerHTML='<div class="curated-skeleton" style="display:grid;place-items:center;padding:1rem;color:#777;background:#fff">외부 글 목록을 불러오지 못했습니다.</div>';
      if(status)status.textContent='시트의 CURATED_LINKS 연결 상태를 확인해 주세요.';
    }
  }
}

function setupCuratedControls(){
  const favoritesOpen=$('#curatedFavoritesOpen');
  const favoritesClose=$('#curatedFavoritesClose');
  const favoritesPanel=$('#curatedFavoritesPanel');
  const refresh=$('#curatedRefresh');
  const row=$('#curatedLinksRow');
  if(!row)return;

  favoritesOpen?.addEventListener('click',()=>{
    const opening=favoritesPanel?.hidden!==false;
    if(favoritesPanel)favoritesPanel.hidden=!opening;
    favoritesOpen.classList.toggle('is-active',opening);
    renderCuratedFavoritesList();
  });
  favoritesClose?.addEventListener('click',()=>{
    if(favoritesPanel)favoritesPanel.hidden=true;
    favoritesOpen?.classList.remove('is-active');
  });

  refresh?.addEventListener('click',async()=>{
    const old=refresh.textContent;
    refresh.disabled=true;
    refresh.textContent='확인 중';
    try{
      const response=await fetch('/api/curated',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refresh'})});
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json?.ok===false)throw new Error(json?.message||'업데이트 실패');
      curatedRefreshRetries=0;
      await loadCuratedLinks();
      refresh.textContent='업데이트됨';
      setTimeout(()=>refresh.textContent=old,1100);
    }catch{
      refresh.textContent='다시 시도';
      setTimeout(()=>refresh.textContent=old,1400);
    }finally{refresh.disabled=false;}
  });
}

function normalizeMiddleDots(root){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    const parent=node.parentElement;
    if(!parent||/^(SCRIPT|STYLE|TEXTAREA)$/.test(parent.tagName))continue;
    if(/[·•]/.test(node.nodeValue||''))node.nodeValue=node.nodeValue.replace(/\s*[·•]\s*/g,' / ');
  }
}

const polishObserver=new MutationObserver(()=>{
  const app=$('#app');
  if(!app||app.hidden||!$('#curatedLinksRow'))return;
  polishObserver.disconnect();
  normalizeMiddleDots(app);
  setupCuratedControls();
  loadCuratedLinks();
});
const polishTarget=$('#app');
if(polishTarget)polishObserver.observe(polishTarget,{childList:true,subtree:true});
