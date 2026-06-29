import { CTGOV_FIRST_PASS_NOTE } from './constants.js';

export const CAPPRICORN_1 = {
    acronym: 'CAPPRICORN-1',
    exactFullStudyName: 'A Study to Investigate the Efficacy, Safety, and Tolerability of ALN-APP in Patients with CAA',
    sourceHypothesisText:
      'A randomized, double-blind, placebo-controlled, phase 2 trial to assess the safety and efficacy of intrathecally injected ALN-APP for treatment of patients with Cerebral Amyloid Angiopathy.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'This demo cannot distinguish sporadic CAA age >=50 from Dutch-type CAA age >=30 with E693Q APP mutation, and it does not encode ALT/AST, recent investigational agent, or amyloid-antibody exclusions.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: 'Chronic',
    externalMetadata: {
      nct: 'NCT06393712',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06393712',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Intrathecal ALN-APP in sporadic probable CAA or Dutch-type CAA; prior clinical ICH is not required by the public CT.gov inclusion criteria.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Sporadic CAA: age ≥ 50 years and probable CAA per Boston Criteria Version 2.0',
      'Dutch-type CAA: age ≥ 30 years and known E693Q amyloid precursor protein (APP) mutation'
    ],
    exactExclusionCriteria: [
      "Moderate or severe Alzheimer's disease or significant cognitive impairment",
      'Previous clinical ICH with onset < 90 days before anticipated randomization',
      'ALT or AST > 3x upper limit of normal',
      'eGFR < 30 ml/min/1.73m²'
    ],
    check: (p) => {
      const errors = [];
      if (p.age < 30)
        errors.push('Age < 30 (requires ≥ 50 for sporadic CAA or ≥ 30 for Dutch-type CAA)');
      if (p.classification === 'ich' && p.onsetDays < 90)
        errors.push('Prior clinical ICH onset < 90 days before anticipated randomization');
      if (p.exSevereAphasiaCognitive)
        errors.push("Excludes moderate-to-severe cognitive impairment / Alzheimer's");
      if (p.exEgfr30) errors.push('eGFR < 30');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        p.age >= 30 ? 'Age is ' + p.age + ' (meets criteria)' : '',
        p.classification !== 'ich' || p.onsetDays >= 90
          ? 'No clinical ICH within 90 days identified in entered fields'
          : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm sporadic probable CAA by Boston Criteria Version 2.0 or Dutch-type CAA with known E693Q APP mutation',
        'Confirm no prior clinical ICH with onset < 90 days before randomization',
        !p.exSevereAphasiaCognitive
          ? "Confirm no moderate/severe cognitive impairment or Alzheimer's"
          : '',
        !p.exEgfr30 ? 'Confirm eGFR is ≥ 30 ml/min/1.73m²' : ''
      ].filter(Boolean);
    }
  };
