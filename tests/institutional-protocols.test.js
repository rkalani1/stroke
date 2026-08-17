import { describe, it, expect } from 'vitest';
import {
  evaluateIVT,
  evaluateDOAC_IVT,
  evaluateEVT_Anterior,
  evaluateEVT_M2,
  evaluateEVT_Basilar,
  getSafePauseText,
  getSafePauseIssues,
  ICH_INITIAL_EVALUATION_ALGORITHM,
  INSTITUTIONAL_BP_PROTOCOLS,
  SAFE_PAUSE_ATTESTATION,
  IVT_UNRESOLVED_SOURCE_CONFLICTS,
  IVT_ABSOLUTE_CONTRAINDICATIONS,
  IVT_RELATIVE_CONTRAINDICATIONS,
  IVT_BENEFIT_GREATER_CONSIDER,
  EXTENDED_WINDOW_IVT_DISCUSSION,
  COR_LOE_KEY,
  GENERALIZABILITY_LIMITATIONS,
  getLocalInstitutionalContent,
  LEGACY_BP_PROTOCOLS,
  evaluateIVT_Legacy,
  evaluateEVT_Legacy_Anterior,
  evaluateEVT_Legacy_M2,
  evaluateEVT_Legacy_Basilar
} from '../src/institutional-protocols.js';

describe('IVT_ABSOLUTE_CONTRAINDICATIONS', () => {
  it('is exported as formatted contraindication objects', () => {
    expect(Array.isArray(IVT_ABSOLUTE_CONTRAINDICATIONS)).toBe(true);
    expect(IVT_ABSOLUTE_CONTRAINDICATIONS.length).toBeGreaterThan(0);
    IVT_ABSOLUTE_CONTRAINDICATIONS.forEach((contraindication) => {
      expect(contraindication).toHaveProperty('label');
      expect(typeof contraindication.label).toBe('string');
      expect(contraindication).toHaveProperty('detail');
      expect(typeof contraindication.detail).toBe('string');
    });
  });

  it('includes critical absolute contraindications', () => {
    const labels = IVT_ABSOLUTE_CONTRAINDICATIONS.map((item) => item.label);
    expect(labels).toContain('CT with hemorrhage');
    expect(labels).toContain('Severe coagulopathy');
    expect(labels).not.toContain('Intracranial or intraspinal surgery <60 days');
  });
});

describe('IVT_RELATIVE_CONTRAINDICATIONS', () => {
  it('is exported and is a non-empty array', () => {
    expect(Array.isArray(IVT_RELATIVE_CONTRAINDICATIONS)).toBe(true);
    expect(IVT_RELATIVE_CONTRAINDICATIONS.length).toBeGreaterThan(0);
  });

  it('contains objects with label and detail properties', () => {
    IVT_RELATIVE_CONTRAINDICATIONS.forEach(contraindication => {
      expect(contraindication).toHaveProperty('label');
      expect(typeof contraindication.label).toBe('string');
      expect(contraindication).toHaveProperty('detail');
      expect(typeof contraindication.detail).toBe('string');
    });
  });
});

describe('IVT_BENEFIT_GREATER_CONSIDER', () => {
  it('is exported as formatted benefit-greater consideration objects', () => {
    expect(Array.isArray(IVT_BENEFIT_GREATER_CONSIDER)).toBe(true);
    expect(IVT_BENEFIT_GREATER_CONSIDER.length).toBeGreaterThan(0);
    IVT_BENEFIT_GREATER_CONSIDER.forEach((item) => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('detail');
      expect(typeof item.label).toBe('string');
      expect(typeof item.detail).toBe('string');
    });
  });

  it('includes specific known criteria', () => {
    const labels = IVT_BENEFIT_GREATER_CONSIDER.map((item) => item.label);
    expect(labels).toContain('Extracranial cervical dissection');
    expect(labels).toContain('History of MI (remote)');
    expect(labels).toContain('Moya-moya disease');
  });
});

describe('EXTENDED_WINDOW_IVT_DISCUSSION', () => {
  it('contains key extended-window IVT counseling points', () => {
    expect(typeof EXTENDED_WINDOW_IVT_DISCUSSION).toBe('string');
    expect(EXTENDED_WINDOW_IVT_DISCUSSION.length).toBeGreaterThan(0);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/Tenecteplase/i);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/4\.5-hour window/i);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/9-11%/);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/3%/);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/serious bleeding/i);
    expect(EXTENDED_WINDOW_IVT_DISCUSSION).toMatch(/benefit of treatment outweighs the risk/i);
  });
});

