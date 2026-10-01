import { describe, expect, it } from 'vitest';
import { GUIDELINE_LIBRARY_INDEX } from '../src/guideline-library.js';

const document = id => GUIDELINE_LIBRARY_INDEX.find(g => g.id === id);

describe('bounded source recovery and applicability', () => {
  it('keeps stable outpatient targets distinct from acute stroke BP treatment', () => {
    const rows = document('aha-hypertension-guideline-2025').recommendations.filter(r => r.sourceSection === '5.3.9.3');
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.text).toContain('outpatient management of neurologically stable patients');
      expect(row.text).toContain('acute-stroke BP management uses separate recommendations');
    }
  });

  it('preserves the specific scope of recovered notices without clearing incomplete AIS corrections', () => {
    const updates = document('aha-hypertension-guideline-2025').publicationUpdates;
    expect(updates.map(u => u.doi)).toEqual([
      '10.1161/HYP.0000000000000257', '10.1161/HYP.0000000000000262', '10.1161/HYP.0000000000000264'
    ]);
    for (const update of updates) {
      expect(update.status).toBe('not-applicable');
      expect(update.note).toContain('108 retained recommendation rows');
      expect(update.independentReviewScope).toContain('Direct publisher PDF remains inaccessible');
    }
    expect(document('ais-2026').publicationUpdates.some(u => u.status === 'partially-applied')).toBe(true);
    const cognition = document('eso-ean-poststroke-cognition-2021');
    expect(cognition.publicationUpdates.find(u => u.pmid === '35300261').status).toBe('applied');
    expect(cognition.sourceReview.sourceAccess).toContain('all 22 formal/no-recommendation and 18 consensus units independently paired');
    expect(cognition.sourceReview.currencyNote).toContain('does not establish comprehensive clinical currency');
    expect(cognition.sourceReview.sourceEditionNote).toContain('January 25, 2022 erratum');
  });

  it('does not turn source ambiguity or an author manuscript into certainty', () => {
    const rural = document('aha-rural-stroke-care-2024').recommendations[19];
    expect(rural.text).not.toContain('the latter being required');
    expect(rural.text).toContain('does not assign those requirements');
    expect(rural.sourceConflictNote).toContain('ambiguous antecedent');
    const seizure = document('ncs-ich-seizure-prophylaxis-2024');
    expect(seizure.sourceReview.sourceAccess).toContain('published full body has not been recovered');
    expect(seizure.sourceReview.sourceEditionNote).toContain('version-limited expert practice');
    expect(seizure.recommendations.slice(3).every(r => r.classOfRec === 'Expert Consensus' && r.levelOfEvidence === 'Ungraded')).toBe(true);
  });

  it('preserves the setting and study qualifier for neuropalliative communication findings', () => {
    const rows = document('aan-neuropalliative-2022').recommendations;
    expect(rows[8].text).toContain('a critical-care study');
    expect(rows[23].text).toContain('one study suggesting');
    expect(rows[23].text).not.toContain("Surrogates mistrust clinicians' prognostic estimates,");
  });

  it('dates historical palliative cohorts and does not turn a closed review window into a current no-trials claim', () => {
    const rows = document('aha-palliative-end-life-2024').recommendations;
    expect(rows[26].text).toContain('in 2014 and followed through the end of 2015');
    expect(rows[27].text).toContain('1990 through 2021');
    expect(rows[27].text).toContain('seven included studies');
    expect(rows[27].text).toContain('not the current absence of all such trials');
  });

  it('separately attributes qualified hospice benefits instead of retaining blanket noncoverage', () => {
    const hospice = document('aha-palliative-end-life-2024').recommendations[34];
    expect(hospice.text).not.toMatch(/Medicare does not pay|not cover/i);
    expect(hospice.currentEvidenceNote).toContain('individualized hospice plan');
    expect(hospice.currentEvidenceNote).toContain('terminal illness and related conditions');
    expect(hospice.currentEvidenceNote).toContain('Routine room and board is generally excluded');
    expect(hospice.currentEvidenceNote).toContain('short-term inpatient or respite stays can be covered');
    expect(hospice.currentEvidenceSources.map(s => s.url)).toEqual([
      'https://www.cms.gov/medicare/payment/fee-for-service-providers/hospice',
      'https://www.medicare.gov/coverage/hospice-care'
    ]);
    expect(hospice.sourceConflictNote).toContain('rather than presented as an AHA correction');
  });

  it('keeps neutral CVT trial evidence and observational mortality separate from individualized rescue treatment', () => {
    const row = document('cvt-2024').recommendations[28];
    expect(row.text).toContain('did not demonstrate a clinical benefit');
    expect(row.text).toContain('does not by itself establish');
    expect(row.text).toContain('deterioration or thrombus propagation despite medical therapy');
    expect(row.classOfRec).toBe('Statement');
    expect(row.levelOfEvidence).toBe('Ungraded');
  });
});
