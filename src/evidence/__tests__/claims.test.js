import { describe, it, expect } from 'vitest';
import { claims, getClaim, getAllClaimIds } from '../claims.js';

describe('claims data structure', () => {
  it('is an array of claim objects', () => {
    expect(Array.isArray(claims)).toBe(true);
    expect(claims.length).toBeGreaterThan(0);
  });

  it('each claim has required schema fields', () => {
    for (const claim of claims) {
      expect(typeof claim.id).toBe('string');
      expect(claim.id.length).toBeGreaterThan(0);
      expect(typeof claim.statement).toBe('string');
      expect(claim.statement.length).toBeGreaterThan(0);
      expect(typeof claim.topic).toBe('string');
      expect(Array.isArray(claim.citationIds)).toBe(true);
      expect(typeof claim.certainty).toBe('string');
      expect(typeof claim.lastReviewed).toBe('string');
      expect(claim.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('getClaim', () => {
  it('returns the correct claim object by valid ID', () => {
    const firstClaim = claims[0];
    const retrieved = getClaim(firstClaim.id);
    expect(retrieved).toBe(firstClaim);
  });

  it('retrieves known claims by specific IDs', () => {
    const claim = getClaim('cl-tnk-noninferior-alteplase');
    expect(claim).not.toBeNull();
    expect(claim.id).toBe('cl-tnk-noninferior-alteplase');
    expect(claim.statement).toContain('Tenecteplase');
  });

  it('returns null for an unknown or invalid ID', () => {
    expect(getClaim('unknown-claim-id')).toBeNull();
    expect(getClaim('')).toBeNull();
    expect(getClaim(null)).toBeNull();
    expect(getClaim(undefined)).toBeNull();
  });
});

describe('getAllClaimIds', () => {
  it('returns a Set containing all claim IDs', () => {
    const idsSet = getAllClaimIds();
    expect(idsSet).toBeInstanceOf(Set);
    expect(idsSet.size).toBe(claims.length);

    for (const claim of claims) {
      expect(idsSet.has(claim.id)).toBe(true);
    }
  });
});
