export const BLOCK_VARIANTS_V1=Object.freeze({
  hero:['image-metrics','minimal'],
  'chapter-hero':['image','compact'],
  'section-heading':['default','compact'],
  'rich-text':['default','lead'],
  process:['sequence','ranking'],
  'metric-grid':['default','emphasis'],
  'offer-rail':['cards','compact'],
  notice:['info','key','warning'],
  'comparison-cards':['generic','scored','market'],
  checklist:['numbered','checkable'],
  'media-rail':['skill','video','mixed'],
  'case-study-rail':['project','compact'],
  'product-tool':['rail','list','detail'],
  roadmap:['phases','compact'],
  'script-copy':['messages','compact'],
  tutorial:['preview-rail','preset-rail','detail'],
  resources:['curated-rail','official-list'],
  faq:['accordion','open-first'],
  'pros-cons':['split','stacked'],
  'comparison-table':['default','compact'],
  timeline:['vertical','compact'],
  'image-copy-split':['image-left','image-right','editorial'],
  gallery:['grid','strip'],
  'quote-expert':['quote','comment'],
  calculator:['multiply','sum'],
  cta:['band','minimal'],
  'service-list':['rows','compact']
});

export function isKnownBlockVariant(type,variant){
  const list=BLOCK_VARIANTS_V1[String(type||'')];
  return Array.isArray(list)&&list.includes(String(variant||''));
}
