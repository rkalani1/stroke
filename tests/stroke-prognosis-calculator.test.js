import { describe, it, expect } from 'vitest';
import {
  calculateAstralScore,
  getAstralRisk,
  calculatePlanScore,
  getPlanRisk,
  calculateIchScore,
  getIchRisk
} from '../src/education.jsx';

describe('Stroke Prognosis Bedside Calculator Helpers', () => {
  describe('ASTRAL Score & Risk Mapping', () => {
    it('calculates baseline ASTRAL score and maps risk correctly', () => {
      const inputs = {
        age: 65,
        nihss: 10,
        timeDelay: false,
        visualDefect: false,
        glucose: 6.0,
        glucoseUnit: 'mmol',
        locImpaired: false
      };
      const score = calculateAstralScore(inputs);
      // age (13) + nihss (10) = 23
      expect(score).toBe(23);
      expect(getAstralRisk(score)).toBe('~15%');
    });

    it('calculates high-risk ASTRAL score with mg/dL glucose conversion', () => {
      const inputs = {
        age: 80, // 16 pts
        nihss: 20, // 20 pts
        timeDelay: true, // 2 pts
        visualDefect: true, // 2 pts
        glucose: 144, // 144 mg/dL = 8.0 mmol/L -> abnormal -> 1 pt
        glucoseUnit: 'mgdl',
        locImpaired: true // 3 pts
      };
      const score = calculateAstralScore(inputs);
      expect(score).toBe(44);
      expect(getAstralRisk(score)).toBe('> 90%');
    });

    it('calculates low-risk ASTRAL score', () => {
      const inputs = {
        age: 40, // 8 pts
        nihss: 2, // 2 pts
        timeDelay: false,
        visualDefect: false,
        glucose: 5.0, // normal
        glucoseUnit: 'mmol',
        locImpaired: false
      };
      const score = calculateAstralScore(inputs);
      expect(score).toBe(10);
      expect(getAstralRisk(score)).toBe('< 5%');
    });
  });

  describe('PLAN Score & Risk Mapping', () => {
    it('calculates low-risk PLAN score and risk', () => {
      const inputs = {
        dependence: false,
        cancer: false,
        chf: false,
        afib: false,
        locReduced: false,
        age: 45, // 4 pts
        legWeakness: false,
        armWeakness: false,
        aphasiaNeglect: false
      };
      const score = calculatePlanScore(inputs);
      expect(score).toBe(4);
      const risk = getPlanRisk(score);
      expect(risk.mortality).toBe('0.7%');
      expect(risk.depMortality).toBe('12%');
    });

    it('calculates mid-range PLAN score and risk', () => {
      const inputs = {
        dependence: false,
        cancer: false,
        chf: true, // 1.0 pt
        afib: true, // 1.0 pt
        locReduced: false,
        age: 72, // 7 pts
        legWeakness: true, // 2.0 pts
        armWeakness: true, // 2.0 pts
        aphasiaNeglect: true // 1.0 pt
      };
      const score = calculatePlanScore(inputs);
      // 1 (chf) + 1 (afib) + 7 (age) + 2 (leg) + 2 (arm) + 1 (aphasia) = 14 pts
      expect(score).toBe(14);
      const risk = getPlanRisk(score);
      // score 14 is in 13-16 range:
      // m = 15 + (14-13)*(35-15)/3 = 15 + 6.67 = 21.67
      expect(risk.mortality).toBe('~21.7%');
      expect(risk.depMortality).toBe('~68%');
    });

    it('calculates maximum PLAN score risk', () => {
      const inputs = {
        dependence: true, // 1.5
        cancer: true, // 1.5
        chf: true, // 1.0
        afib: true, // 1.0
        locReduced: true, // 5.0
        age: 95, // 9.0
        legWeakness: true, // 2.0
        armWeakness: true, // 2.0
        aphasiaNeglect: true // 1.0
      };
      const score = calculatePlanScore(inputs);
      expect(score).toBe(24);
      const risk = getPlanRisk(score);
      expect(risk.mortality).toBe('> 65%');
      expect(risk.depMortality).toBe('> 95%');
    });
  });

  describe('ICH Score & Risk Mapping', () => {
    it('calculates low-risk ICH score (score 0)', () => {
      const inputs = {
        gcsCategory: 0, // 13-15
        age80: false,
        volume30: false,
        ivh: false,
        infratentorial: false
      };
      const score = calculateIchScore(inputs);
      expect(score).toBe(0);
      expect(getIchRisk(score)).toBe('0%');
    });

    it('calculates mid-risk ICH score (score 3)', () => {
      const inputs = {
        gcsCategory: 1, // 5-12 (1 pt)
        age80: true, // 1 pt
        volume30: true, // 1 pt
        ivh: false,
        infratentorial: false
      };
      const score = calculateIchScore(inputs);
      expect(score).toBe(3);
      expect(getIchRisk(score)).toBe('72%');
    });

    it('calculates high-risk ICH score (score 5)', () => {
      const inputs = {
        gcsCategory: 2, // 3-4 (2 pts)
        age80: true, // 1 pt
        volume30: true, // 1 pt
        ivh: true, // 1 pt
        infratentorial: true // 1 pt
      };
      const score = calculateIchScore(inputs);
      expect(score).toBe(6);
      expect(getIchRisk(score)).toBe('100%');
    });
  });
});
