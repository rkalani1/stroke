import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as education from '../src/education.jsx';
import { PupillometrySimulator } from '../src/simulators/PupillometrySimulator.jsx';
import { NeuroExamsTool } from '../src/simulators/NeuroExamsTool.jsx';
import { HintsSimulator } from '../src/simulators/HintsSimulator.jsx';

// These are regression checks for the selected faulty units, not whole-card
// clinical validation. SSR includes SVG text, aria labels and print-card markup.
const cases = [
  ['D01','StrokePrognosisCard',/30-day mortality.*dependence/i,/fabricated dependency|90d Poor Outcome/],
  ['D02','StrokePrognosisCalculator',/Outcome percentages are unavailable/,/Risk Classification|90d Poor Outcome/],
  ['D03','SevereStrokeCriticalCareCard',/SETPOINT2/,/best-case outcome is mRS 4/],
  ['D04','IchSurgicalDecisionMakingCard',/immediate surgical removal/,/observe.*awake.*15 mL/i],
  ['D05','IchSurgicalDecisionMakingCard',/Selected severe deep ICH/,/Deep, herniating|arms were left severely disabled/],
  ['D06','EvtPeriproceduralCareCard',/do not require vasopressors/,/raise.*SBP.*140.*mandat/i],
  ['D07','EVDInfographic',/unavailable/,/<input|<select|5 cm.*day|clock.*stopcock/i],
  ['D08','ICPInfographic',/unavailable/,/<input|<select|RASS.*4.*5|osmolar gap.*20/i],
  ['D09','PupillometrySimulator',/simulator temporarily unavailable/,/<input|<select/],
  ['D10','NeuroExamsTool',/unavailable/,/<input|<select/],
  ['D11','AntiepilepticDrugsCard',/not a dosing order/,/25 mg daily.*2 weeks|60 mg\/kg.*4500/],
  ['D12','AfibAnticoagTimingCard',/no validated combined day-by-severity schedule/,/REPEAT CT\/MRI|Pre-DOAC|DOAC INITIATION TIMELINE AXIS|practice hybrid/],
  ['D13','ToastClassificationCard',/mechanism/i,/toast_classification_infographic/],
  ['D14','SelectSeizureRiskCard',/Intermediate percentages are withheld/,/select_score_chart|cEEG.*score.*[56]/i],
  ['D15','AnticoagulationReversalCard',/Andexanet is unavailable in the US/,/INR.*&lt;1\.4|Andexanet.*400 mg/],
  ['D16','VesselWallMriCard',/mimic/i,/pattern.*start.*immunosuppression/i],
  ['D17','CadasilCarasilCard',/Fabry/,/0\.5\s*g\/kg|L-Arginine.*IV/],
  ['D18','MetabolicStrokePreventionCard',/SPRINT/,/home SBP.*?&lt;125/],
  ['D19','DeviceDetectedSubclinicalAfCard',/shared decision/i,/Convert aspirin to a DOAC|DOAC if.*24 h/],
  ['D20','LargeCoreThrombectomyCard',/ASPECTS/,/ischemic_core_penumbra_render/],
  ['D21','DmvoMevoManagementCard',/sequence are unavailable/,/0\.014|maximum.*3 passes/i],
  ['D22','IchBloodPressureCard',/recipes are unavailable/,/double.*90 seconds|door-to-needle.*60/i],
  ['D23','MoyamoyaDiseaseCard',/patient-specific/,/ETCO2 38.42|1\.2.1\.5x|target 110.130/],
  ['D24','CancerAssociatedStrokeCard',/does not establish DIC/,/100.150k|mandatory in suspected cancer stroke/],
  ['D25','HintsSimulator',/Acute Vestibular Syndrome|AVS/,/skew-present hint-anim-skew-present/],
  ['D26','VascularTerritoryAtlasCard',/former axial sectors/,/aspects_10_regions_render/],
  ['D27','CvstCard',/schematic/i,/Venous Infarct/],
  ['D28','BrainDeathCard',/skull-base/,/50 mL/],
  ['D29','BasilarArteryOcclusionCard',/basilar/i,/evt_lvo_occlusion_sites/],
  ['D30','FibromuscularDysplasiaCard',/dilatation/i,/fmd_stroke_mechanisms/]
];
const components = { ...education, PupillometrySimulator, NeuroExamsTool, HintsSimulator };
const render = (name) => renderToStaticMarkup(React.createElement(components[name]));
const artifactDir = process.env.EDU_RENDER_ARTIFACT_DIR;