describe('COR_LOE_KEY', () => {
  it('contains both COR and LOE sections', () => {
    expect(COR_LOE_KEY).toHaveProperty('cor');
    expect(COR_LOE_KEY).toHaveProperty('loe');
  });

  it('defines standard COR classes', () => {
    expect(COR_LOE_KEY.cor['1'].strength).toBe('Strong');
    expect(COR_LOE_KEY.cor['2a'].strength).toBe('Moderate');
    expect(COR_LOE_KEY.cor['2b'].verb).toBe('May be considered');
    expect(COR_LOE_KEY.cor['3-harm'].verb).toMatch(/harmful/i);
    expect(Object.keys(COR_LOE_KEY.cor)).toEqual(['1', '2a', '2b', '3-nb', '3-harm']);
  });

  it('defines standard LOE classes', () => {
    expect(COR_LOE_KEY.loe.A).toMatch(/RCTs/);
    expect(COR_LOE_KEY.loe['B-R']).toMatch(/RCTs/);
    expect(COR_LOE_KEY.loe['C-EO']).toMatch(/Expert opinion/);
  });
});

describe('GENERALIZABILITY_LIMITATIONS', () => {
  it('is exported as non-empty strings', () => {
    expect(Array.isArray(GENERALIZABILITY_LIMITATIONS)).toBe(true);
    expect(GENERALIZABILITY_LIMITATIONS.length).toBeGreaterThan(0);
    GENERALIZABILITY_LIMITATIONS.forEach((limitation) => {
      expect(typeof limitation).toBe('string');
      expect(limitation.trim().length).toBeGreaterThan(0);
    });
  });

  it('contains specific known limitations', () => {
    expect(GENERALIZABILITY_LIMITATIONS).toContain('Age >80');
    expect(GENERALIZABILITY_LIMITATIONS).toContain('Life expectancy <6 months');
    expect(GENERALIZABILITY_LIMITATIONS).toContain('Seizures at stroke onset');
  });
});

// Source: Clinical Telestroke Workflow (rev 6/30/2026) lists these explicitly. They were
// absent from the app until the source register was corrected to include that document.
describe('IVT contraindication lists match the current local eligibility criteria', () => {
  const abs = () => IVT_ABSOLUTE_CONTRAINDICATIONS.map((x) => x.label).join(' | ');
  const rel = () => IVT_RELATIVE_CONTRAINDICATIONS.map((x) => x.label).join(' | ');
  it('absolute list carries SAH-suggestive presentation, active internal bleeding, intra-axial neoplasm', () => {
    expect(abs()).toMatch(/suggestive of SAH/i);
    expect(abs()).toMatch(/Active internal bleeding/i);
    expect(abs()).toMatch(/Intra-axial intracranial neoplasm/i);
  });
  it('keeps the supported acute spinal cord injury window without selecting a conflicted head-trauma window', () => {
    expect(abs()).toMatch(/Acute spinal cord injury <90 days/);
    expect(abs()).not.toMatch(/Acute intracranial injury <14 days/);
    expect(abs()).not.toMatch(/Severe head trauma <(14|90) days/);
  });
  it('relative list carries >10 cerebral microbleeds', () => {
    expect(rel()).toMatch(/>10 cerebral microbleeds/);
  });
  it('limits the supported 14-day entry to extracranial surgery or trauma', () => {
    expect(rel()).toMatch(/Major extracranial surgery or trauma <14 days/);
    expect(rel()).not.toMatch(/Major non-CNS surgery <10 days/);
  });
});

describe('IVT unresolved source conflicts', () => {
  it('publishes all three held conflicts without selecting an executable rule', () => {
    expect(IVT_UNRESOLVED_SOURCE_CONFLICTS.map((item) => item.key)).toEqual([
      'doac-factor-xa',
      'head-trauma-neurosurgery',
      'prior-stroke-tier'
    ]);
    const text = JSON.stringify(IVT_UNRESOLVED_SOURCE_CONFLICTS);
    expect(text).toMatch(/<48 hours vs >24 to <48 hours/);
    expect(text).toMatch(/14 vs 90\/60 days/);
    expect(text).toMatch(/absolute vs relative tier/);
    expect(text).toMatch(/No (rule|time window|tier) is selected/g);
  });
});

