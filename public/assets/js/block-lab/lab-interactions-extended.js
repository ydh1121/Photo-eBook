(function(){
  const numberFormat=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2});

  function bindCalculator(node){
    if(!node||node.dataset.calcBound==='true')return;
    node.dataset.calcBound='true';
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
      const prefix=output.dataset.prefix||'';
      const suffix=output.dataset.suffix||'';
      output.textContent=`${prefix}${numberFormat.format(result)}${suffix}`;
    }

    inputs.forEach(input=>input.addEventListener('input',calculate));
    calculate();
  }

  function bindPlaceholderLink(link){
    if(!link||link.dataset.labPlaceholderBound==='true')return;
    if(link.getAttribute('href')!=='#')return;
    link.dataset.labPlaceholderBound='true';
    link.addEventListener('click',event=>event.preventDefault());
  }

  window.bindBlockLabEnhancements=function(){
    document.querySelectorAll('.pb-calculator').forEach(bindCalculator);
    document.querySelectorAll('.block-lab a[href="#"]').forEach(bindPlaceholderLink);
  };
})();
