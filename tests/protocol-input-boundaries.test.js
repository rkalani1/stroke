import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  calculateABCD2Score,
  calculateAlteplaseDose,
  calculateGCS,
  calculateICHScore,
  calculateTNKDose,
} from '../src/calculators.js';
import {
  ICH_INITIAL_EVALUATION_ALGORITHM,
  evaluateEVT_Anterior,
  evaluateEVT_Basilar,
  evaluateEVT_M2,
} from '../src/institutional-protocols.js';
import { NeurocheckTimer } from '../src/components.jsx';
import {
  cloneAspectsRegionState,
  getDefaultFuncItems,
  isValidAspectsScore,
  normalizeAspectsScore,
  normalizeFuncItems,
} from '../src/case-state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(REPO, 'src', 'app.jsx'), 'utf8');
const componentsSource = fs.readFileSync(path.join(REPO, 'src', 'components.jsx'), 'utf8');
const managementGuidanceSource = fs.readFileSync(path.join(REPO, 'src', 'management-guidance.js'), 'utf8');
const pocketCardsSource = fs.readFileSync(path.join(REPO, 'src', 'pocket-cards.jsx'), 'utf8');
const ischemicProtocolsSnapshot = fs.readFileSync(
  path.join(REPO, 'tests', 'snapshots', 'example-protocols', 'ischemic.txt'),
  'utf8',
);

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start, `missing source marker: ${startMarker}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing source marker: ${endMarker}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

const calculatorSyncSource = sourceBetween(
  appSource,
  'const CalculatorSync = () =>',
  'const CalculatorPatientSnapshot = () =>',
);

describe('Protocols input-boundary contracts', () => {
  describe('institutional-source-only BP controls', () => {
    it('does not expose or copy an unsourced post-EVT infusion-agent choice', () => {
      expect(appSource).not.toContain('id="postevt-infusion-agent"');
      expect(appSource).not.toContain('postEvt.infusionAgent');
      expect(appSource).not.toContain("nicardipine: 'Nicardipine drip'");
    });

    it('keeps warfarin reversal and fibrinogen wording source-exact', () => {
      expect(appSource).not.toMatch(/given immediately and concurrently when the INR branch indicates PCC/);
      expect(appSource).not.toMatch(/when PCC is indicated by the INR branch below, give it concurrently/);
      expect(appSource).not.toMatch(/immediately, concurrently with vitamin K/);
      expect(appSource).not.toMatch(/Give simultaneously with vitamin K 10 mg IV/);
      expect(appSource).not.toMatch(/if expressed as an endpoint, use fibrinogen/);
      expect(appSource).toContain('Use fibrinogen &lt;200 mg/dL as the action threshold');
    });
  });

  describe('auto-synced reviewed score state', () => {
    it('explicitly invalidates all age-derived reviewed scores when age is cleared or invalid', () => {
      const abcd2AgeSync = sourceBetween(calculatorSyncSource, 'setAbcd2Items(prev =>', 'setIchScoreItems(prev =>');
      const ichAgeSync = sourceBetween(calculatorSyncSource, 'setIchScoreItems(prev =>', 'setHasbledItems(prev =>');
      const chadsAgeSync = sourceBetween(calculatorSyncSource, 'setChads2vascItems(prev =>', 'const ropeAge');

      for (const reviewedAgeSync of [abcd2AgeSync, ichAgeSync, chadsAgeSync]) {
        expect(reviewedAgeSync).toContain('!hasValidAge');
        expect(reviewedAgeSync).toMatch(/criteriaReviewed\s*=\s*invalidateReview\s*\?\s*false/);
      }
    });

    it('invalidates ICH review whenever the standalone GCS inputs change, including within a tier', () => {
      const gcsSyncSource = sourceBetween(
        calculatorSyncSource,
        '// Sync standalone GCS',
        '// Sync calculator inputs',
      );

      expect(gcsSyncSource).toMatch(/gcsSignature\s*=\s*\[gcsItems\.eye,\s*gcsItems\.verbal,\s*gcsItems\.motor\]/);
      expect(gcsSyncSource).toMatch(/prev\.syncedGcsSignature\s*!==\s*gcsSignature/);
      expect(gcsSyncSource).toMatch(/criteriaReviewed\s*=\s*invalidateReview\s*\?\s*false/);
      expect(gcsSyncSource).not.toMatch(/prev\.gcs\s*===\s*gcsCategory\s*\?\s*prev/);
    });

    it('invalidates a reviewed ICH score when entered ABC/2 measurements become incomplete or invalid', () => {
      const volumeSyncSource = sourceBetween(
        appSource,
        "const [ichVolumeParams, setIchVolumeParams] = useState",
        'const ichVolumeEstimate = useMemo',
      );

      // 2026-08-17: the reset is now UNCONDITIONAL on invalid input. It previously ran only when
      // at least one field was still populated, so clearing ALL four fields latched a stale
      // "volume >=30 cc" tick and a stale reviewed flag. Pin the stronger contract.
      expect(volumeSyncSource).not.toMatch(/hasAnyVolumeInput/);
      expect(volumeSyncSource).toMatch(/if \(!hasValidVolumeInputs\)[\s\S]{0,220}volume30: false[\s\S]{0,40}criteriaReviewed: false/);
    });

    it('maps every complete GCS in the 13-15 range to the zero-point ICH tier', () => {
      expect(calculateGCS({ eye: '4', verbal: '3', motor: '6' })).toBe(13);
      expect(calculateGCS({ eye: '4', verbal: '4', motor: '6' })).toBe(14);
      expect(calculateGCS({ eye: '4', verbal: '5', motor: '6' })).toBe(15);
      expect(calculatorSyncSource).toMatch(/gcsTotal\s*<=\s*12\s*\?\s*'gcs512'\s*:\s*'gcs1315'/);
    });
  });

  describe('weight-derived quick dosing', () => {
    it('gates inline dose derivation on the canonical finite 0-350 kg boundary', () => {
      const quickDosingSource = sourceBetween(
        appSource,
        '{/* Quick Dosing Reference */}',
        '<CalculatorSync />',
      );

      expect(appSource).toMatch(
        /const hasValidProtocolDosingWeight\s*=\s*Number\.isFinite\(protocolDosingWeightKg\)\s*&&\s*protocolDosingWeightKg\s*>\s*0\s*&&\s*protocolDosingWeightKg\s*<=\s*350/,
      );
      expect((quickDosingSource.match(/hasValidProtocolDosingWeight\s*\?/g) || []).length).toBe(3);
      expect(quickDosingSource).not.toMatch(/(?:TNK|Alteplase|FFP)[\s\S]*?\$\{protocolDosingWeightKg\s*\*/);
    });

    it('does not derive thrombolytic doses for non-finite or non-positive weights', () => {
      for (const weight of ['', 'not-a-number', Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
        expect(calculateTNKDose(weight)).toBeNull();
        expect(calculateAlteplaseDose(weight)).toBeNull();
      }
      expect(calculateTNKDose(80)).not.toBeNull();
      expect(calculateAlteplaseDose(80)).not.toBeNull();
      expect(calculateTNKDose(350)).not.toBeNull();
      expect(calculateAlteplaseDose(350)).not.toBeNull();
      expect(calculateTNKDose(350.01)).toBeNull();
      expect(calculateAlteplaseDose(351)).toBeNull();
    });
  });

  describe('ASPECTS and FUNC case lifecycle', () => {
    it('normalizes unassessed ASPECTS without losing assessed 0 or 10', () => {
      for (const value of [
        '', '   ', null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, 4.5, 11,
        true, false, [], [10], {}, '0x0a', '1e1', '4.0', '4.5',
      ]) {
        expect(normalizeAspectsScore(value)).toBe('');
        expect(isValidAspectsScore(value)).toBe(false);
      }
      expect(normalizeAspectsScore(0)).toBe(0);
      expect(normalizeAspectsScore('0')).toBe(0);
      expect(normalizeAspectsScore(10)).toBe(10);
      expect(normalizeAspectsScore('10')).toBe(10);
      expect(normalizeAspectsScore(' 7 ')).toBe(7);
      expect(isValidAspectsScore('0')).toBe(false);
      expect(isValidAspectsScore(0)).toBe(true);
      expect(isValidAspectsScore(10)).toBe(true);
    });

    it('uses the ASPECTS sentinel and validator across restore, reset, output, and evaluation paths', () => {
      expect(appSource).toContain("useState(() => normalizeAspectsScore(loadFromStorage('aspectsScore', '')))" );
      expect(appSource).toContain('setAspectsScore(normalizeAspectsScore(formState.aspectsScore))');
      expect(appSource).toContain('setAspectsScore(normalizeAspectsScore(snapshot.aspectsScore))');
      expect(appSource).not.toContain('setAspectsScore(10)');
      expect(appSource).not.toMatch(/aspectsScore\s*!=\s*null|aspectsScore\s*==\s*null|isNaN\(aspectsScore\)/);
      expect(appSource).toContain('const aspects = isValidAspectsScore(aspectsScore) ? aspectsScore : null');
      expect(appSource).toContain('aspectsScore: isValidAspectsScore(aspectsScore) ? aspectsScore : null');
      expect(appSource).toContain('onChange={(e) => setAspectsScore(normalizeAspectsScore(e.target.value))}');
    });

    it('keeps ASPECTS region selections isolated between shift patients', () => {
      const original = [{ id: 'C', checked: true }, { id: 'L', checked: false }];
      const patientA = cloneAspectsRegionState(original);
      const patientB = cloneAspectsRegionState(original);
      patientA[0].checked = false;

      expect(patientB).toEqual(original);
      expect(patientA).not.toBe(patientB);
      expect(patientA[0]).not.toBe(patientB[0]);
      expect(appSource).toContain('aspectsRegionState: cloneAspectsRegionState(aspectsRegionState) || getDefaultAspectsRegionState()');
      expect(appSource).toContain('setAspectsRegionState(cloneAspectsRegionState(formState.aspectsRegionState) || getDefaultAspectsRegionState())');
    });

    it('keeps ABC/2 measurements isolated between shift patients', () => {
      const saveSource = sourceBetween(appSource, 'const saveCurrentPatientToShift =', '// Switch to a different patient');
      const switchSource = sourceBetween(appSource, 'const switchToPatient =', '// Start a new patient');

      expect(saveSource).toContain('ichVolumeParams: { ...ichVolumeParams }');
      expect(switchSource).toContain("setIchVolumeParams(formState.ichVolumeParams || { a: '', b: '', thicknessMm: '', numSlices: '' })");
    });

    it('persists and resets FUNC inputs through every patient and case boundary', () => {
      expect(getDefaultFuncItems()).toEqual({ location: '', preCogImpairment: false });
      expect(normalizeFuncItems({ location: 'deep', preCogImpairment: true })).toEqual({ location: 'deep', preCogImpairment: true });
      expect(normalizeFuncItems(undefined)).toEqual(getDefaultFuncItems());
      for (const contract of [
        "loadFromStorage('funcItems', getDefaultFuncItems())",
        'funcItems: normalizeFuncItems(funcItems)',
        'setFuncItems(normalizeFuncItems(formState.funcItems))',
        'setFuncItems(normalizeFuncItems(snapshot.funcItems))',
        "debouncedSave('funcItems', funcItems)",
        "'ichScoreItems', 'funcItems'",
      ]) expect(appSource).toContain(contract);
      expect((appSource.match(/setFuncItems\(getDefaultFuncItems\(\)\)/g) || []).length).toBeGreaterThanOrEqual(2);
      expect(appSource).toMatch(/\[nihssScore, aspectsScore, gcsItems, mrsScore, ichScoreItems, funcItems,/);
    });

    it('invalidates ICH review when the manual GCS tier changes', () => {
      const ichCard = sourceBetween(appSource, '{/* ICH Score */}', '{/* FUNC Score */}');
      expect(ichCard).toMatch(/onClick=\{\(\) => setIchScoreItems\(prev => \(\{\.\.\.prev, gcs: o\.v, criteriaReviewed: false\}\)\)\}/);
    });
  });

  describe('score completeness and copy suppression', () => {
    it('scores duration >=60 minutes as 2 points with no un-scoreable "exactly 60" option', () => {
      // ABCD² (Johnston Lancet 2007, PMID 17258668): duration >=60 min = 2,
      // 10-59 min = 1, <10 min = 0. The former "Exactly 60 minutes" option had
      // no published score and has been removed.
      const abcd2Card = sourceBetween(appSource, '{/* ABCD2 */}', '{/* CHADS2-VASC */}');
      const completionDefinition = appSource.match(/const abcd2Complete\s*=\s*([^;]+);/)?.[1] || '';

      expect(calculateABCD2Score({ duration: 'duration60' })).toBe(2);
      expect(completionDefinition).not.toContain('durationExactly60');
      expect(abcd2Card).not.toContain("durationExactly60");
      expect(abcd2Card).not.toMatch(/Exactly 60 minutes/);
      expect(abcd2Card).toContain('\\u226560 minutes');
    });

    it('requires complete NIHSS, GCS, ICH, ABCD2, and CHA inputs before exposing copy actions', () => {
      const nihssCard = sourceBetween(appSource, '{/* NIHSS Summary Card */}', '{/* Glasgow Coma Scale */}');
      const gcsCard = sourceBetween(appSource, '{/* Glasgow Coma Scale */}', '{/* ICH Score */}');
      const ichCard = sourceBetween(appSource, '{/* ICH Score */}', '{/* FUNC Score */}');
      const abcd2Card = sourceBetween(appSource, '{/* ABCD2 */}', '{/* CHADS2-VASC */}');
      const chadsCard = sourceBetween(appSource, '{/* CHADS2-VASC */}', '{/* HAS-BLED Score */}');

      expect(appSource).toMatch(/const isNIHSSComplete\s*=\s*\(\)\s*=>\s*\{[\s\S]*nihssItems\.every/);
      expect(nihssCard).toMatch(/\{isNIHSSComplete\(\)\s*&&\s*\([\s\S]*Copy NIHSS score/);
      expect(gcsCard).toMatch(/\{calculateGCS\(gcsItems\)\s*!==\s*null\s*&&\s*\([\s\S]*Copy GCS score/);
      expect(ichCard).toMatch(/\{calculateICHScore\(ichScoreItems\)\s*!==\s*null\s*&&\s*\([\s\S]*Copy ICH score/);
      expect(abcd2Card).toMatch(/\{abcd2Complete\s*&&\s*\([\s\S]*Copy ABCD² score/);
      expect(chadsCard).toMatch(/\{chads2VascComplete\s*&&\s*\([\s\S]*Copy CHADS₂-VASc score/);

      expect(calculateGCS({})).toBeNull();
      expect(calculateGCS({ eye: '4', verbal: '5' })).toBeNull();
      expect(calculateICHScore({ gcs: 'gcs1315' })).toBeNull();
      expect(calculateICHScore({ criteriaReviewed: true })).toBeNull();
      expect(calculateICHScore({ gcs: 'gcs1315', criteriaReviewed: true })).toBe(0);
    });
  });

  describe('timers, adult-only evaluators, and held source claims', () => {
    it('describes scheduled neurocheck times as elapsed and the window as ended, never auto-completed', () => {
      const timerSource = sourceBetween(
        componentsSource,
        'export const NeurocheckTimer',
        '// =========================================================================\n// DAWN/DEFUSE-3',
      );
      const activeHtml = renderToStaticMarkup(
        React.createElement(NeurocheckTimer, {
          tpaGivenIso: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        }),
      );
      const endedHtml = renderToStaticMarkup(
        React.createElement(NeurocheckTimer, {
          tpaGivenIso: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        }),
      );

      expect(activeHtml).toContain('scheduled times elapsed');
      expect(endedHtml).toContain('monitoring window has ended');
      expect(endedHtml).toContain('verify documentation before marking monitoring complete');
      expect(timerSource).not.toMatch(/(?:checks|monitoring)\s+(?:are\s+)?(?:done|completed)/i);
    });

    it('never returns an affirmative adult M2 or basilar EVT result below age 18', () => {
      const anterior = evaluateEVT_Anterior({
        aspectsScore: 8,
        timeFromLKWh: 4,
        nihss: 10,
        preMRS: 0,
        age: 17,
      });
      const m2 = evaluateEVT_M2({
        segment: 'M2-proximal-dominant',
        dominant: true,
        hoursFromLKWh: 4,
        nihss: 10,
        preMRS: 0,
        aspectsScore: 8,
        age: 17,
      });
      const basilar = evaluateEVT_Basilar({
        nihss: 15,
        hoursFromLKWh: 10,
        preMRS: 0,
        pcAspects: 8,
        age: 17,
      });

      expect(anterior.eligible).toBeNull();
      expect(m2.eligible).toBeNull();
      expect(basilar.eligible).toBeNull();
      expect(anterior.reason).toMatch(/adult EVT algorithm does not apply below age 18/i);
      expect(m2.reason).toMatch(/adult EVT algorithm does not apply below age 18/i);
      expect(basilar.reason).toMatch(/adult EVT algorithm does not apply below age 18/i);
    });

    it.each([undefined, '', ' ', Number.NaN, '65 years'])('requires a valid age before any adult EVT evaluator can affirm (%p)', (age) => {
      const results = [
        evaluateEVT_Anterior({ aspectsScore: 8, timeFromLKWh: 4, nihss: 10, preMRS: 0, age }),
        evaluateEVT_M2({ segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: 4, nihss: 10, preMRS: 0, aspectsScore: 8, age }),
        evaluateEVT_Basilar({ nihss: 15, hoursFromLKWh: 10, preMRS: 0, pcAspects: 8, age }),
      ];

      for (const result of results) {
        expect(result.eligible).toBeNull();
        expect(result.reason).toMatch(/enter adult age/i);
      }
    });

    it('prevents the nested adult EVT UI evaluator from affirming known pediatric inputs', () => {
      const evaluatorSource = sourceBetween(
        appSource,
        'const getEvtEligibilityRecommendation =',
        'const buildNursingFlowsheet =',
      );
      const getRecommendation = Function(
        'telestrokeNote',
        evaluatorSource.replace('const getEvtEligibilityRecommendation =', 'return'),
      )({ lkwUnknown: false });
      const common = { age: '17', timeWindow: '0-6', mrs: '0-1', nihss: '10' };
      const cases = [
        { ...common, occlusion: 'lvo', aspects: '6-10' },
        { ...common, occlusion: 'mvo-dominant', aspects: '6-10' },
        { ...common, occlusion: 'mvo-nondominant', aspects: '6-10' },
        { ...common, occlusion: 'mvo-codominant', aspects: '6-10' },
        { ...common, occlusion: 'aca', aspects: '6-10' },
        { ...common, occlusion: 'pca', aspects: '6-10' },
        { ...common, occlusion: 'basilar', pcAspects: '>=6' },
      ];

      for (const inputs of cases) {
        const result = getRecommendation(inputs, { total: 2 });
        expect(result.label).toBe('Adult EVT algorithm does not apply');
        expect(result.classOfRec).toBe('—');
        expect(result.rationale.join(' ')).toMatch(/under 18|pediatric/i);
      }
    });

    it.each([undefined, '', ' ', Number.NaN, '65 years'])('prevents the nested adult EVT UI evaluator from affirming an invalid age (%p)', (age) => {
      const evaluatorSource = sourceBetween(
        appSource,
        'const getEvtEligibilityRecommendation =',
        'const buildNursingFlowsheet =',
      );
      const getRecommendation = Function(
        'telestrokeNote',
        evaluatorSource.replace('const getEvtEligibilityRecommendation =', 'return'),
      )({ lkwUnknown: false });
      const result = getRecommendation({
        age,
        timeWindow: '0-6',
        mrs: '0-1',
        nihss: '10',
        occlusion: 'lvo',
        aspects: '6-10',
      }, { total: 2 });

      expect(result.label).toBe('Enter adult age');
      expect(result.classOfRec).toBe('—');
      expect(result.rationale.join(' ')).toMatch(/valid adult age/i);
    });

    it('remounts PocketCards only at explicit case boundaries', () => {
      expect(appSource).toContain('const [pocketCardsCaseEpoch, setPocketCardsCaseEpoch] = useState(0)');
      expect(appSource).toContain('<PocketCards key={`case-${pocketCardsCaseEpoch}`} defaults={{');
      expect(appSource).not.toContain("<PocketCards key={currentPatientId || 'unsaved-case'}");

      const saveSource = sourceBetween(appSource, 'const saveCurrentPatientToShift =', '// Switch to a different patient');
      const switchSource = sourceBetween(appSource, 'const switchToPatient =', '// Start a new patient');
      const restoreSource = sourceBetween(appSource, 'const restoreCaseSnapshot =', 'const resetCaseState =');
      const resetSource = sourceBetween(appSource, 'const resetCaseState =', 'const clearCurrentCase =');
      const clearLocalSource = sourceBetween(appSource, 'const resetAppStateToDefaults =', 'const navigateTo =');

      expect(saveSource).not.toContain('setPocketCardsCaseEpoch');
      for (const boundarySource of [switchSource, restoreSource, resetSource, clearLocalSource]) {
        expect(boundarySource).toMatch(/setPocketCardsCaseEpoch\(\(epoch\) => epoch \+ 1\)/);
      }
      expect(appSource).toMatch(/const startNewPatient = \(\)[\s\S]*?clearCurrentCase\(\{ generateNewId: true \}\)/);
    });

    it('exposes the late-window consent control at exactly 9 hours', () => {
      expect(pocketCardsSource).toMatch(/parseFloat\(state\.hoursFromLKW\)\s*>=\s*9\s*&&\s*parseFloat\(state\.hoursFromLKW\)\s*<=\s*24/);
    });

    it('uses neutral drawer labels for notice-only calculators', () => {
      const drawerSource = sourceBetween(
        appSource,
        '{/* Calculator Navigation */}',
        'Press Esc to close',
      );

      for (const label of ['HAS-BLED', 'ROPE', 'RCVS\\u00B2']) {
        expect(drawerSource).toContain(`label: '${label}'`);
      }
      expect(drawerSource).not.toMatch(/ICH prognosis|SAH severity|Bleeding risk|PFO attribution|Vasoconstriction/);
    });

    it('keeps the post-EVT SBP helper fail-closed while omitting the Protocols guardrail box', () => {
      const guidanceSource = sourceBetween(
        appSource,
        'function getPostEvtBpGuidance(note)',
        'function buildContraindicationTrace(note)',
      );
      expect(guidanceSource).toContain('const sourceTargetApplies = isSuccessfulEvtReperfusion(grade)');
      expect(guidanceSource).toContain("status: grade ? 'not-qualified' : 'unknown-grade'");
      expect(guidanceSource).toContain("if (!isSuccessfulEvtReperfusion(grade)) return ''");
      expect(appSource).not.toContain('Post-EVT BP Guardrail');
      expect(appSource).not.toContain('reperfusionStatus');
      expect(managementGuidanceSource).toContain('After documented successful EVT recanalization (mTICI >=2b)');
      expect(managementGuidanceSource).toContain("label: 'Post-EVT with documented mTICI >=2b'");
      expect(appSource).toContain('<strong>After documented successful thrombectomy recanalization (mTICI ≥2b):</strong> SBP 140-180');
      expect(appSource).toContain('After documented successful recanalization (mTICI ≥2b), use the BP Management section');

      const snapshotLines = ischemicProtocolsSnapshot.split('\n');
      const targetLineIndexes = snapshotLines
        .map((line, index) => (line.includes('140-180') ? index : -1))
        .filter((index) => index >= 0);
      expect(targetLineIndexes.length).toBeGreaterThan(0);
      for (const index of targetLineIndexes) {
        const localContext = snapshotLines.slice(Math.max(0, index - 2), index + 3).join(' ');
        expect(localContext).toMatch(/document(?:ed)? successful|mTICI\s*(?:>=|≥)2b/i);
      }
    });

    it('keeps MIRROR thresholds on an explicit verify-current owner hold', () => {
      const mirror = ICH_INITIAL_EVALUATION_ALGORITHM.researchScreens.find(
        (screen) => screen.title === 'MIRROR registry screen',
      );

      expect(mirror).toBeDefined();
      expect(mirror.criteria.join(' ')).toMatch(/thresholds are version-sensitive/i);
      expect(mirror.criteria.join(' ')).toMatch(/active registry protocol before use/i);
      expect(mirror.criteria.join(' ')).not.toMatch(/premorbid mRS\s*[<>=]|GCS\s*\d/i);
    });
  });
});
