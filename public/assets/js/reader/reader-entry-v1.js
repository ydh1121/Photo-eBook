/* Route framing only; the approved Registry module owns every reader behavior. */
(function(){
  'use strict';
  const query=new URLSearchParams(location.search),bookId=query.get('book'),editionId=query.get('edition')||'sample-20261106-v1';
  if(!bookId)return;
  const model=window.PersonalEduReaderModelV1,registry=window.PlatformModuleRegistry,host=document.getElementById('reader-host');
  const subjects={'sns-entry':'sns','video-entry':'video','ai-entry':'ai'};
  if(!model||!registry||!model.identifier(bookId)||!model.identifier(editionId)||!subjects[bookId]){
    const message=document.createElement('p');message.className='reader-entry-status';message.setAttribute('role','status');message.textContent='교재 주소를 확인해 주세요. 아래 목록에서 읽을 샘플을 선택할 수 있습니다.';host.prepend(message);return;
  }
  const returnLink=document.querySelector('[data-reader-return]');returnLink.href=`/${subjects[bookId]}/`;returnLink.textContent=`${{sns:'SNS',video:'영상',ai:'AI'}[subjects[bookId]]} 학습 가이드`;
  const instance=registry.mount(host,'ebook-reader',{manifestUrl:`/books/${bookId}/${editionId}/manifest.json`,pageId:query.get('page')||''},{consumer:'public',readerEditionUrl(value){const url=new URL(location.href);url.searchParams.set('book',value.bookId);url.searchParams.set('edition',value.editionId);url.searchParams.set('page',value.pageId);return url.href;},onReaderNavigate(value){
    const url=new URL(location.href);url.searchParams.set('page',value.pageId);url.searchParams.set('edition',value.editionId);history.replaceState(history.state,'',url);document.title=`${document.querySelector('[data-reader-title]').textContent} · ${value.pageNumber}쪽`;
  }});
  window.PlatformModuleStyleRuntime?.apply?.('ebook-reader',host,{});
  window.PersonalEduReaderEntryV1=Object.freeze({instance,bookId,editionId});
})();
