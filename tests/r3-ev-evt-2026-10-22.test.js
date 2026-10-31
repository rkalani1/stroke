// Round-3 verification fixes for the EVT and systems-of-care Evidence cards (unit ev-evt, 2026-10-22).
// Decisions: docs/review-2026-10-21/r3-ev-evt.md. Expected wording comes from the sources named beside
// each assertion, re-read on 2026-10-22: the archived AHA/ASA 2026 AIS transcription (git 4f8e99d,
// archive scope), SVIN PMC full texts, the ESO/ESMINT BAO PMC full text, ClinicalTrials.gov registries
// and PubMed abstracts.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';
import { bottomLine } from '../src/reference-search.js';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const source = (record, pmid) => record.sources.find(entry => entry.url === pubmed(pmid));
const studySources = () => Object.fromEntries(read('src/reference/study-sources.json').map(entry => [entry.id, entry]));

describe('r3 ev-evt: systems of care and reperfusion overview', () => {
  it('validates against the reference contract on the review date', () => {
    // Review cutoff moved to 2026-10-31: the evidence-currency pass re-read and re-dated sources that day.
    expect(validateClinicalReference(data, { now: new Date('2026-10-31T23:59:59Z') })).toEqual([]);
  });

  it('rural-telestroke keeps each EMS destination grade inside its own setting (evt-a-systems#0)', () => {
    const summary = topic('rural-telestroke').summary;
    // ais-2026-16 (2a, B-NR): "In areas with local access to thrombectomy-capable centers".
    expect(bottomLine(summary)).toContain('for suspected LVO direct transport to a locally accessible thrombectomy center is reasonable (2a)');
    // ais-2026-17 (2b, B-NR): "without well-coordinated stroke systems of care and without local facilities
    // proficient in thrombolysis and secondary transfer ... (provided it does not disqualify the patient from IVT)".
    expect(summary).toContain('Where there is neither a well-coordinated stroke system nor a local hospital proficient in thrombolysis and secondary transfer, direct transport to the closest thrombectomy-capable center may be reasonable if it does not disqualify the patient from IVT (2b).');
    // ais-2026-18 (3: No Benefit, B-R): "In areas with well-coordinated stroke systems and local facilities proficient
    // in thrombolysis and secondary transfer ... a distant TSC (e.g., 45-60 minutes away) does not improve 3-month clinical outcomes."
    expect(summary).toContain('In a well-coordinated stroke system with a local stroke center proficient in thrombolysis and secondary transfer, bypassing it for a distant thrombectomy-capable center (e.g., 45–60 min away) does not improve 3-month outcome (COR 3: No Benefit).');
    expect(summary).not.toContain('for a distant one');
  });

  it('acute-reperfusion states each EVT tier with its own grade (evt-a-systems#1)', () => {
    const summary = topic('acute-reperfusion').summary;
    // ais-2026-114/-115/-116 (COR 1) and ais-2026-122 (COR 1); ais-2026-117 is 2a, not COR 1.
    expect(summary).toContain('EVT is recommended for ICA/M1 occlusion with NIHSS ≥6 and prestroke mRS 0–1 within 6 h if ASPECTS 3–10, and at 6–24 h if ASPECTS ≥6 or ASPECTS 3–5 with age <80 and no significant mass effect (COR 1), and within 24 h for basilar occlusion with NIHSS ≥10, prestroke mRS 0–1 and PC-ASPECTS ≥6 (COR 1); ASPECTS 0–2 within 6 h (age <80, no significant mass effect) is 2a.');
    expect(summary).not.toContain('is graded for');
    expect(summary).not.toContain('including selected large cores');
    // design-shell#1 (already fixed in 8541ec1): the bottom line names the IVT-eligible adult (ais-2026-84/-98).
    expect(bottomLine(summary)).toContain('in an otherwise IVT-eligible adult');
  });

  it('antithrombotic-reversal bottom line scopes COR 1 reversal to anticoagulants (design-shell#0, already fixed in 8541ec1)', () => {
    // ich-2022-26 (1, C-LD): "anticoagulant-associated spontaneous ICH"; ich-2022-40 (3: Harm, B-R): platelet
    // transfusion for aspirin-associated ICH without emergency surgery (archived transcription, git 4f8e99d).
    const line = bottomLine(topic('antithrombotic-reversal').summary);
    expect(line).toMatch(/^Anticoagulant-associated ICH: stop the anticoagulant and reverse it/);
    expect(line).toContain('(AHA 2022, COR 1); antiplatelet-associated ICH: no platelet transfusion unless neurosurgery is planned');
  });
});