describe('evaluateIVT', () => {
  const standard = {
    age: 64,
    ichOnCT: false,
    disablingDeficit: true,
    glucose: 100,
    weight: 80,
    bpSystolic: 170,
    bpDiastolic: 90,
    contraindicationsReviewed: true,
    hoursFromLKW: 2
  };
  const extended = {
    ...standard,
    hoursFromLKW: 6,
    preMRS: 1,
    evtStatus: 'not-candidate'
  };

  it('CRAO within 4.5h returns the shared-decision framing, not a standard-window recommendation', () => {
    const r = evaluateIVT({ ...standard, crao: true });
    expect(r.eligible).toBe('consider');
    expect(r.recommendation).toMatch(/CRAO/);
    expect(r.recommendation).not.toMatch(/TNK recommended/i);
    expect(r.cor).not.toBe('1');
  });
  it('CRAO beyond 4.5h is not supported', () => {
    const r = evaluateIVT({ ...standard, crao: true, hoursFromLKW: 8 });
    expect(r.eligible).toBe(false);
    expect(r.recommendation).toMatch(/beyond 4\.5h/i);
  });
  it('does not soften the CRAO efficacy statement', () => {
    const r = evaluateIVT({ ...standard, crao: true });
    expect(r.rationale).toMatch(/does not support efficacy/);
    expect(r.rationale).not.toMatch(/not strongly support/);
  });
  it('warns when age is under 18 and points at the pediatric pathway', () => {
    const r = evaluateIVT({ ...standard, age: 9 });
    expect(r.eligible).toBeNull();
    expect(r.warnings.join(' ')).toMatch(/pediatric/i);
    expect(r.warnings.join(' ')).toMatch(/<18|under 18/i);
  });
  it('does not warn on age for adults', () => {
    const r = evaluateIVT(standard);
    expect(r.warnings.join(' ')).not.toMatch(/pediatric/i);
  });
  it('blocks if ICH on CT', () => {
    const r = evaluateIVT({ ...standard, ichOnCT: true });
    expect(r.eligible).toBe(false);
  });
  it('blocks if non-disabling deficit', () => {
    const r = evaluateIVT({ ...standard, disablingDeficit: false });
    expect(r.eligible).toBe(false);
    expect(r.cor).toMatch(/3/);
  });
  it('recommends TNK within 4.5h', () => {
    const r = evaluateIVT(standard);
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
    expect(r.dose).toBe(20);
  });
  it('caps TNK at 25 mg for 120 kg patient', () => {
    const r = evaluateIVT({ ...standard, hoursFromLKW: 1, weight: 120 });
    expect(r.dose).toBe(25);
  });
  it('fails closed when adult age, CT result, glucose, disability, or weight is missing', () => {
    expect(evaluateIVT({ ...standard, age: undefined }).eligible).toBeNull();
    expect(evaluateIVT({ ...standard, ichOnCT: undefined }).eligible).toBeNull();
    expect(evaluateIVT({ ...standard, glucose: undefined }).eligible).toBeNull();
    expect(evaluateIVT({ ...standard, disablingDeficit: undefined }).eligible).toBeNull();
    for (const weight of [undefined, 0, -10]) {
      expect(evaluateIVT({ ...standard, weight }).eligible).toBe('pending');
    }
  });
  it('withholds every affirmative result until BP and contraindication review are explicit', () => {
    expect(evaluateIVT({ ...standard, bpSystolic: undefined }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, bpDiastolic: undefined }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, contraindicationsReviewed: false }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, bpSystolic: 185 }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, bpDiastolic: 110 }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, bpSystolic: 184, bpDiastolic: 109 }).eligible).toBe(true);
  });
  it('requires mismatch imaging and the extended-window gates for 4.5-9h', () => {
    const r = evaluateIVT(extended);
    expect(r.eligible).toBe('pending');
    expect(r.reason).toMatch(/CTP|MRI|mismatch/i);
  });
  it('allows consider-TNK for 4.5-9h with MRI DWI-FLAIR mismatch', () => {
    const r = evaluateIVT({ ...extended, imagingPathway: { mriDwiFlairMismatch: true } });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
  });
  it('routes wake-up or unknown onset only through the MRI mismatch branch', () => {
    const wakeUp = {
      ...extended,
      hoursFromLKW: undefined,
      wakeUpOrUnknownOnset: true
    };
    const mri = evaluateIVT({ ...wakeUp, imagingPathway: { mriDwiFlairMismatch: true } });
    expect(mri.eligible).toBe('consider');
    expect(mri.cor).toBe('2a');
    const ctpOnly = evaluateIVT({
      ...wakeUp,
      imagingPathway: { ctpCoreMl: 20, ctpRatio: 1.8, ctpMismatchVolMl: 30 }
    });
    expect(ctpOnly.eligible).toBe('pending');
    expect(ctpOnly.reason).toMatch(/MRI DWI-FLAIR mismatch/i);
  });
  it('ignores a stale numeric LKW interval when wake-up or unknown onset is selected', () => {
    const wakeUpWithStaleHours = {
      ...extended,
      hoursFromLKW: 2,
      wakeUpOrUnknownOnset: true
    };
    const noMismatch = evaluateIVT(wakeUpWithStaleHours);
    expect(noMismatch.eligible).toBe('pending');
    expect(noMismatch.reason).toMatch(/MRI DWI-FLAIR mismatch/i);

    const mri = evaluateIVT({
      ...wakeUpWithStaleHours,
      imagingPathway: { mriDwiFlairMismatch: true }
    });
    expect(mri.eligible).toBe('consider');
    expect(mri.cor).toBe('2a');
  });
  it('allows consider-TNK for 9-24h with CTP criteria met, and asserts no COR grade', () => {
    const r = evaluateIVT({
      ...extended,
      hoursFromLKW: 12,
      consentObtained: true,
      imagingPathway: { ctpCoreMl: 20, ctpRatio: 1.8, ctpMismatchVolMl: 30 }
    });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBeUndefined();
    expect(r.loe).toBeUndefined();
    expect(r.nextStep).toMatch(/no COR or LOE grade/i);
  });
  it('holds 9-24h when CTP criteria or consent are incomplete', () => {
    const tooLarge = evaluateIVT({
      ...extended,
      hoursFromLKW: 12,
      consentObtained: true,
      imagingPathway: { ctpCoreMl: 80, ctpRatio: 1.8, ctpMismatchVolMl: 30 }
    });
    expect(tooLarge.eligible).toBe('pending');
    const noConsent = evaluateIVT({
      ...extended,
      hoursFromLKW: 12,
      imagingPathway: { ctpCoreMl: 20, ctpRatio: 1.8, ctpMismatchVolMl: 30 }
    });
    expect(noConsent.eligible).toBe('pending');
    expect(noConsent.reason).toMatch(/consent/i);
  });
  it('holds extreme glucose before any non-disabling or affirmative result', () => {
    const pending = evaluateIVT({ ...standard, glucose: 45, disablingDeficit: false });
    expect(pending.eligible).toBe('pending');
    expect(pending.reason).toMatch(/correct/i);
    const reassessed = evaluateIVT({ ...standard, glucose: 45, glucoseCorrectedDeficitPersists: true });
    expect(reassessed.eligible).toBe(true);
    expect(reassessed.warnings.join(' ')).toMatch(/corrected/i);
  });
  it('holds CRAO with missing or negative LKW', () => {
    expect(evaluateIVT({ ...standard, crao: true, hoursFromLKW: undefined }).eligible).toBe('pending');
    expect(evaluateIVT({ ...standard, crao: true, hoursFromLKW: -1 }).eligible).toBeNull();
  });
});

