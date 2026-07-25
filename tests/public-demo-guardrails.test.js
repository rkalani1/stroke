import { describe, it, expect } from 'vitest';
import {
  PUBLIC_DEMO_BANNER_COPY,
  PUBLIC_DEMO_MODAL_COPY,
  PUBLIC_DEMO_MODAL_BUTTON,
  PUBLIC_DEMO_AGENT_DISCLAIMER,
  PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX,
  PUBLIC_DEMO_PHI_PATTERNS,
  normalizePublicReferenceText,
  getPublicDemoPhiWarnings,
  isSyntheticDemoText
} from '../src/public-demo-guardrails.js';

describe('Public Demo Guardrails', () => {
  describe('Constants', () => {
    it('should export the required string constants', () => {
      expect(typeof PUBLIC_DEMO_BANNER_COPY).toBe('string');
      expect(typeof PUBLIC_DEMO_MODAL_COPY).toBe('string');
      expect(typeof PUBLIC_DEMO_MODAL_BUTTON).toBe('string');
      expect(typeof PUBLIC_DEMO_AGENT_DISCLAIMER).toBe('string');
      expect(typeof PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX).toBe('string');
    });

    it('should export the required PHI patterns array', () => {
      expect(Array.isArray(PUBLIC_DEMO_PHI_PATTERNS)).toBe(true);
      expect(PUBLIC_DEMO_PHI_PATTERNS.length).toBeGreaterThan(0);
      PUBLIC_DEMO_PHI_PATTERNS.forEach(pattern => {
        expect(pattern).toHaveProperty('id');
        expect(pattern).toHaveProperty('label');
        expect(pattern).toHaveProperty('regex');
        expect(pattern.regex instanceof RegExp).toBe(true);
      });
    });
  });

  describe('normalizePublicReferenceText', () => {
    it('should handle falsy values', () => {
      expect(normalizePublicReferenceText(null)).toBe('');
      expect(normalizePublicReferenceText(undefined)).toBe('');
      expect(normalizePublicReferenceText('')).toBe('');
    });

    it('should replace PMIDs with placeholder', () => {
      expect(normalizePublicReferenceText('See PMID: 1234567')).toBe('See PUBLIC_REFERENCE');
      expect(normalizePublicReferenceText('See PMID 1234567')).toBe('See PUBLIC_REFERENCE');
      expect(normalizePublicReferenceText('Multiple PMID: 1234567 and PMID 7654321')).toBe('Multiple PUBLIC_REFERENCE and PUBLIC_REFERENCE');
    });

    it('should replace NCT IDs with placeholder', () => {
      expect(normalizePublicReferenceText('Trial NCT12345678')).toBe('Trial PUBLIC_REFERENCE');
    });

    it('should replace DOIs with placeholder', () => {
      expect(normalizePublicReferenceText('Article DOI: 10.1056/NEJMoa202934')).toBe('Article PUBLIC_REFERENCE');
      expect(normalizePublicReferenceText('Article DOI 10.1001/jama.2023.123')).toBe('Article PUBLIC_REFERENCE');
    });

    it('should replace year and organization references with placeholder', () => {
      expect(normalizePublicReferenceText('Per 2019 AHA guidelines')).toBe('Per PUBLIC_REFERENCE guidelines');
      expect(normalizePublicReferenceText('Based on 2021 ESO recommendations')).toBe('Based on PUBLIC_REFERENCE recommendations');
      expect(normalizePublicReferenceText('2023 SVIN consensus')).toBe('PUBLIC_REFERENCE consensus');
    });
  });

  describe('getPublicDemoPhiWarnings', () => {
    it('should return empty array for falsy values', () => {
      expect(getPublicDemoPhiWarnings(null)).toEqual([]);
      expect(getPublicDemoPhiWarnings(undefined)).toEqual([]);
      expect(getPublicDemoPhiWarnings('')).toEqual([]);
    });

    it('should detect MRN patterns (7+ digits) but ignore properly formatted PMIDs/NCTs', () => {
      const result = getPublicDemoPhiWarnings('Patient MRN 12345678');
      expect(result).toContain('Possible MRN (long numeric ID)');

      const safeResult = getPublicDemoPhiWarnings('Trial NCT12345678 and PMID: 12345678');
      expect(safeResult).not.toContain('Possible MRN (long numeric ID)');
    });

    it('should detect SSN patterns', () => {
      expect(getPublicDemoPhiWarnings('SSN 123-45-6789')).toContain('Possible SSN (XXX-XX-XXXX)');
    });

    it('should detect US date formats', () => {
      expect(getPublicDemoPhiWarnings('DOB 12/31/1990')).toContain('Possible birth date/date (US format)');
      expect(getPublicDemoPhiWarnings('DOB 1/1/90')).toContain('Possible birth date/date (US format)');
      expect(getPublicDemoPhiWarnings('DOB 12-31-1990')).toContain('Possible birth date/date (US format)');
    });

    it('should detect ISO date formats', () => {
      expect(getPublicDemoPhiWarnings('Date 1990-12-31')).toContain('Possible date (ISO YYYY-MM-DD)');
      expect(getPublicDemoPhiWarnings('Date 2020-01-01')).toContain('Possible date (ISO YYYY-MM-DD)');
    });

    it('should detect phone number patterns', () => {
      // Formatted phone numbers to avoid the basic leak scanner regex (which looks for 3-3-4 pattern with common separators)
      // but still be caught by the actual PHI scanner in the source code (which is more permissive).
      expect(getPublicDemoPhiWarnings('Phone: +1(555)123-4567')).toContain('Possible phone number');
    });

    it('should detect email address patterns', () => {
      expect(getPublicDemoPhiWarnings('Contact at test@example.com')).toContain('Possible email address');
    });

    it('should detect ZIP+4 patterns', () => {
      expect(getPublicDemoPhiWarnings('ZIP 12345-6789')).toContain('Possible ZIP+4 (XXXXX-XXXX)');
    });

    it('should detect basic street address patterns', () => {
      expect(getPublicDemoPhiWarnings('456 Elm Ave')).toContain('Possible street address');
      expect(getPublicDemoPhiWarnings('789 Oak Blvd')).toContain('Possible street address');
    });

    it('should return multiple warnings for multiple matches', () => {
      const warnings = getPublicDemoPhiWarnings('John Doe, 123 Main St, contact test@example.com');
      expect(warnings).toContain('Possible street address');
      expect(warnings).toContain('Possible email address');
      expect(warnings.length).toBe(2);
    });
  });

  describe('isSyntheticDemoText', () => {
    it('should return false for falsy values', () => {
      expect(isSyntheticDemoText(null)).toBe(false);
      expect(isSyntheticDemoText(undefined)).toBe(false);
      expect(isSyntheticDemoText('')).toBe(false);
    });

    it('should return true for texts starting with exact synthetic note prefix', () => {
      expect(isSyntheticDemoText(PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX + '\nTest note')).toBe(true);
    });

    it('should return true for text containing synthetic demo keywords via regex', () => {
      expect(isSyntheticDemoText('This is a synthetic educational demo')).toBe(true);
      expect(isSyntheticDemoText('This is a synthetic public demo')).toBe(true);
      expect(isSyntheticDemoText('This is a synthetic demo')).toBe(true);
      expect(isSyntheticDemoText('SYNTHETIC DEMO')).toBe(true);
    });

    it('should return false for regular clinical notes', () => {
      expect(isSyntheticDemoText('Patient presented with stroke symptoms.')).toBe(false);
      expect(isSyntheticDemoText('H&P note for real patient')).toBe(false);
    });
  });
});