describe('r3 ev-evt: large core and thrombectomy selection', () => {
  it('large-core caution keeps the LASTE age-specific imaging limit (evt-b-selection-largecore#0)', () => {
    // SVIN 2025 (PMC12671639): "LASTE (except for patients >80 years old in whom ASPECTS of 4–5 was required)";
    // Table 1: "ASPECTS 4—5 for age ≥80 y". Registry NCT03811769: "in patients ≥ 80 years: ASPECT = 3 to 5".
    const caution = topic('large-core-evt').caution;
    expect(caution).toBe('Trial age limits: ANGEL-ASPECT ≤80; SELECT2 and TESLA ≤85; none in RESCUE-Japan LIMIT or TENSION; LASTE had no upper limit but required ASPECTS 4–5 at age ≥80 (registry: 3–5), so it gives no evidence for ASPECTS 0–2 at that age. All but TENSION (mRS ≤2) required prestroke mRS 0–1.');
    expect(caution).not.toContain('TENSION or LASTE');
  });

  it('large-core summary gives TESLA its threshold and 1-year report (evt-b-selection-largecore#1)', () => {
    // TESLA (PMID 39374319): posterior probability .96 against a required .975. SVIN 2025 (PMC12671639):
    // "did not meet its primary end point at 3 months but showed clinical benefit at the 1-year mark"; re-read 2026-10-31:
    // "treatment benefit 1.18 [95% CI: 0.42–1.93]" in utility-weighted mRS at 1 year (missed#10).
    const summary = topic('large-core-evt').summary;
    expect(summary).toContain('TESLA (NCCT ASPECTS 2–5, ≤24 h) missed its 90-day primary endpoint (posterior probability 0.96; 0.975 required), though at 1 year the utility-weighted mRS favored EVT (difference 1.18; 95% CI 0.42–1.93; reported by SVIN 2025).');
  });

  it('evt-selection gives DIRECT ANGIO its population and its imprecision (evt-b-selection-largecore#2)', () => {
    // PMID 41864232: adults ≤85 y within 5 h, motor ≥5 plus cortical ≥1 NIHSS items, stopped for safety,
    // sICH 5/34 vs 0/42, mRS 0–2 aOR 0.73 (0.32–1.69), "the small sample size limits the precision".
    // NCT03969511: "Only mothership admissions"; neurologist examination "on the patient's arrival and before any imaging".
    const consider = topic('evt-selection').consider[1];
    expect(consider).toContain('Direct to angiography may be considered (2b each)');
    expect(consider).toContain('DIRECT ANGIO (France, 2026; postdates AHA 2026; direct arrivals ≤85 y within 5 h selected by neurologist exam, not a prehospital scale) stopped early for safety: more sICH (15 vs 0%), no evidence of functional benefit (small and imprecise).');
    expect(consider).not.toContain('no functional benefit.');
  });
});

