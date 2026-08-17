// Public-safe translation of the current accepted institutional stroke sources.
// Adult Protocols content in this module is limited to that source set. Literature
// and society guidance are not used as substitute protocol authority. Operational
// identifiers, contact details, platform tokens, and source file names are omitted.
// This educational implementation is not a substitute for the approved source or
// patient-specific clinical judgment.

// =====================================================================
// Adult blood-pressure protocols in the accepted institutional source set
// =====================================================================
export const INSTITUTIONAL_BP_PROTOCOLS = {
  beforeIVT: {
    scenario: 'Before IVT',
    target: 'BP <185/110',
    protocol: 'Labetalol 10 mg IV, repeat q15 min; escalate to 20 mg, then 40 mg, then 60 mg (max single bolus). Max 300 mg in 2h.'
  },
  afterIVT24h: {
    scenario: 'After IVT (24h)',
    target: 'BP <180/105',
    protocol: 'Monitor q15 min × 2h → q30 min × 6h → q1h × 16h; treat if SBP >180 or DBP >105; maintain BP below 180/105 for 24 hours.'
  },
  afterEVT24h: {
    scenario: 'After EVT (24h)',
    appliesWhen: 'Documented successful recanalization (mTICI >=2b)',
    target: 'SBP 140-180',
    protocol: 'After documented successful recanalization (mTICI >=2b), maintain SBP in the source-listed range of 140-180, and below 180/105.'
  }
};

export function isSuccessfulEvtReperfusion(grade) {
  return ['2b', '2c', '3'].includes(String(grade ?? '').trim().toLowerCase());
}

// =====================================================================
// Initial non-traumatic IPH evaluation — public-safe workflow translation
// =====================================================================
export const ICH_INITIAL_EVALUATION_ALGORITHM = {
  title: 'Initial non-traumatic IPH evaluation',
  lastReviewed: '2026-07-03',
  sourceWindow: 'Reviewed June 2026 public-safe algorithm translation',
  scope: 'Institution-neutral educational translation. Use this as a workflow checklist only; verify against the current approved local protocol before clinical action.',
  consultTrigger: 'Non-traumatic IPH >=15 mL by ABC/2 prompts early Neurosurgery and stroke-service evaluation.',
  decisionNodes: [
    {
      title: 'Transfers and first contact',
      items: [
        'Start standard stabilization: agent-specific reversal, controlled BP lowering, head-of-bed elevation, and osmotic therapy when indicated.',
        'Confirm last-known-well time, estimated arrival time, antithrombotic exposure, and legal next-of-kin/contact information.',
        'Notify the receiving ED, stroke service, and ICU admitting service for ICU-level admissions.'
      ]
    },
    {
      title: 'ED diagnosis or arrival',
      items: [
        'Measure hematoma volume using ABC/2 and treat >=15 mL as the early Neurosurgery + stroke-service evaluation threshold.',
        'ED clinicians or the stroke service may consult Neurosurgery directly; prior approval is not required.',
        'Whichever service calls Neurosurgery closes the loop with the designated on-call stroke attending and other involved service so the plan is shared and documented.',
        'Consult earlier at any size for IVH, hydrocephalus, cerebellar hemorrhage, mass effect, neurologic decline, multicompartmental hemorrhage, vascular lesion concern, ED attending discretion, or clinician concern.'
      ]
    },
    {
      title: 'CTA/MRA branch',
      items: [
        'If CTA/MRA shows an underlying vascular lesion or anomaly, the Neurosurgery/neurointerventional pathway leads admission or operative/interventional planning with neurocritical care or ICU support.',
        'If there is no vascular lesion and no surgical pathway, the stroke service leads admission with ICU support as needed.'
      ]
    },
    {
      title: 'Monitoring adjuncts',
      items: [
        'Use close serial neurologic exams and repeat imaging when the exam changes.'
      ]
    }
  ],
  surgicalScreens: [
    {
      title: 'CSF diversion',
      criteria: ['IVH or IPH with developing/symptomatic hydrocephalus'],
      action: 'Evaluate urgently for EVD.'
    },
    {
      title: 'Decompression',
      criteria: ['Life-threatening mass effect', 'Full-care goals after outcome discussion'],
      action: 'Neurosurgery determines operative approach.'
    },
    {
      title: 'Cerebellar decompression',
      criteria: ['Cerebellar mass effect', 'Usually obstructive hydrocephalus and/or brainstem compression'],
      action: 'Evaluate urgently for suboccipital decompression with or without EVD.'
    },
    {
      title: 'Minimally invasive evacuation',
      criteria: ['Lobar IPH 30-80 mL', 'Age 18-80', 'NIHSS >5', 'GCS 5-14', 'No underlying vascular lesion'],
      action: 'Screen for the approved ENRICH-based standard-of-care pathway.'
    }
  ],
  researchScreens: [
    {
      title: 'MINUTE screen',
      criteria: [
        'Age 18-80',
        'Spontaneous non-traumatic supratentorial non-thalamic basal-ganglia IPH',
        'Basal-ganglia IPH volume >=20 mL by ABC/2',
        'NIHSS >=6',
        'CTA/MRA without vascular lesion',
        'Arrival <=15 hours since last known well',
        'No clear standard-of-care surgical indication'
      ],
      action: 'MINUTE has operational priority over MIRROR when both are possible. Notify the approved trial pathway using current study materials; do not publish or infer internal contact details.'
    },
    {
      title: 'MIRROR registry screen',
      criteria: [
        'Selected spontaneous supratentorial IPH being considered for minimally invasive evacuation',
        'Volume, NIHSS, premorbid mRS, and GCS thresholds are version-sensitive and must be checked against the active registry protocol before use',
        'The latest criteria would loosen the prior screen; do not apply a revised executable screen until protocol-owner sign-off',
        'No underlying vascular lesion',
        'Potential MIS timing within 24 hours of last known well or qualifying wake-up hemorrhage window'
      ],
      action: 'Do not let registry screening delay urgent surgical, trial, or stabilization decisions. Deep IPH considered for minimally invasive surgery outside the trial and registry pathways, or beyond 24 hours from last known well, requires discussion with both the on-call stroke attending and the inpatient neurology attending before proceeding.'
    }
  ],
  safetyPause: {
    title: 'Before any surgical action',
    items: [
      'Stop at bedside for a time-out/safety pause.',
      'Confirm that Neurosurgery, the stroke service, and the ICU team agree on the plan.',
      'Do not present an operative plan as final until the cross-team agreement is explicit.'
    ]
  },
  documentation: [
    'If Neurosurgery recommends no procedure, document no current surgical indication within 24 hours.',
    'Document the caller, receiving consultant, closed-loop recipient, and agreed next step.'
  ]
};

