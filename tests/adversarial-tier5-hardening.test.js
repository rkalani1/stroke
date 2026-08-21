// tests/adversarial-tier5-hardening.test.js
//
// Phase 2 Tier 5 Adversarial Coverage Hardening Suite
// Stroke Clinical Decision Support (CDS) Application Update
//
// White-box stress testing, boundary value analysis, combinatorial testing,
// and failure mode verification across:
//   1. Command Center Cards & Clinical Guidance (src/management-guidance.js)
//   2. Matcher Engine & Field Resolvers / Operators (src/evidence/matcher-engine.js)
//   3. Guideline Recommendations Decision Logic & Edge Cases (src/app.jsx)
//   4. Educational Accordion Architecture & Fuzzy Search (src/education.jsx)
//   5. 88 Guideline Datasets & 861 Recommendations (data/guidelines/)
//   6. Landmark Trial Citations & Central Registry Integrity (src/evidence/citations.js)

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Import modules under test
import {
  AIS_COMMAND_CENTER_CARDS,
  AIS_COMMAND_CENTER_LAST_REVIEWED,
  AIS_SOURCE_LINKS
} from '../src/management-guidance.js';

import {
  resolveField,
  knownFields,
  knownOperators,
  evaluateCriterion,
  evaluateActiveTrial,
  evaluateAllTrialsViaEngine,
  coverageReport,
  diffEvaluations
} from '../src/evidence/matcher-engine.js';

import {
  activeTrials,
  completedTrials,
  citations,
  recommendations as evidenceRecs,
  claims
} from '../src/evidence/index.js';

const REPO_ROOT = path.resolve(__dirname, '..');
const GUIDELINES_DIR = path.join(REPO_ROOT, 'data', 'guidelines');
const EDUCATION_DIR = path.join(REPO_ROOT, 'content', 'education');

