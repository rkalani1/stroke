import { describe, it, expect } from 'vitest';
import {
  LANDMARK_TRIALS,
  STROKE_SYNDROMES,
  NEUROANATOMY,
  TEACHING_PEARLS,
  KEYBOARD_SHORTCUTS
} from '../src/teaching.js';

describe('teaching.js constants', () => {
  describe('LANDMARK_TRIALS', () => {
    it('is exported and is an object', () => {
      expect(LANDMARK_TRIALS).toBeDefined();
      expect(typeof LANDMARK_TRIALS).toBe('object');
      expect(LANDMARK_TRIALS).not.toBeNull();
    });

    it('contains expected categories as keys', () => {
      const keys = Object.keys(LANDMARK_TRIALS);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('STROKE_SYNDROMES', () => {
    it('is exported and is an object with specific categories', () => {
      expect(STROKE_SYNDROMES).toBeDefined();
      expect(typeof STROKE_SYNDROMES).toBe('object');
      expect(STROKE_SYNDROMES.anteriorCirculation).toBeInstanceOf(Array);
      expect(STROKE_SYNDROMES.posteriorCirculation).toBeInstanceOf(Array);
      expect(STROKE_SYNDROMES.lacunarSyndromes).toBeInstanceOf(Array);
    });

    it('contains valid anterior circulation syndromes', () => {
      const synd = STROKE_SYNDROMES.anteriorCirculation[0];
      expect(synd).toHaveProperty('name');
      expect(synd).toHaveProperty('deficits');
      expect(typeof synd.name).toBe('string');
      expect(typeof synd.deficits).toBe('string');
    });

    it('contains valid posterior circulation syndromes', () => {
      const synd = STROKE_SYNDROMES.posteriorCirculation[0];
      expect(synd).toHaveProperty('name');
      expect(synd).toHaveProperty('deficits');
      expect(typeof synd.name).toBe('string');
      expect(typeof synd.deficits).toBe('string');
    });

    it('contains valid lacunar syndromes', () => {
      const synd = STROKE_SYNDROMES.lacunarSyndromes[0];
      expect(synd).toHaveProperty('name');
      expect(synd).toHaveProperty('deficits');
      expect(typeof synd.name).toBe('string');
      expect(typeof synd.deficits).toBe('string');
    });
  });

  describe('NEUROANATOMY', () => {
    it('is exported and is an object with cranialNerves and vascularTerritories', () => {
      expect(NEUROANATOMY).toBeDefined();
      expect(typeof NEUROANATOMY).toBe('object');
      expect(NEUROANATOMY.cranialNerves).toBeInstanceOf(Array);
      expect(NEUROANATOMY.vascularTerritories).toBeInstanceOf(Array);
    });

    it('contains valid cranial nerve definitions', () => {
      const cn = NEUROANATOMY.cranialNerves[0];
      expect(cn).toHaveProperty('cn');
      expect(cn).toHaveProperty('name');
      expect(cn).toHaveProperty('testing');
      expect(cn).toHaveProperty('lesionEffect');
    });

    it('contains valid vascular territory definitions', () => {
      const territory = NEUROANATOMY.vascularTerritories[0];
      expect(territory).toHaveProperty('artery');
      expect(territory).toHaveProperty('supply');
    });
  });

  describe('TEACHING_PEARLS', () => {
    it('is exported and is an array of pearls', () => {
      expect(TEACHING_PEARLS).toBeDefined();
      expect(TEACHING_PEARLS).toBeInstanceOf(Array);
      expect(TEACHING_PEARLS.length).toBeGreaterThan(0);
    });

    it('pearls contain category, question (q), and answer (a)', () => {
      TEACHING_PEARLS.forEach(pearl => {
        expect(pearl).toHaveProperty('category');
        expect(pearl).toHaveProperty('q');
        expect(pearl).toHaveProperty('a');
        expect(typeof pearl.category).toBe('string');
        expect(typeof pearl.q).toBe('string');
        expect(typeof pearl.a).toBe('string');
      });
    });
  });

  describe('KEYBOARD_SHORTCUTS', () => {
    it('is exported and is an array of shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS).toBeDefined();
      expect(KEYBOARD_SHORTCUTS).toBeInstanceOf(Array);
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    });

    it('shortcuts contain keys and action', () => {
      KEYBOARD_SHORTCUTS.forEach(shortcut => {
        expect(shortcut).toHaveProperty('keys');
        expect(shortcut).toHaveProperty('action');
        expect(typeof shortcut.keys).toBe('string');
        expect(typeof shortcut.action).toBe('string');
      });
    });
  });
});
