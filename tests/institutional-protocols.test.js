import { describe, it, expect } from 'vitest';
import {
  evaluateIVT,
  evaluateDOAC_IVT,
  evaluateEVT_Anterior,
  evaluateEVT_M2,
  evaluateEVT_Basilar,
  getSafePauseText,
  ICH_INITIAL_EVALUATION_ALGORITHM,
  INSTITUTIONAL_BP_PROTOCOLS,
  SAFE_PAUSE_ATTESTATION
} from '../src/institutional-protocols.js';

describe('evaluateIVT', () => {
  it('blocks if ICH on CT', () => {
    const r = evaluateIVT({ ichOnCT: true });
    expect(r.eligible).toBe(false);
  });
  it('blocks if non-disabling deficit', () => {
    const r = evaluateIVT({ ichOnCT: false, disablingDeficit: false });
    expect(r.eligible).toBe(false);
    expect(r.cor).toMatch(/3/);
  });
  it('recommends TNK within 4.5h', () => {
    const r = evaluateIVT({ ichOnCT: false, disablingDeficit: true, hoursFromLKW: 2, weight: 80 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
    expect(r.dose).toBe(20);
  });
  it('caps TNK at 25 mg for 120 kg patient', () => {
    const r = evaluateIVT({ ichOnCT: false, disablingDeficit: true, hoursFromLKW: 1, weight: 120 });
    expect(r.dose).toBe(25);
  });
  it('requires imaging for 4.5-9h window', () => {
    const r = evaluateIVT({ disablingDeficit: true, hoursFromLKW: 6 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/CTP|MRI|mismatch/i);
  });
  it('allows consider-TNK for 4.5-9h with MRI DWI-FLAIR mismatch', () => {
    const r = evaluateIVT({ disablingDeficit: true, hoursFromLKW: 6, imagingPathway: { mismatchPresent: true } });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
  });
  it('allows consider-TNK for 9-24h with CTP criteria met', () => {
    const r = evaluateIVT({ disablingDeficit: true, hoursFromLKW: 12, imagingPathway: { ctpCoreMl: 20, ctpRatio: 1.8, ctpMismatchVolMl: 30 } });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2b');
  });
  it('rejects 9-24h when CTP core too large', () => {
    const r = evaluateIVT({ disablingDeficit: true, hoursFromLKW: 12, imagingPathway: { ctpCoreMl: 80, ctpRatio: 1.8, ctpMismatchVolMl: 30 } });
    expect(r.eligible).toBe(false);
  });
  it('glucose <50 produces warning but still evaluates window', () => {
    const r = evaluateIVT({ disablingDeficit: true, hoursFromLKW: 2, weight: 70, glucose: 45 });
    expect(r.eligible).toBe(true);
    expect(r.warnings.join(' ')).toMatch(/glucose/i);
  });
  it('handles CRAO as consider with no LKW', () => {
    const r = evaluateIVT({ disablingDeficit: true, crao: true });
    expect(r.eligible).toBe('consider');
  });
});

describe('evaluateDOAC_IVT', () => {
  it('Hub pathway requires anti-Xa undetectable', () => {
    const ok = evaluateDOAC_IVT({ site: 'hub', antiXaUndetectable: true, disablingDeficit: true, hoursSinceLastDose: 10 });
    expect(ok.eligible).toBe('consider');
    const no = evaluateDOAC_IVT({ site: 'hub', antiXaUndetectable: false, disablingDeficit: true, hoursSinceLastDose: 10 });
    expect(no.eligible).toBe(false);
  });
  it('Spoke pathway requires normal renal + 24h since dose', () => {
    const ok = evaluateDOAC_IVT({ site: 'spoke', renalFunctionNormal: true, hoursSinceLastDose: 26, disablingDeficit: true });
    expect(ok.eligible).toBe('consider');
    const missingRenal = evaluateDOAC_IVT({ site: 'spoke', renalFunctionNormal: false, hoursSinceLastDose: 26, disablingDeficit: true });
    expect(missingRenal.eligible).toBe(false);
    const tooRecent = evaluateDOAC_IVT({ site: 'spoke', renalFunctionNormal: true, hoursSinceLastDose: 12, disablingDeficit: true });
    expect(tooRecent.eligible).toBe(false);
  });
  it('defers to EVT when patient is endovascular candidate', () => {
    const r = evaluateDOAC_IVT({ site: 'hub', endovascularCandidate: true, disablingDeficit: true });
    expect(r.eligible).toBe('preferred-other');
  });
  it('DOAC >48h → standard pathway (DOAC considered cleared)', () => {
    const r = evaluateDOAC_IVT({ site: 'hub', hoursSinceLastDose: 60, disablingDeficit: true });
    expect(r.eligible).toBe(true);
    expect(r.pathway).toBe('standard');
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
  it('0-6h very-large core (ASPECTS 0-2) → consider for age <80', () => {
    const r = evaluateEVT_Anterior({ aspectsScore: 2, timeFromLKWh: 2, nihss: 15, preMRS: 0, age: 65 });
    expect(r.eligible).toBe('consider');
    expect(r.cor).toBe('2a');
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
  it('M3 / ACA / PCA not recommended', () => {
    expect(evaluateEVT_M2({ segment: 'M3' }).eligible).toBe(false);
    expect(evaluateEVT_M2({ segment: 'ACA' }).eligible).toBe(false);
    expect(evaluateEVT_M2({ segment: 'PCA' }).eligible).toBe(false);
  });
});

describe('evaluateEVT_Basilar', () => {
  it('NIHSS ≥10 with pre-mRS 0-1, PC-ASPECTS ≥6 is Class 1', () => {
    const r = evaluateEVT_Basilar({ nihss: 15, hoursFromLKWh: 10, preMRS: 0, pcAspects: 8 });
    expect(r.eligible).toBe(true);
    expect(r.cor).toBe('1');
  });
  it('NIHSS 6-9 requires disabling + dual-specialty agreement', () => {
    const no = evaluateEVT_Basilar({ nihss: 7, hoursFromLKWh: 10, preMRS: 0, pcAspects: 7, disabling: false, dualSpecialtyAgreement: false });
    expect(no.eligible).toBe('pending');
    const yes = evaluateEVT_Basilar({ nihss: 7, hoursFromLKWh: 10, preMRS: 0, pcAspects: 7, disabling: true, dualSpecialtyAgreement: true });
    expect(yes.eligible).toBe('consider');
    expect(yes.institutionalRequirement).toMatch(/attending|concord|IR/i);
  });
  it('rejects beyond 24h', () => {
    const r = evaluateEVT_Basilar({ nihss: 15, hoursFromLKWh: 30, preMRS: 0, pcAspects: 8 });
    expect(r.eligible).toBe(false);
  });
});

describe('Safe Pause attestation', () => {
  it('includes the attestation tag', () => {
    const t = getSafePauseText({ consentType: 'informed', bp: '170/90' });
    expect(t).toContain(SAFE_PAUSE_ATTESTATION);
    expect(t).toContain('170/90');
  });
});

describe('institutional BP protocols present', () => {
  it('has all 6 scenarios', () => {
    const keys = Object.keys(INSTITUTIONAL_BP_PROTOCOLS);
    expect(keys).toContain('beforeIVT');
    expect(keys).toContain('afterIVT24h');
    expect(keys).toContain('afterEVT24h');
    expect(keys).toContain('sbpLT140IVT');
    expect(keys).toContain('sbpLT140EVT');
    expect(keys).toContain('noReperfusion');
  });
  it('post-EVT 72h harm rule captured (with evidence-based caveats)', () => {
    expect(INSTITUTIONAL_BP_PROTOCOLS.sbpLT140EVT.status).toMatch(/harm/i);
    expect(INSTITUTIONAL_BP_PROTOCOLS.sbpLT140EVT.rationale).toMatch(/ENCHANTED2-MT|OPTIMAL-BP|BP-TARGET|BEST-II/);
  });
});

describe('ICH initial evaluation algorithm', () => {
  const alg = ICH_INITIAL_EVALUATION_ALGORITHM;
  const text = JSON.stringify(alg);

  it('uses the >=15 mL ABC/2 early dual-consult threshold', () => {
    expect(alg.consultTrigger).toMatch(/>=15 mL by ABC\/2/);
    expect(text).toMatch(/Measure hematoma volume using ABC\/2/);
    expect(text).not.toMatch(/>15\s*cc/i);
  });

  it('permits direct Neurosurgery consultation with closed-loop communication', () => {
    expect(text).toMatch(/may consult Neurosurgery directly/);
    expect(text).toMatch(/prior approval is not required/i);
    expect(text).toMatch(/closes the loop/i);
    expect(text).toMatch(/designated on-call stroke attending/);
    expect(text).toMatch(/attending-of-record notification is not default/i);
  });

  it('captures requested trigger variants and pupillometry readiness', () => {
    const edNode = alg.decisionNodes.find((node) => node.title === 'ED diagnosis or arrival');
    const monitoringNode = alg.decisionNodes.find((node) => node.title === 'Monitoring adjuncts');
    expect(edNode).toBeTruthy();
    expect(monitoringNode).toBeTruthy();

    const edText = edNode.items.join(' ');
    expect(edText).toMatch(/IVH/);
    expect(edText).toMatch(/hydrocephalus/);
    expect(edText).toMatch(/multicompartmental hemorrhage/);
    expect(edText).toMatch(/ED attending discretion/);
    expect(monitoringNode.items.join(' ')).toMatch(/pupillometry/i);
  });

  it('captures the June 2026 MINUTE screen without publishing contact details', () => {
    const minute = alg.researchScreens.find((screen) => screen.title === 'MINUTE screen');
    expect(minute).toBeTruthy();
    const criteria = minute.criteria.join(' ');
    expect(criteria).toMatch(/Age 18-80/);
    expect(criteria).toMatch(/non-thalamic basal-ganglia IPH/);
    expect(criteria).toMatch(/Volume >=15 mL by ABC\/2/);
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
      /harborview/i, /\bHMC\b/, /UW Medicine/i, /UW Medical Center/i,
      /Stroke Phone/i, /MINUTE team/i, /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/
    ];
    for (const re of banned) {
      expect(re.test(text), `ICH algorithm contains banned token ${re}`).toBe(false);
    }
  });
});
