/* v52: keep Safari chrome untinted through late theme initialization.
   No observers, no scroll handlers, no gesture code. */
(function(){
  if(window.__photoV50ChromeCleanupInstalled)return;
  window.__photoV50ChromeCleanupInstalled=true;

  function clearThemeColor(){
    document.querySelectorAll('meta[name="theme-color"]').forEach(node=>node.remove());
  }

  function sweep(){
    [0,120,420,900,1800,3200].forEach(delay=>setTimeout(clearThemeColor,delay));
  }

  sweep();
  window.addEventListener('photo-theme-change',()=>{
    clearThemeColor();
    setTimeout(clearThemeColor,80);
    setTimeout(clearThemeColor,320);
  },{passive:true});
  window.addEventListener('pageshow',sweep,{passive:true});
})();
