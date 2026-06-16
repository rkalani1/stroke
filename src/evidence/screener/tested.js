import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const TESTED = {
    acronym: 'TESTED',
    exactFullStudyName:
      'Treatment with Endovascular Intervention for Stroke Patients with Existing Disability',
    sourceHypothesisText:
      'A prospective, observational study for persons with a pre-stroke mRS 3-4 experiencing an LVO-AIS, comparing the effectiveness of EVT to MMM.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'Assessment of pre-stroke disability during hospitalization and investigator determination that disability is not temporary are not encoded in this demo.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: 'Presentation ≤ 24 hours',
    externalMetadata: {
      nct: 'NCT05911568',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05911568',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Cohort study comparing EVT to Medical Management in LVO-AIS with pre-stroke mRS 3-4.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke presenting within 24 hours of onset',
      'Caused by occlusion of ICA, M1, or dominant M2',
      'mRS 3-4 for at least 3 months prior to stroke onset',
      'Presenting CT ASPECTS ≥ 3 or MRI ASPECTS ≥ 4',
      'NIHSS ≥ 6'
    ],
    exactExclusionCriteria: [
      'Terminal illness at time of stroke',
      'Assessment of pre-stroke functional status cannot be performed during the hospital stay',
      'Pre-stroke disability deemed temporary by the investigator'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.vessel !== 'ica_m1' && p.vessel !== 'dominant_m2')
        errors.push('Requires ICA, M1, or dominant M2 occlusion');
      if (p.preMrs !== 3 && p.preMrs !== 4) errors.push('Pre-stroke mRS must be exactly 3 or 4');
      if (p.nihss < 6) errors.push('NIHSS < 6');
      if (p.aspects < 3) errors.push('CT ASPECTS < 3 / MRI ASPECTS < 4');
      if (!p.presentedWithin24h) errors.push('Did not present within 24h of onset');
      if (p.exTerminalIllness) errors.push('Excludes terminal illness');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.vessel === 'ica_m1' || p.vessel === 'dominant_m2' ? 'Vessel is ' + p.vessel : '',
        p.preMrs === 3 || p.preMrs === 4 ? 'Pre-stroke mRS is ' + p.preMrs : '',
        p.nihss >= 6 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 6)' : '',
        p.aspects >= 3 ? 'ASPECTS is ' + p.aspects + ' (meets CT ≥ 3 threshold)' : '',
        p.presentedWithin24h === true ? 'Presented to study hospital within 24h of LKW' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient arrived at the facility within 24 hours of stroke onset (presented within 24h)',
        !p.exTerminalIllness ? 'Confirm no terminal illness' : '',
        'Confirm pre-stroke disability has been stable for at least 3 months',
        'Confirm pre-stroke functional status can be assessed during hospitalization and is not temporary'
      ].filter(Boolean);
    }
  };
