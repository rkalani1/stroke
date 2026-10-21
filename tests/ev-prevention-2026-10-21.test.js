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
    expect(validateClinicalReference(data, { now: new Date('2026-10-21T23:59:59Z') })).toEqual([]);
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
    // ais-2026-154: "In carefully selected (e.g., milder severity) AIS patients with AF ... reasonable" (IIa, A).
    expect(card.summary).toContain('Early anticoagulation is reasonable in carefully selected (e.g., milder) AF-associated ischemic stroke once hemorrhage is excluded (AHA 2026, 2a)');
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
    // AF beyond day 45 +4.41% (unlikely).
    expect(card.consider[1]).toContain('possible or probable (HR 0.38 and 0.10) but not unlikely (HR 1.14), where late AF rose (absolute +4.4%)');
    // ESO 2024 (PMID 38752755): "We suggest against long-term anticoagulation ... unless anticoagulation is indicated for other medical reasons."
    expect(card.consider[2]).toContain('ESO 2024 suggests against long-term anticoagulation unless otherwise indicated');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('34905030'), pubmed('38752755')]));
    expect(card.caution).toContain('Evidence over age 60');
  });

  it('separates symptomatic grades, asymptomatic guidance and CREST-2 on the carotid card', () => {
    const card = topic('carotid');
    // secondary-prevention-2021-70 is class III: No Benefit (archived transcription).
    expect(card.summary).toContain('<50%: no revascularization (COR 3: No Benefit)');
    // ESO 2021 (PMID 34414302): CEA for ≥60–99% asymptomatic stenosis at increased risk on BMT (moderate quality).
    expect(card.summary).toContain('ESO 2021 recommends endarterectomy for 60–99% stenosis at increased stroke risk on best medical therapy (moderate-quality evidence)');
    // CREST-2 (PMID 41269206): 2.8 vs 6.0% stenting (P=0.02); 3.7 vs 5.3% endarterectomy (P=0.24).
    expect(card.summary).toMatch(/Postdating it, CREST-2 \(≥70%\) found fewer 4-year events with stenting.*\(2\.8 vs 6\.0%\).*\(3\.7 vs 5\.3%\)/);
    expect(urls(card)).not.toContain('https://www.nejm.org/doi/full/10.1056/NEJMoa2508800');
    expect(urls(card)).toContain(pubmed('41269206'));
    const crest = study('crest-2');
    // CREST-2 PMC13148431: no carotid-territory stroke/TIA/amaurosis fugax within 180 days; certified operators;
    // 106 (17%) and 111 (18%) medical-therapy patients later revascularized.
    expect(crest.population).toContain('without carotid-territory stroke, TIA or amaurosis fugax for 180 days');
    expect(crest.limits).toContain('Only certified high-volume operators took part, and 17–18% of medical-therapy patients later underwent revascularization');
    expect(crest.sources[0].access).toContain('PMC13148431');
  });

  it('reports BASIS as a positive trial with its early procedural risk', () => {
    const card = topic('sicas');
    // BASIS (PMID 39235816): 4.4 vs 13.5% (HR 0.32); 30-day stroke or death 3.2 vs 1.6%; dissection 14.5%.
    expect(card.summary).toContain('lowered the 1-year composite (4.4 vs 13.5%), but 30-day stroke or death was 3.2 vs 1.6% and dissection occurred in 14.5%');
    expect(card.summary).not.toContain('does not establish routine intervention');
    expect(card.summary).toContain('No angioplasty or stenting as first treatment (COR 3: Harm)');
  });

  it('adds the pooled dissection trials and the AHA 2024 duration in place of an unsourced instruction', () => {
    const card = topic('dissection');
    // Kaufmann, JAMA Neurol 2024 (PMID 38739383): 3/218 (1.4%) vs 10/226 (4.4%), P=.06; fewer strokes, more bleeding (2 vs 0).
    expect(card.summary).toContain('Pooled (444 patients): composite 1.4% with anticoagulation vs 4.4% with antiplatelets (P=0.06), with fewer strokes but more bleeding');
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
    expect(summary).toContain('LV dysfunction without thrombus (sinus rhythm): anticoagulant vs antiplatelet is uncertain (AHA 2021, 2b); a 2026 AHA statement suggests anticoagulation may lower recurrence with net benefit, so individualize');
    // secondary-prevention-2021-105 (IIa, C-LD); ARIES-HM3 (PMID 37950897): aspirin avoidance noninferior, less bleeding.
    expect(summary).toContain('warfarin plus aspirin can be beneficial (AHA 2021, 2a); ARIES-HM3 (2023; fully magnetically levitated LVAD, advanced heart failure) later found a VKA without aspirin noninferior, with less bleeding');
  });

  it('adds the 2026 LAAO trials after the guideline grades without changing them', () => {
    const card = topic('af-prevention');
    expect(card.summary).toContain('percutaneous left atrial appendage closure is reasonable (ACC/AHA 2023, 2a; AHA 2021 stroke guideline 2b if at least 45 days of anticoagulation can be tolerated); with high bleeding risk on anticoagulation it may be an alternative (ACC/AHA 2023, 2b).');
    // CLOSURE-AF (PMID 41849741): not noninferior to physician-directed best medical care;
    // CHAMPION-AF (PMID 41910347): noninferior to NOAC, superior for non-procedure-related bleeding (10.9 vs 19.0%).
    expect(card.summary).toContain('Postdating these (2026; AF populations not limited to stroke), device closure was not noninferior to physician-directed medical care at high stroke and bleeding risk (CLOSURE-AF) but was noninferior to a DOAC, with less non-procedural bleeding, in anticoagulation candidates (CHAMPION-AF)');
    expect(urls(card)).toEqual(expect.arrayContaining([pubmed('41849741'), pubmed('41910347')]));
  });

  it('keeps guideline populations exact on the smaller prevention cards', () => {
    // secondary-prevention-2021-31: no known CHD, no major cardiac embolic source, LDL-C >100 mg/dL.
    expect(topic('lipid-management').summary).toContain('No known coronary disease or major cardiac source and LDL >100: atorvastatin 80 mg (COR 1');
    expect(topic('secondary-prevention').summary).toContain('no known coronary disease or major cardiac source and LDL >100: atorvastatin 80 mg (SPARCL)');
    // secondary-prevention-2021-38 (I, B-R): glucose-lowering agents with proven cardiovascular benefit.
    expect(topic('secondary-prevention').summary).toContain('Diabetes: glucose-lowering drugs with proven cardiovascular benefit (AHA 2021, COR 1)');
    // secondary-prevention-2021-98 (IIb, B-NR): delay ≥4 weeks "if the patient is hemodynamically stable".
    expect(topic('endocarditis').summary).toContain('delaying valve surgery for at least 4 weeks may be considered if hemodynamically stable (2b)');
    // secondary-prevention-2021-77 (IIa, C-LD): bypass "can be beneficial"; ESO 2023 (PMID 37021176): direct or combined, 6–12 weeks.
    const moyamoya = topic('moyamoya');
    expect(moyamoya.summary).toContain('can be beneficial to prevent recurrent ischemia (AHA 2021, 2a)');
    expect(moyamoya.consider[1]).toContain('ESO 2023 suggests direct or combined rather than indirect bypass, 6–12 weeks after the last event');
    // ESO 2024 lacunar (PMID 38380638): "single antiplatelet treatment long-term, blood pressure control, and lipid lowering".
    expect(topic('lacunar-small-vessel').summary).toContain('long-term single antiplatelet, BP control and lipid lowering per current guidelines (ESO 2024)');
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