describe('r3 ev-evt: MeVO, basilar and EVT technique', () => {
  it('medium-distal-evt shows each SVIN ACA/PCA 2b beside its COR 3 default (evt-c-basilar-mevo-neuroint#0)', () => {
    // SVIN MeVO 2026 (PMC13331429): ACA COR 3 B-NR and 2b B-NR; PCA COR 3 B-NR and 2b B-R; M3/M4 COR 3 B-R.
    expect(topic('medium-distal-evt').consider[1]).toBe('SVIN 2026: routine EVT is not recommended for distal ACA (A2/A3) or isolated PCA occlusion (COR 3: No Benefit, B-NR) and is not standard for M3/M4 (COR 3: No Benefit, B-R); it may be considered case by case for ACA occlusion with disabling deficits, large territory at risk, favorable imaging and good baseline function (2b, B-NR), and in selected patients with P1–P3 occlusion who present early, have severe deficits or cannot receive IVT (2b, B-R).');
  });

  it('neurointerventional-care gives ANGEL-REBOOT its population and its 1-year report (evt-c-basilar-mevo-neuroint#1)', () => {
    // PMID 38914085: eTICI 0–2a or residual stenosis >70%; tirofiban in 334/348 (96%); cOR 0.86; sICH 8/175 vs 1/169.
    // PMID 41122847 (Circulation 2025): 1-year generalized OR 1.34; treated-artery recurrence 7/166 vs 21/160.
    const card = topic('neurointerventional-care');
    expect(card.summary).toContain('Rescue angioplasty or stenting after failed EVT remains uncertain (2b); in ANGEL-REBOOT (China; eTICI 0–2a or >70% residual stenosis after EVT, tirofiban in 96%) it did not improve 90-day mRS (cOR 0.86) and raised sICH (5 vs 1%); a later 1-year report (2025, after the AHA 2026 literature window) found a better mRS distribution (generalized OR 1.34), less same-artery recurrence (4 vs 13%) and similar mortality (15 vs 17%).');
    // Cited directly on the card (not through study-sources.json, whose entry count another test pins).
    expect(source(card, '41122847')).toMatchObject({ year: 2025, type: 'Report', checkedAt: '2026-10-22' });
    expect(read('src/reference/expanded-vascular.json').find(record => record.id === 'neurointerventional-care').sources.map(item => item.url)).toContain(pubmed('41122847'));
  });

  it('neurointerventional-care reports the mortality signal in both IA alteplase trials and dates the evidence honestly (evt-c-basilar-mevo-neuroint#2, #3)', () => {
    // CHOICE-2 (PMID 42096239): mortality 12.1% vs 6.4%, P = .03. PEARL (PMID 42262770): 17.1% vs 11.3%, P = .12.
    // AHA 2026 abstract (PMID 41582814): literature "published through March 2025"; PEARL 2025-10-13;
    // ANGEL-TNK entered PubMed April–July 2025; CHOICE-2 2026-06; IAT-TOP 2026.
    const line = topic('neurointerventional-care').consider[3];
    expect(line).toContain('ANGEL-TNK, PEARL and CHOICE-2 improved mRS 0–1 (CHOICE-2 57.5 vs 42.5%), but 90-day mortality was higher with IA alteplase in CHOICE-2 (12.1 vs 6.4%, P=.03) and PEARL (17.1 vs 11.3%, not significant);');
    expect(line).toContain('ANGEL-TNK and PEARL (2025) appeared after the AHA 2026 literature window (through March 2025), CHOICE-2 and IAT-TOP after the guideline itself.');
    expect(line).not.toContain('CHOICE-2 and IAT-TOP postdate AHA 2026.');
  });

  it('basilar-occlusion dates the ESO rescue-stenting consensus and shows the AHA grade (evt-c-basilar-mevo-neuroint#4)', () => {
    // ESO/ESMINT BAO (PMC11569583): "suspected ICAD and severe underlying BA stenosis, 10/10 MWG members suggest rescue
    // PTA and/or stenting after failed endovascular procedure"; "The ANGEL-REBOOT RCT could bring some more light".
    // ais-2026-130 (2b, B-NR): rescue angioplasty and/or stenting after failed EVT "remains uncertain".
    const card = topic('basilar-occlusion');
    expect(card.consider[2]).toBe('First pass: aspiration is suggested over a stent retriever (ESO, weak). With suspected intracranial atherosclerosis and severe basilar stenosis, ESO consensus (written before ANGEL-REBOOT) suggests rescue angioplasty or stenting after failed EVT; AHA 2026 rates rescue angioplasty or stenting after failed EVT as uncertain (2b).');
    expect(card.related).toContainEqual({ label: 'EVT technique and rescue', href: '#/evidence/neurointerventional-care' });
  });

  it('research-adjuncts shows the AHA pre-EVT tirofiban grade and dates the other trials correctly (evt-c-basilar-mevo-neuroint#5)', () => {
    // ais-2026-132 (3: No Benefit, B-R) for preprocedural tirofiban before EVT; ais-2026-138 (2b, B-R) for IV tirofiban.
    // RESCUE BT 2022 (PMID 35943471) predates the guideline; ASSET-IT 2025-07-04 (PMID 40616232) postdates its window.
    const line = topic('research-adjuncts').consider[3];
    expect(line).toContain('IV tirofiban before EVT was neutral (RESCUE BT), and AHA 2026 rates preprocedural tirofiban before EVT as not useful (COR 3: No Benefit, B-R).');
    expect(line).toContain('With literature through March 2025, before ASSET-IT, INSTANT and ATTRACTION, AHA 2026 rates IV tirofiban efficacy as not well established (COR 2b, B-R).');
    expect(line).not.toContain('predating these trials');
  });
});

