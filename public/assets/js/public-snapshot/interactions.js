(function(){
  const numberFormat=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2});

  function bindCalculator(node){
    if(!node||node.dataset.publicCalcBound==='true')return;
    node.dataset.publicCalcBound='true';
    const output=node.querySelector('[data-calc-output]');
    const inputs=[...node.querySelectorAll('[data-calc-input]')];
    if(!output||!inputs.length)return;

    function calculate(){
      const values=inputs.map(input=>{
        const value=Number.parseFloat(input.value);
        return Number.isFinite(value)?value:0;
      });
      const kind=node.dataset.calcKind||'multiply';
      const result=kind==='sum'?values.reduce((sum,value)=>sum+value,0):values.reduce((product,value)=>product*value,1);
      output.textContent=`${output.dataset.prefix||''}${numberFormat.format(result)}${output.dataset.suffix||''}`;
    }

    inputs.forEach(input=>input.addEventListener('input',calculate));
    calculate();
  }

  function bindAll(){
    document.querySelectorAll('.pb-calculator').forEach(bindCalculator);
  }

  async function copyFromButton(button){
    const card=button.closest('[data-copy-text]');
    const text=String(card?.dataset.copyText||'');
    if(!text)return;
    try{
      await navigator.clipboard.writeText(text);
      const previous=button.textContent;
      button.textContent='복사됨';
      window.setTimeout(()=>{button.textContent=previous||'복사';},1200);
    }catch{
      const area=document.createElement('textarea');
      area.value=text;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  document.addEventListener('click',event=>{
    const copyButton=event.target.closest?.('.pb-copy-btn');
    if(copyButton){event.preventDefault();copyFromButton(copyButton);return;}
    const placeholder=event.target.closest?.('a[href="#"]');
    if(placeholder)event.preventDefault();
  });

  document.addEventListener('platform:public-snapshot-rendered',bindAll);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindAll,{once:true});
  else bindAll();
})();
