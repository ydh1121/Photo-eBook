/* v1: one-shot iOS Safari bottom-chrome prime after the real app renders.
   This intentionally mirrors only the document lock/unlock lifecycle that is
   already exercised by the collection sheet. It never opens or moves UI. */
(function(){
  if(window.__photoSafariFirstPaintPrimeInstalled)return;
  window.__photoSafariFirstPaintPrimeInstalled=true;

  const root=document.documentElement;
  if(!root.classList.contains('ios-webkit-chrome'))return;

  let primed=false;
  let timer=0;

  function appReady(){
    const app=document.querySelector('#app');
    return Boolean(app&&!app.hidden&&app.childElementCount>0);
  }

  function collectionIsOpen(){
    const sheet=document.querySelector('#collectionSheet');
    return root.classList.contains('collection-open')||document.body.classList.contains('collection-open')||Boolean(sheet&&!sheet.hidden);
  }

  function prime(){
    if(primed||!appReady()||collectionIsOpen())return false;
    primed=true;

    const body=document.body;
    const y=Math.max(0,window.scrollY||window.pageYOffset||root.scrollTop||0);
    const oldTop=body.style.top;
    const oldScrollBehavior=root.style.scrollBehavior;

    /* Reproduce the same root-scroller transition that occurs when the bottom
       sheet opens, without mounting the sheet or backdrop. Safari refreshes its
       browser-chrome composition when that temporary viewport lock is released. */
    root.style.scrollBehavior='auto';
    root.classList.add('collection-open');
    body.classList.add('collection-open');
    body.style.top=`-${y}px`;

    /* Force the locked state to become a committed layout/paint state. */
    void body.offsetHeight;

    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        root.classList.remove('collection-open');
        body.classList.remove('collection-open');
        body.style.top=oldTop;
        window.scrollTo(0,y);
        void root.offsetHeight;

        requestAnimationFrame(()=>{
          root.style.scrollBehavior=oldScrollBehavior;
        });
      });
    });
    return true;
  }

  function schedule(){
    if(primed)return;
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(prime())return;
      schedule();
    },120);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',schedule,{once:true});
  }else schedule();

  window.addEventListener('load',()=>{if(!primed)schedule();},{once:true,passive:true});
})();
