#!/usr/bin/env python3
"""Reproduce the three targeted AF archive repairs from a fixed Git baseline.

Real PDF redactions delete text and replace overlapping image pixels. No masking-only
repair, clinical-data generation, network access, or project-wide build is performed.
"""
from pathlib import Path
from io import BytesIO
import argparse, collections, hashlib, html, json, subprocess
import fitz
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

REPO = Path(__file__).resolve().parents[1]
CONFIG = REPO / 'scripts/pdf-repairs-af.json'

def sha(b): return hashlib.sha256(b).hexdigest()
def rect_for(page, coords):
    return fitz.Rect(coords[0]*page.rect.width, coords[1]*page.rect.height,
                     coords[2]*page.rect.width, coords[3]*page.rect.height)
def appendix(config, ids):
    out=BytesIO()
    doc=SimpleDocTemplate(out,pagesize=(960,540),leftMargin=48,rightMargin=48,topMargin=40,bottomMargin=36,
                         title='Targeted AF teaching repairs and primary sources',author='Stroke Review')
    title=ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=22,leading=27,textColor=HexColor('#173b62'),spaceAfter=12)
    head=ParagraphStyle('head',fontName='Helvetica-Bold',fontSize=14,leading=18,textColor=HexColor('#173b62'),spaceBefore=12,spaceAfter=5)
    body=ParagraphStyle('body',fontName='Helvetica',fontSize=12,leading=17,spaceAfter=7)
    source=ParagraphStyle('source',fontName='Helvetica',fontSize=10,leading=14,textColor=HexColor('#38556a'),spaceAfter=5)
    story=[Paragraph('Targeted repairs | 30 September 2026',title),Paragraph('The original deck is an archive. These numbered notes document targeted corrections; unchanged material has not been comprehensively updated. Trial selection, source conflicts and unread correction notices remain explicit. Original slide numbers are preserved.',body)]
    for fid in ids:
        n=config['notes'][fid]
        label='Repair '+fid[-2:]
        note_parts=[Paragraph(html.escape(label+' - '+n['title']),head),Paragraph(html.escape(n['text']),body)]
        links=[]
        for j,url in enumerate(n['sources']):
            sid=n['source_ids'][j] if j<len(n['source_ids']) else 'Primary source'
            links.append('<a color="#174b7c" href="'+html.escape(url,quote=True)+'">'+html.escape(sid+' | '+url)+'</a>')
        note_parts.append(Paragraph('<br/>'.join(links),source))
        story.append(KeepTogether(note_parts))
    def footer(canvas,doc):
        canvas.setFont('Helvetica',9);canvas.setFillColor(HexColor('#536677'))
        canvas.drawString(48,20,'Targeted archive repairs - sources and limitations')
        canvas.drawRightString(912,20,str(doc.page))
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return fitz.open(stream=out.getvalue(),filetype='pdf')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--artifacts',type=Path,default=REPO.parent/'review-artifacts/implementation')
    args=parser.parse_args();art=args.artifacts;work=art/'af-downloads';work.mkdir(parents=True,exist_ok=True)
    cfg=json.loads(CONFIG.read_text());trace={'baseline':cfg['baseline'],'date':cfg['date'],'method':'PyMuPDF actual redactions: overlapping native text removed, image pixels replaced, unused objects garbage-collected; linked source appendix added','config_sha256':sha(CONFIG.read_bytes()),'decks':[],'regions':[],'findings':[],'limits':['Targeted repairs do not certify all untouched archive content as current.','Explicit unlocated results are withheld or qualified, not declared disproven.','Original primary correction-body gaps are preserved in source notes.']}
    for deck_s,rel in cfg['decks'].items():
        deck=int(deck_s);data=subprocess.check_output(['git','show',cfg['baseline']+':'+rel],cwd=REPO)
        archived=art/'archived-originals'/rel;archived.parent.mkdir(parents=True,exist_ok=True)
        if archived.exists(): assert archived.read_bytes()==data,'Baseline archive differs'
        else:archived.write_bytes(data)
        before=fitz.open(stream=data,filetype='pdf');doc=fitz.open(stream=data,filetype='pdf');original_count=len(doc)
        selected=[o for o in cfg['operations'] if o['deck']==deck]
        grouped=collections.defaultdict(list)
        for op in selected:grouped[op['page']].append(op)
        ids=sorted({f for o in selected for f in o['findings']})
        extra=appendix(cfg,ids);appendix_count=len(extra)
        # Actual redaction is applied before searchable replacement text is drawn.
        for page_n,ops in grouped.items():
            p=doc[page_n-1]
            for op in ops:
                if op['redact']:p.add_redact_annot(rect_for(p,op['rect']),fill=(1,1,1),cross_out=False)
            p.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS,graphics=fitz.PDF_REDACT_LINE_ART_NONE,text=fitz.PDF_REDACT_TEXT_REMOVE)
            for op in ops:
                r=rect_for(p,op['rect']);scale=p.rect.width/960;pad=min(3*scale, r.height*.035)
                inner=r+fitz.Rect(pad,pad,-pad,-pad)
                paras=''.join('<p>'+html.escape(line)+'</p>' for line in op['text'].split('\n') if line)
                if op.get('title'):paras='<h3>'+html.escape(op['title'])+'</h3>'+paras
                css=f'* {{font-family: sans-serif;}} body {{margin:0;padding:0;font-size:{op["font"]*scale}pt; color:#173047;}} p {{margin:0 0 .35em;line-height:1.22;}} h3 {{font-size:1.08em;line-height:1.15;margin:0 0 .45em;color:#174b7c;}}'
                spare,fit_scale=p.insert_htmlbox(inner,paras,css=css,scale_low=.72)
                if spare<0:raise RuntimeError(f'Text does not fit: {op["id"]}')
                trace['regions'].append({**op,'actual_pdf_rect':list(r),'font_scale':fit_scale,'effective_font_pt':op['font']*scale*fit_scale,'native_text_before':before[page_n-1].get_textbox(r)})
            # An unobtrusive source-note link is added in the available footer margin.
            fids=sorted({x for op in ops for x in op['findings']})
            width=p.rect.width;height=p.rect.height
            if deck==1 and page_n==25:foot=fitz.Rect(.18*width,.805*height,.82*width,.85*height)
            elif deck==1:foot=fitz.Rect(.046*width,.909*height,.6*width,.941*height)
            else:foot=fitz.Rect(.03*width,.968*height,.65*width,.995*height)
            label='2026 repairs '+', '.join(x[-2:] for x in fids)+' | linked source notes'
            p.insert_textbox(foot,label,fontsize=8*width/960,fontname='helv',color=(.13,.3,.45))
        doc.insert_pdf(extra)
        # Links are created after target pages exist.
        for page_n in grouped:
            p=doc[page_n-1];w=p.rect.width;h=p.rect.height
            r=fitz.Rect(.18*w,.805*h,.82*w,.85*h) if deck==1 and page_n==25 else (fitz.Rect(.046*w,.909*h,.6*w,.941*h) if deck==1 else fitz.Rect(.03*w,.968*h,.65*w,.995*h))
            p.insert_link({'kind':fitz.LINK_GOTO,'from':r,'page':original_count})
        out=REPO/rel;temp=out.with_suffix('.repair-tmp.pdf')
        doc.set_metadata({**doc.metadata,'modDate':'D:20260930000000Z','subject':'Archival teaching deck with targeted source-linked repairs dated 2026-09-30; unchanged material not comprehensively updated'})
        doc.save(temp,garbage=4,deflate=True,clean=True,no_new_id=True);doc.close();temp.replace(out)
        repaired=fitz.open(out)
        render_dir=work/f'deck-{deck}';render_dir.mkdir(exist_ok=True)
        untouched=[];rendered=[]
        for i in range(original_count):
            if i+1 not in grouped:
                a=before[i].get_pixmap(matrix=fitz.Matrix(.4,.4),alpha=False).samples
                b=repaired[i].get_pixmap(matrix=fitz.Matrix(.4,.4),alpha=False).samples
                assert a==b,f'Untouched page changed: {deck}/{i+1}'
                untouched.append(i+1)
            else:
                factor=min(1.6,1600/repaired[i].rect.width)
                for name,source_doc in [('before',before),('after',repaired)]:
                    source_doc[i].get_pixmap(matrix=fitz.Matrix(factor,factor),alpha=False).save(render_dir/f'p{i+1:02}-{name}.png')
                (render_dir/f'p{i+1:02}-after.txt').write_text(repaired[i].get_text())
                rendered.append(i+1)
        for i in range(original_count,len(repaired)):
            repaired[i].get_pixmap(matrix=fitz.Matrix(1.3,1.3),alpha=False).save(render_dir/f'p{i+1:02}-appendix.png')
            (render_dir/f'p{i+1:02}-after.txt').write_text(repaired[i].get_text())
        trace['decks'].append({'deck':deck,'path':rel,'baseline_sha256':sha(data),'output_sha256':sha(out.read_bytes()),'archive_path':str(archived),'original_pages':original_count,'appendix_pages':appendix_count,'total_pages':len(repaired),'affected_pages':rendered,'untouched_pages_pixel_identical':untouched})
    for f in cfg['findings']:
        ops=[o for o in cfg['operations'] if f['finding_id'] in o['findings']]
        covered={(o['deck'],o['page']) for o in ops}
        assert all(tuple(loc) in covered for loc in f['locations']),(f['finding_id'],f['locations'],covered)
        trace['findings'].append({'id':f['finding_id'],'root_duplicate':f.get('root_existing_finding_crossref'),'locations':f['locations'],'region_ids':[o['id'] for o in ops],'disposition':'targeted repair with primary-source note; unresolved limitations explicit','correction':cfg['notes'][f['finding_id']]})
    assert len(trace['findings'])==25
    trace['qa_status']='Rendered all affected and appendix pages; extraction saved; visual and OCR review pending separate verification.'
    (art/'af-downloads-trace.json').write_text(json.dumps(trace,indent=2)+'\n')
    print(json.dumps({'decks':trace['decks'],'regions':len(trace['regions']),'findings':25},indent=2))
if __name__=='__main__':main()
