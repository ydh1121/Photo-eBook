const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
const attr=esc;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const by=(rows,key,value)=>(rows||[]).filter(r=>String(r[key]||'')===String(value));
const pipe=(v='')=>String(v||'').split('|').map(s=>s.trim()).filter(Boolean);
const lines=(v='')=>String(v||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
const splitDeliverables=(v='')=>String(v||'').split(/\s*(?:\+|,|·|→)\s*/).map(s=>s.trim()).filter(Boolean);

function imageFor(key){
  return typeof window.contentPackImageFor==='function'?window.contentPackImageFor(key):'';
}

function naverShoppingUrl(query){
  return 'https://search.shopping.naver.com/search/all?query='+encodeURIComponent(query||'');
}

function paragraphs(text=''){
  return String(text||'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join('');
}

function presetImageForScenario(name=''){
  if(typeof window.contentPackPresetImageForScenario==='function')return window.contentPackPresetImageForScenario(name);
  return imageFor('hero');
}

function calloutHtml(label,text,helper='',tone='dark'){
  const cls=tone==='soft'?'guide-key guide-key--soft':'guide-key';

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
