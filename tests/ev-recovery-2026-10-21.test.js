// Evidence-tab content checks from the 2026-10-21 rehabilitation, inpatient-care and
// specific-population review. Expected values come from the primary sources named beside
// each assertion (PubMed abstracts, PMC full text) or, for AHA/ASA AIS 2026 and ICH 2022
// wording, the maintained projection (src/guidelines) or the archived transcription
// (git 4f8e99d:data/guidelines), which is secondary to the inaccessible full text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const urls = record => record.sources.map(source => source.url);
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const source = (record, pmid) => record.sources.find(entry => entry.url === pubmed(pmid));
const ais2026 = id => read('src/guidelines/ais-2026.json').recommendations.find(rec => rec.id === id);

describe('rehabilitation and recovery cards (2026-10-21 review)', () => {
  it('validates against the reference contract at the review date', () => {
    // Review cutoff moved to 2026-10-31: the evidence-currency pass re-read and re-dated sources that day.
    expect(validateClinicalReference(data, { now: new Date('2026-10-31T23:59:59Z') })).toEqual([]);
  });

  it('attributes recovery grades to AIS 2026 and keeps the SSRI grade as No Benefit', () => {
    const card = topic('recovery');
    // Archive ais-2026-179 (1, A), -181 (3: Harm, B-R), -174/-175 (1), -180 (3: No Benefit, A).
    expect(card.summary.startsWith('AHA/ASA AIS 2026:')).toBe(true);
    expect(card.summary).not.toContain('(AHA 2026, COR 1)');
    // ais-2026-181 anchors the window to stroke onset (evidence-fixes 2026-10-22, R1-01).
    expect(card.summary).toContain('within 24 h of stroke onset (COR 3: Harm)');
    expect(card.summary).toContain('SSRIs are not recommended for motor or functional recovery (COR 3: No Benefit)');
    // FOCUS cOR 0.951, AFFINITY 0.94, EFFECTS 0.94 for mRS; fractures 2.88 vs 1.47%, 3 vs 1%, 4 vs 2%.
    expect(card.summary).toContain('fluoxetine 20 mg daily for 6 months did not improve mRS and increased fractures (FOCUS, AFFINITY, EFFECTS)');
    for (const pmid of ['30528472', '32702334', '32702335']) expect(source(card, pmid)).toMatchObject({ type: 'Randomized trial', checkedAt: '2026-10-21' });
    // PMID 42657476 abstract: published 2026-08-27; no PMC copy, so its recommendations are not quoted.
    expect(card.caution).toContain('the August 2026 AHA/ASA rehabilitation guideline was not reviewed');
    const coverage = read('src/reference/coverage.json').find(entry => entry.id === 'aha-stroke-rehabilitation-2026');
    // PubMed record and abstract re-read on 2026-10-22 (evidence-fixes R1-04/05); re-checked 2026-10-31 (currency
    // recovery-populations#9), when the 2026-10-26 correction (PMID 42932410, content not reviewed) was recorded.
    expect(coverage).toMatchObject({ checkedAt: '2026-10-31', url: pubmed('42657476') });
    expect(coverage.access).toContain('A correction was published 2026-10-26 (PMID 42932410');
    expect(coverage.access).toContain('replaces the 2016 guideline');
    expect(coverage.access).toContain('recommendations not reviewed or quoted');
  });

  it('names the guideline behind the depression screening and treatment grades', () => {
    expect(topic('psychosocial-recovery').summary).toContain('structured inventory (AHA/ASA AIS 2026, COR 1)');
  });

  it('gives the ESO 2025 aphasia, motor and visual recommendations with their strength', () => {
    // PMC12098336 Table 4: recommend ≥20 h; suggest ≥3 h/week and ≥4 days/week; tDCS only in trials.
    const aphasia = topic('aphasia');
    expect(aphasia.summary).toContain('at least 20 h in total (ESO 2025, recommended), ideally ≥3 h a week on ≥4 days (suggested)');
    // PICO 6 expert consensus (12/12): tDCS only alongside SLT in a high-quality trial (evidence-fixes R1-52/54).
    expect(aphasia.summary).toContain('Use tDCS alongside therapy only within high-quality trials (ESO expert consensus; benefit uncertain).');
    expect(source(aphasia, '40401776').access).toContain('PMC12098336');
    // PMID 40401760 abstract: 20 h upper limb (weak, very low); high-intensity gait (strong, moderate, chronic stroke, stable CV status).
    const motor = topic('motor-recovery').summary;
    expect(motor).toContain('at least 20 h of repetitive upper-limb practice (weak, very low certainty)');
    expect(motor).toContain('chronic stroke with stable cardiovascular status (strong, moderate certainty)');
    // PMC12098360 Table 14: suggest screening by eye team or at least a validated tool; timing is expert consensus
    // (feasible within 3–4 days, most within 1 week), not a graded recommendation (evidence-fixes R1-55/57).
    const visual = topic('visual-recovery');
    expect(visual.summary).toContain('ideally by eye-team assessment or at least with a validated tool');
    expect(visual.summary).toContain('by ESO expert consensus this is feasible within 3–4 days and most patients can be assessed within the first week');
    expect(visual.summary).toContain('visual scanning training for field loss');
  });

  it('states the AHA 2026 spasticity statement definition of early treatment', () => {
    // PMC13063836: early intervention = within the first 3 months; NIHSS ≥10 is a risk factor;
    // "The most robust evidence supported early administration of botulinum toxin."
    const card = topic('spasticity');
    expect(card.summary).toContain('defines early treatment as within 3 months');
    expect(card.summary).toContain('botulinum toxin has the most early-treatment evidence');
    expect(card.summary).toContain('NIHSS ≥10');
    expect(card.consider.length).toBeGreaterThanOrEqual(2);
  });

  it('carries the AAN 2025 seizure-free interval as a position, not law', () => {
    // PMID 40073306 abstract positions 4, 5 and 7.
    const card = topic('driving-work');
    expect(card.summary).toContain('licensing should ordinarily require at least 3 seizure-free months, extended individually');
    // r3 2026-10-22 (recovery-rest#0): in position 5 "unlikely to reoccur" describes the provoking factor, not the seizure;
    // the archived transcription gives the example (major systemic infection with high fever) and lists "structural brain
    // lesion (e.g., stroke ...)" among unfavorable factors, so the old pinned phrase is replaced.
    expect(card.summary).not.toContain('exclusively provoked seizures unlikely to recur may need no interval');
    expect(card.summary).toContain('seizures exclusively provoked by a factor unlikely to recur (e.g., major systemic infection with high fever) may need no interval, but a structural lesion such as stroke is an unfavorable factor that can extend it');
    expect(card.caution).not.toContain('universal waiting period');
    expect(card.caution).toContain('not state law or individual clearance');
    // Archived transcription: "Many states require different seizure-free intervals ranging from 3 to 18 months".
    expect(card.caution).toContain('state seizure-free intervals vary (3 to 18 months) and should be followed');
  });

  it('labels VNS evidence that postdates the 2021 trial', () => {
    const vns = study('vns-rehab');
    // Cochrane 2026 (PMID 41823357): 10 RCTs, 7 transcutaneous, very low certainty, mostly high risk of bias.
    expect(vns.limits).toContain('A 2026 Cochrane review (10 RCTs, 7 transcutaneous; mostly high risk of bias) rated the arm-motor evidence very uncertain');
    // PMID 42447422: post hoc, pooled, both arms continued active stimulation after the trial.
    expect(vns.limits).toContain('2-year gains (post hoc) are uncontrolled');
    expect(urls(vns)).toEqual(expect.arrayContaining([pubmed('33894832'), pubmed('42447422'), pubmed('41823357')]));
    // The primary result is unchanged: 5.0 vs 2.4 points, difference 2.6 (1.0–4.2).
    expect(vns.result).toContain('5.0 versus 2.4 points (difference 2.6; 95% CI 1.0–4.2)');
  });
});

