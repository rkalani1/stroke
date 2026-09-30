#!/usr/bin/env python3
"""Reproduce focused archived-document repairs from the recorded Git baseline.

Requires PyMuPDF and ReportLab. Originals are read from Git, never published as
backup downloads. Use --only with an exact document path to rebuild one file.
Clinical corrections and primary URLs are authored in pdf-repairs.json.
"""
import argparse, hashlib, io, json, subprocess, textwrap
from pathlib import Path
import fitz
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT=Path(__file__).resolve().parents[1]
fitz.TOOLS.set_small_glyph_heights(True)
parser=argparse.ArgumentParser()
parser.add_argument('--only')
parser.add_argument('--report',type=Path)
args=parser.parse_args()
manifest=json.loads((ROOT/'scripts/pdf-repairs.json').read_text())

def ascii_text(text):
    # Standard Helvetica's PDF character set; avoid silent missing-glyph boxes.
    for a,b in {'≥':'>=','≤':'<=','−':'-','–':'-','—':' - ','→':' -> ','µ':'micro','μ':'micro','²':'^2','°':' degrees ','…':'...'}.items(): text=text.replace(a,b)
    return text.encode('cp1252',errors='xmlcharrefreplace').decode('cp1252')

def wrap(text,width,size):
    lines=[]
    for paragraph in ascii_text(text).split('\n'):
        line=''
        for word in paragraph.split():
            if stringWidth((line+' '+word).strip(),'Helvetica',size)>width and line:
                lines.append(line);line=word
            else: line=(line+' '+word).strip()
        if line:lines.append(line)
    return lines

def correction_panel(width, entries):
    margin=24;size=11;leading=15
    blocks=[]
    for e in entries:
        lines=wrap(e['text'],width-2*margin,size)
        refs=[url for url in e['sources']]
        blocks.append((e,lines,refs))
    height=52+sum(len(lines)*leading+16+len(refs)*13+15 for _,lines,refs in blocks)
    buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(width,height))
    c.setFillColor(HexColor('#f1f5f9'));c.rect(0,0,width,height,fill=1,stroke=0)
    c.setFillColor(HexColor('#164e63'));c.rect(0,height-4,width,4,fill=1,stroke=0)
    c.setFont('Helvetica-Bold',12);c.drawString(margin,height-27,'Source-qualified teaching update | 30 September 2026')
    y=height-49
    for e,lines,refs in blocks:
        c.setFillColor(HexColor('#0f172a'));c.setFont('Helvetica',size)
        for line in lines:c.drawString(margin,y,line);y-=leading
        y-=4;c.setFont('Helvetica',9);c.setFillColor(HexColor('#075985'))
        for n,url in enumerate(refs,1):
            label=url.replace('https://','').replace('http://','')
            if stringWidth(label,'Helvetica',9)>width-2*margin:
                label='Primary source '+str(n)+' - '+url.split('/')[2]
            c.drawString(margin,y,label);c.linkURL(url,(margin,y-2,min(width-margin,margin+stringWidth(label,'Helvetica',9)),y+9),relative=0);y-=13
        y-=27
    assert y>=-1,(height,y)
    c.save();return fitz.open(stream=buf.getvalue(),filetype='pdf'),height

