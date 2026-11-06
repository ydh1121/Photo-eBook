#!/usr/bin/env python3
"""Independently verify rendered samples against unchanged source manuscripts.

This checks actual PDF extraction, destinations, source links, embedded images,
page numbers, text bounds, and source-file hashes. Visual review of the rendered
PNGs is a separate, required gate and must not be inferred from these checks.
"""

import argparse
import hashlib
import json
import re
from pathlib import Path

import fitz
from PIL import Image
from pypdf import PdfReader


def norm(value):
    return re.sub(r'\s+', '', str(value))


def visible_strings(page):
    yield 'title', page['title']
    for b in page['blocks']:
        ident=b['blockId']
        typ=b['type']
        if typ in ('paragraph','heading'):
            yield ident+'.text',b['text']
        elif typ in ('callout','template'):
            for key in ['title','text']:
                if b.get(key): yield ident+'.'+key,b[key]
        elif typ=='table':
            if b.get('caption'): yield ident+'.caption',b['caption']
            for i,v in enumerate(b['columns']): yield f'{ident}.columns[{i}]',v
            for i,row in enumerate(b['rows']):
                for j,v in enumerate(row): yield f'{ident}.rows[{i}][{j}]',v
        elif typ in ('list','checklist'):
            for i,v in enumerate(b['items']): yield f'{ident}.items[{i}]',v
        elif typ=='steps':
            for i,item in enumerate(b['items']):
                for key in ['title','text','output']:
                    if item.get(key): yield f'{ident}.items[{i}].{key}',item[key]
        elif typ=='exercise':
            for key in ['title','goal','expectedOutput','solution']:
                if b.get(key): yield f'{ident}.{key}',b[key]
            for key in ['steps','checks']:
                for i,v in enumerate(b.get(key,[])): yield f'{ident}.{key}[{i}]',v
        elif typ=='image':
            for key in ['caption','credit']:
                if b.get(key): yield f'{ident}.{key}',b[key]
        elif typ=='sources':
            for i,item in enumerate(b['items']):
                for key in ['title','publisher']:
                    if item.get(key): yield f'{ident}.items[{i}].{key}',item[key]
        else:
            raise ValueError(f'Unhandled block {typ}')


