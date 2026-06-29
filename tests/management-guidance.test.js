import { describe, it, expect } from 'vitest';
import {
  AIS_COMMAND_CENTER_LAST_REVIEWED,
  AIS_SOURCE_LINKS,
  AIS_COMMAND_CENTER_CARDS
} from '../src/management-guidance.js';

describe('management-guidance', () => {
  describe('AIS_COMMAND_CENTER_LAST_REVIEWED', () => {
    it('should be a valid date string', () => {
      expect(typeof AIS_COMMAND_CENTER_LAST_REVIEWED).toBe('string');
      // Matches YYYY-MM-DD
      expect(AIS_COMMAND_CENTER_LAST_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('AIS_SOURCE_LINKS', () => {
    it('should be an array of objects with label and href', () => {
      expect(Array.isArray(AIS_SOURCE_LINKS)).toBe(true);
      expect(AIS_SOURCE_LINKS.length).toBeGreaterThan(0);

      for (const link of AIS_SOURCE_LINKS) {
        expect(typeof link).toBe('object');
        expect(link).not.toBeNull();
        expect(typeof link.label).toBe('string');
        expect(typeof link.href).toBe('string');
        expect(link.href.startsWith('http')).toBe(true);
      }
    });
  });

  describe('AIS_COMMAND_CENTER_CARDS', () => {
    it('should be an array of card objects', () => {
      expect(Array.isArray(AIS_COMMAND_CENTER_CARDS)).toBe(true);
      expect(AIS_COMMAND_CENTER_CARDS.length).toBeGreaterThan(0);
    });

    it('should have required properties for each card', () => {
      for (const card of AIS_COMMAND_CENTER_CARDS) {
        expect(typeof card.id).toBe('string');
        expect(typeof card.title).toBe('string');
        expect(typeof card.shortLabel).toBe('string');
        expect(typeof card.urgency).toBe('string');
        expect(typeof card.classOfRecommendation).toBe('string');
        expect(typeof card.levelOfEvidence).toBe('string');
        expect(typeof card.lastReviewed).toBe('string');
        expect(typeof card.summary).toBe('string');

        expect(Array.isArray(card.actions)).toBe(true);
        expect(Array.isArray(card.pathway)).toBe(true);
        expect(Array.isArray(card.calculators)).toBe(true);
        expect(Array.isArray(card.pitfalls)).toBe(true);
      }
    });

    it('should have valid pathway items', () => {
      for (const card of AIS_COMMAND_CENTER_CARDS) {
        for (const pathway of card.pathway) {
          expect(typeof pathway.label).toBe('string');
          expect(typeof pathway.decision).toBe('string');
          expect(typeof pathway.cor).toBe('string');
          expect(typeof pathway.loe).toBe('string');
        }
      }
    });

    it('should have valid calculator items', () => {
      for (const card of AIS_COMMAND_CENTER_CARDS) {
        for (const calc of card.calculators) {
          expect(typeof calc.label).toBe('string');
          expect(typeof calc.tab).toBe('string');
          expect(typeof calc).toBe('object');
        }
      }
    });
  });
});
