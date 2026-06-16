import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const INTERCEPT = {
    acronym: 'INTERCEPT',
    exactFullStudyName:
      'Carotid Implants for PreveNtion of STrokE ReCurrEnce from Large Vessel Occlusion in Atrial Fibrillation Patients Treated with Oral Anticoagulation',
    sourceHypothesisText:
      'To assess the efficacy and safety of bilateral carotid filters as an adjunct to OAC in AF patients who suffered an ischemic stroke in the previous year.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires one of three OAC-at-index timing groups, planned VKA/DOAC use for the trial duration, SAPT plus OAC tolerability, and detailed bilateral carotid anatomy criteria not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 365 days',
    externalMetadata: {
      nct: 'NCT05723926',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05723926',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Bilateral carotid filters in patients with clinical AF and an ischemic stroke with positive neuroimaging within 52 weeks; planned OAC is required.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Documented history of clinical atrial fibrillation',
      'Ischemic stroke with positive neuroimaging within 52 weeks, in one of the CT.gov-defined OAC timing groups',
      'Planned VKA or DOAC use for the duration of the trial',
      'Able to tolerate single antiplatelet therapy plus OAC for 6 months',
      'Bilateral ultrasound or angiogram demonstrating protocol-defined carotid anatomy'
    ],
    exactExclusionCriteria: [
      'history of ICH',
      'Contraindication to additional single antiplatelet therapy for 6 months from randomization',
      '≥50% stenosis, or high-risk plaque of the common carotid, subclavian, vertebral, or intracranial arteries that has not been treated with a revascularization procedure'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic')
        errors.push('Requires ischemic stroke with positive neuroimaging (does not match TIA alone)');
      if (p.onsetDays > 365) errors.push('Stroke onset > 365 days ago');
      if (!p.afibHistory) errors.push('Requires clinical atrial fibrillation history');
      if (p.exPriorIchHistory) errors.push('Excludes history of ICH');
      if (p.exSaptContraindication) errors.push('Excludes patients with SAPT contraindication');
      if (p.exCarotidStenosis50)
        errors.push('Excludes carotid/vertebral/subclavian/intracranial stenosis ≥50%');
      if (p.exPregnancy) errors.push('Excludes pregnancy');
      if (p.exLifeExpectancy2y) errors.push('Excludes life expectancy < 2 years');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.onsetDays <= 365 ? 'Onset within past year' : '',
        p.afibHistory === true ? 'AFib history confirmed' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exPriorIchHistory ? 'Confirm no history of spontaneous ICH' : '',
        !p.exSaptContraindication
          ? 'Confirm patient can tolerate 6 months of add-on single antiplatelet'
          : '',
        !p.exCarotidStenosis50
          ? 'Confirm no untreated carotid/vertebral/intracranial stenosis ≥50%'
          : '',
        'Confirm CT.gov OAC timing group, planned VKA/DOAC duration, and bilateral carotid anatomy requirements'
      ].filter(Boolean);
    }
  };
