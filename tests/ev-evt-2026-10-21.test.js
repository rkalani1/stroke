// Evidence-tab checks from the 2026-10-21 EVT and systems-of-care review (unit ev-evt).
// Expected grades and strings come from the sources named beside each assertion:
// the archived AHA/ASA 2026 AIS transcription (archive scope; the full text was not
// reachable on 2026-10-21), SVIN PMC full text, and PubMed primary abstracts read that day.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const text = record => [record.summary, ...(record.consider || []), record.caution].join(' ');
const pubmed = id => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
const source = (record, id) => record.sources.find(item => item.url === pubmed(id));

// [COR, LOE] transcribed from the archived AHA/ASA 2026 AIS guideline (PMID 41582814).
const AHA_2026 = {
  'ais-2026-9': ['1', 'A'], 'ais-2026-15': ['1', 'B-NR'], 'ais-2026-84': ['1', 'A'], 'ais-2026-91': ['3: No Benefit', 'B-R'],
  'ais-2026-98': ['1', 'A'], 'ais-2026-113': ['1', 'A'], 'ais-2026-114': ['1', 'A'], 'ais-2026-115': ['1', 'A'],
  'ais-2026-116': ['1', 'A'], 'ais-2026-117': ['2a', 'B-R'], 'ais-2026-118': ['2a', 'B-NR'], 'ais-2026-119': ['2b', 'B-NR'],
  'ais-2026-120': ['2a', 'B-NR'], 'ais-2026-121': ['3: No Benefit', 'A'], 'ais-2026-122': ['1', 'A'], 'ais-2026-123': ['2b', 'B-R']
};
const CARD_RECOMMENDATIONS = {
  'acute-reperfusion': ['ais-2026-84', 'ais-2026-98', 'ais-2026-91', 'ais-2026-113'],
  'code-stroke-activation': ['ais-2026-9', 'ais-2026-15'],
  'evt-selection': ['ais-2026-114', 'ais-2026-115', 'ais-2026-118', 'ais-2026-119'],
  'large-core-evt': ['ais-2026-114', 'ais-2026-116', 'ais-2026-117'],
  'basilar-occlusion': ['ais-2026-122', 'ais-2026-123'],
  'medium-distal-evt': ['ais-2026-120', 'ais-2026-121', 'svin-mevo-dvo-evt-2026-r1', 'svin-mevo-dvo-evt-2026-r2']
};

