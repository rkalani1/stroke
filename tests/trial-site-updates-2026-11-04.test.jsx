import { describe, expect, it } from 'vitest';
import { buildTableMarkdown } from '../src/components/EligibilityTables.jsx';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { eligibilityTables } from '../src/evidence/eligibilityTables.js';
import { createInitialScreenerState, evaluateAll } from '../src/evidence/screener-eval.js';

const trial = acronym => screenerTrials.find(item => item.acronym === acronym);
const state = patch => ({ ...createInitialScreenerState(), ...patch });

describe('STEP retains verified imaging checks and defers unresolved thresholds', () => {
  it('surfaces repeat imaging and verified core checks without adding M2 or diffusion-MRI cutoffs', () => {
    const result = evaluateAll(state({ classification: 'ischemic', onsetVal: 8, onsetUnit: 'hours', age: 60, preMrs: 1, aspects: 9, vessel: 'm2_m3_nd', nihss: 10 }));
    const step = [...result.pending, ...result.eligible].find(item => item.trial.acronym === 'STEP');
    expect(step).toBeDefined();
    const confirm = step.pendingCriteria.join('\n');
    expect(confirm).toContain('Tmax >4 seconds');
    expect(confirm).toContain('for either M2 or M3');
    expect(confirm).toContain('confirm vessel-dominance definitions with the current approved domain protocol');
    expect(confirm).toContain('infarct core <50% of the occluded territory');
    expect(confirm).toContain('confirm the diffusion-MRI threshold with the current approved domain protocol');
    expect(confirm).toContain('>120 minutes');
    expect(confirm).toContain('NIHSS 0-5, repeat only with significant NIHSS improvement');
    expect(result.briefingNote).toContain('Tmax >4 seconds');
    const publicText = [trial('STEP').conciseBedsideSummary, ...trial('STEP').exactInclusionCriteria, ...trial('STEP').sourceGaps, confirm].join('\n');
    expect(publicText).not.toMatch(/620|2026-08-11|screening (?:summary|reminder) dated|[<≤]\s*50% of (?:the )?(?:entire|overall) MCA territory/);
    expect(trial('STEP')).not.toHaveProperty('localActivation');
  });
});

describe('MINUTE displays the complete formal-source criteria with a partial modeled screen', () => {
  it('retains all eight inclusion and seventeen exclusion items and their formal provenance', () => {
    const minute = trial('MINUTE');
    expect(minute.exactInclusionCriteria).toHaveLength(8);
    expect(minute.exactExclusionCriteria).toHaveLength(17);
    const inclusion = minute.exactInclusionCriteria.join('\n');
    expect(inclusion).toContain('Informed consent from patient or LAR');
    expect(inclusion).toContain('surgery can be initiated <120 min from randomization');
    expect(inclusion).toContain('Randomization within 16 hours from LKW and within 2 hours of arrival');
    const exclusions = minute.exactExclusionCriteria.join('\n');
    expect(exclusions).toContain('Known hereditary or acquired hemorrhagic diathesis or coagulation factor deficiency');
    expect(exclusions).toContain('does not have the necessary mental capacity to participate or is unwilling to comply');
    expect(exclusions).toContain('Current participation in another interventional (drug or device) trial');
    expect(exclusions).toContain('Pre-existing Do Not Resuscitate (DNR)/Do Not Intubate (DNI) status');
    expect(exclusions).toContain('History of severe dementia');
    expect(exclusions).toContain('confirm its magnitude and units in the approved protocol');
    expect(minute.sourceGaps.join('\n')).toContain('https://clinicaltrials.gov/study/NCT07260916');
    expect(minute.sourceGaps.join('\n')).toContain('MINUTE_Protocol_Training_v1.1_Short_04_23_2026.pdf');
    expect(minute.sourceGaps.join('\n')).toContain('modeled first-pass screen encodes only a subset');
    expect(minute.eligibility.criteria).toHaveLength(8);
    expect(minute.eligibility.exclusions).toHaveLength(4);
  });
});

describe('CLARITY keeps confirmed recruitment distinct from the dated registry status', () => {
  it('keeps the recruiting profile while recording the maintainer confirmation generically', () => {
    const clarity = trial('CLARITY');
    expect(clarity.status).toBe('enrolling');
    expect(clarity.externalMetadata).toMatchObject({ registryStatus: 'NOT_YET_RECRUITING', verificationDate: '2026-11-04', registryLastUpdatePosted: '2026-10-26', localActivationStatus: 'not_assessed' });
    expect(clarity.sourceGaps.join('\n')).toContain('maintainer confirmed the study is actively enrolling on 2026-11-04');
    expect(clarity).not.toHaveProperty('localActivation');
    expect(clarity.exactInclusionCriteria.join('\n')).toContain('Signed and dated informed consent');
  });
});

describe('DISCOVERY is a registry reference rather than an automated eligibility screen', () => {
  it('retains the full core and tier-specific criteria without asserting site activation', () => {
    const discovery = trial('DISCOVERY');
    expect(discovery.referenceOnly).toBe(true);
    expect(discovery.externalMetadata).toMatchObject({ nct: 'NCT04916210', studyType: 'OBSERVATIONAL', registryStatus: 'RECRUITING', verificationDate: '2026-11-04', registryLastUpdatePosted: '2026-09-14' });
    expect(discovery.exactInclusionCriteria).toHaveLength(6);
    expect(discovery.exactInclusionCriteria.join('\n')).toMatch(/within 6 weeks of stroke onset/);
    expect(discovery.exactInclusionCriteria.join('\n')).toContain('informed consent by self or proxy');
    const exclusions = discovery.exactExclusionCriteria.join('\n');
    expect(discovery.exactExclusionCriteria).toHaveLength(7);
    expect(exclusions).toContain('Additional exclusion for Tier 2 participants: Contraindication to MRI');
    expect(exclusions).toContain('Additional exclusion for Tier 3 participants: Age <50 years');
    expect(exclusions).toContain('pregnant or seeking to become pregnant');
    expect(exclusions).toContain("Cowden disease, Lynch syndrome, hypogammaglobulinemia, Wiskott-Aldrich syndrome, Down's syndrome");
    expect(discovery).not.toHaveProperty('localActivation');
  });

  it('appears in ischemic and ICH phase references but never in candidate results', () => {
    expect(eligibilityTables.filter(table => table.trials.some(item => item.acronym === 'DISCOVERY')).map(table => table.id)).toEqual(['ischemic-inpatient', 'ischemic-outpatient', 'ich-inpatient', 'ich-outpatient']);
    for (const classification of ['ischemic', 'ich', 'tia']) {
      const results = evaluateAll(state({ classification, onsetVal: 7, onsetUnit: 'days', age: 60 }));
      expect([...results.pending, ...results.eligible, ...results.soon, ...results.excluded].map(item => item.trial.acronym)).not.toContain('DISCOVERY');
      expect(results.briefingNote).not.toContain('DISCOVERY');
    }
    const reference = eligibilityTables.find(table => table.id === 'ich-inpatient');
    expect(buildTableMarkdown(reference)).toContain('DISCOVERY NCT04916210');
    expect(buildTableMarkdown(reference)).toContain('not modeled in the screener');
  });
});


describe('public profiles keep local participation private', () => {
  it('contains no local activation record and retains the unconfirmed public scope', () => {
    for (const profile of screenerTrials) {
      expect(profile).not.toHaveProperty('localActivation');
      expect(profile.externalMetadata.localActivationStatus).toBe('not_assessed');
    }
    expect(evaluateAll(state({ classification: 'ich' })).briefingNote).toContain('local site activation is not confirmed.');
  });
});
