/* v50: keep Safari chrome untinted without touching scroll/gesture paths. */
(function(){
  if(window.__photoV50ChromeCleanupInstalled)return;
  window.__photoV50ChromeCleanupInstalled=true;

  function clearThemeColor(){
    document.querySelectorAll('meta[name="theme-color"]').forEach(node=>node.remove());
  }

  clearThemeColor();
  window.addEventListener('photo-theme-change',clearThemeColor,{passive:true});
  window.addEventListener('pageshow',clearThemeColor,{passive:true});
})();