describe('evaluateDOAC_IVT', () => {
  it('returns the unresolved hold for every prior hub, spoke, timing, assay, and EVT branch', () => {
    const variants = [
      { site: 'hub', antiXaUndetectable: true, disablingDeficit: true, hoursSinceLastDose: 10 },
      { site: 'spoke', renalFunctionNormal: true, hoursSinceLastDose: 26, disablingDeficit: true },
      { site: 'hub', endovascularCandidate: true, disablingDeficit: true },
      { site: 'hub', hoursSinceLastDose: 60, disablingDeficit: true }
    ];
    for (const input of variants) {
      const result = evaluateDOAC_IVT(input);
      expect(result.eligible).toBe('pending');
      expect(result.pathway).toBe('unresolved-source-conflict');
      expect(result.reason).toMatch(/No affirmative or negative IVT eligibility result/i);
      expect(result.requirement).toMatch(/Evaluate EVT independently/i);
    }
  });
});

describe('evaluateEVT_Anterior', () => {
  it('0-6h standard criteria (ASPECTS ≥6, mRS ≤1)', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 8, timeFromLKWh: 3, nihss: 12, preMRS: 0 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  it('0-6h large core (ASPECTS 3-5) still Class 1 if no mass effect', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 4, timeFromLKWh: 3, nihss: 12, preMRS: 0, massEffect: false });
    expect(r.eligible).toBe(true);
  });
  it('0-6h very-large core (ASPECTS 0-2) is consider only at the unambiguous ≤70 mL boundary', () => {
    const r = evaluateEVT_Anterior({
      aspectsScore: 2,
      timeFromLKWh: 2,
      nihss: 15,
      preMRS: 0,
      age: 65,
      massEffect: false,
      coreVolume: 70
    });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
  });
  it('holds the ambiguous 71-100 mL core range for owner adjudication', () => {
    for (const coreVolume of [71, 100]) {
      const r = evaluateEVT_Anterior({
        aspectsScore: 2,
        timeFromLKWh: 2,
        nihss: 15,
        preMRS: 0,
        age: 65,
        massEffect: false,
        coreVolume
      });
      expect(r.eligible).toBe('pending');
      expect(r.reason).toMatch(/71-100 mL|owner adjudication/i);
    }
  });
  it('fails closed when very-large-core age, mass effect, or volume is unassessed', () => {
    const base = { aspectsScore: 2, timeFromLKWh: 2, nihss: 15, preMRS: 0 };
    expect(evaluateEVT_Anterior({ ...base, massEffect: false, coreVolume: 60 }).eligible).toBe('pending');
    expect(evaluateEVT_Anterior({ ...base, age: 65, coreVolume: 60 }).eligible).toBe('pending');
    expect(evaluateEVT_Anterior({ ...base, age: 65, massEffect: false }).eligible).toBe('pending');
  });
  it('pre-mRS 2 is consider at 2a, B-NR', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 8, timeFromLKWh: 3, nihss: 10, preMRS: 2 });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
  });
  it('6-24h with age <80 and ASPECTS ≥6 is recommended', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 8, timeFromLKWh: 12, nihss: 10, preMRS: 0, age: 65 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  // Source: EVT Eligibility flowchart (June 2026) routes 6-24h ASPECTS 6-10 straight to
  // COR 1 / LOE A with no age or mass-effect qualifier — the age ceiling belongs only to
  // the large-core tiers. Guards against re-introducing the old over-restriction.
  it('6-24h ASPECTS ≥6 carries no age ceiling', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 8, timeFromLKWh: 12, nihss: 10, preMRS: 0, age: 88 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  it('6-24h ASPECTS ≥6 does not require absence of mass effect', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 7, timeFromLKWh: 9, nihss: 14, preMRS: 1, age: 70, massEffect: true });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  it('6-24h large core (ASPECTS 3-5) needs age <80 and no mass effect', () => {
    const ok = evaluateEVT_Anterior({ aspectsScore: 4, timeFromLKWh: 10, nihss: 16, preMRS: 0, age: 62, massEffect: false });
    expect(ok.eligible).toBe(true);
    expect(ok.cor).toBe('1');
    expect(evaluateEVT_Anterior({ aspectsScore: 4, timeFromLKWh: 10, nihss: 16, preMRS: 0, age: 84, massEffect: false }).eligible).toBe(false);
    expect(evaluateEVT_Anterior({ aspectsScore: 4, timeFromLKWh: 10, nihss: 16, preMRS: 0, age: 62, massEffect: true }).eligible).toBe(false);
  });
  it('rejects missing or invalid critical inputs without an affirmative result', () => {
    const base = { aspectsScore: 8, timeFromLKWh: 3, nihss: 12, preMRS: 0 };
    expect(evaluateEVT_Anterior({ ...base, aspectsScore: undefined }).eligible).toBeNull();
    expect(evaluateEVT_Anterior({ ...base, timeFromLKWh: -1 }).eligible).toBeNull();
    expect(evaluateEVT_Anterior({ ...base, nihss: 43 }).eligible).toBeNull();
    expect(evaluateEVT_Anterior({ ...base, preMRS: 7 }).eligible).toBeNull();
    expect(evaluateEVT_Anterior({ ...base, age: 12 }).eligible).toBeNull();
    expect(evaluateEVT_Anterior({ ...base, coreVolume: -1 }).eligible).toBeNull();
  });
});