def check(source, output, require_renders=False):
    book=json.loads(source.read_text())
    bid=book['bookId']
    pdf=output/(bid+'-sample.pdf')
    prior=json.loads((output/(bid+'-validation.json')).read_text())
    reader=PdfReader(pdf)
    doc=fitz.open(pdf)
    failures=[]
    checked=0
    page_checks=[]
    source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    pdf_hash=hashlib.sha256(pdf.read_bytes()).hexdigest()
    if source_hash!=prior['sourceSha256']:
        failures.append({'kind':'source-changed-after-render'})
    if pdf_hash!=prior['outputSha256']:
        failures.append({'kind':'pdf-changed-after-validation'})
    if len(reader.pages)!=26:
        failures.append({'kind':'wrong-page-count','actual':len(reader.pages)})
    for page in book['pages']:
        number=page['pageNumber']
        physical=number+2
        raw=reader.pages[physical-1].extract_text() or ''
        extracted=norm(raw)
        missing=[]
        strings=list(visible_strings(page))
        checked+=len(strings)
        for key,value in strings:
            if norm(value) not in extracted:
                missing.append({'path':key,'text':value})
        if missing:
            failures.append({'kind':'missing-visible-text','bodyPage':number,'items':missing})
        # Footer number must be at the lower-right of the actual PDF page.
        rendered_page=doc[physical-1]
        footer_words=[w for w in rendered_page.get_text('words')
                      if w[0]>rendered_page.rect.width-85 and w[1]>rendered_page.rect.height-40]
        footer_ok=any(w[4]==str(number) for w in footer_words)
        if not footer_ok:
            failures.append({'kind':'body-page-footer','bodyPage':number,'words':footer_words})
        expected_images=sum(b['type']=='image' for b in page['blocks'])
        actual_images=len(rendered_page.get_image_info())
        if actual_images!=expected_images:
            failures.append({'kind':'image-count','bodyPage':number,'expected':expected_images,'actual':actual_images})
        ext_links=[str(a.get_object().get('/A',{}).get('/URI','')) for a in reader.pages[physical-1].get('/Annots',[])]
        urls=[item['url'] for b in page['blocks'] if b['type']=='sources' for item in b['items']]
        missing_links=[url for url in urls if url not in ext_links]
        if missing_links:
            failures.append({'kind':'page-source-link','bodyPage':number,'urls':missing_links})
        page_checks.append({'bodyPage':number,'pdfPage':physical,'sourceStringsChecked':len(strings),
                            'missingStrings':len(missing),'footerNumberCorrect':footer_ok,
                            'expectedImages':expected_images,'embeddedImages':actual_images,
                            'sourceLinks':len(urls),'missingLinks':len(missing_links)})
    # Check internal links resolve to actual physical pages, not just URI strings.
    # Resolve /Dest arrays directly. MuPDF exposes /Fit destinations as LINK_NAMED
    # with one-based string page numbers, not consistently as LINK_GOTO.
    page_references={page.indirect_reference.idnum:i for i,page in enumerate(reader.pages)}
    destinations=[]
    for annotation in reader.pages[1].get('/Annots',[]):
        dest=annotation.get_object().get('/Dest')
        if dest and isinstance(dest,list) and hasattr(dest[0],'idnum'):
            destinations.append(page_references.get(dest[0].idnum))
    if sorted(destinations)!=list(range(2,26)):
        failures.append({'kind':'contents-destinations','destinations':destinations})
    out_of_bounds=[]
    for i,page in enumerate(doc):
        for line in page.get_text('dict')['blocks']:
            if line.get('type')!=0: continue
            for row in line.get('lines',[]):
                for span in row.get('spans',[]):
                    x0,y0,x1,y1=span['bbox']
                    if x0 < -0.1 or y0 < -0.1 or x1 > page.rect.width+0.1 or y1 > page.rect.height+0.1:
                        out_of_bounds.append({'pdfPage':i+1,'bbox':list(span['bbox']),'text':span['text']})
    if out_of_bounds:
        failures.append({'kind':'text-outside-page','items':out_of_bounds})
    all_text='\n'.join(p.extract_text() or '' for p in reader.pages)
    for notice in ['가상의 자체 기획 실습','실제 모집 아님','샘플']:
        if notice not in all_text:
            failures.append({'kind':'missing-edition-notice','text':notice})
    # Embedded typography is part of the portable PDF, not an OS substitution.
    fonts=sorted({str(f[3]) for page in doc for f in page.get_fonts(full=True)})
    if not any('NanumGothic' in f for f in fonts):
        failures.append({'kind':'font-missing','fonts':fonts})
    render_dir=output/'qa'/bid
    pngs=sorted(render_dir.glob('page-*.png'))
    corrupt=[]
    for path in pngs:
        try:
            with Image.open(path) as img:
                img.verify()
        except Exception as exc:
            corrupt.append({'path':str(path),'error':str(exc)})
    if require_renders and (len(pngs)!=26 or corrupt):
        failures.append({'kind':'incomplete-png-render','pageCount':len(pngs),'corrupt':corrupt})
    report={'bookId':bid,'sourceSha256':source_hash,'pdfSha256':pdf_hash,
            'physicalPages':len(reader.pages),'bodyPages':24,'checkedVisibleSourceStrings':checked,
            'missingVisibleSourceStrings':sum(p['missingStrings'] for p in page_checks),
            'sourceBodyPreserved':not any(f['kind']=='missing-visible-text' for f in failures),
            'sourceFileUnchanged':source_hash==prior['sourceSha256'],
            'contentsDestinationsCorrect':sorted(destinations)==list(range(2,26)),
            'fonts':fonts,'textOutsidePage':len(out_of_bounds),'renderedPngPages':len(pngs),
            'corruptRenderFiles':corrupt,'visualReview':'separate-required-gate',
            'pages':page_checks,'failures':failures,'pass':not failures}
    (output/(bid+'-content-qa.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False))
    return not failures


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('sources',type=Path,nargs='+')
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--require-renders',action='store_true')
    args=ap.parse_args()
    results=[check(source,args.output,args.require_renders) for source in args.sources]
    raise SystemExit(0 if all(results) else 1)


if __name__=='__main__':
    main()
