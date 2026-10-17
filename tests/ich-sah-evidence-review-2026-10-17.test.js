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
    expect(validateClinicalReference(data, { now: new Date('2026-10-17T23:59:59Z') })).toEqual([]);
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
  });

  it('states the CLEAR III population and the split AHA grades (PMID 28081952; ich-2022-83/84)', () => {
    const summary = topic('ich-expansion-ivh').summary;
    expect(summary).toContain('stable ICH <30 mL with IVH obstructing the third or fourth ventricle and a routine EVD');
    expect(summary).toContain('increased mRS 5 (17 vs 9%)');
    expect(summary).toContain('reasonable to reduce mortality, 2a; functional benefit uncertain, 2b');
    // ich-2022-74 and ich-2022-82 are separate COR 1 populations.
    expect(summary).toContain('Hydrocephalus contributing to reduced consciousness: ventricular drainage (AHA 2022, COR 1)');
    expect(summary).toContain('large IVH with impaired consciousness: EVD rather than medical management alone (COR 1)');
  });

  it('adds the 2026 tranexamic acid IPD meta-analysis without implying functional benefit (PMID 42276775)', () => {
    const card = topic('ich-expansion-ivh');
    expect(card.summary).toContain('no 90-day functional benefit (adjusted cOR 0.93)');
    expect(card.summary).toContain('7-day death (aOR 0.70) and hematoma expansion (OR 0.81)');
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/42276775/');
  });

  it('completes the AHA recurrence factor list and adds AF-restart timing and pooled RCT data (ich-2022-109/115; PMID 41446322)', () => {
    const summary = topic('caa-ich-recurrence').summary;
    expect(summary).toContain('poor BP control, Asian or Black race and APOE ε2/ε4 (AHA 2022, 2a)');
    expect(summary).toContain('starting 7–8 weeks after ICH may be considered after weighing individual factors (AHA 2022, 2b)');
    expect(summary).toContain('ischemic stroke RR 0.20; recurrent ICH RR 3.14');
    expect(urls(topic('caa-ich-recurrence'))).toContain('https://pubmed.ncbi.nlm.nih.gov/41446322/');
  });

  it('qualifies the <130 harm population, converts glucose to mg/dL and adds timing evidence on the first-hour card', () => {
    const card = topic('ich-management');
    // ich-2022-25: mild to moderate ICH presenting with SBP >150.
    expect(card.summary).toContain('Do not acutely lower SBP below 130 in mild-to-moderate ICH presenting with SBP >150');
    // INTERACT3 targets 6.1–7.8 and 7.8–10.0 mmol/L × 18.0 mg/dL per mmol/L.
    expect(Math.round(6.1 * 18)).toBe(110); expect(Math.round(7.8 * 18)).toBe(140); expect(Math.round(10 * 18)).toBe(180);
    expect(card.summary).toContain('6.1–7.8 mmol/L (≈110–140 mg/dL; 7.8–10.0 mmol/L ≈140–180 mg/dL with diabetes)');
    // Pooled INTERACT1–4 (PMID 40541207) is labeled as not changing guideline grades.
    expect(card.summary).toMatch(/INTERACT1–4 \(11,312 patients\).*OR 0\.85.*OR 0\.83.*within 3 h.*does not change the AHA 2022 grades/);
    // INTERACT4 (PMID 38752650): pre-imaging lowering harmed ischemic stroke.
    expect(card.caution).toContain('ambulance lowering before imaging (INTERACT4) gave no overall benefit and worse outcome in ischemic stroke (cOR 1.30)');
    expect(urls(card)).toEqual(expect.arrayContaining(['https://pubmed.ncbi.nlm.nih.gov/40541207/', 'https://pubmed.ncbi.nlm.nih.gov/38752650/']));
  });

  it('restates the disjunctive craniectomy population and adds Cochrane 2025 / ESO-EANS 2025 surgery evidence', () => {
    const card = topic('ich-surgery');
    // ich-2022-90: comatose, OR large hematoma with significant midline shift, OR refractory ICP.
    expect(card.consider.join(' ')).toContain('coma, a large hematoma with significant midline shift, or refractory ICP (2b)');
    expect(card.consider.join(' ')).toMatch(/Cochrane 2025.*RR 1\.36, low certainty.*RR 0\.71, moderate certainty.*high risk of bias/);
    expect(card.consider.length).toBeLessThanOrEqual(4);
    expect(urls(card)).toEqual(expect.arrayContaining(['https://pubmed.ncbi.nlm.nih.gov/40673401/', 'https://pubmed.ncbi.nlm.nih.gov/40401775/']));
  });
});
