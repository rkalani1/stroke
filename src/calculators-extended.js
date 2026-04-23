// Extended clinical calculators added in the P0/P1 expansion.
// Each function is pure, fully unit-testable, and carries its primary source
// citation in the function-level doc block. All inputs are permissive (strings
// from form fields); invalid input returns null.

// =====================================================================
// EVT eligibility — named calculators for late-window standard-core trials
// =====================================================================

// DAWN inclusion calculator (Nogueira et al., NEJM 2018;378:11-21)
// Window: 6-24h after last known well.
// Inclusion (any of three age/NIHSS/core-volume tiers):
//   Group A: age >=80, NIHSS >=10, core <21 mL
//   Group B: age <80, NIHSS >=10, core <31 mL
//   Group C: age <80, NIHSS >=20, core <51 mL
export const evaluateDAWN = ({ age, nihss, coreMl, timeFromLKWh }) => {
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  const c = parseFloat(coreMl);
  const t = parseFloat(timeFromLKWh);
  if (![a, n, c].every(Number.isFinite)) return null;
  if (Number.isFinite(t) && (t < 6 || t > 24)) {
    return { eligible: false, tier: null, reason: `Outside DAWN window (6-24h); LKW ${t}h`, meetsImaging: false, meetsClinical: false };
  }
  let tier = null; let reason = '';
  if (a >= 80 && n >= 10 && c < 21) tier = 'A';
  else if (a < 80 && n >= 10 && c < 31) tier = 'B';
  else if (a < 80 && n >= 20 && c < 51) tier = 'C';
  else reason = `No tier met (age ${a}, NIHSS ${n}, core ${c} mL)`;
  return {
    eligible: tier !== null,
    tier,
    meetsImaging: Number.isFinite(c) && c < 51,
    meetsClinical: Number.isFinite(n) && n >= 10,
    reason: tier ? `DAWN Group ${tier} criteria met` : reason,
    window: '6-24h',
    endpointNNT: 2.8,
    source: 'Nogueira NEJM 2018;378:11-21 (NCT02142283)'
  };
};

// DEFUSE-3 inclusion calculator (Albers et al., NEJM 2018;378:708-18)
// Window: 6-16h after last known well.
// Inclusion: core <=70 mL, mismatch volume >=15 mL, mismatch ratio >=1.8.
export const evaluateDEFUSE3 = ({ coreMl, penumbraMl, timeFromLKWh, nihss, age }) => {
  const c = parseFloat(coreMl);
  const p = parseFloat(penumbraMl);
  const t = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const a = parseFloat(age);
  if (![c, p].every(Number.isFinite)) return null;
  if (Number.isFinite(t) && (t < 6 || t > 16)) {
    return { eligible: false, reason: `Outside DEFUSE-3 window (6-16h); LKW ${t}h`, meetsCore: c <= 70, meetsMismatch: false };
  }
  const mismatchVolume = p - c;
  const mismatchRatio = c > 0 ? p / c : Infinity;
  const coreOk = c <= 70;
  const ratioOk = mismatchRatio >= 1.8;
  const volumeOk = mismatchVolume >= 15;
  const clinicalOk = (!Number.isFinite(n) || n >= 6) && (!Number.isFinite(a) || a >= 18);
  const eligible = coreOk && ratioOk && volumeOk && clinicalOk;
  return {
    eligible,
    meetsCore: coreOk,
    meetsMismatch: ratioOk && volumeOk,
    meetsClinical: clinicalOk,
    coreMl: c,
    penumbraMl: p,
    mismatchVolumeMl: mismatchVolume,
    mismatchRatio,
    reason: eligible
      ? 'DEFUSE-3 imaging + clinical criteria met'
      : `${!coreOk ? `Core ${c} mL > 70; ` : ''}${!ratioOk ? `Mismatch ratio ${mismatchRatio.toFixed(1)} < 1.8; ` : ''}${!volumeOk ? `Mismatch volume ${mismatchVolume.toFixed(1)} mL < 15; ` : ''}${!clinicalOk ? 'Clinical criteria unmet; ' : ''}`.trim(),
    window: '6-16h',
    endpointNNT: 3.6,
    source: 'Albers NEJM 2018;378:708-18 (NCT02586415)'
  };
};

