import { describe, expect, it } from 'vitest';
import dyslipidemia from '../src/guidelines/aha-dyslipidemia-2026.json';
import hypertension from '../src/guidelines/aha-hypertension-guideline-2025.json';
import sourceRows from './fixtures/cardiometabolic-source-rows-20260906.json';

// Independent source-table inventory: complete publisher PDFs, physical pages,
// table-local row numbers and printed COR/LOE. See the dated review for sources.
const row = (doc, section, number) => doc.recommendations.find(r => r.sourceSection === section && r.sourceRecommendationNumber === number);
const sourceGrade = r => `${({ I: '1', IIa: '2a', IIb: '2b', III: '3' })[r.classOfRec]}${r.classNote ? `: ${r.classNote}` : ''}`;

describe('complete cardiometabolic guideline source accounting', () => {
  for (const [doc, count, tables] of [[dyslipidemia, 131, 38], [hypertension, 108, 30]]) {
    it(`${doc.id}: accounts for every formal source row exactly once`, () => {
      expect(doc.coverage.status).toBe('complete');
      expect(doc.coverage.sourceRecommendationCount).toBe(count);
      expect(doc.coverage.sourceConsensusCount).toBe(0);
      expect(doc.recommendations).toHaveLength(count);
      expect(doc.coverage.sourceSections).toHaveLength(tables);
      expect(doc.coverage.sourceSections.reduce((n, s) => n + s.rowCount, 0)).toBe(count);
      expect(new Set(doc.recommendations.map(r => r.id)).size).toBe(count);
      expect(doc.extractionStatus).toBeUndefined();
      expect(doc.recommendations.every(r => r.sourceStatementType === 'recommendation')).toBe(true);
      expect(doc.recommendations.some(r => /Guideline Summary|Ungraded/.test(r.levelOfEvidence))).toBe(false);
    });

    it(`${doc.id}: preserves all source grades, table-local row numbers and PDF pages`, () => {
      expect(doc.coverage.sourceSections.map(s => s.id)).toEqual(sourceRows[doc.id].map(([id]) => id));
      for (const [section, signature] of sourceRows[doc.id]) {
        const actual = doc.recommendations.filter(r => r.sourceSection === section);
        expect(actual.map(r => `${r.sourceRecommendationNumber}:${sourceGrade(r)}:${r.levelOfEvidence}:${r.pdfPage}`).join('|'), section).toBe(signature);
        const inventory = doc.coverage.sourceSections.find(s => s.id === section);
        expect(actual.map(r => r.sourceRecommendationNumber), section).toEqual(inventory.recommendationNumbers);
        expect(inventory.rowCount, section).toBe(actual.length);
        expect(inventory.pageRange, section).toEqual([Math.min(...actual.map(r => r.pdfPage)), Math.max(...actual.map(r => r.pdfPage))]);
        expect(actual.every(r => r.page === r.pdfPage && r.pdfPage > 0 && r.pdfPage <= doc.coverage.sourceDocument.pageCount)).toBe(true);
      }
    });
  }

  it('covers lipid screening, inherited disorders, primary prevention and populations outside stroke', () => {
    expect(row(dyslipidemia, '3.1', 1).text).toMatch(/age 19.*5 years/);
    expect(row(dyslipidemia, '3.1', 2).text).toContain('9–11');
    expect(row(dyslipidemia, '4.2.3.2', 1).text).toMatch(/30–79.*70–189.*PREVENT-ASCVD/);
    expect(row(dyslipidemia, '4.2.3.7', 3).text).toMatch(/30-year ASCVD risk ≥10%/);
    expect(row(dyslipidemia, '4.2.4.1', 2).classNote).toBe('Harm');
    expect(row(dyslipidemia, '4.2.4.4', 5).text).toMatch(/lomitapide.*hepatic-safety/);
    expect(row(dyslipidemia, '4.2.8.1', 2).text).toMatch(/≥8.*≥160.*3–6 months/);
    expect(row(dyslipidemia, '4.2.8.9', 1).text).toMatch(/HIV.*40–75.*antiretroviral/);
    expect(row(dyslipidemia, '4.2.8.10', 3).text).toContain('anthracycline');
  });

  it('keeps distinct ASCVD risk tiers and the LDL-lowering-only inclisiran limitation', () => {
    expect(row(dyslipidemia, '4.2.6', 1).text).toMatch(/not very high risk.*LDL-C <70/);
    expect(row(dyslipidemia, '4.2.6', 3).classOfRec).toBe('IIa');
    expect(row(dyslipidemia, '4.2.6', 3).text).toMatch(/not at very high risk.*LDL-C <55/);
    expect(row(dyslipidemia, '4.2.6', 4).text).toMatch(/≥2 major ASCVD events, or 1 major event plus ≥2/);
    expect(row(dyslipidemia, '4.2.6', 7).text).toMatch(/outcome trials were incomplete/);
    expect(row(dyslipidemia, '4.2.8.4', 5).text).toMatch(/may be reasonable.*individualized.*pravastatin/);
  });

  it('retains hypertension thresholds as separate systolic and diastolic recommendations', () => {
    expect(hypertension.society).toBe('AHA/ACC');
    expect(row(hypertension, '5.2.2', 5).text).toMatch(/SBP ≥130.*≥7.5%/);
    expect(row(hypertension, '5.2.2', 5).levelOfEvidence).toBe('A');
    expect(row(hypertension, '5.2.2', 6).text).toMatch(/DBP ≥80.*≥7.5%/);
    expect(row(hypertension, '5.2.2', 6).levelOfEvidence).toBe('C-LD');
    expect(row(hypertension, '5.2.2', 7).text).toMatch(/<7.5%.*SBP remains ≥130.*3–6 months/);
    expect(row(hypertension, '5.2.2', 8).text).toMatch(/<7.5%.*DBP remains ≥80.*3–6 months/);
  });

  it('retains pregnancy, resistant-hypertension and perioperative constraints', () => {
    expect(row(hypertension, '3.2.3.1', 4).text).toContain('mineralocorticoid receptor antagonists');
    expect(row(hypertension, '5.5', 3).text).toMatch(/within 15 minutes.*30–60 minutes/);
    expect(row(hypertension, '5.5', 5).classNote).toBe('Harm');
    expect(row(hypertension, '5.6', 2).text).toMatch(/eGFR is ≥45/);
    expect(row(hypertension, '5.6', 4).text).toMatch(/140–180.*DBP ≥90.*eGFR ≥40/);
    expect(row(hypertension, '6.4', 6).text).toMatch(/Do not start.*day of surgery/);
    expect(row(hypertension, '6.4', 6).classNote).toBe('Harm');
  });

  it('retains harm and no-benefit distinctions for acute stroke', () => {
    expect(row(hypertension, '5.3.9.1', 1).text).toMatch(/150–220.*130–<140.*7 days.*below 130/);
    expect(row(hypertension, '5.3.9.2', 2).text).toMatch(/<185\/110.*180\/105.*24 hours/);
    expect(row(hypertension, '5.3.9.2', 5).classNote).toBe('No Benefit');
    expect(row(hypertension, '5.3.9.2', 6).classNote).toBe('Harm');
    expect(row(hypertension, '5.3.9.2', 6).text).toMatch(/below 140.*24–72 hours/);
  });

  it('records the resolved hypertension correction and the incorporated lipid correction', () => {
    const reviewed = hypertension.publicationUpdates.find(u => u.pmid === '41984986');
    expect(reviewed.status).toBe('not-applicable');
    expect(reviewed.note).toMatch(/Table 16.*lithium.*wrong column/);
    expect(reviewed.affectedRecommendationIds).toEqual([]);
    expect(hypertension.publicationUpdates.find(u => u.pmid === '42160500').note).toContain('10-minute intervals');
    const lipidCorrection = dyslipidemia.publicationUpdates.find(u => u.pmid === '42330109');
    expect(lipidCorrection.status).toBe('applied');
    expect(lipidCorrection.note).toMatch(/≥150.*Figures 16 and 17/);
    expect(row(dyslipidemia, '4.2.9', 5).sourceFigure).toBe(16);
    expect(row(dyslipidemia, '4.2.9', 6).sourceFigure).toBe(17);
    expect(row(dyslipidemia, '4.2.9', 5).correctionSourceUrl).toBe('https://doi.org/10.1161/CIR.0000000000001457');
    expect(lipidCorrection.affectedRecommendationIds.every(id => dyslipidemia.recommendations.some(r => r.id === id))).toBe(true);
  });
});
