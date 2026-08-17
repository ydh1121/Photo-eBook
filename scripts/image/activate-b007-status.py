from pathlib import Path
import json,datetime
B=Path('content/image-prompts/v1/applied/b007.json'); b=json.loads(B.read_text()); data={x['slot_id']:x for x in b['slots']}; now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(timespec='seconds')
p=Path('content/image-prompts/v1/batch-status-002.json'); o=json.loads(p.read_text()); o['status']='applied'; o['updated_at']=now
for s in o['slots']:
    if s['slot_id'] in data:
        x=data[s['slot_id']]; s.update(status='applied',drive_file_id=x['drive_file_id'],target_path=x['path'],sha256=x['sha256'],bytes=x['bytes'],ready=True,qa={'context_match':True,'single_scene':True,'no_meta_ui':True,'crop_ready':True}); s.pop('failure_code',None); s.pop('retry_count',None)
p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
p=Path('content/image-prompts/v1/applied-status.json'); o=json.loads(p.read_text()); o['runtime_revision']='b007'; o['latest_asset_commit_sha']=b['asset_commit_sha']; slots={x['slot_id']:x for x in o['slots']}
for sid,x in data.items(): slots[sid]={'slot_id':sid,'path':x['path'],'ready':True,'drive_file_id':x['drive_file_id'],'sha256':x['sha256'],'bytes':x['bytes'],'status':'applied'}
o['slots']=list(slots.values()); p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
d=Path('content/image-status/v1'); d.mkdir(parents=True,exist_ok=True)
for sid,x in data.items():
    s={'version':'v1','slot_id':sid,'status':'applied','source':'legacy-completed','png':{'status':'legacy_not_available','drive_file_id':None},'webp':{'drive_file_id':x['drive_file_id'],'sha256':x['sha256'],'bytes':x['bytes'],'repo_path':'public'+x['path']},'ready':True,'runtime_revision':'b007','updated_at':now}; (d/f'{sid}.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
p=Path('content/image-prompts/v1/applied/b005-v4.json'); o=json.loads(p.read_text()); o['deployment_verified']=False; p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
