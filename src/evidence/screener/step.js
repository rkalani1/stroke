import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const STEP = {
    acronym: 'STEP',
    exactFullStudyName: 'StrokeNet Thrombectomy Endovascular Platform',
    sourceHypothesisText:
      'STEP is a Randomized, Multifactorial, Adaptive, Registry-leveraged, Platform trial that seeks to optimize the care of patients with acute ischemic stroke (AIS) due to large or medium vessel occlusions (LVOs and MVOs). The currently open domain looks to expand indication for EVT.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires presentation to the enrolling hospital within 24 hours and arterial puncture within 2 hours of qualifying imaging; this demo does not encode every STEP domain exclusion.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '⚡ EVT Window (≤ 24 hours)',
    externalMetadata: {
      nct: 'NCT06289985',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06289985',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Optimizes endovascular therapy for low NIHSS LVOs or non-dominant MVOs. Excludes dominant M2 branch.',
    pathway:
      'Consult Stroke Research Coordinator / On-Call Stroke Fellow or Endovascular Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Age 18 years or older and pre-stroke mRS 0-2',
      'Presentation to enrolling hospital within 24 hours and arterial puncture within 2 hours of qualifying imaging',
      'Branch 1: LVO patients with mild deficits/low NIHSS; NIHSS 0-5 and complete occlusion of the intracranial ICA or M1 MCA',
      'Branch 2: MVO/DMVO patients with non-dominant/co-dominant M2 or M3 occlusions; NIHSS ≥ 8'
    ],
    exactExclusionCriteria: [
      'CT ASPECT score <6',
      'Acute occlusions in multiple vascular territories',
      'Tandem occlusions'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.aspects < 6) errors.push('CT ASPECTS < 6 / MRI ASPECTS < 7');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');

      const isB1 = p.vessel === 'ica_m1' && p.nihss <= 5;
      const isB2 = p.vessel === 'm2_m3_nd' && p.nihss >= 8;

      if (!isB1 && !isB2) {
        errors.push(
          'Does not meet Branch 1 (NIHSS 0-5 + ICA/M1) or Branch 2 (NIHSS ≥ 8 + non-dominant/co-dominant M2/M3)'
        );
      }
      if (p.vessel === 'dominant_m2') errors.push('Excludes dominant M2 occlusion');
      if (p.vessel === 'dominant_m3') errors.push('Excludes dominant M3 occlusion');
      if (p.exMultipleTerritories) errors.push('Excludes acute occlusions in multiple vascular territories');
      if (p.exTandem) errors.push('Excludes tandem occlusions');
      return errors;
    },
    matchedCriteriaText: (p) => {
      const isB1 = p.vessel === 'ica_m1' && p.nihss !== 'unselected' && p.nihss <= 5;
      const isB2 = p.vessel === 'm2_m3_nd' && p.nihss !== 'unselected' && p.nihss >= 8;
      let branchMatchText = '';
      if (isB1) branchMatchText = 'Meets Branch 1 (Low NIHSS LVO: NIHSS 0-5 + ICA/M1)';
      else if (isB2) branchMatchText = 'Meets Branch 2 (Severe MVO: NIHSS ≥ 8 + non-dominant M2/M3)';

      return [
        'Ischemic Stroke classification selected',
        p.aspects !== 'unselected' && p.aspects >= 6
          ? 'ASPECTS is ' + p.aspects + ' (meets CT ≥ 6 threshold)'
          : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : '',
        branchMatchText
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exTandem ? 'Confirm no tandem occlusions' : '',
        !p.exMultipleTerritories ? 'Confirm no acute occlusions in multiple territories' : '',
        'Confirm vessel anatomy on CTA/MRA (no dominant M2/M3 branch)',
        'Confirm enrolling-hospital presentation and arterial puncture timing per STEP protocol'
      ].filter(Boolean);
    }
  };
