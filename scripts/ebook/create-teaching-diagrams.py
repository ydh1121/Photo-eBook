#!/usr/bin/env python3
"""Original Korean teaching diagrams, independent of any app's UI."""
import argparse
from pathlib import Path
from html import escape
try:
    import cairosvg
except ImportError:
    cairosvg = None

PAPER='#f8fafc'; INK='#172b46'; MUTED='#52647a'; BLUE='#1769ce'; PALE='#e8f1ff'; LINE='#cbd7e6'
class Diagram:
    def __init__(self, slug, title, description, width=1100, height=740):
        self.slug,self.width,self.height=slug,width,height
        self.parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="{slug}-title {slug}-desc"><title id="{slug}-title">{escape(title)}</title><desc id="{slug}-desc">{escape(description)}</desc><style>text {{font-family: NanumGothic,sans-serif;}}</style>',f'<rect width="{width}" height="{height}" fill="{PAPER}"/>']
        self.text(48,55,'모바일 실습 · 직접 그린 학습 도해',19,MUTED)
        self.text(48,108,title,34,INK,bold=True)
        self.parts.append(f'<path d="M48 135H{width-48}" stroke="{LINE}"/>')
    def rect(self,x,y,w,h,fill='white',stroke=LINE,r=8): self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>')
    def line(self,x1,y1,x2,y2,color=LINE,width=2): self.parts.append(f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{width}"/>')
    def text(self,x,y,text,size=25,color=INK,bold=False,anchor='start'):
        for i,line in enumerate(str(text).split('\n')): self.parts.append(f'<text x="{x}" y="{y+i*size*1.45}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}" text-anchor="{anchor}">{escape(line)}</text>')
    def arrow(self,x1,y1,x2,y2,color=BLUE):
        self.line(x1,y1,x2,y2,color,3)
        if x2>x1: self.parts.append(f'<path d="M{x2-9} {y2-6}L{x2} {y2}L{x2-9} {y2+6}" fill="none" stroke="{color}" stroke-width="3"/>')
        else: self.parts.append(f'<path d="M{x2-6} {y2-9}L{x2} {y2}L{x2+6} {y2-9}" fill="none" stroke="{color}" stroke-width="3"/>')
    def book(self,x,y,w,h):
        self.rect(x,y,w,h,'#fff8e8','#ad9d7d',3); self.line(x+12,y,x+12,y+h,'#d1c4a7',2)
    def bookmark(self,x,y,w,h,leaf=True):
        self.rect(x,y,w,h,'#f7df87','#d8bd68',1)
        if leaf:
            self.line(x+w*.4,y+h*.15,x+w*.65,y+h*.45,BLUE,3)
            for j in range(3): self.parts.append(f'<ellipse cx="{x+w*(.35+j*.1)}" cy="{y+h*(.19+j*.09)}" rx="{w*.14}" ry="{h*.025}" fill="{BLUE}" transform="rotate(-30 {x+w*(.35+j*.1)} {y+h*(.19+j*.09)})"/>')
    def save(self,out):
        self.text(48,self.height-28,'Personal Edu · 앱 화면을 재현한 그림이 아닙니다',17,MUTED)
        svg=''.join(self.parts)+'</svg>'; (out/'svg').mkdir(parents=True,exist_ok=True);(out/'png').mkdir(exist_ok=True)
        (out/'svg'/f'{self.slug}.svg').write_text(svg)
        if cairosvg:
            cairosvg.svg2png(bytestring=svg.encode(),write_to=str(out/'png'/f'{self.slug}.png'))

def build(out):
    d=Diagram('sns-platform-roles','같은 책갈피, 플랫폼에 맞는 소개','사진 게시물, 30초 영상, 짧은 대화의 역할을 자체 기획 사례에 연결한 비교')
    rows=[('Instagram','사진 한 장과 게시글','재료·완성 모습을 보여주고\n날짜·준비물·신청 방법을 적어요.'),('YouTube','30초 세로 영상','다섯 장면을 순서대로 이어\n만드는 과정을 보여줘요.'),('Threads','짧은 글과 답글','“어떤 문구를 쓰고 싶나요?”\n질문하고 받은 답에 응답해요.')]
    for i,(name,fmt,body) in enumerate(rows):
        y=172+i*155;d.rect(48,y,1004,130);d.text(74,y+44,name,29,BLUE,True);d.text(300,y+42,fmt,25,INK,True);d.text(575,y+40,body,24)
    d.text(48,665,'이번 실습에서의 역할입니다. 세 플랫폼의 모든 기능을 분류한 표는 아닙니다.',21,MUTED);d.save(out)

    d=Diagram('sns-caption-anatomy','게시글에 빠지면 안 되는 네 가지','활동, 참여 조건, 준비, 다음 행동을 구분하고 자체 기획 실습 표시를 별도로 유지하는 게시글 구조',1100,800)
    rows=[('01','활동','읽던 책에 꽂을 책갈피를 함께 만들어요.'),('02','참여 조건','11월 14일(토) 14~15시 · 정원 6명 · 무료'),('03','준비','종이·파란 펜 제공 / 읽던 책 1권 준비'),('04','다음 행동','신청 안내 문구 연습: 계정 메시지로 ‘책갈피’')]
    for i,(n,label,body) in enumerate(rows):
        y=172+i*110;d.rect(48,y,1004,94);d.text(70,y+50,n,25,BLUE,True);d.text(135,y+50,label,25,INK,True);d.text(350,y+50,body,23)
    d.rect(48,624,1004,58,PALE);d.text(72,661,'가상의 자체 기획 실습 · 실제 모집 아님',24,BLUE,True)
    d.text(48,722,'장소는 사실카드의 가상 장소 표기를 게시글에 함께 적습니다.',22,MUTED);d.save(out)

    d=Diagram('video-window-light','창가에서 손과 종이를 촬영하는 자리','창 빛이 옆에서 들어오게 놓고 휴대전화를 고정하는 위치')
    d.rect(54,190,88,386,PALE,BLUE);d.text(98,370,'창',29,BLUE,True,'middle')
    for y in [260,350,440]:d.arrow(160,y,325,y,'#e3b242')
    d.rect(350,183,620,395,'#f5e6cf','#bcaa8e');d.text(380,222,'책상',24,MUTED)
    d.bookmark(570,265,78,260);d.rect(710,282,100,185,'#fafcff',INK);d.rect(724,300,72,140,PALE,LINE);d.text(760,495,'고정한 휴대전화',23,INK,False,'middle')
    d.arrow(695,380,655,380);d.text(674,350,'촬영 방향',18,BLUE,False,'middle');d.text(550,614,'손 그림자가 종이를 가리면\n종이와 휴대전화를 조금씩 옮겨 비교하세요.',25)
    d.text(170,595,'창을 등지고 서면\n종이에 그림자가 생겨요.',23,MUTED);d.save(out)

    d=Diagram('video-shot-distances','전체 · 중간 · 가까운 화면','같은 소재도 거리별로 보여주는 정보가 달라진다')
    for i,(title,body) in enumerate([('전체','책·종이·펜의 관계'),('중간','종이와 손의 동작'),('가까이','잎무늬와 펜 끝')]):
        x=48+i*344;d.rect(x,188,316,340);d.text(x+158,568,title,29,BLUE,True,'middle');d.text(x+158,612,body,22,INK,False,'middle')
        if i==0:d.book(x+22,268,147,185);d.bookmark(x+199,287,43,153);d.line(x+278,282,x+278,458,BLUE,7)
        elif i==1:d.bookmark(x+112,220,92,277);d.line(x+235,270,x+182,338,BLUE,8);d.rect(x+215,220,85,50,'#e8bd9e','#d0a283',15)
        else:d.bookmark(x+62,206,194,310);d.line(x+290,255,x+183,330,BLUE,13)
    d.save(out)

    d=Diagram('video-timeline-30s','다섯 장면으로 만드는 30초','6초씩 다섯 장면을 이어 30초 영상과 자막을 완성하는 타임라인',1100,780)
    labels=[('재료 전체','행사명'),('잎무늬 그리기','날짜·시간'),('문구 쓰기','재료·준비물'),('책에 꽂기','정원·참가비'),('완성 전체','메시지 안내')]
    for i,(scene,caption) in enumerate(labels):
        x=48+i*201;d.rect(x,210,188,110,PALE if i==0 else 'white',BLUE if i==0 else LINE);d.text(x+94,251,scene,23,INK,True,'middle');d.text(x+94,290,'6초',23,BLUE,False,'middle');d.text(x,355,str(i*6)+'초',22,MUTED)
        d.text(x+94,415,caption,22,INK,False,'middle')
    d.text(1051,355,'30초',22,MUTED,False,'end');d.line(48,337,1052,337,INK,2)
    d.rect(48,478,1004,140,'#edf4fb');d.text(75,522,'전 구간에 남기는 작은 안내',24,BLUE,True);d.text(75,570,'연습용 · 실제 모집 아님',31,INK,True)
    d.text(48,683,'시작과 끝을 먼저 정한 뒤, 각 장면의 길이를 6초로 맞춥니다.',25);d.save(out)

    d=Diagram('video-trim-vs-split','길이 다듬기와 분할은 무엇이 다를까요?','10초 원본에서 2초부터 8초까지 남기는 다듬기와, 2초와 8초에서 세 조각으로 나누는 분할',1100,800)
    d.text(48,194,'길이 다듬기',28,BLUE,True);d.text(310,194,'양 끝을 줄여 필요한 6초를 남깁니다.',24)
    x,y=70,240
    for i in range(10):d.rect(x+i*96,y,94,70,PALE if 2<=i<8 else '#e5e7eb',LINE,0)
    for i in [0,2,8,10]:d.text(x+i*96,y+102,f'{i}초',21,MUTED,False,'middle')
    d.text(550,385,'사용하는 구간 2~8초 → 결과 6초',25,INK,True,'middle')
    d.text(48,455,'분할',28,BLUE,True);d.text(310,455,'2초와 8초에서 나누어 세 조각을 만듭니다.',24)
    d.rect(70,500,184,75,'#e5e7eb',LINE,0);d.rect(266,500,568,75,PALE,BLUE,0);d.rect(846,500,184,75,'#e5e7eb',LINE,0)
    d.text(162,546,'앞 2초',26,MUTED,True,'middle');d.text(550,546,'가운데 6초',26,BLUE,True,'middle');d.text(938,546,'뒤 2초',26,MUTED,True,'middle')
    d.text(550,632,'분할만 하면 전체 길이는 10초입니다.',25,INK,True,'middle');d.text(550,681,'앞뒤 조각을 삭제하면 가운데 6초가 남습니다.',24,MUTED,False,'middle');d.save(out)

    d=Diagram('video-caption-legibility','자막은 휴대전화 화면에서 읽어 보세요','작고 흐린 글씨와 충분한 크기 및 배경 대비를 갖춘 자막의 비교')
    for i in range(2):
        x=48+i*520;d.rect(x,190,484,350,'#eee0c4','#d5c2a1');d.book(x+60,225,185,260);d.bookmark(x+291,250,80,240)
        if i==0:d.text(x+242,475,'종이·파란 펜 제공',16,'#fffdf3',False,'middle');d.text(x+242,500,'읽던 책 1권 준비',16,'#fffdf3',False,'middle')
        else:d.rect(x+20,397,444,114,'#172b46','#172b46',5);d.text(x+242,443,'종이·파란 펜 제공',31,'white',True,'middle');d.text(x+242,487,'읽던 책 1권 준비',31,'white',True,'middle')
    d.text(290,591,'작고 밝은 글씨',27,MUTED,True,'middle');d.text(810,591,'큰 글씨 · 짧은 두 줄',27,BLUE,True,'middle');d.text(48,654,'중요한 손동작을 가리지 않도록 위치도 함께 조정합니다.',24);d.save(out)

    d=Diagram('ai-before-shoot','AI가 만든 준비표, 촬영 전에 확인할 세 가지','AI가 정리한 준비표를 원자료와 대조하고 실제 재료와 화면에서 직접 확인하는 순서')
    columns=[('01','사실 카드와 대조','날짜 · 시간 · 정원 · 비용','14일 14~15시\n6명 · 무료'),('02','장면과 자막 대조','5장면 × 6초 = 30초','장면에 맞는 자막\n연습 표시 유지'),('03','현장에서 직접 확인','책 · 종이 · 파란 펜','빛 · 손 그림자\n글씨 · 촬영 동선')]
    for i,(n,title,subtitle,body) in enumerate(columns):
        x=48+i*344;d.rect(x,187,316,370);d.text(x+26,235,n,23,BLUE,True);d.text(x+26,289,title,26,INK,True);d.text(x+26,338,subtitle,20,MUTED);d.rect(x+20,377,276,137,PALE);d.text(x+40,424,body,25)
    d.text(48,623,'대화에 적힌 문장만으로 실제 재료와 촬영 조건을 확인할 수는 없습니다.',23)
    d.text(48,667,'가상의 자체 기획 실습 · 실제 모집 아님',22,BLUE,True);d.save(out)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True);build(args.output);print('Created 8 original SVG teaching diagrams; render PNG with scripts/ebook/render-diagrams.mjs if CairoSVG is unavailable')
