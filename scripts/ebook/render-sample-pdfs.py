#!/usr/bin/env python3
"""Render stable-page sample manuscripts without rewriting source content.

Dependencies: reportlab, pypdf, Pillow, Poppler (optional PNG rendering).
Each source body unit occupies exactly one physical page. The renderer measures
every flowable before drawing and refuses unresolved overflows. Cover and contents
are front matter and are never included in the 24-page body count.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse
from xml.sax.saxutils import escape

from PIL import Image as PILImage, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Flowable, Image, Paragraph, Table, TableStyle


INK = colors.HexColor('#172B46')
MUTED = colors.HexColor('#52647A')
LINE = colors.HexColor('#D5DFE9')
PAPER = colors.HexColor('#F8FAFC')
PALE = colors.HexColor('#EDF4FB')
ACCENTS = {'sns-entry': '#1769CE', 'video-entry': '#086D72', 'ai-entry': '#6851A3'}
SUBJECTS = {'sns-entry': 'SNS', 'video-entry': '영상 편집', 'ai-entry': 'AI 활용'}
FORMATS = {'a5': (148 * mm, 210 * mm), '160x240': (160 * mm, 240 * mm),
           'b5': (176 * mm, 250 * mm), 'a4': (210 * mm, 297 * mm)}
FONT = 'NanumGothic'
BOLD = 'NanumGothicBold'


def text_html(text: object) -> str:
    # Only escape source text; markup is owned by this renderer.
    safe = escape(str(text)).replace('\n', '<br/>')
    # NanumGothic has no U+2212 glyph. Preserve the manuscript's mathematical
    # minus exactly, using a supported glyph rather than changing source text.
    return safe.replace('−', '<font face="MathSymbols">−</font>')


def register_fonts(font_dir: Path) -> None:
    for name, filename in [(FONT, 'NanumGothic-Regular.ttf'), (BOLD, 'NanumGothic-Bold.ttf')]:
        path = font_dir / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=BOLD, italic=FONT, boldItalic=BOLD)
    symbol_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    if not symbol_path.is_file():
        raise FileNotFoundError(f'Math symbol font required: {symbol_path}')
    pdfmetrics.registerFont(TTFont('MathSymbols', str(symbol_path)))


@dataclass(frozen=True)
class Settings:
    font: float = 11.0
    leading: float = 16.0
    table_font: float = 10.0
    table_leading: float = 14.1
    gap: float = 8.0
    pad: float = 8.0
    image_max: float = 285.0


class Box(Flowable):
    def __init__(self, children, width, *, fill=PALE, border=None, pad=8, gap=4):
        super().__init__()
        self.children = children
        self.width = width
        self.fill = fill
        self.border = border
        self.pad = pad
        self.gap = gap

    def wrap(self, availWidth, availHeight):
        self.width = min(self.width, availWidth)
        inner = self.width - self.pad * 2
        self.measured = [(f, f.wrap(inner, 10000)[1]) for f in self.children]
        self.height = self.pad * 2 + sum(h for _, h in self.measured) + self.gap * max(0, len(self.measured)-1)
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(self.fill)
        c.setStrokeColor(self.border or self.fill)
        c.roundRect(0, 0, self.width, self.height, 5, fill=1, stroke=int(self.border is not None))
        y = self.height - self.pad
        for f, h in self.measured:
            y -= h
            f.drawOn(c, self.pad, y)
            y -= self.gap


class Renderer:
    def __init__(self, args):
        self.args = args
        self.page_w, self.page_h = FORMATS[args.paper]
        self.margin = 32 if args.paper in ('a5', '160x240') else 35
        self.width = self.page_w - 2 * self.margin
        self.bottom = 47
        self.assets = args.assets
        self.layout = []
        self.diagnostics = []
        self.settings = Settings()
        self.accent = colors.HexColor('#1769CE')

    def style(self, name='body', *, s=None, color=None, bold=False, size=None, leading=None):
        s = s or self.settings
        fs = size if size is not None else s.font
        lead = leading if leading is not None else s.leading
        return ParagraphStyle(name, fontName=BOLD if bold else FONT, fontSize=fs,
                              leading=lead, textColor=color or INK, wordWrap=None,
                              splitLongWords=True, allowWidows=0, allowOrphans=0,
                              alignment=TA_LEFT, spaceBefore=0, spaceAfter=0)

    def p(self, text, *, s=None, **kwargs):
        return Paragraph(text_html(text), self.style(s=s, **kwargs))

    def rich(self, markup, *, s=None, **kwargs):
        return Paragraph(markup, self.style(s=s, **kwargs))

    def source_links(self, items, s):
        result = [self.p('공식 자료', s=s, size=8.4, leading=11, bold=True, color=MUTED)]
        for src in items:
            title = text_html(src['title'])
            publisher = src.get('publisher')
            label = title + (f' · {text_html(publisher)}' if publisher else '')
            result.append(self.rich(f'<link href="{escape(src["url"], {chr(34): "&quot;"})}" color="{self.accent.hexval()}">{label}</link>',
                                    s=s, size=8.4, leading=11.7))
        return Box(result, self.width, fill=PAPER, pad=6, gap=3)

    def table(self, block, s):
        cols = block['columns']
        n = len(cols)
        if n == 2:
            ratios = [0.27, 0.73]
        elif n == 3:
            ratios = [0.23, 0.385, 0.385]
        elif n == 4:
            ratios = [0.22, 0.26, 0.26, 0.26]
        else:
            ratios = [1/n]*n
        data = [[self.p(x, s=s, size=s.table_font, leading=s.table_leading, bold=True, color=colors.white) for x in cols]]
        for row in block['rows']:
            if len(row) != n:
                raise ValueError(f'Column mismatch in {block["blockId"]}')
            data.append([self.p(x, s=s, size=s.table_font, leading=s.table_leading) for x in row])
        t = Table(data, colWidths=[self.width*r for r in ratios], hAlign='LEFT', repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.accent),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 7), ('RIGHTPADDING', (0,0), (-1,-1), 7),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, LINE),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, PAPER]),
        ]))
        flows = []
        if block.get('caption'):
            flows.append(self.p(block['caption'], s=s, size=10.3, leading=14, bold=True))
        flows.append(t)
        return flows

    def block_flows(self, block, s):
        t = block['type']
        if t == 'paragraph':
            return [self.p(block['text'], s=s)]
        if t == 'heading':
            return [self.p(block['text'], s=s, bold=True, size=13.2, leading=18)]
        if t == 'table':
            return self.table(block, s)
        if t in ('list', 'checklist'):
            items = []
            for i, value in enumerate(block['items'], 1):
                prefix = f'{i}. ' if block.get('ordered') else ('□ ' if t == 'checklist' else '• ')
                items.append(self.p(prefix+value, s=s))
            if t == 'checklist':
                return [Box(items, self.width, fill=PAPER, border=LINE, pad=s.pad, gap=3)]
            return items
        if t == 'steps':
            items = []
            for i, step in enumerate(block['items'], 1):
                items.append(self.rich(f'<b>{i}. {text_html(step["title"])}</b><br/>{text_html(step["text"])}', s=s))
                if step.get('output'):
                    items.append(self.p('남길 결과  '+step['output'], s=s, size=9.6, leading=13.4, color=MUTED))
            return [Box(items, self.width, fill=PAPER, pad=s.pad, gap=4)]
        if t == 'callout':
            children = []
            if block.get('title'):
                children.append(self.p(block['title'], s=s, bold=True, size=10.5, leading=14.3, color=self.accent))
            children.append(self.p(block['text'], s=s))
            return [Box(children, self.width, fill=PALE, pad=s.pad, gap=4)]
        if t == 'template':
            children = [self.p(block['title'], s=s, bold=True, size=10.5, leading=14.2, color=self.accent),
                        self.p(block['text'], s=s, size=s.font, leading=s.leading)]
            return [Box(children, self.width, fill=colors.HexColor('#F5F6F8'), border=LINE, pad=s.pad, gap=6)]
        if t == 'exercise':
            children = [self.p(block['title'], s=s, bold=True, size=11.1, leading=15.1, color=self.accent)]
            if block.get('goal'):
                children.append(self.rich('<b>목표</b>  '+text_html(block['goal']), s=s))
            children.extend(self.p(f'{i}. {v}', s=s) for i, v in enumerate(block.get('steps', []),1))
            if block.get('expectedOutput'):
                children.append(self.rich('<b>완성 결과</b>  '+text_html(block['expectedOutput']), s=s))
            if block.get('checks'):
                children.extend(self.p('□ '+v, s=s) for v in block['checks'])
            if block.get('solution'):
                children.append(self.rich('<b>풀이</b>  '+text_html(block['solution']), s=s))
            return [Box(children, self.width, fill=colors.HexColor('#F3F7F2'), border=colors.HexColor('#D8E4D5'), pad=s.pad, gap=4)]
        if t == 'sources':
            return [self.source_links(block['items'], s)]
        if t == 'image':
            path = self.assets / (block['assetId']+'.png')
            if not path.is_file():
                raise FileNotFoundError(f'Missing asset {block["assetId"]}: {path}')
            with PILImage.open(path) as im:
                iw, ih = im.size
            # Actual image proportions, never manuscript placeholder dimensions.
            max_h = s.image_max
            if block['assetId'].startswith('bookmark-'):
                max_h = min(max_h, 215)
            scale = min(self.width/iw, max_h/ih)
            flow = Image(str(path), width=iw*scale, height=ih*scale, hAlign='CENTER')
            flow._alt_text = block.get('alt','')
            children = [flow]
            if block.get('caption'):
                children.append(self.p(block['caption'], s=s, size=8.7, leading=12.0, color=MUTED))
            if block.get('credit'):
                children.append(self.p(block['credit'], s=s, size=7.7, leading=10.4, color=MUTED))
            return children
        raise ValueError(f'Unsupported block type: {t}')

    def body_layout(self, page, s):
        title = self.p(page['title'], s=s, bold=True, size=17.5, leading=23)
        th = title.wrap(self.width, 1000)[1]
        top = self.page_h - 60 - th - 17
        entries = []
        for block in page['blocks']:
            flows = self.block_flows(block, s)
            for j, flow in enumerate(flows):
                _, h = flow.wrap(self.width, 10000)
                gap = (4 if j else s.gap)
                entries.append((block['blockId'], flow, h, gap))
        if entries:
            entries[0] = (*entries[0][:3], 0)
        needed = sum(h+gap for _, _, h, gap in entries)
        return title, th, top, entries, needed, top-self.bottom

    def choose_layout(self, page):
        variants = [Settings(),
                    Settings(leading=15.3, table_leading=13.6, gap=6, pad=7, image_max=270),
                    Settings(font=10.6, leading=14.6, table_font=9.7, table_leading=13.2, gap=5.5, pad=6.5, image_max=255)]
        last = None
        for idx, s in enumerate(variants):
            layout = self.body_layout(page, s)
            last = (idx, s, layout)
            if layout[-2] <= layout[-1]:
                return last
        return last

    def line(self, c, y):
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(self.margin, y, self.page_w-self.margin, y)

    def common_footer(self, c, book, page_number=None):
        self.line(c, 36)
        c.setFillColor(MUTED)
        c.setFont(FONT, 7.3)
        c.drawString(self.margin, 23, '가상의 자체 기획 실습 · 실제 모집 아님')
        if page_number is not None:
            c.setFillColor(self.accent)
            c.setFont(BOLD, 10)
            c.drawRightString(self.page_w-self.margin, 22, str(page_number))

    def draw_par(self, c, text, x, y, width, *, size, leading=None, bold=False, color=None):
        flow = self.p(text, size=size, leading=leading or size*1.45, bold=bold, color=color)
        _, h = flow.wrap(width, 2000)
        flow.drawOn(c, x, y-h)
        return y-h

    def cover(self, c, book):
        c.setFillColor(PAPER)
        c.rect(0, 0, self.page_w, self.page_h, fill=1, stroke=0)
        c.setFillColor(self.accent)
        c.rect(0, self.page_h-12, self.page_w, 12, fill=1, stroke=0)
        y = self.page_h-55
        y = self.draw_par(c, 'PERSONAL EDU PROJECT', self.margin,y,self.width,size=10.5,bold=True,color=self.accent)
        y -= 24
        y = self.draw_par(c, book['title'],self.margin,y,self.width,size=31,leading=40,bold=True)
        y -= 13
        y = self.draw_par(c, book.get('subtitle',''),self.margin,y,self.width,size=14,leading=21,color=MUTED)
        y -= 15
        y = self.draw_par(c, '입문 샘플판 · 한 장의 완결 실습',self.margin,y,self.width,size=11,bold=True,color=self.accent)
        y -= 20
        path = self.assets/'bookmark-finished.png'
        with PILImage.open(path) as im:
            iw, ih = im.size
        avail = min(250, y-185)
        scale = min(self.width/iw, avail/ih)
        w,h = iw*scale,ih*scale
        c.drawImage(str(path), self.margin+(self.width-w)/2, y-h, w,h, preserveAspectRatio=True,mask='auto')
        y -= h+9
        y = self.draw_par(c, '책갈피 만들기 · AI 생성 학습용 사진',self.margin,y,self.width,size=8.5,color=MUTED)
        y -= 14
        y = self.draw_par(c, '표지·목차를 제외한 본문 24쪽',self.margin,y,self.width,size=12,bold=True)
        y -= 7
        y = self.draw_par(c, book.get('editionLabel',''),self.margin,y,self.width,size=9.4,color=MUTED)
        y -= 12
        self.draw_par(c, '가상의 자체 기획 실습입니다. 실제 모집을 진행하지 않습니다. 정규 교재의 완성본이 아닌 샘플 장입니다.',self.margin,y,self.width,size=9.7,leading=14.2)
        self.common_footer(c,book)
        c.showPage()

    def contents(self, c, book):
        c.bookmarkPage('contents')
        c.addOutlineEntry('목차', 'contents', 0, closed=False)
        y = self.page_h-46
        y = self.draw_par(c, '차례',self.margin,y,self.width,size=22,bold=True)
        y -= 10
        y = self.draw_par(c, book['chapters'][0]['title'],self.margin,y,self.width,size=11.2,leading=16,bold=True,color=self.accent)
        y -= 13
        # A single list preserves reading order. Titles are clickable internal links.
        row_height = min(19.3, (y-155)/24)
        for page in book['pages']:
            pno = page['pageNumber']
            c.setFillColor(self.accent)
            c.setFont(BOLD, 9.5)
            c.drawString(self.margin,y-11,f'{pno:02}')
            title = self.rich(f'<link href="#{escape(page["pageId"])}">{text_html(page["title"])}</link>',
                              size=9.5,leading=12.3)
            _, h = title.wrap(self.width-37,1000)
            if h > row_height+0.1:
                raise ValueError(f'Contents row overflow: {book["bookId"]} {pno}')
            title.drawOn(c,self.margin+30,y-h)
            y -= row_height
        y -= 9
        self.line(c,y)
        y -= 10
        y = self.draw_par(c, '이 샘플을 읽는 방법',self.margin,y,self.width,size=9.4,bold=True)
        y -= 4
        y = self.draw_par(c, '목차 제목을 누르면 해당 본문으로 이동합니다. ‘공식 자료’의 제목은 원문 링크입니다. 우하단 숫자는 본문 쪽 번호입니다.',self.margin,y,self.width,size=8.7,leading=12.4)
        y -= 6
        self.draw_par(c, '공식 문서 확인 기준: 2026-11-06. Android 앱의 실제 실행·현재 메뉴·결제 여부는 별도 실기 확인이 필요합니다.',self.margin,y,self.width,size=8.3,leading=11.6,color=MUTED)
        self.common_footer(c,book)
        c.showPage()

    def draw_body(self,c,book,page,selection):
        variant,s,(title,th,top,entries,needed,available) = selection
        if needed > available+0.1:
            raise ValueError(f'Body overflow: {book["bookId"]} p{page["pageNumber"]}: {needed:.1f}>{available:.1f}')
        c.bookmarkPage(page['pageId'])
        c.addOutlineEntry(f'{page["pageNumber"]:02} {page["title"]}',page['pageId'],1,closed=False)
        c.setFillColor(MUTED)
        c.setFont(FONT,8.0)
        c.drawString(self.margin,self.page_h-28,book['title']+' · 입문 샘플판')
        c.setFillColor(self.accent)
        c.setFont(BOLD,8.0)
        c.drawRightString(self.page_w-self.margin,self.page_h-28,'본문 '+f'{page["pageNumber"]:02} / 24')
        self.line(c,self.page_h-38)
        title.drawOn(c,self.margin,self.page_h-60-th)
        y=top
        rects=[]
        for block_id,f,h,gap in entries:
            y-=gap+h
            x=self.margin
            if isinstance(f,Image):
                x+=(self.width-f.drawWidth)/2
            f.drawOn(c,x,y)
            rects.append({'blockId':block_id,'x':round(x,2),'y':round(y,2),'height':round(h,2),'width':round(getattr(f,'drawWidth',self.width),2)})
        self.common_footer(c,book,page['pageNumber'])
        self.layout.append({'bookId':book['bookId'],'pageId':page['pageId'],'bodyPage':page['pageNumber'],
                            'pdfPage':page['pageNumber']+2,'variant':variant,'bodyFont':s.font,
                            'tableFont':s.table_font,'contentHeight':round(needed,2),'availableHeight':round(available,2),
                            'bottomY':round(y,2),'overflow':False,'blocks':rects})
        c.showPage()

    def build(self,path):
        source=path.read_bytes()
        book=json.loads(source)
        if len(book['pages'])!=24 or [p['pageNumber'] for p in book['pages']]!=list(range(1,25)):
            raise ValueError(f'{path}: source must contain exactly 24 ordered body pages')
        self.accent=colors.HexColor(ACCENTS[book['bookId']])
        measured=[self.choose_layout(page) for page in book['pages']]
        failures=[]
        for page,(variant,s,layout) in zip(book['pages'],measured):
            needed,available=layout[-2:]
            self.diagnostics.append({'bookId':book['bookId'],'page':page['pageNumber'],'title':page['title'],
                                     'variant':variant,'bodyFont':s.font,'required':round(needed,2),
                                     'available':round(available,2),'overflow':round(max(0,needed-available),2)})
            if needed>available+0.1:
                failures.append((page['pageNumber'],round(needed-available,1)))
        if self.args.measure_only:
            print(json.dumps({'bookId':book['bookId'],'paper':self.args.paper,'overflow':failures,
                              'maxUsed':max(round(m[2][-2]/m[2][-1],3) for m in measured)},ensure_ascii=False))
            return
        if failures:
            raise ValueError(f'{book["bookId"]} unresolved overflows: {failures}')
        output=self.args.output/(book['bookId']+'-sample.pdf')
        c=canvas.Canvas(str(output),pagesize=(self.page_w,self.page_h),pageCompression=1)
        c.setTitle(book['title']+' - 입문 샘플판')
        c.setAuthor('Personal Edu Project')
        c.setSubject(book.get('subtitle',''))
        self.cover(c,book)
        self.contents(c,book)
        for page,chosen in zip(book['pages'],measured):
            self.draw_body(c,book,page,chosen)
        c.save()
        reader=PdfReader(str(output))
        if len(reader.pages)!=26:
            raise AssertionError(f'{output}: expected 26 physical pages')
        uris=[]
        internal=0
        for page in reader.pages:
            for annot in page.get('/Annots',[]):
                obj=annot.get_object()
                action=obj.get('/A',{})
                if action.get('/URI'):
                    uris.append(str(action['/URI']))
                if obj.get('/Dest') or action.get('/S')=='/GoTo':
                    internal+=1
        expected=[i['url'] for p in book['pages'] for b in p['blocks'] if b['type']=='sources' for i in b['items']]
        missing=[url for url in expected if url not in uris]
        if missing:
            raise AssertionError(f'Missing source links: {missing}')
        report={'bookId':book['bookId'],'source':str(path),'sourceSha256':hashlib.sha256(source).hexdigest(),
                'output':str(output),'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),
                'paper':self.args.paper,'dimensionsMm':[round(self.page_w/mm,1),round(self.page_h/mm,1)],
                'physicalPages':len(reader.pages),'bodyPages':24,'sourceLinkOccurrences':len(expected),
                'externalLinkAnnotations':len(uris),'internalLinkAnnotations':internal,'missingLinks':missing,
                'sourceWasModified':path.read_bytes()!=source,'font':'NanumGothic Regular/Bold',
                'mathFallback':'DejaVu Sans for U+2212 only; source character preserved',
                'minBodyFont':min(x[1].font for x in measured),'minTableFont':min(x[1].table_font for x in measured),
                'overflowPages':failures}
        (self.args.output/(book['bookId']+'-validation.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(report,ensure_ascii=False))
        if self.args.render:
            dest=self.args.output/'qa'/book['bookId']
            dest.mkdir(parents=True,exist_ok=True)
            subprocess.run(['pdftoppm','-png','-r',str(self.args.dpi),str(output),str(dest/'page')],check=True)
            self.contact_sheets(dest,book['bookId'])

    def contact_sheets(self,directory,book_id):
        files=sorted(directory.glob('page-*.png'))
        thumb_w=260
        pad=18
        label_h=24
        font=ImageFont.truetype(str(self.args.font_dir/'NanumGothic-Regular.ttf'),13)
        for start in range(0,len(files),8):
            group=files[start:start+8]
            thumbs=[]
            for file in group:
                with PILImage.open(file) as im:
                    im=im.convert('RGB')
                    th=round(im.height*thumb_w/im.width)
                    im=im.resize((thumb_w,th),PILImage.Resampling.LANCZOS)
                    thumbs.append((file,im))
            row_h=max(im.height for _,im in thumbs)+label_h
            out=PILImage.new('RGB',(2*thumb_w+3*pad,math.ceil(len(thumbs)/2)*row_h+(math.ceil(len(thumbs)/2)+1)*pad),'#E4EAF1')
            draw=ImageDraw.Draw(out)
            for j,(file,im) in enumerate(thumbs):
                x=pad+(j%2)*(thumb_w+pad)
                y=pad+(j//2)*(row_h+pad)
                out.paste(im,(x,y+label_h))
                num=int(file.stem.split('-')[-1])
                label='표지' if num==1 else ('목차' if num==2 else f'본문 {num-2}쪽')
                draw.text((x,y),f'{book_id} | {label}',font=font,fill='#172B46')
            out.save(directory/f'contact-{start//8+1:02}.png')


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('sources',type=Path,nargs='+')
    ap.add_argument('--assets',type=Path,required=True)
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--font-dir',type=Path,default=Path.home()/'.local/share/fonts/personal-edu')
    ap.add_argument('--paper',choices=FORMATS,default='a4')
    ap.add_argument('--measure-only',action='store_true')
    ap.add_argument('--render',action='store_true')
    ap.add_argument('--dpi',type=int,default=120)
    args=ap.parse_args()
    register_fonts(args.font_dir)
    args.output.mkdir(parents=True,exist_ok=True)
    renderer=Renderer(args)
    for path in args.sources:
        renderer.build(path)
    (args.output/'layout-measurements.json').write_text(json.dumps(renderer.diagnostics,ensure_ascii=False,indent=2)+'\n')
    if not args.measure_only:
        (args.output/'layout-boxes.json').write_text(json.dumps(renderer.layout,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    main()