describe('inpatient-care cards (2026-10-21 review)', () => {
  it('keeps CLOTS 3 timing and adds the ICH heparin grades', () => {
    const card = topic('vte-prevention');
    // CLOTS 3 (PMID 23727163): enrolled day 0 to day 3 of admission; 8.5 vs 12.1%.
    expect(card.summary).not.toContain('from admission');
    expect(card.summary).toContain('CLOTS 3, started within 3 days of admission: proximal DVT 8.5 vs 12.1%');
    // Archive ich-2022-56 (1, B-R), -57 (2a, C-LD), -58 (2b, C-LD).
    expect(card.summary).toContain('Nonambulatory after ICH: IPC from the day of diagnosis (AHA 2022, COR 1); low-dose UFH or LMWH can be useful (2a), and starting it 24–48 h after onset may be reasonable (2b)');
  });

  it('separates prophylactic antibiotics (No Benefit) from prompt treatment of diagnosed pneumonia', () => {
    const card = topic('stroke-pneumonia');
    // Archive ais-2026-177: COR 3: No Benefit, LOE A. ESO 2026 (PMID 42095755) abstract: standardized criteria; prompt empirical antibiotics.
    expect(card.summary).toContain('(AHA/ASA AIS 2026, COR 3: No Benefit; ESO 2026)');
    expect(card.summary).toContain('start empirical antibiotics promptly');
    // PMC13151663: CT and CRP are "useful adjuncts in selected cases" (evidence-fixes R1-26/30).
    expect(card.summary).toContain('standardized criteria (e.g., PISCES probable or definite), not from a risk score; chest CT or CRP may add value in selected cases (ESO 2026)');
  });

  it('keeps the post-EVT blood-pressure harm within its population', () => {
    const rec = ais2026('ais-2026-77');
    expect(rec).toMatchObject({ classOfRec: 'III', classNote: 'Harm', levelOfEvidence: 'A' });
    expect(rec.text).toContain('anterior circulation LVO');
    expect(rec.text).toContain('first 72 hours');
    expect(topic('inpatient-care').caution).toContain('targeting SBP <140 for 72 h after successful anterior-LVO EVT is harmful');
  });

  it('describes FOOD as testing early PEG with a borderline difference', () => {
    // PMID 15733717: +7.8% (0.0 to 15.5, p=0.05); "do not support a policy of early initiation of PEG".
    expect(topic('poststroke-dysphagia').caution).toContain('early PEG increased death or poor outcome versus nasogastric feeding (P=0.05)');
    expect(study('food-feeding-route').result).toContain('7.8 percentage points (95% CI 0.0–15.5; P=0.05)');
  });

  it('labels aSAH imaging grades and the newer ESO position', () => {
    // Archive sah-2023-50/-51 (2a, B-NR); ESO 2026 pico6b-c1 (no TCD recommendation), pico10-c1 (consensus).
    const summary = topic('imaging-follow-up').summary;
    expect(summary).toContain('CTA/CTP and TCD for vasospasm (AHA 2023, 2a; ESO 2026 makes no TCD recommendation)');
    expect(summary).toContain('image again at ≥12 months (ESO 2026 consensus)');
  });
});