// =====================================================================
// Pre-thrombolytic safety pause — public-safe translation
// =====================================================================
export const SAFE_PAUSE_ATTESTATION = '[APPROVED LOCAL ATTESTATION REQUIRED]';

const parseAttestationBP = (bp) => {
  const match = String(bp || '').trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
};

const parseRequiredAge = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== 'string') return Number.NaN;
  const normalized = value.trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return Number.NaN;
  return Number(normalized);
};

export const getSafePauseIssues = ({ consentType = '', bp = '', contraindications = '', providerAgreement = '' } = {}) => {
  const issues = [];
  const consent = String(consentType || '').trim().toLowerCase();
  if (!consent || consent === 'declined') issues.push('Consent is absent or declined.');

  const parsedBP = parseAttestationBP(bp);
  if (!parsedBP) {
    issues.push('BP is absent or malformed; enter systolic/diastolic.');
  } else if (parsedBP.systolic <= 0 || parsedBP.diastolic <= 0) {
    issues.push('BP must contain positive systolic and diastolic values.');
  } else if (parsedBP.systolic <= parsedBP.diastolic) {
    issues.push('Systolic BP must be greater than diastolic BP.');
  } else if (!(parsedBP.systolic < 185 && parsedBP.diastolic < 110)) {
    issues.push('BP must be strictly below 185/110 before thrombolytic administration.');
  }

  if (String(contraindications || '').trim().toLowerCase() !== 'reviewed') {
    issues.push('Absolute and relative contraindications have not been marked reviewed.');
  }

  // The accepted safety-pause source lists provider agreement as a required pause item
  // alongside consent and the BP confirmation; it is not implied by the other two.
  if (String(providerAgreement || '').trim().toLowerCase() !== 'confirmed') {
    issues.push('Provider agreement with the thrombolytic decision has not been confirmed.');
  }
  return issues;
};

export const getSafePauseText = ({ consentType = '', bp = '', contraindications = '', providerAgreement = '' } = {}) => {
  const issues = getSafePauseIssues({ consentType, bp, contraindications, providerAgreement });
  if (issues.length > 0) {
    return `SAFE PAUSE NOT READY — DO NOT ATTEST:
${issues.map((issue, index) => `(${index + 1}) ${issue}`).join('\n')}
Attestation unavailable until every required item is complete.`;
  }
  return `SAFE PAUSE BEFORE THROMBOLYTIC ADMINISTRATION:
(1) Consent confirmed (${consentType}).
(2) BP confirmed ${bp}; both values are strictly below 185/110.
(3) Absolute & relative contraindications ${contraindications}.
(4) Dose confirmed (weight-based TNK 0.25 mg/kg, max 25 mg).
(5) Pause performed FACE-TO-FACE with the RN or anesthesia provider who will administer the drug.
(6) Pause confirmed by neurology, the ED clinician, and the primary RN; all providers agree with the thrombolytic decision.
(7) Safety pause documented using the approved local workflow.
Attestation: ${SAFE_PAUSE_ATTESTATION}`;
};

