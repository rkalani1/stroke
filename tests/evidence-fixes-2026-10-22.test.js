// Evidence-tab corrections from the 2026-10-22 evidence-fixes pass (verifier findings R1-01..67 and
// BL-01..48; decisions in docs/review-2026-10-21/evidence-fixes.md). Expected strings come from sources
// re-read on 2026-10-22 and named beside each assertion: PubMed abstracts, PMC full text, or the archived
// guideline transcription at git 4f8e99d (archive scope, secondary to full texts that are not reachable).
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';
import { bottomLine } from '../src/reference-search.js';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const source = (record, pmid) => record.sources.find(entry => entry.url === pubmed(pmid));
const coverage = id => read('src/reference/coverage.json').find(entry => entry.id === id);
const line = id => bottomLine(topic(id).summary);

// A bottom line is one sentence: outside parentheses, no . ! or ? followed by a space and a letter or
// digit, except after the abbreviations bottomLine() itself skips ("U.S.", "e.g.", "vs.").
function innerSentenceEnds(text) {
  const ends = [];
  let depth = 0;
  for (let i = 0; i < text.length - 1; i += 1) {
    const char = text[i];
    if (char === '(' || char === '[') depth += 1;
    else if ((char === ')' || char === ']') && depth > 0) depth -= 1;
    else if (depth === 0 && '.!?'.includes(char) && /^\s+["'“(\[]?[A-Za-z0-9]/.test(text.slice(i + 1))
      && !/(?:\b(?:vs|e\.g|i\.e|etc|approx|al|Dr|No|Fig|ca|cf|min|max|mo|yr|yrs|wk|wks|h|hr|hrs|St|Mt)|\b[A-Z])$/.test(text.slice(0, i))) ends.push(i);
  }
  return ends;
}

describe('evidence-fixes 2026-10-22: structure', () => {
  it('validates against the reference contract on the review date', () => {
    // Review cutoff moved to 2026-10-31: the evidence-currency pass re-read and re-dated sources that day.
    expect(validateClinicalReference(data, { now: new Date('2026-10-31T23:59:59Z') })).toEqual([]);
  });

  it('keeps every Evidence bottom line a single sentence that ends cleanly', () => {
    for (const record of data.topics) {
      const first = bottomLine(record.summary);
      expect(innerSentenceEnds(first), record.id).toEqual([]);
      expect(first, record.id).toMatch(/[.!?]$/);
      // The rest of the summary, if any, starts as a new sentence with a capital or digit.
      const rest = record.summary.slice(first.length).trim();
      if (rest) expect(rest, record.id).toMatch(/^["'“(\[]?[A-Z0-9]/);
    }
  });

  it('dates only re-read sources to 2026-10-22 and says what was read', () => {
    const reread = [...data.topics.flatMap(record => record.sources), ...read('src/reference/coverage.json')]
      .filter(entry => entry.checkedAt === '2026-10-22');
    expect(reread.length).toBeGreaterThanOrEqual(20);
    for (const entry of reread) expect(entry.access, entry.url).toMatch(/abstract|full text|body text|PMC|transcription/i);
  });
});

describe('evidence-fixes 2026-10-22: high-severity items', () => {
  it('ich-management (BL-05): the bundle bottom line carries the INTERACT3 130 floor', () => {
    // INTERACT3 (PMC10401723): "<140 mm Hg within 1 h ... 130 mm Hg being the threshold for the cessation of treatment".
    expect(line('ich-management')).toBe('Run the care bundle in the first hours (INTERACT3: better 6-month mRS, cOR 0.86): SBP <140 started early and reached within 1 h (stop lowering at 130); glucose 6.1–7.8 mmol/L (≈110–140 mg/dL; 7.8–10.0 mmol/L ≈140–180 mg/dL with diabetes); temperature ≤37.5 °C; INR <1.5 after warfarin.');
    // ich-2022-25 (3: Harm) stays in the next sentence with its population.
    expect(topic('ich-management').summary).toContain('Do not acutely lower SBP below 130 in mild-to-moderate ICH presenting with SBP >150 (AHA 2022, harm;');
    // ESO/EANS 2025 PICO 2 consensus (archive): caution with SBP >220, hematoma >30 mL or planned evacuation (R1-60/61).
    expect(topic('ich-management').caution).toBe('Intensive targets are less certain with SBP >220 mm Hg, hematomas >30 mL or planned evacuation; avoid SBP drops >70 mm Hg or below 110 (ESO 2025 consensus).');
    // Re-dated 2026-10-31: abstract and plain-language summary re-read for the ICH surgery card; BP consensus still from the archive.
    expect(coverage('eso-ich-2025')).toMatchObject({ checkedAt: '2026-10-31' });
    expect(coverage('eso-ich-2025').access).toContain('from the archived transcription');
  });

  it('antithrombotic-reversal (BL-36): anticoagulant reversal and antiplatelet transfusion are separate categories', () => {
    // ich-2022-26 (1, C-LD); NCS/SCCM 2026 abstract (conditional); ich-2022-40 (3: Harm, B-R; aspirin, no emergency surgery).
    expect(line('antithrombotic-reversal')).toBe('Anticoagulant-associated ICH: stop the anticoagulant and reverse it as soon as ICH is diagnosed (AHA 2022, COR 1); antiplatelet-associated ICH: no platelet transfusion unless neurosurgery is planned (NCS/SCCM 2026, conditional; AHA 2022 COR 3: Harm for aspirin).');
    const card = topic('antithrombotic-reversal');
    expect(card.summary).toContain('On aspirin and going to neurosurgery: platelet transfusion (conditional).');
    expect(card.summary).not.toContain('Antiplatelets: no platelet transfusion unless neurosurgery is planned');
    expect(card.recommendations.find(rec => rec.id === 'ncs-reversal-2026-2-1')).toMatchObject({ cor: 'Conditional', loe: 'Low' });
    expect(card.recommendations.find(rec => rec.id === 'ich-2022-26')).toMatchObject({ cor: '1', loe: 'C-LD' });
  });

  it('ich-expansion-ivh (BL-48): the no-hemostatic-benefit statement is limited to ICH without anticoagulants', () => {
    // FASTEST abstract: "no recent use of anticoagulation medication"; TICH-2 (PMC5976950) excluded anticoagulant-related ICH.
    expect(line('ich-expansion-ivh')).toBe('In ICH without anticoagulant use, no hemostatic drug has been shown to improve function (anticoagulant-associated ICH still needs rapid reversal: AHA 2022, COR 1).');
    const card = topic('ich-expansion-ivh');
    expect(card.summary).toContain('Recombinant factor VIIa within 2 h (FASTEST) slowed growth by 3.7 mL but did not change 180-day mRS (cOR 1.09)');
    expect(source(card, '29778325')).toMatchObject({ checkedAt: '2026-10-22' });
    expect(source(card, '29778325').access).toContain('excluded ICH secondary to anticoagulation, thrombolysis, trauma or a structural abnormality');
  });

  it('stroke-pneumonia (R1-32 and related): diagnosis, prevention and treatment carry ESO 2026 limits', () => {
    const card = topic('stroke-pneumonia');
    // PMC13151663: standardized criteria; CT and CRP "useful adjuncts in selected cases".
    expect(line('stroke-pneumonia')).toBe('Diagnose stroke-associated pneumonia with standardized criteria (e.g., PISCES probable or definite), not from a risk score; chest CT or CRP may add value in selected cases (ESO 2026).');
    // ESO: early mobilisation within 48 h; ais-2026-181 (3: Harm) for high-dose very early mobilization within 24 h.
    expect(card.summary).toContain('early mobilization within 48 h (ESO 2026), avoiding high-dose, very early mobilization within 24 h of onset (AHA/ASA AIS 2026, COR 3: Harm)');
    expect(card.summary).toContain('do not give prophylactic antibiotics (AHA/ASA AIS 2026, COR 3: No Benefit; ESO 2026)');
    // ESO expert consensus: cultures where feasible, HAP protocols beyond day 7, ≥5 days, stop if SAP is refuted.
    expect(card.summary).toContain('take cultures where feasible and start empirical antibiotics promptly under local protocols for aspiration-associated pathogens (onset >7 days after stroke: hospital-acquired pneumonia protocols)');
    expect(card.summary).toContain('give at least 5 days guided by response and stop early if SAP is refuted (ESO 2026 expert consensus)');
    expect(card.consider).toHaveLength(3);
    expect(card.consider[2]).toContain('cultures and local microbiology for de-escalation or stopping');
    expect(source(card, '42095755')).toMatchObject({ checkedAt: '2026-10-22' });
    expect(source(card, '42095755').access).toContain('PMC13151663');
  });
});

describe('evidence-fixes 2026-10-22: medium-severity bottom lines', () => {
  it('states the population or timing qualifier in the collapsed row', () => {
    // ais-2026-98: "within 4.5 hours of symptom onset or last known well who are eligible for IVT" (adults).
    expect(line('acute-reperfusion')).toContain('within 4.5 h of onset or last known well in an otherwise IVT-eligible adult');
    // NCS/SCCM 2016 (archive): discontinue thrombolytic when ICH is present or suspected.
    expect(line('post-ivt-complications')).toBe('Neurological worsening during or after IVT: stop any running thrombolytic and get an emergent CT.');
    expect(topic('post-ivt-complications').summary).not.toContain('protocol: stop a running thrombolytic');
    // ich-2022-26: reversal as soon as possible after diagnosis.
    expect(line('anticoagulant-labels')).toContain('in anticoagulant-associated ICH, identify the drug and last dose but do not delay reversal (AHA 2022, COR 1)');
    // ais-2026-154 "early oral anticoagulation" vs ais-2026-159 (3: No Benefit).
    expect(line('af-timing')).toMatch(/^Early oral anticoagulation is reasonable/);
    // secondary-prevention-2021-116; ais-2026-142; AHA 2024 dissection statement #16 (archive).
    expect(line('dissection')).toContain('Extracranial carotid or vertebral dissection with stroke or TIA');
    expect(line('dissection')).toContain('a large infarct, hemorrhagic transformation or intradural extension may favor antiplatelet therapy (AHA 2024)');
    // AHA 2026 maternal abstract; ESO 2022 (PMC9134774) individual benefit/risk consensus.
    expect(line('maternal-stroke')).toContain('but IVT needs an individual risk–benefit review (ESO 2022 consensus)');
    // PMID 35343235 abstract: "suggest ... when treated, despite their generally worse prognosis overall".
    expect(line('preexisting-disability')).toContain('observational data suggest many treated patients can return to their own baseline despite a worse overall prognosis');
    // ais-2026-110 (2a, B-NR); the unverifiable ASH acute-transfusion wording was not added.
    expect(line('sickle-cell-stroke')).toContain('urgent joint stroke and hematology care, including transfusion decisions');
    expect(topic('sickle-cell-stroke').summary).not.toMatch(/exchange transfusion|ASH 2020/);
    // Lecanemab AUR (PMC10313141) and donanemab AUR (PMC12180672) 5.3.
    expect(line('antiamyloid-vascular-risk')).toContain('appropriate-use recommendations advise against thrombolysis in treated patients');
    // ais-2026-116 (1, A): 6–24 h, ASPECTS 3–5, age <80, no significant mass effect.
    expect(line('evt-selection')).toContain('or ASPECTS 3–5 with age <80 and no significant mass effect (AHA 2026, COR 1)');
    // ais-2026-120 (2a) and -121 (3: No Benefit).
    expect(line('medium-distal-evt')).toBe('Routine EVT for medium or distal occlusion is not supported — AHA 2026 rates nondominant or codominant M2, distal MCA, ACA and PCA occlusion COR 3: No Benefit — but EVT is reasonable for a disabling dominant proximal M2 occlusion within 6 h with NIHSS ≥6, ASPECTS ≥6 and prestroke mRS 0–1 (AHA 2026, 2a).');
    // ais-2026-111 (2b, C-LD); AHA 2021 CRAO statement (archive): immediate ED triage, arteritis screening.
    expect(line('retinal-ischemia')).toContain('although IVT within 4.5 h for non-arteritic CRAO is of uncertain usefulness (AHA 2026, COR 2b)');
    // ais-2026-72/-74 (1), -73/-76 (2a), -77 (3: Harm, anterior LVO, mTICI 2b–3, 72 h).
    expect(line('acute-bp')).toContain('Before IVT <185/110 (AHA 2026, COR 1)');
    expect(line('acute-bp')).toContain('but do not target SBP <140 for 72 h after successful (mTICI 2b–3) anterior-LVO EVT (COR 3: Harm)');
    // ICAA/WSO 2025 rec 1 (archive): suspect CAA at age ≥50.
    expect(line('caa-ich-recurrence')).toMatch(/^In patients aged 50 or older, suspect CAA/);
    // NCS 2023 GPS 1 (PMC10959839); NCS 2026 LHI goals-of-care recommendation (PMC13249629, strong).
    expect(line('neuroprognostication')).toContain('defer ICH neuroprognostication for at least the first 48–72 h of ICU admission (NCS 2023 good-practice statement)');
    expect(line('neuroprognostication')).toContain('discuss goals before deterioration in large hemispheric infarction (NCS 2026, strong)');
    // ESC 2023 t13-5/t22-4 (III, C) and t13-4 (IIb, C), archive scope.
    expect(line('endocarditis')).toContain('do not give IV thrombolysis (ESC 2023, class III; thrombectomy may be considered, IIb)');
    // ACC/AHA 2026 4.2.6-4 (archive): very high risk = ischemic stroke plus another major event or ≥2 high-risk conditions.
    expect(line('lipid-management')).toContain('but LDL-C <55 when very high risk (ischemic stroke plus another major ASCVD event or ≥2 high-risk conditions; ACC/AHA 2026, COR 1)');
    // secondary-prevention-2021-28/-30; long-term targets do not apply acutely.
    expect(line('bp-prevention')).toMatch(/^For long-term prevention after stroke or TIA \(not the acute phase\)/);
    // OCEANIC-STROKE abstract: randomized within 72 h; nonlacunar infarct or atherosclerosis required.
    expect(line('research-adjuncts')).toContain('confirm regulatory status');
    expect(line('research-adjuncts')).toContain('within 72 h of noncardioembolic ischemic stroke or high-risk TIA with a nonlacunar infarct or atherosclerosis');
  });
});

describe('evidence-fixes 2026-10-22: medium-severity card content', () => {
  it('recovery (R1-02): the SSRI No Benefit grade is scoped to recovery, not diagnosed depression', () => {
    // FOCUS/AFFINITY/EFFECTS started fluoxetine 2–15 days after stroke; FOCUS excluded current SSRI-treated depression.
    const card = topic('recovery');
    expect(card.summary).toContain('increased fractures (FOCUS, AFFINITY, EFFECTS), when started 2–15 days after stroke; this does not apply to treating diagnosed depression');
    expect(card.summary).toContain('treat diagnosed depression (COR 1)');
    expect(card.caution).toContain('Grades are from AHA/ASA AIS 2026 (acute ischemic stroke)');
  });

  it('pediatric-stroke (R1-19/20/21): the under-6 operator requirement and the 6–24 h rows are quoted', () => {
    const card = topic('pediatric-stroke');
    expect(card.summary).toContain('EVT by neurointerventionalists with pediatric experience may be reasonable from 28 days to 6 years within 24 h with salvageable tissue (2b).');
    expect(card.recommendations.find(rec => rec.id === 'ais-2026-134')).toEqual({
      text: 'In pediatric patients 6 years or older with ischemic stroke due to LVO, presenting 6-24 hours from symptom onset with potentially salvageable brain tissue, EVT can be effective to improve functional outcomes.',
      cor: '2a', loe: 'B-NR', source: 'AHA/ASA AIS 2026 · ais-2026-134 · p. 60', id: 'ais-2026-134'
    });
    expect(card.recommendations.find(rec => rec.id === 'ais-2026-135')).toEqual({
      text: 'In pediatric patients aged 28 days to 6 years with acute neurological symptoms (including first-time seizure) and AIS due to LVO within 24 hours of symptom onset with potentially salvageable brain tissue, EVT by neurointerventionalists with pediatric experience may be reasonable to improve functional outcomes.',
      cor: '2b', loe: 'B-NR', source: 'AHA/ASA AIS 2026 · ais-2026-135 · p. 60', id: 'ais-2026-135'
    });
  });

  it('inpatient-medical-complications (R1-34/35): AIS grades are labeled as AIS and kept separate', () => {
    // ais-2026-82 (2a), -83 (3: No Benefit), -78 (1), -178 (3: Harm, indwelling catheters); SHINE 80–130 vs 80–179.
    const card = topic('inpatient-medical-complications');
    expect(card.summary).toContain('In ischemic stroke (AHA 2026): treat persistent hyperglycemia to 140–180 mg/dL with close monitoring (2a) but not with IV insulin to 80–130 (COR 3: No Benefit; SHINE vs a sliding-scale 80–179 target');
    expect(card.summary).toContain('avoid routine indwelling bladder catheters (COR 3: Harm)');
    expect(card.summary).toContain('ICH glucose and temperature targets differ (see the ICH card).');
    expect(card.caution).toContain('aphasia, delirium and neurological worsening can coexist');
    expect(card.related.map(link => link.href)).toEqual(['#/evidence/imaging-follow-up', '#/evidence/ich-management']);
  });

  it('maternal-stroke (R1-11/12): ESO consensus limits and the source access scope are explicit', () => {
    const card = topic('maternal-stroke');
    expect(card.summary).toContain('thrombectomy for LVO (preferred over IVT whenever possible) and IVT (in pregnancy by majority), not withheld if thrombectomy is unavailable');
    expect(card.summary).toContain('(systolic ≥160 or diastolic ≥110 mm Hg, confirmed within 15 minutes)');
    expect(card.caution).toContain('Acute stroke alone is not an indication for immediate delivery; stabilize the mother first');
    const statement = source(card, '41603019');
    expect(statement).toMatchObject({ checkedAt: '2026-10-22', title: 'Prevention and Treatment of Maternal Stroke in Pregnancy and Postpartum: A Scientific Statement From the American Heart Association' });
    expect(statement.access).toContain('not verified against the full statement');
    expect(coverage('eso-stroke-in-women-2022').access).toContain('Search to 2020; interpret with newer evidence');
    expect(coverage('eso-stroke-in-women-2022').access).toContain('Erratum 37021188 not reconciled');
  });

  it('acute-bp (R1-66/67): Cochrane targets and the ENCHANTED severe-stroke signal are stated', () => {
    const card = topic('acute-bp');
    expect(card.summary).toContain('Cochrane 2026 (9 RCTs after IVT or EVT; intensive targets <160, mostly <140, vs mostly <180)');
    expect(card.consider[0]).toContain('in its prespecified severe-stroke subgroup (LVO, EVT, large-artery disease or NIHSS >10), intensive lowering raised mortality (OR 1.52; hypothesis-generating)');
    // PMID 33031175 abstract (J Hypertens 2021): mortality OR 1.52 (1.09–2.13).
    expect(source(card, '33031175')).toMatchObject({ year: 2021, type: 'Randomized trial', checkedAt: '2026-10-22' });
  });

  it('spasticity, aphasia, visual and dysphagia cards keep strength, timing and outcome limits', () => {
    // PMC13063836: 3-month working definition; botulinum toxin short-term tone effects; risk factors.
    const spasticity = topic('spasticity');
    expect(spasticity.summary).toContain('within 3 months of stroke onset (a working definition)');
    expect(spasticity.summary).toContain('(mainly short-term reduction in muscle overactivity; functional gains less consistent)');
    expect(spasticity.summary).toContain('early hyperreflexia or spasticity, hemorrhage, NIHSS ≥10, or lesions >3 cm');
    expect(source(spasticity, '41608795').access).toContain('correction 42044236 (Stroke 2026;57(5):e193) not reconciled');
    // PMC12098336: ≥20 h recommended on low-quality evidence; tailoring and delivery modes suggested.
    expect(topic('aphasia').caution).toContain('the ≥20 h recommendation rests on low-quality evidence');
    // PMC12098360: occlusion for diplopia with the monocular caveat.
    expect(topic('visual-recovery').summary).toContain('partial or total occlusion can relieve diplopia; total occlusion leaves the patient monocular');
    // FOOD (PMID 15733717): death +1.0% (P=0.9).
    const dysphagia = topic('poststroke-dysphagia');
    expect(dysphagia.caution).toContain('without a difference in death alone');
    expect(source(dysphagia, '15733717')).toMatchObject({ checkedAt: '2026-10-22', type: 'Randomized trial' });
    // CLOTS 3 (PMID 23727163) and ais-2026-169/-170/-171; ich-2022-58 (hemorrhage-expansion balance).
    const vte = topic('vte-prevention');
    expect(vte.summary).toContain('intermittent pneumatic compression unless contraindicated (AHA/ASA AIS 2026, COR 1;');
    expect(vte.summary).toContain('is reasonable to reduce VTE (2a), although a survival benefit is not well established (2b)');
    expect(vte.summary).toContain('weighing VTE prevention against hematoma expansion');
    expect(source(vte, '23727163')).toMatchObject({ checkedAt: '2026-10-22' });
  });

  it('links the new sources and routes without changing coverage counts', () => {
    expect(coverage('tia-ed-2023').topicIds).toContain('imaging-follow-up');
    expect(coverage('secondary-prevention-2021').topicIds).toContain('sleep-brain-health');
    expect(coverage('aha-stroke-rehabilitation-2026').access).toContain('so later evidence is not reflected');
    expect(topic('preexisting-disability').related.map(link => link.href)).toContain('#/evidence/evt-selection');
    expect(source(topic('preexisting-disability'), '35343235').access).toContain('proposes principles rather than COR/LOE-graded recommendations');
    expect(topic('visual-recovery').related.map(link => link.href)).toContain('#/evidence/retinal-ischemia');
    expect(topic('cancer-stroke').keywords).toContain('cancer evaluation');
    // Currency 2026-10-31 (ivt-acute) added the ESO annual evidence update 2025 and the WSO telestroke statement;
    // (evt-acute-bp) added the CSBPR EVT interim update 2025; (hemorrhagic) added the ERA KDIGO ADPKD commentary;
    // (cardioembolic) added the AHA 2026 endocarditis statement, the 2025 SCAI/HRS LAAO guideline and the WSO 2025 AF statement;
    // (recovery-populations) added CSBPR 2025 rehabilitation Parts One and Three, the WSO 2025 sex/gender statement, IPSO pediatric
    // ICH Parts 1 and 2, the VasCog-2-WSO criteria and the AHA 2026 health literacy statement.
    expect(read('src/reference/coverage.json')).toHaveLength(124);
  });
});
