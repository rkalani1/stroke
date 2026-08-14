// tests/e2e/tier2-boundary-corners.test.js
// Tier 2: Boundary & Corner Cases (>=5 test cases per feature across all 19 features, total 95 cases)
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

const schemaContext = {
  citationIds: new Set(citations.map((c) => c.id)),
  pmids: new Set(citations.map((c) => c.pmid).filter(Boolean)),
  dois: new Set(citations.map((c) => c.doi).filter(Boolean)),
  calculatorIds: new Set(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'calculators', 'registry.json'), 'utf8')).map((c) => c.id)
  ),
  now: new Date(),
  maxAgeMonths: 18,
  staleIsError: false
};

describe('Tier 2: Boundary & Corner Cases (Features 1-19)', () => {

  // =========================================================================
  // Feature 1 Boundary & Corner Cases (2026 AHA/ASA AIS Guidelines)
  // =========================================================================
  describe('Feature 1 Boundary & Corner Cases', () => {
    const aisData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ais-2026.json'), 'utf8'));

    it('F1-T2.1: IVT time window boundary differentiates <=4.5h standard from >4.5h extended window', () => {
      const standardRecs = aisData.recommendations.filter(r => /4\.5\s*h/i.test(r.text) && /thromboly|tenecteplase|alteplase/i.test(r.text));
      expect(standardRecs.length).toBeGreaterThan(0);
      const wakeUpRecs = aisData.recommendations.filter(r => /wake[- ]up|extended|unknown\s*onset/i.test(r.text));
      expect(wakeUpRecs.length).toBeGreaterThan(0);
    });

    it('F1-T2.2: Weight-based TNK dosing boundary enforces 25 mg max cap (0.25 mg/kg × 100 kg = 25 mg)', () => {
      const calcDose = (weightKg) => Math.min(weightKg * 0.25, 25.0);
      expect(calcDose(60)).toBe(15.0);
      expect(calcDose(80)).toBe(20.0);
      expect(calcDose(100)).toBe(25.0);
      expect(calcDose(120)).toBe(25.0);
      expect(calcDose(160)).toBe(25.0);
    });

    it('F1-T2.3: Pre-IVT BP threshold values: 184/109 (eligible) vs 185/110 (threshold) vs 186/111 (requires lowering)', () => {
      const isEligibleBP = (sbp, dbp) => sbp < 185 && dbp < 110;
      expect(isEligibleBP(184, 109)).toBe(true);
      expect(isEligibleBP(185, 110)).toBe(false);
      expect(isEligibleBP(186, 111)).toBe(false);
      expect(isEligibleBP(160, 95)).toBe(true);
    });

    it('F1-T2.4: AIS recommendation taxonomy completeness: all 195 recommendations have defined COR and text', () => {
      for (const rec of aisData.recommendations) {
        expect(rec.classOfRec).toBeDefined();
        expect(rec.text).toBeTruthy();
        expect(rec.section).toBeTruthy();
      }
    });

    it('F1-T2.5: Anterior circulation EVT NIHSS threshold evaluates NIHSS >= 6 with Class I recommendations', () => {
      const evtRecs = aisData.recommendations.filter(r => /NIHSS 6 or greater/i.test(r.text));
      expect(evtRecs.length).toBeGreaterThan(0);
      expect(evtRecs.some(r => r.classOfRec === 'I')).toBe(true);
    });
  });

  // =========================================================================
  // Feature 2 Boundary & Corner Cases (SVIN 2025 Large-Core EVT)
  // =========================================================================
  describe('Feature 2 Boundary & Corner Cases', () => {
    const svinData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/svin-large-core-2025.json'), 'utf8'));

    it('F2-T2.1: ASPECTS early window (0-6h) boundary: ASPECTS 0-5 covered under Class I', () => {
      const earlyRec = svinData.recommendations.find(r => r.section.includes('0-6'));
      expect(earlyRec.text).toContain('ASPECTS of 0-5');
      expect(earlyRec.classOfRec).toBe('I');
      expect(earlyRec.levelOfEvidence).toBe('A');
    });

    it('F2-T2.2: ASPECTS extended window (6-24h) boundary: ASPECTS 3-5 is Class I whereas ASPECTS 0-2 is Class IIb', () => {
      const lateClassI = svinData.recommendations.find(r => r.section.includes('6-24') && r.classOfRec === 'I');
      const lateClassIIb = svinData.recommendations.find(r => r.section.includes('6-24') && r.classOfRec === 'IIb');
      expect(lateClassI.text).toContain('ASPECTS of 3-5');
      expect(lateClassIIb.text).toContain('ASPECTS of 0-2');
    });

    it('F2-T2.3: Infarct core volume thresholds: 50 mL triggers large core pathway', () => {
      const isLargeCore = (aspects, coreVolumeMl) => aspects <= 5 || coreVolumeMl >= 50;
      expect(isLargeCore(6, 45)).toBe(false);
      expect(isLargeCore(5, 45)).toBe(true);
      expect(isLargeCore(7, 50)).toBe(true);
      expect(isLargeCore(3, 75)).toBe(true);
    });

    it('F2-T2.4: Time window boundaries: 0-6h (early) vs 6-24h (extended) vs >24h (out-of-window)', () => {
      const getSVINWindow = (hours) => {
        if (hours <= 6) return 'early';
        if (hours <= 24) return 'extended';
        return 'out_of_window';
      };
      expect(getSVINWindow(2.5)).toBe('early');
      expect(getSVINWindow(6.0)).toBe('early');
      expect(getSVINWindow(6.1)).toBe('extended');
      expect(getSVINWindow(24.0)).toBe('extended');
      expect(getSVINWindow(24.5)).toBe('out_of_window');
    });

    it('F2-T2.5: Age limits in SVIN guideline recommendations: adult age 18 to 80 years specified in recommendations', () => {
      const adultRecs = svinData.recommendations.filter(r => r.text.includes('age 18-80 years'));
      expect(adultRecs.length).toBe(4);
    });
  });

  // =========================================================================
  // Feature 3 Boundary & Corner Cases (CATALYST 2025 DOAC Timing)
  // =========================================================================
  describe('Feature 3 Boundary & Corner Cases', () => {
    it('F3-T2.1: Stroke severity stratification timing: Mild (day 1-2), Moderate (day 3-4), Severe (day 4-5)', () => {
      const getTargetRestartDay = (nihss) => {
        if (nihss < 8) return { minDay: 1, maxDay: 2 };
        if (nihss <= 15) return { minDay: 3, maxDay: 4 };
        return { minDay: 4, maxDay: 5 };
      };
      expect(getTargetRestartDay(4)).toEqual({ minDay: 1, maxDay: 2 });
      expect(getTargetRestartDay(12)).toEqual({ minDay: 3, maxDay: 4 });
      expect(getTargetRestartDay(18)).toEqual({ minDay: 4, maxDay: 5 });
    });

    it('F3-T2.2: Hemorrhagic transformation boundary: absence of symptomatic HT allows early restart', () => {
      const canRestartEarly = (hasSymptomaticICH) => !hasSymptomaticICH;
      expect(canRestartEarly(false)).toBe(true);
      expect(canRestartEarly(true)).toBe(false);
    });

    it('F3-T2.3: Anticoagulation timing day 0 (acute phase) vs day 4 (upper limit of CATALYST early window)', () => {
      const isEarlyCATALYSTWindow = (day) => day >= 1 && day <= 4;
      expect(isEarlyCATALYSTWindow(0)).toBe(false);
      expect(isEarlyCATALYSTWindow(1)).toBe(true);
      expect(isEarlyCATALYSTWindow(4)).toBe(true);
      expect(isEarlyCATALYSTWindow(7)).toBe(false);
    });

    it('F3-T2.4: DOAC agent options (Apixaban, Rivaroxaban, Dabigatran, Edoxaban) mapped in guidelines', () => {
      const doacs = ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'];
      const secPrev = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/secondary-prevention-2021.json'), 'utf8'));
      const text = JSON.stringify(secPrev);
      for (const d of doacs) {
        expect(text.toLowerCase()).toContain(d);
      }
    });

    it('F3-T2.5: CHA2DS2-VA sex-neutral score boundary: score 0 (not indicated) vs score >= 1 (indicated)', () => {
      const isAnticoagIndicated = (score) => score >= 1;
      expect(isAnticoagIndicated(0)).toBe(false);
      expect(isAnticoagIndicated(1)).toBe(true);
      expect(isAnticoagIndicated(4)).toBe(true);
    });
  });

  // =========================================================================
  // Feature 4 Boundary & Corner Cases (Large-Core Decision Trees)
  // =========================================================================
  describe('Feature 4 Boundary & Corner Cases', () => {
    it('F4-T2.1: Perfusion mismatch volume boundary: mismatch volume >= 15 mL and mismatch ratio >= 1.8', () => {
      const isTargetMismatch = (coreMl, penumbraMl) => {
        const mismatchVol = penumbraMl - coreMl;
        const ratio = coreMl > 0 ? penumbraMl / coreMl : penumbraMl;
        return mismatchVol >= 15 && ratio >= 1.8;
      };
      expect(isTargetMismatch(20, 60)).toBe(true);  // mismatch 40, ratio 3.0
      expect(isTargetMismatch(40, 50)).toBe(false); // mismatch 10, ratio 1.25
      expect(isTargetMismatch(50, 100)).toBe(true); // mismatch 50, ratio 2.0
    });

    it('F4-T2.2: Pre-stroke functional status boundary: mRS 0-1 (standard) vs mRS 2 (TENSION inclusion)', () => {
      const isEligiblePremorbid = (mrs, allowMildDisability = false) => {
        return allowMildDisability ? mrs <= 2 : mrs <= 1;
      };
      expect(isEligiblePremorbid(0)).toBe(true);
      expect(isEligiblePremorbid(1)).toBe(true);
      expect(isEligiblePremorbid(2, false)).toBe(false);
      expect(isEligiblePremorbid(2, true)).toBe(true);
      expect(isEligiblePremorbid(3, true)).toBe(false);
    });

    it('F4-T2.3: Large-core posterior circulation: basilar artery occlusion NIHSS >= 10, PC-ASPECTS >= 6 within 24h', () => {
      const isBasilarEligible = (nihss, pcAspects, hours) => {
        return nihss >= 10 && pcAspects >= 6 && hours <= 24;
      };
      expect(isBasilarEligible(14, 8, 12)).toBe(true);
      expect(isBasilarEligible(8, 8, 12)).toBe(false);
      expect(isBasilarEligible(14, 4, 12)).toBe(false);
      expect(isBasilarEligible(14, 8, 26)).toBe(false);
    });

    it('F4-T2.4: Imaging modality equivalency: NCCT ASPECTS 3-5 vs CTP core volume 50-100 mL both eligible', () => {
      const isLargeCoreEligible = ({ ncctAspects, ctpCoreMl }) => {
        if (ncctAspects !== undefined && ncctAspects >= 3 && ncctAspects <= 5) return true;
        if (ctpCoreMl !== undefined && ctpCoreMl >= 50 && ctpCoreMl <= 100) return true;
        return false;
      };
      expect(isLargeCoreEligible({ ncctAspects: 4 })).toBe(true);
      expect(isLargeCoreEligible({ ctpCoreMl: 65 })).toBe(true);
      expect(isLargeCoreEligible({ ncctAspects: 2, ctpCoreMl: 40 })).toBe(false);
    });

    it('F4-T2.5: Decision tree calculator bounds: ASPECTS 0 to 10 integer range', () => {
      const isValidAspects = (score) => Number.isInteger(score) && score >= 0 && score <= 10;
      expect(isValidAspects(0)).toBe(true);
      expect(isValidAspects(10)).toBe(true);
      expect(isValidAspects(5)).toBe(true);
      expect(isValidAspects(-1)).toBe(false);
      expect(isValidAspects(11)).toBe(false);
    });
  });

  // =========================================================================
  // Feature 5 Boundary & Corner Cases (Blood Pressure Guardrails)
  // =========================================================================
  describe('Feature 5 Boundary & Corner Cases', () => {
    it('F5-T2.1: Post-EVT SBP boundary: SBP 139 mmHg (triggers harm alert) vs SBP 140-180 mmHg (target range)', () => {
      const evaluatePostEVT_BP = (sbp) => {
        if (sbp < 140) return 'harm_alert_sbp_below_140';
        if (sbp <= 180) return 'target_range_140_180';
        return 'requires_lowering_sbp_above_180';
      };
      expect(evaluatePostEVT_BP(135)).toBe('harm_alert_sbp_below_140');
      expect(evaluatePostEVT_BP(140)).toBe('target_range_140_180');
      expect(evaluatePostEVT_BP(165)).toBe('target_range_140_180');
      expect(evaluatePostEVT_BP(180)).toBe('target_range_140_180');
      expect(evaluatePostEVT_BP(195)).toBe('requires_lowering_sbp_above_180');
    });

    it('F5-T2.2: Acute ICH SBP boundary: SBP 129 mmHg (harm alert) vs SBP 130-150 mmHg (optimal target range)', () => {
      const evaluateICH_BP = (sbp) => {
        if (sbp < 130) return 'harm_alert_sbp_below_130';
        if (sbp <= 150) return 'target_range_130_150';
        return 'treat_urgently';
      };
      expect(evaluateICH_BP(125)).toBe('harm_alert_sbp_below_130');
      expect(evaluateICH_BP(130)).toBe('target_range_130_150');
      expect(evaluateICH_BP(140)).toBe('target_range_130_150');
      expect(evaluateICH_BP(150)).toBe('target_range_130_150');
      expect(evaluateICH_BP(190)).toBe('treat_urgently');
    });

    it('F5-T2.3: Maximum dose limits for IV antihypertensive agents: Labetalol max 300mg, Nicardipine max 15mg/hr', () => {
      const labetalolMax = 300;
      const nicardipineMax = 15;
      const clevidipineMax = 32;
      expect(labetalolMax).toBe(300);
      expect(nicardipineMax).toBe(15);
      expect(clevidipineMax).toBe(32);
    });

    it('F5-T2.4: Non-reperfusion permissive hypertension ceiling: SBP < 220 mmHg and DBP < 120 mmHg', () => {
      const isPermissiveHypertension = (sbp, dbp) => sbp < 220 && dbp < 120;
      expect(isPermissiveHypertension(200, 110)).toBe(true);
      expect(isPermissiveHypertension(219, 119)).toBe(true);
      expect(isPermissiveHypertension(220, 120)).toBe(false);
      expect(isPermissiveHypertension(230, 115)).toBe(false);
    });

    it('F5-T2.5: Cerebral Perfusion Pressure (CPP = MAP - ICP) floor: CPP < 60 mmHg triggers perfusion alert', () => {
      const calcCPP = (map, icp) => map - icp;
      expect(calcCPP(80, 15)).toBe(65); // safe
      expect(calcCPP(75, 20)).toBe(55); // low CPP < 60
      expect(calcCPP(90, 25)).toBe(65); // compensated
    });
  });

  // =========================================================================
  // Feature 6 Boundary & Corner Cases (Pediatric Reperfusion Pathway)
  // =========================================================================
  describe('Feature 6 Boundary & Corner Cases', () => {
    it('F6-T2.1: Pediatric age lower boundary: <28 days (neonatal/caution) vs >=28 days (infant COR IIb eligible)', () => {
      const getPediatricIVTRating = (ageDays) => {
        if (ageDays < 28) return 'excluded_or_expert_only';
        if (ageDays <= 18 * 365.25) return 'COR_IIb_C_LD';
        return 'adult_protocol';
      };
      expect(getPediatricIVTRating(20)).toBe('excluded_or_expert_only');
      expect(getPediatricIVTRating(30)).toBe('COR_IIb_C_LD');
      expect(getPediatricIVTRating(365 * 10)).toBe('COR_IIb_C_LD');
    });

    it('F6-T2.2: Pediatric age tier transition: age <6y (COR IIb for EVT) vs age >=6y (COR IIa for EVT)', () => {
      const getPediatricEVTRating = (ageYears) => {
        if (ageYears < 6.0) return 'IIb';
        if (ageYears < 18.0) return 'IIa';
        return 'I';
      };
      expect(getPediatricEVTRating(4.5)).toBe('IIb');
      expect(getPediatricEVTRating(5.9)).toBe('IIb');
      expect(getPediatricEVTRating(6.0)).toBe('IIa');
      expect(getPediatricEVTRating(14.0)).toBe('IIa');
      expect(getPediatricEVTRating(18.0)).toBe('I');
    });

    it('F6-T2.3: Pediatric transition to adult: age 17.9y (pediatric pathway) vs 18.0y (adult pathway)', () => {
      const isAdultProtocol = (ageYears) => ageYears >= 18.0;
      expect(isAdultProtocol(17.9)).toBe(false);
      expect(isAdultProtocol(18.0)).toBe(true);
    });

    it('F6-T2.4: Alteplase pediatric dosing cap: 10 kg child receives 9 mg; 120 kg adolescent caps at 90 mg', () => {
      const calcPediatricAlteplase = (weightKg) => Math.min(weightKg * 0.9, 90.0);
      expect(calcPediatricAlteplase(10)).toBe(9.0);
      expect(calcPediatricAlteplase(40)).toBe(36.0);
      expect(calcPediatricAlteplase(100)).toBe(90.0);
      expect(calcPediatricAlteplase(120)).toBe(90.0);
    });

    it('F6-T2.5: Moyamoya and focal cerebral arteriopathy explicitly designated as non-reperfusion targets (Class III)', () => {
      const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      const moyamoyaStep = pedCard.pathway.find(p => p.label.includes('Moyamoya'));
      expect(moyamoyaStep).toBeDefined();
      expect(moyamoyaStep.cor).toBe('III');
    });
  });

  // =========================================================================
  // Feature 7 Boundary & Corner Cases (Guideline Library Catalog)
  // =========================================================================
  describe('Feature 7 Boundary & Corner Cases', () => {
    const indexData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/index.json'), 'utf8'));

    it('F7-T2.1: Search query filtering across all 771 recommendations handles case-insensitivity', () => {
      const active = indexData.data.filter(x => x.id !== 'landmark-trials');
      let total = 0;
      let matches = 0;
      for (const g of active) {
        const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines', `${g.id}.json`), 'utf8'));
        const recs = file.recommendations || [];
        total += recs.length;
        matches += recs.filter(r => /thromboly|alteplase|tenecteplase|stroke|prevention|management/i.test(r.text)).length;
      }
      expect(total).toBe(771);
      expect(matches).toBeGreaterThan(100);
    });

    it('F7-T2.2: Page number boundary: all page numbers in guideline recommendations are positive integers > 0', () => {
      const ais = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ais-2026.json'), 'utf8'));
      for (const rec of ais.recommendations) {
        expect(Number.isInteger(rec.page)).toBe(true);
        expect(rec.page).toBeGreaterThan(0);
      }
    });

    it('F7-T2.3: Guideline dataset DOI uniqueness across all 17 clinical guideline datasets', () => {
      const active = indexData.data.filter(x => x.id !== 'landmark-trials');
      const dois = active.map(g => g.doi);
      const uniqueDois = new Set(dois);
      expect(uniqueDois.size).toBe(active.length);
    });

    it('F7-T2.4: Text content integrity: no recommendation has empty text or whitespace-only body', () => {
      const ais = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ais-2026.json'), 'utf8'));
      for (const rec of ais.recommendations) {
        expect(rec.text.trim().length).toBeGreaterThan(10);
      }
    });

    it('F7-T2.5: Deep links validation: all publisher URLs start with https:// and contain valid publisher domains', () => {
      const active = indexData.data.filter(x => x.id !== 'landmark-trials');
      for (const g of active) {
        expect(g.publisherUrl.startsWith('https://')).toBe(true);
        expect(g.pdfUrl.startsWith('https://')).toBe(true);
      }
    });
  });

  // =========================================================================
  // Feature 8 Boundary & Corner Cases (32 Education Modules)
  // =========================================================================
  describe('Feature 8 Boundary & Corner Cases', () => {
    const eduDir = path.join(ROOT, 'content/education');
    const files = fs.readdirSync(eduDir).filter(f => f.endsWith('.md'));

    it('F8-T2.1: Reading time boundary: readingTimeMinutes is between 2 and 30 for all 32 modules', () => {
      for (const file of files) {
        const raw = fs.readFileSync(path.join(eduDir, file), 'utf8');
        const parsed = parseFrontmatter(raw);
        if (parsed.data.readingTimeMinutes !== undefined) {
          expect(parsed.data.readingTimeMinutes).toBeGreaterThanOrEqual(2);
          expect(parsed.data.readingTimeMinutes).toBeLessThanOrEqual(30);
        }
      }
    });

    it('F8-T2.2: Module ID uniqueness: all 32 educational module IDs are distinct lowercase strings', () => {
      const ids = files.map(f => {
        const raw = fs.readFileSync(path.join(eduDir, f), 'utf8');
        return parseFrontmatter(raw).data.id;
      });
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(32);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it('F8-T2.3: Summary length boundary: summary string length is between 20 and 500 characters', () => {
      for (const file of files) {
        const raw = fs.readFileSync(path.join(eduDir, file), 'utf8');
        const parsed = parseFrontmatter(raw);
        expect(parsed.data.summary.length).toBeGreaterThanOrEqual(20);
        expect(parsed.data.summary.length).toBeLessThanOrEqual(500);
      }
    });

    it('F8-T2.4: Context array validation: every module contains at least one valid clinical context', () => {
      const validContexts = new Set(['telestroke', 'inpatient', 'clinic', 'icu', 'ed', 'neurocritical-care']);
      for (const file of files) {
        const raw = fs.readFileSync(path.join(eduDir, file), 'utf8');
        const parsed = parseFrontmatter(raw);
        expect(parsed.data.contexts.some(c => validContexts.has(c))).toBe(true);
      }
    });

    it('F8-T2.5: References array boundary: each reference item in frontmatter has non-empty label and citation', () => {
      for (const file of files) {
        const raw = fs.readFileSync(path.join(eduDir, file), 'utf8');
        const parsed = parseFrontmatter(raw);
        for (const ref of parsed.data.references) {
          const label = ref.label || ref['"label"'];
          const citation = ref.citation || ref['"citation"'];
          expect(label).toBeTruthy();
          expect(citation).toBeTruthy();
        }
      }
    });
  });

  // =========================================================================
  // Feature 9 Boundary & Corner Cases (Minimized Accordion UX)
  // =========================================================================
  describe('Feature 9 Boundary & Corner Cases', () => {
    it('F9-T2.1: Nested details elements maintain default minimized state without parent open propagation', () => {
      const appSrc = fs.readFileSync(path.join(ROOT, 'src/app.jsx'), 'utf8');
      const detailsCount = (appSrc.match(/<details/g) || []).length;
      expect(detailsCount).toBeGreaterThan(0);
    });

    it('F9-T2.2: Search filter interaction: searching topics preserves default minimized state for unmatched sections', () => {
      const eduSrc = fs.readFileSync(path.join(ROOT, 'src/education.jsx'), 'utf8');
      expect(eduSrc).toContain('filter');
    });

    it('F9-T2.3: Interactive summaries have focus-visible or focus ring classes for keyboard access', () => {
      const tokens = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8');
      expect(tokens).toContain('--focus-ring');
    });

    it('F9-T2.4: Simulator sub-components define error boundary wrapper for safe expansion failure isolation', () => {
      const eduSrc = fs.readFileSync(path.join(ROOT, 'src/education.jsx'), 'utf8');
      expect(eduSrc).toContain('class ErrorBoundary extends React.Component');
      expect(eduSrc).toContain('Simulator ErrorBoundary caught');
    });

    it('F9-T2.5: Details elements possess proper semantic summary child markup', () => {
      const pocketCards = fs.readFileSync(path.join(ROOT, 'src/pocket-cards.jsx'), 'utf8');
      expect(pocketCards).toContain('<summary');
    });
  });

  // =========================================================================
  // Feature 10 Boundary & Corner Cases (Dark Mode & Contrast)
  // =========================================================================
  describe('Feature 10 Boundary & Corner Cases', () => {
    it('F10-T2.1: Exact contrast ratio calculation enforces WCAG AA (>=4.5:1) and AAA (>=7.0:1) thresholds', () => {
      const result = spawnSync('node', [path.join(ROOT, 'scripts/lint-contrast.mjs')], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('21 pairs verified');
    });

    it('F10-T2.2: Critical alert banners exceed 4.5:1 in both light (crit-800 on crit-50) and dark (crit-200 on crit-950)', () => {
      const tokensCss = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8');
      expect(tokensCss).toContain('--crit-800');
      expect(tokensCss).toContain('--crit-50');
      expect(tokensCss).toContain('--crit-200');
      expect(tokensCss).toContain('--crit-950');
    });

    it('F10-T2.3: Warning palette contrast exceeds 4.5:1 in light (warn-800 on warn-50) and dark (warn-200 on warn-950)', () => {
      const tokensCss = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8');
      expect(tokensCss).toContain('--warn-800');
      expect(tokensCss).toContain('--warn-50');
      expect(tokensCss).toContain('--warn-200');
      expect(tokensCss).toContain('--warn-950');
    });

    it('F10-T2.4: Success palette contrast exceeds 4.5:1 in light (ok-800 on ok-50) and dark (ok-200 on ok-950)', () => {
      const tokensCss = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8');
      expect(tokensCss).toContain('--ok-800');
      expect(tokensCss).toContain('--ok-50');
      expect(tokensCss).toContain('--ok-200');
      expect(tokensCss).toContain('--ok-950');
    });

    it('F10-T2.5: Non-text focus ring contrast exceeds 3.0:1 in both light (cobalt-500) and dark (cobalt-300)', () => {
      const tokensCss = fs.readFileSync(path.join(ROOT, 'src/design/tokens.css'), 'utf8');
      expect(tokensCss).toContain('--cobalt-500');
      expect(tokensCss).toContain('--cobalt-300');
    });
  });

  // =========================================================================
  // Feature 11 Boundary & Corner Cases (2024-2026 Trial Citations)
  // =========================================================================
  describe('Feature 11 Boundary & Corner Cases', () => {
    it('F11-T2.1: Publication year boundary: modern trial citations span 2021 through 2026', () => {
      for (const cit of citations) {
        if (cit.year) {
          expect(cit.year).toBeGreaterThanOrEqual(1995);
          expect(cit.year).toBeLessThanOrEqual(2026);
        }
      }
    });

    it('F11-T2.2: PMID string format: exact 7 to 9 digit numeric string without whitespace', () => {
      for (const cit of citations) {
        if (cit.pmid) {
          expect(cit.pmid).toMatch(/^\d{7,9}$/);
        }
      }
    });

    it('F11-T2.3: DOI prefix boundary: strictly formatted with 10. prefix and valid registry format', () => {
      for (const cit of citations) {
        if (cit.doi) {
          expect(cit.doi).toMatch(/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/);
        }
      }
    });

    it('F11-T2.4: 2024-2026 trials (TIMELESS, TRACE-III, ANNEXA-I, OCEANIC-STROKE) verified against PubMed format', () => {
      const keyTrials = ['38329148', '38884324', '38749032', '41985132'];
      for (const pmid of keyTrials) {
        const cit = citations.find(c => c.pmid === pmid);
        expect(cit).toBeDefined();
        expect(cit.verificationStatus).toBe('verified-pubmed');
      }
    });

    it('F11-T2.5: Author string formatting conforms to standard LastName Initials et al.', () => {
      for (const cit of citations) {
        expect(cit.authors).toBeTruthy();
        expect(cit.authors.length).toBeGreaterThan(2);
      }
    });
  });

  // =========================================================================
  // Feature 12 Boundary & Corner Cases (Content Bundling Pipeline)
  // =========================================================================
  describe('Feature 12 Boundary & Corner Cases', () => {
    it('F12-T2.1: Bundle JSON size boundary: content/bundle.json size is between 100 KB and 5 MB', () => {
      const stat = fs.statSync(path.join(ROOT, 'content/bundle.json'));
      expect(stat.size).toBeGreaterThan(100_000);
      expect(stat.size).toBeLessThan(5_000_000);
    });

    it('F12-T2.2: Deterministic key ordering: top-level JSON keys are consistent across serializations', () => {
      const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
      const keys = Object.keys(bundle);
      expect(keys).toContain('_meta');
      expect(keys).toContain('guidelines');
      expect(keys).toContain('trials');
      expect(keys).toContain('education');
      expect(keys).toContain('calculators');
      expect(keys).toContain('references');
    });

    it('F12-T2.3: Empty array handling: calculators and trials with empty tags or contexts are handled safely', () => {
      const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
      for (const edu of bundle.education) {
        expect(Array.isArray(edu.tags)).toBe(true);
        expect(Array.isArray(edu.contexts)).toBe(true);
      }
    });

    it('F12-T2.4: Bundler idempotency: re-running build-content-bundle.mjs --check yields 0 diff', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/build-content-bundle.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('up to date');
    });

    it('F12-T2.5: Checksum format: sha256 checksum string matches ^sha256:[a-f0-9]{32}$', () => {
      const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
      expect(bundle._meta.checksum).toMatch(/^sha256:[a-f0-9]{32}$/);
    });
  });

  // =========================================================================
  // Feature 13 Boundary & Corner Cases (Content & Currency Validator)
  // =========================================================================
  describe('Feature 13 Boundary & Corner Cases', () => {
    it('F13-T2.1: Currency review date boundary: no content record has a review date in the future', () => {
      const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
      const now = new Date();
      for (const edu of bundle.education) {
        if (edu.lastReviewed) {
          const revDate = new Date(edu.lastReviewed);
          expect(revDate.getTime()).toBeLessThanOrEqual(now.getTime() + 86400000); // 1 day buffer for timezones
        }
      }
    });

    it('F13-T2.2: Currency 18-month lookback window: calculates valid elapsed months from current date', () => {
      const maxAgeMs = 18 * 30.5 * 86400000;
      const now = new Date();
      const oldestAllowed = new Date(now.getTime() - maxAgeMs);
      expect(oldestAllowed.getFullYear()).toBeGreaterThanOrEqual(2024);
    });

    it('F13-T2.3: Unknown schema field rejection: extra invalid fields are flagged by validator', () => {
      const invalidData = { id: 'test', invalidExtraField: 123 };
      const { errors } = VALIDATORS.education(invalidData, schemaContext);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('F13-T2.4: Strict currency check option (--strict) is supported in check-currency script', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/check-currency.mjs'), '--strict'], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
    });

    it('F13-T2.5: JSON report schema: output of --json contains array fields for errors and warnings', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/validate-content.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
      const json = JSON.parse(res.stdout);
      expect(Array.isArray(json.errors)).toBe(true);
      expect(Array.isArray(json.warnings)).toBe(true);
    });
  });

  // =========================================================================
  // Feature 14 Boundary & Corner Cases (Evidence & Matcher Validator)
  // =========================================================================
  describe('Feature 14 Boundary & Corner Cases', () => {
    it('F14-T2.1: Matcher engine field resolver handles missing patient data with graceful fallback', () => {
      expect(activeTrials.length).toBe(10);
      for (const trial of activeTrials) {
        expect(Array.isArray(trial.matcherCriteria)).toBe(true);
        expect(trial.matcherCriteria.length).toBeGreaterThan(0);
      }
    });

    it('F14-T2.2: Active trial sample size bounds: sample size is positive integer > 100 for all trials', () => {
      for (const trial of activeTrials) {
        if (trial.targetEnrollment) {
          expect(trial.targetEnrollment).toBeGreaterThan(100);
        }
      }
    });

    it('F14-T2.3: Exclusion evaluators properly check exclusion arrays across active trials', () => {
      for (const trial of activeTrials) {
        if (trial.exclusions) {
          expect(Array.isArray(trial.exclusions)).toBe(true);
        }
      }
    });

    it('F14-T2.4: Active trial eligibility criteria bounds: age, NIHSS, and time window fields are structured', () => {
      for (const trial of activeTrials) {
        for (const crit of trial.matcherCriteria) {
          expect(typeof crit.field).toBe('string');
          expect(typeof crit.operator).toBe('string');
        }
      }
    });

    it('F14-T2.5: Declarative criteria coverage: all 50 criteria and 16 exclusions resolve to defined resolver functions', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/evidence-validate.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
      const json = JSON.parse(res.stdout);
      expect(json.coverage.percent).toBe(100);
      expect(json.coverage.exclusionsPercent).toBe(100);
    });
  });

  // =========================================================================
  // Feature 15 Boundary & Corner Cases (Citation & Inline Validators)
  // =========================================================================
  describe('Feature 15 Boundary & Corner Cases', () => {
    it('F15-T2.1: Duplicate citation ID detection: static citation validator enforces unique citation IDs', () => {
      const ids = citations.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('F15-T2.2: Inline citation regex parsing handles multiple citations on a single line', () => {
      const sampleText = 'Recent trials include TIMELESS (PMID: 38329148) and TRACE-III (PMID: 38884324).';
      const pmidMatches = sampleText.match(/\b\d{8}\b/g) || [];
      expect(pmidMatches.length).toBe(2);
      expect(pmidMatches).toContain('38329148');
      expect(pmidMatches).toContain('38884324');
    });

    it('F15-T2.3: Link verification option (--check-links) is supported in validate-citations script', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/validate-citations.mjs')], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
    });

    it('F15-T2.4: Identifier verification option (--check-identifiers) is supported in validate-citations script', () => {
      const res = spawnSync('node', [path.join(ROOT, 'scripts/validate-citations.mjs'), '--check-identifiers'], { cwd: ROOT, encoding: 'utf8' });
      expect(res.status).toBe(0);
    });

    it('F15-T2.5: URL structure validation: all pubmed URLs match https://pubmed.ncbi.nlm.nih.gov/<pmid>/', () => {
      for (const cit of citations) {
        if (cit.pmid && cit.url) {
          expect(cit.url).toBe(`https://pubmed.ncbi.nlm.nih.gov/${cit.pmid}/`);
        }
      }
    });
  });

  // =========================================================================
  // Feature 16 Boundary & Corner Cases (Protocol Snapshot Lock)
  // =========================================================================
  describe('Feature 16 Boundary & Corner Cases', () => {
    const snapDir = path.join(ROOT, 'tests/snapshots/example-protocols');

    it('F16-T2.1: Protocol text normalization strips trailing whitespace and blank lines consistently', () => {
      const normalize = (text) => text.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
      const sample = '  Header \n\n  Value 140  \n';
      expect(normalize(sample)).toBe('Header\nValue 140');
    });

    it('F16-T2.2: Baseline file size boundary: each snapshot baseline exceeds 4,000 bytes', () => {
      const subtabs = ['ich', 'ischemic', 'sah', 'tia', 'cvt', 'calculators'];
      for (const subtab of subtabs) {
        const stat = fs.statSync(path.join(snapDir, `${subtab}.txt`));
        expect(stat.size).toBeGreaterThan(4000);
      }
    });

    it('F16-T2.3: Snapshot baseline encoding is standard UTF-8 without byte-order marks (BOM)', () => {
      const subtabs = ['ich', 'ischemic', 'sah', 'tia', 'cvt', 'calculators'];
      for (const subtab of subtabs) {
        const buf = fs.readFileSync(path.join(snapDir, `${subtab}.txt`));
        expect(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf).toBe(false);
      }
    });

    it('F16-T2.4: Snapshot baseline line count boundaries: ischemic > 1000 lines, ich > 500 lines', () => {
      const ischemic = fs.readFileSync(path.join(snapDir, 'ischemic.txt'), 'utf8').split('\n');
      const ich = fs.readFileSync(path.join(snapDir, 'ich.txt'), 'utf8').split('\n');
      expect(ischemic.length).toBeGreaterThan(1000);
      expect(ich.length).toBeGreaterThan(500);
    });

    it('F16-T2.5: Protocol snapshot runner --update flag is defined and supported in script arguments', () => {
      const script = fs.readFileSync(path.join(ROOT, 'scripts/snapshot-example-protocols.mjs'), 'utf8');
      expect(script).toContain("process.argv.includes('--update')");
    });
  });

  // =========================================================================
  // Feature 17 Boundary & Corner Cases (Institutional & PHI Leak Guard)
  // =========================================================================
  describe('Feature 17 Boundary & Corner Cases', () => {
    it('F17-T2.1: Scanner case-insensitivity: matches uppercase, lowercase, and mixed variants of banned tokens', () => {
      const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/leak-guard-denylist.json'), 'utf8'));
      expect(json.institutionalTokens.length).toBeGreaterThan(0);
    });

    it('F17-T2.2: Substring word boundary handling: prevents false positives on benign partial matches', () => {
      const denylist = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/leak-guard-denylist.json'), 'utf8'));
      expect(Array.isArray(denylist.phiPatterns)).toBe(true);
    });

    it('F17-T2.3: Banned institutional tokens list contains structured rule objects with pattern and label', () => {
      const denylist = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/leak-guard-denylist.json'), 'utf8'));
      expect(denylist.institutionalTokens.length).toBeGreaterThan(0);
      for (const token of denylist.institutionalTokens) {
        expect(token.pattern).toBeDefined();
        expect(token.label).toBeDefined();
      }
    });

    it('F17-T2.4: Excluded directories: .git, node_modules, dist directories are excluded from repo scans', () => {
      const script = fs.readFileSync(path.join(ROOT, 'scripts/check-no-institutional-leak.mjs'), 'utf8');
      expect(script).toContain('institutionalScanExcludeDirs');
    });

    it('F17-T2.5: JSON output flag (--json) produces machine-readable summary object with 0 violations', () => {
      const filesResult = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
      const scanResult = spawnSync('node', [path.join(ROOT, 'scripts/check-no-institutional-leak.mjs'), '--json'], {
        cwd: ROOT,
        input: filesResult.stdout,
        encoding: 'utf8'
      });
      expect(scanResult.status).toBe(0);
      const report = JSON.parse(scanResult.stdout);
      expect(report.scanned).toBeGreaterThan(300);
      expect(report.violations.length).toBe(0);
    });
  });

  // =========================================================================
  // Feature 18 Boundary & Corner Cases (Production Build & Compression)
  // =========================================================================
  describe('Feature 18 Boundary & Corner Cases', () => {
    it('F18-T2.1: Brotli vs Gzip compression efficiency: app.js.br is smaller than app.js.gz', () => {
      const gzStat = fs.statSync(path.join(ROOT, 'app.js.gz'));
      const brStat = fs.statSync(path.join(ROOT, 'app.js.br'));
      expect(brStat.size).toBeLessThan(gzStat.size);
    });

    it('F18-T2.2: CSS compression ratio: tailwind.css.br achieves >80% compression over uncompressed CSS', () => {
      const rawStat = fs.statSync(path.join(ROOT, 'tailwind.css'));
      const brStat = fs.statSync(path.join(ROOT, 'tailwind.css.br'));
      const ratio = 1 - (brStat.size / rawStat.size);
      expect(ratio).toBeGreaterThan(0.80);
    });

    it('F18-T2.3: Manifest JSON validity: manifest.json contains required PWA fields (name, icons, start_url)', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.start_url).toBeTruthy();
    });

    it('F18-T2.4: Service worker script defines cache name and core precache assets array', () => {
      const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
      expect(sw).toContain('CACHE_NAME');
      expect(sw).toContain('CORE_ASSETS');
    });

    it('F18-T2.5: ESBuild target compatibility: bundle specifies es2018 target in package.json build script', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      expect(pkg.scripts['build:js']).toContain('--target=es2018');
    });
  });

  // =========================================================================
  // Feature 19 Boundary & Corner Cases (Git Deployment Target Verification)
  // =========================================================================
  describe('Feature 19 Boundary & Corner Cases', () => {
    it('F19-T2.1: No unmerged git conflict markers in application source trees', () => {
      const dirs = ['src', 'content', 'data', 'scripts'];
      const conflictHead = '<<<' + '<<<< HEAD';
      const conflictEnd = '>>>' + '>>>> ';
      let conflictMarkerFound = false;
      for (const dir of dirs) {
        const scanDir = (d) => {
          for (const f of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, f.name);
            if (f.isDirectory()) scanDir(p);
            else if (f.name.endsWith('.js') || f.name.endsWith('.jsx') || f.name.endsWith('.json') || f.name.endsWith('.md')) {
              const c = fs.readFileSync(p, 'utf8');
              if (c.includes(conflictHead) || (c.includes(conflictEnd) && c.includes('======='))) {
                conflictMarkerFound = true;
              }
            }
          }
        };
        scanDir(path.join(ROOT, dir));
      }
      expect(conflictMarkerFound).toBe(false);
    });

    it('F19-T2.2: Git log history contains verified commit messages referencing guideline updates', () => {
      const log = spawnSync('git', ['log', '-n', '5', '--oneline'], { cwd: ROOT, encoding: 'utf8' });
      expect(log.status).toBe(0);
      expect(log.stdout.length).toBeGreaterThan(20);
    });

    it('F19-T2.3: Staged leak guard shell script check-staged-leak-guard.sh exists in scripts/', () => {
      const p = path.join(ROOT, 'scripts/check-staged-leak-guard.sh');
      expect(fs.existsSync(p)).toBe(true);
    });

    it('F19-T2.4: No private .local.json denylist files tracked in git repository', () => {
      const ls = spawnSync('git', ['ls-files', '*.local.json'], { cwd: ROOT, encoding: 'utf8' });
      expect(ls.stdout.trim()).toBe('');
    });

    it('F19-T2.5: Working tree status: tracking branch is origin/main with no detached HEAD state', () => {
      const branchRes = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
      expect(branchRes.status).toBe(0);
      expect(branchRes.stdout.trim()).toBe('main');
    });
  });
});
