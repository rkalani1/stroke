import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const ASPIRE = {
    acronym: 'ASPIRE',
    exactFullStudyName:
      'Anticoagulation in Intracerebral Hemorrhage (ICH) Survivors for Stroke Prevention and Recovery',
    sourceHypothesisText:
      'A prospective, randomized, double blind clinical trial to determine if apixaban is superior to aspirin for prevention of the composite outcome of any stroke (hemorrhagic or ischemic) or death from any cause in patients with recent ICH and AF.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov includes renal, hepatic, hematologic, pregnancy, blood pressure, allergy, competing-trial, and AVM-security exclusions not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '14 – 180 days',
    externalMetadata: {
      nct: 'NCT03907046',
      registryUrl: 'https://clinicaltrials.gov/study/NCT03907046',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Apixaban vs Aspirin in patients with recent ICH (randomized 14-180 days post-onset) and non-valvular AFib.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology Service',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Intracerebral hemorrhage (ICH), including primary intraventricular hemorrhage, confirmed by brain CT or MRI',
      'non-valvular Afib',
      'can be randomized within 14-180 days of stroke onset'
    ],
    exactExclusionCriteria: [
      'Suspected secondary cause for ICH',
      'prior ICH within 12 months of index stroke',
      'clear indication for anticoagulation or antiplatelet therapy'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ich') errors.push('Requires ICH');
      if (!p.afibHistory) errors.push('Requires clinical atrial fibrillation history');
      if (p.onsetDays < 14 || p.onsetDays > 180) errors.push('LKW-to-randomization not 14-180 days');
      if (p.exSecondaryIch) errors.push('Excludes suspected secondary cause');
      if (p.exPriorIch12m) errors.push('Excludes prior ICH within 12 months');
      if (p.exClearAnticoagulationIndication)
        errors.push('Excludes patients with clear indication for OAC');
      if (p.exClearAntiplateletIndication)
        errors.push('Excludes patients with clear indication for antiplatelet');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'ICH classification selected',
        p.afibHistory === true ? 'AFib history confirmed' : '',
        p.onsetDays >= 14 && p.onsetDays <= 180 ? 'Onset within 14-180 days window' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exSecondaryIch ? 'Confirm no secondary cause (AVM, aneurysm, tumor, SAH)' : '',
        !p.exPriorIch12m ? 'Confirm no other ICH in past 12 months' : '',
        !p.exClearAnticoagulationIndication
          ? 'Confirm no mandatory indication for anticoagulation (e.g. mechanical valve, DVT/PE)'
          : '',
        !p.exClearAntiplateletIndication
          ? 'Confirm no mandatory indication for antiplatelets (e.g. recent coronary stent)'
          : ''
      ].filter(Boolean);
    }
  };
