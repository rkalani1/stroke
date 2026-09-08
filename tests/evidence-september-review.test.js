import { describe, it, expect } from 'vitest';
import { getActiveTrial, getCompletedTrial, getCitation } from '../src/evidence/index.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { createInitialScreenerState, buildScreenerParams, evaluateTrialEligibility, evaluateAll, isTrialPotentiallyActive } from '../src/evidence/screener-eval.js';
import { evaluateActiveTrial, evaluateAllTrialsViaEngine, resolveField } from '../src/evidence/matcher-engine.js';
import { documentedNihssValue } from '../src/encounter-decision-status.js';

const trial = name => screenerTrials.find(t => t.acronym === name);
const screen = (name, overrides) => evaluateTrialEligibility(trial(name), buildScreenerParams({ ...createInitialScreenerState(), ...overrides }));

describe('2026-09-06 registry review — source-specific screening boundaries', () => {
  // https://clinicaltrials.gov/study/NCT06393712, update posted 2026-09-03.
  it('never offers CAPPRICORN-1 for new enrollment after active-not-recruiting status', () => {
    const state = { ...createInitialScreenerState(), classification: 'ich', onsetVal: 180, onsetUnit: 'days', age: 65 };
    expect(trial('CAPPRICORN-1').externalMetadata.registryStatus).toBe('ACTIVE_NOT_RECRUITING');
    expect(screen('CAPPRICORN-1', state).status).toBe('closed');
    expect(isTrialPotentiallyActive(trial('CAPPRICORN-1'), buildScreenerParams(state))).toBe(false);
    expect(evaluateAll(state).briefingNote).not.toContain('CAPPRICORN');
  });

  it.each(['STEP', 'TESTED', 'INTERCEPT', 'ASPIRE', 'VERIFY'])('%s does not treat a 17-year-old as an adult candidate', name => {
    const result = screen(name, { classification: 'ischemic', age: 17, onsetVal: 48 });
    expect(result.status).toBe('excluded');
    expect(result.exclusionReasons).toContain('Age < 18 years');
  });

  // NCT05723926: longest permitted group is 6-52 weeks, not a calendar year.
  it('distinguishes the 364-day INTERCEPT limit from 365 days', () => {
    const base = { classification: 'ischemic', age: 60, onsetUnit: 'days', afibHistory: true };
    expect(screen('INTERCEPT', { ...base, onsetVal: 364 }).status).toBe('pending');
    expect(screen('INTERCEPT', { ...base, onsetVal: 365 }).status).toBe('excluded');
  });

  // NCT07260916: pre-ICH mRS 0-2 and GCS >=7 at presentation.
  it('enforces MINUTE disability and consciousness criteria', () => {
    const base = { classification: 'ich', ichLocation: 'bg', volume: 'bg_large', age: 65, onsetVal: 12, nihss: 8, preMrs: 2, gcs: 7 };
    expect(screen('MINUTE', base).status).toBe('pending');
    expect(screen('MINUTE', { ...base, preMrs: 3 }).status).toBe('excluded');
    expect(screen('MINUTE', { ...base, gcs: 6 }).status).toBe('excluded');
  });

  // NCT06506279: current post-stroke disability, never premorbid disability.
  it('separates current MR-PICS mRS from pre-stroke function', () => {
    const base = { classification: 'ischemic', onsetVal: 6, onsetUnit: 'months', age: 60, currentMrs: 3, preMrs: 0 };
    expect(screen('MR-PICS', base).status).toBe('pending');
    expect(screen('MR-PICS', { ...base, currentMrs: 0, preMrs: 3 }).status).toBe('excluded');
    expect(screen('MR-PICS', { ...base, currentMrs: 'unselected' }).pendingFields).toContain('Current post-stroke mRS');
  });

  it('retains investigator review rather than inventing absolute MR-PICS orthopedic exclusions', () => {
    const result = screen('MR-PICS', { classification: 'ischemic', onsetVal: 8, onsetUnit: 'months', age: 60, currentMrs: 3, exclusions: { exArmInjury: true, exSevereSpasticity: true } });
    expect(result.status).toBe('pending');
    expect(result.pendingCriteria.join(' ')).toMatch(/enrolling-clinician approval/);
  });

  it('does not use a generic secondary-ICH flag as an ASPIRE exclusion', () => {
    const result = screen('ASPIRE', { classification: 'ich', age: 65, onsetVal: 30, onsetUnit: 'days', afibHistory: true, exclusions: { exSecondaryIch: true } });
    expect(result.status).toBe('pending');
    expect(result.pendingCriteria.join(' ')).toMatch(/unsecured AVM/);
  });

  it('keeps overall registry verification distinct from local activation and complete protocol verification', () => {
    for (const t of screenerTrials.filter(t => t.externalMetadata.nct)) {
      expect(t.externalMetadata.verificationDate).toBe('2026-09-06');
      expect(t.externalMetadata.registryLastUpdatePosted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.externalMetadata.localActivationStatus).toBe('not_assessed');
      expect(t.sourceCompletenessStatus).toBe('first_pass');
    }
    for (const name of ['ESUS', 'MOCHA']) {
      expect(trial(name).status).toBe('placeholder');
      expect(trial(name).externalMetadata.verificationDate).toBeNull();
    }
  });
});

