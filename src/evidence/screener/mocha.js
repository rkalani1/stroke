import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const MOCHA = {
    acronym: 'MOCHA',
    exactFullStudyName:
      'Automated Intracranial Vessel Wall Analysis Pipeline for Multi-contrast Multi-platform Applications',
    sourceHypothesisText:
      'Use of intracranial vessel wall imaging along with other clinical findings can be used to identify etiology of ESUS patients using a qualitative model.',
    status: 'placeholder',
    sourceCompletenessStatus: 'not_registry_verified',
    sourceGaps: [
      'No matching ClinicalTrials.gov record was found from exact acronym/title searches on 2026-05-28; this local study cannot be registry-verified on the public demo without an NCT or approved source document.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 120 days',
    externalMetadata: { nct: '', registryUrl: '', verificationDate: '2026-05-28' },
    conciseBedsideSummary:
      'Local study summary is not ClinicalTrials.gov-verified; do not use this public demo to screen or refer until an approved source/NCT is attached.',
    pathway: 'Registry/source verification required before use',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke of ESUS etiology',
      'able to receive the scan within 4 months of stroke onset'
    ],
    exactExclusionCriteria: [
      'Age less than 35',
      'eGFR < 35',
      'contraindication to MRI with gadolinium contrast',
      'history of bilateral carotid artery revascularization'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.etiology !== 'esus') errors.push('Requires ESUS etiology');
      if (p.onsetDays > 120) errors.push('Scan cannot be completed within 4 months of onset');
      if (p.age < 35) errors.push('Age < 35');
      if (p.exEgfr35) errors.push('eGFR < 35');
      if (p.exMriContraindication) errors.push('Excludes MRI/gadolinium contraindications');
      if (p.exBilateralCarotidRevasc)
        errors.push('Excludes history of bilateral carotid artery revascularization');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.etiology === 'esus' ? 'ESUS etiology confirmed' : '',
        p.onsetDays <= 120 ? 'Scan feasible within 4 months of onset' : '',
        p.age >= 35 ? 'Age is ' + p.age + ' (meets ≥ 35)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exEgfr35 ? 'Confirm eGFR is ≥ 35 ml/min/1.73m²' : '',
        !p.exMriContraindication ? 'Confirm no MRI or gadolinium contrast contraindications' : '',
        !p.exBilateralCarotidRevasc
          ? 'Confirm no history of bilateral carotid endarterectomy or stenting'
          : ''
      ].filter(Boolean);
    }
  };
