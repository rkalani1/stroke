// Round-3 verification fixes (unit ev-prevrec, 2026-10-22) for prevention, recovery, antiamyloid and PASCAL text.
// Expected strings come from sources re-read on 2026-10-22 and named beside each assertion: PubMed abstracts, PMC full
// text, ClinicalTrials.gov records, or the archived guideline transcriptions at git 4f8e99d (archive scope, secondary to
// full texts that are not reachable). Decisions: docs/review-2026-10-21/r3-ev-prevrec.md.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';
import { bottomLine } from '../src/reference-search.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { SAFETY_TIERS } from '../src/clinical/safety-items.js';

const data = readClinicalReference();
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const topic = id => data.topics.find(record => record.id === id);
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const source = (record, pmid) => record.sources.find(entry => entry.url === pubmed(pmid));
const coverage = id => read('src/reference/coverage.json').find(entry => entry.id === id);

describe('r3 ev-prevrec: reference contract', () => {
  it('validates on the review date', () => {
    expect(validateClinicalReference(data, { now: new Date('2026-10-22T23:59:59Z') })).toEqual([]);
  });
});

describe('r3 ev-prevrec: prevention cards', () => {
  it('af-timing keeps the 2a efficacy qualifier in the bottom line and the TIA grade as written', () => {
    const card = topic('af-timing');
    // ais-2026-154 (IIa, A): "is low risk and is reasonable compared with delayed anticoagulation, although the efficacy
    // of early anticoagulation for preventing early recurrent stroke is not established".
    const line = bottomLine(card.summary);
    expect(line).toContain('(AHA 2026, 2a), although its efficacy against early recurrence is not established.');
    expect(line).not.toContain('once hemorrhage is excluded');
    // secondary-prevention-2021-12 (IIb, B-NR): brain CT or MRI before anticoagulation "may be considered".
    expect(card.consider[0]).toContain('brain imaging before starting may be considered (AHA 2021, 2b)');
    // secondary-prevention-2021-86 (IIa, C-EO): "In TIA patients with nonvalvular AF, it is reasonable to initiate
    // anticoagulation immediately".
    expect(card.consider[3]).toBe('TIA with nonvalvular AF: starting anticoagulation immediately is reasonable (AHA 2021, 2a, expert opinion).');
  });

  it('labels lateral medullary mechanisms as presumed and the cohort as pure', () => {
    // Kim, Brain 2003 (PMID 12805095): "The presumed pathogenetic mechanisms included large vessel infarction in 50% ...".
    const item = topic('stroke-classification').consider[2];
    expect(item.startsWith('Pure lateral medullary infarction (n=130; angiography in 123)')).toBe(true);
    expect(item).toContain('presumed mechanisms included large-vessel 50%, dissection 15%, small-vessel 13% and cardioembolic 5%');
    expect(item).not.toContain('mechanisms were');
  });

  it('maps AHA 2024 primary prevention to the carotid card with an archive-scope note', () => {
    const entry = coverage('primary-prevention-2024');
    expect(entry.topicIds).toEqual(['primary-prevention', 'carotid']);
    expect(entry).toMatchObject({ checkedAt: '2026-10-22', url: pubmed('39429201') });
    expect(entry.access).toContain('archived full-text transcription');
    expect(entry.access).toContain('39585937, 39869715 not reconciled');
    expect(source(topic('carotid'), '39429201')).toBeTruthy();
  });

  it('restores the newer-evidence caveat on the sICAS and dissection guideline sources', () => {
    // AAN advisory 2022-03-22 and AHA dissection statement 2024-02-01 predate BASIS (2024-10) and the CAD IPD meta-analysis (2024-06).
    expect(coverage('aan-sicas-2022').access).toContain('Interpret with newer evidence (BASIS 2024).');
    expect(coverage('eso-intracranial-atherosclerosis-2022').access).toContain('Interpret with newer evidence (BASIS 2024).');
    expect(coverage('aha-cervical-artery-dissection-2024').access).toContain('Interpret with newer evidence (2024 CADISS/TREAT-CAD participant-data meta-analysis; AHA 2026 AIS guideline).');
    for (const id of ['aan-sicas-2022', 'eso-intracranial-atherosclerosis-2022', 'aha-cervical-artery-dissection-2024']) {
      expect(coverage(id).checkedAt, id).toBe('2026-10-22');
      expect(coverage(id).access, id).toMatch(/abstract re-read 2026-10-22/);
    }
  });

  it('keeps CHAMPION-AF and ARIES-HM3 inside their trial populations', () => {
    const laao = topic('af-prevention').summary;
    // NCT04394546 exclusion: "prior stroke (of any cause ...) or transient ischemic attack (TIA) within the 30 days prior to enrollment".
    expect(laao).toContain('without stroke or TIA in the prior 30 days');
    expect(laao).not.toContain('with less non-procedural bleeding, in anticoagulation candidates (CHAMPION-AF)');
    const cardiac = topic('cardiac-sources').summary;
    // NCT04069156: first durable VAD; excludes "Investigator mandated antiplatelet therapy for other conditions".
    expect(cardiac).toContain('it did not test stopping aspirin after a stroke.');
    expect(cardiac).not.toContain('a VKA without aspirin noninferior, with less bleeding');
  });
});

