import { describe, it, expect } from 'vitest';
import { GUIDELINE_LIBRARY, GUIDELINE_LIBRARY_INDEX } from '../src/guideline-library.js';

const document = (id) => GUIDELINE_LIBRARY_INDEX.find((entry) => entry.id === id);
const ais = document('ais-2026');
const rec = (id) => ais.recommendations.find((entry) => entry.id === `ais-2026-${id}`);

describe('published guideline corrections', () => {
  it('preserves the corrected reperfusion constraints', () => {
    expect(rec(98).text).toMatch(/alteplase 0\.9 mg\/kg \(max 90 mg\)/);
    expect(rec(101).text).toMatch(/ineligible for EVT/);
    expect(rec(101).text).toMatch(/4\.5–9 hours/);
    expect(rec(101).text).toMatch(/midpoint of sleep/);
    expect(rec(101).classOfRec).toBe('IIa');
  });

  it('does not overstate the corrected PES recommendation', () => {
    expect(rec(162).text).toMatch(/FEES or videofluoroscopic swallow study/);
    expect(rec(164).classOfRec).toBe('IIb');
    expect(rec(164).text).toMatch(/non-tracheostomized/);
    expect(rec(164).text).not.toMatch(/decrease.*aspiration|reduce.*aspiration/);
    expect(rec(165).text).toMatch(/after ventilator weaning/);
    expect(rec(165).text).toMatch(/decannulation readiness assessed by FEES/);
    expect(rec(165).classOfRec).toBe('IIa');
  });

  it('ties every modified AIS entry to the correction without implying full review', () => {
    const update = ais.publicationUpdates.find((entry) => entry.pmid === '42507797');
    expect(update.status).toBe('applied');
    expect(update.affectedRecommendationIds).toHaveLength(5);
    for (const id of update.affectedRecommendationIds) {
      expect(ais.recommendations.find((entry) => entry.id === id).correctionSourceUrl)
        .toBe('https://doi.org/10.1161/STR.0000000000000530');
    }
    expect(ais.hasUnresolvedUpdates).toBe(false);
    expect(document('primary-prevention-2024').hasUnresolvedUpdates).toBe(true);
  });

  it('excludes the superseded comparison-column recommendation from current hypertension guidance', () => {
    const hypertension = document('aha-hypertension-guideline-2025');
    expect(hypertension.recommendations.some((entry) => /superseded 2017/.test(entry.section))).toBe(false);
    expect(hypertension.recommendations.some((entry) => /ACE inhibitor or ARB, but not both/.test(entry.text))).toBe(true);
    expect(hypertension.partialExtraction).toBe(false);
    expect(hypertension.coverage.sourceRecommendationCount).toBe(108);
  });
});

describe('guideline extraction and publication integrity', () => {
  it('preserves risk-specific lipid targets within all 131 graded recommendations', () => {
    const dyslipidemia = document('aha-dyslipidemia-2026');
    expect(dyslipidemia.partialExtraction).toBe(false);
    expect(dyslipidemia.sourceOnly).toBe(false);
    expect(dyslipidemia.pmid).toBe('41824552');
    expect(dyslipidemia.recommendations).toHaveLength(131);
    expect(dyslipidemia.recommendations.every((entry) => entry.levelOfEvidence !== 'Guideline Summary')).toBe(true);
    const byId = (suffix) => dyslipidemia.recommendations.find((entry) => entry.id === `aha-dyslipidemia-2026-${suffix}`);
    expect(byId('4-2-6-4').text).toMatch(/≥2 major ASCVD events, or 1 major event plus ≥2 high-risk conditions/);
    expect(byId('4-2-6-1').text).toMatch(/not very high risk/);
    expect(byId('4-2-6-1').text).toContain('LDL-C <70');
    expect(byId('4-2-6-4').text).toContain('LDL-C <55');
    expect(byId('4-2-6-3').text).toContain('also reasonable');
  });

  it('distinguishes source-only placeholders from searchable recommendations', () => {
    for (const id of ['aha-stroke-rehabilitation-2026']) {
      expect(document(id).sourceOnly, id).toBe(true);
      expect(document(id).summaryOnly, id).toBe(true);
      expect(document(id).recommendationCount, id).toBe(0);
    }
    expect(document('eso-ean-poststroke-cognition-2021').recommendationCount).toBe(40);
    expect(document('eso-ean-poststroke-cognition-2021').sourceOnly).toBe(false);
    expect(document('eso-sah-2026').partialExtraction).toBe(false);
    expect(document('eso-sah-2026').sourceOnly).toBe(false);
  });

  it('retains traceable status for every identified correction', () => {
    const affected = GUIDELINE_LIBRARY_INDEX.filter((entry) => entry.publicationUpdates.length);
    const updates = affected.flatMap((entry) => entry.publicationUpdates);
    expect(affected).toHaveLength(22);
    expect(updates).toHaveLength(29);
    expect(new Set(updates.map((entry) => entry.pmid)).size).toBe(29);
    for (const guideline of affected) for (const update of guideline.publicationUpdates) {
      expect(update.type).toBe('correction');
      expect(update.pmid).toMatch(/^\d{7,9}$/);
      expect(update.doi).toMatch(/^10\.\d{4,9}\//);
      expect(update.publisherUrl.toLowerCase()).toBe(`https://doi.org/${update.doi}`.toLowerCase());
      expect(['applied', 'not-applicable', 'partially-applied', 'unresolved']).toContain(update.status);
      expect(update.note.length).toBeGreaterThan(20);
      for (const id of update.affectedRecommendationIds) {
        expect(guideline.recommendations.some((entry) => entry.id === id), id).toBe(true);
      }
    }
  });

  it('keeps all source identifiers, entries and evidence-grade vocabularies valid', () => {
    const ids = new Set();
    const classes = ['I', 'IIa', 'IIb', 'III', 'Strong', 'Conditional', 'Expert Consensus', 'Statement', 'No recommendation'];
    const levels = ['A', 'B', 'C', 'B-R', 'B-NR', 'C-LD', 'C-EO', 'High certainty', 'Moderate certainty', 'Low certainty', 'Very low certainty', 'Ungraded', 'Guideline Summary'];
    expect(GUIDELINE_LIBRARY).toHaveLength(109);
    for (const guideline of GUIDELINE_LIBRARY_INDEX) {
      expect(guideline.pmid).toMatch(/^\d{7,9}$/);
      expect(guideline.doi).toMatch(/^10\.\d{4,9}\//);
      for (const entry of guideline.recommendations) {
        expect(ids.has(entry.id), entry.id).toBe(false);
        ids.add(entry.id);
        expect(entry.text.trim().length, entry.id).toBeGreaterThan(0);
        expect(entry.section.trim().length, entry.id).toBeGreaterThan(0);
        expect(classes, entry.id).toContain(entry.classOfRec);
        expect(levels, entry.id).toContain(entry.levelOfEvidence);
        expect(entry.page === null || Number.isInteger(entry.page) && entry.page > 0, entry.id).toBe(true);
        expect(new URL(entry.sourceUrl).protocol, entry.id).toBe('https:');
      }
    }
  });
});
