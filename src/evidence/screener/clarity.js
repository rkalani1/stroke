import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const CLARITY = {
    acronym: 'CLARITY',
    exactFullStudyName: 'Cilostazol for Prevention of Recurrent Stroke',
    sourceHypothesisText:
      'A Phase 3 randomized trial evaluating cilostazol for prevention of recurrent stroke in patients with stroke or TIA within 180 days who are taking aspirin or clopidogrel, but not both.',
    status: 'soon',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov overall status as of 2026-05-28: NOT_YET_RECRUITING; listed study start date 2026-08.',
      "Public CT.gov eligibility text for NCT07174414 does not state the older draft's stroke-subtype or TIA risk-score thresholds; those criteria are not used in this demo."
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 180 days',
    externalMetadata: {
      nct: 'NCT07174414',
      registryUrl: 'https://clinicaltrials.gov/study/NCT07174414',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Phase 3 trial of cilostazol in stroke or TIA within 180 days while taking aspirin or clopidogrel, but not both.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Stroke or TIA within 180 days',
      'Age ≥ 40 years',
      'Currently taking aspirin or clopidogrel, but not both'
    ],
    exactExclusionCriteria: [
      'Spontaneous brain hemorrhage within the last 2 years',
      'Moderate to severe heart failure',
      'Life expectancy < 6 months'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'tia') {
        errors.push('Requires Ischemic Stroke or TIA');
      }
      if (p.onsetDays > 180) errors.push('Stroke/TIA occurred > 180 days ago');
      if (p.age < 40) errors.push('Age < 40');
      if (!p.singleAntiplateletSoc) {
        errors.push('Requires standard-of-care single antiplatelet (Aspirin or Clopidogrel)');
      }
      if (p.exBrainBleed2y) errors.push('Excludes spontaneous brain hemorrhage within the last 2 years');
      if (p.exCongestiveHeartFailure)
        errors.push('Excludes moderate-to-severe heart failure / congestive heart failure');
      return errors;
    },
    matchedCriteriaText: (p) => {
      const isWithinOnset = p.onsetDays !== 'unselected' && p.onsetDays <= 180;
      let explanation = '';
      if ((p.classification === 'ischemic' || p.classification === 'tia') && isWithinOnset) {
        explanation = 'Matches the CT.gov event-window criterion: stroke or TIA within 180 days';
      }

      return [
        explanation,
        p.age !== 'unselected' && p.age >= 40 ? 'Age is ' + p.age + ' (meets ≥ 40)' : '',
        p.singleAntiplateletSoc === true ? 'Taking single antiplatelet (aspirin/clopidogrel)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        p.classification === 'unselected' ? 'Confirm event type is Ischemic Stroke or TIA' : '',
        p.singleAntiplateletSoc === 'unselected'
          ? 'Confirm patient is on aspirin or clopidogrel, but not both'
          : '',
        !p.exBrainBleed2y ? 'Confirm no spontaneous brain bleed in the past 2 years' : '',
        !p.exCongestiveHeartFailure ? 'Confirm no moderate/severe congestive heart failure' : '',
        'Wait for trial enrollment to officially open'
      ].filter(Boolean);
    }
  };
