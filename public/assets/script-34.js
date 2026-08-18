/* v2: durable single-intent bridge for GPT bubble -> question write mode.
   Existing question renderers remain in place, but they all read the same
   pending flag. While the explicit intent is "write", attempts to clear that
   flag are ignored so saved-question rerenders cannot win the race. */
(function(){
  if(window.__photoQuestionIntentBridgeInstalled)return;
  window.__photoQuestionIntentBridgeInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  let intent='saved';
  let pendingBacking=Boolean(window.__photoPendingQuestionWrite);

  function isWrite(){return intent==='write';}
  function setIntent(next){
    intent=next==='write'?'write':'saved';
    window.__photoQuestionIntent=intent;
    pendingBacking=isWrite();
  }

  /* script-24 and script-29 both read/write this historical flag. Turn it into
     a compatibility view of the canonical intent: while write intent is live,
     a delayed `false` from either legacy controller cannot collapse the UI
     back to the saved-question list. */
  try{
    Object.defineProperty(window,'__photoPendingQuestionWrite',{
      configurable:true,
      enumerable:true,
      get(){return isWrite()?true:pendingBacking;},
      set(value){pendingBacking=Boolean(value);}
    });
  }catch{
    window.__photoPendingQuestionWrite=pendingBacking;
  }

  const previousForce=window.__photoForceQuestionWrite;
  window.__photoForceQuestionWrite=function(){
    setIntent('write');
    /* Reuse script-24's established mount/repair routine. Its delayed attempt
       may still assign pending=false, but the accessor above keeps the effective
       value true until the user deliberately leaves write mode. */
    if(typeof previousForce==='function'){
      previousForce();
      return;
    }
    const write=$('#v40QuestionControls [data-v40-qmode="write"]');
    write?.click();
  };

  function armWriteFromTarget(target){
    if(!(target instanceof Element))return;
    if(target.closest('#askBubble')){
      setIntent('write');
      return;
    }
    const card=target.closest('.collection-item[data-library-type="question"]');
    if(!card)return;
    const body=card.closest('#collectionBody');
    const bulk=body?.classList.contains('is-bulk-selecting')||$('.collection-select-toggle')?.classList.contains('is-active');
    if(!bulk)setIntent('write');
  }

  /* The GPT click itself is consumed by an older window-capture handler.
     Arm the intent one input phase earlier so that handler sees write=true. */
  window.addEventListener('pointerdown',event=>armWriteFromTarget(event.target),true);
  window.addEventListener('touchstart',event=>armWriteFromTarget(event.target),{capture:true,passive:true});
  window.addEventListener('mousedown',event=>armWriteFromTarget(event.target),true);

  /* Deliberate navigation is the only thing that ends a write intent. */
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    if(target.closest('#collectionClose,#collectionBackdrop')){
      setIntent('saved');
      pendingBacking=false;
      return;
    }

    const modeButton=target.closest('[data-v40-qmode]');
    if(modeButton){
      setIntent(modeButton.dataset.v40Qmode==='write'?'write':'saved');
      return;
    }

    const tab=target.closest('.collection-tab');
    if(tab&&tab.dataset.libraryTab!=='question'){
      setIntent('saved');
      pendingBacking=false;
    }
  },false);

  window.__photoQuestionIntent='saved';
})();
