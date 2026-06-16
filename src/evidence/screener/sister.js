import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const SISTER = {
    acronym: 'SISTER',
    exactFullStudyName: 'Strategy for Improving Stroke Treatment Response',
    sourceHypothesisText:
      'A Phase-2, prospective, randomized, placebo-controlled, blinded, dose finding trial that aims to determine the safety and preliminary efficacy of TS23, a monoclonal antibody against the alpha-2 antiplasmin (a2-AP), in acute ischemic stroke.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov also requires favorable perfusion mismatch/core imaging and study drug within 120 minutes of qualifying perfusion imaging.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '4.5 – 24 hours',
    externalMetadata: {
      nct: 'NCT05948566',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05948566',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Evaluates TS23 mAb (anti-alpha-2-antiplasmin) in AIS presenting within 4.5-24h without thrombolysis or EVT clot engagement.',
    pathway: 'Consult Stroke Research Coordinator / On-Call Stroke Fellow',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Anterior circulation acute ischemic stroke',
      'Onset within 4.5-24 hours',
      'NIHSS ≥ 4',
      'ASPECTS 6 or more on CT or ASPECTS 7 or more on MRI',
      'Favorable perfusion imaging mismatch/core profile'
    ],
    exactExclusionCriteria: [
      'Received thrombolysis',
      'Received EVT with clot engagement',
      'Known stroke in past 90 days',
      'Pre stroke MRS > 2'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (!p.anteriorCirculation) errors.push('Requires anterior circulation stroke');
      if (p.onsetHours < 4.5 || p.onsetHours > 24) errors.push('LKW-to-treatment window not 4.5-24h');
      if (p.nihss < 4) errors.push('NIHSS < 4');
      if (p.aspects < 6) errors.push('CT ASPECTS < 6');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');
      if (p.exThrombolysis) errors.push('Excludes prior thrombolysis');
      if (p.exEvt) errors.push('Excludes prior EVT clot engagement');
      if (p.exStroke90d) errors.push('Excludes stroke in past 90 days');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.anteriorCirculation === true ? 'Anterior circulation confirmed' : '',
        p.onsetHours >= 4.5 && p.onsetHours <= 24 ? 'LKW-to-treatment in 4.5-24h window' : '',
        p.nihss >= 4 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 4)' : '',
        p.aspects >= 6 ? 'ASPECTS is ' + p.aspects + ' (meets ≥ 6)' : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm stroke is in the anterior circulation (anterior circulation stroke is required)',
        !p.exThrombolysis ? 'Confirm no prior thrombolysis administered' : '',
        !p.exEvt ? 'Confirm no prior EVT with clot engagement' : '',
        !p.exStroke90d ? 'Confirm no stroke in the past 90 days' : '',
        'Confirm favorable CT/MR perfusion mismatch/core criteria and study-drug timing per protocol'
      ].filter(Boolean);
    }
  };