describe('specific-population cards (2026-10-21 review)', () => {
  it('restores the ICA/M1 and NIHSS limits of the prestroke-disability grades', () => {
    expect(ais2026('ais-2026-118')).toMatchObject({ classOfRec: 'IIa', levelOfEvidence: 'B-NR' });
    expect(ais2026('ais-2026-119')).toMatchObject({ classOfRec: 'IIb', levelOfEvidence: 'B-NR' });
    expect(ais2026('ais-2026-118').text).toContain('(ICA or M1) presenting within 6 hours, NIHSS 6 or greater, ASPECTS 6 or greater, and prestroke mRS of 2');
    expect(topic('preexisting-disability').summary).toContain('ICA or M1 occlusion within 6 h with NIHSS ≥6 and ASPECTS ≥6: EVT is reasonable at prestroke mRS 2 (2a) and might be reasonable at mRS 3–4 (2b)');
  });

  it('keeps the pediatric EVT windows separate', () => {
    // Archive ais-2026-133 (≥6 y, ≤6 h, 2a), -134 (≥6 y, 6–24 h, salvageable tissue, 2a), -135 (28 d–6 y, ≤24 h, salvageable tissue, 2b).
    const card = topic('pediatric-stroke');
    expect(card.summary).not.toContain('aged 6 or older within 24 h (2a)');
    expect(card.summary).toContain('at age 6 or older within 6 h, or 6–24 h with salvageable tissue (2a)');
    expect(card.summary).toContain('from 28 days to 6 years within 24 h with salvageable tissue (2b)');
    expect(card.recommendations.find(rec => rec.id === 'ais-2026-133').text).toContain('within 6 hours of symptom onset');
  });

  it('attributes pregnancy reperfusion support to ESO expert consensus', () => {
    const card = topic('maternal-stroke');
    // AHA 2026 (PMID 41603019) abstract: "Pregnancy should not delay evidence-based treatments"; CT, CTA and noncontrast MRI are safe.
    // Evidence-fixes 2026-10-22 (BL-17, R1-10/12): the bottom line carries the IVT caveat; no RCT included pregnant or postpartum patients.
    expect(card.summary).toContain('Pregnancy should not delay evidence-based treatment of acute stroke, and CT, CTA and noncontrast MRI are safe (AHA 2026 maternal statement), but IVT needs an individual risk–benefit review (ESO 2022 consensus).');
    expect(card.summary).not.toContain('IVT and EVT are supported when benefits outweigh risks (AHA 2026');
    // ESO 2022 (PMC9134774): no RCTs; majority suggested IVT after individual benefit/risk assessment; all suggested MT;
    // MT preferred whenever possible, IVT not withheld if MT inaccessible; no IVT data <10 days postpartum.
    expect(card.summary).toContain('No reperfusion RCT included pregnant or postpartum patients; ESO 2022 expert consensus supports thrombectomy for LVO (preferred over IVT whenever possible)');
    expect(card.summary).toContain('ESO found no IVT data within 10 days of delivery');
    expect(read('src/reference/coverage.json').find(entry => entry.id === 'eso-stroke-in-women-2022').access).toContain('PMC9134774');
  });

  it('states the appropriate-use cautions on thrombolysis with antiamyloid antibodies', () => {
    const card = topic('antiamyloid-vascular-risk');
    // Lecanemab AUR (PMC10313141): recommend patients on lecanemab not be treated with acute thrombolytics.
    // Donanemab AUR (PMC12180672) 5.3: no IVT without MRI unequivocally excluding ARIA; CT/CTA may miss ARIA;
    // thrombectomy without a thrombolytic should be considered for LVO.
    expect(card.summary).toContain('may be missed on CT/CTA');
    expect(card.summary).toContain('advise against thrombolysis in treated patients (donanemab: unless MRI unequivocally excludes ARIA)');
    expect(card.summary).toContain('the donanemab AUR says thrombectomy without thrombolysis should be considered for LVO');
    expect(card.caution).toContain('the lecanemab AUR advises stopping infusions');
    expect(source(card, '37357276').access).toContain('PMC10313141');
    expect(source(card, '40155270').access).toContain('PMC12180672');
    // Currency 2026-10-31 (secondary-prevention#0): the 2026 AHA ARIA Summit proceedings are now read in PMC full text.
    expect(source(card, '42622140')).toMatchObject({ checkedAt: '2026-10-31', access: expect.stringContaining('PMC full text (PMC13695822) read 2026-10-31') });
  });

  it('keeps the sickle cell IVT grade and links goals of care to neuroprognostication', () => {
    expect(ais2026('ais-2026-110')).toMatchObject({ classOfRec: 'IIa', levelOfEvidence: 'B-NR' });
    // The IVT clause now sits inside the bottom line (evidence-fixes BL-20), hence the lower-case "eligible".
    expect(topic('sickle-cell-stroke').summary).toContain('eligible adults can receive IVT without excess sICH or other thrombolytic complications (AHA 2026, 2a)');
    const goals = topic('goals-of-care');
    expect(goals.related).toEqual([{ label: 'Neuroprognostication', href: '#/evidence/neuroprognostication' }]);
    expect(goals.summary).toContain('(AHA 2022 ICH, 2a)');
  });
});
