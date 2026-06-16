import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const VERIFY = {
    acronym: 'VERIFY',
    exactFullStudyName:
      'Validation of Early Prognostic Data for Recovery Outcome after Stroke for Future, Higher Yield Trials',
    sourceHypothesisText:
      'Patients have different UE outcomes depending on corticomotor system (CMS) function, measured as motor evoked potential (MEP) status with TMS, and on CMS structure, measured as acute lesion load with MRI. VERIFY will create the first multicenter, large-scale, prospective dataset of clinical, TMS, and MRI measures in the acute stroke time window.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires SAFE score <=8 within 48-96 hours, Day 90 in-person availability, and MRI/TMS contraindication screening not fully encoded here.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: '24 – 96 hours',
    externalMetadata: {
      nct: 'NCT05338697',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05338697',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'TMS and MRI predictors of upper extremity recovery. Requires consent within 24-96h of LNW.',
    pathway: 'Consult Rehab Research Coordinator / Inpatient Rehab Team',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Unilaterally symptomatic acute ischemic stroke',
      'Motor deficits in the affected upper extremity with SAFE score ≤ 8 within 48-96 hours',
      'able to consent for themselves',
      'able to consent within 24-96 hours of LNW',
      'English or Spanish speaking'
    ],
    exactExclusionCriteria: [
      'Upper extremity condition that limited use prior to the enrolling stroke',
      'legally blind',
      'dense sensory loss of NIHSS=2',
      'symptomatic stroke within 30 days prior to enrolling event',
      'seizure since stroke onset',
      'MRI or TMS contraindication'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (!p.unilateralSymptomatic) errors.push('Requires unilateral symptomatic AIS');
      if (!p.exUeWeakness) errors.push('Requires upper extremity motor weakness');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.onsetHours < 24 || p.onsetHours > 96) errors.push('LKW-to-consent window not 24-96h');
      if (p.language !== 'english' && p.language !== 'spanish') {
        errors.push('Must be English or Spanish speaking');
      }
      if (p.exPriorUeCondition) errors.push('Excludes prior UE condition limiting use');
      if (p.exLegallyBlind) errors.push('Excludes legally blind patients');
      if (p.exDenseSensoryLoss) errors.push('Excludes dense sensory loss (NIHSS sensory=2)');
      if (p.exRecentStroke30d) errors.push('Excludes symptomatic stroke within 30 days prior');
      if (p.exSeizures) errors.push('Excludes seizure since stroke onset');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.unilateralSymptomatic === true ? 'Unilateral symptomatic AIS confirmed' : '',
        p.exUeWeakness === true ? 'Upper extremity motor deficit confirmed' : '',
        p.self_consent === true ? 'Patient able to self-consent' : '',
        p.onsetHours >= 24 && p.onsetHours <= 96 ? 'LKW-to-consent is in 24-96h window' : '',
        p.language === 'english' || p.language === 'spanish' ? 'Language is English or Spanish' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm unilateral symptomatic AIS',
        'Confirm patient speaks English or Spanish',
        'Confirm patient is able to self-consent',
        !p.exPriorUeCondition ? 'Confirm no prior upper extremity condition limiting use' : '',
        !p.exLegallyBlind ? 'Confirm not legally blind' : '',
        !p.exDenseSensoryLoss ? 'Confirm NIHSS sensory score is < 2 (not dense sensory loss)' : '',
        !p.exRecentStroke30d ? 'Confirm no symptomatic stroke in prior 30 days' : '',
        !p.exSeizures ? 'Confirm no seizures since stroke onset' : ''
      ].filter(Boolean);
    }
  };
