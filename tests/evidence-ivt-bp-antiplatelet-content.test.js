import { describe, expect, it } from 'vitest';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

// Expected values come from the primary sources named in each assertion (PubMed
// abstracts, PMC full text) or the archived AHA/ASA 2026 transcription, checked
// 2026-10-17. These guard population, grade, route and post-guideline labels on
// the IVT, acute BP and antiplatelet Evidence cards.
const data = readClinicalReference();
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const text = record => [record.summary, ...(record.consider || []), record.caution].join(' ');
const urls = record => record.sources.map(source => source.url);

describe('thrombolysis Evidence cards', () => {
  it('stays inside the structural contract on the review date', () => {
    // Latest review cutoff: sources re-read on 2026-10-21 carry that checkedAt.
    expect(validateClinicalReference(data, { now: new Date('2026-10-21T23:59:59Z') })).toEqual([]);
  });

  it('separates the AHA 2026 imaging grade from the perfusion-selected IVT treatment grades', () => {
    const item = topic('ct-perfusion').consider.join(' ');
    // ais-2026-101 (2a): EVT-ineligible, 4.5–9 h from LKW or within 9 h of the sleep midpoint.
    expect(item).toContain('EVT-ineligible patients at 4.5–9 h from LKW or within 9 h of the sleep midpoint (2a, ais-2026-101)');
    // ais-2026-102 (2b): LVO, 4.5–24 h from onset or LKW, cannot receive EVT; TRACE-III included wake-up/unwitnessed onset.
    expect(item).toContain('up to 24 h from onset or LKW, wake-up included, only LVO with salvageable penumbra that cannot receive EVT is graded (2b, ais-2026-102');
    // ais-2026-53 (2a) grades CTP/DWI-PWI selection, not treatment.
    expect(item).toMatch(/\(ais-2026-53\) grades imaging selection, not IVT itself/);
    expect(item).not.toMatch(/known onset only|unknown onset up to 24 h from LKW \(2a\)/);
  });

  it('keeps every graded DAPT option open for non-disabling deficits', () => {
    const card = topic('acute-reperfusion');
    // ais-2026-91 is COR 3: No Benefit. ais-2026-147 (COR 1): noncardioembolic, NIHSS ≤3, within 24 h.
    // ais-2026-148 (2b, NIHSS ≤5) and -149 (2a, NIHSS 4–5 with presumed atherosclerosis) also apply;
    // ARAMIS (PMID 37367978) randomized non-disabling NIHSS ≤5.
    expect(card.consider[0]).toMatch(/IVT is not recommended \(COR 3: No Benefit\)/);
    expect(card.consider[0]).toContain('DAPT is COR 1 for noncardioembolic minor stroke (NIHSS ≤3) within 24 h, and NIHSS 4–5 options carry lower grades');
    expect(card.consider[0]).not.toMatch(/DAPT only/);
    // ais-2026-122: basilar EVT needs NIHSS ≥10, baseline mRS 0–1 and PC-ASPECTS ≥6.
    expect(card.summary).toContain('basilar occlusion with NIHSS ≥10, prestroke mRS 0–1 and PC-ASPECTS ≥6 (COR 1)');
    expect(card.caution).toMatch(/recent DOAC intake \(IVT after DOAC intake within 48 h: observational cohorts only\)/);
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/36807495/');
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
    expect(card.consider[0]).toMatch(/both postdate the AHA 2026 evidence review \(to March 2025\) and are not graded there/);
    expect(card.summary).toContain('(TIMELESS; TNK-PLUS; basilar: ATTENTION LATE)');
    expect(card.caution).toMatch(/^Benefit beyond 9 h comes from imaging-selected trials in China/);
    expect(card.consider).toHaveLength(4);
    for (const pmid of ['36549308', '37021186', '42776543']) expect(urls(card)).toContain(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
  });

  it('keeps COR 3 subtypes and the ESO LVO population on the thrombolytic-choice card', () => {
    const card = topic('thrombolytic-choice');
    // ais-2026-99 3: No Benefit/A; ais-2026-108 streptokinase 3: Harm; ESO 2023 LVO <4.5 h strong/moderate.
    expect(card.summary).toContain('Do not use tenecteplase 0.4 mg/kg (COR 3: No Benefit, LOE A)');
    expect(card.summary).toContain('for LVO within 4.5 h, ESO 2023 recommends tenecteplase 0.25 mg/kg over alteplase (strong, moderate-quality evidence)');
    expect(card.consider[2]).toMatch(/mutant prourokinase plus low-dose alteplase and adjunctive sonothrombolysis \(COR 3: No Benefit\); streptokinase is COR 3: Harm/);
    expect(card.consider.join(' ')).not.toMatch(/streptokinase and sonothrombolysis \(COR 3\)/);
  });

  it('states the AHA 2026 CRAO population and level and the ESO 2025 suggestion', () => {
    const card = topic('retinal-ischemia');
    // ais-2026-111: non-arteritic CRAO, disabling visual loss, otherwise IVT-eligible, 4.5 h from LKW; 2b / C-LD.
    expect(card.summary).toContain('non-arteritic CRAO with disabling visual loss in an otherwise IVT-eligible adult');
    expect(card.summary).toContain('(AHA 2026, COR 2b, LOE C-LD)');
    expect(card.summary).toContain('TenCRAOS (tenecteplase vs aspirin)');
    // ESO 2025 PICO 9 (PMC12098360): 'we suggest', very low quality, nonrandomized, search through 2023.
    expect(text(card)).toContain('ESO 2025 suggests IVT within 4.5 h for CRAO (weak wording; very low-quality nonrandomized evidence through 2023, before THEIA and TenCRAOS)');
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/40401755/');
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
    expect(card.summary).toContain('EVT without IVT: ≤185/110 before the procedure (AHA 2026, 2a)');
    // ais-2026-77: anterior LVO, mTICI 2b–3, first 72 h; ESO 2025 update: not <140 in first 24 h (high certainty).
    expect(card.summary).toContain('After successful EVT for anterior LVO (mTICI 2b–3), do not target SBP <140 for 72 h (AHA 2026, COR 3: Harm');
    expect(card.summary).toContain('ESO 2025 update: <180/105');
    expect(card.summary).not.toContain('ESO 2026');
    // Cochrane 2026: mortality RR 1.19 (1.08–1.32).
    expect(card.summary).toContain('RR 1.19, 95% CI 1.08–1.32');
    // HOPE: open-label, stopped early, hypothesis-generating per the authors.
    expect(card.summary).toContain('HOPE (2026, post-guideline; open-label, stopped early, hypothesis-generating) favored reperfusion-guided targets but does not override COR 3: Harm');
    // ESO >220/120 statement is expert consensus; ais-2026-70 is 2b; ais-2026-13 is 3: No Benefit.
    expect(card.summary).toContain('ESO 2025 expert consensus: if lowered, reduce SBP by <15% over 24 h');
    expect(card.summary).toContain('No routine prehospital lowering (AHA 2026, COR 3: No Benefit; ESO 2025, moderate certainty');
  });

  it('keeps review points graded', () => {
    const card = topic('acute-bp');
    // ENCHANTED: any ICH 14.8 vs 18.7%; ais-2026-75 is COR 3: No Benefit.
    expect(card.consider[0]).toContain('(14.8 vs 18.7%) (ENCHANTED; AHA 2026 COR 3: No Benefit)');
    // ais-2026-69 has no "only"; ESO 2025 discourages routine vasopressors without reperfusion (low certainty).
    expect(card.consider[1]).not.toMatch(/only when a comorbidity/);
    expect(card.consider[1]).toMatch(/Treat hypertension early when a comorbid condition requires it .*AHA 2026 COR 1\)/);
    expect(card.consider[1]).toContain('ESO 2025 discourages routine vasopressors to raise BP (low certainty)');
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/42445947/');
  });

  it('states HOPE and OPTIMAL-BP limits from their reports', () => {
    const hope = study('hope-post-evt-bp');
    expect(hope.population).toContain('elevated SBP was not required');
    expect(hope.comparison).toContain('antihypertensives or vasopressors as needed');
    expect(hope.limits).toMatch(/stopped early for lack of funding \(446 of 786 planned; 440 analyzed\)/);
    expect(hope.limits).toContain('Only 9.8% had mTICI 2b');
    expect(hope.limits).toContain('COR 3: Harm');
    expect(hope.sources[0].access).toContain('PMC13247842');
    expect(study('optimal-bp').population).toContain('SBP ≥140 mmHg on two readings within 2 h of recanalization');
  });
});

