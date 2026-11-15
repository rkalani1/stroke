// Evidence-tab currency update, 2026-11-14 (audit findings EV-CUR-01 to EV-CUR-08 and EV-ACC-01;
// ledger docs/evidence-ledger-2026-11-14.md). Expected numbers come from the primary records re-read on
// 2026-11-14 with the PubMed connector (abstracts, and PMC full text where named) and, for registry
// facts, the ClinicalTrials.gov connector. They are quoted beside each assertion with the PMID and DOI.
// Every new item postdates the guideline it sits beside and carries no grade; no guideline class or
// level of evidence changes, and nothing claims a regulatory approval.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';
import { searchReference } from '../src/reference-search.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const source = (record, pmid) => record.sources.find(entry => entry.url === pubmed(pmid));
const studySources = read('src/reference/study-sources.json');
const coverage = read('src/reference/coverage.json');
const sourceRecord = id => studySources.find(entry => entry.id === id);
const cardText = record => [record.summary, ...record.consider].join(' ');
const grades = record => Object.fromEntries((record.recommendations || []).map(rec => [rec.id, [rec.cor, rec.loe]]));
// Global search (Ctrl+K) indexes titles, keywords and summaries; the Evidence tab search also reads consider items.
const index = buildSearchIndex({ ...data, trials: [] });
const globalHits = query => searchIndex(index, query, Infinity).filter(hit => hit.group === 'Evidence').map(hit => hit.id);
const evidenceHits = query => searchReference(data.topics, query).map(record => record.id);

const NEW_RECORDS = {
  'study-source-optimal-stroke': { pmid: '43001741', type: 'Randomized trial', topicIds: ['bp-prevention', 'secondary-prevention'] },
  'study-source-insist-it': { pmid: '42995196', type: 'Randomized trial', topicIds: ['neurointerventional-care', 'basilar-occlusion'] },
  'study-source-bretis-tnk2': { pmid: '42995186', type: 'Randomized trial', topicIds: ['neurointerventional-care'] },
  'study-source-asap-too': { pmid: '43018511', type: 'Randomized trial', topicIds: ['af-prevention', 'caa-ich-recurrence'] },
  'study-source-pregnancy-thrombolysis-review-2026': { pmid: '42962168', type: 'Report', topicIds: ['maternal-stroke'] },
  'study-source-stream-statins': { pmid: '43001742', type: 'Randomized trial', topicIds: ['primary-prevention'] },
  'study-source-lpa-horizon': { pmid: '43001734', type: 'Randomized trial', topicIds: ['lipid-management'] },
  'study-source-simplaafy': { pmid: '42970643', type: 'Randomized trial', topicIds: ['af-prevention'] }
};

describe('evidence currency 2026-11-14: records and contract', () => {
  it('validates at the review date and links every new record to its cards', () => {
    expect(validateClinicalReference(data, { now: new Date('2026-11-14T23:59:59Z') })).toEqual([]);
    for (const [id, expected] of Object.entries(NEW_RECORDS)) {
      const entry = sourceRecord(id);
      expect(entry, id).toMatchObject({ url: pubmed(expected.pmid), year: 2026, type: expected.type, checkedAt: '2026-11-14', topicIds: expected.topicIds });
      expect(entry.access, id).toContain('read 2026-11-14');
      expect(entry.access, id).toContain('bibliographic record checked');
      for (const topicId of expected.topicIds) expect(source(topic(topicId), expected.pmid), `${id} on ${topicId}`).toBeTruthy();
    }
  });

  it('leaves the guideline grades on the edited cards as published', () => {
    // ais-2026-122 (1, A) and -123 (2b, B-R); secondary-prevention-2021-144 (1, A), -28 (1, B-R), -32 (1, A): archived transcriptions.
    expect(grades(topic('basilar-occlusion'))).toEqual({ 'ais-2026-122': ['1', 'A'], 'ais-2026-123': ['2b', 'B-R'] });
    expect(grades(topic('secondary-prevention'))).toEqual({ 'secondary-prevention-2021-144': ['1', 'A'], 'secondary-prevention-2021-28': ['1', 'B-R'], 'secondary-prevention-2021-32': ['1', 'A'] });
    expect(topic('bp-prevention').summary).toContain('target office BP <130/80 for most (AHA 2021, COR 1)');
    expect(topic('neurointerventional-care').summary).toContain('Intra-arterial thrombolytic after mTICI ≥2b may be reasonable (2b)');
    expect(topic('af-prevention').summary).toContain('percutaneous left atrial appendage closure is reasonable (ACC/AHA 2023, 2a; AHA 2021 stroke guideline 2b if at least 45 days of anticoagulation can be tolerated)');
    expect(topic('caa-ich-recurrence').summary).toContain('left atrial appendage closure may be considered if anticoagulation is not possible (2b)');
    expect(topic('maternal-stroke').summary).toContain('IVT needs an individual risk–benefit review (ESO 2022 consensus)');
  });
});

