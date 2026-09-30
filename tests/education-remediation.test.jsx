import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import Education, {
  EDUCATION_PRACTICE_CASES, EvidencePracticeCases, EVDInfographic, ICPInfographic,
  CervicalDissectionCard, MoyamoyaDiseaseCard, CancerAssociatedStrokeCard, VascularTerritoryAtlasCard,
  CvstCard, EvtPeriproceduralCareCard, SevereStrokeCriticalCareCard,
  BrainDeathCard, MalignantInfarctionCard, AntiepilepticDrugsCard, AfibAnticoagTimingCard
} from '../src/education.jsx';
const render = (Component) => renderToStaticMarkup(<Component />);

describe('Education safety remediation', () => {
  it('removes erroneous assets both from owned source and direct published paths', () => {
    const source = readFileSync('src/education.jsx', 'utf8');
    for (const name of ['afib_timing_protocol','select_score_chart','toast_classification_infographic','hematoma_expansion_render','ischemic_core_penumbra_render','evt_lvo_occlusion_sites','dapt_flowchart_timeline','aspects_10_regions_render']) {
      for (const ext of ['png','svg']) {
        expect(source).not.toContain(`assets/${name}.${ext}`);
        expect(existsSync(`assets/${name}.${ext}`)).toBe(false);
      }
    }
    expect(existsSync('assets/fmd_stroke_mechanisms.png')).toBe(false);
  });
  it('offers no operational device controls or dose recipes in EVD/ICP references', () => {
    for (const Component of [EVDInfographic, ICPInfographic]) {
      const html = render(Component);
      expect(html).not.toMatch(/<input|<select|pdfPath|gap.*20 mOsm|RASS.*4.*5/);
      expect(html).toContain('unavailable');
      expect(html).toContain('https://pubmed.ncbi.nlm.nih.gov/');
    }
  });
  it('removes universal perioperative and cancer diagnostic numeric shortcuts', () => {
    const moyamoya = render(MoyamoyaDiseaseCard);
    expect(moyamoya).not.toMatch(/1\.2–1\.5x|ETCO2 38–42|target 110–130|strictly avoided/);
    expect(moyamoya).toContain('patient-specific');
    const cancer = render(CancerAssociatedStrokeCard);
    expect(cancer).not.toMatch(/100–150k|fibrinogen.*&lt;150|mandatory in suspected cancer stroke/);
    expect(cancer).toContain('does not establish DIC');
  });
  it('removes misleading anatomy panels without pretending the replacement is validated imaging', () => {
    expect(render(VascularTerritoryAtlasCard)).toContain('former axial sectors');
    const cvt = render(CvstCard);
    expect(cvt).not.toContain('Venous Infarct');
    expect(cvt).toMatch(/schematic/i);
  });
  it('keeps BP strategy uncertainty and removes false recovery ceilings', () => {
    const evt = render(EvtPeriproceduralCareCard);
    expect(evt).toContain('do not require vasopressors');
    expect(evt).toContain('HOPE');
    expect(evt).toContain('only 43 participants');
    const severe = render(SevereStrokeCriticalCareCard);
    expect(severe).not.toContain('best-case outcome is mRS 4');
    expect(severe).toContain('SETPOINT2');
  });
  it('removes the live inline AF hybrid timeline as well as deleted external assets', () => {
    const html = render(AfibAnticoagTimingCard);
    expect(html).not.toMatch(/REPEAT CT\/MRI|Pre-DOAC|DOAC INITIATION TIMELINE AXIS|practice hybrid/);
    expect(html).toContain('no validated combined day-by-severity schedule');
    expect(html).toContain('OPTIMAS compared');
  });
  it('withholds dangerous mini-procedures and abbreviated antiseizure dosing', () => {
    expect(render(BrainDeathCard)).toContain('skull-base');
    expect(render(BrainDeathCard)).not.toContain('50 mL');
    expect(render(AntiepilepticDrugsCard)).not.toContain('25 mg daily × 2 weeks');
    expect(render(MalignantInfarctionCard)).not.toContain('STAGE 2: 24 - 48 HOURS');
  });
});

describe('Education navigation and synthetic teaching cases', () => {
  it('uses native module buttons, a named search and no nested main', () => {
    const html = render(Education);
    expect((html.match(/aria-label="Open /g) || []).length).toBe(40);
    expect(html).toContain('id="education-module-search"');
    expect(html).not.toContain('<main');
  });
  it('offers a native keyboard trigger for the cervical-dissection image reader', () => {
    const html = render(CervicalDissectionCard);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-label="Open cervical artery dissection stroke mechanisms image"/);
    expect(html).toContain('focus-visible:outline');
  });
  it('starts all case answers unselected and gives every choice explanatory feedback', () => {
    expect(EDUCATION_PRACTICE_CASES).toHaveLength(7);
    for (const item of EDUCATION_PRACTICE_CASES) {
      expect(item.feedback).toHaveLength(item.options.length);
      expect(item.feedback.every((text) => text.length > 40)).toBe(true);
      expect(item.changes.length).toBeGreaterThan(40);
      expect(item.source).toMatch(/^https:\/\/(pubmed\.ncbi\.nlm\.nih\.gov|jamanetwork\.com)\//);
    }
    const html = render(EvidencePracticeCases);
    expect((html.match(/type="radio"/g) || []).length).toBe(21);
    expect(html).not.toContain('checked=""');
  });
  it('makes insufficient information the supported branch where context is absent', () => {
    const keyed = Object.fromEntries(EDUCATION_PRACTICE_CASES.map((row) => [row.id,row]));
    expect(keyed['evt-bp'].options[keyed['evt-bp'].answer]).toMatch(/insufficient information/);
    expect(keyed.onset.feedback[keyed.onset.answer]).toContain('insufficient');
    expect(keyed.severity.options[keyed.severity.answer]).toContain('incomplete');
    expect(keyed.prognosis.options[keyed.prognosis.answer]).toContain('uncertainty');
  });
});