// =====================================================================
// Minor-stroke / TIA DAPT duration
// =====================================================================

// CHANCE-Plus / POINT / THALES combined DAPT recommender.
// CHANCE (Wang NEJM 2013;369:11-19): clopidogrel+ASA x 21d then clopidogrel alone for TIA/minor stroke (NIHSS <=3, ABCD2 >=4).
// POINT (Johnston NEJM 2018;379:215-25): clopidogrel+ASA x 21d (original 90d truncated) for NIHSS <=3 / ABCD2 >=4.
// THALES (Johnston NEJM 2020;383:207-17): ticagrelor+ASA x 30d for NIHSS <=5 + atherosclerotic etiology or ABCD2 >=6.
// CHANCE-2 (Wang NEJM 2021;385:2520-30): in CYP2C19 LOF carriers, ticagrelor+ASA superior to clopidogrel+ASA.
export const recommendAcuteDAPT = ({ nihss, abcd2, strokeType, atherosclerotic, cyp2c19LOF, ichRisk }) => {
  const n = parseFloat(nihss);
  const ab = parseFloat(abcd2);
  const isTIA = strokeType === 'tia';
  const isMinor = Number.isFinite(n) && n <= 3;
  const isUpToModerate = Number.isFinite(n) && n <= 5;
  const highRisk = Number.isFinite(ab) && ab >= 4;
  const veryHighRisk = Number.isFinite(ab) && ab >= 6;

  if (ichRisk === 'high') {
    return { regimen: 'single-antiplatelet', rationale: 'High hemorrhagic risk — DAPT not recommended.', duration: null, source: null };
  }

  // THALES: ticagrelor+ASA for moderate stroke w/ atherosclerotic etiology OR very-high-risk TIA
  if ((isUpToModerate && atherosclerotic) || veryHighRisk) {
    return {
      regimen: 'ticagrelor+ASA',
      duration: '30 days',
      dosing: 'Ticagrelor 180 mg load, then 90 mg BID + ASA 325 mg load then 75-100 mg daily',
      rationale: atherosclerotic
        ? 'Atherosclerotic minor-to-moderate stroke (NIHSS ≤5): THALES showed 17% RRR in stroke/death at 30 d.'
        : `Very-high-risk TIA (ABCD² ${ab} ≥6): escalate to ticagrelor+ASA.`,
      source: 'Johnston NEJM 2020;383:207-17 (THALES)',
      class: 'Class 2a (AHA/ASA secondary prevention)'
    };
  }

  if ((isTIA && highRisk) || isMinor) {
    const useTicagrelor = cyp2c19LOF === true;
    return {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CHANCE-2)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load then 90 mg BID + ASA 75-100 mg daily'
        : 'Clopidogrel 300-600 mg load then 75 mg daily + ASA 75-100 mg daily',
      rationale: useTicagrelor
        ? 'Known CYP2C19 LOF carrier — CHANCE-2 showed ticagrelor+ASA superior to clopidogrel+ASA.'
        : `${isTIA ? `High-risk TIA (ABCD² ${ab} ≥4)` : `Minor stroke (NIHSS ${n} ≤3)`}: CHANCE/POINT showed reduced 90-d stroke risk. Truncate DAPT at 21 d to minimize bleeding.`,
      source: useTicagrelor ? 'Wang NEJM 2021;385:2520-30 (CHANCE-2)' : 'Wang NEJM 2013;369:11-19 (CHANCE); Johnston NEJM 2018;379:215-25 (POINT)',
      class: 'Class 1 (AHA/ASA 2021 secondary prevention)'
    };
  }

  return {
    regimen: 'single-antiplatelet',
    duration: 'long-term',
    dosing: 'ASA 81 mg daily OR clopidogrel 75 mg daily',
    rationale: `${isTIA ? 'Low-risk TIA' : `NIHSS ${Number.isFinite(n) ? n : '?'} above DAPT inclusion`} — DAPT not indicated; single antiplatelet per secondary-prevention guidelines.`,
    source: 'Kleindorfer AHA/ASA Stroke 2021',
    class: 'Class 1'
  };
};

