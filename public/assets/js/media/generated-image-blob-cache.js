/* v30: safely convert generated data URLs into blob URLs without emitting invalid image requests. */
(function(){
  const registry=window.__PHOTO_GENERATED_IMAGES;
  if(!registry||registry.__blobReady)return;
  registry.__blobReady=true;
  const objectUrls=[];

  function decodeBase64(payload){
    let normalized=String(payload||'').replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');
    if(!normalized)return null;
    const remainder=normalized.length%4;
    if(remainder)normalized+='='.repeat(4-remainder);
    if(!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized))return null;
    try{
      const binary=atob(normalized);
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return bytes;
    }catch{return null;}
  }

  function dataUrlToBlobUrl(value){
    const text=String(value||'').trim();
    if(!/^data:image\//i.test(text))return text;
    const comma=text.indexOf(',');
    if(comma<0)return '';
    const meta=text.slice(5,comma);
    const payload=text.slice(comma+1);
    const mime=(meta.match(/^([^;]+)/)||[])[1]||'image/webp';
    try{
      let bytes;
      if(/;base64/i.test(meta)){
        bytes=decodeBase64(payload);
        if(!bytes)return '';
      }else{
        bytes=new TextEncoder().encode(decodeURIComponent(payload));
      }
      if(!bytes?.byteLength)return '';
      const url=URL.createObjectURL(new Blob([bytes],{type:mime}));
      objectUrls.push(url);
      return url;
    }catch{return '';}
  }

  Object.keys(registry).forEach(key=>{
    if(key.startsWith('__'))return;
    const converted=dataUrlToBlobUrl(registry[key]);
    if(converted)registry[key]=converted;
    else delete registry[key];
  });

  window.addEventListener('pagehide',()=>objectUrls.forEach(url=>URL.revokeObjectURL(url)),{once:true});
})();
