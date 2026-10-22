// Evidence-tab content checks from the 2026-10-17 ICH/SAH/CVT review.
// Expected strings come from the primary sources named beside each assertion
// (PubMed abstracts, PMC full text, ClinicalTrials.gov) or, for AHA/ASA 2022 ICH
// and 2023 aSAH wording, the maintained/archived guideline transcriptions.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const urls = record => record.sources.map(source => source.url);
const ich2022 = read('src/guidelines/ich-2022.json').recommendations;

describe('ICH evidence cards (2026-10-17 review)', () => {
  it('still validates against the reference contract at the review date', () => {
    // Latest review cutoff: sources re-read on 2026-10-22 (evidence-fixes pass) carry that checkedAt.
    expect(validateClinicalReference(data, { now: new Date('2026-10-22T23:59:59Z') })).toEqual([]);
  });

  it('defers ICH neuroprognostication 48–72 h and keeps the AHA second-day DNAR statement (NCS 2023 GPS 1; ich-2022-95)', () => {
    const card = topic('neuroprognostication');
    expect(card.summary).toContain('at least the first 48–72 h of ICU admission');
    expect(card.summary).toContain('second full hospital day');
    expect(card.summary).not.toContain('day 1');
    // NCS 2023: original ICH score and max-ICH score alone are not reliable predictors.
    expect(card.consider.some(item => /original ICH score or the max-ICH score alone is not a reliable predictor/.test(item) && /30-day mortality/.test(item))).toBe(true);
    expect(card.sources.find(source => source.url.includes('37923968')).access).toContain('PMC10959839');
    expect(card.sources.find(source => source.url.includes('41942818')).access).toContain('PMC13249629');
  });

  it('keeps UFH (2a) and LMWH (2b) protamine recommendations distinct (ich-2022-36/37)', () => {
    expect(ich2022.find(rec => rec.id === 'ich-2022-36')).toMatchObject({ classOfRec: 'IIa', levelOfEvidence: 'C-LD' });
    expect(ich2022.find(rec => rec.id === 'ich-2022-37')).toMatchObject({ classOfRec: 'IIb', levelOfEvidence: 'C-LD' });
    const summary = topic('antithrombotic-reversal').summary;
    expect(summary).toContain('Unfractionated heparin: protamine (2a)');
    expect(summary).toContain('LMWH: protamine may partially reverse (2b)');
    expect(summary).not.toMatch(/(?<!fractionated )Heparin: protamine \(2a\)/);
    expect(summary).toMatch(/4F-PCC rather than andexanet.*withdrawn from the US market effective 22 December 2025/);
    // GRADE certainty was not re-verified on 2026-10-17 (abstract only); the access note must say so.
    expect(topic('antithrombotic-reversal').sources[0].access).toMatch(/2026-09-30.*not re-verified/);
    // The abstract summarizes four conditional recommendations and three no-recommendation areas, not all eight.
    expect(topic('antithrombotic-reversal').sources[0].access).toContain('the recommendations it summarizes');
  });

  it('states the CLEAR III and AHA IVH populations separately with the split grades (PMID 28081952; NCT00784134; ich-2022-83/84)', () => {
    const summary = topic('ich-expansion-ivh').summary;
    // CLEAR III registry: ICH <=30 cc or primary IVH; IVH obstructing 3rd/4th ventricle; EVD per standard care; infratentorial hemorrhage excluded.
    expect(summary).toContain('CLEAR III (stable supratentorial ICH <30 mL or primary IVH; IVH obstructing the third or fourth ventricle; routine EVD)');
    expect(summary).toContain('increased mRS 5 (17 vs 9%)');
    // Archived AHA 2022 transcription (archive/pre-encounter-first-20261001-4f8e99d), ich-2022-83 (IIa, B-R) and ich-2022-84 (IIb, B-R):
    // "for patients with GCS >3 and primary IVH or IVH extension from supratentorial ICH <30 mL requiring EVD".
    expect(summary).toContain('AHA 2022, for GCS >3 with primary IVH or IVH extension from supratentorial ICH <30 mL requiring EVD: reasonable to reduce mortality (2a); functional benefit uncertain (2b)');
    expect(summary).not.toMatch(/stable ICH <30 mL with IVH/);
    // ich-2022-74 and ich-2022-82 are separate COR 1 populations.
    expect(summary).toContain('Hydrocephalus contributing to reduced consciousness: ventricular drainage (AHA 2022, COR 1)');
    expect(summary).toContain('large IVH with impaired consciousness: EVD rather than medical management alone (COR 1)');
  });

  it('completes the AHA recurrence factor list and adds AF-restart timing (ich-2022-109/115)', () => {
    const summary = topic('caa-ich-recurrence').summary;
    expect(summary).toContain('poor BP control, Asian or Black race and APOE ε2/ε4 (AHA 2022, 2a)');
    expect(summary).toContain('starting 7–8 weeks after ICH may be considered after weighing individual factors (AHA 2022, 2b)');
  });

  it('qualifies the <130 harm population and converts glucose to mg/dL on the first-hour card', () => {
    const card = topic('ich-management');
    // ich-2022-25: mild to moderate ICH presenting with SBP >150.
    expect(card.summary).toContain('Do not acutely lower SBP below 130 in mild-to-moderate ICH presenting with SBP >150');
    // INTERACT3 targets 6.1–7.8 and 7.8–10.0 mmol/L × 18.0 mg/dL per mmol/L.
    expect(Math.round(6.1 * 18)).toBe(110); expect(Math.round(7.8 * 18)).toBe(140); expect(Math.round(10 * 18)).toBe(180);
    expect(card.summary).toContain('6.1–7.8 mmol/L (≈110–140 mg/dL; 7.8–10.0 mmol/L ≈140–180 mg/dL with diabetes)');
    // INTERACT4 (undifferentiated prehospital stroke) stays on the acute BP card; no unsourced imaging directive here.
    expect(card.caution).not.toContain('INTERACT4');
    expect(card.caution).not.toContain('Lower BP once imaging confirms ICH');
    // AF-restart and antiplatelet-restart records belong to the AF, secondary-prevention and study cards, not the first-hours card.
    for (const pmid of ['40023176', '31128924', '37839434']) expect(urls(card)).not.toContain(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
    expect(urls(topic('af-prevention'))).toContain('https://pubmed.ncbi.nlm.nih.gov/40023176/');
    expect(urls(topic('secondary-prevention'))).toContain('https://pubmed.ncbi.nlm.nih.gov/31128924/');
  });

  it('restates the disjunctive craniectomy population and adds Cochrane 2025 surgery evidence', () => {
    const card = topic('ich-surgery');
    // ich-2022-90: comatose, OR large hematoma with significant midline shift, OR refractory ICP.
    expect(card.consider.join(' ')).toContain('coma, a large hematoma with significant midline shift, or refractory ICP (2b)');
    expect(card.consider.join(' ')).toMatch(/Cochrane 2025.*RR 1\.36, low certainty.*RR 0\.71, moderate certainty.*high risk of bias/);
    expect(card.consider.length).toBeLessThanOrEqual(4);
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/40673401/');
  });
});

describe('ICH and aSAH study records (2026-10-17 review)', () => {
  it('states registry eligibility limits for ANNEXA-I, ENRICH and SWITCH (NCT03661528, NCT02880878, NCT02258919)', () => {
    expect(study('annexa-i').population).toContain('0.5–60 mL; GCS ≥7; NIHSS ≤35; baseline scan within 6 h of onset; no surgery planned within 12 h');
    expect(study('enrich').population).toContain('aged 18–80 (GCS 5–14, NIHSS ≥5, premorbid mRS 0–1)');
    expect(study('enrich').population).toContain('within 24 hours of last known well');
    // SWITCH registry: GCS <14 and >7 → 8–13; NIHSS 10–30; 30–100 mL; within 66 h.
    expect(study('switch').population).toContain('GCS 8–13, NIHSS 10–30, stable volume 30–100 mL) randomized within 66 hours');
  });

  it('files ICH BP trials under the ICH card and PRESTIGE-AF under the recurrence card that discusses it', () => {
    expect(study('interact2').relatedTopic).toBe('ich-management');
    expect(study('atach-2').relatedTopic).toBe('ich-management');
    expect(study('prestige-af').relatedTopic).toBe('caa-ich-recurrence');
    expect(topic('caa-ich-recurrence').related.some(link => link.href === '#/evidence/prestige-af')).toBe(true);
  });

  it('reports EARLYDRAIN drain complications as described in the full report (PMC10277935)', () => {
    expect(study('earlydrain').result).toContain('a torn-off drain needing surgical removal');
    expect(study('earlydrain').result).not.toContain('retained');
  });
});

describe('SAH, CVT and other vascular cards (2026-10-17 review)', () => {
  it('discloses both AHA 2023 and NCS 2026 aSAH seizure-prophylaxis positions (PMC13642444; sah-2023-67)', () => {
    const seizures = topic('poststroke-seizures');
    expect(seizures.summary).toContain('NCS 2026 suggests ASM or no ASM (conditional, low certainty)');
    // NCS 2026 formal recommendations allow either agent and either duration; the ≤3-day levetiracetam course is expert guidance with an EEG/clinical-risk exception.
    expect(seizures.summary).toContain('allows either agent and duration; its expert guidance prefers levetiracetam, stopped by 3 days unless seizures or EEG features suggest ongoing risk');
    expect(seizures.summary).toContain('(AHA 2022, 2a)');
    expect(seizures.summary).not.toContain('brief prophylaxis');
    expect(seizures.sources[1].access).toContain('PMC13642444');
    const sah = topic('sah');
    expect(sah.consider[1]).toContain('AHA 2023 allows it only with high-risk features (MCA aneurysm, high grade, ICH, hydrocephalus, cortical infarct; 2b)');
    expect(sah.consider[1]).toContain('NCS 2026 is conditional (ASM or no ASM; either agent and duration)');
    expect(sah.consider[1]).toContain('unless seizures or EEG features suggest ongoing risk');
    expect(sah.consider[1]).toContain('no more than 7 days (2a)');
    expect(urls(sah)).toContain('https://pubmed.ncbi.nlm.nih.gov/42552475/');
  });

  it('labels the ESO BP target as consensus and states AHA CSF diversion and ESO ETRA recommendations (PMID 42095754; sah-2023-62)', () => {
    const summary = topic('sah').summary;
    expect(summary).toContain('ESO 2026 expert consensus suggests targeting about 160');
    expect(summary).toContain('endothelin-receptor antagonists');
    expect(summary).toContain('Urgent CSF diversion (EVD and/or lumbar drain) for acute symptomatic hydrocephalus (COR 1)');
  });

  it('separates symptomatic from severe vasospasm and COR 1 from 2a monitoring (sah-2023-45/50/56/57/58)', () => {
    const card = topic('sah-critical-care');
    expect(card.summary).toContain('COR 3: Harm');
    expect(card.summary).toContain('frequent neurological exams (COR 1)');
    expect(card.summary).toContain('Symptomatic vasospasm: raising SBP may be reasonable; severe vasospasm: intra-arterial vasodilators or angioplasty may be reasonable (2b)');
    expect(card.summary).toContain('after the aneurysm is secured');
    expect(card.consider[2]).toContain('Pharmacological or mechanical VTE prophylaxis');
  });

  it('adds the glucocorticoid caution and the exact RCVS2 performance (PMIDs 27940651, 30635475)', () => {
    const card = topic('rcvs-pres');
    expect(card.consider[0]).toContain('avoid empirical glucocorticoids');
    expect(card.consider.length).toBeLessThanOrEqual(4);
    expect(card.summary).toContain('100% specific (85% sensitive)');
    expect(card.summary).not.toContain('including against PACNS');
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/27940651/');
  });

  it('cites the published CM guideline with its graded stroke-relevant recommendations (PMC12680281)', () => {
    const card = topic('cavernous-malformation');
    expect(card.sources[0].url).toBe('https://pubmed.ncbi.nlm.nih.gov/40396744/');
    expect(card.summary).toContain('should not preclude needed antithrombotics (Class 2a, B-NR)');
    // Recommendation 11: risk not well established; "may be considered if indicated for acute ischemic stroke". Class 2B, C-LD.
    expect(card.summary).toContain('IV alteplase may be considered if otherwise indicated for AIS; its risk is not well established (Class 2b, C-LD)');
    expect(card.sources.filter(source => /cavernous malformations/i.test(source.title))).toHaveLength(1);
  });

  it('adds the ARUBA final result (PMID 32562682)', () => {
    expect(topic('brain-avm').summary).toContain('3.39 vs 12.32 per 100 patient-years; HR 0.31');
    expect(urls(topic('brain-avm'))).toContain('https://pubmed.ncbi.nlm.nih.gov/32562682/');
  });

  it('keeps guideline populations and strengths exact on smaller cards', () => {
    expect(topic('goals-of-care').summary).toContain('after ICH, a surrogate–physician shared decision-making model is reasonable');
    expect(topic('goals-of-care').summary).toContain('(AHA 2022 ICH, 2a)');
    // AAN 2025: should not prescribe; should taper; refer for psychological treatment.
    expect(topic('functional-seizures').summary).toMatch(/Do not prescribe.*taper.*psychological treatment/);
    // ESO 2022 UIA abstract: "All recommendations were based on very low evidence."
    expect(topic('unruptured-aneurysms').summary).toContain('All ESO recommendations');
    // Zalewski 2019: "mild inflammation in 7 of 89 patients (8%)".
    expect(topic('spinal-cord-infarction').summary).toContain('mildly inflammatory in only 8%');
  });

  it('no longer asserts the content of the unread AHA aSAH correction', () => {
    const sah = read('src/reference/coverage.json').find(entry => entry.id === 'sah-2023');
    expect(sah.access).not.toContain('renumbers seizure-section references only');
    expect(sah.access).toContain('not re-read');
  });
});