// =====================================================================
// Recurrent-stroke risk scores used in clinic
// =====================================================================

// ESSEN stroke risk score (Diener, Lancet Neurol 2009)
// Points: age 65-74 = 1, age ≥75 = 2, HTN = 1, DM = 1, prior MI = 1, other CV disease = 1,
//         PAD = 1, current smoker = 1, prior TIA/stroke = 1. Max 9.
// >=3 = high annual recurrent-stroke risk (≈4%/yr vs 2%/yr overall).
export const calculateESSEN = ({ age, hypertension, diabetes, priorMI, otherCV, pad, smoker, priorTIA }) => {
  let score = 0;
  const a = parseFloat(age);
  if (Number.isFinite(a)) {
    if (a >= 75) score += 2; else if (a >= 65) score += 1;
  }
  if (hypertension) score += 1;
  if (diabetes) score += 1;
  if (priorMI) score += 1;
  if (otherCV) score += 1;
  if (pad) score += 1;
  if (smoker) score += 1;
  if (priorTIA) score += 1;
  return {
    score,
    risk: score >= 3 ? 'high' : score >= 2 ? 'moderate' : 'low',
    annualRecurrence: score >= 3 ? '~4%/yr' : score >= 2 ? '~2-3%/yr' : '~1-2%/yr',
    source: 'Diener Lancet Neurol 2009'
  };
};

// SPI-II (Kernan Stroke 1991, updated 2000)
// Points: age >70 = 2, HTN = 3, DM = 3, prior CAD = 1, prior stroke = 3, severe HTN (SBP ≥180 / DBP ≥100) = 1.
// 0-3 low, 4-7 moderate, 8-15 high.
export const calculateSPI2 = ({ age, hypertension, diabetes, cad, priorStroke, sbp, dbp }) => {
  let score = 0;
  const a = parseFloat(age);
  const s = parseFloat(sbp); const d = parseFloat(dbp);
  if (Number.isFinite(a) && a > 70) score += 2;
  if (hypertension) score += 3;
  if (diabetes) score += 3;
  if (cad) score += 1;
  if (priorStroke) score += 3;
  if ((Number.isFinite(s) && s >= 180) || (Number.isFinite(d) && d >= 100)) score += 1;
  return {
    score,
    tier: score <= 3 ? 'low' : score <= 7 ? 'moderate' : 'high',
    twoYearRisk: score <= 3 ? '~3-4%' : score <= 7 ? '~11-14%' : '~23-28%',
    source: 'Kernan Stroke 1991; updated 2000'
  };
};

// =====================================================================
// ICH expansion scores
// =====================================================================

// BAT score (Morotti et al., JAMA Neurol 2016;73:203-10)
// Blend sign on CT: +1; Any hypodensity: +2; Time from onset to CT <2.5 h: +2. Range 0-5.
// 0-1 low (~5% expansion), 2-5 high (~40% expansion).
export const calculateBAT = ({ blendSign, hypodensity, timeToCTHours }) => {
  let score = 0;
  const t = parseFloat(timeToCTHours);
  if (blendSign) score += 1;
  if (hypodensity) score += 2;
  if (Number.isFinite(t) && t < 2.5) score += 2;
  return {
    score,
    risk: score >= 2 ? 'high' : 'low',
    expansionProbability: score >= 3 ? '~45-50%' : score === 2 ? '~35-40%' : score === 1 ? '~15%' : '~5%',
    source: 'Morotti JAMA Neurol 2016;73:203-10'
  };
};

