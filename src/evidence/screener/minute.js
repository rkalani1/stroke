import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const MINUTE = {
    acronym: 'MINUTE',
    exactFullStudyName: 'Minimally Invasive Neuroendoscopic Ultra-Early Targeted ICH Evacuation',
    sourceHypothesisText:
      'A prospective, multi-center, randomized, controlled, blinded assessor, adaptive enrichment design, clinical trial to evaluate the utility of early/ultra-early SCUBA evacuation in patients with BGH and LKW-to-randomization time ≤ 16 hours.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov overall status as of 2026-07-03: RECRUITING (updated from NOT_YET_RECRUITING); listed study start date 2026-07-15.',
      'CT.gov also requires CTA/MRA without vascular lesion, expected surgery start <120 minutes from randomization, coagulation/lab review, goals-of-care consent, and other exclusions not fully encoded here.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '≤ 16 hours',
    externalMetadata: {
      nct: 'NCT07260916',
      registryUrl: 'https://clinicaltrials.gov/study/NCT07260916',
      verificationDate: '2026-07-03'
    },
    conciseBedsideSummary:
      'Ultra-early SCUBA endoscopic evacuation of basal ganglia hemorrhages (volume ≥ 20mL) within 16h.',
    pathway: 'Consult Stroke Research Coordinator / On-Call Neurosurgery Service',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Basal Ganglia hemorrhage ≥ 20mL',
      'Within 16 hours of last known well',
      'NIHSS ≥ 6',
      'Pre-ICH mRS 0-2',
      'Age 18-80 years',
      'CTA or MRA performed without an underlying vascular lesion',
      'Treating physician anticipates surgery can start <120 minutes from randomization'
    ],
    exactExclusionCriteria: [
      'Suspected secondary cause for ICH',
      'Infratentorial or thalamic hemorrhage',
      'Midbrain extension/involvement',
      'GCS score < 7 at presentation'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ich') errors.push('Requires ICH');
      if (p.ichLocation !== 'bg') errors.push('Requires deep Basal Ganglia location');
      if (p.volume !== 'bg_large') errors.push('Requires hematoma volume ≥ 20 mL');
      if (p.onsetHours > 16) errors.push('LKW-to-randomization > 16 hours');
      if (p.nihss < 6) errors.push('NIHSS < 6');
      if (p.gcs < 7) errors.push('GCS < 7');
      if (p.preMrs > 2) errors.push('Pre-ICH mRS > 2');
      if (p.age < 18 || p.age > 80) errors.push('Age must be 18-80 years');
      if (p.exSecondaryIch) errors.push('Excludes suspected secondary cause');
      if (p.exMidbrain) errors.push('Excludes midbrain extension');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'ICH classification selected',
        p.ichLocation === 'bg' ? 'Basal Ganglia location confirmed' : '',
        p.volume === 'bg_large' ? 'Volume ≥ 20mL confirmed' : '',
        p.onsetHours <= 16 ? 'LKW-to-randomization is ≤ 16h' : '',
        p.nihss >= 6 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 6)' : '',
        p.gcs >= 7 ? 'GCS is ' + p.gcs + ' (meets ≥ 7)' : '',
        p.preMrs <= 2 ? 'Pre-ICH mRS is ' + p.preMrs + ' (meets ≤ 2)' : '',
        p.age >= 18 && p.age <= 80 ? 'Age is ' + p.age + ' (meets 18-80)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exSecondaryIch ? 'Confirm no secondary cause (AVM, aneurysm, tumor, SAH)' : '',
        !p.exMidbrain ? 'Confirm no midbrain extension/involvement' : '',
        'Confirm CTA/MRA shows no underlying vascular lesion, coagulation criteria are met, and surgical timing/goals-of-care criteria are satisfied'
      ].filter(Boolean);
    }
  };
