import {BLOCK_VARIANTS_V1} from './block-variants-v1.js';

export const BLOCK_APPROVAL_V1=Object.freeze(Object.fromEntries(
  Object.entries(BLOCK_VARIANTS_V1).map(([type,variants])=>[
    type,
    Object.freeze({
      status:'candidate',
      variants:Object.freeze(Object.fromEntries(variants.map(variant=>[variant,'candidate'])))
    })
  ])
));

export function getBlockTypeApproval(type){
  return BLOCK_APPROVAL_V1[String(type||'')]?.status||'unknown';
}

export function getBlockVariantApproval(type,variant){
  return BLOCK_APPROVAL_V1[String(type||'')]?.variants?.[String(variant||'')]||'unknown';
}

export function isApprovedBlockVariant(type,variant){
  return getBlockVariantApproval(type,variant)==='approved';
}