// =====================================================================
// Adult IVT eligibility — accepted institutional algorithm
// =====================================================================
export const evaluateIVT = ({
  ichOnCT,
  disablingDeficit,
  hoursFromLKW,
  glucose,
  weight,
  imagingPathway = {},
  crao,
  age,
  glucoseCorrectedDeficitPersists,
  preMRS,
  evtStatus,
  consentObtained,
  wakeUpOrUnknownOnset = false,
  bpSystolic,
  bpDiastolic,
  contraindicationsReviewed
}) => {
  const hrs = wakeUpOrUnknownOnset === true ? Number.NaN : parseFloat(hoursFromLKW);
  const glc = parseFloat(glucose);
  const wt = parseFloat(weight);
  const yrs = parseFloat(age);
  const mrs = parseFloat(preMRS);
  const sbp = parseFloat(bpSystolic);
  const dbp = parseFloat(bpDiastolic);
  const decisions = [];
  const warnings = [];
  const finalSafetyHold = () => {
    const issues = [];
    if (!Number.isFinite(sbp) || !Number.isFinite(dbp) || sbp <= 0 || dbp <= 0) {
      issues.push('enter the current systolic and diastolic blood pressure');
    } else if (sbp <= dbp) {
      issues.push('confirm systolic BP is greater than diastolic BP');
    } else if (!(sbp < 185 && dbp < 110)) {
      issues.push('confirm both BP values are strictly below 185/110');
    }
    if (contraindicationsReviewed !== true) {
      issues.push('confirm the absolute and relative contraindications were reviewed');
    }
    if (issues.length === 0) return null;
    return {
      eligible: 'pending',
      recommendation: 'Final IVT safety gates incomplete',
      reason: `${issues.join('; ')}. Complete the approved local safety pause before an affirmative treatment result.`,
      decisions,
      warnings
    };
  };

  if (ichOnCT === true) return { eligible: false, recommendation: 'IVT not recommended', reason: 'Intracranial hemorrhage on imaging', decisions, warnings };

  if (!Number.isFinite(yrs)) {
    return { eligible: null, recommendation: 'Enter adult age before evaluating IVT', decisions, warnings };
  }
  if (yrs < 18) {
    warnings.push('Age is under 18; use the separately governed pediatric pathway.');
    return {
      eligible: null,
      recommendation: 'Adult IVT algorithm does not apply',
      reason: 'Age is under 18. Use the separately governed pediatric pathway; this adult evaluator cannot return an affirmative result.',
      decisions,
      warnings
    };
  }

  if (ichOnCT !== false) return { eligible: null, recommendation: 'Confirm CT excludes intracranial hemorrhage', decisions, warnings };


  if (Number.isFinite(glc) && (glc < 50 || glc > 400)) {
    if (glucoseCorrectedDeficitPersists !== true) {
      return {
        eligible: 'pending',
        recommendation: 'Correct glucose and reassess before IVT decision',
        reason: `Glucose ${glc} mg/dL is outside 50-400 mg/dL. An affirmative result requires explicit confirmation that the deficit persists after correction.`,
        decisions,
        warnings
      };
    }
    warnings.push(`Glucose ${glc} mg/dL was corrected; persistent deficit was explicitly confirmed.`);
  }

  if (disablingDeficit === false) {
    return {
      eligible: false,
      recommendation: 'IVT NOT recommended',
      cor: '3 (No Benefit)',
      loe: 'B-R',
      reason: 'Non-disabling deficits. Disabling = impairs ADLs (bathing, ambulating, toileting, hygiene, eating) or return-to-work.',
      decisions,
      warnings
    };
  }
  if (disablingDeficit !== true) return { eligible: null, recommendation: 'Confirm whether the deficit is disabling', decisions, warnings };

  if (!Number.isFinite(glc)) {
    return { eligible: null, recommendation: 'Enter glucose before evaluating IVT', decisions, warnings };
  }

  // CRAO is evaluated BEFORE the time-window block. Every branch of that block returns,
  // so this check was unreachable whenever an LKW time was supplied: a CRAO patient at
  // 2h fell through to the standard-window COR 1 / LOE A recommendation and never saw
  // the shared-decision framing the source requires.
  if (crao) {
    if (!Number.isFinite(hrs)) {
      return { eligible: 'pending', recommendation: 'Enter LKW time before the CRAO shared-decision evaluation', decisions, warnings };
    }
    if (hrs < 0) {
      return { eligible: null, recommendation: 'Enter a valid non-negative LKW interval', decisions, warnings };
    }
    const withinWindow = hrs <= 4.5;
    if (withinWindow) {
      const hold = finalSafetyHold();
      if (hold) return hold;
    }
    if (withinWindow && (!Number.isFinite(wt) || wt <= 0)) {
      return { eligible: 'pending', recommendation: 'Enter a positive weight before an IVT treatment result', decisions, warnings };
    }
    return {
      eligible: withinWindow ? 'consider' : false,
      recommendation: withinWindow
        ? 'CRAO — consider IVT in select cases with informed consent and shared decision-making.'
        : 'CRAO beyond 4.5h — IVT not supported; the shared-decision pathway applies within 4.5h only.',
      rationale: 'The institutional source states that trial evidence does not support efficacy. Use shared decision-making within 4.5 hours.',
      decisions,
      warnings
    };
  }

  if (Number.isFinite(hrs) && hrs < 0) {
    return { eligible: null, recommendation: 'Enter a valid non-negative LKW interval', decisions, warnings };
  }
  if (Number.isFinite(hrs) && hrs <= 4.5) {
    const hold = finalSafetyHold();
    if (hold) return hold;
    if (!Number.isFinite(wt) || wt <= 0) {
      return { eligible: 'pending', recommendation: 'Enter a positive weight before an IVT treatment result', decisions, warnings };
    }
    decisions.push({ step: 'time', msg: `${hrs}h from LKW — standard 0-4.5h window` });
    return {
      eligible: true,
      recommendation: 'TNK recommended — standard window',
      agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
      dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
      cor: '1',
      loe: 'A',
      warnings,
      decisions,
      nextStep: 'Complete the approved local safety pause; confirm BP is strictly below 185/110 and contraindications were reviewed.'
    };
  }

  const { mriDwiFlairMismatch, ctpCoreMl, ctpRatio, ctpMismatchVolMl, smallVessel, posteriorCirc, contrastAllergy } = imagingPathway;
  const core = parseFloat(ctpCoreMl);
  const ratio = parseFloat(ctpRatio);
  const mismatchVol = parseFloat(ctpMismatchVolMl);
  const fullCTPCriteriaMet = Number.isFinite(core) && core >= 0 && core < 50 && Number.isFinite(ratio) && ratio >= 1.2 && Number.isFinite(mismatchVol) && mismatchVol >= 10;
  const preferMRI = smallVessel || posteriorCirc || contrastAllergy;
  const extendedGates = [];
  if (!Number.isFinite(mrs) || mrs > 1) extendedGates.push('baseline mRS must be entered and be ≤1');
  if (!['not-candidate', 'not_candidate', 'candidate-infeasible', 'evt-infeasible', 'evt_infeasible'].includes(evtStatus)) extendedGates.push('EVT status must confirm not an EVT candidate or the narrow EVT-infeasible status');
  const isWakeUpOrUnknown = wakeUpOrUnknownOnset === true && !Number.isFinite(hrs);
  const isFourPointFiveToNine = Number.isFinite(hrs) && hrs > 4.5 && hrs < 9;

  if (isWakeUpOrUnknown || isFourPointFiveToNine) {
    const qualifyingMismatch = isWakeUpOrUnknown ? mriDwiFlairMismatch === true : mriDwiFlairMismatch === true || fullCTPCriteriaMet;
    if (!qualifyingMismatch || extendedGates.length > 0) {
      return {
        eligible: 'pending',
        recommendation: 'Extended-window IVT gates incomplete',
        reason: [...(!qualifyingMismatch ? [isWakeUpOrUnknown ? 'Wake-up/unknown-onset treatment requires explicit MRI DWI-FLAIR mismatch in this institutional branch.' : 'Requires explicit MRI DWI-FLAIR mismatch or all CTP criteria: core <50 mL, ratio ≥1.2, mismatch volume ≥10 mL.'] : []), ...extendedGates].join(' '),
        decisions,
        warnings,
        imagingGuidance: isWakeUpOrUnknown ? 'Use the limited hyperacute MRI pathway.' : preferMRI ? 'Prefer MRI if small vessel, posterior circulation, or contrast allergy.' : 'CTP acceptable; MRI alternative.'
      };
    }
    const hold = finalSafetyHold();
    if (hold) return hold;
    if (!Number.isFinite(wt) || wt <= 0) {
      return { eligible: 'pending', recommendation: 'Enter a positive weight before an IVT treatment result', decisions, warnings };
    }
    return {
      eligible: 'consider',
      recommendation: `Consider TNK — ${isWakeUpOrUnknown ? 'wake-up/unknown-onset' : '4.5-9-hour'} window with qualifying mismatch imaging`,
      agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
      dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
      cor: '2a',
      loe: 'B-R',
      warnings,
      decisions,
      nextStep: 'Complete the approved local safety pause.',
      imagingGuidance: preferMRI ? 'Prefer MRI (small vessel / posterior / contrast allergy).' : null
    };
  }

  if (Number.isFinite(hrs) && hrs >= 9 && hrs <= 24) {
    const lateGates = consentObtained === true ? extendedGates : [...extendedGates, 'consent must be obtained'];
    if (!fullCTPCriteriaMet || lateGates.length > 0) {
      return {
        eligible: 'pending',
        recommendation: 'Late-window IVT gates incomplete',
        reason: [...(!fullCTPCriteriaMet ? ['Requires all CTP criteria: core <50 mL, ratio ≥1.2, mismatch volume ≥10 mL. MRI mismatch alone is not sufficient for this branch.'] : []), ...lateGates].join(' '),
        decisions,
        warnings
      };
    }
    const hold = finalSafetyHold();
    if (hold) return hold;
    if (!Number.isFinite(wt) || wt <= 0) {
      return { eligible: 'pending', recommendation: 'Enter a positive weight before an IVT treatment result', decisions, warnings };
    }
    return {
      eligible: 'consider',
      recommendation: 'Consider TNK — late window (9-24h) with CTP-selected mismatch',
      agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
      dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
      warnings,
      decisions,
      nextStep: 'Complete the approved local safety pause; this source branch assigns no COR or LOE grade.'
    };
  }

  if (Number.isFinite(hrs)) return { eligible: false, recommendation: 'Beyond 24h window — IVT not indicated', decisions, warnings };
  if (wakeUpOrUnknownOnset === true) return { eligible: 'pending', recommendation: 'Complete mismatch-imaging selection for wake-up/unknown-onset IVT', decisions, warnings };
  return { eligible: null, recommendation: 'Enter LKW time to evaluate window', decisions, warnings };
};

