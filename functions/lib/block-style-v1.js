export const BLOCK_STYLE_ENUMS_V1=Object.freeze({
  density:['airy','standard','compact'],
  surface:['plain','grouped','card'],
  radius:['none','small','medium','large'],
  border:['none','subtle','strong'],
  shadow:['none','soft','raised'],
  accentMode:['neutral','accent','semantic'],
  mediaRatio:['auto','16:10','16:9','4:3','1:1'],
  edgeTreatment:['none','runway','fade']
});

export function normalizeBlockStyleV1(input={}){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const output={};
  for(const [key,values] of Object.entries(BLOCK_STYLE_ENUMS_V1)){
    if(values.includes(String(source[key]||'')))output[key]=String(source[key]);
  }
  return output;
}
