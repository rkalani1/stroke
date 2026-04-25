// src/evidence/__tests__/matcher-engine.test.js
//
// Unit tests for the generic matcher engine. Every operator gets the
// happy-path test plus the unknown-when-input-is-missing case, plus a
// few realistic patient scenarios per active trial.

import { describe, it, expect } from 'vitest';
import {
  evaluateCriterion,
  evaluateActiveTrial,
  resolveField,
  knownFields,
  knownOperators,
  coverageReport,
  diffEvaluations
} from '../matcher-engine.js';
import { activeTrials, getActiveTrial } from '../index.js';

describe('matcher engine — operators', () => {
  describe('>=', () => {
    it('met / not_met / unknown', () => {
      expect(evaluateCriterion({ field: 'age', operator: '>=', value: 18 }, { telestrokeNote: { age: '18' } })).toBe('met');
      expect(evaluateCriterion({ field: 'age', operator: '>=', value: 18 }, { telestrokeNote: { age: '17' } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'age', operator: '>=', value: 18 }, { telestrokeNote: { age: '' } })).toBe('unknown');
      expect(evaluateCriterion({ field: 'age', operator: '>=', value: 18 }, {})).toBe('unknown');
    });
  });

  describe('<=', () => {
    it('met / not_met / unknown', () => {
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: '<=', value: 2 }, { telestrokeNote: { premorbidMRS: '2' } })).toBe('met');
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: '<=', value: 2 }, { telestrokeNote: { premorbidMRS: '0' } })).toBe('met');
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: '<=', value: 2 }, { telestrokeNote: { premorbidMRS: '3' } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: '<=', value: 2 }, {})).toBe('unknown');
    });
  });

  describe('< / >', () => {
    it('strict inequality with hoursFromLKW', () => {
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '<', value: 4.5 }, { hoursFromLKW: 4.4 })).toBe('met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '<', value: 4.5 }, { hoursFromLKW: 4.5 })).toBe('not_met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '>', value: 0 }, { hoursFromLKW: 1 })).toBe('met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '<', value: 4.5 }, {})).toBe('unknown');
    });
  });

  describe('==', () => {
    it('boolean equality', () => {
      expect(evaluateCriterion({ field: 'tnkRecommended', operator: '==', value: false }, { telestrokeNote: { tnkRecommended: false } })).toBe('met');
      expect(evaluateCriterion({ field: 'tnkRecommended', operator: '==', value: false }, { telestrokeNote: { tnkRecommended: true } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'tnkRecommended', operator: '==', value: false }, {})).toBe('unknown');
      expect(evaluateCriterion({ field: 'reperfusion', operator: '==', value: true }, { telestrokeNote: { tnkRecommended: true } })).toBe('met');
      // Subtle case: tnkRecommended === undefined should be unknown, not not_met
      expect(evaluateCriterion({ field: 'tnkRecommended', operator: '==', value: false }, { telestrokeNote: {} })).toBe('unknown');
    });
    it('string equality (diagnosisCategory)', () => {
      expect(evaluateCriterion({ field: 'diagnosisCategory', operator: '==', value: 'ich' }, { telestrokeNote: { diagnosisCategory: 'ich' } })).toBe('met');
      expect(evaluateCriterion({ field: 'diagnosisCategory', operator: '==', value: 'ich' }, { telestrokeNote: { diagnosisCategory: 'ischemic' } })).toBe('not_met');
    });
    it('numeric equality coerces strings', () => {
      expect(evaluateCriterion({ field: 'age', operator: '==', value: 65 }, { telestrokeNote: { age: '65' } })).toBe('met');
      expect(evaluateCriterion({ field: 'age', operator: '==', value: 65 }, { telestrokeNote: { age: '66' } })).toBe('not_met');
    });
  });

  describe('between', () => {
    it('inclusive range with hoursFromLKW', () => {
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: 'between', value: [4.5, 24] }, { hoursFromLKW: 8 })).toBe('met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: 'between', value: [4.5, 24] }, { hoursFromLKW: 4.5 })).toBe('met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: 'between', value: [4.5, 24] }, { hoursFromLKW: 4 })).toBe('not_met');
      expect(evaluateCriterion({ field: 'hoursFromLKW', operator: 'between', value: [4.5, 24] }, {})).toBe('unknown');
    });
    it('age range 18-79 (PICASSO)', () => {
      expect(evaluateCriterion({ field: 'age', operator: 'between', value: [18, 79] }, { telestrokeNote: { age: '50' } })).toBe('met');
      expect(evaluateCriterion({ field: 'age', operator: 'between', value: [18, 79] }, { telestrokeNote: { age: '17' } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'age', operator: 'between', value: [18, 79] }, { telestrokeNote: { age: '80' } })).toBe('not_met');
    });
    it('mRS range 3-4 (TESTED)', () => {
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: 'between', value: [3, 4] }, { telestrokeNote: { premorbidMRS: '3' } })).toBe('met');
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: 'between', value: [3, 4] }, { telestrokeNote: { premorbidMRS: '2' } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'premorbidMRS', operator: 'between', value: [3, 4] }, { telestrokeNote: { premorbidMRS: '' } })).toBe('unknown');
    });
  });

  describe('in', () => {
    it('matches single value against allowed list', () => {
      expect(evaluateCriterion({ field: 'diagnosisCategory', operator: 'in', value: ['ischemic', 'tia'] }, { telestrokeNote: { diagnosisCategory: 'tia' } })).toBe('met');
      expect(evaluateCriterion({ field: 'diagnosisCategory', operator: 'in', value: ['ischemic', 'tia'] }, { telestrokeNote: { diagnosisCategory: 'ich' } })).toBe('not_met');
    });
    it('matches array intersection (vesselOcclusion → ICA/M1/M2)', () => {
      expect(evaluateCriterion({ field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1', 'M2'] }, { telestrokeNote: { vesselOcclusion: ['M1'] } })).toBe('met');
      expect(evaluateCriterion({ field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1', 'M2'] }, { telestrokeNote: { vesselOcclusion: ['M3'] } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1', 'M2'] }, { telestrokeNote: { vesselOcclusion: [] } })).toBe('unknown');
    });
  });

  describe('present (substring / array contains)', () => {
    it('matches free-text fields case-insensitively', () => {
      expect(evaluateCriterion({ field: 'ctpResults', operator: 'present', value: ['mismatch', 'penumbra'] }, { telestrokeNote: { ctpResults: 'CTP shows MISMATCH ratio 1.5' } })).toBe('met');
      expect(evaluateCriterion({ field: 'ctpResults', operator: 'present', value: ['mismatch', 'penumbra'] }, { telestrokeNote: { ctpResults: 'no relevant findings' } })).toBe('not_met');
      expect(evaluateCriterion({ field: 'ctpResults', operator: 'present', value: ['mismatch', 'penumbra'] }, {})).toBe('unknown');
    });
    it('matches array fields (vesselOcclusion present in [M2,M3,...])', () => {
      const c = { field: 'vesselOcclusion', operator: 'present', value: ['ICA', 'M1', 'M2', 'M3'] };
      expect(evaluateCriterion(c, { telestrokeNote: { vesselOcclusion: ['M2'] } })).toBe('met');
      expect(evaluateCriterion(c, { telestrokeNote: { vesselOcclusion: ['P3'] } })).toBe('not_met');
      expect(evaluateCriterion(c, { telestrokeNote: { vesselOcclusion: [] } })).toBe('unknown');
    });
  });

  describe('field resolver', () => {
    it('resolves canonical fields including derived', () => {
      expect(resolveField('age', { telestrokeNote: { age: '70' } })).toBe('70');
      expect(resolveField('reperfusion', { telestrokeNote: { tnkRecommended: true } })).toBe(true);
      expect(resolveField('reperfusion', { telestrokeNote: {} })).toBe(false);
      expect(resolveField('domainMatch', { telestrokeNote: { vesselOcclusion: ['M2'] } })).toBe('mevo');
      expect(resolveField('domainMatch', { telestrokeNote: { vesselOcclusion: ['M1'], nihss: '4' }, nihssScore: 4 })).toBe('low-nihss-lvo');
      expect(resolveField('domainMatch', { telestrokeNote: { vesselOcclusion: ['M1'], nihss: '8' }, nihssScore: 8 })).toBe('none');
      expect(resolveField('domainMatch', { telestrokeNote: { vesselOcclusion: [] } })).toBeNull();
    });
    it('returns undefined for unknown field', () => {
      expect(resolveField('does-not-exist', {})).toBeUndefined();
    });
  });
});