describe('r3 ev-evt: study cards and source design labels', () => {
  it('distal cites the 12-month report for its 12-month result (evt-d-studies#0)', () => {
    // PMID 42105785: "adjusted common odds ratio for better functional outcome 0·81, 95% CI 0·59-1·12".
    const card = study('distal');
    expect(card.limits).toContain('At 12 months there was still no benefit (adjusted common OR for better mRS 0.81; 95% CI 0.59–1.12; Lancet Neurol 2026).');
    expect(card.limits).not.toContain('acOR');
    expect(source(card, '42105785')).toMatchObject({ year: 2026, type: 'Report', checkedAt: '2026-10-22' });
    expect(source(card, '39908430')).toBeTruthy();
  });

  it('attention limits state the registry age-specific imaging and baseline limits (evt-d-studies#1)', () => {
    // NCT04751708: NIHSS ≥10; exclude mRS ≥3 if <80 and mRS ≥1 if ≥80; exclude PC-ASPECTS <6 if <80 (<8 if ≥80).
    // Currency 2026-10-31 (evt-acute-bp): 3-year outcomes (JAMA Neurol 2026, PMID 41460644 abstract) appended; registry limits unchanged.
    expect(study('attention').limits).toBe('Single-country trial; it required NIHSS ≥10, PC-ASPECTS ≥6 and prestroke mRS 0–2, and for age ≥80 PC-ASPECTS ≥8 and prestroke mRS 0 (registry NCT04751708). At 3 years (JAMA Neurol 2026; 307 of 340 followed), mRS 0–3 was 38.4% vs 18.3% (adjusted RR 2.05; 95% CI 1.35–3.11) and cumulative mortality 55.7% vs 73.1%; in a prespecified subgroup, no treatment effect was demonstrated at age ≥70.');
  });

  it('labels the two meta-analyses and three observational studies by their stated design (evt-d-studies#2, #3)', () => {
    const entries = studySources();
    // PMID 42088338 "A Network Meta-Analysis of Randomized Trials"; PMID 42028301 "A Systematic Review and Meta-Analysis".
    for (const id of ['study-source-ia-thrombolysis-dose-network-meta-analysis', 'study-source-ai-lvo-detection-accuracy-meta']) {
      expect(entries[id]).toMatchObject({ type: 'Meta-analysis', checkedAt: '2026-10-22' });
    }
    // PMID 42017224 "retrospective multicenter study"; 41111412 "retrospective, observational cohort study";
    // 37581671 "US registry-based, retrospective study".
    for (const id of ['study-source-oriental-mevo-acao-registry', 'study-source-target-stroke-phase-3-strategies', 'study-source-dido-gwtg-transfer-2023']) {
      expect(entries[id]).toMatchObject({ type: 'Observational study', checkedAt: '2026-10-22' });
    }
    expect(entries['study-source-oriental-mevo-acao-registry'].access).toContain('Retrospective propensity-weighted registry analysis, not the randomized ORIENTAL-MeVO trial.');
  });
});