describe('evidence currency 2026-11-14: new trial and review text', () => {
  it('EV-CUR-01 adds OPTIMAL-STROKE after the unchanged ESPRIT text and points the clinic card to it', () => {
    // OPTIMAL-STROKE, N Engl J Med 2026-11-07, PMID 43001741, doi 10.1056/NEJMoa2612924 (abstract): "open-label, randomized
    // trial conducted at 30 sites in Brazil"; "A total of 4368 participants"; mean SBP "122.0±11.5" vs "135.2±9.7";
    // "Over a median follow-up of 3.9 years ... 236 participants (10.9%) ... 297 (13.5%) ... (hazard ratio, 0.79; 95% CI,
    // 0.67 to 0.94"; "The composite renal outcome ... was more common with intensive treatment."
    const line = topic('bp-prevention').consider[3];
    expect(line).toMatch(/^Lower targets: in ESPRIT \(China, open-label; 11,255 high-risk hypertensive adults, 3,022 with prior stroke\), an SBP target <120 vs <140 mmHg \(achieved 119 vs 135\) reduced major vascular events \(9\.7 vs 11\.1%; HR 0\.88\)/);
    expect(line).toContain('After stroke specifically (postdating AHA 2021; not graded): in OPTIMAL-STROKE (NEJM 2026; Brazil, 30 sites, open-label; 4,368 adults with elevated BP and prior ischemic stroke or TIA)');
    expect(line).toContain('targeting SBP <120 vs <140 mmHg (mean achieved 122 vs 135)');
    expect(line).toContain('over a median 3.9 years (10.9 vs 13.5%; HR 0.79, 95% CI 0.67–0.94)');
    expect(line).toContain('The renal composite (sustained ≥50% eGFR decline or end-stage renal disease) was more common with intensive treatment, and serious adverse events were similar.');
    expect(line).toContain('The abstract does not report stroke alone.');
    const clinic = topic('secondary-prevention');
    expect(clinic.summary).toContain('BP <130/80 for most (AHA 2021, COR 1); postdating it (not graded), OPTIMAL-STROKE (Brazil, open-label) found that targeting SBP <120 vs <140 mmHg in patients with elevated BP after ischemic stroke or TIA lowered major cardiovascular events (10.9 vs 13.5%; HR 0.79, 95% CI 0.67–0.94), with renal composite events more common.');
    expect(clinic.related).toContainEqual({ label: 'Long-term BP targets', href: '#/evidence/bp-prevention' });
    expect(topic('bp-prevention').keywords).toContain('OPTIMAL-STROKE');
    expect(globalHits('OPTIMAL-STROKE')[0]).toBe('topic:bp-prevention');
    expect(globalHits('OPTIMAL-STROKE')).toContain('topic:secondary-prevention');
    expect(evidenceHits('OPTIMAL-STROKE')[0]).toBe('bp-prevention');
  });

  it('EV-CUR-02 adds INSIST-IT and BRETIS-TNK2 to the IA thrombolysis evidence', () => {
    // INSIST-IT, Nat Commun 2026-11-06, PMID 42995196, doi 10.1038/s41467-026-79177-2 (PMC13743758 full text): "stopped early due
    // to safety concerns and lack of efficacy"; "Among 144 randomized patients"; mRS 0-3 "40.0% ... versus 50.0% ... (OR 0.67;
    // 95% CI 0.34-1.29"; "sICH occurred in 6.2% versus 4.8%"; "All-cause mortality at 90 days was 41.3% versus 26.5% (OR 1.96;
    // 95% CI 0.97-4.03"; mRS 0-1 "35% versus 20%, unadjusted OR, 0.46; 95% CI, 0.21-0.96" (control first); "As a post hoc
    // analysis, all-cause mortality within 90 ± 7 days ... was also set as a safety outcome"; "conducted at 6 hospitals ... in China".
    // BRETIS-TNK2, Nat Commun 2026-11-06, PMID 42995186, doi 10.1038/s41467-026-79178-1 (PMC13743779 full text): "Of 380
    // randomised patients"; mRS 0-2 "40.0% ... versus 46.8% ... (unadjusted odds ratio 0.76, [95% CI 0.50-1.14]"; "sICH within
    // 24 h occurred in 5.7% (11/192) ... and 2.7% (5/188) (OR, 2.224; 95% CI, 0.758-6.530"; "in-hospital death ... 11.5% (22/192)
    // vs. 5.3% (10/188) (OR 2.304, 95% CI 1.059-5.007"; 90-day mortality "18.4% (35/190) ... and 14.5% (27/186) (OR, 1.305;
    // 95% CI, 0.780-2.182"; "conducted at 6 sites in China".
    const line = topic('neurointerventional-care').consider[3];
    expect(line).toMatch(/^IA lytic after successful EVT: ANGEL-TNK, PEARL and CHOICE-2 improved mRS 0–1/);
    expect(line).toContain('CHOICE-2 and IAT-TOP after the guideline itself. Two later trials in China (open-label, 6 sites each; Nat Commun, November 2026; after AHA 2026, not graded) found no benefit and safety signals with IA tenecteplase:');
    expect(line).toContain('INSIST-IT (144 patients with basilar occlusion after successful EVT; stopped early for safety concerns and lack of efficacy) mRS 0–3 40.0 vs 50.0% (OR 0.67, 95% CI 0.34–1.29)');
    expect(line).toContain('mRS 0–1 20 vs 35% (OR 0.46, 0.21–0.96), sICH 6.2 vs 4.8% and 90-day mortality 41.3 vs 26.5% (OR 1.96, 0.97–4.03; post hoc safety outcome)');
    expect(line).toContain('BRETIS-TNK2 (380 LVO patients; IA tenecteplase during EVT) mRS 0–2 40.0 vs 46.8% (OR 0.76, 0.50–1.14)');
    expect(line).toContain('sICH 5.7 vs 2.7% (not significant), in-hospital death 11.5 vs 5.3% (OR 2.30, 1.06–5.01) and 90-day mortality 18.4 vs 14.5% (not significant).');
    const basilar = topic('basilar-occlusion');
    expect(basilar.consider).toHaveLength(4);
    expect(basilar.consider[3]).toBe('IA thrombolysis after successful basilar EVT is unproven: ATTENTION-IA (BMJ 2025; IA tenecteplase) and IAT-TOP (JAMA Neurol 2026, after AHA 2026, not graded; IA alteplase) were neutral, and INSIST-IT (China, open-label; 144 patients; Nat Commun, November 2026, after AHA 2026, not graded) was stopped early for safety concerns and lack of efficacy, with mRS 0–3 40.0 vs 50.0% (OR 0.67, 95% CI 0.34–1.29) and 90-day mortality 41.3 vs 26.5% (OR 1.96, 0.97–4.03; post hoc safety outcome).');
    expect(sourceRecord('study-source-insist-it').access).toContain('PMC full text (PMC13743758) read 2026-11-14');
    expect(sourceRecord('study-source-bretis-tnk2').access).toContain('PMC full text (PMC13743779) read 2026-11-14');
    expect(topic('neurointerventional-care').keywords).toEqual(expect.arrayContaining(['INSIST-IT', 'BRETIS-TNK2']));
    expect(basilar.keywords).toContain('INSIST-IT');
    expect(globalHits('INSIST-IT')).toEqual(expect.arrayContaining(['topic:neurointerventional-care', 'topic:basilar-occlusion']));
    expect(globalHits('BRETIS-TNK2')).toEqual(['topic:neurointerventional-care']);
  });

  it('EV-CUR-03 adds ASAP-TOO to the AF and CAA cards without editing the pinned LAAO sentences', () => {
    // ASAP-TOO, J Am Coll Cardiol 2026-10-31, PMID 43018511, doi 10.1016/j.jacc.2026.10.007 (abstract): "OAC unsuitability";
    // "assigned 2:1 to LAAC with a Watchman device or control treatment-single antiplatelet therapy or no therapy"; "dual
    // antiplatelet therapy for 3 months and aspirin through 12 months"; "Enrollment stopped early because of slow accrual ... only
    // 481 patients were randomized"; "34% had prior intracranial/subdural hemorrhage"; "ischemic stroke or systemic embolism
    // occurred in 7.8% with LAAC and 11.4% with control treatment (HR: 0.73; 95% CI: 0.35-1.52"; "Major bleeding was 22.1% with
    // LAAC and 15.7% with control treatment (HR: 1.64; 95% CI: 0.96-2.81 ...), concentrated during the first 3 months";
    // "prematurely terminated and underpowered trial".
    const af = topic('af-prevention').summary;
    expect(af).toContain('Postdating these (2026; AF populations not limited to stroke), device closure was not noninferior to physician-directed best medical care');
    expect(af).toContain('In patients judged unsuitable for anticoagulation (ASAP-TOO, JACC 2026; multinational; postdates these guidelines, not graded), Watchman closure (then 3 months of DAPT and aspirin to 12 months) vs single antiplatelet or no therapy was tested in 481 patients (34% with prior intracranial or subdural hemorrhage), but enrollment stopped early and the trial was underpowered: at up to 5 years, ischemic stroke or systemic embolism was 7.8 vs 11.4% (HR 0.73, 95% CI 0.35–1.52) and major bleeding 22.1 vs 15.7% (HR 1.64, 0.96–2.81), concentrated in the first 3 months. Rheumatic AF: rivaroxaban was worse than a VKA (INVICTUS).');
    const caa = topic('caa-ich-recurrence').summary;
    expect(caa).toContain('left atrial appendage closure may be considered if anticoagulation is not possible (2b); in ASAP-TOO (JACC 2026; postdates AHA 2022, not graded; 481 patients unsuitable for anticoagulation, 34% with prior intracranial or subdural hemorrhage; stopped early and underpowered)');
    expect(caa).toContain('Watchman closure vs single antiplatelet or no therapy did not significantly reduce ischemic stroke or systemic embolism at up to 5 years (7.8 vs 11.4%; HR 0.73, 95% CI 0.35–1.52), and major bleeding was numerically higher, mostly in the first 3 months (22.1 vs 15.7%; HR 1.64, 0.96–2.81).');
    expect(globalHits('ASAP-TOO')).toEqual(expect.arrayContaining(['topic:af-prevention', 'topic:caa-ich-recurrence']));
  });

  it('EV-CUR-05 adds quantified safety data for thrombolysis in pregnancy as a fourth review item', () => {
    // Systematic review and aggregated case series, Neurology 2026-10-30, PMID 42962168, doi 10.1212/WNL.0000000000218590
    // (abstract): "studies published up to October 2025"; "Elective termination and spontaneous abortion were grouped together";
    // "123 studies of 216 patients ... of whom 85 had ischemic stroke"; "Six of the 32 total fetal deaths were deemed likely to be
    // causally related to thrombolytics (3 in stroke)"; miscarriage "12.4% higher (95% credible interval [CrI]: 2.6%, 23.2%)";
    // stillbirth "5.9% higher (95% CrI: 1.6%, 12.7%)"; sICH "risk difference -0.4%; 95% CrI: -0.8%, 2.7%".
    const card = topic('maternal-stroke');
    expect(card.consider).toHaveLength(4);
    const line = card.consider[3];
    expect(line).toContain('a 2026 systematic review of published cases (searched to October 2025; postdates ESO 2022 and the AHA 2026 statement; not graded) included 216 pregnant patients given thrombolytics, 85 for ischemic stroke');
    expect(line).toContain('Symptomatic ICH was similar to young nonpregnant patients receiving thrombolytics (risk difference −0.4%, 95% CrI −0.8 to 2.7%)');
    expect(line).toContain('miscarriage (grouped with elective termination) was 12.4% higher (95% CrI 2.6–23.2%) and stillbirth 5.9% higher (1.6–12.7%)');
    expect(line).toContain('6 of 32 fetal deaths were judged likely to be causally related to the thrombolytic (3 after stroke)');
    expect(source(card, '42962168')).toMatchObject({ type: 'Report', checkedAt: '2026-11-14' });
  });

  it('EV-CUR-06 adds STREAM beside STAREE and Lp(a)HORIZON beside the triglyceride item', () => {
    // STREAM, N Engl J Med 2026-11-07, PMID 43001742, doi 10.1056/NEJMoa2606634 (abstract): "international, open-label";
    // "at least 70 years of age who were taking statins for primary prevention"; "at least two chronic conditions but no known
    // cardiovascular disease"; "A total of 1880 participants"; "-2.0 weeks (95% confidence interval, -3.7 to -0.3 ...)" with a
    // "noninferiority margin of -5.2 weeks"; "119 participants (12.7%) ... and 87 (9.2%)" over "a median follow-up of 103 weeks";
    // serious adverse events "43.0%" vs "39.8%".
    const primary = topic('primary-prevention').consider[2];
    expect(primary).toMatch(/^Age ≥70 without cardiovascular disease, diabetes or dementia: in STAREE \(Australia, 9,971 adults, median 5\.9 years\)/);
    expect(primary).toContain('It postdates AHA/ASA 2024. Deprescribing: in STREAM (NEJM 2026; international, open-label; 1,880 adults aged ≥70 taking a statin for primary prevention, with ≥2 chronic conditions and no known cardiovascular disease; postdates AHA/ASA 2024, not graded)');
    expect(primary).toContain('stopping the statin met the noninferiority margin for 2-year event-free time (difference −2.0 weeks, 95% CI −3.7 to −0.3; margin −5.2 weeks)');
    expect(primary).toContain('nonfatal MI, nonfatal ischemic stroke or death occurred in 12.7 vs 9.2% over a median 103 weeks, and serious adverse events in 43.0 vs 39.8%.');
    // Lp(a)HORIZON, N Engl J Med 2026-11-07, PMID 43001734, doi 10.1056/NEJMoa2610159 (abstract): "preexisting cardiovascular
    // disease and a lipoprotein(a) level of at least 70 mg per deciliter"; "A total of 8350 patients"; Lp(a) "64.4 nmol per liter
    // in the pelacarsen group and 233.4 nmol per liter in the placebo group" at 12 months; "median follow-up was 4.7 years";
    // "511 patients (12.3%) ... 503 (12.1%) ... (hazard ratio, 1.02, 95% confidence interval [CI], 0.90 to 1.15".
    const lipid = topic('lipid-management');
    expect(lipid.consider).toHaveLength(4);
    expect(lipid.consider[1]).toMatch(/^Triglycerides 135–499 mg\/dL on a statin: icosapent ethyl is reasonable in selected patients \(2a\)\. Lipoprotein\(a\): in Lp\(a\)HORIZON/);
    expect(lipid.consider[1]).toContain('8,350 patients with preexisting cardiovascular disease and Lp(a) ≥70 mg/dL; published after the ACC/AHA 2026 guideline, not graded');
    expect(lipid.consider[1]).toContain('monthly pelacarsen lowered Lp(a) (64.4 vs 233.4 nmol/L at 12 months)');
    expect(lipid.consider[1]).toContain('over a median 4.7 years (12.3 vs 12.1%; HR 1.02, 95% CI 0.90–1.15). The abstract does not give the share with prior stroke.');
    expect(globalHits('STREAM')[0]).toBe('topic:primary-prevention');
    expect(globalHits('Lp(a)HORIZON')[0]).toBe('topic:lipid-management');
    expect(globalHits('pelacarsen')).toEqual(['topic:lipid-management']);
  });

  it('EV-CUR-07 adds SIMPLAAFY to the first AF review item and keeps the AHA 2021 45-day qualifier', () => {
    // SIMPLAAFY, JAMA 2026-11-02, PMID 42970643, doi 10.1001/jama.2026.21361 (abstract; PMC13728957 Key Points): "1857 patients ...
    // at 87 US investigational sites"; "eligible for all 3 regimens"; primary outcome "41 patients (6.9%) with DAPT vs 31 (5.1%)
    // with a reduced-dose NOAC ... and 20 (3.3%) with aspirin alone"; "Major bleeding was 4.5% with DAPT, 2.7% with reduced-dose
    // NOACs, and 1.7% with aspirin alone"; "Device-related thrombus was observed in 3.4%, 0.9%, and 2.7%"; "Bleeding and 45-day
    // device-related thrombus rates were exploratory"; Key Points: "Stroke rates were similar across all 3 groups".
    const line = topic('af-prevention').consider[0];
    expect(line).toMatch(/^Confirm how AF was documented/);
    expect(line).toContain('After uncomplicated closure (SIMPLAAFY, JAMA 2026; 87 US sites, open-label; 1,857 patients with nonvalvular AF eligible for all three regimens, not stroke-specific; postdates the guidelines cited here, not graded)');
    expect(line).toContain('were each noninferior to DAPT for 6 months then aspirin for 6-month death, stroke, systemic embolism or major bleeding (5.1 and 3.3 vs 6.9%)');
    expect(line).toContain('stroke rates were similar; major bleeding (2.7, 1.7 and 4.5%) and 45-day device-related thrombus (0.9, 2.7 and 3.4%) were exploratory end points. It does not test patients who cannot take any anticoagulant.');
    expect(topic('af-prevention').summary).toContain('AHA 2021 stroke guideline 2b if at least 45 days of anticoagulation can be tolerated');
    expect(globalHits('SIMPLAAFY')).toEqual(['topic:af-prevention']);
  });

  it('EV-CUR-08 links the SVIN 2026 ICAS-LVO update as a record without quoting it', () => {
    // SVIN brief practice update, Stroke Vasc Interv Neurol 2026-11-03, PMID 42974351, doi 10.1161/SVIN.126.002529 (PMC13727248
    // text read; its recommendation table and supplements were not in the extracted text).
    const entry = coverage.find(item => item.id === 'svin-icas-lvo-2026');
    expect(entry).toMatchObject({ url: pubmed('42974351'), year: 2026, type: 'Practice update', checkedAt: '2026-11-14', topicIds: ['neurointerventional-care', 'sicas'] });
    expect(entry.access).toContain('PMC full text (PMC13727248) read 2026-11-14');
    expect(entry.access).toContain('no SVIN recommendation or grade is quoted on the cards');
    for (const id of ['neurointerventional-care', 'sicas']) {
      expect(source(topic(id), '42974351'), id).toBeTruthy();
      expect(cardText(topic(id)), id).not.toMatch(/ICAS-LVO|ICARUS|PISTAR|SVIN 2026/);
    }
  });

  it('EV-ACC-01 gives the HINTS stroke figures of both cohorts', () => {
    // Kattah 2009, Stroke, PMID 19762709, doi 10.1161/STROKEAHA.109.551234: "One hundred one high-risk patients"; "100%
    // sensitive and 96% specific for stroke". Newman-Toker 2013, Acad Emerg Med, PMID 24127701, doi 10.1111/acem.12223: "A total
    // of 190 adult AVS patients were assessed (1999-2012)"; "HINTS stroke sensitivity was 96.5%, specificity was 84.4%"; "sensitivity
    // was 99.2% ... for HINTS 'plus'" for any central lesion.
    const card = topic('dizziness');
    expect(card.summary).toContain('any central sign — normal head impulse, direction-changing nystagmus or skew deviation — was 100% sensitive and 96% specific for stroke in the 2009 cohort (101 patients); in a larger 2013 cohort (190 patients), HINTS was 96.5% sensitive and 84.4% specific for stroke, and HINTS plus (adding new hearing loss) was 99.2% sensitive for any central cause.');
    expect(card.summary).not.toContain('reached 99.2% sensitivity for central causes');
    for (const pmid of ['19762709', '24127701']) expect(source(card, pmid), pmid).toMatchObject({ checkedAt: '2026-11-14', access: expect.stringContaining('re-read via PubMed on 2026-11-14') });
  });
});