describe('matcher engine — evaluateActiveTrial per-trial scenarios', () => {
  it('SISTER: empty form → needs_info, all 8 unknown', () => {
    const r = evaluateActiveTrial(getActiveTrial('sister'), {});
    expect(r.status).toBe('needs_info');
    expect(r.counts.unknown).toBe(8);
  });

  it('SISTER: full form (eligible) → status eligible', () => {
    const data = {
      telestrokeNote: {
        age: '65',
        nihss: '12',
        premorbidMRS: '1',
        tnkRecommended: false,
        evtRecommended: false,
        ctpResults: 'mismatch on CTP',
        vesselOcclusion: ['M1']
      },
      aspectsScore: 8,
      hoursFromLKW: 8,
      nihssScore: 12
    };
    const r = evaluateActiveTrial(getActiveTrial('sister'), data);
    expect(r.status).toBe('eligible');
    expect(r.counts.met).toBe(8);
  });

  it('SISTER: form with TNK already given → not_eligible (noTNK fails)', () => {
    const data = {
      telestrokeNote: {
        age: '65',
        nihss: '12',
        premorbidMRS: '1',
        tnkRecommended: true,
        evtRecommended: false,
        ctpResults: 'mismatch',
        vesselOcclusion: ['M1']
      },
      aspectsScore: 8,
      hoursFromLKW: 8,
      nihssScore: 12
    };
    const r = evaluateActiveTrial(getActiveTrial('sister'), data);
    expect(r.status).toBe('not_eligible');
  });

  it('STEP-EVT: MeVO patient (M2 occlusion, NIHSS 8, age 50, mRS 1) → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '50',
        nihss: '8',
        premorbidMRS: '1',
        vesselOcclusion: ['M2']
      },
      hoursFromLKW: 6,
      nihssScore: 8
    };
    const r = evaluateActiveTrial(getActiveTrial('step-evt'), data);
    expect(r.status).toBe('eligible');
  });

  it('STEP-EVT: low-NIHSS LVO patient (M1, NIHSS 4) → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '70',
        nihss: '4',
        premorbidMRS: '0',
        vesselOcclusion: ['M1']
      },
      hoursFromLKW: 4,
      nihssScore: 4
    };
    const r = evaluateActiveTrial(getActiveTrial('step-evt'), data);
    expect(r.status).toBe('eligible');
  });

  it('STEP-EVT: high-NIHSS M1 with LVO doesn\'t fit either domain → not_eligible', () => {
    const data = {
      telestrokeNote: {
        age: '70',
        nihss: '15',
        premorbidMRS: '0',
        vesselOcclusion: ['M1']
      },
      hoursFromLKW: 4,
      nihssScore: 15
    };
    const r = evaluateActiveTrial(getActiveTrial('step-evt'), data);
    expect(r.status).toBe('not_eligible');
  });

  it('TESTED: pre-stroke mRS 3-4 LVO patient → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '78',
        nihss: '14',
        premorbidMRS: '3',
        vesselOcclusion: ['M1']
      },
      hoursFromLKW: 10,
      aspectsScore: 6,
      nihssScore: 14
    };
    const r = evaluateActiveTrial(getActiveTrial('tested'), data);
    expect(r.status).toBe('eligible');
  });

  it('PICASSO: tandem lesion patient → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '60',
        nihss: '14',
        premorbidMRS: '1',
        ctaResults: 'tandem extracranial carotid + intracranial M1 occlusion'
      },
      hoursFromLKW: 8,
      aspectsScore: 8
    };
    const r = evaluateActiveTrial(getActiveTrial('picasso'), data);
    expect(r.status).toBe('eligible');
  });

  it('SATURN: lobar ICH on statin → eligible', () => {
    const data = {
      telestrokeNote: { age: '72' },
      ichLocation: 'lobar parietal',
      onStatin: true,
      mrsScore: 3
    };
    const r = evaluateActiveTrial(getActiveTrial('saturn'), data);
    expect(r.status).toBe('eligible');
  });

  it('ASPIRE: ICH + AF + mRS 3 → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '70',
        diagnosisCategory: 'ich',
        pmh: 'long history of afib, htn, dm'
      },
      mrsScore: 3
    };
    const r = evaluateActiveTrial(getActiveTrial('aspire'), data);
    expect(r.status).toBe('eligible');
  });

  it('CAPTIVA: TIA with ICAS → eligible', () => {
    const data = {
      telestrokeNote: {
        age: '60',
        diagnosisCategory: 'tia',
        ctaResults: 'severe MCA stenosis suggestive of intracranial atherosclerosis',
        premorbidMRS: '1'
      }
    };
    const r = evaluateActiveTrial(getActiveTrial('captiva'), data);
    expect(r.status).toBe('eligible');
  });
});

