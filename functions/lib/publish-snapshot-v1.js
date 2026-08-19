import {publishPageSnapshot,validatePageForPublish} from './publish-v2.js';

/**
 * Compatibility wrapper kept for interrupted-session references.
 * Canonical publishing is functions/lib/publish-v2.js.
 */
export async function checkPublishSnapshotV1(env,pageId){
  const result=await validatePageForPublish(env,String(pageId||''));
  return {
    ok:true,
    pageId:String(pageId||''),
    canPublish:result.canPublish,
    errors:result.errors,
    warnings:result.warnings
  };
}

export async function publishSnapshotV1(env,pageId,actor='platform-owner'){
  return publishPageSnapshot(env,String(pageId||''),actor);
}
