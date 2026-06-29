import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const TELE_REHAB_2 = {
    acronym: 'TELE-REHAB-2',
    exactFullStudyName: 'Telerehabilitation in the home after stroke',
    sourceHypothesisText:
      'Adding a 6-week course of intensive Telerehabilitation to usual care after stroke results in superior functional outcomes compared to usual care alone.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires ARAT 18-44, Box & Block affected arm >=1 block/60 seconds, ability to perform 3 exercise examples, and self-signed consent/behavioral contract; not all are encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '90 – 150 days',
    externalMetadata: {
      nct: 'NCT06682429',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06682429',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      '6-week course of intensive home telerehabilitation in patients 90-150 days post-ischemic or hemorrhagic stroke.',
    pathway: 'Consult Rehab Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Ischemic stroke or ICH between 90-150 days prior to randomization',
      'age 18-80',
      'Action Research Arm Test score 18-44 at baseline',
      'Box & Block Test affected arm score ≥1 block in 60 seconds',
      'Able to perform all 3 rehabilitation exercise test examples',
      'Informed consent and behavioral contract signed by the subject; no surrogate consent'
    ],
    exactExclusionCriteria: [
      'mRS prior to stroke of >2',
      'a new stroke has occurred since index stroke',
      'a separate stroke occurred within 30 days prior to index stroke',
      'life expectancy < 9months',
      'botulinum toxin to the paretic arm received in the prior 3 months or expected by the 8-month visit'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'ich') {
        errors.push('Requires Ischemic Stroke or ICH');
      }
      if (p.onsetDays < 90 || p.onsetDays > 150) errors.push('LKW-to-randomization not 90-150 days');
      if (p.age < 18 || p.age > 80) errors.push('Requires age 18-80');
      if (!p.exUeWeakness) errors.push('Requires moderate upper extremity weakness');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');
      if (p.exRecurrentStroke) errors.push('Excludes recurrent stroke since index stroke');
      if (p.exRecentStroke30d) errors.push('Excludes separate stroke within 30 days prior');
      if (p.exLifeExpectancy9m) errors.push('Excludes life expectancy < 9 months');
      if (p.exBotoxVns3m)
        errors.push(
          'Excludes botulinum toxin to the paretic arm within 3 months, or expected by the 8-month visit'
        );
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke or ICH classification selected',
        p.onsetDays >= 90 && p.onsetDays <= 150 ? 'Onset within 90-150 days window' : '',
        p.age >= 18 && p.age <= 80 ? 'Age is ' + p.age + ' (meets 18-80)' : '',
        p.exUeWeakness === true ? 'Upper extremity weakness confirmed' : '',
        p.self_consent === true ? 'Patient able to self-consent' : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient is able to self-consent',
        !p.exRecurrentStroke ? 'Confirm no recurrent stroke since the index stroke' : '',
        !p.exRecentStroke30d
          ? 'Confirm no separate stroke within 30 days prior to the index stroke'
          : '',
        !p.exLifeExpectancy9m ? 'Confirm life expectancy is ≥ 9 months' : '',
        !p.exBotoxVns3m
          ? 'Confirm no botulinum toxin to the paretic arm in prior 3 months or expected by the 8-month visit'
          : ''
      ].filter(Boolean);
    }
  };