// =====================================================================
// DOAC-exposed IVT pathway — unresolved institutional-source conflict
// =====================================================================
export const evaluateDOAC_IVT = ({
  hoursSinceLastDose,
  antiXaUndetectable,
  renalFunctionNormal,
  disablingDeficit,
  endovascularCandidate,
  site
}) => {
  void hoursSinceLastDose;
  void antiXaUndetectable;
  void renalFunctionNormal;
  void disablingDeficit;
  void endovascularCandidate;
  void site;
  return {
    eligible: 'pending',
    pathway: 'unresolved-source-conflict',
    reason: 'The accepted institutional sources conflict on DOAC/factor-Xa timing and assay handling. No affirmative or negative IVT eligibility result is available until the protocol owner adjudicates the source conflict.',
    requirement: 'Do not use EVT candidacy as a categorical IVT bypass. Evaluate EVT independently while this IVT question remains unresolved.'
  };
};

// =====================================================================
// Adult EVT eligibility — accepted institutional flowchart
// =====================================================================
export const evaluateEVT_Anterior = ({ aspectsScore, timeFromLKWh, nihss, preMRS, age, massEffect, coreVolume }) => {
  const asp = parseFloat(aspectsScore);
  const hrs = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const mrs = parseFloat(preMRS);
  const a = parseRequiredAge(age);
  const core = parseFloat(coreVolume);

  if (!Number.isFinite(a)) return { eligible: null, reason: 'Enter adult age before evaluating EVT.' };
  if (a < 18) return { eligible: null, reason: 'Adult EVT algorithm does not apply below age 18.' };
  if (![asp, hrs, n, mrs].every(Number.isFinite)) return { eligible: null, reason: 'Need ASPECTS, LKW hours, NIHSS, and pre-stroke mRS.' };
  if (asp < 0 || asp > 10) return { eligible: null, reason: 'ASPECTS must be between 0 and 10.' };
  if (n < 0 || n > 42) return { eligible: null, reason: 'NIHSS must be between 0 and 42.' };
  if (mrs < 0 || mrs > 6) return { eligible: null, reason: 'Pre-stroke mRS must be between 0 and 6.' };
  if (hrs < 0) return { eligible: null, reason: 'Enter a valid non-negative LKW interval.' };
  if (Number.isFinite(core) && core < 0) return { eligible: null, reason: 'Core volume must be non-negative.' };
  if (n < 6) return { eligible: false, reason: 'NIHSS <6 does not meet the source-listed anterior-circulation flowchart gate.', cor: '—' };
  if (hrs > 24) return { eligible: false, reason: 'Beyond the source-listed 24-hour anterior-circulation window.', cor: '—' };

  if (hrs <= 6) {
    if (asp >= 6 && asp <= 10 && mrs <= 1) return { eligible: true, window: '0-6h', reason: 'ASPECTS 6-10 and pre-stroke mRS 0-1.', cor: '1', loe: 'A' };
    if (asp >= 6 && asp <= 10 && mrs === 2) return { eligible: 'consider', window: '0-6h', reason: 'ASPECTS 6-10 and pre-stroke mRS 2.', cor: '2a', loe: 'B-NR' };
    if (asp >= 6 && asp <= 10 && (mrs === 3 || mrs === 4)) return { eligible: 'consider', window: '0-6h', reason: 'ASPECTS 6-10 and pre-stroke mRS 3-4.', cor: '2b', loe: 'B-NR' };
    if (asp >= 3 && asp <= 5 && mrs <= 1) {
      if (massEffect === null || massEffect === undefined) return { eligible: 'pending', window: '0-6h', reason: 'ASPECTS 3-5 requires explicit confirmation that significant mass effect is absent.' };
      if (massEffect === false) return { eligible: true, window: '0-6h', reason: 'ASPECTS 3-5 with no significant mass effect.', cor: '1', loe: 'A' };
    }
    if (asp >= 0 && asp <= 2 && mrs <= 1 && massEffect === false && a < 80 && Number.isFinite(core) && core <= 70) {
      return {
        eligible: 'consider',
        window: '0-6h expanded',
        reason: 'ASPECTS 0-2 with age <80, no significant mass effect, and core volume at or below the unambiguous 70 mL boundary printed in the source.',
        cor: '2a',
        loe: 'B-R'
      };
    }
    if (asp >= 0 && asp <= 2 && mrs <= 1 && massEffect === false && a < 80 && Number.isFinite(core) && core > 70 && core <= 100) {
      return { eligible: 'pending', window: '0-6h expanded', reason: 'The institutional flowchart prints a core range of ≤70-100 mL without an executable threshold for 71-100 mL. No eligibility result is selected pending protocol-owner adjudication.' };
    }
    if (asp <= 2 && mrs <= 1 && (massEffect === null || massEffect === undefined || !Number.isFinite(core))) {
      return { eligible: 'pending', window: '0-6h', reason: 'ASPECTS 0-2 requires age <80, explicit absence of significant mass effect, and an entered core volume within the source-listed ≤70-100 mL range.' };
    }
  }

  if (hrs > 6 && hrs <= 24) {
    if (asp >= 6 && asp <= 10 && mrs <= 1) {
      return { eligible: true, window: '6-24h', reason: 'ASPECTS 6-10 and pre-stroke mRS 0-1.', cor: '1', loe: 'A' };
    }
    if (asp >= 3 && asp <= 5 && mrs <= 1) {
      if (massEffect === null || massEffect === undefined) {
        return { eligible: 'pending', window: '6-24h large core', reason: 'ASPECTS 3-5 in the 6-24-hour window requires age and explicit assessment of significant mass effect.' };
      }
      if (a < 80 && massEffect === false) {
        return { eligible: true, window: '6-24h large core', reason: 'ASPECTS 3-5, age <80, and no significant mass effect.', cor: '1', loe: 'A' };
      }
    }
    return { eligible: false, window: '6-24h', reason: 'Does not meet a source-listed 6-24-hour anterior-circulation tier.', cor: '—' };
  }

  return { eligible: false, reason: 'No matching eligibility tier at entered parameters.', cor: '—' };
};

