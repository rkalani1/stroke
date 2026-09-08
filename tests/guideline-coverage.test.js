import { describe, expect, it } from 'vitest';
import { guidelineCoverage } from '../src/guideline-coverage.js';
import { GUIDELINE_LIBRARY_INDEX } from '../src/guideline-library.js';

describe('source coverage and source-page provenance', () => {
  it('does not turn an unreviewed document or a placeholder into complete coverage', () => {
    expect(guidelineCoverage({ recommendations: [{ section: 'Treatment' }] }).coverageComplete).toBe(false);
    const placeholder = guidelineCoverage({ coverage: { status: 'complete' }, recommendations: [{ section: 'Source not machine-readable' }] });
    expect(placeholder.coverageComplete).toBe(false);
    expect(placeholder.recommendationCount).toBe(0);
  });

  it('keeps complete coverage distinct from publication-correction status', () => {
    const indexed = GUIDELINE_LIBRARY_INDEX.filter(guideline => guideline.coverageComplete);
    for (const guideline of indexed) {
      expect(guideline.partialExtraction, guideline.id).toBe(false);
      expect(guideline.sourceOnly, guideline.id).toBe(false);
      expect(guideline.hasUnresolvedUpdates, guideline.id).toBe(guideline.publicationUpdates.some(update => ['unresolved', 'partially-applied'].includes(update.status)));
    }
  });

  it('links to physical PDF pages when the dataset supplies them', () => {
    for (const guideline of GUIDELINE_LIBRARY_INDEX) for (const rec of guideline.recommendations) {
      if (rec.pdfPage && guideline.pdfUrl) {
        expect(rec.pdfSourceUrl, rec.id).toBe(`${guideline.coverage?.sourceDocument?.pdfUrl || guideline.pdfUrl}#page=${rec.pdfPage}`);
      }
    }
  });

  it('reconciles complete documents to their independently recorded source inventories', () => {
    const reviewed = GUIDELINE_LIBRARY_INDEX.filter(guideline => guideline.coverageComplete);
    expect(reviewed.length).toBeGreaterThanOrEqual(11);
    for (const guideline of reviewed) {
      const c = guideline.coverage;
      const rows = guideline.recommendations;
      const practiceCount = c.sourcePracticeStatementCount || c.sourcePracticePointCount || 0;
      expect(rows, guideline.id).toHaveLength(c.sourceRecommendationCount + c.sourceConsensusCount + practiceCount + (c.sourceValueStatementCount || 0));
      expect(c.checkedAt, guideline.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.scope.length, guideline.id).toBeGreaterThan(20);
      expect(c.sourceSections.length, guideline.id).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.sourceStatementId || row.sourceRecommendationNumber, row.id).toBeTruthy();
        expect(row.sourceReference || row.sourceSection, row.id).toBeTruthy();
      }
      // GRADE sources enumerate formal statements and consensus independently.
      if (c.inventory) {
        for (const section of c.inventory) {
          const sectionRows = rows.filter(row => row.sourceStatementId?.startsWith(`${section.section} `));
          expect(sectionRows.filter(row => row.sourceStatementType === 'recommendation'), `${guideline.id} ${section.section}`).toHaveLength(section.recommendationCount);
          expect(sectionRows.filter(row => row.sourceStatementType === 'consensus'), `${guideline.id} ${section.section}`).toHaveLength(section.consensusCount);
        }
      } else {
        expect(c.sourceSections.reduce((sum, section) => sum + section.rowCount, 0), guideline.id).toBe(rows.length);
        for (const section of c.sourceSections) {
          if (!section.recommendationNumbers) continue;
          const tableRows = rows.filter(row => row.sourceSection === section.id);
          expect(tableRows, `${guideline.id} ${section.id}`).toHaveLength(section.rowCount);
          expect(tableRows.map(row => row.sourceRecommendationNumber), `${guideline.id} ${section.id}`).toEqual(section.recommendationNumbers);
        }
      }
    }
  });
});