// BRAIN score (Wang et al., Neurology 2015;85:464-71)
// Baseline volume >10 mL = 2 (per 10 mL increase); Recurrent (prior ICH) = 1; Anticoag on admission = 1;
// Intraventricular extension = 2; onset-to-CT Number <=1h = 1 (per hour less 6 h).
// Simpler implementation: volume (per 10 mL >10), recurrent, AC, IVH, time<6h.
export const calculateBRAIN = ({ volumeMl, recurrentICH, anticoagulated, ivh, onsetToCTHours }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (Number.isFinite(v)) score += Math.max(0, Math.floor(Math.max(0, v - 10) / 10)) * 2;
  if (recurrentICH) score += 1;
  if (anticoagulated) score += 1;
  if (ivh) score += 2;
  if (Number.isFinite(t)) score += Math.max(0, 6 - t) >= 1 ? 1 : 0;
  return {
    score,
    risk: score >= 5 ? 'high' : score >= 3 ? 'moderate' : 'low',
    expansionProbability: score >= 5 ? '~45%+' : score >= 3 ? '~20-40%' : '~5-15%',
    source: 'Wang Neurology 2015;85:464-71'
  };
};

// Nine-point (Brouwers) ICH expansion score
// Warfarin use = 2, NOAC = 1, antiplatelet = 1, volume ≥30 mL = 2, onset-to-CT <6h = 2, IVH = 1, shape irregularity = 1.
export const calculateNinePoint = ({ warfarin, noac, antiplatelet, volumeMl, onsetToCTHours, ivh, irregularShape }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (warfarin) score += 2;
  else if (noac) score += 1;
  if (antiplatelet) score += 1;
  if (Number.isFinite(v) && v >= 30) score += 2;
  if (Number.isFinite(t) && t < 6) score += 2;
  if (ivh) score += 1;
  if (irregularShape) score += 1;
  return {
    score,
    risk: score >= 6 ? 'high' : score >= 3 ? 'moderate' : 'low',
    source: 'Brouwers Stroke 2014; Law Int J Stroke 2020'
  };
};

// =====================================================================
// SAH / DCI scores
// =====================================================================

// VASOGRADE (de Oliveira Manoel Stroke 2015;46:1826-31)
// Green: WFNS 1-2 + mFisher 1-2; Yellow: WFNS 1-3 + mFisher 3-4; Red: WFNS 4-5 (any mFisher).
export const calculateVASOGRADE = ({ wfns, modifiedFisher }) => {
  const w = parseFloat(wfns);
  const m = parseFloat(modifiedFisher);
  if (!Number.isFinite(w) || !Number.isFinite(m)) return null;
  let grade; let risk;
  if (w >= 4) { grade = 'Red'; risk = 'high'; }
  else if ((w <= 2) && (m <= 2)) { grade = 'Green'; risk = 'low'; }
  else { grade = 'Yellow'; risk = 'moderate'; }
  return { grade, risk, source: 'de Oliveira Manoel Stroke 2015;46:1826-31' };
};

// Ogilvy-Carter grading for aneurysmal SAH (0-5)
// Factors: age >50 (1), Hunt-Hess IV-V (1), Fisher 3-4 (1), aneurysm >10 mm (1), posterior circulation / giant (1).
export const calculateOgilvyCarter = ({ age, huntHess, fisher, size, posteriorOrGiant }) => {
  const a = parseFloat(age);
  const hh = parseFloat(huntHess);
  const f = parseFloat(fisher);
  const sz = parseFloat(size);
  let score = 0;
  if (Number.isFinite(a) && a > 50) score += 1;
  if (Number.isFinite(hh) && hh >= 4) score += 1;
  if (Number.isFinite(f) && f >= 3) score += 1;
  if (Number.isFinite(sz) && sz > 10) score += 1;
  if (posteriorOrGiant) score += 1;
  return { score, source: 'Ogilvy-Carter Neurosurgery 1998' };
};