describe('registry time windows in the Atlas matcher', () => {
  it.each([
    ['verify', 23, 'not_eligible'], ['verify', 24, 'eligible'], ['verify', 96, 'eligible'], ['verify', 97, 'not_eligible'],
    ['aspire', 335, 'not_eligible'], ['aspire', 336, 'eligible'], ['aspire', 4320, 'eligible'], ['aspire', 4321, 'not_eligible'],
    ['saturn', 168, 'eligible'], ['saturn', 169, 'not_eligible']
  ])('%s at %d h has status %s for a matching synthetic fixture', (id, hoursFromLKW, status) => {
    const data = { hoursFromLKW, onStatin: true, ichLocation: 'lobar', telestrokeNote: { age: '65', premorbidMRS: '1', diagnosisCategory: id === 'verify' ? 'ischemic' : 'ich', symptoms: 'arm weakness', pmh: 'atrial fibrillation' } };
    expect(evaluateActiveTrial(getActiveTrial(id), data).status).toBe(status);
  });

  it.each(['verify', 'aspire', 'saturn'])('%s cannot establish a time window from missing onset data', id => {
    const data = { onStatin: true, ichLocation: 'lobar', telestrokeNote: { age: '65', premorbidMRS: '1', diagnosisCategory: id === 'verify' ? 'ischemic' : 'ich', symptoms: 'arm weakness', pmh: 'atrial fibrillation' } };
    expect(evaluateActiveTrial(getActiveTrial(id), data).status).toBe('needs_info');
  });
});

describe('first-pass trial screen presentation', () => {
  it.each([
    [48, 'eligible', 'Possible candidate'],
    [undefined, 'needs_info', 'Needs information'],
    [120, 'not_eligible', 'Screen criteria not met']
  ])('keeps a modeled %s-hour result separate from enrollment eligibility', (hoursFromLKW, status, label) => {
    // SAFE, device safety and self-consent are not established by this fixture.
    const data = { hoursFromLKW, telestrokeNote: { age: '65', diagnosisCategory: 'ischemic', symptoms: 'arm weakness' } };
    const result = Object.values(evaluateAllTrialsViaEngine([getActiveTrial('verify')], data))[0];
    expect(result.status).toBe(status);
    expect(result.screeningLabel).toBe(label);
    expect(result.fullProtocolReviewRequired).toBe(true);
    expect(result.screeningNote).toMatch(/Full protocol review required/);
    expect(result.screeningNote).toMatch(/exclusion criteria, local activation, and consent/);
  });
});