export const evaluateEVT_M2 = ({ segment, dominant, hoursFromLKWh, nihss, preMRS, aspectsScore, ctpMismatch, age }) => {
  const hrs = parseFloat(hoursFromLKWh);
  const n = parseFloat(nihss);
  const mrs = parseFloat(preMRS);
  const asp = parseFloat(aspectsScore);
  const a = parseRequiredAge(age);
  if (!Number.isFinite(a)) return { eligible: null, reason: 'Enter adult age before evaluating EVT.' };
  if (a < 18) return { eligible: null, reason: 'Adult EVT algorithm does not apply below age 18.' };
  if (segment === 'M2-proximal-dominant' && dominant === true) {
    if (![hrs, n, mrs, asp].every(Number.isFinite)) return { eligible: null, reason: 'Need LKW hours, NIHSS, pre-stroke mRS, and ASPECTS.' };
    if (hrs < 0) return { eligible: null, reason: 'Enter a valid non-negative LKW interval.' };
    if (n < 0 || n > 42) return { eligible: null, reason: 'NIHSS must be between 0 and 42.' };
    if (mrs < 0 || mrs > 6) return { eligible: null, reason: 'Pre-stroke mRS must be between 0 and 6.' };
    if (asp < 0 || asp > 10) return { eligible: null, reason: 'ASPECTS must be between 0 and 10.' };
    const coreMet = n >= 6 && mrs <= 1 && asp >= 6;
    if (hrs <= 6 && coreMet) {
      return {
        eligible: 'consider',
        window: '0-6h',
        reason: 'Dominant proximal M2 within 6 hours with ASPECTS ≥6, NIHSS ≥6, and pre-stroke mRS 0-1.',
        cor: '2a',
        loe: 'B-NR'
      };
    }
    if (hrs > 6 && hrs <= 24 && coreMet) {
      if (ctpMismatch === true) {
        return {
          eligible: 'consider',
          window: '6-24h',
          reason: 'Dominant proximal M2 at 6-24h with CTP hypoperfusion–hypodensity mismatch present.',
          cor: '2a',
          loe: 'B-NR',
          requirement: 'Mismatch defined as NCCT showing no established hypodensity in ≥90% of the CTP hypoperfused lesion.'
        };
      }
      return {
        eligible: 'pending',
        window: '6-24h',
        reason: 'Dominant proximal M2 beyond 6h — CTP hypoperfusion–hypodensity mismatch must be confirmed before EVT is supported.',
        cor: '2a',
        loe: 'B-NR'
      };
    }
    return { eligible: false, reason: 'Dominant M2 criteria not all met (need ≤24h, NIHSS ≥6, mRS ≤1, ASPECTS ≥6; beyond 6h also requires CTP mismatch).' };
  }
  if (['M2-nondominant', 'ACA', 'PCA'].includes(segment)) {
    return {
      eligible: false,
      cor: '3 (No Benefit)',
      loe: 'A',
      reason: `EVT is not recommended for ${segment} in the current institutional flowchart.`
    };
  }
  if (segment === 'M2-codominant') {
    return {
      eligible: 'pending',
      cor: '—',
      reason: 'Codominant M2 carries no recommendation in the current institutional eligibility flowchart.'
    };
  }
  if (segment === 'M3') return { eligible: null, reason: 'M3 is not assigned a recommendation in the current institutional flowchart.' };
  return { eligible: null, reason: 'Select segment to evaluate.' };
};

