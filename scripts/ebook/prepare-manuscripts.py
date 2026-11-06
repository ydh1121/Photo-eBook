#!/usr/bin/env python3
"""Apply reviewed visual placement; retain authored prose and semantic IDs."""
import argparse, json, hashlib
from pathlib import Path
from PIL import Image

def markdown(book):
    lines=[f"# {book['title']}",book['subtitle'],
           '본문 24쪽 샘플 장입니다. 표지·목차는 본문 쪽수에 포함하지 않습니다. 정규 400쪽 교재의 완성본이 아닙니다.',
           '공식 문서 확인일: 2026-11-06. Android 기기에서 직접 실행한 기록은 포함하지 않았습니다. 그림은 자체 제작 학습 예시이며 실제 앱 화면이 아닙니다.']
    for page in book['pages']:
        lines += ['---',f"## 본문 {page['pageNumber']:02d} · {page['title']}",f"페이지 ID: {page['pageId']}"]
        for b in page['blocks']:
            typ=b['type']
            if typ=='paragraph':lines.append(b['text'])
            elif typ in ('heading','callout','template'):
                if b.get('title'):lines.append('### '+b['title'])
                lines.append(('### ' if typ=='heading' else '')+b['text'])
            elif typ in ('list','checklist'):
                lines.append('\n'.join((f'{i+1}. ' if b.get('ordered') else '- [ ] ' if typ=='checklist' else '- ')+s for i,s in enumerate(b['items'])))
            elif typ=='steps':
                lines.append('\n'.join(f"{i+1}. **{s.get('title','')}** {s['text']}"+(f"\n   남길 결과: {s['output']}" if s.get('output') else '') for i,s in enumerate(b['items'])))
                if b.get('output'):lines.append('남길 결과: '+b['output'])
            elif typ=='table':
                if b.get('caption'):lines.append('### '+b['caption'])
                cell=lambda x:str(x).replace('|','\\|').replace('\n',' / ')
                lines.append('\n'.join(['| '+' | '.join(map(cell,b['columns']))+' |','| '+' | '.join('---' for _ in b['columns'])+' |']+['| '+' | '.join(map(cell,r))+' |' for r in b['rows']]))
            elif typ=='image':lines.append(f"![{b['alt']}](../images/png/{b['assetId']}.png)\n\n{b.get('caption','')}\n\n{b.get('credit','')}")
            elif typ=='exercise':
                lines += ['### '+b.get('title','실습'), '목표: '+b.get('goal',''), '\n'.join(f'{i+1}. {s}' for i,s in enumerate(b.get('steps',[]))), '남길 결과: '+b.get('expectedOutput',''), '\n'.join('- [ ] '+s for s in b.get('checks',[]))]
                if b.get('solution'):lines.append('해설: '+b['solution'])
            elif typ=='sources':lines.append('\n'.join(f"- [{s['title']}]({s['url']})"+(f" — {s['publisher']}" if s.get('publisher') else '') for s in b['items']))
    return '\n\n'.join(lines)+'\n'

def main():
    p=argparse.ArgumentParser();p.add_argument('sources',type=Path);p.add_argument('images',type=Path);p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    reports=[]
    for name in ['sns-entry-sample','video-entry-sample','ai-entry']:
        source=(args.sources/(name+'.json')).read_bytes(); book=json.loads(source)
        if book['bookId']=='ai-entry':
            page=book['pages'][0]
            page['blocks'].insert(2,{'blockId':page['pageId']+'-bookmark-example','type':'image','assetId':'bookmark-finished','alt':'크림색 책과 잎무늬를 그린 연노랑 책갈피, 파란 펜을 놓은 AI 생성 학습 예시','caption':'세 분야에서 함께 만드는 책갈피. 실제 행사 사진이 아닌 자체 기획 실습용 이미지입니다.'})
            page=book['pages'][19]
            page['blocks'].insert(2,{'blockId':page['pageId']+'-check-diagram','type':'image','assetId':'ai-before-shoot','alt':'사실 카드 대조, 장면과 자막 대조, 현장 직접 확인의 세 가지 촬영 전 점검을 보여주는 직접 제작 도해','caption':'AI가 작성한 표를 실제 준비와 연결할 때는 원자료, 장면, 현장을 각각 확인합니다.'})
        for page in book['pages']:
            for block in page['blocks']:
                if block['type']=='image':
                    with Image.open(args.images/'png'/(block['assetId']+'.png')) as img: block['width'],block['height']=img.size
                    block['credit']='Personal Edu · '+('AI 생성 학습 이미지' if block['assetId'].startswith('bookmark-') else '직접 제작 학습 도해 · 실제 앱 화면 아님')
        with Image.open(args.images/'png'/'bookmark-finished.png') as img:w,h=img.size
        book['cover']={'assetId':'bookmark-finished','alt':'SNS·영상·AI 실습에서 함께 사용하는 책갈피 학습 예시','width':w,'height':h}
        output=(json.dumps(book,ensure_ascii=False,indent=2)+'\n').encode()
        (args.output/(book['bookId']+'.json')).write_bytes(output)
        (args.output/(book['bookId']+'.md')).write_text(markdown(book))
        reports.append({'bookId':book['bookId'],'authoredSourceSha256':hashlib.sha256(source).hexdigest(),'finalSourceSha256':hashlib.sha256(output).hexdigest(),'bodyPages':len(book['pages']),'blocks':sum(len(x['blocks']) for x in book['pages']),'bodyImages':sum(b['type']=='image' for x in book['pages'] for b in x['blocks']),'changes':['real image dimensions and credit','cover asset']+(['two original teaching visuals'] if book['bookId']=='ai-entry' else [])})
    (args.output/'visual-integration.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(reports,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