describe('documented treatment decisions in trial screening', () => {
  it.each([
    { entered: '', hasExamInput: false, expectedCriterion: 'unknown', expectedStatus: 'needs_info' },
    { entered: '0', hasExamInput: false, expectedCriterion: 'not_met', expectedStatus: 'not_eligible' },
    { entered: '', hasExamInput: true, expectedCriterion: 'not_met', expectedStatus: 'not_eligible' },
    { entered: '4', hasExamInput: false, expectedCriterion: 'met', expectedStatus: 'eligible' }
  ])('preserves documented NIHSS provenance in the encounter matcher ($entered, exam=$hasExamInput)', ({ entered, hasExamInput, expectedCriterion, expectedStatus }) => {
    const telestrokeNote = {
      age: '60', nihss: entered, premorbidMRS: '1', ctaResults: 'tandem extracranial ICA and M1 occlusion',
      tnkRecommended: false, tnkDecisionRecorded: true
    };
    const result = evaluateActiveTrial(getActiveTrial('picasso'), {
      telestrokeNote,
      strokeCodeForm: { nihss: '' },
      // The calculator's initial zero is not a documented examination.
      nihssScore: documentedNihssValue(telestrokeNote, 0, hasExamInput) || null,
      hoursFromLKW: 8,
      aspectsScore: 8
    });
    expect(result.criteria.find(c => c.id === 'nihss').status).toBe(expectedCriterion);
    expect(result.status).toBe(expectedStatus);
  });

  it.each(['tnk', 'evt'])('%s does not treat an unchecked default as a recorded negative decision', treatment => {
    const field = treatment + 'Recommended';
    const recorded = treatment + 'DecisionRecorded';
    expect(resolveField(field, { telestrokeNote: null })).toBeNull();
    expect(resolveField(field, { telestrokeNote: { [field]: false, [recorded]: false } })).toBeNull();
    expect(resolveField(field, { telestrokeNote: { [field]: false } })).toBeNull();
    expect(resolveField(field, { telestrokeNote: { [field]: false, [recorded]: true } })).toBe(false);
    expect(resolveField(field, { telestrokeNote: { [field]: true } })).toBe(true);
  });

  it('keeps the PICASSO negative-thrombolysis gate unknown on a default false form', () => {
    const data = { hoursFromLKW: 8, aspectsScore: 8, telestrokeNote: {
      age: '60', nihss: '14', premorbidMRS: '1', ctaResults: 'tandem extracranial ICA and M1 occlusion',
      tnkRecommended: false, tnkDecisionRecorded: false
    } };
    const result = evaluateActiveTrial(getActiveTrial('picasso'), data);
    expect(result.status).toBe('needs_info');
    expect(result.criteria.find(c => c.id === 'tnkRecommended').status).toBe('unknown');
    data.telestrokeNote.tnkDecisionRecorded = true;
    expect(evaluateActiveTrial(getActiveTrial('picasso'), data).status).toBe('eligible');
  });

  it('requires both documented negatives to establish no reperfusion plan', () => {
    const note = { tnkRecommended: false, evtRecommended: false };
    expect(resolveField('reperfusion', { telestrokeNote: note })).toBeNull();
    note.tnkDecisionRecorded = true;
    expect(resolveField('reperfusion', { telestrokeNote: note })).toBeNull();
    note.evtDecisionRecorded = true;
    expect(resolveField('reperfusion', { telestrokeNote: note })).toBe(false);
    note.evtRecommended = true;
    note.evtDecisionRecorded = false;
    expect(resolveField('reperfusion', { telestrokeNote: note })).toBe(true);
  });
});

describe('primary-report distinctions that must survive future content refreshes', () => {
  it('links the published TenCRAOS report and retains its neutral efficacy and fatal-ICH signal', () => {
    expect(getCitation('cit-tencraos-2025').pmid).toBe('41604638');
    const t = getCompletedTrial('tencraos');
    expect(t.primaryEndpoint.pValue).toBe('P=.69');
    expect(t.primaryEndpoint.result).toMatch(/No significant difference/);
    expect(t.safetyFindings.sich).toMatch(/fatal/);
  });
  it('uses the CHOICE adjusted risk difference, not an unsupported relative-risk estimate', () => {
    expect(getCompletedTrial('choice').primaryEndpoint.effectSize).toBe('Adjusted risk difference 18.4 percentage points');
  });
  it('keeps DISTAL original 90-day primary outcome separate from its later 12-month report', () => {
    expect(getCompletedTrial('distal').primaryEndpoint.timepoint).toBe('90 d');
    expect(getCompletedTrial('distal').secondaryEndpoints[0].name).toMatch(/12-month/);
  });
  it('never calls PRESTIGE recurrent-ICH noninferiority established', () => {
    expect(getActiveTrial('aspire').keyTakeaways.join(' ')).toMatch(/did NOT meet non-inferiority/);
  });
  it('keeps STRATEGY neutral and ROCATIS clinical events secondary to the platelet endpoint', () => {
    expect(getCompletedTrial('strategy').primaryEndpoint.pValue).toBe('P=.39');
    expect(getCompletedTrial('rocatis-1').primaryEndpoint.definition).toMatch(/platelet/);
    expect(getCompletedTrial('rocatis-1').secondaryEndpoints.find(e => e.name === 'Recurrent stroke').result).toMatch(/not significant/);
  });
});