export const evaluateEVT_Basilar = ({ nihss, hoursFromLKWh, preMRS, pcAspects, age, disabling, dualSpecialtyAgreement }) => {
  const n = parseFloat(nihss);
  const hrs = parseFloat(hoursFromLKWh);
  const mrs = parseFloat(preMRS);
  const pc = parseFloat(pcAspects);
  const a = parseRequiredAge(age);
  void disabling;
  void dualSpecialtyAgreement;
  if (!Number.isFinite(a)) return { eligible: null, reason: 'Enter adult age before evaluating EVT.' };
  if (a < 18) return { eligible: null, reason: 'Adult EVT algorithm does not apply below age 18.' };
  if (![n, hrs, mrs, pc].every(Number.isFinite)) return { eligible: null, reason: 'Need NIHSS, LKW hours, pre-stroke mRS, and PC-ASPECTS.' };
  if (hrs < 0) return { eligible: null, reason: 'Enter a valid non-negative LKW interval.' };
  if (n < 0 || n > 42) return { eligible: null, reason: 'NIHSS must be between 0 and 42.' };
  if (mrs < 0 || mrs > 6) return { eligible: null, reason: 'Pre-stroke mRS must be between 0 and 6.' };
  if (pc < 0 || pc > 10) return { eligible: null, reason: 'PC-ASPECTS must be between 0 and 10.' };
  if (hrs > 24) return { eligible: false, reason: 'Beyond 24h basilar window.' };
  if (n >= 10 && mrs <= 1 && pc >= 6) {
    return {
      eligible: true,
      reason: 'Basilar artery occlusion — NIHSS ≥10, mRS ≤1, PC-ASPECTS ≥6, within 24h.',
      cor: '1',
      loe: 'A'
    };
  }
  if (n >= 6 && n <= 9 && mrs <= 1 && pc >= 6) {
    return {
      eligible: 'consider',
      reason: 'Basilar artery occlusion within 24 hours with NIHSS 6-9, pre-stroke mRS 0-1, and PC-ASPECTS ≥6.',
      cor: '2b',
      loe: 'B-R'
    };
  }
  return { eligible: false, reason: 'Basilar EVT criteria not met.' };
};

// =====================================================================
// Patient discussion script (extended-window IVT)
// =====================================================================
export const EXTENDED_WINDOW_IVT_DISCUSSION = `Tenecteplase, a clot-dissolving medication, is a treatment for your suspected stroke that can be given beyond the usual 4.5-hour window when brain imaging shows there is still tissue that can be saved. In clinical trials, people who received this treatment in the extended time window had about a 9-11% better chance of recovering without disability compared with people who did not receive the treatment. However, all medicines have some risk, and with clot-dissolving drugs, there is a risk of serious bleeding. Bleeding into the brain that leads to new symptoms can occur in up to about 3% of those treated. This use of clot-dissolving medications beyond 4.5 hours from stroke onset is supported by limited evidence from clinical trials and many uncertainties remain. Your alternatives include standard stroke care without thrombolysis. Based on your imaging findings and clinical presentation, we suspect the benefit of treatment outweighs the risk and recommend proceeding with Tenecteplase treatment.`;

// =====================================================================
// COR/LOE key
// =====================================================================
export const COR_LOE_KEY = {
  cor: {
    '1': { strength: 'Strong', benefit: 'Benefit >>> Risk', verb: 'Is recommended', color: 'green' },
    '2a': { strength: 'Moderate', benefit: 'Benefit >> Risk', verb: 'Is reasonable', color: 'yellow' },
    '2b': { strength: 'Weak', benefit: 'Benefit ≥ Risk', verb: 'May be considered', color: 'orange' },
    '3-nb': { strength: 'Moderate (No Benefit)', benefit: 'Benefit = Risk', verb: 'Not recommended', color: 'red-light' },
    '3-harm': { strength: 'Strong (Harm)', benefit: 'Risk > Benefit', verb: 'Avoid (harmful)', color: 'red' }
  },
  loe: {
    'A': 'High-quality RCTs / meta-analyses',
    'B-R': 'Moderate-quality RCTs',
    'B-NR': 'Well-designed observational / registry',
    'C-LD': 'Limited data / mechanistic studies',
    'C-EO': 'Expert opinion / consensus'
  }
};

