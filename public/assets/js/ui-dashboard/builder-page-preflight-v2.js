(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderPagePreflightV2)return;
  window.__platformBuilderPagePreflightV2=true;

  const LEGACY='platformBuilderCapabilityConfigsV1';
  const LIVE='platformBuilderCapabilityConfigsV2';
  const ARCHIVE='platformBuilderCapabilityConfigsLegacyArchiveV1';
  function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

  const legacy=read(LEGACY);
  const live=read(LIVE);
  if(Object.keys(legacy).length&&!localStorage.getItem(ARCHIVE))write(ARCHIVE,legacy);
  /* builder-v1 still owns inspector/panel creation, but it must boot from only
     the explicit live overrides. configFor() adds manifest defaults for form
     presentation; the live runtime later resets the actual UI to production. */
  write(LEGACY,live);
})();
