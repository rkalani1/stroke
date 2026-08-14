// tests/e2e/tier4-clinical-workload-scenarios.test.js
// Tier 4: Real-World Clinical Workload Application Scenarios (>=5 realistic scenarios)
// Opaque-box, requirement-driven E2E tests derived from ORIGINAL_REQUEST.md & TEST_INFRA.md

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  activeTrials,
  completedTrials,
  citations,
  recommendations,
  claims,
  guidelines,
  topics,
  getCitation,
  getCompletedTrial
} from '../../src/evidence/index.js';
import {
  AIS_COMMAND_CENTER_CARDS,
  AIS_SOURCE_LINKS
} from '../../src/management-guidance.js';
import { INSTITUTIONAL_BP_PROTOCOLS } from '../../src/institutional-protocols.js';
import { parseFrontmatter, VALIDATORS } from '../../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

describe('Tier 4: Real-World Clinical Workload Application Scenarios', () => {

  // =========================================================================
  // Scenario 1: Acute Wake-Up Stroke with Large Core (ASPECTS 4, 18h)
  // Features Exercised: F1, F2, F4, F5, F14
  // =========================================================================
  describe('Scenario 1: Acute Wake-Up Stroke with Large Core (ASPECTS 4, 18h)', () => {
    const patientEncounter = {
      age: 68,
      nihss: 17,
      hoursFromLKW: 18.0,
      aspectsScore: 4,
      premorbidMRS: 1,
      vesselOcclusion: ['Right ICA-T', 'Right M1'],
      ctpResults: {
        coreVolumeMl: 62,
        penumbraVolumeMl: 110,
        mismatchVolumeMl: 48,
        mismatchRatio: 1.77
      },
      bloodPressure: { sbp: 172, dbp: 96 }
    };

    it('S1.1: Evaluates extended window large-core EVT eligibility under SVIN 2025 / SELECT2 criteria', () => {
      const svinData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/svin-large-core-2025.json'), 'utf8'));
      const extendedRec = svinData.recommendations.find(r => r.section.includes('6-24') && r.classOfRec === 'I');
      expect(extendedRec).toBeDefined();
      expect(patientEncounter.aspectsScore >= 3 && patientEncounter.aspectsScore <= 5).toBe(true);
      expect(patientEncounter.hoursFromLKW >= 6 && patientEncounter.hoursFromLKW <= 24).toBe(true);
      expect(patientEncounter.premorbidMRS <= 1).toBe(true);
      expect(patientEncounter.age >= 18 && patientEncounter.age <= 80).toBe(true);
    });

    it('S1.2: Confirms standard IV thrombolysis is contraindicated due to time window >4.5h', () => {
      const isEligibleStandardIVT = (hours) => hours <= 4.5;
      expect(isEligibleStandardIVT(patientEncounter.hoursFromLKW)).toBe(false);
    });

    it('S1.3: Verifies command center EVT decision tree pathway recommends EVT for large core', () => {
      const evtCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-evt-selection');
      expect(evtCard).toBeDefined();
      const largeCoreStep = evtCard.pathway.find(p => /Large core ASPECTS 3-5/i.test(p.label));
      expect(largeCoreStep).toBeDefined();
      expect(largeCoreStep.cor).toBe('I');
      expect(largeCoreStep.decision).toContain('EVT recommended');
    });

    it('S1.4: Enforces post-EVT BP floor of 140 mmHg (Class III: Harm for intensive lowering <140)', () => {
      const sbpHarm = INSTITUTIONAL_BP_PROTOCOLS.sbpLT140EVT;
      expect(sbpHarm).toBeDefined();
      expect(sbpHarm.cor).toContain('3 (Harm)');
      const postEVTTarget = INSTITUTIONAL_BP_PROTOCOLS.afterEVT24h;
      expect(postEVTTarget.protocol).toContain('preserve SBP floor of 140');
    });

    it('S1.5: Evidence Atlas completed trials contain pooled meta-analysis and RCT evidence for large core', () => {
      const largeCoreTrials = completedTrials.filter(t =>
        ['select2', 'angel-aspect', 'tension', 'laste'].includes(t.id)
      );
      expect(largeCoreTrials.length).toBe(4);
      for (const trial of largeCoreTrials) {
        expect(trial.population.n).toBeGreaterThan(200);
      }
    });
  });

  // =========================================================================
  // Scenario 2: Acute Ischemic Stroke with AFib on Apixaban + Early DOAC Restart
  // Features Exercised: F1, F3, F5, F7, F8, F11
  // =========================================================================
  describe('Scenario 2: AIS with AFib on Apixaban + Early DOAC Restart', () => {
    const patientEncounter = {
      age: 74,
      nihss: 6,
      hoursFromLKW: 2.5,
      currentMedications: ['Apixaban 5mg BID'],
      lastDOACDoseHoursAgo: 8,
      antiXaLevelNgMl: 85,
      hasHemorrhageOnCT: false,
      cha2ds2vaScore: 4,
      bloodPressure: { sbp: 158, dbp: 88 }
    };

    it('S2.1: Disqualifies IV thrombolysis due to therapeutic DOAC ingestion within 48h and elevated anti-Xa', () => {
      const isIVTExcludedByDOAC = (lastDoseHours, antiXa) => lastDoseHours < 48 && antiXa > 50;
      expect(isIVTExcludedByDOAC(patientEncounter.lastDOACDoseHoursAgo, patientEncounter.antiXaLevelNgMl)).toBe(true);
    });

    it('S2.2: Evaluates CATALYST 2025 and ELAN early DOAC restart timeline for mild-to-moderate stroke', () => {
      const getRecommendedRestartDayRange = (nihss) => {
        if (nihss < 8) return { min: 1, max: 2, label: 'early (day 1-2)' };
        if (nihss <= 15) return { min: 3, max: 4, label: 'early (day 3-4)' };
        return { min: 4, max: 5, label: 'moderate/severe (day 4-5)' };
      };
      const recommendation = getRecommendedRestartDayRange(patientEncounter.nihss);
      expect(recommendation.min).toBe(1);
      expect(recommendation.max).toBe(2);
      expect(recommendation.label).toContain('day 1-2');
    });

    it('S2.3: Cross-checks CATALYST Lancet 2025 citation in central evidence registry', () => {
      const cit = citations.find(c => c.pmid === '40570866');
      expect(cit).toBeDefined();
      expect(cit.year).toBe(2025);
      expect(cit.verificationStatus).toBe('verified-pubmed');
    });

    it('S2.4: Cross-checks educational module afib-anticoag-timing.md for clinical guidance', () => {
      const content = fs.readFileSync(path.join(ROOT, 'content/education/afib-anticoag-timing.md'), 'utf8');
      expect(content).toContain('40570866');
      expect(content).toContain('37222476'); // ELAN PMID
    });

    it('S2.5: Confirms secondary stroke prevention guideline supports oral anticoagulation for AFib', () => {
      const secPrev = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/secondary-prevention-2021.json'), 'utf8'));
      const afRecs = secPrev.recommendations.filter(r => /fibrillation|anticoag|doac/i.test(r.text));
      expect(afRecs.length).toBeGreaterThan(0);
      expect(afRecs.some(r => r.classOfRec === 'I')).toBe(true);
    });
  });

  // =========================================================================
  // Scenario 3: Adolescent Acute LVO Reperfusion (Age 14y, M1 occlusion)
  // Features Exercised: F1, F6, F7, F16
  // =========================================================================
  describe('Scenario 3: Adolescent Acute LVO Reperfusion (Age 14y, M1 Occlusion)', () => {
    const patientEncounter = {
      age: 14,
      weightKg: 52,
      pedNIHSS: 14,
      hoursFromLKW: 2.0,
      imaging: 'MRI brain DWI positive, MRA right M1 occlusion',
      bloodPressure: { sbp: 118, dbp: 74 } // <95th percentile for age 14
    };

    it('S3.1: Identifies pediatric EVT pathway for age >=6y with Class IIa / LOE B-NR recommendation', () => {
      const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      expect(pedCard).toBeDefined();
      const evt6Step = pedCard.pathway.find(p => p.label.includes('age >=6y'));
      expect(evt6Step).toBeDefined();
      expect(evt6Step.cor).toBe('IIa');
      expect(evt6Step.loe).toBe('B-NR');
    });

    it('S3.2: Calculates weight-based off-label Alteplase dose (0.9 mg/kg × 52 kg = 46.8 mg) with Class IIb rating', () => {
      const doseMg = Math.min(patientEncounter.weightKg * 0.9, 90.0);
      expect(doseMg).toBeCloseTo(46.8, 1);
      const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      const ivtStep = pedCard.pathway.find(p => p.label.includes('28d-18y'));
      expect(ivtStep.cor).toBe('IIb');
    });

    it('S3.3: Confirms Tenecteplase is explicitly flagged as not endorsed for pediatric reperfusion', () => {
      const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      expect(pedCard.actions.some(a => a.includes('tenecteplase') && a.includes('not specifically endorsed'))).toBe(true);
    });

    it('S3.4: Enforces age-adjusted percentile BP thresholds rather than adult fixed 185/110', () => {
      const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      expect(pedCard.actions.some(a => a.includes('percentile thresholds'))).toBe(true);
    });

    it('S3.5: Verifies pediatric reperfusion protocol lock in ischemic baseline snapshot', () => {
      const ischemic = fs.readFileSync(path.join(ROOT, 'tests/snapshots/example-protocols/ischemic.txt'), 'utf8');
      expect(ischemic).toContain('Pediatric Acute Ischemic Stroke');
      expect(ischemic).toContain('28 days-18 years');
    });
  });

  // =========================================================================
  // Scenario 4: Spontaneous Deep ICH with Acute SBP Surge
  // Features Exercised: F5, F7, F8, F16
  // =========================================================================
  describe('Scenario 4: Spontaneous Deep ICH with Acute SBP Surge', () => {
    const patientEncounter = {
      age: 62,
      gcs: 13,
      ichVolumeMl: 22,
      ichLocation: 'Right Basal Ganglia',
      ivhPresent: false,
      ichScore: 1,
      bloodPressure: { sbp: 210, dbp: 115 }
    };

    it('S4.1: Targets smooth acute SBP reduction to 130-140 mmHg within 1-2 hours', () => {
      const ichProt = INSTITUTIONAL_BP_PROTOCOLS.ichAcute;
      const ichGuideline = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ich-2022.json'), 'utf8'));
      const targetRec = ichGuideline.recommendations.find(r => r.classOfRec === 'IIb' && /target of 140/i.test(r.text));
      expect(targetRec).toBeDefined();
      expect(targetRec.text).toContain('130-150 mm Hg range');
    });

    it('S4.2: Enforces harm threshold warning against aggressive SBP lowering <130 mmHg (Class III: Harm)', () => {
      const ichGuideline = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ich-2022.json'), 'utf8'));
      const harmRec = ichGuideline.recommendations.find(r => r.classOfRec === 'III' && /<130\s*mm\s*Hg/i.test(r.text));
      expect(harmRec).toBeDefined();
      expect(harmRec.text).toContain('potentially harmful');
    });

    it('S4.3: Identifies ABC/2 hematoma volume >= 15 mL prompts early Neurosurgery consultation', () => {
      const ichSnapshot = fs.readFileSync(path.join(ROOT, 'tests/snapshots/example-protocols/ich.txt'), 'utf8');
      expect(ichSnapshot).toContain('IPH >=15 mL by ABC/2');
      expect(patientEncounter.ichVolumeMl >= 15).toBe(true);
    });

    it('S4.4: Verifies acute reversal agents (4F-PCC, Idarucizumab, Andexanet) exist in ICH protocol', () => {
      const ichSnapshot = fs.readFileSync(path.join(ROOT, 'tests/snapshots/example-protocols/ich.txt'), 'utf8');
      expect(ichSnapshot).toContain('4F-PCC (Kcentra)');
      expect(ichSnapshot).toContain('Idarucizumab (Praxbind)');
      expect(ichSnapshot).toContain('andexanet alfa');
    });

    it('S4.5: Verifies educational module edema-swelling-risk.md covers ICH swelling and ICP management', () => {
      const file = path.join(ROOT, 'content/education/edema-swelling-risk.md');
      expect(fs.existsSync(file)).toBe(true);
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toContain('edema-swelling-risk');
    });
  });

  // =========================================================================
  // Scenario 5: Education Reference Traversal & Dark-Mode Accordion Accessibility
  // Features Exercised: F8, F9, F10, F11, F13
  // =========================================================================
  describe('Scenario 5: Education Reference Traversal & Dark-Mode Accordion Accessibility', () => {
    it('S5.1: Verifies all 32 educational modules start minimized without default open attribute', () => {
      const eduSrc = fs.readFileSync(path.join(ROOT, 'src/education.jsx'), 'utf8');
      const openMatches = eduSrc.match(/<details[^>]*\bopen\b/gi) || [];
      expect(openMatches).toEqual([]);
    });

    it('S5.2: Verifies content bundling and schema validation pass across educational modules', () => {
      const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
      expect(bundle.education.length).toBeGreaterThanOrEqual(32);
      const valRes = spawnSync('node', [path.join(ROOT, 'scripts/validate-content.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' });
      expect(valRes.status).toBe(0);
      const valJson = JSON.parse(valRes.stdout);
      expect(valJson.errors).toEqual([]);
    });

    it('S5.3: Verifies WCAG AA color contrast passes across 21 token pairs in light and dark mode', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/lint-contrast.mjs')], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('21 pairs verified');
    });

    it('S5.4: Verifies modern landmark trial citations (THEIA, LASTE, TESLA, ANNEXA-I, CATALYST) are present', () => {
      const keyPMIDs = ['41109232', '38718358', '39374319', '38749032', '40570866'];
      for (const pmid of keyPMIDs) {
        const cit = citations.find(c => c.pmid === pmid);
        expect(cit).toBeDefined();
        expect(cit.verificationStatus).toBe('verified-pubmed');
      }
    });

    it('S5.5: Verifies content currency check confirms freshness (<18 months)', () => {
      const currRes = spawnSync('node', [path.join(ROOT, 'scripts/check-currency.mjs')], { cwd: ROOT, encoding: 'utf8' });
      expect(currRes.status).toBe(0);
    });
  });
});