describe('matcher engine — exclusions', () => {
  it('truthy operator: returns true on non-empty string, false on empty/undefined', () => {
    expect(evaluateCriterion({ field: 'lastDOACType', operator: 'truthy', value: true }, { telestrokeNote: { lastDOACType: 'apixaban' } })).toBe('met');
    expect(evaluateCriterion({ field: 'lastDOACType', operator: 'truthy', value: true }, { telestrokeNote: { lastDOACType: '' } })).toBe('not_met');
    expect(evaluateCriterion({ field: 'lastDOACType', operator: 'truthy', value: true }, {})).toBe('not_met');
  });

  it('SISTER: priorStroke90d=true triggers exclusion → not_eligible', () => {
    const data = {
      telestrokeNote: { age: '65', nihss: '12', premorbidMRS: '1', tnkRecommended: false, evtRecommended: false, ctpResults: 'mismatch', vesselOcclusion: ['M1'] },
      aspectsScore: 8, hoursFromLKW: 8, nihssScore: 12,
      priorStroke90d: true
    };
    const r = evaluateActiveTrial(getActiveTrial('sister'), data);
    expect(r.status).toBe('not_eligible');
    expect(r.exclusions.some((x) => x.id === 'priorStroke90d')).toBe(true);
  });

  it('SISTER: lastDOACType=apixaban triggers onAnticoag exclusion via truthy', () => {
    const data = {
      telestrokeNote: { age: '65', nihss: '12', premorbidMRS: '1', tnkRecommended: false, evtRecommended: false, ctpResults: 'mismatch', vesselOcclusion: ['M1'], lastDOACType: 'apixaban' },
      aspectsScore: 8, hoursFromLKW: 8, nihssScore: 12
    };
    const r = evaluateActiveTrial(getActiveTrial('sister'), data);
    expect(r.status).toBe('not_eligible');
    expect(r.exclusions.some((x) => x.id === 'onAnticoag')).toBe(true);
  });

  it('SISTER: undefined exclusion fields → no triggers (eligible patient stays eligible)', () => {
    const data = {
      telestrokeNote: { age: '65', nihss: '12', premorbidMRS: '1', tnkRecommended: false, evtRecommended: false, ctpResults: 'mismatch', vesselOcclusion: ['M1'] },
      aspectsScore: 8, hoursFromLKW: 8, nihssScore: 12
    };
    const r = evaluateActiveTrial(getActiveTrial('sister'), data);
    expect(r.status).toBe('eligible');
    expect(r.exclusions).toEqual([]);
  });

  it('STEP-EVT: pregnancy exclusion overrides eligibility', () => {
    const data = {
      telestrokeNote: { age: '32', nihss: '8', premorbidMRS: '0', vesselOcclusion: ['M2'] },
      aspectsScore: 8, hoursFromLKW: 6, nihssScore: 8,
      pregnancy: true
    };
    const r = evaluateActiveTrial(getActiveTrial('step-evt'), data);
    expect(r.status).toBe('not_eligible');
    expect(r.exclusions.some((x) => x.id === 'pregnancy')).toBe(true);
  });

  it('every active trial has matcherExclusions populated (16 across 11 trials)', () => {
    let total = 0;
    for (const t of activeTrials) {
      total += (t.matcherExclusions || []).length;
    }
    expect(total).toBeGreaterThan(0);
    expect(total).toBe(16); // matches legacy inventory
  });
});

