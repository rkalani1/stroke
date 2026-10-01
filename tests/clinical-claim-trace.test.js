import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { checkClinicalClaims, collectClinicalOccurrences, runClinicalClaimCheck, sha256, sourceSection } from '../scripts/check-clinical-claims.mjs';
import { CLINICAL_CLAIMS, getClinicalClaim } from '../src/clinical/claim-registry.js';
import { recommendations } from '../src/evidence/recommendations.js';

function fixture() {
  const files = { 'screen.jsx': "getClinicalClaim('test-dose').text", 'source.json': 'source', 'export.pdf': 'reviewed PDF' };
  const claim = { id: 'test-dose', text: 'Preserved regimen', severity: 'critical' };
  const inventory = {
    scope: { files: ['screen.jsx'] },
    groups: [{ id: 'dose', severity: 'critical', pattern: "getClinicalClaim\\('test-dose'\\)", claimHashes: { 'test-dose': sha256(JSON.stringify(claim)) }, sourceHashes: { 'source.json': sha256(files['source.json']) } }],
    occurrences: [],
    exports: [{ file: 'export.pdf', sha256: sha256(files['export.pdf']), inputHashes: { 'source.json': sha256(files['source.json']) } }]
  };
  const read = file => files[file];
  inventory.occurrences = collectClinicalOccurrences(inventory, read).map(item => ({ ...item, disposition: 'canonical', claimIds: ['test-dose'], reason: 'Existing wording adopted.' }));
  return { files, inventory, claims: [claim], read };
}

describe('bounded clinical claim trace', () => {
  it('accepts the checked repository inventory', () => expect(runClinicalClaimCheck().findings).toEqual([]));
  it('preserves explicit claim identities and rejects unknown claims', () => {
    expect(getClinicalClaim('tnk-stroke-dose').dose).toBe('0.25 mg/kg, max 25 mg');
    expect(getClinicalClaim('alteplase-stroke-dose').dose).toBe('0.9 mg/kg, max 90 mg');
    expect(() => getClinicalClaim('invented')).toThrow('Unknown clinical claim');
  });
  it('uses recorded source-review dates and retains the AIS prognosis source', () => {
    for (const claim of Object.values(CLINICAL_CLAIMS)) {
      for (const file of new Set([claim.sourceFile, ...(claim.sources || []).map(source => source.file)].filter(Boolean))) {
        expect(claim.reviewedAt).toBe(JSON.parse(fs.readFileSync(file, 'utf8')).sourceReview.reviewedAt);
      }
    }
    expect(getClinicalClaim('prognostic-score-limits').sources.map(source => source.url)).toContain('https://doi.org/10.1007/s12028-026-02486-3');
  });
  it('keeps eligibility and evidence caveats around the shared doses in the evidence/search record', () => {
    const recommendation = recommendations.find(item => item.id === 'rec-tnk-first-line');
    expect(recommendation.text).toContain(getClinicalClaim('tnk-stroke-dose').dose);
    expect(recommendation.text).toContain(getClinicalClaim('alteplase-stroke-dose').dose);
    expect(recommendation.text).toContain('eligible AIS within 4.5 h');
    expect(recommendation.text).toContain('either agent is first-line');
    expect(recommendation.caveats.join(' ')).toContain('0.40 mg/kg');
    expect(recommendation.lastReviewed).toBe('2026-09-26');
  });
  it('flags every mapped use when the canonical statement changes', () => {
    const f = fixture();
    f.claims[0].text = 'Changed regimen';
    expect(checkClinicalClaims(f).findings).toContainEqual(expect.objectContaining({ severity: 'critical', code: 'changed-canonical-claim', affected: ['screen.jsx:1 (canonical)'] }));
  });
  it('includes source-specific PDF occurrences when a related shared rule changes', () => {
    const f = fixture();
    f.inventory.artifactOccurrences = [{ groupId: 'dose', file: 'archive.pdf', page: 2, disposition: 'excluded' }];
    f.claims[0].text = 'Changed regimen';
    expect(checkClinicalClaims(f).findings.find(item => item.code === 'changed-canonical-claim').affected).toEqual(['screen.jsx:1 (canonical)', 'archive.pdf, page 2 (excluded)']);
  });
  it('fails when a new repeated statement bypasses the reviewed inventory', () => {
    const f = fixture();
    f.files['screen.jsx'] += "\ngetClinicalClaim('test-dose').text";
    expect(checkClinicalClaims(f).findings.some(item => item.code === 'unreviewed-occurrence')).toBe(true);
  });
  it('fails a stale PDF when its input changes even if its old bytes are untouched', () => {
    const f = fixture();
    f.files['source.json'] = 'changed source';
    expect(checkClinicalClaims(f).findings.map(item => item.code)).toEqual(expect.arrayContaining(['changed-source', 'stale-export-input']));
  });
  it('fails when exported bytes change without a reviewed export fingerprint', () => {
    const f = fixture();
    f.files['export.pdf'] = 'unreviewed PDF';
    expect(checkClinicalClaims(f).findings.some(item => item.code === 'unreviewed-export')).toBe(true);
  });
  it('fails only the export whose component changed when unrelated lessons share one file', () => {
    const f = fixture();
    f.files['education.jsx'] = 'export function CardA() { return "A"; }\nexport function CardB() { return "B"; }';
    f.inventory.exports[0].inputSections = [{ file: 'education.jsx', name: 'CardA', sha256: sha256(sourceSection(f.files['education.jsx'], 'CardA')) }];
    f.files['education.jsx'] = f.files['education.jsx'].replace('"B"', '"Changed B"');
    expect(checkClinicalClaims(f).ok).toBe(true);
    f.files['education.jsx'] = f.files['education.jsx'].replace('"A"', '"Changed A"');
    expect(checkClinicalClaims(f).findings.some(item => item.code === 'stale-export-section')).toBe(true);
  });
});
