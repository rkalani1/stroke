// Evidence-tab checks from the 2026-10-21 ev-acute second review (IVT, BP, hemorrhage, reversal).
// Expected values come from the primary sources named beside each assertion, read on 2026-10-21:
// PubMed abstracts, PMC full text, or (for AHA/ASA 2026 AIS wording) the archived transcription at
// archive/pre-encounter-first-20261001-4f8e99d (secondary scope; the guideline is not in PMC).
import { describe, expect, it } from 'vitest';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';
import { calculateAlteplaseDoseReviewed, calculateTNKDoseReviewed } from '../src/calculators.js';

const data = readClinicalReference();
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const source = (record, pmid) => record.sources.find(item => item.url === `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);

// US TNKase AIS label dose table as reproduced in Grotta & Haley, Stroke Vasc Interv Neurol 2025;5:e001824
// (PMID 41573708, PMC12697625, Table 1): mg by weight band, 5 mg/mL.
const LABEL_BANDS = [[0, 60, 15], [60, 70, 17.5], [70, 80, 20], [80, 90, 22.5], [90, Infinity, 25]];
const labelDose = kg => LABEL_BANDS.find(([low, high]) => kg >= low && kg < high)[2];

describe('ev-acute Evidence cards (2026-10-21)', () => {
  it('still validates against the reference contract on the review date', () => {
    expect(validateClinicalReference(data, { now: new Date('2026-10-21T23:59:59Z') })).toEqual([]);
  });

  it('separates the US label scope and weight bands from the guideline dose on the thrombolytic-choice card', () => {
    const card = topic('thrombolytic-choice');
    // ais-2026-98 (archive, COR 1, LOE A) and AcT (PMID 35779553): 0.25 mg/kg max 25 mg; 0.9 mg/kg max 90 mg.
    expect(card.summary).toContain('tenecteplase 0.25 mg/kg (max 25 mg) as a single bolus or alteplase 0.9 mg/kg (max 90 mg) (AHA 2026, COR 1)');
    // PMC12697625: FDA approved TNK labeling for AIS on 2025-02-28; neither agent is labeled beyond 3 h.
    expect(card.caution).toContain('US labels cover alteplase and (since February 2025) tenecteplase within 3 h of onset');
    expect(card.caution).toContain('five weight bands (15–25 mg), above 0.25 mg/kg below 100 kg (0.33 mg/kg at 45 kg)');
    expect(card.caution).toContain('A positive trial does not establish local approval or availability of a newer thrombolytic.');
    const label = source(card, '41573708');
    expect(label).toMatchObject({ year: 2025, type: 'Report', checkedAt: '2026-10-21' });
    expect(label.access).toContain('PMC12697625');
    expect(label.access).toContain('the FDA label was not reachable');
  });

  it('derives the card arithmetic from the label table and matches the shared calculator', () => {
    // Every band delivers more than 0.25 mg/kg for weights below 100 kg (the cap equals 0.25 mg/kg at 100 kg).
    for (let tenths = 300; tenths < 1000; tenths += 1) {
      const kg = tenths / 10;
      expect(labelDose(kg) / kg).toBeGreaterThan(0.25);
    }
    expect(labelDose(100) / 100).toBe(0.25);
    expect(Math.round((labelDose(45) / 45) * 100) / 100).toBe(0.33);
    // The calculator's label mode reproduces the same table (doses and 5 mg/mL volumes).
    const table = calculateTNKDoseReviewed(80, 'fda-label').doseTable;
    expect(table.map(band => band.dose)).toEqual([15, 17.5, 20, 22.5, 25]);
    expect(table.map(band => band.vial)).toEqual(['3 mL', '3.5 mL', '4 mL', '4.5 mL', '5 mL']);
    for (const kg of [45, 59.9, 60, 69.9, 70, 85, 90, 120]) {
      expect(Number(calculateTNKDoseReviewed(kg, 'fda-label').calculatedDose)).toBe(labelDose(kg));
    }
    expect(calculateTNKDoseReviewed(45, 'fda-label').deliveredMgPerKg).toBe(0.333);
    // Guideline arithmetic: 0.25 mg/kg capped at 25 mg (AcT; EXTEND-IA TNK, PMID 29694815).
    expect(calculateTNKDoseReviewed(45, 'guideline').calculatedDose).toBe('11.25');
    expect(calculateTNKDoseReviewed(120, 'guideline').calculatedDose).toBe('25');
    // AcT: alteplase 0.09 mg/kg bolus, then 0.81 mg/kg over 60 min, total capped at 90 mg.
    expect(calculateAlteplaseDoseReviewed(70)).toMatchObject({ totalDose: 63, bolus: 6.3, infusion: 56.7 });
    expect(calculateAlteplaseDoseReviewed(120)).toMatchObject({ totalDose: 90, bolus: 9, infusion: 81, capped: true });
  });

  it('keeps the two COR 3 categories apart on the malignant-edema card', () => {
    const item = topic('malignant-edema').consider.join(' ');
    // Archive ais-2026-187 (COR 3: Harm, C-LD): hypothermia, barbiturates or corticosteroids for swelling.
    expect(item).toContain('Avoid hypothermia, barbiturates and corticosteroids for swelling (COR 3: Harm)');
    // Archive ais-2026-186 (COR 3: No Benefit, B-R); CHARM (PMID 39577921) primary analysis ages 18-70, cOR 1.17 (0.80-1.71).
    expect(item).toContain('IV glibenclamide did not help at ages 18–70 (COR 3: No Benefit)');
    expect(item).not.toMatch(/glibenclamide did not help \(COR 3\)/);
  });

  it('states the ESO vasopressor population and the Cochrane population on the acute-bp card', () => {
    const card = topic('acute-bp');
    // ESO 2025 update abstract (PMID 42095756): "Routine use of vasopressors to raise BP in AIS patients with
    // neurological deterioration who are not treated with acute reperfusion therapies is discouraged (low-certainty evidence)."
    expect(card.consider[1]).toContain('For neurological deterioration without IVT or EVT, ESO 2025 discourages routine vasopressors to raise BP (low certainty)');
    // Cochrane CD016085.pub2 (PMID 42445947): reperfusion by IVT or EVT; intensive = any SBP target <160 vs <180.
    expect(card.summary).toContain('Cochrane 2026 (after IVT or EVT; targets <160) found probably higher mortality (RR 1.19, 95% CI 1.08–1.32)');
    for (const pmid of ['42095756', '30739745', '42445947']) expect(source(card, pmid).checkedAt).toBe('2026-10-21');
    // Archive ais-2026-75 (COR 3: No Benefit, B-R) is limited to mild-to-moderate AIS treated with IVT; the ENCHANTED
    // abstract (PMID 30739745) draws the same population boundary and reports any ICH 14.8% vs 18.7%.
    expect(card.consider[0]).toContain('After alteplase for mild-to-moderate stroke, SBP 130–140 did not improve 90-day function versus <180');
    expect(card.consider[0]).toContain('(14.8 vs 18.7%) (ENCHANTED; AHA 2026 COR 3: No Benefit)');
    // Archive ais-2026-72/-74/-76/-77 and the ESO abstract thresholds, re-read unchanged.
    expect(card.summary).toContain('Before IVT <185/110');
    expect(card.summary).toContain('after IVT <180/105 for at least 24 h');
    expect(card.summary).toContain('during and for 24 h after EVT ≤180/105 (AHA 2026, 2a; ESO 2025 update: <180/105)');
  });

  it('attributes the ICH blood-pressure safeguards to the 2025 ESO consensus', () => {
    const card = topic('ich-management');
    // ESO/EANS 2025 ICH guideline PICO 2 consensus and the ESO 2025 BP update PICO 7 consensus (archive):
    // avoid SBP reductions >70 mmHg from baseline or active lowering below 110 mmHg.
    expect(card.caution).toContain('avoid SBP drops >70 mm Hg or below 110 (ESO 2025 consensus)');
    expect(card.caution).not.toContain('ESO 2026');
  });

  it('keeps the re-verified ICH bundle targets and their mg/dL conversions', () => {
    const summary = topic('ich-management').summary;
    // INTERACT3 (PMID 37245517): SBP <140; glucose 6.1-7.8 / 7.8-10.0 mmol/L; temperature <=37.5 C; INR <1.5; cOR 0.86.
    expect(summary).toContain('INTERACT3: better 6-month mRS, cOR 0.86');
    expect(summary).toContain('glucose 6.1–7.8 mmol/L (≈110–140 mg/dL; 7.8–10.0 mmol/L ≈140–180 mg/dL with diabetes)');
    const mgdl = mmol => Math.round((mmol * 180.16) / 10 / 10) * 10; // glucose 180.16 g/mol, rounded to 10 mg/dL
    expect([6.1, 7.8, 10].map(mgdl)).toEqual([110, 140, 180]);
    expect(summary).toContain('temperature ≤37.5 °C; INR <1.5 after warfarin');
    // ich-2022-25 (maintained projection) and ATACH-2 (PMID 27276234): renal adverse events 9.0 vs 4.0%.
    expect(summary).toContain('Do not acutely lower SBP below 130 in mild-to-moderate ICH presenting with SBP >150');
    expect(summary).toContain('9.0 vs 4.0%');
  });

  it('keeps the re-verified reversal, surgery, SAH and CVT numbers', () => {
    // ANNEXA-I (PMID 38749032).
    expect(study('annexa-i').result).toContain('67.0% versus 53.1% (adjusted difference 13.4 percentage points; 95% CI 4.6–22.2)');
    expect(study('annexa-i').result).toContain('10.3% versus 5.6%, including ischemic stroke in 6.5% versus 1.5%');
    expect(study('annexa-i').comparison).toContain('85.5% of usual-care patients received PCC');
    // ENRICH (PMID 38598795), FASTEST (PMID 41653933), SWITCH (PMID 38761811).
    expect(study('enrich').result).toContain('0.458 versus 0.374 (difference 0.084; 95% Bayesian credible interval 0.005–0.163)');
    expect(study('fastest').result).toContain('adjusted cOR 1.09; 95% CI 0.79–1.51');
    expect(study('switch').result).toContain('44% versus 58% (adjusted risk ratio 0.77; 95% CI 0.59–1.01; p=0.057)');
    // British Aneurysm Nimodipine Trial (PMID 2496789) supports the label regimen; the SAH card keeps the COR 1/A grade only.
    expect(topic('sah').recommendations.find(rec => rec.id === 'sah-2023-54')).toMatchObject({ cor: '1', loe: 'A' });
    expect(topic('sah').recommendations.find(rec => rec.id === 'sah-2023-16')).toMatchObject({ cor: '1', loe: 'B-NR' });
    // RE-SPECT CVT (PMID 31479105) and ACTION-CVT (PMID 35143325).
    expect(topic('cvt').summary).toContain('major bleeding 1.7 vs 3.3%');
    expect(topic('cvt').summary).toContain('ACTION-CVT (observational) found similar recurrence and less major hemorrhage (aHR 0.35)');
    expect(study('respect-cvt').result).toContain('Major bleeding 1.7% (1, intestinal) vs 3.3% (2, intracranial)');
  });
});
