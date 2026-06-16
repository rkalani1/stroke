import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const MR_PICS = {
    acronym: 'MR-PICS',
    exactFullStudyName: 'Motor Recovery through Plasticity-Inducing Cortical Stimulation',
    sourceHypothesisText:
      'To assess the safe use of the CorTec Brain Interchange for use in providing cortical stimulation for stroke rehabilitation studies and establishing the technical feasibility of delivering plasticity-inducing stimulation within stroke patients. We hope to use this preliminary safety and feasibility data to inform a potential future study to collect preliminary efficacy data regarding the use of stimulation-induced neuroplasticity to improve stroke rehabilitation motor functional outcomes',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires UEFM 25-45, at least 30% corticospinal pathway preservation on MRI, observable motor output to TMS, and additional surgical/device safety screening not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '> 6 months',
    externalMetadata: {
      nct: 'NCT06506279',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06506279',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Invasive cortical stimulation in chronic stroke patients (stroke > 6 months prior, post-stroke mRS 3-4, available for 54 weeks).',
    pathway: 'Consult Rehab Research Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'History of ischemic cortical stroke at least 6 months prior',
      'ages 22-75',
      'Post-stroke mRS 3-4',
      'UEFM score 25-45 with upper limb impairment',
      'Minimum 30% corticospinal pathway preservation on MRI and observable upper-limb motor output to TMS',
      'available for duration of study period (54 weeks) for in person visits'
    ],
    exactExclusionCriteria: [
      'On anticoagulation',
      'history of DVT or pulmonary emboli',
      'history of seizure',
      'history of spontaneous ICH',
      'unable to consent for themselves'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.onsetMonths < 6) errors.push('Requires chronic phase > 6 months post-stroke');
      if (p.age < 22 || p.age > 75) errors.push('Requires age 22-75');
      if (p.preMrs !== 3 && p.preMrs !== 4) errors.push('Current (post-stroke) mRS must be 3 or 4');
      if (!p.exUeWeakness) errors.push('Requires moderate unilateral upper extremity weakness');
      if (!p.availability_54w) errors.push('Requires availability for 54 weeks of visits');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.exAnticoagulation) errors.push('Excludes patients taking anticoagulants');
      if (p.exHistoryDvtPe) errors.push('Excludes history of DVT or pulmonary emboli');
      if (p.exSeizures) errors.push('Excludes history of seizures/epilepsy');
      if (p.exPriorIchHistory) errors.push('Excludes history of spontaneous ICH');
      if (p.exPregnancy) errors.push('Excludes pregnancy');
      if (p.exSevereSpasticity) errors.push('Excludes severe spasticity in target arm');
      if (p.exArmInjury) errors.push('Excludes arm fracture or orthopedic injury');
      if (p.exSevereAphasiaCognitive) errors.push('Excludes severe aphasia or cognitive impairment');
      if (p.exSevereClaustrophobia) errors.push('Excludes severe claustrophobia');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.onsetMonths >= 6 ? 'Stroke occurred > 6 months ago' : '',
        p.age >= 22 && p.age <= 75 ? 'Age is ' + p.age + ' (meets 22-75)' : '',
        p.preMrs === 3 || p.preMrs === 4 ? 'Current mRS is ' + p.preMrs : '',
        p.exUeWeakness === true ? 'Unilateral upper extremity weakness confirmed' : '',
        p.availability_54w === true ? 'Available for 54-week in-person visits' : '',
        p.self_consent === true ? 'Patient able to self-consent' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient is able to self-consent',
        'Confirm availability for 54 weeks of in-person follow-up visits',
        'Confirm UEFM 25-45, corticospinal pathway preservation, and TMS motor output requirements',
        !p.exAnticoagulation ? 'Confirm not on anticoagulants (DOAC/warfarin/heparin)' : '',
        !p.exHistoryDvtPe ? 'Confirm no history of DVT or pulmonary emboli' : '',
        !p.exSeizures ? 'Confirm no history of seizures or epilepsy' : '',
        !p.exPriorIchHistory ? 'Confirm no history of spontaneous ICH' : ''
      ].filter(Boolean);
    }
  };