describe('evidence currency 2026-11-14: asundexian and LIBREXIA-STROKE (EV-CUR-04)', () => {
  it('updates only the registry-verified LIBREXIA-STROKE phrase and claims no approval', () => {
    // NCT05702034 (ClinicalTrials.gov connector, 2026-11-14): status ACTIVE_NOT_RECRUITING; primary completion 2026-10-15;
    // has_results false. LIBREXIA-ACS, N Engl J Med 2026, PMID 42670965, doi 10.1056/NEJMoa2608717: "384 patients (5.4%) ... 365
    // patients (5.1%) ... (hazard ratio, 1.05". The FDA label was not readable, so the regulatory wording stays as it was.
    const oceanic = study('oceanic-stroke');
    expect(oceanic.limits).toContain('Its stroke trial (LIBREXIA-STROKE) had not reported as of November 2026 (registry: active, not recruiting, no results).');
    expect(oceanic.limits).not.toContain('as of October 2026');
    expect(oceanic.limits).toMatch(/^Industry-funded; regulatory status and availability are separate questions\./);
    expect(source(oceanic, '42670965')).toMatchObject({ checkedAt: '2026-11-14', access: expect.stringContaining('NCT05702034 re-checked 2026-11-14') });
    const adjuncts = topic('research-adjuncts');
    expect(adjuncts.summary).toContain('confirm regulatory status');
    expect(adjuncts.consider).toContain('Confirm regulatory approval and local availability before using any new agent.');
    expect(JSON.stringify(data)).not.toMatch(/Sunharbo/);
    expect(JSON.stringify([oceanic, adjuncts])).not.toMatch(/FDA[- ]approv|approved by the FDA|approved in the US/i);
  });
});
