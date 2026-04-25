// src/evidence/legacy-criteria.js
//
// Legacy active-trial criterion configuration and evaluator.
//
// Extracted verbatim from src/app.jsx so:
//   1. It can be unit-tested without React.
//   2. The parity test suite can run both this evaluator and the
//      generic engine over the same synthetic patient scenarios.
//   3. Future retirement is a single-line replacement (drop the import,
//      use the engine instead).
//
// Behavior is unchanged from the inline version that shipped in
// commits c4c02b0 → fac983f. Anything that can be expressed as
// declarative matcherCriteria already lives there; this module is the
// inline-imperative bridge while parity is being established.

import {
  tryInt,
  ageOf,
  nihssOf,
  premorbidOf,
  trialGte,
  trialLte,
  boolEq,
  numInRange,
  numLt,
  hoursInRange,
  hoursLte,
  hoursLt,
  stringContainsAny,
  arrayContainsAny
} from './matcher-helpers.js';

const TRIAL_ELIGIBILITY_CONFIG = {
  SISTER: {
    id: 'SISTER',
    name: 'SISTER Trial',
    nct: 'NCT05948566',
    category: 'ischemic',
    quickDescription: 'Late thrombolysis (4.5-24h) for anterior circulation stroke, no TNK/EVT',
    keyTakeaways: [
      'Tests whether IV thrombolysis benefits patients 4.5-24h from LKW who are NOT candidates for EVT',
      'Requires perfusion mismatch on CTP — target is the "TIMELESS-ineligible" population',
      'If positive, could expand treatment to patients who currently receive no acute reperfusion therapy'
    ],
    lookingFor: [
      'Anterior circulation stroke',
      'Late presenter (4.5-24h from LKW)',
      'NOT getting TNK or EVT',
      'Has salvageable tissue on CTP (mismatch profile)'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'nihss', label: 'NIHSS ≥6 (or 4-5 disabling)', field: 'nihss', evaluate: (data) => trialGte(nihssOf(data), 6), required: true },
      { id: 'timeWindow', label: '4.5-24h from LKW', field: 'lkw', evaluate: (data) => hoursInRange(data.hoursFromLKW, 4.5, 24), required: true },
      { id: 'noTNK', label: 'No IV thrombolysis', field: 'tnkRecommended', evaluate: (data) => boolEq(data.telestrokeNote?.tnkRecommended, false), required: true },
      { id: 'noEVT', label: 'No EVT planned', field: 'evtRecommended', evaluate: (data) => boolEq(data.telestrokeNote?.evtRecommended, false), required: true },
      { id: 'aspects', label: 'ASPECTS ≥6', field: 'aspects', evaluate: (data) => trialGte(data.aspectsScore, 6), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 2), required: true },
      { id: 'ctpMismatch', label: 'CTP mismatch profile', field: 'ctpResults', evaluate: (data) => stringContainsAny(data.telestrokeNote?.ctpResults, ['mismatch','penumbra','salvageable']), required: true }
    ],
    exclusionFlags: [
      { id: 'priorStroke90d', label: 'Prior stroke <90 days', field: 'priorStroke90d' },
      { id: 'priorICH', label: 'Prior intracranial hemorrhage', field: 'priorICH' },
      { id: 'onAnticoag', label: 'On anticoagulation', field: 'lastDOACType', evaluate: (data) => !!data.telestrokeNote?.lastDOACType }
    ]
  },
  STEP: {
    id: 'STEP',
    name: 'STEP-EVT Trial',
    nct: 'NCT06289985',
    category: 'ischemic',
    quickDescription: 'Adaptive platform for mild LVO or medium/distal vessel occlusions',
    keyTakeaways: [
      'NIH StrokeNet adaptive platform with two domains: mild stroke with LVO (NIHSS 0-5) and medium/distal vessel occlusions (M2-M4, A1-A3, P1-P3)',
      'ESCAPE-MeVO (2025) showed no routine functional benefit of EVT for isolated MeVO; STEP aims to identify specific subgroups that may still benefit',
      'Adaptive design allows rapid testing of multiple EVT devices and techniques'
    ],
    lookingFor: [
      'Two domains: Low NIHSS with LVO, OR Medium/Distal Vessel Occlusion',
      'Low NIHSS (0-5) + ICA/M1 occlusion, or',
      'M2/M3/M4, A1-A3, P1-P3 occlusion regardless of NIHSS'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'timeWindow', label: 'Within 24h from LKW', field: 'lkw', evaluate: (data) => hoursLte(data.hoursFromLKW, 24), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 2), required: true },
      { id: 'vesselOcclusion', label: 'LVO or MeVO present', field: 'vesselOcclusion', evaluate: (data) => (() => { const occ = data.telestrokeNote?.vesselOcclusion || []; return occ.length === 0 ? null : true; })(), required: true },
      { id: 'domainMatch', label: 'Matches Low-NIHSS or MeVO domain', field: 'nihss', evaluate: (data) => {
          const nihss = tryInt(nihssOf(data));
          const occlusion = data.telestrokeNote?.vesselOcclusion || [];
          // MeVO domain doesn't depend on NIHSS — evaluate first.
          const mevoMatch = occlusion.some(v => ['M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'].includes(v));
          if (mevoMatch) return true;
          // Low NIHSS domain requires both NIHSS and occlusion data.
          if (nihss === null || occlusion.length === 0) return null;
          return nihss <= 5 && (occlusion.includes('ICA') || occlusion.includes('M1'));
        }, required: true }
    ],
    exclusionFlags: [
      { id: 'pregnancy', label: 'Pregnancy', field: 'pregnancy' },
      { id: 'hemorrhage', label: 'Evidence of hemorrhage', field: 'hemorrhage' }
    ]
  },
  PICASSO: {
    id: 'PICASSO',
    name: 'PICASSO Trial',
    nct: 'NCT05611242',
    category: 'ischemic',
    quickDescription: 'Tandem lesion: carotid stenosis + intracranial LVO',
    keyTakeaways: [
      'Tandem lesions (extracranial carotid + intracranial LVO) are common but excluded from most EVT trials',
      'Tests emergent carotid stenting + EVT vs EVT alone for tandem occlusions',
      'Addresses a gap where no RCT has established optimal management of the extracranial component'
    ],
    lookingFor: [
      'Tandem lesion (carotid + intracranial)',
      'Extracranial ICA stenosis 70-100%',
      'Plus intracranial LVO (ICA-T, M1, proximal M2)'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age 18-79', field: 'age', evaluate: (data) => {
          const age = tryInt(ageOf(data));
          return age === null ? null : (age >= 18 && age <= 79);
        }, required: true },
      { id: 'timeWindow', label: 'Within 16h from LKW', field: 'lkw', evaluate: (data) => hoursLte(data.hoursFromLKW, 16), required: true },
      { id: 'nihss', label: 'NIHSS ≥4', field: 'nihss', evaluate: (data) => trialGte(nihssOf(data), 4), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS 0-2', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 2), required: true },
      { id: 'aspects', label: 'ASPECTS ≥7', field: 'aspects', evaluate: (data) => trialGte(data.aspectsScore, 7), required: true },
      { id: 'tandemLesion', label: 'Tandem lesion present', field: 'ctaResults', evaluate: (data) => (() => { const s = data.telestrokeNote?.ctaResults || data.strokeCodeForm?.cta; if (!s) return null; const r = stringContainsAny(s, ['tandem']); if (r === true) return true; const r2 = stringContainsAny(s, ['carotid']); const r3 = stringContainsAny(s, ['m1','ica']); return r2 === true && r3 === true; })(), required: true }
    ],
    exclusionFlags: []
  },
  TESTED: {
    id: 'TESTED',
    name: 'TESTED',
    nct: 'NCT05911568',
    category: 'ischemic',
    quickDescription: 'EVT in patients with pre-existing disability (mRS 3-4)',
    keyTakeaways: [
      'All major EVT trials excluded patients with pre-existing disability (mRS 3-4)',
      'These patients are routinely denied EVT despite no evidence of futility',
      'If positive, would extend EVT eligibility to a large underserved population'
    ],
    lookingFor: [
      'Patient with EXISTING disability (mRS 3-4)',
      'LVO stroke within 24h',
      'ASPECTS ≥3'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS 3-4', field: 'premorbidMRS', evaluate: (data) => {
          const mrs = tryInt(premorbidOf(data));
          return mrs === null ? null : (mrs >= 3 && mrs <= 4);
        }, required: true },
      { id: 'nihss', label: 'NIHSS ≥6', field: 'nihss', evaluate: (data) => trialGte(nihssOf(data), 6), required: true },
      { id: 'timeWindow', label: 'Within 24h from LKW', field: 'lkw', evaluate: (data) => hoursLte(data.hoursFromLKW, 24), required: true },
      { id: 'aspects', label: 'ASPECTS ≥3', field: 'aspects', evaluate: (data) => trialGte(data.aspectsScore, 3), required: true },
      { id: 'lvo', label: 'LVO present', field: 'vesselOcclusion', evaluate: (data) => arrayContainsAny(data.telestrokeNote?.vesselOcclusion, ['ICA','M1','M2']), required: true }
    ],
    exclusionFlags: []
  },
  SATURN: {
    id: 'SATURN',
    name: 'SATURN Trial',
    nct: 'NCT03936361',
    category: 'ich',
    quickDescription: 'Statin continuation vs discontinuation after lobar ICH',
    keyTakeaways: [
      'Lobar ICH raises concern for CAA — statins may increase recurrent ICH risk in CAA patients',
      'Many patients are on statins for cardiovascular prevention; stopping may increase MACE risk',
      'First RCT to directly address the statin dilemma after lobar ICH'
    ],
    lookingFor: [
      'Lobar ICH (NOT deep/basal ganglia)',
      'Already on statin therapy',
      'Age ≥50'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥50', field: 'age', evaluate: (data) => trialGte(ageOf(data), 50), required: true },
      { id: 'lobarICH', label: 'Lobar ICH location', field: 'ichLocation', evaluate: (data) => stringContainsAny(data.ichLocation, ['lobar','cortical']), required: true },
      { id: 'onStatin', label: 'On statin at ICH onset', field: 'onStatin', evaluate: (data) => boolEq(data.onStatin, true), required: true },
      { id: 'mrs', label: 'mRS ≤4 at randomization', field: 'mrsScore', evaluate: (data) => trialLte(data.mrsScore, 4), required: true }
    ],
    exclusionFlags: [
      { id: 'deepICH', label: 'Deep/non-lobar ICH', field: 'ichLocation' },
      { id: 'recentMI', label: 'Recent MI <3 months', field: 'recentMI' }
    ]
  },
  ASPIRE: {
    id: 'ASPIRE',
    name: 'ASPIRE Trial',
    nct: 'NCT03907046',
    category: 'ich',
    quickDescription: 'Apixaban vs aspirin post-ICH in atrial fibrillation',
    keyTakeaways: [
      'ICH patients with AF face a dilemma: anticoagulation prevents ischemic stroke but may cause recurrent ICH',
      'PRESTIGE-AF showed non-inferiority of DOAC vs no anticoag; ASPIRE directly compares apixaban to aspirin',
      'Enrollment window is 14-180 days post-ICH — flag for outpatient follow-up'
    ],
    lookingFor: [
      'ICH patient with atrial fibrillation',
      'Randomize 14-180 days post-ICH',
      'CHA2DS2-VASc ≥2'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'ichConfirmed', label: 'ICH confirmed', field: 'diagnosis', evaluate: (data) => boolEq(data.telestrokeNote?.diagnosisCategory, 'ich'), required: true },
      { id: 'afib', label: 'Atrial fibrillation', field: 'pmh', evaluate: (data) => stringContainsAny(data.telestrokeNote?.pmh, ['afib','atrial fib','af ','a-fib']), required: true },
      { id: 'mrs', label: 'mRS ≤4', field: 'mrsScore', evaluate: (data) => trialLte(data.mrsScore, 4), required: true }
    ],
    exclusionFlags: [
      { id: 'mechValve', label: 'Mechanical heart valve', field: 'mechValve' }
    ]
  },
  VERIFY: {
    id: 'VERIFY',
    name: 'VERIFY Study',
    nct: 'NCT05338697',
    category: 'ischemic',
    quickDescription: 'Observational: TMS/MRI to predict motor recovery',
    keyTakeaways: [
      'Uses TMS + MRI biomarkers to predict upper extremity motor recovery trajectory',
      'Observational — enrollment is straightforward with minimal patient burden',
      'Could establish precision rehab: matching therapy intensity to predicted recovery potential'
    ],
    lookingFor: [
      'Acute ischemic stroke within 7 days',
      'Upper extremity weakness',
      'Inpatient enrollment opportunity'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'ueWeakness', label: 'Upper extremity weakness', field: 'symptoms', evaluate: (data) => stringContainsAny(data.telestrokeNote?.symptoms, ['arm','upper','hand','weakness']), required: false },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 2), required: true }
    ],
    exclusionFlags: [
      { id: 'seizures', label: 'History of seizures', field: 'seizures' },
      { id: 'implants', label: 'Implanted devices (pacemaker, etc.)', field: 'implants' }
    ]
  },
  DISCOVERY: {
    id: 'DISCOVERY',
    name: 'DISCOVERY Study',
    nct: 'NCT04916210',
    category: 'ischemic',
    quickDescription: 'Observational: Cognitive trajectories post-stroke',
    keyTakeaways: [
      'Maps cognitive decline trajectories after stroke (AIS, ICH, and SAH) over 2 years',
      'Aims to identify modifiable risk factors for post-stroke cognitive impairment',
      'Low barrier — observational with cognitive testing at standard follow-up intervals'
    ],
    lookingFor: [
      'Any stroke type (AIS, ICH, SAH)',
      'Baseline visit within 6 weeks',
      'Able to complete cognitive testing'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'strokeConfirmed', label: 'Stroke confirmed (AIS/ICH/SAH)', field: 'diagnosis', evaluate: (data) => (() => { const c = data.telestrokeNote?.diagnosisCategory; if (c === undefined || c === null || c === '') return null; return ['ischemic','ich','sah'].includes(c); })(), required: true }
    ],
    exclusionFlags: [
      { id: 'preDementia', label: 'Pre-existing dementia', field: 'preDementia' }
    ]
  },
  MOST: {
    id: 'MOST',
    name: 'MOST Trial',
    nct: 'NCT05326139',
    category: 'ischemic',
    quickDescription: 'Multi-arm thrombolysis optimization: TNK dose-finding and adjunctive nerinetide',
    keyTakeaways: [
      'Adaptive platform testing TNK 0.40 mg/kg (higher dose) vs standard 0.25 mg/kg for AIS with LVO',
      'Also testing nerinetide (NA-1) as neuroprotective adjunct to EVT',
      'Could establish optimized TNK dosing for LVO patients proceeding to EVT'
    ],
    lookingFor: [
      'Acute ischemic stroke with LVO',
      'Eligible for IV thrombolysis',
      'Within 4.5 hours from LKW',
      'Age 18+'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'nihss', label: 'NIHSS ≥6', field: 'nihss', evaluate: (data) => trialGte(nihssOf(data), 6), required: true },
      { id: 'timeWindow', label: 'Within 4.5h from LKW', field: 'lkw', evaluate: (data) => hoursLt(data.hoursFromLKW, 4.5), required: true },
      { id: 'lvo', label: 'LVO confirmed (ICA/M1)', field: 'vesselOcclusion', evaluate: (data) => arrayContainsAny(data.telestrokeNote?.vesselOcclusion, ['ICA','M1']), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS 0-1', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 1), required: true }
    ],
    exclusionFlags: [
      { id: 'onAnticoag', label: 'On anticoagulation', field: 'onAnticoag' },
      { id: 'hemorrhage', label: 'Evidence of hemorrhage on CT', field: 'hemorrhage' }
    ]
  },
  CAPTIVA: {
    id: 'CAPTIVA',
    name: 'CAPTIVA Trial',
    nct: 'NCT05047172',
    category: 'ischemic',
    quickDescription: 'Ticagrelor+ASA vs rivaroxaban+ASA vs clopidogrel+ASA for intracranial atherosclerosis',
    keyTakeaways: [
      'Three-arm trial for symptomatic intracranial atherosclerotic stenosis (ICAS) 70-99%',
      'Tests ticagrelor+ASA and low-dose rivaroxaban+ASA against standard clopidogrel+ASA',
      'Addresses a major unmet need — recurrent stroke risk is 12-20% at 1 year despite DAPT for ICAS'
    ],
    lookingFor: [
      'Symptomatic intracranial stenosis 70-99%',
      'Ischemic stroke or TIA attributed to ICAS',
      'Within 21 days of qualifying event',
      'Age ≥30'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥30', field: 'age', evaluate: (data) => trialGte(ageOf(data), 30), required: true },
      { id: 'diagnosis', label: 'Ischemic stroke or TIA', field: 'diagnosis', evaluate: (data) => (() => { const c = data.telestrokeNote?.diagnosisCategory; if (c === undefined || c === null || c === '') return null; return c === 'ischemic' || c === 'tia'; })(), required: true },
      { id: 'icas', label: 'Intracranial stenosis 70-99% (ICAS)', field: 'ctaResults', evaluate: (data) => stringContainsAny(data.telestrokeNote?.ctaResults, ['stenosis','intracranial','icas','atheroscler']), required: true },
      { id: 'premorbidMRS', label: 'mRS ≤3', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 3), required: true }
    ],
    exclusionFlags: [
      { id: 'cardioembolic', label: 'Cardioembolic source (AF, valve)', field: 'cardioembolic' },
      { id: 'onAnticoag', label: 'On full-dose anticoagulation', field: 'onAnticoag' }
    ]
  },
  RHAPSODY: {
    id: 'RHAPSODY',
    name: 'RHAPSODY Trial',
    nct: 'NCT04953325',
    category: 'ischemic',
    quickDescription: '3K3A-APC neuroprotection after thrombolysis/EVT for moderate-severe AIS',
    keyTakeaways: [
      '3K3A-APC (activated protein C variant) showed signal for reduced ICH and improved outcomes in phase 2',
      'First neuroprotective agent with mechanistic basis in stroke (anti-inflammatory, anti-apoptotic, BBB stabilization)',
      'Given as IV infusion after reperfusion — does not delay standard treatment'
    ],
    lookingFor: [
      'Moderate-severe acute ischemic stroke (NIHSS ≥5)',
      'Received IVT and/or EVT',
      'Can start study drug within 15h of LKW',
      'Age 18+'
    ],
    keyCriteria: [
      { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => trialGte(ageOf(data), 18), required: true },
      { id: 'nihss', label: 'NIHSS ≥5', field: 'nihss', evaluate: (data) => trialGte(nihssOf(data), 5), required: true },
      { id: 'reperfusion', label: 'Received IVT and/or EVT', field: 'tnkRecommended', evaluate: (data) => {
          return data.telestrokeNote?.tnkRecommended === true || data.telestrokeNote?.evtRecommended === true;
        }, required: true },
      { id: 'timeWindow', label: 'Within 15h from LKW', field: 'lkw', evaluate: (data) => hoursLte(data.hoursFromLKW, 15), required: true },
      { id: 'premorbidMRS', label: 'Pre-stroke mRS 0-2', field: 'premorbidMRS', evaluate: (data) => trialLte(premorbidOf(data), 2), required: true }
    ],
    exclusionFlags: [
      { id: 'hemorrhage', label: 'Symptomatic ICH', field: 'hemorrhage' }
    ]
  }
};

