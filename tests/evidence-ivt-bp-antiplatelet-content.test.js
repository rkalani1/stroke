import { describe, expect, it } from 'vitest';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

// Expected values come from the primary sources named in each assertion (PubMed
// abstracts, PMC full text, ClinicalTrials.gov) or the archived AHA/ASA 2026
// transcription, checked 2026-10-17. These guard population, grade and
// post-guideline labels on the IVT, acute BP and antiplatelet Evidence cards.
const data = readClinicalReference();
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const text = record => [record.summary, ...(record.consider || []), record.caution].join(' ');
const urls = record => record.sources.map(source => source.url);

describe('thrombolysis Evidence cards', () => {
  it('stays inside the structural contract on the review date', () => {
    expect(validateClinicalReference(data, { now: new Date('2026-10-17T23:59:59Z') })).toEqual([]);
  });

  it('separates the AHA 2026 imaging grade from the perfusion-selected IVT treatment grades', () => {
    const item = topic('ct-perfusion').consider.join(' ');
    // ais-2026-101 (2a): EVT-ineligible, 4.5–9 h from LKW or within 9 h of the sleep midpoint.
    expect(item).toContain('EVT-ineligible patients at 4.5–9 h from LKW or within 9 h of the sleep midpoint for wake-up stroke (2a, ais-2026-101)');
    // ais-2026-102 (2b): LVO, 4.5–24 h from onset or LKW, cannot receive EVT; TRACE-III included wake-up/unwitnessed onset.
    expect(item).toContain('up to 24 h from onset or LKW (wake-up and unwitnessed onset included), only LVO with salvageable penumbra that cannot receive EVT is graded (2b, ais-2026-102');
    // ais-2026-53 (2a) grades CTP/DWI-PWI selection, not treatment.
    expect(item).toMatch(/\(ais-2026-53\) grades imaging selection for eligibility, not IVT itself/);
    expect(item).not.toMatch(/known onset only|unknown onset up to 24 h from LKW \(2a\)/);
    // PRACTISE: thrombolysis 49.1 vs 67.6% with multimodal CT vs NCCT.
    expect(item).toContain('PRACTISE, n=271');
    expect(urls(topic('ct-perfusion'))).toContain('https://pubmed.ncbi.nlm.nih.gov/41614492/');
  });

  it('limits DAPT for non-disabling deficits to the noncardioembolic Class 1 population', () => {
    const card = topic('acute-reperfusion');
    // ais-2026-91 is COR 3: No Benefit; ais-2026-147 is noncardioembolic, NIHSS ≤3, within 24 h.
    expect(card.consider[0]).toMatch(/IVT is not recommended \(COR 3: No Benefit\)/);
    expect(card.consider[0]).toMatch(/DAPT only for noncardioembolic minor stroke \(NIHSS ≤3\) started within 24 h \(COR 1/);
    // ais-2026-122: basilar EVT needs NIHSS ≥10, baseline mRS 0–1 and PC-ASPECTS ≥6.
    expect(card.summary).toContain('basilar occlusion with NIHSS ≥10, prestroke mRS 0–1 and PC-ASPECTS ≥6 (COR 1)');
    expect(card.caution).toMatch(/recent DOAC intake.*observational cohorts, not randomized trials/);
    expect(card.related.map(link => link.href)).toContain('#/evidence/minor-stroke-antiplatelets');
  });

  it('shows the corrected ais-2026-101 wording, NCCT-only wake-up evidence and post-guideline labels', () => {
    const card = topic('extended-window-ivt');
    expect(card.summary).toContain('in patients ineligible for EVT: IVT can be beneficial (2a; EXTEND');
    expect(card.summary).not.toMatch(/without EVT: IVT is reasonable/);
    // TWIST: aOR 1.18 (0.88–1.58); ESO 2023: against TNK after NCCT-only selection (low evidence, strong).
    expect(text(card)).toContain('TWIST, aOR 1.18; 95% CI 0.88–1.58');
    expect(text(card)).toContain('ESO 2023 recommends against it (strong recommendation, low-quality evidence)');
    // OPTION (JAMA 2026) and HOPE (JAMA 2025) post-date the March 2025 evidence cutoff.
    expect(card.consider[0]).toMatch(/published after the AHA 2026 evidence review \(searched to March 2025\) and are not graded there/);
    // TRACE-5 38 vs 29% with 49% EVT; ATTENTION LATE 30 vs 30%; ETERNAL-LVO 79% EVT, stopped early.
    expect(text(card)).toContain('TRACE-5, 38 vs 29%; 49% had EVT');
    expect(card.summary).toMatch(/basilar: ATTENTION LATE\), and ETERNAL-LVO .*79% EVT, stopped early\) was neutral/);
    expect(card.caution).toMatch(/^Benefit beyond 9 h comes from imaging-selected trials in China/);
    expect(card.consider).toHaveLength(4);
    for (const pmid of ['36549308', '37021186', '40927857', '41655588', '42776543']) expect(urls(card)).toContain(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
  });

  it('keeps COR 3 subtypes and the ESO LVO population on the thrombolytic-choice card', () => {
    const card = topic('thrombolytic-choice');
    // ais-2026-99 3: No Benefit/A; ais-2026-108 streptokinase 3: Harm; ESO 2023 LVO <4.5 h strong/moderate.
    expect(card.summary).toContain('Do not use tenecteplase 0.4 mg/kg (COR 3: No Benefit, LOE A)');
    expect(card.summary).toContain('LVO within 4.5 h, ESO 2023 recommends tenecteplase 0.25 mg/kg over alteplase (strong recommendation, moderate-quality evidence)');
    expect(card.consider[2]).toMatch(/mutant prourokinase plus low-dose alteplase and adjunctive sonothrombolysis \(COR 3: No Benefit\); streptokinase is COR 3: Harm/);
    expect(card.consider.join(' ')).not.toMatch(/streptokinase and sonothrombolysis \(COR 3\)/);
  });

  it('states the AHA 2026 CRAO population and level, ESO 2025 and the registry status', () => {
    const card = topic('retinal-ischemia');
    // ais-2026-111: non-arteritic CRAO, disabling visual loss, otherwise IVT-eligible, 4.5 h from LKW; 2b / C-LD.
    expect(card.summary).toContain('non-arteritic CRAO with disabling visual loss in an otherwise IVT-eligible adult');
    expect(card.summary).toContain('(AHA 2026, COR 2b, LOE C-LD)');
    expect(card.summary).toContain('TenCRAOS (tenecteplase vs aspirin)');
    expect(text(card)).toMatch(/ESO 2025 suggests IVT within 4\.5 h for CRAO \(weak recommendation wording; very low-quality, nonrandomized evidence through 2023, issued before THEIA and TenCRAOS/);
    expect(text(card)).toContain('REVISION (NCT04965038) is listed as terminated with no posted results');
    expect(urls(card)).toEqual(expect.arrayContaining(['https://pubmed.ncbi.nlm.nih.gov/40401755/', 'https://clinicaltrials.gov/study/NCT04965038']));
    expect(card.related).toEqual([{ label: 'Reperfusion overview', href: '#/evidence/acute-reperfusion' }]);
  });

  it('matches the IVT study cards to their primary abstracts', () => {
    expect(topic('post-ivt-complications').summary).toContain('Angioedema occurred in about 1% (6 patients per arm)');
    expect(topic('post-ivt-complications').summary).not.toContain('Orolingual angioedema occurred');
    expect(study('tempo-2').population).toMatch(/^886 patients with NIHSS 0–5 and intracranial occlusion or focal perfusion abnormality/);
    expect(study('tempo-2').question).toContain('or a focal perfusion abnormality');
    expect(study('wake-up').population).toContain('patients with planned thrombectomy excluded');
  });
});
