const CURATED_FAVORITES_KEY='photoRoadmapCuratedFavoritesV1';

/* Later script wins over the legacy navigator. The new version never changes
   document flow height while scrolling, which removes the iOS jitter. */
function setupNavigation(){
  const shell=$('.nav-shell');
  const placeholder=$('.nav-placeholder');
  const navScroll=$('.nav-scroll');
  const progress=$('.read-progress');
  const bar=$('.read-progress__bar');
  const chips=$$('.nav-chip');
  const sections=$$('.chapter[data-chapter]');
  if(!shell||!navScroll||!chips.length)return;

  if(placeholder) placeholder.remove();

  let glass=$('.nav-glass',shell);
  if(!glass){
    glass=document.createElement('div');
    glass.className='nav-glass';
    shell.insertBefore(glass,navScroll);
    glass.appendChild(navScroll);
    if(progress) glass.appendChild(progress);
  }

  const chipMap=new Map(chips.map(chip=>[chip.dataset.target,chip]));
  let active='';
  let clickLockUntil=0;
  let raf=0;
  let previousY=window.scrollY;
  let direction=0;
  let directionDistance=0;

  function centerChip(chip,animated=true){
    if(!chip)return;
    const left=chip.offsetLeft-(navScroll.clientWidth-chip.offsetWidth)/2;
    navScroll.scrollTo({left:Math.max(0,left),behavior:animated&&!reduceMotion()?'smooth':'auto'});
  }

  function setActive(id,center=true){
    if(!id)return;
    if(id!==active){
      active=id;
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.target===id));
    }
    if(center) centerChip(chipMap.get(id),true);
  }

  function updateMotion(){
    raf=0;
    const y=Math.max(0,window.scrollY||0);
    const dy=y-previousY;
    previousY=y;

    if(Math.abs(dy)>.5){
      const nextDirection=dy>0?1:-1;
      if(nextDirection!==direction){
        direction=nextDirection;
        directionDistance=0;
      }
      directionDistance+=Math.abs(dy);
      if(y<26){
        shell.classList.remove('is-compact');
        directionDistance=0;
      }else if(direction===1&&directionDistance>18){
        shell.classList.add('is-compact');
        directionDistance=0;
      }else if(direction===-1&&directionDistance>24){
        shell.classList.remove('is-compact');
        directionDistance=0;
      }
    }

    if(bar){
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      bar.style.transform=`scaleX(${Math.min(1,Math.max(0,y/max))})`;
    }
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(updateMotion);
  }

  const observer=new IntersectionObserver(entries=>{
    if(Date.now()<clickLockUntil)return;
    const visible=entries.filter(entry=>entry.isIntersecting);
    if(!visible.length)return;
    visible.sort((a,b)=>Math.abs(a.boundingClientRect.top-90)-Math.abs(b.boundingClientRect.top-90));
    setActive(visible[0].target.dataset.chapter,true);
  },{root:null,rootMargin:'-86px 0px -68% 0px',threshold:[0,.01,.2]});
  sections.forEach(section=>observer.observe(section));

  chips.forEach(chip=>chip.addEventListener('click',()=>{
    const target=document.getElementById(chip.dataset.target);
    if(!target)return;
    clickLockUntil=Date.now()+850;
    setActive(chip.dataset.target,true);
    const top=target.getBoundingClientRect().top+window.scrollY-shell.offsetHeight-8;
    window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});
  }));

  let initial=sections[0];
  const line=shell.offsetHeight+18;
  for(const section of sections){
    const rect=section.getBoundingClientRect();
    if(rect.top<=line&&rect.bottom>line){initial=section;break;}
    if(rect.top<=line)initial=section;
  }
  if(initial)setActive(initial.dataset.chapter,false);
  updateMotion();

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
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
        <div><h3>더 읽어볼 촬영 팁</h3><p>브런치와 티스토리의 실전 글을 시트에서 관리합니다. 새 링크는 SEO 이미지와 설명을 자동으로 읽어옵니다.</p></div>
        <div class="curated-tools">
          <button class="curated-tool" id="curatedFavoriteFilter" type="button">즐겨찾기만</button>
          <button class="curated-tool" id="curatedRefresh" type="button">링크 새로고침</button>
        </div>
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
function renderCuratedItems(items){
  const row=$('#curatedLinksRow');
  if(!row)return;
  const favorites=curatedFavorites();
  if(!items.length){
    row.innerHTML='<div class="curated-skeleton" style="display:grid;place-items:center;padding:1rem;color:#777;background:#fff">표시할 링크가 없습니다.</div>';
    return;
  }

  row.innerHTML=items.map(item=>{
    const id=String(item.id||'');
    const favorite=favorites.has(id);
    const image=item.thumbnail_url||imageFor('portfolio');
    const title=item.og_title||item.title||'사진 참고 글';
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
    const id=card?.dataset.curatedId||'';
    if(!id)return;
    const set=curatedFavorites();
    if(set.has(id))set.delete(id);else set.add(id);
    writeCuratedFavorites(set);
    const saved=set.has(id);
    card.dataset.favorite=saved?'true':'false';
    button.classList.toggle('is-favorite',saved);
    button.setAttribute('aria-pressed',saved?'true':'false');
    if(row.classList.contains('filter-favorites')&&!saved)card.classList.add('is-filtered-out');
  }));
}

async function loadCuratedLinks(){
  const status=$('#curatedStatus');
  try{
    const response=await fetch('/api/curated',{cache:'no-store'});
    const json=await response.json();
    if(!response.ok||!json?.ok)throw new Error(json?.message||'링크를 불러오지 못했습니다.');
    renderCuratedItems(Array.isArray(json.items)?json.items:[]);
    if(status)status.textContent=json.refreshed?'SEO 정보를 새로 읽었습니다.':'';
  }catch(error){
    const row=$('#curatedLinksRow');
    if(row)row.innerHTML='<div class="curated-skeleton" style="display:grid;place-items:center;padding:1rem;color:#777;background:#fff">외부 글 목록을 불러오지 못했습니다.</div>';
    if(status)status.textContent='시트의 CURATED_LINKS 연결 상태를 확인해 주세요.';
  }
}

function setupCuratedControls(){
  const filter=$('#curatedFavoriteFilter');
  const refresh=$('#curatedRefresh');
  const row=$('#curatedLinksRow');
  if(!row)return;

  filter?.addEventListener('click',()=>{
    const active=!row.classList.contains('filter-favorites');
    row.classList.toggle('filter-favorites',active);
    filter.classList.toggle('is-active',active);
    filter.textContent=active?'전체 보기':'즐겨찾기만';
    row.querySelectorAll('.curated-card').forEach(card=>card.classList.toggle('is-filtered-out',active&&card.dataset.favorite!=='true'));
  });

  refresh?.addEventListener('click',async()=>{
    const old=refresh.textContent;
    refresh.disabled=true;
    refresh.textContent='확인 중';
    try{
      await fetch('/api/curated',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refresh'})});
      await loadCuratedLinks();
      refresh.textContent='업데이트됨';
      setTimeout(()=>refresh.textContent=old,1100);
    }catch{
      refresh.textContent='다시 시도';
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