report=[]
for doc in manifest['documents']:
    if args.only and doc['path']!=args.only:continue
    raw=subprocess.check_output(['git','show',manifest['baseline']+':'+doc['path']],cwd=ROOT)
    assert hashlib.sha256(raw).hexdigest()==doc['baseline_sha256'],doc['path']
    original=fitz.open(stream=raw,filetype='pdf');original_page_count=len(original);result=fitz.open();actions=[]
    by_page={}
    for entry in doc['updates']:by_page.setdefault(entry['page'],[]).append(entry)
    for index,page in enumerate(original):
        entries=by_page.get(index+1,[])
        if not entries:
            result.insert_pdf(original,from_page=index,to_page=index);continue
        # Isolate each edited page before grafting. Mutating a previously grafted
        # source can invalidate PyMuPDF's object map and retain stale objects.
        edited=fitz.open()
        edited.insert_pdf(original,from_page=index,to_page=index)
        page=edited[0]
        rects=[]; inline=[]
        for e in entries:
            for phrase in e.get('remove_text',[]):
                found=page.search_for(phrase)
                if not found:raise ValueError(f'Missing exact redaction text: {doc["path"]} p{index+1}: {phrase}')
                rects.extend(found)
                replacement=e.get('inline_replacements',{}).get(phrase)
                if replacement:
                    for rect in found:
                        spans=[s for b in page.get_text('dict')['blocks'] for line in b.get('lines',[]) for s in line['spans'] if fitz.Rect(s['bbox']).intersects(rect)]
                        span=min(spans,key=lambda s:abs(s['origin'][1]-rect.y1))
                        inline.append((rect,replacement,span))
            rects.extend(fitz.Rect(r) for r in e.get('remove_regions',[]))
        for rect in rects:page.add_redact_annot(rect,fill=(1,1,1),cross_out=False)
        if rects:page.apply_redactions(images=2,graphics=0,text=0)
        for rect,text,span in inline:
            text=ascii_text(text)
            size=min(span['size'],rect.width/max(fitz.get_text_length(text,fontname='helv',fontsize=1),1))
            # Redactions have a white fill even on dark original slides.
            rgb=(.08,.08,.08)
            page.insert_text((rect.x0,span['origin'][1]),text,fontname='helv',fontsize=size,color=rgb)
        for e in entries:
            for replacement in e.get('region_replacements',[]):
                box=fitz.Rect(replacement['rect']);page.draw_rect(box,fill=(.95,.97,.98),color=None)
                padding=2 if box.height<40 else 8
                inset=box+fitz.Rect(padding,padding,-padding,-padding)
                size=replacement.get('size',14)
                while size>=11:
                    spare=page.insert_textbox(inset,ascii_text(replacement['text']),fontname='helv',fontsize=size,color=(.08,.25,.3))
                    if spare>=0:break
                    size-=1
                if spare<0:raise ValueError(('Replacement text overflow',doc['path'],index+1,replacement))
        panel,height=correction_panel(page.rect.width,entries)
        new=result.new_page(width=page.rect.width,height=page.rect.height+height)
        new.show_pdf_page(page.rect,edited,0)
        new.show_pdf_page(fitz.Rect(0,page.rect.height,page.rect.width,page.rect.height+height),panel,0)
        # show_pdf_page copies visible content, but not link annotations. Keep
        # the authored primary-source URI and translate its panel rectangle.
        for link in panel[0].get_links():
            if link['kind'] == fitz.LINK_URI:
                target = fitz.Rect(link['from']) + (0, page.rect.height, 0, page.rect.height)
                new.insert_link({'kind': fitz.LINK_URI, 'from': target, 'uri': link['uri']})
        edited.close();panel.close()
        actions.append({'page':index+1,'finding_ids':[x for e in entries for x in e['ids']], 'redaction_regions':len(rects),'correction_panel_height':height})
    result.set_metadata({**original.metadata,'subject':'Historical teaching material with source-qualified corrections, 2026-09-30','producer':'Stroke CDS archival correction pipeline'})
    output=ROOT/doc['path'];temporary=output.with_suffix('.repairing.pdf')
    result.save(temporary,garbage=4,deflate=True,clean=True)
    result.close();original.close()
    check=fitz.open(temporary)
    assert len(check)==original_page_count
    for number,entries in by_page.items():
        text=check[number-1].get_text()
        assert 'Source-qualified teaching update' in text
        expected_urls = sorted(url for entry in entries for url in entry['sources'])
        actual_urls = sorted(link['uri'] for link in check[number-1].get_links() if link['kind'] == fitz.LINK_URI)
        assert actual_urls == expected_urls, ('Source link annotations differ', doc['path'], number)
        for entry in entries:
            # Source-specific removal assertions are before added prose, to permit
            # corrections to explicitly discuss the old number when necessary.
            original_area=check[number-1].get_text(clip=fitz.Rect(0,0,check[number-1].rect.width,check[number-1].rect.height-correction_panel(check[number-1].rect.width,entries)[1]))
            for phrase in entry.get('remove_text',[]):
                assert not check[number-1].search_for(phrase,clip=fitz.Rect(0,0,check[number-1].rect.width,check[number-1].rect.height-correction_panel(check[number-1].rect.width,entries)[1])),(doc['path'],number,phrase)
    check.close();temporary.replace(output)
    report.append({'path':doc['path'],'baseline_sha256':doc['baseline_sha256'],'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'pages_repaired':actions,'acceptance':'Actual redactions applied, streams garbage-collected, source panels and original-region text checks passed; rendered checks tracked separately.'})
    print(doc['path'],len(actions),'pages repaired')
if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