describe('antiplatelet, TIA and research-adjunct Evidence cards', () => {
  it('states the DAPT population and grade on the TIA card', () => {
    const card = topic('tia-evaluation');
    // ais-2026-147: noncardioembolic, NIHSS ≤3 or ABCD2 ≥4, no IVT, within 24 h (COR 1).
    expect(card.summary).toContain('Noncardioembolic high-risk TIA (ABCD2 ≥4) or minor stroke (NIHSS ≤3) within 24 h, without IVT');
    expect(card.summary).toContain('(AHA 2026, COR 1)');
  });

  it('keeps each lower-grade DAPT option with its own grade and comparator', () => {
    const card = topic('minor-stroke-antiplatelets');
    expect(card.summary).not.toContain('Alternatives:');
    // ais-2026-148 2b; -149 2a; -150 2b; CHANCE-2 compared ticagrelor-aspirin with clopidogrel-aspirin.
    expect(card.summary).toContain('TIA with ABCD2 ≥6 or symptomatic stenosis ≥50%; COR 2b; THALES');
    expect(card.summary).toContain('(COR 2a; INSPIRES 7.3 vs 9.2%)');
    expect(card.summary).toContain('rather than clopidogrel-aspirin (COR 2b; CHANCE-2 6.0 vs 7.6%)');
    expect(card.consider[0]).toContain('PRISMS (stopped early)');
    // TAPIS 68.7 vs 62.0%; EAST 89.7 vs 89.6%; ais-2026-137 is 2b / B-NR.
    expect(card.consider[2]).toMatch(/TAPIS .*68\.7 vs 62\.0%.*EAST .*89\.7 vs 89\.6%.*\(COR 2b, B-NR\)/);
    expect(card.consider[2]).not.toMatch(/still rates/);
    expect(urls(card)).toContain('https://pubmed.ncbi.nlm.nih.gov/40973702/');
    expect(card.sources.find(source => source.url === 'https://pubmed.ncbi.nlm.nih.gov/34414300/').access).toContain('PMC8370083');
  });

  it('quotes research-adjunct limits as AHA 2026 states them and gives each tirofiban route and population', () => {
    const card = topic('research-adjuncts');
    // ais-2026-added-32-1 and -158 are 3: No Benefit/A; -153 eptifibatide 3: No Benefit/B-R
    // (population: treated with IVT within 3 h of onset); -138 tirofiban 2b/B-R.
    expect(card.caution).not.toContain('outside trials');
    expect(card.caution).toContain('adjunctive argatroban with IVT (COR 3: No Benefit, LOE A)');
    expect(card.caution).toContain('adjunctive IV eptifibatide in patients given IVT within 3 h of onset (COR 3: No Benefit, LOE B-R)');
    const item = card.consider[3];
    // ASSET-IT (PMID 40616232): 24-h IV infusion after IVT, noncardioembolic, not EVT-eligible.
    expect(item).toContain('as an IV infusion after IVT in noncardioembolic stroke without EVT (ASSET-IT, mRS 0–1 65.9 vs 54.9%');
    // INSTANT (PMID 42100960): no LVO/MeVO, not cardioembolic, inadequate response to tenecteplase.
    expect(item).toContain('after inadequate response to tenecteplase without LVO, MeVO or cardioembolism (INSTANT, 63.8 vs 52.2%)');
    // ATTRACTION (PMID 42341797): intra-arterial bolus then IV infusion after successful EVT.
    expect(item).toContain('as an intra-arterial bolus plus IV infusion after successful EVT (ATTRACTION, mRS 0–2 49 vs 43%');
    expect(item).not.toMatch(/^IV tirofiban/);
    expect(item).toContain('(COR 2b, B-R)');
    expect(card.summary).toContain('EnTRIPS (postconditioning after EVT) was neutral');
    expect(card.consider).toHaveLength(4);
    for (const pmid of ['40616232', '42100960', '42341797']) expect(urls(card)).toContain(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
  });

  it('matches the antiplatelet study cards to their primary reports', () => {
    expect(study('point').population).toContain('randomized within 12 hours at 269 sites in 10 countries (82.8% in the US)');
    expect(study('inspires').headline).toContain('moderate-to-severe bleeding 0.9 vs 0.4%');
  });
});
