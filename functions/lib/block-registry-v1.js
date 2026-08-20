export const BLOCK_REGISTRY_V1=Object.freeze({
  hero:'candidate',
  'chapter-hero':'candidate',
  'section-heading':'candidate',
  'rich-text':'candidate',
  process:'candidate',
  'metric-grid':'candidate',
  'offer-rail':'candidate',
  notice:'candidate',
  'comparison-cards':'candidate',
  checklist:'candidate',
  'media-rail':'candidate',
  'case-study-rail':'candidate',
  'product-tool':'candidate',
  roadmap:'candidate',
  'script-copy':'candidate',
  tutorial:'candidate',
  resources:'candidate',
  faq:'candidate',
  'pros-cons':'candidate',
  'comparison-table':'candidate',
  timeline:'candidate',
  'image-copy-split':'candidate',
  gallery:'candidate',
  'quote-expert':'candidate',
  calculator:'candidate',
  cta:'candidate',
  'service-list':'candidate',
  advertisement:'candidate'
});

export function blockStatus(type){return BLOCK_REGISTRY_V1[String(type||'')]||'unknown';}
export function isKnownBlockType(type){return Object.prototype.hasOwnProperty.call(BLOCK_REGISTRY_V1,String(type||''));}
export function isApprovedBlockType(type){return blockStatus(type)==='approved';}
