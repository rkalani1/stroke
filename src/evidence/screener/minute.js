import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const MINUTE = {
    acronym: 'MINUTE',
    exactFullStudyName: 'Minimally Invasive Neuroendoscopic Ultra-Early Targeted ICH Evacuation',
    sourceHypothesisText:
      'Public demo screen for early/ultra-early SCUBA evacuation in selected basal-ganglia hemorrhage patients; the June 2026 ICH algorithm uses >=15 mL (or close by ABC/2) and arrival/evaluation <=15 hours from last known well as the operational screen.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov overall status as of 2026-07-03: RECRUITING (updated from NOT_YET_RECRUITING); listed study start date 2026-07-15.',
      'June 2026 algorithm screen requires CTA/MRA without vascular lesion and no clear standard-of-care surgical indication; detailed registry criteria, activation rules, and consent requirements must be verified through the active protocol.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '<=15 hours',
    externalMetadata: {
      nct: 'NCT07260916',
      registryUrl: 'https://clinicaltrials.gov/study/NCT07260916',
      verificationDate: '2026-07-03'
    },
    conciseBedsideSummary:
      'Ultra-early SCUBA endoscopic evacuation screen for basal-ganglia hemorrhage >=15 mL or close by ABC/2 within 15h.',
    pathway: 'Consult Stroke Research Coordinator / On-Call Neurosurgery Service',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Spontaneous non-traumatic supratentorial non-thalamic basal-ganglia IPH',
      'Volume >=15 mL by ABC/2, or close enough to prompt screening',
      'Arrival/evaluation <=15 hours since last known well',
      'NIHSS >=6',
      'Age 18-80 years',
      'CTA or MRA performed without an underlying vascular lesion',
      'No clear standard-of-care surgical indication'
    ],
    exactExclusionCriteria: [
      'Suspected secondary cause for ICH',
      'Infratentorial or thalamic hemorrhage',
      'Midbrain extension/involvement',
      'Clear standard-of-care surgical indication'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ich') errors.push('Requires ICH');
      if (p.ichLocation !== 'bg') errors.push('Requires deep Basal Ganglia location');
      if (p.volume !== 'bg_large') errors.push('Requires hematoma volume >=15 mL or close by ABC/2');
      if (p.onsetHours > 15) errors.push('Arrival/evaluation >15 hours since last known well');
      if (p.nihss < 6) errors.push('NIHSS < 6');
      if (p.age < 18 || p.age > 80) errors.push('Age must be 18-80 years');
      if (p.exSecondaryIch) errors.push('Excludes suspected secondary cause');
      if (p.exMidbrain) errors.push('Excludes midbrain extension');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'ICH classification selected',
        p.ichLocation === 'bg' ? 'Basal Ganglia location confirmed' : '',
        p.volume === 'bg_large' ? 'Volume >=15 mL or close by ABC/2 confirmed' : '',
        p.onsetHours <= 15 ? 'Arrival/evaluation is <=15h since last known well' : '',
        p.nihss >= 6 ? 'NIHSS is ' + p.nihss + ' (meets >=6)' : '',
        p.age >= 18 && p.age <= 80 ? 'Age is ' + p.age + ' (meets 18-80)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exSecondaryIch ? 'Confirm no secondary cause (AVM, aneurysm, tumor, SAH)' : '',
        !p.exMidbrain ? 'Confirm no midbrain extension/involvement' : '',
        'Confirm CTA/MRA shows no underlying vascular lesion and that there is no clear standard-of-care surgical indication',
        'Confirm registry details, activation rules, coagulation criteria, and consent requirements through the active protocol'
      ].filter(Boolean);
    }
  };