describe('evaluateEVT_M2', () => {
  it('dominant proximal M2 within 6h is consider (Class 2a)', () => {
    const r = evaluateEVT_M2({ segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: 4, nihss: 10, preMRS: 0, aspectsScore: 8 });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
  });
  it('non-dominant M2 NOT recommended', () => {
    const r = evaluateEVT_M2({ segment: 'M2-nondominant' });
    expect(r.eligible).toBe(false);
    expect(r.cor).toMatch(/3/);
  });
  it('leaves M3 unassigned while the source explicitly does not recommend ACA/PCA', () => {
    const m3 = evaluateEVT_M2({ segment: 'M3' });
    expect(m3.eligible).toBeNull();
    expect(m3.reason).toMatch(/not assigned/i);
    expect(evaluateEVT_M2({ segment: 'ACA' }).eligible).toBe(false);
    expect(evaluateEVT_M2({ segment: 'PCA' }).eligible).toBe(false);
  });
  // Source adds a 6-24h dominant-M2 tier gated on CTP hypoperfusion-hypodensity mismatch.
  it('dominant M2 at 6-24h requires CTP mismatch', () => {
    const base = { segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: 11, nihss: 9, preMRS: 0, aspectsScore: 7 };
    expect(evaluateEVT_M2({ ...base, ctpMismatch: true }).eligible).toBe('consider');
    expect(evaluateEVT_M2({ ...base, ctpMismatch: true }).cor).toBe('2a');
    expect(evaluateEVT_M2({ ...base }).eligible).toBe('pending');
  });
  // Codominant M2 (90-100 mL tissue at risk) sits between dominant and non-dominant and
  // is NOT assigned COR 3 by the source; it must not be reported as "no benefit".
  it('codominant M2 is indeterminate, not COR 3', () => {
    const r = evaluateEVT_M2({ segment: 'M2-codominant' });
    expect(r.eligible).toBe('pending');
    expect(r.cor).not.toMatch(/3/);
  });
  it('fails closed on missing or out-of-range dominant-M2 inputs', () => {
    const base = { segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: 4, nihss: 10, preMRS: 0, aspectsScore: 8 };
    expect(evaluateEVT_M2({ ...base, hoursFromLKWh: undefined }).eligible).toBeNull();
    expect(evaluateEVT_M2({ ...base, hoursFromLKWh: -1 }).eligible).toBeNull();
    expect(evaluateEVT_M2({ ...base, nihss: 43 }).eligible).toBeNull();
    expect(evaluateEVT_M2({ ...base, preMRS: 7 }).eligible).toBeNull();
    expect(evaluateEVT_M2({ ...base, aspectsScore: 11 }).eligible).toBeNull();
  });
  it('never applies the adult M2 algorithm to a known pediatric age', () => {
    const r = evaluateEVT_M2({ segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: 1, nihss: 6, preMRS: 0, aspectsScore: 6, age: 10 });
    expect(r.eligible).toBeNull();
    expect(r.reason).toMatch(/adult EVT algorithm does not apply below age 18/i);
  });
});

