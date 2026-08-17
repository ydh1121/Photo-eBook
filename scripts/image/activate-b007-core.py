from pathlib import Path
import json,re
batch=json.loads(Path('content/image-prompts/v1/applied/b007.json').read_text())
ids={x['slot_id'] for x in batch['slots']}
p=Path('content/image-prompts/v1/manifest.json'); o=json.loads(p.read_text())
seen=set()
for s in o['slots']:
    if s['slot_id'] in ids:s['ready']=True;seen.add(s['slot_id'])
assert seen==ids
p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
p=Path('public/assets/image-slots-v1.js'); out=[]; seen=set()
for line in p.read_text().splitlines():
    sid=next((x for x in ids if f"'{x}':{{" in line),None)
    if sid:
        seen.add(sid); line=line.replace('ready:false','ready:true')
        if "rev:'" in line: line=re.sub(r"rev:'[^']+'","rev:'b007'",line)
        else:
            i=line.rfind('}'); line=line[:i]+",rev:'b007'"+line[i:]
    out.append(line)
assert seen==ids
p.write_text('\n'.join(out)+'\n')
p=Path('public/index.html'); t=p.read_text(); t,n=re.subn(r'/assets/image-slots-v1\.js\?v=\d+','/assets/image-slots-v1.js?v=7',t,count=1); assert n==1; p.write_text(t)