describe('r3 ev-prevrec: recovery, inpatient and antiamyloid cards', () => {
  it('states the post-EVT BP harm for both studied windows and links the BP card', () => {
    const card = topic('inpatient-care');
    // ais-2026-77 (III: Harm, A): anterior LVO, <140 for 72 h. OPTIMAL-BP (PMID 37668619): <140 for 24 h after mTICI ≥2b,
    // independence 39.4 vs 54.4%. ESO 2025 abstract (PMID 42095756): "against intensively lowering systolic BP < 140 mmHg in
    // the first 24 h after successful mechanical thrombectomy (high-certainty evidence)".
    expect(card.caution).toContain('targeting SBP <140 for 72 h after successful anterior-LVO EVT is harmful (AHA 2026, COR 3: Harm)');
    expect(card.caution).toContain('a 24-h <140 target also lowered functional independence (OPTIMAL-BP 39.4 vs 54.4%)');
    expect(card.caution).toContain('ESO 2025 recommends against intensive lowering below 140 in the first 24 h');
    expect(source(card, '37668619')).toMatchObject({ type: 'Randomized trial', checkedAt: '2026-10-22' });
    expect(source(card, '42095756')).toBeTruthy();
    expect(card.related).toContainEqual({ label: 'Acute BP context', href: '#/evidence/acute-bp' });
  });

  it('limits the antiplatelet allowance to monotherapy and discloses the checklist tier and the unread AHA summit', () => {
    const card = topic('antiamyloid-vascular-risk');
    // Donanemab AUR (PMC12180672) 5.2: "standard doses of monotherapy ..."; "insufficient safety data ... dual anti-platelet therapy".
    expect(card.caution).toContain('standard-dose antiplatelet monotherapy is allowed, but the donanemab AUR makes no recommendation on dual antiplatelet therapy (insufficient safety data)');
    expect(card.caution).not.toContain('standard-dose antiplatelets are allowed');
    // The Encounter statement must stay true of src/clinical/safety-items.js: "Lecanemab or other anti-amyloid therapy"
    // is displayed in the absolute ("Generally contraindicated") tier.
    expect(card.caution).toContain('The Encounter IVT checklist lists antiamyloid therapy as generally contraindicated.');
    const absolute = SAFETY_TIERS.find(([tier]) => tier === 'absolute')[1].map(item => item.id);
    expect(absolute).toContain('lecanemab');
    // PMID 42622140: no PMCID; abstract only.
    expect(card.caution).toContain('The August 2026 AHA ARIA Summit statement was read at abstract level only and is not reflected here.');
    expect(source(card, '40155270').access).toContain('no recommendation on dual therapy');
  });

  it('discloses the unreviewed 2026 AHA/ASA rehabilitation guideline on the motor and driving cards', () => {
    // PMID 42657476 abstract: "Key updates include new and revised recommendations ... safe return to work and driving."
    expect(topic('motor-recovery').caution).toContain('The August 2026 AHA/ASA rehabilitation guideline was not reviewed.');
    expect(topic('driving-work').caution).toContain('The August 2026 AHA/ASA rehabilitation guideline, which revises return-to-work and driving recommendations, was not reviewed.');
    expect(coverage('aha-stroke-rehabilitation-2026').topicIds).toEqual(['recovery', 'motor-recovery', 'driving-work']);
    for (const id of ['motor-recovery', 'driving-work']) expect(source(topic(id), '42657476'), id).toBeTruthy();
  });
});

describe('r3 ev-prevrec: PASCAL limits', () => {
  it('reports the late-AF rise in both the unlikely and possible categories, in the definition and the registry', () => {
    // Kent, JAMA 2021 (PMID 34905030): AF beyond day 45 +4.41% unlikely, +1.53% possible, +0.65% (CI crosses 0) probable.
    const pascal = calculatorDefinitions.find(item => item.id === 'pascal');
    expect(pascal.limits).toContain('In pooled trial data, closure reduced stroke in possible/probable but not unlikely categories; AF after day 45 rose with closure in unlikely (+4.4%) and possible (+1.5%).');
    expect(pascal.limits).not.toContain('where late AF rose');
    expect(read('content/calculators/registry.json').find(row => row.id === 'pascal').limits).toBe(pascal.limits);
  });
});