// ============================================================================
// EVALUATORS
// ============================================================================

// ELIGIBILITY EVALUATION FUNCTION
// =================================================================
const evaluateTrialEligibility = (trialId, data) => {
  const config = TRIAL_ELIGIBILITY_CONFIG[trialId];
  if (!config) return null;

  const results = {
    trialId,
    trialName: config.name,
    category: config.category,
    quickDescription: config.quickDescription,
    lookingFor: config.lookingFor,
    keyTakeaways: config.keyTakeaways || [],
    nct: config.nct,
    criteria: [],
    exclusions: [],
    status: 'pending', // 'eligible', 'not_eligible', 'needs_info', 'pending'
    metCount: 0,
    notMetCount: 0,
    unknownCount: 0,
    requiredMissing: 0
  };

  // Evaluate key criteria
  config.keyCriteria.forEach(criterion => {
    let status = 'unknown';
    let value = null;

    try {
      const evalResult = criterion.evaluate(data);
      if (evalResult === true) {
        status = 'met';
        results.metCount++;
      } else if (evalResult === false) {
        status = 'not_met';
        results.notMetCount++;
        if (criterion.required) results.requiredMissing++;
      } else {
        status = 'unknown';
        results.unknownCount++;
      }
    } catch (e) {
      status = 'unknown';
      results.unknownCount++;
    }

    results.criteria.push({
      id: criterion.id,
      label: criterion.label,
      status,
      required: criterion.required
    });
  });

  // Evaluate exclusion flags
  config.exclusionFlags.forEach(exclusion => {
    let triggered = false;
    try {
      if (exclusion.evaluate) {
        triggered = exclusion.evaluate(data);
      } else {
        triggered = data[exclusion.field] === true;
      }
    } catch (e) {
      triggered = false;
    }

    if (triggered) {
      results.exclusions.push({
        id: exclusion.id,
        label: exclusion.label,
        triggered: true
      });
      results.notMetCount++;
      results.status = 'not_eligible';
    }
  });

  // Determine overall status
  if (results.exclusions.some(e => e.triggered)) {
    results.status = 'not_eligible';
  } else if (results.requiredMissing > 0) {
    results.status = 'not_eligible';
  } else if (results.unknownCount > 0) {
    results.status = 'needs_info';
  } else if (results.notMetCount === 0) {
    results.status = 'eligible';
  } else {
    results.status = 'not_eligible';
  }

  return results;
};

// Evaluate all trials for current patient
const evaluateAllTrials = (data) => {
  const results = {};
  Object.keys(TRIAL_ELIGIBILITY_CONFIG).forEach(trialId => {
    results[trialId] = evaluateTrialEligibility(trialId, data);
  });
  return results;
};

export {
  TRIAL_ELIGIBILITY_CONFIG,
  evaluateTrialEligibility,
  evaluateAllTrials
};
