import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const ESUS = {
    acronym: 'ESUS',
    exactFullStudyName:
      'Qualitative model-based ESUS reclassification using cardiac and cerebral vessel wall MRI',
    sourceHypothesisText:
      'Use of a cardiac vessel wall MRI along with cerebellar vessel wall imaging can help to reclassify ESUS ischemic stroke patients into either cardioembolic or large artery atherosclerosis etiology using a qualitative model.',
    status: 'placeholder',
    sourceCompletenessStatus: 'not_registry_verified',
    sourceGaps: [
      'No matching ClinicalTrials.gov record was found from exact acronym/title searches on 2026-05-28; this local study cannot be registry-verified on the public demo without an NCT or approved source document.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 180 days',
    externalMetadata: { nct: '', registryUrl: '', verificationDate: '2026-05-28' },
    conciseBedsideSummary:
      'Local study summary is not ClinicalTrials.gov-verified; do not use this public demo to screen or refer until an approved source/NCT is attached.',
    pathway: 'Registry/source verification required before use',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke of ESUS, cardioembolic, or large artery atherosclerosis etiology',
      'able to get the scan within 6 months of stroke onset'
    ],
    exactExclusionCriteria: [
      'age less than 35',
      'eGFR < 35',
      'contraindication to MRI with gadolinium contrast',
      'surgery within 30 days prior to stroke onset'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.etiology !== 'esus' && p.etiology !== 'cardioembolic' && p.etiology !== 'laa') {
        errors.push('Etiology must be ESUS, cardioembolic, or LAA');
      }
      if (p.onsetDays > 180) errors.push('Scan cannot be completed within 6 months of onset');
      if (p.age < 35) errors.push('Age < 35');
      if (p.exEgfr35) errors.push('eGFR < 35');
      if (p.exMriContraindication) errors.push('Excludes MRI/gadolinium contraindications');
      if (p.exRecentSurgery30d) errors.push('Excludes surgery within 30 days prior to stroke onset');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.etiology === 'esus' || p.etiology === 'cardioembolic' || p.etiology === 'laa'
          ? 'Etiology matches: ' +
            p.etiology.toUpperCase() +
            ' (Trial accepts ESUS, Cardioembolic, or LAA to study reclassification)'
          : '',
        p.onsetDays <= 180 ? 'Scan feasible within 6 months of onset' : '',
        p.age >= 35 ? 'Age is ' + p.age + ' (meets ≥ 35)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exEgfr35 ? 'Confirm eGFR is ≥ 35 ml/min/1.73m²' : '',
        !p.exMriContraindication ? 'Confirm no MRI or gadolinium contrast contraindications' : '',
        !p.exRecentSurgery30d ? 'Confirm no surgery within 30 days prior to stroke onset' : ''
      ].filter(Boolean);
    }
  };
