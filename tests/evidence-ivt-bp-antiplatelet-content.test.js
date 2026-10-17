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

describe('acute blood pressure Evidence cards', () => {
  it('scopes the post-EVT harm statement and adds the direct-to-EVT threshold', () => {
    const card = topic('acute-bp');
    // ais-2026-73 (2a, B-NR): EVT planned without IVT, ≤185/110 before the procedure.
    expect(card.summary).toContain('EVT planned without IVT: ≤185/110 before the procedure (AHA 2026, 2a)');
    // ais-2026-77: anterior LVO, mTICI 2b–3, first 72 h; ESO 2025 update: not <140 in first 24 h (high certainty).
    expect(card.summary).toContain('After successful EVT for anterior LVO (mTICI 2b–3), do not target SBP <140 for the first 72 h (AHA 2026, COR 3: Harm');
    expect(card.summary).toContain('ESO 2025 update: <180/105');
    expect(card.summary).not.toContain('ESO 2026');
    // Cochrane 2026: mortality RR 1.19 (1.08–1.32); search to 20 March 2025.
    expect(card.summary).toContain('RR 1.19, 95% CI 1.08–1.32');
    // HOPE: open-label, stopped early, hypothesis-generating per the authors.
    expect(card.summary).toMatch(/HOPE, 2026\) found .*hypothesis-generating, and it does not override the COR 3: Harm recommendation/);
    // ESO >220/120 statement is expert consensus; ais-2026-70 is 2b; ais-2026-13 is 3: No Benefit.
    expect(card.summary).toContain('ESO 2025 expert consensus: if lowered, reduce SBP cautiously by <15% over 24 h');
    expect(card.summary).toContain('No routine prehospital lowering in suspected stroke (AHA 2026, COR 3: No Benefit; ESO 2025 update, moderate certainty)');
  });

  it('keeps review points graded and inside the four-item limit', () => {
    const card = topic('acute-bp');
    expect(card.consider).toHaveLength(4);
    // ENCHANTED: any ICH 14.8 vs 18.7%; ais-2026-75 is COR 3: No Benefit.
    expect(card.consider[0]).toContain('(14.8 vs 18.7%) (ENCHANTED; AHA 2026 COR 3: No Benefit)');
    // ais-2026-69 has no "only"; ESO 2025 discourages routine vasopressors without reperfusion (low certainty).
    expect(card.consider[1]).not.toMatch(/only when a comorbidity/);
    expect(card.consider[1]).toMatch(/treat hypertension early when a comorbid condition requires it .*AHA 2026 COR 1\)/);
    expect(card.consider[1]).toContain('discourages routinely raising BP with vasopressors in deteriorating patients (low certainty)');
    // DETERMINE: mRS 0–2 44.2 vs 48.8%.
    expect(card.consider[3]).toContain('DETERMINE 2026, mRS 0–2 44.2 vs 48.8%');
    for (const pmid of ['42445947', '42585603', '37732489']) expect(urls(card)).toContain(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
  });

  it('states HOPE, OPTIMAL-BP and INTERACT4 limits from their reports', () => {
    const hope = study('hope-post-evt-bp');
    expect(hope.population).toContain('elevated SBP was not required');
    expect(hope.comparison).toContain('antihypertensives or vasopressors as needed');
    expect(hope.limits).toMatch(/stopped early for lack of funding \(446 of 786 planned; 440 analyzed\)/);
    expect(hope.limits).toContain('Only 9.8% had mTICI 2b');
    expect(hope.limits).toContain('COR 3: Harm');
    expect(hope.sources[0].access).toContain('PMC13247842');
    const optimal = study('optimal-bp');
    expect(optimal.population).toContain('SBP ≥140 mmHg on two readings within 2 h of recanalization');
    expect(optimal.limits).toContain('40.5% vs 52.7% (adjusted OR 0.59, 95% CI 0.34–1.00; P = .051');
    expect(urls(optimal)).toContain('https://pubmed.ncbi.nlm.nih.gov/42212393/');
    expect(study('interact4').limits).toContain('COR 3: No Benefit');
  });
});