describe('EVT and systems-of-care Evidence cards (2026-10-21 review)', () => {
  it('validates against the reference contract on the review date', () => {
    // Review cutoff moved to 2026-10-31: the evidence-currency pass re-read and re-dated sources that day.
    expect(validateClinicalReference(data, { now: new Date('2026-10-31T23:59:59Z') })).toEqual([]);
  });

  it('keeps the exact AHA/ASA 2026 grades on each EVT card', () => {
    for (const [id, recommendationIds] of Object.entries(CARD_RECOMMENDATIONS)) {
      const card = topic(id);
      expect(card.recommendations.map(rec => rec.id)).toEqual(recommendationIds);
      for (const rec of card.recommendations.filter(item => AHA_2026[item.id])) {
        expect([rec.cor, rec.loe]).toEqual(AHA_2026[rec.id]);
        expect(rec.source).toContain(`AHA/ASA AIS 2026 · ${rec.id}`);
      }
    }
  });

  it('quotes the SVIN 2026 MeVO recommendations verbatim (PMC13331429)', () => {
    const recs = Object.fromEntries(topic('medium-distal-evt').recommendations.map(rec => [rec.id, rec]));
    expect(recs['svin-mevo-dvo-evt-2026-r1']).toMatchObject({ cor: '2a', loe: 'B-NR', text: 'EVT is reasonable for patients with disabling stroke due to proximal and/or dominant M2 occlusions, particularly when associated with moderate-to-severe deficits and imaging evidence of salvageable brain tissue.' });
    expect(recs['svin-mevo-dvo-evt-2026-r2']).toMatchObject({ cor: '2b', loe: 'B-R', text: 'EVT may be considered in distal, codominant, or nondominant M2 occlusions who present with disabling deficits and an NIHSS score ≥6.' });
    // Round 3 (2026-10-22): each SVIN ACA/PCA 2b now sits beside its COR 3 default; exact text pinned in r3-ev-evt-2026-10-22.test.js.
    expect(topic('medium-distal-evt').consider[1]).toContain('may be considered case by case for ACA occlusion with disabling deficits');
    expect(topic('medium-distal-evt').consider[1]).toContain('is not standard for M3/M4 (COR 3: No Benefit, B-R)');
  });

  it('keeps each graded statement inside its guideline population', () => {
    // ais-2026-114/-115/-116: ICA or M1, NIHSS ≥6, prestroke mRS 0–1, window-specific ASPECTS.
    const reperfusion = topic('acute-reperfusion').summary;
    // Round 3 (2026-10-22): the tiers are now spelled out with their own grades (ais-2026-117 is 2a).
    expect(reperfusion).toContain('EVT is recommended for ICA/M1 occlusion with NIHSS ≥6 and prestroke mRS 0–1 within 6 h if ASPECTS 3–10');
    expect(reperfusion).not.toContain('indicated within 24 h for anterior LVO');
    // ais-2026-118 (2a) and -119 (2b): ICA/M1, within 6 h, NIHSS ≥6, ASPECTS ≥6.
    const selection = topic('evt-selection');
    expect(selection.consider[0]).toBe('Prestroke mRS 2 (2a) or 3–4 (2b): graded only for ICA/M1 within 6 h with NIHSS ≥6 and ASPECTS ≥6.');
    // ais-2026-56 and -57: both "may be considered" (2b), not a directive.
    expect(selection.consider[1]).toContain('Direct to angiography may be considered (2b each)');
    expect(selection.consider[1]).toContain('flat-panel CT');
    expect(text(selection)).not.toContain('go straight to angiography');
    // ais-2026-20 (COR 1, LOE A): thrombolytic-eligible patients, where available.
    // Currency 2026-10-31: MSU-TELEMED (PMID 41429047, single Melbourne MSU) appended after the unchanged graded
    // sentence, labelled as postdating the AHA 2026 literature cutoff so it cannot read as support for the grade.
    const msu = topic('code-stroke-activation').consider.find(item => item.startsWith('Where available, mobile stroke units'));
    expect(msu.startsWith('Where available, mobile stroke units are recommended over conventional EMS for thrombolytic-eligible patients: faster treatment and better outcome (COR 1, LOE A). ')).toBe(true);
    expect(msu).toContain('(MSU-TELEMED, n=275, randomized by day; published after the AHA 2026 literature cutoff, not graded)');
    // ais-2026-16 (2a) needs local thrombectomy access; ais-2026-18 is COR 3: No Benefit only in a well-coordinated
    // system (round 3, 2026-10-22: setting restored and the 2b ais-2026-17 added; see r3-ev-evt-2026-10-22.test.js).
    const rural = topic('rural-telestroke').summary;
    expect(rural).toContain('direct transport to a locally accessible thrombectomy center is reasonable (2a)');
    expect(rural).toContain('bypassing it for a distant thrombectomy-capable center (e.g., 45–60 min away) does not improve 3-month outcome (COR 3: No Benefit)');
    // AHA 2022 in-hospital statement (ungraded) and ais-2026-24 (COR 1).
    const inHospital = topic('in-hospital-stroke').summary;
    expect(inHospital).toContain('in-hospital stroke alert and give responders immediate neurological expertise (AHA 2022 statement)');
    expect(inHospital).toContain('organized protocol for emergent evaluation of acute deficits at any age (AHA 2026, COR 1)');
    // ais-2026-132: COR 3: No Benefit, not Harm.
    expect(topic('neurointerventional-care').summary).toContain('preprocedural tirofiban is not useful (COR 3: No Benefit)');
    // Registries NCT04551664, NCT03876457, NCT03805308, NCT03702413, NCT03094715, NCT03811769.
    // Round 3 (2026-10-22): LASTE required ASPECTS 4–5 at age ≥80 (SVIN 2025; registry 3–5), so it is no longer "none".
    expect(topic('large-core-evt').caution).toContain('Trial age limits: ANGEL-ASPECT ≤80; SELECT2 and TESLA ≤85; none in RESCUE-Japan LIMIT or TENSION;');
    expect(topic('large-core-evt').caution).toContain('All but TENSION (mRS ≤2) required prestroke mRS 0–1.');
    // ATTENTION registry NCT04751708: NIHSS ≥10.
    expect(study('attention').limits).toContain('NIHSS ≥10');
  });

  it('labels evidence that postdates the guidelines and keeps earlier trials unlabeled', () => {
    const largeCore = text(topic('large-core-evt'));
    // ATLAS, Lancet 2026 (PMID 42107392).
    expect(largeCore).toContain('ATLAS (Lancet 2026; postdates AHA 2026 and SVIN 2025), IPD of 6 RCTs (n=1886): better mRS (aGenOR 1.63) and lower mortality (31.1 vs 37.3%)');
    expect(largeCore).toContain('evidence is limited for core ≥150 mL beyond 6 h');
    // DIRECT ANGIO, Lancet Neurol 2026 (PMID 41864232): sICH 5/34 vs 0/42, stopped for safety.
    // Round 3 (2026-10-22): population and imprecision added; exact text pinned in r3-ev-evt-2026-10-22.test.js.
    expect(text(topic('evt-selection'))).toContain('DIRECT ANGIO (France, 2026; postdates AHA 2026;');
    expect(text(topic('evt-selection'))).toContain('stopped early for safety: more sICH (15 vs 0%), no evidence of functional benefit (small and imprecise).');
    // Writing-group response, Stroke 2026 (PMID 42535264): request declined; NO-SELECT pending.
    expect(topic('evt-selection').consider[2]).toContain('ASPECTS ≥6 at 6–24 h keeps COR 1');
    expect(topic('evt-selection').consider[2]).toContain('NO-SELECT trial ongoing');
    // ANGEL-TNK (2025) and PEARL (October 2025) predate the January 2026 guideline but postdate its literature window
    // (through March 2025, PMID 41582814 abstract); CHOICE-2 and IAT-TOP postdate the guideline (round 3, 2026-10-22).
    const neuro = text(topic('neurointerventional-care'));
    expect(neuro).toContain('ANGEL-TNK and PEARL (2025) appeared after the AHA 2026 literature window (through March 2025), CHOICE-2 and IAT-TOP after the guideline itself.');
    expect(neuro).toContain('CHOICE-2 (12.1 vs 6.4%, P=.03)');
    expect(neuro).not.toContain('trials that postdate it');
    expect(neuro).not.toContain('ESO 2026');
    expect(topic('medium-distal-evt').caution).toContain('The AHA 2026 grading predates ORIENTAL-MeVO and DISCOUNT');
  });

  it('reports trial results as the primary abstracts state them', () => {
    // PRISMS (PMID 29998337): "the very early study termination precludes any definitive conclusions".
    expect(topic('acute-reperfusion').summary).toContain('PRISMS (stopped early) found no benefit (sICH 3.2 vs 0%)');
    // RACE 2013 (PMID 24281224); JAHA 2026 meta-analysis (PMID 42333681); RACECAT (PMID 35510397).
    const activation = topic('code-stroke-activation').summary;
    expect(activation).toContain('85% sensitivity and 68% specificity in its 2013 validation, but 75% and 76% pooled across EMS studies (2026 meta-analysis)');
    expect(activation).toContain('In nonurban Catalonia, bypassing the local stroke center for a thrombectomy center did not improve outcome (RACECAT, cOR 1.03): fewer received IVT (47.5 vs 60.4%) and more had EVT (48.8 vs 39.4%).');
    // TESLA (PMID 39374319): posterior probability .96 below the .975 threshold.
    expect(topic('large-core-evt').summary).toContain('TESLA (NCCT ASPECTS 2–5, ≤24 h) missed its 90-day primary endpoint (posterior probability 0.96; 0.975 required)');
    // BRIDGE-TNK (PMID 40396577): China, within 4.5 h, functional independence 52.9 vs 44.1%.
    expect(topic('evt-selection').summary).toContain('BRIDGE-TNK (China, ≤4.5 h) favored tenecteplase first (mRS 0–2 52.9 vs 44.1%)');
    // ais-2026-49: CTA and/or CTP are not delayed for a serum creatinine.
    expect(topic('code-stroke-activation').summary).toContain('do not wait for creatinine before CTA/CTP');
    // DIRECT-MT and DEVT met noninferiority; SKIP, MR CLEAN-NO IV, SWIFT DIRECT, DIRECT-SAFE and IRIS did not.
    expect(topic('evt-selection').caution).toBe('Only DIRECT-MT and DEVT (both China) found EVT alone noninferior; SWIFT DIRECT, MR CLEAN-NO IV, SKIP, DIRECT-SAFE and the IRIS meta-analysis did not. Give IVT whenever eligible.');
    // ANGEL-REBOOT (PMID 38914085): sICH 8/175 (5%) vs 1/169 (1%).
    // Round 3 (2026-10-22): the 90-day result is named as such and the 1-year report (PMID 41122847) is added.
    expect(topic('neurointerventional-care').summary).toContain('it did not improve 90-day mRS (cOR 0.86) and raised sICH (5 vs 1%)');
    // DISTAL 12-month report (PMID 42105785), now cited on the card itself (round 3).
    expect(study('distal').limits).toContain('At 12 months there was still no benefit (adjusted common OR for better mRS 0.81; 95% CI 0.59–1.12; Lancet Neurol 2026).');
  });

  it('cites each newly summarized study on the card that summarizes it', () => {
    const citations = {
      'code-stroke-activation': ['24281224', '42333681', '35510397'],
      'evt-selection': ['41864232', '42535264', '33464335', '33464334', '35810757', '37640037'],
      'large-core-evt': ['42107392', '39374319'],
      'medium-distal-evt': ['42105785', '42485024'],
      'neurointerventional-care': ['38914085', '40616323', '42262770', '42096239', '42026933', '39804674', '39804681', '39809509', '42095756']
    };
    for (const [id, pmids] of Object.entries(citations)) for (const pmid of pmids) expect(source(topic(id), pmid), `${id} cites ${pmid}`).toBeTruthy();
    expect(source(topic('evt-selection'), '42535264')).toMatchObject({ type: 'Report', checkedAt: '2026-10-21' });
    expect(source(topic('code-stroke-activation'), '42333681')).toMatchObject({ type: 'Meta-analysis', checkedAt: '2026-10-21' });
  });

  it('records corrected study designs, keeps correction notices and re-dates only sources read on the review date', () => {
    const entries = Object.fromEntries(read('src/reference/study-sources.json').map(entry => [entry.url.match(/(\d+)\/$/)[1], entry]));
    // DISTAL, TESLA and PEARL abstracts describe randomized trials; BEST-MSU calls itself observational.
    for (const pmid of ['39908430', '39374319', '42262770']) expect(entries[pmid].type).toBe('Randomized trial');
    expect(entries['34496173'].type).toBe('Observational study');
    for (const pmid of ['36762865', '38768626', '34496173', '35510397', '33464334', '39186280']) {
      expect(entries[pmid].checkedAt).toBe('2026-10-21');
      expect(entries[pmid].access).toContain('PubMed lists 1 correction or notice; check it before applying results.');
    }
    // The AHA/ASA 2026 full text was not reachable on the review date, so it was not re-dated then.
    for (const id of ['evt-selection', 'large-core-evt', 'code-stroke-activation', 'rural-telestroke', 'neurointerventional-care']) {
      expect(source(topic(id), '41582814').checkedAt).not.toBe('2026-10-21');
    }
  });
});