describe('evaluateEVT_Basilar', () => {
  it('NIHSS ≥10 with pre-mRS 0-1, PC-ASPECTS ≥6 is Class 1', () => {
    const r = evaluateEVT_Basilar({ nihss: 15, hoursFromLKWh: 10, preMRS: 0, pcAspects: 8 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  it('NIHSS 6-9 is consider using only the source-listed gates', () => {
    const r = evaluateEVT_Basilar({ nihss: 7, hoursFromLKWh: 10, preMRS: 0, pcAspects: 7 });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2b');
    expect(r.loe).toBe('B-R');
  });
  it('rejects beyond 24h', () => {
    const r = evaluateEVT_Basilar({ nihss: 15, hoursFromLKWh: 30, preMRS: 0, pcAspects: 8 });
    expect(r.eligible).toBe(false);
  });
  it('fails closed on missing, negative, or out-of-range inputs', () => {
    const base = { nihss: 15, hoursFromLKWh: 10, preMRS: 0, pcAspects: 8 };
    expect(evaluateEVT_Basilar({ ...base, pcAspects: undefined }).eligible).toBeNull();
    expect(evaluateEVT_Basilar({ ...base, hoursFromLKWh: -1 }).eligible).toBeNull();
    expect(evaluateEVT_Basilar({ ...base, nihss: 43 }).eligible).toBeNull();
    expect(evaluateEVT_Basilar({ ...base, preMRS: 7 }).eligible).toBeNull();
    expect(evaluateEVT_Basilar({ ...base, pcAspects: 11 }).eligible).toBeNull();
  });
  it('never applies the adult basilar algorithm to a known pediatric age', () => {
    const r = evaluateEVT_Basilar({ nihss: 10, hoursFromLKWh: 1, preMRS: 0, pcAspects: 6, age: 10 });
    expect(r.eligible).toBeNull();
    expect(r.reason).toMatch(/adult EVT algorithm does not apply below age 18/i);
  });
});

describe('Safe Pause attestation', () => {
  it('includes the attestation only when every required gate is complete', () => {
    const t = getSafePauseText({ consentType: 'informed', bp: '170/90', contraindications: 'reviewed' });
    expect(t).toContain(SAFE_PAUSE_ATTESTATION);
    expect(t).toContain('170/90');
  });
  it('fails closed for incomplete review, missing consent, malformed BP, or threshold BP', () => {
    const cases = [
      { consentType: 'informed', bp: '170/90' },
      { consentType: '', bp: '170/90', contraindications: 'reviewed' },
      { consentType: 'declined', bp: '170/90', contraindications: 'reviewed' },
      { consentType: 'informed', bp: 'not-a-bp', contraindications: 'reviewed' },
      { consentType: 'informed', bp: '185/109', contraindications: 'reviewed' },
      { consentType: 'informed', bp: '184/110', contraindications: 'reviewed' }
    ];
    for (const input of cases) {
      const text = getSafePauseText(input);
      expect(text).toMatch(/NOT READY — DO NOT ATTEST/);
      expect(text).not.toContain(`Attestation: ${SAFE_PAUSE_ATTESTATION}`);
      expect(getSafePauseIssues(input).length).toBeGreaterThan(0);
    }
    expect(getSafePauseText({ consentType: 'informed', bp: '184/109', contraindications: 'reviewed' })).toContain(SAFE_PAUSE_ATTESTATION);
  });
});

describe('institutional BP protocols present', () => {
  it('contains exactly the three scenarios printed in the accepted institutional source', () => {
    expect(Object.keys(INSTITUTIONAL_BP_PROTOCOLS)).toEqual(['beforeIVT', 'afterIVT24h', 'afterEVT24h']);
    expect(INSTITUTIONAL_BP_PROTOCOLS.beforeIVT.target).toBe('BP <185/110');
    expect(INSTITUTIONAL_BP_PROTOCOLS.afterIVT24h.target).toBe('BP <180/105');
    expect(INSTITUTIONAL_BP_PROTOCOLS.afterEVT24h.target).toBe('SBP 140-180');
    expect(JSON.stringify(INSTITUTIONAL_BP_PROTOCOLS)).not.toMatch(/ENCHANTED2-MT|OPTIMAL-BP|BP-TARGET|BEST-II/);
  });
});

describe('ICH initial evaluation algorithm', () => {
  const alg = ICH_INITIAL_EVALUATION_ALGORITHM;
  const text = JSON.stringify(alg);
  const sentinel = (...parts) => parts.join('_');

  it('uses the >=15 mL ABC/2 early Neurosurgery plus stroke-service evaluation threshold', () => {
    expect(alg.consultTrigger).toMatch(/>=15 mL by ABC\/2/);
    expect(text).toMatch(/Measure hematoma volume using ABC\/2/);
    expect(text).not.toMatch(/>15\s*cc/i);
  });

  it('permits direct Neurosurgery consultation with closed-loop communication', () => {
    expect(text).toMatch(/may consult Neurosurgery directly/);
    expect(text).toMatch(/prior approval is not required/i);
    expect(text).toMatch(/closes the loop/i);
    expect(text).toMatch(/designated on-call stroke attending/);
    expect(text).not.toMatch(/attending-of-record notification is not default/i);
  });

  it('captures the source-listed early-consult triggers without adding pupillometry rules', () => {
    const edNode = alg.decisionNodes.find((node) => node.title === 'ED diagnosis or arrival');
    const monitoringNode = alg.decisionNodes.find((node) => node.title === 'Monitoring adjuncts');
    expect(edNode).toBeTruthy();
    expect(monitoringNode).toBeTruthy();

    const edText = edNode.items.join(' ');
    expect(edText).toMatch(/IVH/);
    expect(edText).toMatch(/hydrocephalus/);
    // No accepted institutional source supplies a pupillometry trigger or monitoring rule.
    expect(edText).not.toMatch(/pupillometry/i);
    expect(edText).toMatch(/multicompartmental hemorrhage/);
    expect(edText).toMatch(/ED attending discretion/);
    expect(monitoringNode.items.join(' ')).not.toMatch(/pupillometry/i);
  });

  it('keeps decompression criteria limited to life-threatening mass effect', () => {
    const decompression = alg.surgicalScreens.find((screen) => screen.title === 'Decompression');
    expect(decompression).toBeTruthy();
    const criteria = decompression.criteria.join(' ');
    expect(criteria).toMatch(/Life-threatening mass effect/);
    expect(criteria).not.toMatch(/Life-threatening or significant mass effect/);
  });

  it('captures the June 2026 MINUTE screen without publishing contact details', () => {
    const minute = alg.researchScreens.find((screen) => screen.title === 'MINUTE screen');
    expect(minute).toBeTruthy();
    const criteria = minute.criteria.join(' ');
    expect(criteria).toMatch(/Age 18-80/);
    expect(criteria).toMatch(/non-thalamic basal-ganglia IPH/);
    expect(criteria).toMatch(/Basal-ganglia IPH volume >=20 mL by ABC\/2/);
    expect(criteria).not.toMatch(/or close/i);
    expect(criteria).toMatch(/NIHSS >=6/);
    expect(criteria).toMatch(/<=15 hours since last known well/);
    expect(criteria).toMatch(/without vascular lesion/);
    expect(minute.action).toMatch(/MINUTE has operational priority over MIRROR/i);
    expect(minute.action).toMatch(/do not publish or infer internal contact details/i);
  });

  it('keeps MIRROR as a verify-current-protocol registry screen', () => {
    const mirror = alg.researchScreens.find((screen) => screen.title === 'MIRROR registry screen');
    expect(mirror).toBeTruthy();
    const criteriaText = mirror.criteria.join(' ');
    expect(criteriaText).toMatch(/thresholds are version-sensitive/i);
    expect(criteriaText).toMatch(/premorbid mRS/i);
    expect(criteriaText).toMatch(/GCS/i);
    expect(criteriaText).toMatch(/active registry protocol/);
    expect(mirror.action).toMatch(/Do not let registry screening delay/);
  });

  it('keeps ENRICH-based MIE criteria aligned to the June 2026 pathway', () => {
    const mie = alg.surgicalScreens.find((screen) => screen.title === 'Minimally invasive evacuation');
    expect(mie).toBeTruthy();
    expect(mie.criteria).toContain('Lobar IPH 30-80 mL');
    expect(mie.criteria).toContain('Age 18-80');
    expect(mie.criteria).toContain('NIHSS >5');
    expect(mie.criteria).toContain('GCS 5-14');
    expect(mie.criteria.join(' ')).not.toMatch(/GCS 5-1[25]/);
  });

  it('requires a cross-team surgical safety pause', () => {
    const pause = alg.safetyPause.items.join(' ');
    expect(pause).toMatch(/time-out\/safety pause/);
    expect(pause).toMatch(/Neurosurgery, the stroke service, and the ICU team agree/);
  });

  it('stays public-safe and institution-neutral', () => {
    const banned = [
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL'), 'i'),
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL'), 'i'),
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL'), 'i'),
      new RegExp(sentinel('PRIVATE', 'SOURCE', 'ATTACHMENT', 'SENTINEL'), 'i'),
      new RegExp(sentinel('PRIVATE', 'LOCAL', 'CONTACT', 'SENTINEL'), 'i'),
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/
    ];
    for (const re of banned) {
      expect(re.test(text), `ICH algorithm contains banned token ${re}`).toBe(false);
    }
  });
});

describe('getLocalInstitutionalContent', () => {
  const withWindow = (value, assertion) => {
    const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const originalWindow = globalThis.window;
    if (value === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = value;
    }
    try {
      assertion();
    } finally {
      if (hadWindow) {
        globalThis.window = originalWindow;
      } else {
        delete globalThis.window;
      }
    }
  };

  it('returns null when window is undefined', () => {
    withWindow(undefined, () => {
      expect(getLocalInstitutionalContent()).toBe(null);
    });
  });

  it('returns null when local institutional data is not set', () => {
    withWindow({}, () => {
      expect(getLocalInstitutionalContent()).toBe(null);
    });
  });

  it('returns null when local institutional data is malformed', () => {
    withWindow({ __INSTITUTIONAL_LOCAL__: 'string' }, () => {
      expect(getLocalInstitutionalContent()).toBe(null);
    });
    withWindow({ __INSTITUTIONAL_LOCAL__: { sections: [] } }, () => {
      expect(getLocalInstitutionalContent()).toBe(null);
    });
    withWindow({ __INSTITUTIONAL_LOCAL__: { institutionName: 'Hospital', sections: {} } }, () => {
      expect(getLocalInstitutionalContent()).toBe(null);
    });
  });

  it('returns the local object when valid', () => {
    const validLocal = { institutionName: 'Hospital', sections: [] };
    withWindow({ __INSTITUTIONAL_LOCAL__: validLocal }, () => {
      expect(getLocalInstitutionalContent()).toBe(validLocal);
    });
  });
});

describe('Backwards-compat aliases', () => {
  it('exports aliases that exactly match their current implementations', () => {
    expect(LEGACY_BP_PROTOCOLS).toBe(INSTITUTIONAL_BP_PROTOCOLS);
    expect(evaluateIVT_Legacy).toBe(evaluateIVT);
    expect(evaluateEVT_Legacy_Anterior).toBe(evaluateEVT_Anterior);
    expect(evaluateEVT_Legacy_M2).toBe(evaluateEVT_M2);
    expect(evaluateEVT_Legacy_Basilar).toBe(evaluateEVT_Basilar);
  });
});