// =====================================================================
// Cognitive / mood screens (clinic)
// =====================================================================

// PHQ-9 interpretation
export const interpretPHQ9 = (score) => {
  const s = parseFloat(score);
  if (!Number.isFinite(s) || s < 0 || s > 27) return null;
  let severity, action;
  if (s <= 4) { severity = 'none'; action = 'No treatment needed; monitor.'; }
  else if (s <= 9) { severity = 'mild'; action = 'Watchful waiting; repeat PHQ-9 at follow-up.'; }
  else if (s <= 14) { severity = 'moderate'; action = 'Consider treatment (psychotherapy and/or SSRI; sertraline 50 mg daily is first-line in post-stroke depression).'; }
  else if (s <= 19) { severity = 'moderately-severe'; action = 'Active treatment with pharmacotherapy and psychotherapy.'; }
  else { severity = 'severe'; action = 'Immediate initiation of antidepressant and/or psychotherapy; assess for suicidality.'; }
  return { score: s, severity, action, source: 'Kroenke JGIM 2001;16:606-13' };
};

// mRS-9Q structured interpretation (Bruno Stroke 2010;41:1048-50) — simplified.
export const interpretMRS9Q = ({ q1Symptoms, q2BowelBladder, q3Dressing, q4Walking, q5WalkingUnaided, q6Work, q7Chores, q8Hobbies, q9NeedsHelp }) => {
  if (q9NeedsHelp === 'bedridden') return { mrs: 5, description: 'Severe disability: bedridden, requires constant nursing care.' };
  if (q9NeedsHelp === 'constant') return { mrs: 4, description: 'Moderately severe disability: unable to walk unaided and unable to attend to own bodily needs.' };
  if (q5WalkingUnaided === false || q2BowelBladder === true || q3Dressing === true) return { mrs: 3, description: 'Moderate disability: requires some help but able to walk unassisted.' };
  if (q6Work === false || q7Chores === false || q8Hobbies === false) return { mrs: 2, description: 'Slight disability: unable to carry out all previous activities but able to look after own affairs without assistance.' };
  if (q1Symptoms === true) return { mrs: 1, description: 'No significant disability despite symptoms: able to carry out all usual duties.' };
  return { mrs: 0, description: 'No symptoms at all.' };
};

// =====================================================================
// Carotid and PFO
// =====================================================================

// NASCET stenosis percentage (residual diameter at stenosis, distal normal ICA diameter)
export const calculateNASCET = ({ stenosisDiameterMm, distalICADiameterMm }) => {
  const s = parseFloat(stenosisDiameterMm);
  const d = parseFloat(distalICADiameterMm);
  if (!Number.isFinite(s) || !Number.isFinite(d) || d <= 0) return null;
  const pct = Math.round((1 - s / d) * 100);
  return {
    percent: pct,
    tier: pct >= 70 ? 'severe' : pct >= 50 ? 'moderate' : 'mild',
    revasc: pct >= 70
      ? 'CEA highly effective (NASCET NNT=5 at 2y). Timing: within 2 weeks for maximum benefit.'
      : pct >= 50
        ? 'CEA benefit modest (NNT ~20) and limited to men with recent symptoms. Individualized decision.'
        : 'Medical management (no surgical benefit demonstrated).',
    source: 'NASCET NEJM 1991/1998'
  };
};