describe('matcher engine — coverage and disagreement reports', () => {
  it('coverageReport reaches 100% on the seeded matcherCriteria', () => {
    const cov = coverageReport(activeTrials);
    expect(cov.total).toBeGreaterThan(0);
    expect(cov.covered).toBe(cov.total);
    expect(cov.percent).toBe(100);
    expect(cov.gaps).toEqual([]);
  });

  it('coverageReport also reports exclusions coverage at 100%', () => {
    const cov = coverageReport(activeTrials);
    expect(cov.exclusionsTotal).toBeGreaterThan(0);
    expect(cov.exclusionsCovered).toBe(cov.exclusionsTotal);
    expect(cov.exclusionsPercent).toBe(100);
  });

  it('knownFields and knownOperators expose the engine vocabulary', () => {
    const f = knownFields();
    const o = knownOperators();
    expect(f.has('age')).toBe(true);
    expect(f.has('reperfusion')).toBe(true); // derived
    expect(f.has('domainMatch')).toBe(true);  // derived
    expect(o.has('>=')).toBe(true);
    expect(o.has('between')).toBe(true);
    expect(o.has('present')).toBe(true);
  });

  it('diffEvaluations finds criterion-level and overall disagreements', () => {
    const engine = {
      criteria: [
        { id: 'age', status: 'met' },
        { id: 'nihss', status: 'unknown' }
      ],
      status: 'needs_info'
    };
    const legacy = {
      criteria: [
        { id: 'age', status: 'unknown' },
        { id: 'nihss', status: 'unknown' }
      ],
      status: 'needs_info'
    };
    const diffs = diffEvaluations(engine, legacy);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].criterion).toBe('age');
    expect(diffs[0].engineStatus).toBe('met');
    expect(diffs[0].legacyStatus).toBe('unknown');
  });

  it('diffEvaluations reports overall status mismatch', () => {
    const engine = { criteria: [{ id: 'age', status: 'met' }], status: 'eligible' };
    const legacy = { criteria: [{ id: 'age', status: 'met' }], status: 'needs_info' };
    const diffs = diffEvaluations(engine, legacy);
    expect(diffs.some((d) => d.kind === 'overall')).toBe(true);
  });
});
