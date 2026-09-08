import { describe, expect, it } from 'vitest';
import guideline from '../src/guidelines/esc-endocarditis-2023.json';

const sourceCounts = [9, 2, 8, 2, 11, 7, 7, 9, 5, 3, 2, 9, 5, 1, 3, 4, 4, 4, 1, 12, 8, 4];
const row = (table, number) => guideline.recommendations.find(r => r.id === `esc-ie-2023-t${table}-${number}`);

describe('full ESC endocarditis source reconciliation', () => {
  it('accounts for every graded row, including two split-table continuations', () => {
    expect(guideline.coverage.sourceRecommendationCount).toBe(120);
    expect(guideline.coverage.sourceConsensusCount).toBe(0);
    for (const [index, count] of sourceCounts.entries()) {
      const table = `Recommendation Table ${index + 1}`;
      const rows = guideline.recommendations.filter(r => r.sourceSection === table);
      expect(rows, table).toHaveLength(count);
      expect(rows.map(r => r.sourceRecommendationNumber), table).toEqual(Array.from({ length: count }, (_, i) => i + 1));
      for (const r of rows) {
        expect(['I', 'IIa', 'IIb', 'III']).toContain(r.classOfRec);
        expect(['A', 'B', 'C']).toContain(r.levelOfEvidence);
        expect(r.sourceUrl).toContain('#ehad193-ILT');
      }
    }
  });

  it('keeps ungraded practice material and source inventory distinct from formal recommendations', () => {
    const practices = guideline.recommendations.filter(r => r.classOfRec === 'Statement');
    expect(practices).toHaveLength(guideline.coverage.sourcePracticeStatementCount);
    expect(practices.length).toBe(72);
    expect(practices.every(r => r.levelOfEvidence === 'Ungraded')).toBe(true);
    expect(new Set(guideline.recommendations.map(r => r.id)).size).toBe(guideline.recommendations.length);
    expect(guideline.coverage.sourceSections.reduce((sum, table) => sum + table.rowCount, 0)).toBe(guideline.recommendations.length);
    expect(guideline.recommendations.some(r => /source not machine-readable/i.test(r.section))).toBe(false);
    expect(guideline.recommendations.some(r => r.sourceSection === 'Section 12.9')).toBe(true);
    expect(guideline.recommendations.some(r => r.sourceSection === 'Section 13')).toBe(true);
  });

  it('preserves the complete correction scopes and corrected antibiotic qualifications', () => {
    expect(guideline.publicationUpdates.every(update => update.status === 'applied')).toBe(true);
    for (const update of guideline.publicationUpdates) {
      expect(update.affectedRecommendationIds.length).toBeGreaterThan(0);
      for (const id of update.affectedRecommendationIds) expect(guideline.recommendations.some(r => r.id === id), id).toBe(true);
    }
    expect(row(7, 2).text).toMatch(/200,000 units\/kg\/day IV in 4–6/);
    expect(row(7, 4).text).toMatch(/12 g\/day IV in 4–6/);
    expect(row(8, 2).text).toMatch(/100 mg\/kg\/day.*maximum 6 g\/day/);
    expect(row(8, 2).text).toMatch(/rifampin 20 mg\/kg\/day.*maximum 900 mg\/day/);
    expect(row(9, 3).text).toMatch(/not effective against E\. faecium/);
    expect(row(10, 1).text).toMatch(/ampicillin plus \(flu\)cloxacillin and gentamicin/);
    expect(row(10, 3).text).toMatch(/penicillin-allergic/);
    expect(guideline.publicationUpdates.find(update => /ehae877$/.test(update.doi)).note).toMatch(/Tables 7–10/);
  });

  it('retains complete integral drug schedules without extending unlisted routes or doses', () => {
    expect(guideline.recommendations.filter(r => r.doseSource)).toHaveLength(24);
    expect(row(7, 1).text).toMatch(/penicillin G 12–18 million units\/day IV in 4–6 doses or continuous infusion/);
    expect(row(7, 1).text).toMatch(/ceftriaxone 2 g\/day IV once daily/);
    expect(row(7, 2).text).toMatch(/gentamicin 3 mg\/kg\/day IV\/IM in one or three equal doses/);
    expect(row(7, 2).text).toMatch(/maximum 240 mg\/day/);
    expect(row(7, 2).text).toMatch(/trough below 1 mg\/L.*10–12 mg\/L/);
    expect(row(7, 3).text).toMatch(/Children: vancomycin 30 mg\/kg\/day IV in 2–3/);
    expect(row(8, 7).text).toMatch(/AUC\/MIC 400–600/);
    expect(row(9, 1).text).toMatch(/ceftriaxone 4 g\/day IV in 2 doses/);
    expect(row(9, 1).text).not.toMatch(/ceftriaxone 4 g\/day IV\/IM/);
    expect(row(9, 3).text).toMatch(/ceftriaxone 4 g\/day IV\/IM in 2 doses/);
    expect(row(9, 5).text).toMatch(/route not printed/);
    expect(row(10, 2).text).toMatch(/No paediatric daptomycin dose is listed/);
    expect(row(10, 3).text).toMatch(/vancomycin 40 mg\/kg\/day IV in 2–3/);
    for (const r of guideline.recommendations.filter(r => r.sourceSection === 'Supplementary Table S9')) {
      expect(r.text).toMatch(/Source oral schedules:/);
    }
  });

  it('retains treatment timing, uncertainty and neurological exceptions', () => {
    expect(row(11, 1).classOfRec).toBe('IIa');
    expect(row(11, 1).levelOfEvidence).toBe('A');
    expect(row(11, 1).text).toMatch(/at least 10 days.*at least 7 days/);
    expect(row(11, 2).classOfRec).toBe('III');
    expect(row(13, 4).classOfRec).toBe('IIb');
    expect(row(13, 5).classOfRec).toBe('III');
    expect(row(17, 2).text).toMatch(/not comatose.*excluded cerebral haemorrhage/);
    expect(row(17, 3).text).toMatch(/more than 1 month if feasible/);
    expect(row(17, 4).text).toMatch(/urgent or emergency.*meaningful neurological recovery/);
    expect(row(20, 9).classOfRec).toBe('IIb');
    expect(row(22, 3).text).toMatch(/absence of stroke/);
  });
});