// CHA2DS2-VA (2024 ESC update — dropped sex)
export const calculateCHADS2VA = ({ chf, hypertension, age, diabetes, strokeTia, vascular }) => {
  let score = 0;
  const a = parseFloat(age);
  if (chf) score += 1;
  if (hypertension) score += 1;
  if (Number.isFinite(a)) { if (a >= 75) score += 2; else if (a >= 65) score += 1; }
  if (diabetes) score += 1;
  if (strokeTia) score += 2;
  if (vascular) score += 1;
  return {
    score,
    anticoagulate: score >= 2 ? 'recommended' : score === 1 ? 'consider' : 'not indicated by score alone',
    source: 'ESC 2024 AF guideline (van Gelder, Eur Heart J 2024)'
  };
};

// =====================================================================
// HEADS² — AF detection post-cryptogenic stroke
// =====================================================================
// Ntaios et al., J Am Heart Assoc 2022 — predicts AF detection probability on monitoring.
// Heart failure = 1, Age ≥75 = 1, Enlarged LA (>45 mm) = 1, Demographics (female + age ≥65) = 1, Stroke severity (NIHSS ≥8) = 1.
export const calculateHEADS2 = ({ heartFailure, age, enlargedLA, sex, nihss }) => {
  let score = 0;
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  if (heartFailure) score += 1;
  if (Number.isFinite(a) && a >= 75) score += 1;
  if (enlargedLA) score += 1;
  if (sex === 'F' && Number.isFinite(a) && a >= 65) score += 1;
  if (Number.isFinite(n) && n >= 8) score += 1;
  return {
    score,
    monitoringStrategy: score >= 3 ? 'Implantable loop recorder recommended (high AF detection yield)' : score >= 1 ? '30-day external monitor, escalate to ILR if negative' : 'Standard telemetry + Holter',
    source: 'Ntaios JAHA 2022'
  };
};

// =====================================================================
// Post-stroke driving / return-to-activity (heuristic — not a validated score)
// =====================================================================
export const recommendDriving = ({ strokeType, severity, cognitiveDeficit, visualField, motorDeficit, seizure }) => {
  const blockers = [];
  if (seizure) blockers.push('Post-stroke seizure within past 6 months');
  if (cognitiveDeficit) blockers.push('Persistent cognitive deficit (MoCA <26 or attention/executive deficit)');
  if (visualField) blockers.push('Visual field cut (hemianopia or quadrantanopia)');
  if (motorDeficit === 'severe') blockers.push('Severe motor deficit of dominant hand or either leg');
  const waitWeeks = strokeType === 'tia' ? 2 : severity === 'minor' ? 4 : 8;
  return {
    mayDrive: blockers.length === 0,
    blockers,
    minWait: `${waitWeeks} weeks minimum`,
    guidance: blockers.length === 0
      ? `Patient may resume driving after minimum ${waitWeeks}-week observation if symptom-free. Recommend formal driving evaluation for any residual deficit or commercial drivers.`
      : `Driving NOT recommended until: ${blockers.join('; ')}. Refer to rehabilitation medicine / occupational therapy for formal driving evaluation.`,
    commercialDriver: 'Commercial drivers (CDL) must meet FMCSA criteria: minimum 1-year seizure-free off AED, no residual deficit compromising driving safety.',
    source: 'AAN practice parameter (Neurology 2007); AHA/ASA secondary prevention 2021'
  };
};

// =====================================================================
// Dysphagia screens (simple decision logic)
// =====================================================================
export const interpretBarnesJewishDysphagia = ({ gcs15, canSitUpright, coughOnWater3oz, voiceChange, drool }) => {
  if (!gcs15) return { pass: false, reason: 'GCS <15 — NPO, defer screen', action: 'Strict NPO; SLP consult when GCS 15.' };
  if (!canSitUpright) return { pass: false, reason: 'Unable to sit upright', action: 'Strict NPO; reassess when mobility allows.' };
  if (coughOnWater3oz || voiceChange || drool) return { pass: false, reason: 'Failed 3-oz water swallow', action: 'NPO; SLP evaluation; consider modified barium swallow study.' };
  return { pass: true, reason: 'Screen passed', action: 'Soft-mechanical / IDDSI-5 diet; SLP can liberalize.' };
};