describe('Selected education removals across rendered duplicate representations', () => {
  it.each(cases)('%s: %s preserves its qualified fallback without the selected bad unit', (id,name,present,absent) => {
    const html = render(name);
    // PLAN's historical endpoint label may remain; null probability helpers and
    // numeric output absence are the selected unit, checked below and elsewhere.
    if (id !== 'D01') expect(html).toMatch(present);
    expect(html).not.toMatch(absent);
    if (artifactDir) {
      mkdirSync(artifactDir, { recursive: true });
      writeFileSync(resolve(artifactDir,`${id}-${name}.html`),html);
    }
  });
  it('withholds PLAN and ASTRAL percentages for every score, including export/helper callers', () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(education.getAstralRisk(score)).toBeNull();
      expect(education.getPlanRisk(score)).toEqual({ mortality: null, depMortality: null, available: false });
    }
  });
  it('withholds residual unsupported operational outputs across secondary renderers', () => {
    const rcvs = render('RcvsCard');
    expect(rcvs).toContain('point table and automatic diagnostic cutoffs are unavailable');
    expect(rcvs).not.toContain('99% spec');
    const af = render('AfibAnticoagTimingCard');
    expect(af).not.toContain('Hold if CrCl');
    expect(af).toContain('20 mg daily with the evening meal');
    expect(af).toContain('15 mg daily with the evening meal');
    expect(af).toContain('equivalent stroke prevention and bleeding outcomes are unknown');
    const dapt = render('DaptRegimensCard');
    expect((dapt.match(/fixed aspirin 81 mg regimen is not established/g) || []).length).toBe(2);
    const malignant = render('MalignantInfarctionCard');
    expect(malignant).toContain('separate mRS 4 and 5 plot segments are unavailable');
    expect(malignant).not.toContain('NIHSS &gt;15');
    const bp = render('IchBloodPressureCard');
    expect(bp).toContain('two-week active triple-pill run-in');
    expect(bp).not.toContain('(active bleeding)');
    const reversal = render('AnticoagulationReversalCard');
    expect(reversal).not.toContain('give the specific reversal →');
    expect(reversal).not.toContain('fibrinogen falls and PT/aPTT rise');
    expect(render('PfoClosureCard')).toContain('Selected older patients may be considered individually');
    expect(render('CarotidStenosisCard')).not.toContain('(CEA or CAS, ≤2 wk)');
  });
  it('renders every exported education card and both printable reference replacements', () => {
    const names = Object.keys(education).filter(name => /Card$/.test(name) && typeof education[name] === 'function');
    expect(names.length).toBeGreaterThan(30);
    const report = names.map(name => {
      const html = render(name);
      expect(html.length).toBeGreaterThan(100);
      if (artifactDir) writeFileSync(resolve(artifactDir,`${name}.html`),html);
      return { name, characters: html.length, svgs: (html.match(/<svg\b/g)||[]).length, status: 'rendered; targeted assertions only, no full clinical clearance' };
    });
    if (artifactDir) writeFileSync(resolve(artifactDir,'rendered-export-index.json'),JSON.stringify(report,null,2));
  });
  it('does not leave removed image paths in unused JSX functions, labels or fallback declarations', () => {
    const source = readFileSync('src/education.jsx','utf8');
    for (const basename of ['afib_timing_protocol','select_score_chart','toast_classification_infographic','hematoma_expansion_render','ischemic_core_penumbra_render','evt_lvo_occlusion_sites','dapt_flowchart_timeline','aspects_10_regions_render','fmd_stroke_mechanisms']) {
      expect(source).not.toContain(`assets/${basename}`);
    }
  });
});
