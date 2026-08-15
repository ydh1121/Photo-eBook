/* v27: convert oversized generated data URLs into blob URLs before the app renders. */
(function(){
  const registry=window.__PHOTO_GENERATED_IMAGES;
  if(!registry||registry.__blobReady)return;
  registry.__blobReady=true;
  const objectUrls=[];

  function dataUrlToBlobUrl(value){
    const text=String(value||'');
    if(!/^data:image\//i.test(text))return text;
    const comma=text.indexOf(',');
    if(comma<0)return text;
    const meta=text.slice(5,comma);
    const payload=text.slice(comma+1);
    const mime=(meta.match(/^([^;]+)/)||[])[1]||'image/webp';
    try{
      let bytes;
      if(/;base64/i.test(meta)){
        const binary=atob(payload.replace(/\s+/g,''));
        bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      }else{
        bytes=new TextEncoder().encode(decodeURIComponent(payload));
      }
      const url=URL.createObjectURL(new Blob([bytes],{type:mime}));
      objectUrls.push(url);
      return url;
    }catch(error){
      console.warn('generated image conversion failed',error);
      return text;
    }
  }

  Object.keys(registry).forEach(key=>{
    if(key.startsWith('__'))return;
    registry[key]=dataUrlToBlobUrl(registry[key]);
  });

  window.addEventListener('pagehide',()=>objectUrls.forEach(url=>URL.revokeObjectURL(url)),{once:true});
})();