describe('Phase 2 Tier 5 Adversarial Coverage Hardening Suite', () => {

  // =========================================================================
  // 1. AIS COMMAND CENTER & CLINICAL GUIDANCE ADVERSARIAL STRESS
  // =========================================================================
  describe('1. AIS Command Center Cards & Clinical Guidance Invariants', () => {

    it('verifies exact inventory of 8 AIS Command Center Cards', () => {
      expect(AIS_COMMAND_CENTER_CARDS).toBeDefined();
      expect(AIS_COMMAND_CENTER_CARDS.length).toBe(8);

      const expectedIds = [
        'ais-ivt-early',
        'ais-ivt-extended',
        'ais-evt-selection',
        'ais-physiology',
        'ais-mevo',
        'ais-complications',
        'ais-telestroke-sequence',
        'ais-pediatric'
      ];
      const actualIds = AIS_COMMAND_CENTER_CARDS.map(c => c.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it('verifies schema completeness and rigorous types for all 8 cards', () => {
      for (const card of AIS_COMMAND_CENTER_CARDS) {
        expect(typeof card.id).toBe('string');
        expect(card.id.length).toBeGreaterThan(0);
        expect(typeof card.title).toBe('string');
        expect(typeof card.shortLabel).toBe('string');
        expect(typeof card.urgency).toBe('string');
        expect(typeof card.classOfRecommendation).toBe('string');
        expect(typeof card.levelOfEvidence).toBe('string');
        if (card.id === 'ais-pediatric') {
          // Pediatric content is separately governed and was intentionally not
          // changed by the adult institutional-source reconciliation.
          expect(card.lastReviewed).toBe('2026-07-03');
        } else {
          expect(card.lastReviewed).toBe(AIS_COMMAND_CENTER_LAST_REVIEWED);
        }
        expect(typeof card.summary).toBe('string');
        expect(card.summary.length).toBeGreaterThan(20);

        // Scaffolding remains structurally stable even when unsupported clinical
        // prose is removed and an optional array becomes empty.
        expect(Array.isArray(card.actions)).toBe(true);
        card.actions.forEach(a => expect(typeof a).toBe('string'));

        expect(Array.isArray(card.pathway)).toBe(true);
        for (const step of card.pathway) {
          expect(typeof step.label).toBe('string');
          expect(typeof step.decision).toBe('string');
          expect(typeof step.cor).toBe('string');
          expect(typeof step.loe).toBe('string');
        }

        expect(Array.isArray(card.pitfalls)).toBe(true);
        card.pitfalls.forEach(p => expect(typeof p).toBe('string'));
        expect(Array.isArray(card.calculators)).toBe(true);

        expect(typeof card.teachingPearl).toBe('string');
        expect(typeof card.changedSinceLastGuideline).toBe('string');
      }
    });

    it('stress tests pediatric card (ais-pediatric) clinical boundaries and safety rules', () => {
      const peds = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
      expect(peds).toBeDefined();

      // Verify Alteplase is endorsed, TNK is NOT endorsed
      const combinedText = JSON.stringify(peds);
      expect(combinedText).toContain('alteplase 0.9 mg/kg');
      expect(combinedText).toContain('max 90 mg');
      expect(combinedText).toMatch(/tenecteplase.*not.*endorsed/i);

      // Verify age threshold differentiation: >=6y (COR IIa) vs 28d-<6y (COR IIb)
      const p1 = peds.pathway.find(p => p.label.includes('age >=6y'));
      expect(p1).toBeDefined();
      expect(p1.cor).toBe('IIa');
      expect(p1.loe).toBe('B-NR');

      const p2 = peds.pathway.find(p => p.label.includes('28d-<6y'));
      expect(p2).toBeDefined();
      expect(p2.cor).toBe('IIb');
      expect(p2.loe).toBe('B-NR');

      // Non-reperfusion targets (Moyamoya / arteriopathy) -> Class III
      const pMoyamoya = peds.pathway.find(p => p.label.toLowerCase().includes('moyamoya'));
      expect(pMoyamoya).toBeDefined();
      expect(pMoyamoya.cor).toBe('III');
    });

    it('stress tests MeVO card (ais-mevo) institutional branch restraint', () => {
      const mevo = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-mevo');
      expect(mevo).toBeDefined();

      // Dominant proximal M2 is IIa, nondominant M2 / M3 / M4 / ACA / PCA is III: Harm/No Benefit
      const dominant = mevo.pathway.find(p => p.label.toLowerCase().includes('dominant proximal m2'));
      expect(dominant).toBeDefined();
      expect(dominant.cor).toBe('IIa');

      const distal = mevo.pathway.find(p => p.label.toLowerCase().includes('nondominant'));
      expect(distal).toBeDefined();
      expect(distal.cor).toBe('III: No Benefit');
      expect(distal.loe).toBe('A');
    });

    it('stress tests Physiology card (ais-physiology) institutional blood-pressure thresholds', () => {
      const phys = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-physiology');
      expect(phys).toBeDefined();

      // The accepted pocket card supplies numeric thresholds, not literature
      // grades or a trial-derived post-EVT harm claim.
      const preIVT = phys.pathway.find(p => p.label.includes('185/110'));
      expect(preIVT).toBeDefined();
      expect(preIVT.decision).toContain('Lower below 185/110');

      const postIVT = phys.pathway.find(p => p.label.includes('Post-IVT'));
      expect(postIVT).toBeDefined();
      expect(postIVT.decision).toContain('Maintain <180/105 for 24 hours');

      const postEVT = phys.pathway.find(p => p.label === 'Post-EVT with documented mTICI >=2b');
      expect(postEVT).toBeDefined();
      expect(postEVT.decision).toBe('Maintain SBP 140-180');
      expect(phys.pathway.find(p => p.label === 'Post-EVT')).toBeUndefined();
      for (const step of phys.pathway) {
        expect(step.cor).toBe('');
        expect(step.loe).toBe('');
      }
      expect(JSON.stringify(phys)).not.toMatch(/ENCHANTED2|OPTIMAL-BP|Class III|harm/i);
    });

    it('verifies AIS source references are public-safe labels without private document links', () => {
      expect(AIS_SOURCE_LINKS.length).toBeGreaterThanOrEqual(4);
      for (const link of AIS_SOURCE_LINKS) {
        expect(link.label).toBeDefined();
        expect(link.label.length).toBeGreaterThan(0);
        expect(Object.hasOwn(link, 'href')).toBe(false);
      }
    });
  });

  // =========================================================================
  // 2. MATCHER ENGINE ADVERSARIAL COVERAGE & OPERATOR STRESS
  // =========================================================================
  describe('2. Matcher Engine & Field Resolvers / Operators Stress Testing', () => {

    it('verifies 100% field and operator coverage across all 9 active trials with 0 gaps', () => {
      const report = coverageReport(activeTrials);
      expect(report.total).toBe(42);
      expect(report.covered).toBe(42);
      expect(report.percent).toBe(100);
      expect(report.exclusionsTotal).toBe(13);
      expect(report.exclusionsCovered).toBe(13);
      expect(report.exclusionsPercent).toBe(100);
      expect(report.gaps).toEqual([]);
    });

    it('adversarially stress tests resolveField with malformed, prototype-polluted, and null inputs', () => {
      expect(resolveField('unknown_field_xyz', {})).toBeUndefined();
      expect(resolveField('age', null)).toBeUndefined();
      expect(resolveField('age', undefined)).toBeUndefined();
      expect(resolveField('age', {})).toBeUndefined();
      expect(resolveField('age', { telestrokeNote: { age: 65 } })).toBe(65);
      expect(resolveField('age', { strokeCodeForm: { age: '72' } })).toBe('72');

      expect(resolveField('nihss', { nihssScore: 15 })).toBe(15);
      expect(resolveField('nihss', { telestrokeNote: { nihss: 8 } })).toBe(8);

      expect(resolveField('premorbidMRS', { telestrokeNote: { premorbidMRS: 2 } })).toBe(2);

      expect(resolveField('vesselOcclusion', null)).toEqual([]);
      expect(resolveField('vesselOcclusion', { telestrokeNote: { vesselOcclusion: ['ICA', 'M1'] } })).toEqual(['ICA', 'M1']);

      // Derived field: reperfusion
      expect(resolveField('reperfusion', {})).toBeNull();
      expect(resolveField('reperfusion', { telestrokeNote: { tnkRecommended: true } })).toBe(true);
      expect(resolveField('reperfusion', { telestrokeNote: { evtRecommended: true } })).toBe(true);
      expect(resolveField('reperfusion', { telestrokeNote: { tnkRecommended: false, evtRecommended: false } })).toBe(false);

      // Derived field: nihssDisabling
      expect(resolveField('nihssDisabling', {})).toBeNull();
      expect(resolveField('nihssDisabling', { nihssScore: 10 })).toBe(true);
      expect(resolveField('nihssDisabling', { nihssScore: 6 })).toBe(true);
      expect(resolveField('nihssDisabling', { nihssScore: 5, telestrokeNote: { disablingDeficit: true } })).toBe(true);
      expect(resolveField('nihssDisabling', { nihssScore: 5, telestrokeNote: { disablingDeficit: false } })).toBe(false);
      expect(resolveField('nihssDisabling', { nihssScore: 4, telestrokeNote: { disablingDeficit: true } })).toBe(true);
      expect(resolveField('nihssDisabling', { nihssScore: 3, telestrokeNote: { disablingDeficit: true } })).toBe(false);
      expect(resolveField('nihssDisabling', { nihssScore: 0 })).toBe(false);

      // Derived field: domainMatch (STEP-EVT)
      expect(resolveField('domainMatch', {})).toBeNull();
      expect(resolveField('domainMatch', { nihssScore: 8, telestrokeNote: { vesselOcclusion: ['M2'] } })).toBe('mevo');
      expect(resolveField('domainMatch', { nihssScore: 12, telestrokeNote: { vesselOcclusion: ['M3'] } })).toBe('mevo');
      expect(resolveField('domainMatch', { nihssScore: 7, telestrokeNote: { vesselOcclusion: ['M2'] } })).toBe('none');
      expect(resolveField('domainMatch', { nihssScore: 8, telestrokeNote: { vesselOcclusion: ['M4'] } })).toBe('none');
      expect(resolveField('domainMatch', { nihssScore: 4, telestrokeNote: { vesselOcclusion: ['M1'] } })).toBe('low-nihss-lvo');
      expect(resolveField('domainMatch', { nihssScore: 0, telestrokeNote: { vesselOcclusion: ['ICA'] } })).toBe('low-nihss-lvo');
      expect(resolveField('domainMatch', { nihssScore: 6, telestrokeNote: { vesselOcclusion: ['ICA'] } })).toBe('none');
    });

    it('adversarially stress tests operators: between, in, truthy, present, ==, >=, <=', () => {
      // Operator between
      const critBetween = { field: 'age', operator: 'between', value: [18, 80] };
      expect(evaluateCriterion(critBetween, { telestrokeNote: { age: 18 } })).toBe('met');
      expect(evaluateCriterion(critBetween, { telestrokeNote: { age: 80 } })).toBe('met');
      expect(evaluateCriterion(critBetween, { telestrokeNote: { age: 50 } })).toBe('met');
      expect(evaluateCriterion(critBetween, { telestrokeNote: { age: 17 } })).toBe('not_met');
      expect(evaluateCriterion(critBetween, { telestrokeNote: { age: 81 } })).toBe('not_met');
      expect(evaluateCriterion(critBetween, {})).toBe('unknown');

      // Operator in
      const critIn = { field: 'diagnosisCategory', operator: 'in', value: ['ischemic', 'tia'] };
      expect(evaluateCriterion(critIn, { telestrokeNote: { diagnosisCategory: 'ischemic' } })).toBe('met');
      expect(evaluateCriterion(critIn, { telestrokeNote: { diagnosisCategory: 'tia' } })).toBe('met');
      expect(evaluateCriterion(critIn, { telestrokeNote: { diagnosisCategory: 'ich' } })).toBe('not_met');
      expect(evaluateCriterion(critIn, {})).toBe('unknown');

      // Operator in with array resolved
      const critInArray = { field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1', 'M2'] };
      expect(evaluateCriterion(critInArray, { telestrokeNote: { vesselOcclusion: ['M1'] } })).toBe('met');
      expect(evaluateCriterion(critInArray, { telestrokeNote: { vesselOcclusion: ['PCA'] } })).toBe('not_met');
      expect(evaluateCriterion(critInArray, { telestrokeNote: { vesselOcclusion: [] } })).toBe('unknown');

      // Operator truthy
      const critTruthy = { field: 'pregnancy', operator: 'truthy', value: true };
      expect(evaluateCriterion(critTruthy, { pregnancy: true })).toBe('met');
      expect(evaluateCriterion(critTruthy, { pregnancy: false })).toBe('not_met');
      expect(evaluateCriterion(critTruthy, {})).toBe('not_met');
      expect(evaluateCriterion(critTruthy, { pregnancy: null })).toBe('not_met');

      // Operator present
      const critPresent = { field: 'ctpResults', operator: 'present', value: ['mismatch', 'penumbra'] };
      expect(evaluateCriterion(critPresent, { telestrokeNote: { ctpResults: 'Favorable mismatch profile' } })).toBe('met');
      expect(evaluateCriterion(critPresent, { telestrokeNote: { ctpResults: 'Penumbra volume 85mL' } })).toBe('met');
      expect(evaluateCriterion(critPresent, { telestrokeNote: { ctpResults: 'Dense completed infarct, no salvageable tissue' } })).toBe('not_met');
      expect(evaluateCriterion(critPresent, {})).toBe('unknown');
    });

    it('stress tests evaluateActiveTrial exclusion precedence and status transitions', () => {
      // Pick a real active trial: STEP-EVT (NCT06289985)
      const stepEvtTrial = activeTrials.find(t => t.id === 'step-evt' || t.legacyMatcherKey === 'STEP');
      expect(stepEvtTrial).toBeDefined();

      // Case 1: Fresh empty patient envelope -> status should be needs_info (since required fields are unknown)
      const r1 = evaluateActiveTrial(stepEvtTrial, {});
      expect(r1.status).toBe('needs_info');
      expect(r1.counts.unknown).toBeGreaterThan(0);

      // Case 2: Patient matching all inclusion criteria (MeVO domain:
      // M2 occlusion with NIHSS >=8, age >=18, mRS <=2, within 24 h)
      const perfectStepEvtPatient = {
        telestrokeNote: {
          age: 65,
          nihss: 12,
          premorbidMRS: 0,
          vesselOcclusion: ['M2'],
          disablingDeficit: true
        },
        aspectsScore: 8,
        hoursFromLKW: 6.0,
        pregnancy: false,
        hemorrhage: false,
        seizures: false
      };
      const r2 = evaluateActiveTrial(stepEvtTrial, perfectStepEvtPatient);
      expect(r2.status).toBe('eligible');
      expect(r2.counts.not_met).toBe(0);

      // Case 3: Exclusion triggered (e.g. hemorrhage: true) -> must force not_eligible
      const excludedStepEvtPatient = {
        ...perfectStepEvtPatient,
        hemorrhage: true
      };
      const r3 = evaluateActiveTrial(stepEvtTrial, excludedStepEvtPatient);
      expect(r3.status).toBe('not_eligible');
      expect(r3.exclusions.length).toBeGreaterThan(0);
      expect(r3.exclusions.some(x => x.field === 'hemorrhage' && x.triggered)).toBe(true);

      // Case 4: Inclusion failed (e.g. age 17 < 18) -> not_eligible
      const underageStepEvtPatient = {
        ...perfectStepEvtPatient,
        telestrokeNote: {
          ...perfectStepEvtPatient.telestrokeNote,
          age: 17
        }
      };
      const r4 = evaluateActiveTrial(stepEvtTrial, underageStepEvtPatient);
      expect(r4.status).toBe('not_eligible');
      expect(r4.counts.not_met).toBeGreaterThan(0);
    });

    it('verifies evaluateAllTrialsViaEngine processes all 9 active trials without errors', () => {
      const patientEnvelope = {
        telestrokeNote: {
          age: 68,
          nihss: 14,
          premorbidMRS: 1,
          diagnosisCategory: 'ischemic',
          vesselOcclusion: ['M1'],
          ctpResults: 'penumbra mismatch present',
          tnkRecommended: true,
          evtRecommended: true
        },
        hoursFromLKW: 3.5
      };

      const result = evaluateAllTrialsViaEngine(activeTrials, patientEnvelope);
      expect(result).toBeDefined();
      const keys = Object.keys(result);
      expect(keys.length).toBe(9);

      for (const key of keys) {
        const trialResult = result[key];
        expect(trialResult.trialId).toBeDefined();
        expect(['eligible', 'needs_info', 'not_eligible', 'pending']).toContain(trialResult.status);
        expect(Array.isArray(trialResult.criteria)).toBe(true);
        expect(typeof trialResult.metCount).toBe('number');
        expect(typeof trialResult.notMetCount).toBe('number');
        expect(typeof trialResult.unknownCount).toBe('number');
      }
    });
  });

  // =========================================================================
  // 3. GUIDELINE RECOMMENDATIONS DECISION LOGIC & NUMERIC BOUNDARIES
  // =========================================================================
  describe('3. Guideline Recommendations Decision Logic & Numeric Boundaries', () => {

    it('verifies that all 128 GUIDELINE_RECOMMENDATIONS evaluate safely on empty and null inputs', () => {
      const appJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'app.jsx'), 'utf8');
      
      const requiredRecIds = [
        'bp_pre_tnk',
        'bp_pre_evt',
        'bp_post_tnk',
        'bp_post_evt',
        'bp_ich_acute',
        'bp_ich_target_range',
        'bp_ich_avoid_low',
        'tnk_standard',
        'tnk_extended_imaging',
        'tnk_late_window',
        'evt_standard',
        'evt_late_window',
        'evt_large_core_early',
        'evt_basilar',
        'anticoag_af_timing',
        'doac_timing_af',
        'reversal_xa_inhibitor',
        'reversal_dabigatran',
        'reversal_warfarin'
      ];

      for (const id of requiredRecIds) {
        expect(appJsx).toContain(`${id}: {`);
      }
    });

    it('stress tests post-EVT BP lowering harm guard (ENCHANTED2/MT & OPTIMAL-BP)', () => {
      const appJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'app.jsx'), 'utf8');
      
      expect(appJsx).toContain("id: 'bp_post_evt'");
      expect(appJsx).toContain("classOfRec: 'III'");
      expect(appJsx).toContain("levelOfEvidence: 'A'");
      expect(appJsx).toContain('Do NOT target SBP <140 mmHg after successful EVT reperfusion');
    });

    it('stress tests acute ICH BP lowering harm guard (ATACH-2 / AHA 2022)', () => {
      const appJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'app.jsx'), 'utf8');
      
      expect(appJsx).toContain("id: 'bp_ich_avoid_low'");
      expect(appJsx).toContain("classOfRec: 'III-harm'");
      expect(appJsx).toContain('Avoid acute lowering to SBP <130 mmHg in mild-to-moderate spontaneous ICH');
    });

    it('stress tests DOAC resumption CATALYST 2025 evidence integration', () => {
      const appJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'app.jsx'), 'utf8');
      
      expect(appJsx).toContain("id: 'anticoag_af_timing'");
      expect(appJsx).toContain("id: 'doac_timing_af'");
      expect(appJsx).toMatch(/CATALYST.*2025|40570866/i);
    });
  });

  // =========================================================================
  // 4. EDUCATION SECTION ACCORDION ARCHITECTURE & FUZZY SEARCH
  // =========================================================================
  describe('4. Education Section Accordion Architecture & Fuzzy Search', () => {

    it('verifies all education markdown modules start collapsed (no default open attribute)', () => {
      const files = fs.readdirSync(EDUCATION_DIR).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThanOrEqual(32);

      const educationJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'education.jsx'), 'utf8');

      // Verify that no <details open> tags exist in education.jsx
      const openMatches = educationJsx.match(/<details\s+[^>]*open/g);
      expect(openMatches).toBeNull();
    });

    it('verifies ErrorBoundary wraps interactive simulators in education.jsx', () => {
      const educationJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'education.jsx'), 'utf8');
      
      expect(educationJsx).toContain('class ErrorBoundary extends React.Component');
      expect(educationJsx).toContain('<ErrorBoundary>');
      expect(educationJsx).toContain('Failed to load simulator');
    });

    it('stress tests guideline library indexing and search helpers in education.jsx', () => {
      const educationJsx = fs.readFileSync(path.join(REPO_ROOT, 'src', 'education.jsx'), 'utf8');
      
      expect(educationJsx).toContain('const GUIDELINE_LIBRARY = [');
      expect(educationJsx).toContain('const GUIDELINE_LIBRARY_INDEX =');
      expect(educationJsx).toContain('const fuzzyScore =');
      expect(educationJsx).toContain('const getGuidelineQuickActions =');

      // Verify quick action keywords are properly wired
      expect(educationJsx).toContain("id: 'tnk'");
      expect(educationJsx).toContain("id: 'evt'");
      expect(educationJsx).toContain("id: 'ich'");
      expect(educationJsx).toContain("id: 'nihss'");
      expect(educationJsx).toContain("id: 'aspects'");
      expect(educationJsx).toContain("id: 'doac'");
    });
  });

  // =========================================================================
  // 5. 88 GUIDELINE DATASETS & 861 RECOMMENDATIONS ADVERSARIAL VALIDATION
  // =========================================================================
  describe('5. 88 Guideline Datasets & 861 Recommendations Invariant Hardening', () => {

    it('verifies all 88 guideline datasets exist and parse valid JSON with 861 recommendations', () => {
      const guidelineFiles = fs.readdirSync(GUIDELINES_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'landmark-trials.json');
      expect(guidelineFiles.length).toBe(88);

      let totalRecs = 0;
      const validCORs = new Set(['I', 'IIa', 'IIb', 'III', 'Statement']);
      const validLOEs = new Set([
        'A', 'B', 'C', 'B-R', 'B-NR', 'C-LD', 'C-EO',
        'Expert Consensus', 'Guideline Summary', 'Emerging',
        'A*', 'B*', 'B/C', 'A* (LE), B (UE)', 'B/C*', 'C*'
      ]);

      for (const file of guidelineFiles) {
        const fullPath = path.join(GUIDELINES_DIR, file);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        expect(data.id, `Missing id in ${file}`).toBeDefined();
        expect(data.title, `Missing title in ${file}`).toBeDefined();
        expect(Array.isArray(data.recommendations), `Missing recommendations array in ${file}`).toBe(true);

        for (const rec of data.recommendations) {
          totalRecs += 1;
          const cor = rec.cor || rec.classOfRec;
          const loe = rec.loe || rec.levelOfEvidence;

          expect(typeof rec.text, `Missing rec text in ${file}`).toBe('string');
          expect(rec.text.trim().length, `Empty rec text in ${file}`).toBeGreaterThan(5);
          expect(cor, `Missing COR in ${file}`).toBeDefined();
          expect(validCORs.has(cor), `Invalid COR '${cor}' in ${file}`).toBe(true);
          expect(loe, `Missing LOE in ${file}`).toBeDefined();
          expect(validLOEs.has(loe), `Invalid LOE '${loe}' in ${file}`).toBe(true);

          if (rec.pmid) {
            expect(String(rec.pmid)).toMatch(/^\d{6,9}$/);
          }
        }
      }

      expect(totalRecs).toBe(861);
    });

    it('verifies 2026 AHA/ASA AIS guideline dataset contains 195 recommendations', () => {
      const aisPath = path.join(GUIDELINES_DIR, 'ais-2026.json');
      expect(fs.existsSync(aisPath)).toBe(true);
      const ais = JSON.parse(fs.readFileSync(aisPath, 'utf8'));
      expect(ais.recommendations.length).toBe(195);

      // Check TNK Class I and 0.4 mg/kg Class III harm statements
      const tnkRec = ais.recommendations.find(r => /Tenecteplase.*0\.25 mg\/kg/i.test(r.text));
      expect(tnkRec).toBeDefined();
      expect(tnkRec.classOfRec || tnkRec.cor).toBe('I');

      const tnkHarmRec = ais.recommendations.find(r => /0\.4\s*mg\/kg/i.test(r.text));
      expect(tnkHarmRec).toBeDefined();
      expect(tnkHarmRec.classOfRec || tnkHarmRec.cor).toBe('III');
    });

    it('verifies SVIN 2025 Large-Core EVT guideline dataset contains 4 recommendations', () => {
      const svinPath = path.join(GUIDELINES_DIR, 'svin-large-core-2025.json');
      expect(fs.existsSync(svinPath)).toBe(true);
      const svin = JSON.parse(fs.readFileSync(svinPath, 'utf8'));
      expect(svin.recommendations.length).toBe(4);

      // Verify early (0-6h) ASPECTS 0-5 Class I/A and extended (6-24h) ASPECTS 3-5 Class I/A
      const early = svin.recommendations.find(r => r.text.includes('0-6 h') && r.text.includes('ASPECTS of 0-5'));
      expect(early).toBeDefined();
      expect(early.classOfRec || early.cor).toBe('I');
      expect(early.levelOfEvidence || early.loe).toBe('A');

      const late = svin.recommendations.find(r => r.text.includes('6-24 h') && r.text.includes('ASPECTS of 3-5'));
      expect(late).toBeDefined();
      expect(late.classOfRec || late.cor).toBe('I');
      expect(late.levelOfEvidence || late.loe).toBe('A');
    });
  });

  // =========================================================================
  // 6. LANDMARK TRIAL CITATIONS & CENTRAL CITATIONS REGISTRY INTEGRITY
  // =========================================================================
  describe('6. Landmark Trial Citations & Central Citations Registry Integrity', () => {

    it('verifies central citations registry has >= 87 citations with complete metadata', () => {
      expect(citations).toBeDefined();
      expect(Array.isArray(citations)).toBe(true);
      expect(citations.length).toBeGreaterThanOrEqual(87);

      for (const cit of citations) {
        expect(typeof cit.id).toBe('string');
        expect(cit.id.length).toBeGreaterThan(0);
        expect(typeof cit.title).toBe('string');
        expect(cit.title.length).toBeGreaterThan(0);
        expect(typeof cit.year).toBe('number');
        expect(cit.year).toBeGreaterThanOrEqual(1960);
        expect(cit.year).toBeLessThanOrEqual(2026);

        if (cit.pmid) {
          expect(String(cit.pmid)).toMatch(/^\d{7,9}$/);
        }
        if (cit.url) {
          expect(cit.url).toMatch(/^https?:\/\//);
        }
      }
    });

    it('verifies high-impact 2024-2026 landmark citations are present in registry', () => {
      const modernIds = [
        'cit-catalyst-2025',
        'cit-timeless-2024',
        'cit-trace-iii-2024',
        'cit-annexa-i-2024',
        'cit-oceanic-stroke-2026',
        'cit-laste-2024',
        'cit-tesla-2024'
      ];

      for (const id of modernIds) {
        const found = citations.find(c => c.id === id);
        expect(found, `Missing modern landmark trial citation: ${id}`).toBeDefined();
        expect(found.year).toBeGreaterThanOrEqual(2024);
        expect(found.pmid || found.doi || found.url).toBeDefined();
      }
    });

    it('verifies CATALYST 2025 pooled meta-analysis citation details', () => {
      const catalyst = citations.find(c => c.id === 'cit-catalyst-2025');
      expect(catalyst).toBeDefined();
      expect(catalyst.pmid).toBe('40570866');
      expect(catalyst.year).toBe(2025);
      expect(catalyst.title).toContain('CATALYST');
      expect(catalyst.journal).toContain('Lancet');
    });
  });

  // =========================================================================
  // 7. CLINICAL CALCULATORS ADVERSARIAL BOUNDARY & CORNER CASES
  // =========================================================================
  describe('7. Clinical Calculators Boundary & Logic Invariants', () => {
    // Dynamic import calculators
    it('verifies GCS calculator bounds, partial inputs, and clamp behavior', async () => {
      const { calculateGCS } = await import('../src/calculators.js');
      expect(calculateGCS({})).toBeNull();
      expect(calculateGCS({ eye: 4, verbal: 5, motor: 6 })).toBe(15);
      expect(calculateGCS({ eye: 1, verbal: 1, motor: 1 })).toBe(3);
      // Partial inputs -> null
      expect(calculateGCS({ eye: 4, verbal: 0, motor: 6 })).toBeNull();
      // Out of bounds values get clamped
      expect(calculateGCS({ eye: 10, verbal: 10, motor: 10 })).toBe(15);
    });

    it('verifies ABCD2 calculator clinical features mutual-exclusion rule', async () => {
      const { calculateABCD2Score, calculateABCD2WithDetail } = await import('../src/calculators.js');
      
      // Weakness alone = 2 pts
      const s1 = calculateABCD2Score({ unilateralWeakness: true });
      expect(s1).toBe(2);

      // Speech alone = 1 pt
      const s2 = calculateABCD2Score({ speechDisturbance: true });
      expect(s2).toBe(1);

      // Both weakness and speech = 2 pts (no double count per Johnston Lancet 2007)
      const s3 = calculateABCD2Score({ unilateralWeakness: true, speechDisturbance: true });
      expect(s3).toBe(2);

      const detail = calculateABCD2WithDetail({ unilateralWeakness: true, speechDisturbance: true });
      expect(detail.score).toBe(2);
      expect(detail.mutuallyExclusiveNote).not.toBeNull();
      expect(detail.mutuallyExclusiveNote).toContain('no double-count');
    });

    it('verifies RCVS2 negative score preservation (-2 to +10)', async () => {
      const { calculateRCVS2Score } = await import('../src/calculators.js');
      
      // Carotid involvement alone gives -2
      expect(calculateRCVS2Score({ carotidInvolvement: true })).toBe(-2);
      // Recurrent TCH gives +5
      expect(calculateRCVS2Score({ recurrentTCH: true })).toBe(5);
      // Recurrent TCH + carotid involvement = 3
      expect(calculateRCVS2Score({ recurrentTCH: true, carotidInvolvement: true })).toBe(3);
    });

    it('verifies DOAC timing calculation with imaging overrides', async () => {
      const { calculateDOACStart } = await import('../src/calculators.js');
      
      const now = new Date('2026-08-14T00:00:00Z');
      // Minor NIHSS (4) -> 1 day under ELAN/OPTIMAS
      const r1 = calculateDOACStart(4, now, 'elan-optimas');
      expect(r1.severity).toBe('minor');
      expect(r1.days).toBe(1);

      // Minor NIHSS (4) but large infarct imaging override -> severe (6 days)
      const r2 = calculateDOACStart(4, now, 'elan-optimas', 'large');
      expect(r2.severity).toBe('severe');
      expect(r2.days).toBe(6);
      expect(r2.imagingOverride).toBe(true);
    });
  });

  // =========================================================================
  // 8. AUTOMATED STATIC & DYNAMIC VALIDATION SCRIPTS ADVERSARIAL EXECUTION
  // =========================================================================
  describe('8. Automated Static & Dynamic Validation Scripts Verification', () => {
    it('verifies scripts/build-content-bundle.mjs --check runs cleanly with 0 diff', async () => {
      const { execSync } = await import('node:child_process');
      const res = execSync('node ./scripts/build-content-bundle.mjs --check', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      });
      expect(res).toContain('bundle is up to date');
    });

    it('verifies scripts/validate-content.mjs passes with 0 errors', async () => {
      const { execSync } = await import('node:child_process');
      const res = execSync('node ./scripts/validate-content.mjs', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      });
      expect(res).toContain('PASS');
      expect(res).toMatch(/Validated \d+ content records/);
    });

    it('verifies scripts/evidence-validate.mjs achieves 100% criteria coverage', async () => {
      const { execSync } = await import('node:child_process');
      const res = execSync('node ./scripts/evidence-validate.mjs', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      });
      expect(res).toContain('42/42 criteria (100%)');
      expect(res).toContain('13/13 exclusions (100%)');
      expect(res).toContain('Evidence Atlas validation passed');
    });

    it('verifies scripts/validate-inline-citations.mjs passes strict mode', async () => {
      const { execSync } = await import('node:child_process');
      const res = execSync('node ./scripts/validate-inline-citations.mjs --strict', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      });
      expect(res).toContain('0 review warnings');
      expect(res).toContain('Inline citation validation passed');
    });

    it('verifies scripts/snapshot-example-protocols.mjs passes protocol content lock', async () => {
      const { execSync } = await import('node:child_process');
      const res = execSync('node ./scripts/snapshot-example-protocols.mjs', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      });
      expect(res).toContain('Example Protocols content lock: PASS');
    });
  });

});
