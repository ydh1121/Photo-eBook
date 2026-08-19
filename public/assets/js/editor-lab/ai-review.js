(function(){
  const STORAGE_KEY='platformEditorLabDraftV1';
  const panel=document.querySelector('#editorAiReviewPanel');
  if(!panel)return;
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  let draft={};
  try{draft=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{}
  const review=draft.aiReview&&typeof draft.aiReview==='object'?draft.aiReview:null;
  if(!review||(!review.summary&&!review.issues?.length&&!review.blockNotes?.length)){
    panel.hidden=true;
    return;
  }
  const issues=Array.isArray(review.issues)?review.issues:[];
  const blockers=issues.filter(item=>item?.severity==='blocker').length;
  const warnings=issues.filter(item=>item?.severity==='warning').length;
  panel.hidden=false;
  panel.innerHTML=`<div class="editor-ai-review__head"><strong>최근 AI 검토</strong><span>${blockers?`차단 ${blockers}`:warnings?`확인 ${warnings}`:'검토 기록'}</span></div>${review.summary?`<p>${escapeHtml(review.summary)}</p>`:''}${issues.length?`<ul>${issues.slice(0,8).map(item=>`<li data-severity="${escapeHtml(item.severity||'warning')}"><span>${escapeHtml(item.severity==='blocker'?'차단':item.severity==='info'?'참고':'확인')}</span><p>${escapeHtml(item.message||'')}</p></li>`).join('')}</ul>`:''}${review.importedAt?`<small>${escapeHtml(review.importedAt)}</small>`:''}`;
})();
