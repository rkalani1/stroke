import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { calculateAlteplaseDose, calculateGCS, calculateICHScore, calculateTNKDoseReviewed } from '../src/calculators.js';
import { ICH_INITIAL_EVALUATION_ALGORITHM, evaluateEVT_Anterior, evaluateEVT_Basilar, evaluateEVT_M2 } from '../src/institutional-protocols.js';
const protocolSource = fs.readFileSync(new URL('../src/ProtectedProtocols.jsx', import.meta.url), 'utf8');
const ischemicProtocolsSnapshot = fs.readFileSync(new URL('./snapshots/example-protocols/ischemic.txt', import.meta.url), 'utf8');
describe('Retained protocol input boundaries', () => {
  it('preserves source-exact warfarin reversal and fibrinogen wording in the extracted protected surface', () => {
    expect(protocolSource).not.toMatch(/given immediately and concurrently when the INR branch indicates PCC|immediately, concurrently with vitamin K|Give simultaneously with vitamin K 10 mg IV/);
    expect(protocolSource).toContain('Use fibrinogen &lt;200 mg/dL as the action threshold');
    expect(protocolSource).not.toContain('id="postevt-infusion-agent"');
  });
  it('preserves documented-success qualifiers around the protected post-EVT BP target', () => {
    const lines = ischemicProtocolsSnapshot.split('\n');
    const indices = lines.map((line, index) => line.includes('140-180') ? index : -1).filter(index => index >= 0);
    expect(indices.length).toBeGreaterThan(0);
    for (const index of indices) expect(lines.slice(Math.max(0, index - 2), index + 3).join(' ')).toMatch(/document(?:ed)? successful|mTICI\s*(?:>=|≥)2b/i);
    expect(protocolSource).toContain('After documented successful recanalization (mTICI ≥2b)');
  });
  it('does not replace complete GCS with a partial sum or an invented ICH assessment', () => {
    expect(calculateGCS({})).toBeNull();
    expect(calculateGCS({ eye: '4', verbal: '5' })).toBeNull();
    expect(calculateICHScore({ gcs: 'gcs1315' })).toBeNull();
    for (const verbal of ['3', '4', '5']) expect(calculateGCS({ eye: '4', verbal, motor: '6' })).toBeGreaterThanOrEqual(13);
  });
    it('does not derive thrombolytic doses for non-finite or non-positive weights', () => {
      for (const weight of ['', 'not-a-number', Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
        expect(calculateTNKDoseReviewed(weight)).toBeNull();
        expect(calculateAlteplaseDose(weight)).toBeNull();
      }
      expect(calculateAlteplaseDose(80)).not.toBeNull();
      expect(calculateAlteplaseDose(350)).not.toBeNull();
      expect(calculateTNKDoseReviewed(350)).not.toBeNull();
      expect(calculateTNKDoseReviewed(350.01)).toBeNull();
      expect(calculateAlteplaseDose(351)).toBeNull();
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
