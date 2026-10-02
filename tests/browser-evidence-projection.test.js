import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { projectClinicalClaims, projectProtocolEvidence } from '../scripts/browser-evidence-projection.mjs';
import * as canonical from '../src/evidence/index.js';
import { CLINICAL_CLAIMS } from '../src/clinical/claim-registry.js';

describe('browser evidence projection preserves every rendered clinical field', () => {
  it('keeps dose and source-limit text identical while leaving complete source records intact', () => {
    const source = Object.values(CLINICAL_CLAIMS), before = JSON.stringify(source);
    for (const record of projectClinicalClaims(source)) {
      const original = CLINICAL_CLAIMS[record.id];
      for (const field of ['id','dose','population','limits','sourceLabel','sourceUrl','reviewedAt','reviewScope']) expect(record[field]).toEqual(original[field]);
      expect(record.sources).toEqual(original.sources?.map(({label,url}) => ({label,url})));
    }
    expect(JSON.stringify(source)).toBe(before);
    expect(CLINICAL_CLAIMS['prognostic-score-limits'].text).toContain('not individual recovery ceilings');
  });
  it('preserves all protocol caveats, claim conflict notes and exact citation destinations', () => {
    const data = projectProtocolEvidence(canonical);
    expect(data.recommendations).toHaveLength(canonical.recommendations.length);
    for (const record of data.recommendations) {
      const original = canonical.recommendations.find(item => item.id === record.id);
      expect(record).toEqual({id:original.id, supportingClaimIds:original.supportingClaimIds, caveats:original.caveats});
      const full = canonical.resolveClaimsWithCitations(record.supportingClaimIds);
      const projected = record.supportingClaimIds.map(id => data.claims.find(claim => claim.id === id)).filter(Boolean);
      expect(projected.map(claim => claim.id)).toEqual(full.map(claim => claim.id));
      for (const claim of projected) {
        const originalClaim = full.find(item => item.id === claim.id);
        for (const key of ['statement','certainty','conflictNotes']) expect(claim[key]).toEqual(originalClaim[key]);
        expect(claim.citationRecords.map(canonical.citationLink)).toEqual(originalClaim.citationRecords.map(canonical.citationLink));
        expect(claim.citationRecords).toEqual(originalClaim.citationRecords.map(({id,title,journal,year,pmid,doi,url}) => Object.fromEntries(Object.entries({id,title,journal,year,pmid,doi,url}).filter(([,v])=>v!==undefined))));
      }
    }
  });
  it('preserves the complete metadata in maintained public source exports', () => {
    const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
    expect(read('../data/atlas/citations.json').data).toEqual(canonical.citations);
    expect(read('../data/atlas/claims.json').data).toEqual(canonical.claims);
    expect(read('../data/atlas/recommendations.json').data).toEqual(canonical.recommendations);
  });
});