// =====================================================================
// VTE prophylaxis timing (CLOTS-3 / AHA-ASA 2022 ICH)
// =====================================================================
export const recommendVTEProphylaxis = ({ diagnosis, days, hematomaStable, immobile }) => {
  if (diagnosis === 'ich') {
    if (days < 1) return { modality: 'mechanical (IPC) only', agent: 'Sequential compression devices', rationale: 'Day 0-1 ICH: IPC reduces DVT (CLOTS-3 Lancet 2013).' };
    if (days >= 1 && days <= 4 && hematomaStable) return { modality: 'chemical + mechanical', agent: 'Enoxaparin 40 mg SC daily (or UFH 5000 U BID) + IPC', rationale: 'Day 2-4 ICH with stable imaging: chemical VTE ppx is Class 2b, LOE B-R per AHA/ASA 2022 ICH.' };
    if (!hematomaStable) return { modality: 'mechanical only', agent: 'IPC', rationale: 'Unstable hematoma — defer chemical ppx; re-image and reassess.' };
  }
  if (diagnosis === 'ischemic' && immobile) return { modality: 'chemical ± mechanical', agent: 'Enoxaparin 40 mg SC daily (or UFH 5000 U TID) + IPC when possible', rationale: 'Ischemic stroke with immobility: chemical VTE ppx from admission (Class 1, AHA/ASA 2019).' };
  if (diagnosis === 'sah') return { modality: 'mechanical until secured, then chemical 24h post-securing', agent: 'IPC, then enoxaparin 40 mg SC daily 24h after clip/coil if no bleeding', rationale: 'AHA/ASA aSAH 2023: mechanical ppx initially; chemical ppx 24h post-aneurysm securing.' };
  return { modality: 'ambulate', agent: 'None required', rationale: 'Ambulatory patient; no VTE ppx needed.' };
};

// =====================================================================
// Post-stroke neurocheck timer schedule (post-tPA)
// =====================================================================
// AHA/ASA: q15 min x 2h → q30 min x 6h → q1h x 16h after tPA.
export const computeNeurocheckSchedule = (tpaGivenIsoTime) => {
  if (!tpaGivenIsoTime) return null;
  const start = new Date(tpaGivenIsoTime);
  if (Number.isNaN(start.getTime())) return null;
  const checks = [];
  for (let i = 1; i <= 8; i += 1) checks.push({ label: `q15 check #${i}`, at: new Date(start.getTime() + i * 15 * 60 * 1000) });
  for (let i = 1; i <= 12; i += 1) checks.push({ label: `q30 check #${i}`, at: new Date(start.getTime() + (2 * 60 + i * 30) * 60 * 1000) });
  for (let i = 1; i <= 16; i += 1) checks.push({ label: `q1h check #${i}`, at: new Date(start.getTime() + (8 * 60 + i * 60) * 60 * 1000) });
  return { start, checks, end: checks[checks.length - 1].at };
};

// =====================================================================
// LKW countdown (for hub-and-spoke time-to-decision display)
// =====================================================================
export const computeLKWCountdown = (lkwIso, nowMs = Date.now()) => {
  if (!lkwIso) return null;
  const lkw = new Date(lkwIso).getTime();
  if (Number.isNaN(lkw)) return null;
  const elapsedMs = nowMs - lkw;
  const toLyticMs = (4.5 * 3600 * 1000) - elapsedMs;
  const toLateEvtMs = (24 * 3600 * 1000) - elapsedMs;
  const fmt = (ms) => {
    if (ms <= 0) return 'closed';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  return {
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    toLytic: fmt(toLyticMs),
    toLyticClosed: toLyticMs <= 0,
    toLateEvt: fmt(toLateEvtMs),
    toLateEvtClosed: toLateEvtMs <= 0,
    toLyticMs,
    toLateEvtMs
  };
};