// =====================================================================
// Contraindication lists (absolute, relative, benefit-greater)
// =====================================================================
export const IVT_UNRESOLVED_SOURCE_CONFLICTS = [
  {
    key: 'doac-factor-xa',
    label: 'DOAC / factor-Xa timing and assay pathway (<48 hours vs >24 to <48 hours with consent)',
    detail: 'One accepted source excludes factor-Xa exposure within 48 hours. Another excludes exposure within 24 hours when anti-Xa testing is unavailable and permits consideration after 24 but before 48 hours with consent. No rule is selected pending protocol-owner adjudication.'
  },
  {
    key: 'head-trauma-neurosurgery',
    label: 'Severe head trauma and intracranial/intraspinal surgery windows (14 vs 90/60 days)',
    detail: 'Accepted institutional sources list a 14-day window versus 90 days for severe head trauma and 60 days for intracranial/intraspinal surgery. Pending protocol-owner adjudication, the released conservative 90-day and 60-day safety holds remain displayed; this interim safeguard does not resolve the source conflict.'
  },
  {
    key: 'prior-stroke-tier',
    label: 'Prior ischemic stroke within 90 days (absolute vs relative tier)',
    detail: 'One accepted source places prior ischemic stroke within 90 days under exclusions. Another places the same scenario under both exclusion and relative-exclusion headings. Pending protocol-owner adjudication, the released conservative hard-stop counsel remains displayed; this interim safeguard does not resolve the source tier.'
  }
];

export const IVT_ABSOLUTE_CONTRAINDICATIONS = [
  { label: 'CT with hemorrhage', detail: 'Acute intracranial hemorrhage on imaging.' },
  { label: 'CT with extensive hypodensity', detail: 'Clear hypodensity is suspicious for symptoms.' },
  { label: 'Acute spinal cord injury <3 months', detail: 'Likely contraindicated.' },
  { label: 'Symptoms or history suggestive of SAH', detail: 'Absolute exclusion even when the head CT is unremarkable.' },
  { label: 'Active internal bleeding', detail: 'Absolute exclusion.' },
  { label: 'Glucose <50 or >400 mg/dL until corrected and reassessed', detail: 'Correct the glucose first. Do not proceed unless a disabling deficit persists on the glucose-corrected examination.' },
  { label: 'SBP >185 or DBP >110 mmHg on repeated measures', detail: 'Hypertension above these values on repeated measures prior to starting the thrombolytic; treat and re-check before proceeding.' },
  { label: 'Intra-axial neoplasm', detail: 'Potentially harmful — should not be administered. Extra-axial tumours are handled separately under benefit-greater.' },
  { label: 'Intracranial or intraspinal surgery <60 days', detail: 'Interim conservative safety hold from the dedicated criteria source. The current workflow prints <14 days; keep the discrepancy visible pending protocol-owner adjudication.' },
  { label: 'Infective endocarditis', detail: 'Should not be administered.' },
  { label: 'Severe coagulopathy', detail: 'Plt <100K, INR >1.7, aPTT >40s, PT >15s. In patients without a history of thrombocytopenia the thrombolytic can be started before the platelet count returns, but should be discontinued if the platelet count returns <100,000/mm3.' },
  { label: 'Treatment-dose heparin or LMWH within 24 hours', detail: 'Treatment-dose unfractionated heparin or low-molecular-weight heparin within the previous 24 hours is an exclusion.' },
  { label: 'History of GI malignancy, or GI/GU hemorrhage within 21 days', detail: 'The dedicated local eligibility criteria list this as one combined exclusion: a history of gastrointestinal malignancy, or gastrointestinal or urinary tract hemorrhage within the previous 21 days.' },
  { label: 'Known or suspected direct thrombin inhibitor exposure unless thrombin time is confirmed normal', detail: 'Treat the exposure as an exclusion when thrombin time is abnormal, missing, or unavailable. A confirmed normal thrombin time is the sole source-listed escape; do not infer drug clearance from PT/INR or aPTT alone.' },
  { label: 'Arterial puncture at non-compressible site <7 days', detail: 'Arterial puncture at a non-compressible site within the previous 7 days is an absolute exclusion.' },
  { label: 'Aortic arch dissection', detail: 'Potentially harmful; should not be administered.' },
  { label: 'Amyloid immunotherapy / ARIA', detail: 'ICH risk unknown — IV fibrinolysis should be avoided. The current pocket-card eligibility table lists this in the absolute tier; an older dedicated criteria sheet listed it as relative with a direction to confirm the decision with the on-call stroke attending and prepare for possible MRI. The more restrictive current placement is applied.' },
  { label: 'Unruptured, unsecured large intracranial aneurysm (>10 mm)', detail: 'Absolute exclusion; small or already-secured aneurysms are handled under benefit-greater.' },
  { label: 'Severe head trauma <90 days', detail: 'Interim conservative safety hold from the dedicated criteria source. The current workflow prints <14 days; keep the discrepancy visible pending protocol-owner adjudication.' },
];

