// Evidence-tab prevention, antithrombotic-timing and stroke-mechanism checks from
// the 2026-10-21 review. Expected values come from the primary sources named
// beside each assertion (PubMed abstracts, PMC full text, ClinicalTrials.gov),
// or, for AHA/ASA 2021 secondary-prevention and 2026 AIS wording, the archived
// full-text transcriptions (archive/pre-encounter-first-20261001-4f8e99d).
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
const SCOPE = ['af-timing', 'secondary-prevention', 'pfo', 'carotid', 'sicas', 'dissection', 'stroke-workup',
  'stroke-classification', 'cardiac-sources', 'endocarditis', 'lacunar-small-vessel', 'af-prevention',
  'lipid-management', 'bp-prevention', 'primary-prevention', 'research-adjuncts', 'antiphospholipid-syndrome',
  'fibromuscular-dysplasia', 'moyamoya', 'cns-vasculitis', 'inherited-arteriopathy', 'spinal-cord-infarction',
  'minor-stroke-antiplatelets'];

describe('prevention evidence cards (2026-10-21 review)', () => {
  it('still validates against the reference contract at the review date', () => {
    // Review cutoff moved to 2026-10-22: the evidence-fixes pass re-read and re-dated sources that day.
    expect(validateClinicalReference(data, { now: new Date('2026-10-22T23:59:59Z') })).toEqual([]);
  });

  it('keeps every quoted recommendation on its archived class and level of evidence', () => {
    // Archived transcriptions: secondary-prevention-2021-82 (I, B-R), -144 (I, A), -28 (I, B-R), -32 (I, A),
    // -60 (I, A), -66 (IIa, C-LD); ais-2026-154 (IIa, A), -142 (IIa, B-R), -147 (I, A), -148 (IIb, B-R), -149 (IIa, B-R).
    const expected = {
      'af-timing': { 'ais-2026-154': ['2a', 'A'], 'secondary-prevention-2021-82': ['1', 'B-R'] },
      'secondary-prevention': { 'secondary-prevention-2021-144': ['1', 'A'], 'secondary-prevention-2021-28': ['1', 'B-R'], 'secondary-prevention-2021-32': ['1', 'A'] },
      carotid: { 'secondary-prevention-2021-60': ['1', 'A'], 'secondary-prevention-2021-66': ['2a', 'C-LD'] },
      dissection: { 'ais-2026-142': ['2a', 'B-R'] },
      'minor-stroke-antiplatelets': { 'ais-2026-147': ['1', 'A'], 'ais-2026-148': ['2b', 'B-R'], 'ais-2026-149': ['2a', 'B-R'] }
    };
    for (const [id, recs] of Object.entries(expected)) {
      expect(Object.fromEntries(topic(id).recommendations.map(rec => [rec.id, [rec.cor, rec.loe]]))).toEqual(recs);
    }
  });

  it('leaves the 2021 secondary-prevention projection on its archived grades', () => {
    const recs = Object.fromEntries(read('src/guidelines/secondary-prevention-2021.json').recommendations.map(rec => [rec.id, [rec.classOfRec, rec.classNote, rec.levelOfEvidence]]));
    expect(recs).toEqual({
      'secondary-prevention-2021-51': ['IIa', null, 'B-NR'],
      'secondary-prevention-2021-145': ['I', null, 'A'],
      'secondary-prevention-2021-146': ['I', null, 'A'],
      'secondary-prevention-2021-147': ['IIb', null, 'B-R'],
      'secondary-prevention-2021-149': ['III', 'Harm', 'A']
    });
  });

  it('states early anticoagulation as the AHA 2026 2a and labels CATALYST as postdating its evidence review', () => {
    const card = topic('af-timing');
    // ais-2026-154: "a strategy of early oral anticoagulation ... is low risk and is reasonable" (IIa, A); "oral" keeps it
    // apart from ais-2026-159 (early anticoagulation within 48 h, 3: No Benefit) (evidence-fixes 2026-10-22, BL-09).
    // r3 2026-10-22 (prev-a#4): the guideline's efficacy qualifier is kept, and "once hemorrhage is excluded" (not in
    // ais-2026-154; pre-anticoagulation imaging is secondary-prevention-2021-12, 2b, on consider[0]) is no longer inside the 2a.
    expect(card.summary).toContain('Early oral anticoagulation is reasonable and low risk versus a delayed start in carefully selected (e.g., milder) AF-associated ischemic stroke (AHA 2026, 2a), although its efficacy against early recurrence is not established.');
    expect(card.summary).not.toMatch(/^Start the DOAC early/);
    // AHA 2026 abstract: search Sept–Dec 2024, additions through March 2025; CATALYST published June 2025.
    expect(card.summary).toContain('CATALYST (5,441 patients from 4 trials; published after the AHA 2026 evidence-review cutoff)');
    // CATALYST (PMID 40570866): 57/2683 (2.1%) vs 83/2746 (3.0%), OR 0.70; sICH 0.4% each.
    expect(card.summary).toContain('(2.1 vs 3.0%; OR 0.70), with identical sICH (0.4%)');
    // ELAN (PMID 37222476) 2.9 vs 4.1%; OPTIMAS (PMID 39491870) 59/1814 vs 59/1807 (3.3% each).
    expect(study('elan').result).toContain('2.9% versus 4.1%');
    expect(study('optimas').headline).toContain('3.3% each');
  });

  it('labels the lateral-medullary vessel percentages with their angiography denominator', () => {
    // Kim, Brain 2003 (PMID 12805095): "Angiograms performed in 123 patients showed VA disease in 67% and PICA disease in 10%".
    expect(topic('stroke-classification').consider[2]).toContain('(n=130; angiography in 123): vertebral artery disease in 67% and PICA disease in 10%');
  });

  it('gives PASCAL-specific closure results and the ESO anticoagulation stance on the PFO card', () => {
    const card = topic('pfo');
    // Kent, JAMA 2021 (SCOPE IPD, PMID 34905030): HR 1.14 unlikely, 0.38 possible, 0.10 probable;
    // AF beyond day 45 +4.41% (unlikely) and +1.53% (possible) (r3 2026-10-22: the possible-category rise was missing).
    expect(card.consider[1]).toContain('possible or probable (HR 0.38 and 0.10) but not unlikely (HR 1.14); AF beyond day 45 rose with closure in unlikely (+4.4%) and possible (+1.5%) categories');
    // ESO 2024 Table 12 (archived transcription): PICO 3 conditional, low certainty, possible/probable PASCAL: closure plus
    // antiplatelet instead of long-term anticoagulation alone; PICO 4 consensus: individualize if closure is refused (r3 prev-a#2).
    expect(card.consider[2]).toContain('ESO 2024 suggests closure plus antiplatelet therapy over long-term anticoagulation alone (possible or probable PASCAL; low certainty); if closure is declined, individualize antiplatelet versus anticoagulant therapy (expert consensus)');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('34905030'), pubmed('38752755')]));
    expect(card.caution).toContain('Evidence over age 60');
  });

  it('separates symptomatic grades, asymptomatic guidance and CREST-2 on the carotid card', () => {
    const card = topic('carotid');
    // secondary-prevention-2021-70 is class III: No Benefit (archived transcription).
    expect(card.summary).toContain('<50%: no revascularization (COR 3: No Benefit)');
    // ESO 2021 (PMID 34414302): CEA for ≥60–99% asymptomatic stenosis at increased risk on BMT (moderate quality).
    expect(card.summary).toContain('ESO 2021 recommends endarterectomy for 60–99% stenosis at increased stroke risk on best medical therapy (moderate-quality evidence)');
    // AHA 2024 primary prevention (archived transcription): primary-prevention-2024-32 (I, C-EO) >70% shared decision-making;
    // -34 (IIb, B-R) >70% at low perioperative risk (r3 prev-a#1). CREST-2 (2025-11) postdates both guidelines.
    expect(card.summary).toContain('Asymptomatic: for >70% stenosis, AHA 2024 recommends shared decision-making on revascularization versus medical management (COR 1); at low perioperative risk, adding revascularization to intensive medical therapy may be reasonable (2b).');
    expect(urls(card)).toContain(pubmed('39429201'));
    // CREST-2 (PMID 41269206): 2.8 vs 6.0% stenting (P=0.02); 3.7 vs 5.3% endarterectomy (P=0.24).
    expect(card.summary).toMatch(/Postdating both, CREST-2 \(≥70%\) found fewer 4-year events with stenting.*\(2\.8 vs 6\.0%\).*\(3\.7 vs 5\.3%\)/);
    expect(urls(card)).not.toContain('https://www.nejm.org/doi/full/10.1056/NEJMoa2508800');
    expect(urls(card)).toContain(pubmed('41269206'));
    const crest = study('crest-2');
    // CREST-2 PMC13148431: no carotid-territory stroke/TIA/amaurosis fugax within 180 days; certified operators;
    // 106 (17%) and 111 (18%) medical-therapy patients later revascularized.
    expect(crest.population).toContain('without carotid-territory stroke, TIA or amaurosis fugax for 180 days');
    expect(crest.limits).toContain('Only certified high-volume operators took part, and 17–18% of medical-therapy patients later underwent revascularization');
    expect(crest.sources[0].access).toContain('PMC13148431');
  });

  it('reports BASIS as a positive trial with its population, early procedural risk and the guideline positions', () => {
    const card = topic('sicas');
    // BASIS (PMID 39235816): ages 35–80, TIA <90 days or stroke 14–90 days; composite included revascularization of the
    // qualifying artery after 30 days; 4.4 vs 13.5% (HR 0.32); 30-day stroke or death 3.2 vs 1.6%; dissection 14.5%.
    expect(card.summary).toContain('at ages 35–80 with TIA within 90 days or stroke 14–90 days earlier');
    expect(card.summary).toContain('lowered a 1-year composite that included later revascularization of the qualifying artery (4.4 vs 13.5%), but 30-day stroke or death was 3.2 vs 1.6% and dissection occurred in 14.5%');
    // r3 prev-a#0: the guideline positions return, attributed rather than as an editorial verdict. AAN 2022 abstract (PMID 35314513):
    // "should not routinely recommend angioplasty alone ... outside clinical trials"; ESO 2022 abstract (PMID 36082254):
    // angioplasty and/or stenting "not recommended as a treatment of first choice".
    expect(card.summary).toContain('AAN 2022 advises against routine angioplasty alone outside trials, and ESO 2022 against first-line angioplasty or stenting.');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('35314513'), pubmed('36082254')]));
    expect(card.summary).toContain('No angioplasty or stenting as first treatment (COR 3: Harm)');
  });

  it('adds the pooled dissection trials and the AHA 2024 duration in place of an unsourced instruction', () => {
    const card = topic('dissection');
    // Kaufmann, JAMA Neurol 2024 (PMID 38739383): primary composite ischemic stroke, death or major bleeding at 90 days,
    // 3/218 (1.4%) vs 10/226 (4.4%), P=.06 "not statistically significant"; strokes OR 0.14; bleeding 2 vs 0 (r3 prev-a#5).
    expect(card.summary).toContain('Pooled CADISS/TREAT-CAD participant data (444 patients): 90-day ischemic stroke, death or major bleeding 1.4% with anticoagulation vs 4.4% with antiplatelets (P=0.06, not significant), with fewer strokes (OR 0.14) but 2 vs 0 bleeding events.');
    // AHA 2024 statement (PMID 38299330): "individualized and continued for at least 3 to 6 months".
    expect(card.summary).toContain('AHA 2024 suggests individualizing the choice for at least 3–6 months');
    expect(card.summary).not.toContain('Reassess the regimen');
    expect(urls(card)).not.toContain('https://doi.org/10.1161/STR.0000000000000457');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('38299330'), pubmed('38739383')]));
  });

  it('frames LV dysfunction and assist-device antithrombotics by source and date', () => {
    const summary = topic('cardiac-sources').summary;
    // secondary-prevention-2021-107 (IIb, B-R); AHA 2026 statement (PMID 42389837): anticoagulation "may be associated
    // with a lower risk of recurrent stroke and a net benefit when compared with antiplatelet therapy".
    expect(summary).not.toContain('not by itself an anticoagulation indication');
    // r3 prev-b#5: association wording, ungraded label, LVEF ≤40% or wall-motion definition and the evidence type from the abstract.
    expect(summary).toContain('LV dysfunction without thrombus (sinus rhythm): anticoagulant vs antiplatelet is uncertain (AHA 2021, 2b); a 2026 AHA scientific statement (ungraded; LVEF ≤40% or wall-motion abnormality; meta-analysis of secondary trial analyses) reports anticoagulation may be associated with less recurrent stroke and net benefit vs antiplatelet therapy, so individualize with cardiology.');
    expect(summary).not.toContain('may lower recurrence');
    // secondary-prevention-2021-105 (IIa, C-LD) covers patients after stroke or TIA. ARIES-HM3 (PMID 37950897; NCT04069156):
    // first durable HeartMate 3 implant, investigator-mandated antiplatelet therapy excluded; 12-month survival free of
    // hemocompatibility events 74 vs 68%; nonsurgical bleeding RR 0.66; "no increase in stroke" (r3 prev-b#2).
    expect(summary).toContain('warfarin plus aspirin can be beneficial (AHA 2021, 2a); ARIES-HM3 (2023; first-time HeartMate 3 recipients, excluding those needing antiplatelets for other conditions) later found VKA plus placebo noninferior to VKA plus aspirin for 12-month survival free of hemocompatibility events, with less nonsurgical bleeding and no more strokes; it did not test stopping aspirin after a stroke.');
    const aries = topic('cardiac-sources').sources.find(source => source.url === pubmed('37950897'));
    expect(aries).toMatchObject({ type: 'Randomized trial', checkedAt: '2026-10-22' });
    expect(aries.access).toContain('NCT04069156');
  });

  it('adds the 2026 LAAO trials after the guideline grades without changing them', () => {
    const card = topic('af-prevention');
    expect(card.summary).toContain('percutaneous left atrial appendage closure is reasonable (ACC/AHA 2023, 2a; AHA 2021 stroke guideline 2b if at least 45 days of anticoagulation can be tolerated); with high bleeding risk on anticoagulation it may be an alternative (ACC/AHA 2023, 2b).');
    // CLOSURE-AF (PMID 41849741): not noninferior to "physician-directed best medical care (including direct oral
    // anticoagulants, if eligible)"; 16.8 vs 13.3 per 100 patient-years (r3 prev-b#3).
    expect(card.summary).toContain('Postdating these (2026; AF populations not limited to stroke), device closure was not noninferior to physician-directed best medical care, including a DOAC if eligible, at high stroke and bleeding risk, with more primary events (16.8 vs 13.3 per 100 patient-years; CLOSURE-AF).');
    // CHAMPION-AF (PMID 41910347): 3-year CV death, stroke or SE 5.7 vs 4.8%; non-procedure-related bleeding 10.9 vs 19.0%.
    // NCT04394546 excludes stroke or TIA within 30 days; its third primary endpoint (ischemic stroke + SE, 60 months) is
    // pending, primary completion 2027-12 (r3 prev-b#0).
    expect(card.summary).toContain('In anticoagulation candidates without stroke or TIA in the prior 30 days, closure was noninferior to a DOAC for 3-year cardiovascular death, stroke or systemic embolism (5.7 vs 4.8%), with less non-procedural bleeding (10.9 vs 19.0%); its 5-year ischemic stroke or embolism endpoint is pending (CHAMPION-AF).');
    expect(card.sources.find(source => source.url === pubmed('41910347')).access).toContain('NCT04394546');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('41849741'), pubmed('41910347')]));
  });

  it('keeps guideline populations exact on the smaller prevention cards', () => {
    // secondary-prevention-2021-31: no known CHD, no major cardiac embolic source, LDL-C >100 mg/dL.
    expect(topic('lipid-management').summary).toContain('No known coronary disease or major cardiac source and LDL >100: atorvastatin 80 mg (COR 1');
    expect(topic('secondary-prevention').summary).toContain('no known coronary disease or major cardiac source and LDL >100: atorvastatin 80 mg (SPARCL)');
    // secondary-prevention-2021-38 (I, B-R): glucose-lowering agents with proven cardiovascular benefit.
    expect(topic('secondary-prevention').summary).toContain('Diabetes: glucose-lowering drugs with proven cardiovascular benefit (AHA 2021, COR 1)');
    // secondary-prevention-2021-98 (IIb, B-NR): "major ischemic stroke or intracranial hemorrhage", delay ≥4 weeks "if the
    // patient is hemodynamically stable"; ESC 2023 t17-2 (I, B) and t17-3 (IIa, C) from the archived transcription (r3 prev-b#1).
    const endocarditis = topic('endocarditis').summary;
    expect(endocarditis).toContain('with a major ischemic stroke or ICH, delaying valve surgery for at least 4 weeks may be considered if hemodynamically stable (AHA 2021, 2b).');
    expect(endocarditis).toContain('ESC 2023 differs after ischemic stroke: do not delay indicated surgery if the patient is not comatose and CT/MRI excludes hemorrhage (class I); after ICH, consider delaying surgery for more than 1 month if feasible (IIa).');
    // secondary-prevention-2021-77 (IIa, C-LD): bypass "can be beneficial"; ESO 2023 (PMID 37021176): "For ischaemic adult
    // patients and children ... direct or combined ... 6-12 weeks"; "direct bypass surgery in adult patients with haemorrhagic
    // presentation" (low quality, r3 prev-b#8).
    const moyamoya = topic('moyamoya');
    expect(moyamoya.summary).toContain('can be beneficial to prevent recurrent ischemia (AHA 2021, 2a)');
    expect(moyamoya.consider[1]).toContain('Ischemic presentation with hemodynamic impairment (adults and children): ESO 2023 suggests direct or combined rather than indirect bypass, 6–12 weeks after the last event; it recommends direct bypass for adults with hemorrhagic presentation (low-quality evidence)');
    // ESO 2024 lacunar (PMID 38380638): "single antiplatelet treatment long-term, blood pressure control, and lipid lowering";
    // PMC10916806 PICO 2 consensus (12/12): antiplatelets "as soon as possible after stroke onset"; DAPT "short term according
    // to the CHANCE and POINT trials' protocols" may be reasonable (r3 prev-b#4).
    const lacunar = topic('lacunar-small-vessel');
    expect(lacunar.summary).toContain('Symptomatic lacunar stroke: start antiplatelets as soon as possible (ESO 2024 consensus, which adds that short-term DAPT per CHANCE/POINT may be reasonable), then long-term single antiplatelet, BP control and lipid lowering per current guidelines (ESO 2024)');
    expect(lacunar.related).toEqual([{ label: 'Minor stroke DAPT', href: '#/evidence/minor-stroke-antiplatelets' }]);
  });

  it('matches the corrected study cards to their primary reports', () => {
    // TRIDENT (PMID 42019018): "most common adverse event leading to discontinuation was an increase of 20% or more in the serum creatinine".
    expect(study('trident').result).toContain('13.6% vs 6.0%, most often a creatinine rise ≥20%');
    expect(study('trident').result).not.toContain('mostly');
    // OCEANIC-STROKE bleeding report (PMID 42866879): lower GI bleeding 102 (1.7%) vs 59 (1.0%), csHR 1.75.
    const oceanic = study('oceanic-stroke');
    expect(oceanic.result).toContain('Ischemic stroke 6.2% vs 8.4%');
    expect(oceanic.result).toContain('lower gastrointestinal bleeding 1.7% vs 1.0% (csHR 1.75)');
    expect(urls(oceanic)).toEqual([pubmed('41985132'), pubmed('42866879')]);
  });

  it('dates only re-read sources to the review day and says what was read', () => {
    const reread = [];
    for (const id of SCOPE) for (const source of topic(id).sources) if (source.checkedAt === '2026-10-21') reread.push(source);
    for (const record of data.studies.filter(item => SCOPE.includes(item.relatedTopic))) for (const source of record.sources) if (source.checkedAt === '2026-10-21') reread.push(source);
    expect(reread.length).toBeGreaterThan(30);
    for (const source of reread) expect(source.access).toMatch(/abstract|full text|PMC/i);
    // Correction-bearing access notes were not re-checked today, so their dates stay.
    for (const id of ['optimas', 'sammpris', 'sparcl', 'ecst-2', 'cadiss', 'sps3-bp', 'progress']) {
      expect(study(id).sources[0].checkedAt).not.toBe('2026-10-21');
    }
  });
});
