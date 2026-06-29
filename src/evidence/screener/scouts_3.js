import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const SCOUTS_3 = {
    acronym: 'SCOUTS-3',
    exactFullStudyName: 'Stroke and CPAP Outcome Study 3',
    sourceHypothesisText:
      'Among stroke survivors with OSA undergoing inpatient rehabilitation, an intensive multimodal CPAP support intervention will improve CPAP adherence during rehabilitation and through 3 months post-randomization compared with standard support, potentially enhancing stroke recovery and reducing recurrent events.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires CT/MRI proof of acute ischemic infarction or intraparenchymal hemorrhage within 30 days and includes oxygen, aspiration-risk, sedative, surgery, and anticipated rehab length-of-stay exclusions not fully encoded here.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: '≤ 30 days',
    externalMetadata: {
      nct: 'NCT06722755',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06722755',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Among stroke survivors with OSA undergoing inpatient rehabilitation, intensive CPAP support compared with standard support.',
    pathway: 'EPIC Chat Stroke Rehab Team / Stroke Research Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Age >= 18',
      'Acute ischemic stroke or ICH within past 30 days',
      'Head CT or brain MRI demonstrating acute ischemic infarction or intraparenchymal hemorrhage within 30 days',
      'On or moving to inpatient rehabilitation with anticipated length of stay at least 5 nights',
      'Spanish or English speaking'
    ],
    exactExclusionCriteria: [
      'incarcerated',
      'pregnant',
      'mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min',
      'CPAP use within 14 days pre-CVA',
      'CVA related to tumor, vascular malformation, or SAH'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'ich') {
        errors.push('Requires Ischemic Stroke or ICH');
      }
      if (p.age < 18) errors.push('Age < 18');
      if (p.onsetDays > 30) errors.push('Stroke occurred > 30 days ago');
      if (p.rehab !== 'yes') {
        errors.push('Must have inpatient rehabilitation placement and expected length of stay ≥ 5 nights');
      }
      if (p.language !== 'english' && p.language !== 'spanish') {
        errors.push('Must be English or Spanish speaking');
      }
      if (p.exIncarcerated) errors.push('Excludes incarcerated patients');
      if (p.exPregnancy) errors.push('Excludes pregnant patients');
      if (p.exTrach)
        errors.push('Excludes mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min');
      if (p.exCpapUse14d) errors.push('Excludes prior CPAP use within 14 days pre-CVA');
      if (p.exSecondaryIchOrSah)
        errors.push('Excludes stroke related to tumor, vascular malformation, or SAH');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke or ICH classification selected',
        p.age >= 18 ? 'Age is ' + p.age + ' (meets ≥ 18)' : '',
        p.onsetDays <= 30 ? 'Onset within 30 days window' : '',
        p.rehab === 'yes' ? 'Inpatient rehabilitation placement confirmed' : '',
        p.language === 'english' || p.language === 'spanish' ? 'Language is English or Spanish' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient speaks English or Spanish',
        'Confirm inpatient rehabilitation placement and anticipated length of stay at least 5 nights',
        !p.exIncarcerated ? 'Confirm no prisoner/incarcerated status' : '',
        !p.exPregnancy ? 'Confirm not pregnant' : '',
        !p.exTrach
          ? 'Confirm no mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min'
          : '',
        !p.exCpapUse14d ? 'Confirm no prior CPAP use within 14 days pre-stroke' : '',
        !p.exSecondaryIchOrSah
          ? 'Confirm stroke was not caused by tumor, vascular malformation, or SAH'
          : ''
      ].filter(Boolean);
    }
  };