export const IVT_RELATIVE_CONTRAINDICATIONS = [
  { label: 'Pre-existing disability/frailty', detail: 'Treatment on individual basis.' },
  { label: 'Prior ischemic stroke <90 days', detail: 'Interim conservative hard-stop counsel. The current workflow lists this under both exclusion and relative-exclusion headings; keep the ambiguity visible pending protocol-owner adjudication.' },
  { label: 'Prior ICH', detail: 'Amyloid angiopathy = higher risk. Modifiable causes (HTN) may have greater net benefit.' },
  { label: 'Major extracranial surgery or trauma <14 days', detail: 'This entry is limited to major extracranial surgery or trauma. Consider the involved site and bleeding risk; it does not resolve the separate intracranial/intraspinal surgery and severe-head-trauma source conflict.' },
  { label: 'Intracranial vascular malformations', detail: 'Safety unknown; unruptured and untreated.' },
  { label: '>10 cerebral microbleeds', detail: 'More than 10 known cerebral microbleeds may increase the risk for intracranial hemorrhage.' },
  { label: 'Direct thrombin inhibitor with normal thrombin time', detail: 'A normal thrombin time may support further review in a known direct-thrombin-inhibitor exposure; confirm the approved laboratory pathway before any treatment decision.' },
  { label: 'Abnormal aPTT, TT, or anti-Xa with unknown anticoagulant use', detail: 'May be a false positive due to lupus anticoagulant. Reliably exclude direct-thrombin-inhibitor or factor-Xa-inhibitor use before proceeding; the factor-Xa pathway remains unresolved.' },
  { label: 'Intracranial arterial dissection', detail: 'Safety unknown.' },
  { label: 'Acute or recent MI <3 months', detail: 'Depending on type of MI; lower-level evidence supports thrombolytic use in these settings. Cardiology consult; hemopericardium risk.' },
  { label: 'Acute pericarditis', detail: 'May be reasonable. Emergent cardiology consult.' },
  { label: 'Left atrial or ventricular thrombus', detail: 'May be reasonable if major AIS. Cardiology consult.' },
  { label: 'Pregnancy / post-partum', detail: 'Obstetric consultation; benefits vs uterine bleeding risk.' },
  { label: 'Systemic active malignancy', detail: 'Oncology consultation; consider type, stage, complications.' }
];

export const IVT_BENEFIT_GREATER_CONSIDER = [
  { label: 'Extracranial cervical dissection', detail: 'Reasonably safe within 4.5h; probably recommended.' },
  { label: 'Extra-axial intracranial neoplasm', detail: 'Benefit likely outweighs risk.' },
  { label: 'Unruptured intracranial aneurysm', detail: 'Benefit likely outweighs risk for small or already-secured aneurysms; an unruptured and unsecured large aneurysm (>10 mm) is an absolute exclusion.' },
  { label: 'Angiographic procedural stroke', detail: 'Benefit likely outweighs risk.' },
  { label: 'History of GI/GU bleeding (remote)', detail: 'Candidates if stable; GI/GU consultation.' },
  { label: 'History of MI (remote)', detail: 'Probably greater benefit from IVT.' },
  { label: 'Recreational drug use', detail: 'Greater benefit than risk in most patients.' },
  { label: 'Stroke mimic uncertainty', detail: 'Risk of harm with IVT is low; benefit likely outweighs risk.' },
  { label: 'Moya-moya disease', detail: 'No increased ICH risk; benefit likely outweighs risk.' }
];

export const GENERALIZABILITY_LIMITATIONS = [
  'Age >80',
  'Significant head/neck vessel tortuosity',
  'Comorbidities that affect assessment',
  'Seizures at stroke onset',
  'High suspicion for underlying ICAD',
  'Life expectancy <6 months'
];

// =====================================================================
// =====================================================================
// Local-only institutional extension hook
// =====================================================================
// The public build exports null here. A separate gitignored local extension
// may set window.__INSTITUTIONAL_LOCAL__ to a structured object before app.js
// loads. This function reads that global.
//
// Consumers: src/app.jsx reads this once at render to surface a
// clearly-labelled "Institutional (local — not public)" section in the
// Protocols & Algorithms tab. The section is completely absent in the
// public/deployed build where no local file exists.
//
// Shape expected from window.__INSTITUTIONAL_LOCAL__:
//   {
//     institutionName: string,      // e.g. "Example General Hospital"
//     sections: [
//       {
//         id: string,               // e.g. "bp-management"
//         title: string,            // e.g. "BP Management Protocol"
//         subsections: [
//           {
//             heading: string,
//             items: string[],       // bullet-point text lines
//           }
//         ]
//       }
//     ],
//     contacts: [                   // optional on-call / paging contacts
//       { role: string, contact: string }
//     ],
//     lastUpdated: string,          // ISO date string or free text
//     disclaimer: string            // optional disclaimer / caveat
//   }
//
// Returns null when not present (public build / default).
export const getLocalInstitutionalContent = () => {
  if (typeof window === 'undefined') return null;
  const local = window.__INSTITUTIONAL_LOCAL__;
  if (!local || typeof local !== 'object') return null;
  // Minimal shape validation — must have institutionName and sections array.
  if (typeof local.institutionName !== 'string') return null;
  if (!Array.isArray(local.sections)) return null;
  return local;
};

// =====================================================================
// Backwards-compat aliases (legacy imports)
// =====================================================================
export const LEGACY_BP_PROTOCOLS = INSTITUTIONAL_BP_PROTOCOLS;
export const evaluateIVT_Legacy = evaluateIVT;
export const evaluateEVT_Legacy_Anterior = evaluateEVT_Anterior;
export const evaluateEVT_Legacy_M2 = evaluateEVT_M2;
export const evaluateEVT_Legacy_Basilar = evaluateEVT_Basilar;
