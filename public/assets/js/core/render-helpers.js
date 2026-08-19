const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
const attr=esc;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const by=(rows,key,value)=>(rows||[]).filter(r=>String(r[key]||'')===String(value));
const pipe=(v='')=>String(v||'').split('|').map(s=>s.trim()).filter(Boolean);
const lines=(v='')=>String(v||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
const splitDeliverables=(v='')=>String(v||'').split(/\s*(?:\+|,|·|→)\s*/).map(s=>s.trim()).filter(Boolean);

const IMAGES={
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

function imageFor(key){ return IMAGES[key] || IMAGES.hero; }
function naverShoppingUrl(query){ return 'https://search.shopping.naver.com/search/all?query='+encodeURIComponent(query||''); }
function paragraphs(text=''){
  return String(text||'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join('');
}
function presetImageForScenario(name=''){
  const value=String(name||'');
  if(/야간/.test(value)) return imageFor('night');
  if(/카페|음식/.test(value)) return imageFor('food');
  if(/인물|프로필/.test(value)) return imageFor('profile');
  if(/제품|접사/.test(value)) return imageFor('product');
  return imageFor('iphone');
}
function calloutHtml(label,text,helper='',tone='dark'){
  const cls = tone==='soft' ? 'guide-key guide-key--soft' : 'guide-key';

  function bodyHtml(value){
    value=String(value||'').trim();
    if(value.includes('→')){
      const parts=value.split('→').map(s=>s.trim()).filter(Boolean);
      return `<span class="key-flow">${parts.map((p,i)=>`${i?'<span class="key-flow__arrow">→</span>':''}<span class="key-flow__item">${esc(p)}</span>`).join('')}</span>`;
    }
    return `<span class="guide-key__text">${esc(value)}</span>`;
  }

  return `<div class="${cls}"><b>${esc(label)}</b>${bodyHtml(text)}${helper?`<span>${esc(helper)}</span>`:''}</div>`;
}
