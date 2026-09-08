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
export const evaluateDAWN = ({ age, nihss, coreMl, timeFromLKWh } = {}) => {
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  const c = parseFloat(coreMl);
  const t = parseFloat(timeFromLKWh);
  if (![a, n, c, t].every(Number.isFinite) || a <= 0 || a > 120 || !Number.isInteger(n) || n < 0 || n > 42 || c < 0 || t < 0) return null;
  if (Number.isFinite(t) && (t < 6 || t > 24)) {
    return { eligible: false, tier: null, reason: `Outside DAWN window (6-24h); LKW ${t}h`, meetsImaging: false, meetsClinical: false };
  }
  let tier = null; let reason = '';
  if (a >= 80 && n >= 10 && c < 21) tier = 'A';
  else if (a >= 18 && a < 80 && n >= 10 && c < 31) tier = 'B';
  else if (a >= 18 && a < 80 && n >= 20 && c < 51) tier = 'C';
  else reason = `No tier met (age ${a}, NIHSS ${n}, core ${c} mL)`;
  return {
    eligible: tier !== null,
    tier,
    meetsImaging: Number.isFinite(c) && c < 51,
    meetsClinical: Number.isFinite(n) && n >= 10,
    reason: tier ? `DAWN Group ${tier} age/severity/core screen met. Confirm ICA/proximal MCA occlusion, baseline function, and remaining trial criteria; this is not complete EVT eligibility.` : `${reason}. Failure to meet DAWN does not exclude EVT under newer evidence.`,
    window: '6-24h',
    endpointNNT: 2.8,
    source: 'Nogueira NEJM 2018;378:11-21 (NCT02142283)'
  };
};

// DEFUSE-3 inclusion calculator (Albers et al., NEJM 2018;378:708-18)
// Window: 6-16h after last known well.
// Inclusion: core <70 mL, mismatch volume >=15 mL, mismatch ratio >=1.8.
// Hypoperfused volume is TOTAL Tmax >6s volume, including the core.
// `penumbraMl` is a legacy name for that total, not salvageable-only volume.
export const evaluateDEFUSE3 = ({ coreMl, penumbraMl, hypoperfusedMl, timeFromLKWh, nihss, age } = {}) => {
  const c = parseFloat(coreMl);
  const p = parseFloat(hypoperfusedMl ?? penumbraMl);
  const t = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const a = parseFloat(age);
  if (![c, p, t, n, a].every(Number.isFinite) || c < 0 || p < c || t < 0 || !Number.isInteger(n) || n < 0 || n > 42 || a <= 0 || a > 120) return null;
  if (Number.isFinite(t) && (t < 6 || t > 16)) {
    return { eligible: false, reason: `Outside DEFUSE-3 window (6-16h); LKW ${t}h`, meetsCore: c < 70, meetsMismatch: false };
  }
  const mismatchVolume = p - c;
  const mismatchRatio = c > 0 ? p / c : Infinity;
  const coreOk = c < 70;
  const ratioOk = mismatchRatio >= 1.8;
  const volumeOk = mismatchVolume >= 15;
  const clinicalOk = n >= 6 && a >= 18 && a <= 90;
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
      ? 'DEFUSE-3 age/severity/perfusion screen met. Confirm ICA/proximal MCA occlusion, baseline function, and all exclusions; this is not complete EVT eligibility.'
      : `${!coreOk ? `Core ${c} mL ≥70; ` : ''}${!ratioOk ? `Mismatch ratio ${mismatchRatio.toFixed(1)} < 1.8; ` : ''}${!volumeOk ? `Mismatch volume ${mismatchVolume.toFixed(1)} mL < 15; ` : ''}${!clinicalOk ? 'Age 18–90 and NIHSS ≥6 required; ' : ''}Failure to meet DEFUSE-3 does not exclude EVT under newer evidence.`.trim(),
    window: '6-16h',
    endpointNNT: 3.6,
    source: 'Albers NEJM 2018;378:708-18 (NCT02586415)'
  };
};

// =====================================================================
// Minor-stroke / TIA DAPT duration
// =====================================================================

// CHANCE / POINT / THALES / CHANCE-2 / INSPIRES combined DAPT recommender.
// CHANCE (Wang NEJM 2013;369:11-19): clopidogrel+ASA x 21d for TIA/minor stroke (NIHSS <=3, ABCD2 >=4) within 24h.
// POINT (Johnston NEJM 2018;379:215-25): clopidogrel+ASA x 21d for NIHSS <=3 / ABCD2 >=4 within 12h.
// THALES (Johnston NEJM 2020;383:207-17): ticagrelor+ASA x 30d for NIHSS <=5 + atherosclerotic etiology or ABCD2 >=6, within 24h.
// CHANCE-2 (Wang NEJM 2021;385:2520-30): in CYP2C19 LOF carriers, ticagrelor+ASA superior to clopidogrel+ASA for NIHSS <=3 / ABCD2 >=4.
// INSPIRES (Gao NEJM 2023;389:2413-24, PMID 38157499): clopidogrel+ASA x 21d extended eligibility — NIHSS <=5 AND time-from-onset <=72h,
//   INCLUDING patients with symptomatic intra-/extracranial atherosclerotic stenosis >=50% (LVD). 7.3% vs 9.2% recurrent stroke (HR 0.79).
//   DAPT for high-risk TIA / minor stroke is Class 1 in the 2021 AHA/ASA secondary-prevention guideline;
//   INSPIRES extended the eligibility window/population (no 2024 AHA/ASA antiplatelet update exists).
//
// Inputs:
//   nihss            — admission NIHSS (number)
//   abcd2            — ABCD² for TIA (number)
//   strokeType       — 'tia' | 'ischemic'
//   atherosclerotic  — boolean: any atherosclerotic mechanism (carotid/intracranial)
//   lvdSymptomatic   — boolean: SYMPTOMATIC intra-/extracranial stenosis >=50% (INSPIRES qualifier)
//   cyp2c19LOF       — boolean: known *2/*3 LOF carrier (CHANCE-2)
//   ichRisk          — 'high' to suppress DAPT
//   timeFromOnsetH   — required number of hours from symptom onset; INSPIRES requires <=72h
export const recommendAcuteDAPT = ({ nihss, abcd2, strokeType, atherosclerotic, lvdSymptomatic, cyp2c19LOF, ichRisk, timeFromOnsetH } = {}) => {
  const n = parseFloat(nihss);
  const ab = parseFloat(abcd2);
  const tH = parseFloat(timeFromOnsetH);
  const isTIA = strokeType === 'tia';
  const isMinor = !isTIA && Number.isInteger(n) && n >= 0 && n <= 3;
  const isUpToModerate = !isTIA && Number.isInteger(n) && n >= 0 && n <= 5;
  const inInspiresWindow = tH <= 72;
  const inLegacyWindow = tH <= 24;
  const highRisk = Number.isFinite(ab) && ab >= 4;
  const veryHighRisk = Number.isFinite(ab) && ab >= 6;
  const isAtherosclerotic = atherosclerotic === true || lvdSymptomatic === true;

  if (ichRisk === 'high') {
    return { regimen: 'single-antiplatelet', rationale: 'High hemorrhagic risk — DAPT not recommended.', duration: null, source: null };
  }

  // V3 — empty/invalid input guard. With no usable severity input (NIHSS for
  // ischemic stroke, or ABCD² for a TIA), the recommendation is undefined; do
  // NOT assert a conclusion ("DAPT not indicated") from non-existent input.
  // Show a neutral prompt instead. Once a valid NIHSS (or ABCD² for TIA) is
  // entered, the branches below compute normally.
  const severityValid = isTIA ? Number.isInteger(ab) && ab >= 0 && ab <= 7 : Number.isInteger(n) && n >= 0 && n <= 42;
  if (!severityValid || !Number.isFinite(tH) || tH < 0) {
    return {
      regimen: '—',
      rationale: 'Enter valid NIHSS (0–42) for stroke or ABCD² (0–7) for TIA and hours since onset. Confirm noncardioembolic mechanism, hemorrhage exclusion, and reperfusion/bleeding considerations separately.',
      duration: null,
      source: null
    };
  }

  // THALES: ticagrelor+ASA for moderate stroke w/ atherosclerotic etiology OR very-high-risk TIA, within 24h.
  if (((isUpToModerate && isAtherosclerotic) || (isTIA && veryHighRisk)) && inLegacyWindow) {
    return {
      regimen: 'ticagrelor+ASA',
      duration: '30 days',
      dosing: 'Ticagrelor 180 mg load, then 90 mg BID + ASA 325 mg load then 75-100 mg daily',
      rationale: isAtherosclerotic
        ? `Atherosclerotic minor-to-moderate stroke (NIHSS ≤5) within 24h: THALES showed 17% RRR in stroke/death at 30 d. ${lvdSymptomatic ? 'Symptomatic LVD ≥50% → INSPIRES (clopi+ASA) is an alternative option (Gao NEJM 2023).' : ''}`.trim()
        : `Very-high-risk TIA (ABCD² ${ab} ≥6): escalate to ticagrelor+ASA × 30d.`,
      source: 'Johnston NEJM 2020;383:207-17 (THALES); INSPIRES NEJM 2023;389:2413-24 alternative for atherosclerotic LVD',
      class: 'Class 2b (AHA/ASA 2021 secondary prevention) for selected ticagrelor-aspirin patients; discuss bleeding risk and alternatives'
    };
  }

  // INSPIRES branch: NIHSS 4-5 within 72h (extended window beyond CHANCE/POINT), or atherosclerotic LVD ≥50%.
  if (isAtherosclerotic && inInspiresWindow && ((isUpToModerate && n >= 4) || (tH > 24 && (isMinor || (isTIA && highRisk))))) {
    const useTicagrelor = cyp2c19LOF === true;
    return {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CYP2C19 LOF — CHANCE-2 extrapolation)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load then 90 mg BID + ASA 75-100 mg daily (off-label INSPIRES extrapolation)'
        : 'Clopidogrel 300-600 mg load then 75 mg daily + ASA 75-100 mg daily',
      rationale: `INSPIRES-style screen: ${isTIA ? `high-risk TIA (ABCD² ${ab})` : `NIHSS ${n}`} within ${tH}h and presumed atherosclerotic cause. Verify qualifying stenosis/multiple infarcts, age 35–80, and no thrombolysis/thrombectomy. Aspirin was given for 21 days and clopidogrel through day 90; bleeding increased.`,
      source: 'Gao NEJM 2023;389:2413-24 (INSPIRES, PMID 38157499); CYP2C19 branch CHANCE-2 NEJM 2021',
      class: 'INSPIRES-supported (Gao NEJM 2023); DAPT for high-risk TIA/minor stroke is Class 1 in the 2021 AHA/ASA secondary-prevention guideline (no 2024 AHA/ASA antiplatelet update exists)'
    };
  }

  // CHANCE/POINT classic branch: high-risk TIA or NIHSS ≤3, within 24h (POINT was 12h; CHANCE was 24h).
  if (((isTIA && highRisk) || isMinor) && inLegacyWindow) {
    const useTicagrelor = cyp2c19LOF === true;
    return {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CHANCE-2)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load then 90 mg BID + ASA 75-100 mg daily'
        : 'Clopidogrel 300-600 mg load then 75 mg daily + ASA 75-100 mg daily',
      rationale: useTicagrelor
        ? 'Known CYP2C19 LOF carrier — CHANCE-2 showed ticagrelor+ASA superior to clopidogrel+ASA.'
        : `${isTIA ? `High-risk TIA (ABCD² ${ab} ≥4)` : `Minor stroke (NIHSS ${n} ≤3)`} within ${tH}h: CHANCE/POINT showed reduced 90-d stroke risk. Truncate DAPT at 21 d to minimize bleeding.`,
      source: useTicagrelor ? 'Wang NEJM 2021;385:2520-30 (CHANCE-2)' : 'Wang NEJM 2013;369:11-19 (CHANCE); Johnston NEJM 2018;379:215-25 (POINT)',
      class: 'Class 1 (AHA/ASA 2021 secondary prevention)'
    };
  }

  // Fall-throughs that signal "missed-window" or "above-threshold"
  if (((isTIA && highRisk) || isUpToModerate) && tH > 72) {
    return {
      regimen: 'individualized-review',
      duration: null,
      rationale: `Outside the trial windows modeled here (${tH}h >72h). This is not a blanket DAPT contraindication: the 2021 secondary-prevention guideline allows initiation within 7 days for selected minor noncardioembolic stroke/high-risk TIA. Review current guidance, mechanism, and bleeding risk.`,
      source: 'AHA/ASA 2021 secondary-prevention guideline (doi: 10.1161/STR.0000000000000375); INSPIRES 2023',
      class: 'Trial screen limitation; individualized clinical review'
    };
  }

  return {
    regimen: 'single-antiplatelet',
    duration: 'long-term',
    dosing: 'ASA 81 mg daily OR clopidogrel 75 mg daily',
    rationale: `No DAPT trial branch modeled here is met (${isTIA ? `TIA ABCD² ${ab}` : `NIHSS ${n}`}, ${tH}h). Use mechanism-appropriate prevention; this partial screen does not establish a contraindication to DAPT.`,
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
    // Published brackets: 65-75 = 1 point, >75 = 2 points — age exactly 75
    // falls in the 65-75 bracket (Weimar Stroke 2009, PMID 19023098).
    if (a > 75) score += 2; else if (a >= 65) score += 1;
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

// SPI-II (Kernan WN et al., Stroke 2000;31:456-62; PMID 10657422)
// Seven items, total 0-15: CHF = 3; diabetes = 3; prior stroke = 3;
// age >70 = 2; stroke (not TIA) as the index event = 2; hypertension = 1;
// coronary artery disease = 1.
// Risk groups (pooled 2-year stroke-or-death across 3 validation cohorts):
// Group I = 0-3 (10%), Group II = 4-7 (19%), Group III = 8-15 (31%).
export const calculateSPI2 = ({ age, hypertension, diabetes, cad, priorStroke, chf, indexEventStroke }) => {
  let score = 0;
  const a = parseFloat(age);
  if (chf) score += 3;
  if (diabetes) score += 3;
  if (priorStroke) score += 3;
  if (Number.isFinite(a) && a > 70) score += 2;
  if (indexEventStroke) score += 2; // index event is stroke (not TIA)
  if (hypertension) score += 1;
  if (cad) score += 1;
  return {
    score,
    tier: score <= 3 ? 'low' : score <= 7 ? 'moderate' : 'high',
    riskGroup: score <= 3 ? 'I' : score <= 7 ? 'II' : 'III',
    twoYearRisk: score <= 3 ? '10%' : score <= 7 ? '19%' : '31%',
    outcome: 'stroke or death within 2 years (TIA or nondisabling ischemic stroke cohort)',
    source: 'Kernan WN et al. Stroke 2000;31:456-62 (SPI-II, PMID 10657422)'
  };
};

// =====================================================================
// ICH expansion scores
// =====================================================================

// BAT score (Morotti A et al., Stroke 2018;49:1163-1169; PMID 29669875)
// Blend sign on NCCT: +1; Any intrahematoma hypodensity: +2; Timing of NCCT
// from onset <2.5 h: +2. Range 0-5. Published dichotomization: BAT ≥3
// predicts hematoma expansion with sensitivity 0.50 and specificity 0.89
// (c-statistic 0.77 development; 0.65/0.70 in validation cohorts).
export const calculateBAT = ({ blendSign, hypodensity, timeToCTHours }) => {
  let score = 0;
  const t = parseFloat(timeToCTHours);
  if (blendSign) score += 1;
  if (hypodensity) score += 2;
  if (Number.isFinite(t) && t < 2.5) score += 2;
  return {
    score,
    risk: score >= 3 ? 'high' : 'low',
    threshold: 'BAT ≥3 = high expansion risk (sensitivity 0.50, specificity 0.89)',
    source: 'Morotti A et al. Stroke 2018;49:1163-1169 (BAT score, PMID 29669875)'
  };
};

// BRAIN score (Wang X et al., Stroke 2015;46:376-381; PMID 25503550).
// Predicts clinically significant (≥6 mL) hematoma expansion at 24 h. Derived in
// INTERACT2 (n=964), validated in INTERACT1 (n=346); C-statistic 0.73. Range 0-24.
//   B = Baseline ICH volume: ≤10 mL = 0, 10-20 = 5, >20 = 7
//   R = Recurrent ICH: 4
//   A = Anticoagulation (warfarin) at onset: 6
//   I = Intraventricular haemorrhage: 2
//   N = Number of hours onset→baseline CT: ≤1 = 5, 1-2 = 4, 2-3 = 3, 3-4 = 2, 4-5 = 1, >5 = 0
// Predicted probability of growth ranges 3.4% (0 pts) to 85.8% (24 pts).
export const calculateBRAIN = ({ volumeMl, recurrentICH, anticoagulated, ivh, onsetToCTHours }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (Number.isFinite(v)) score += v <= 10 ? 0 : (v <= 20 ? 5 : 7);
  if (recurrentICH) score += 4;
  if (anticoagulated) score += 6;
  if (ivh) score += 2;
  if (Number.isFinite(t)) {
    if (t <= 1) score += 5;
    else if (t <= 2) score += 4;
    else if (t <= 3) score += 3;
    else if (t <= 4) score += 2;
    else if (t <= 5) score += 1;
    // >5 h = 0 points
  }
  return {
    score,
    // Coarse label over the 0-24 range (source reports a continuous probability,
    // not named bands): low <8, moderate 8-15, high >15.
    risk: score > 15 ? 'high' : score >= 8 ? 'moderate' : 'low',
    expansionNote: 'Predicts ≥6 mL hematoma growth at 24 h; probability rises from ~3.4% (0 pts) to ~85.8% (24 pts)',
    source: 'Wang X et al. Stroke 2015;46:376-381 (BRAIN score; PMID 25503550)'
  };
};

// Nine-point (Brouwers) ICH hematoma-expansion prediction score
// (Brouwers HB et al., JAMA Neurol 2014;71:158-64; PMID 24366060)
// Warfarin use: yes = 2. Time from symptom onset to initial CT: ≤6 h = 2.
// CTA spot sign: present = 3, CTA unavailable = 1, absent = 0.
// Baseline ICH volume: <30 mL = 0, 30-60 mL = 1, >60 mL = 2. Max 9.
// Risk strata: 0 = low (5.7% expansion), 1-3 = medium (12.4%), 4-9 = high
// (36.4%; 80% at score 9). Expansion = >6 mL or >33% growth.
export const calculateNinePoint = ({ warfarin, spotSign, volumeMl, onsetToCTHours }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (warfarin) score += 2;
  if (Number.isFinite(t) && t <= 6) score += 2;
  // spotSign is tri-state: true = present (3), false = absent (0),
  // 'unavailable' / undefined / null = no baseline CTA performed (1).
  if (spotSign === true) score += 3;
  else if (spotSign !== false) score += 1;
  if (Number.isFinite(v)) {
    if (v > 60) score += 2;
    else if (v >= 30) score += 1;
  }
  return {
    score,
    risk: score >= 4 ? 'high' : score >= 1 ? 'medium' : 'low',
    expansionIncidence: score >= 4 ? '36.4% (80% at score 9)' : score >= 1 ? '12.4%' : '5.7%',
    source: 'Brouwers HB et al. JAMA Neurol 2014;71:158-64 (9-point expansion score, PMID 24366060)'
  };
};

// =====================================================================
// SAH / DCI scores
// =====================================================================

// VASOGRADE (de Oliveira Manoel Stroke 2015;46:1826-31; PMID 25977276)
// Green: mFisher 1-2 AND WFNS 1-2; Yellow: mFisher 3-4 AND WFNS 1-3;
// Red: WFNS 4-5 (any mFisher). WFNS 3 + mFisher 1-2 satisfies NONE of the
// published categories — a recognized gap in the original scheme — and is
// returned as 'Unclassified' rather than silently coerced to Yellow.
export const calculateVASOGRADE = ({ wfns, modifiedFisher }) => {
  const w = parseFloat(wfns);
  const m = parseFloat(modifiedFisher);
  if (!Number.isFinite(w) || !Number.isFinite(m)) return null;
  let grade; let risk;
  if (w >= 4) { grade = 'Red'; risk = 'high'; }
  else if (w <= 2 && m <= 2) { grade = 'Green'; risk = 'low'; }
  else if (w <= 3 && m >= 3) { grade = 'Yellow'; risk = 'moderate'; }
  else {
    grade = 'Unclassified';
    risk = 'indeterminate';
    return { grade, risk, note: 'WFNS 3 with modified Fisher 1-2 is not classified by the published VASOGRADE definitions — use clinical judgment and full DCI risk assessment.', source: 'de Oliveira Manoel Stroke 2015;46:1826-31 (PMID 25977276)' };
  }
  return { grade, risk, source: 'de Oliveira Manoel Stroke 2015;46:1826-31 (PMID 25977276)' };
};

// Ogilvy-Carter grading for aneurysmal SAH (0-5)
// (Ogilvy CS, Carter BS. Neurosurgery 1998;42:959-68; PMID 9588539)
// Factors, 1 point each: age >50; Hunt-Hess IV-V; Fisher 3-4; aneurysm size
// >10 mm; GIANT (≥25 mm) POSTERIOR-circulation lesion (both conditions
// combined — not either alone; the >10 mm size point is separate).
export const calculateOgilvyCarter = ({ age, huntHess, fisher, size, giantPosterior, posteriorCirculation }) => {
  const a = parseFloat(age);
  const hh = parseFloat(huntHess);
  const f = parseFloat(fisher);
  const sz = parseFloat(size);
  let score = 0;
  if (Number.isFinite(a) && a > 50) score += 1;
  if (Number.isFinite(hh) && hh >= 4) score += 1;
  if (Number.isFinite(f) && f >= 3) score += 1;
  if (Number.isFinite(sz) && sz > 10) score += 1;
  // Accept either an explicit combined flag, or derive it from size ≥25 mm
  // plus a posterior-circulation flag.
  const isGiantPosterior = giantPosterior === true || (posteriorCirculation === true && Number.isFinite(sz) && sz >= 25);
  if (isGiantPosterior) score += 1;
  return { score, source: 'Ogilvy CS, Carter BS. Neurosurgery 1998;42:959-68 (PMID 9588539)' };
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

// mRS-9Q structured interpretation (Bruno Stroke 2010;41:1048-50).
// Order matches the published mRS scale:
//   mRS 5 = bedridden / requires constant care
//   mRS 4 = unable to walk without assistance (q4 cannot walk OR q5 walks only with aid)
//   mRS 3 = walks unaided BUT needs some help with bowel/bladder or self-care
//   mRS 2 = independent in ADLs but cannot resume all previous work / chores / hobbies
//   mRS 1 = symptoms present but able to carry out all usual duties
//   mRS 0 = no symptoms
// Earlier implementation incorrectly mapped q5WalkingUnaided=false to mRS 3 even
// though the mRS 3 description requires walking unassisted — fixed in v5.33.0.
export const interpretMRS9Q = ({ q1Symptoms, q2BowelBladder, q3Dressing, q4Walking, q5WalkingUnaided, q6Work, q7Chores, q8Hobbies, q9NeedsHelp }) => {
  if (q9NeedsHelp === 'bedridden') return { mrs: 5, description: 'Severe disability: bedridden, requires constant nursing care.' };
  if (q9NeedsHelp === 'constant') return { mrs: 4, description: 'Moderately severe disability: unable to walk unaided and unable to attend to own bodily needs.' };
  // mRS 4 — cannot walk without assistance (regardless of bowel/bladder or dressing status).
  if (q4Walking === false || q5WalkingUnaided === false) {
    return { mrs: 4, description: 'Moderately severe disability: unable to walk without assistance; requires help with most ADLs.' };
  }
  // mRS 3 — walks unaided but needs some help (bowel/bladder, dressing, etc.).
  if (q2BowelBladder === true || q3Dressing === true) {
    return { mrs: 3, description: 'Moderate disability: requires some help (bowel/bladder or dressing) but able to walk unassisted.' };
  }
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
// HAVOC — AF detection risk after cryptogenic stroke/TIA
// =====================================================================
// Kwong et al., Cardiology 2017 (PMID 28654919).
// HTN 2, age ≥75 2, valvular disease 2, peripheral vascular disease 1,
// obesity 1, CHF 4, CAD 2. Risk bands: low 0-4, medium 5-9, high 10-14.
export const calculateHAVOC = ({ hypertension, age, valvularDisease, peripheralVascularDisease, obesity, heartFailure, coronaryArteryDisease }) => {
  let score = 0;
  const a = parseFloat(age);
  if (hypertension) score += 2;
  if (Number.isFinite(a) && a >= 75) score += 2;
  if (valvularDisease) score += 2;
  if (peripheralVascularDisease) score += 1;
  if (obesity) score += 1;
  if (heartFailure) score += 4;
  if (coronaryArteryDisease) score += 2;
  const riskBand = score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
  return {
    score,
    riskBand,
    monitoringStrategy: riskBand === 'high'
      ? 'High HAVOC risk: prolonged rhythm monitoring; consider implantable cardiac monitor when external monitoring is negative or rapid ICM access is available.'
      : riskBand === 'medium'
        ? 'Medium HAVOC risk: at least 30-day external monitoring; escalate to ICM when suspicion remains high or monitoring is unrevealing.'
        : 'Low HAVOC risk: standard telemetry plus outpatient monitoring guided by cryptogenic/ESUS mechanism and clinical suspicion.',
    source: 'HAVOC score, Kwong et al. Cardiology 2017 (PMID 28654919)'
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
export const interpretBarnesJewishDysphagia = ({ gcs15, canSitUpright, lowerFacialAsymmetry, tongueAsymmetry, palatalAsymmetry, throatClearing, coughOnWater3oz, voiceChange }) => {
  if (!gcs15) return { pass: false, reason: 'GCS <15 — NPO, defer screen', action: 'Strict NPO; SLP consult when GCS 15.' };
  if (!canSitUpright) return { pass: false, reason: 'Unable to sit upright', action: 'Strict NPO; reassess when mobility allows.' };
  if (lowerFacialAsymmetry || tongueAsymmetry || palatalAsymmetry) return { pass: false, reason: 'Lower facial, tongue, or palatal asymmetry/weakness — stop screen before any water is given', action: 'Patient fails: keep NPO including medications (arrange non-oral medication routes with pharmacy); order speech pathology evaluation; notify the primary team the patient remains NPO.' };
  if (throatClearing || coughOnWater3oz || voiceChange) return { pass: false, reason: 'Throat clearing, cough, and/or vocal quality change immediately after and for 1 minute following the 3-oz sequential-drink water swallow', action: 'Keep NPO including medications (arrange non-oral medication routes with pharmacy); order speech pathology evaluation; notify the primary team the patient remains NPO.' };
  return { pass: true, reason: 'Screen passed', action: 'Place patient on an appropriate diet; notify the primary team to order any needed oral medications.' };
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

// =====================================================================
// Large-core EVT eligibility (ASPECTS 0-5 expanded window)
// =====================================================================
// Synthesis of:
//   RESCUE-Japan LIMIT (Yoshimura NEJM 2022;386:1303-13, PMID 35138767) — ASPECTS 3-5, ≤6h.
//   SELECT-2 (Sarraj NEJM 2023;388:1259-71, PMID 36762865) — ASPECTS 3-5 or core ≥50 mL, ≤24h. cOR 1.51.
//   ANGEL-ASPECT (Huo NEJM 2023;388:1272-83, PMID 36762852) — ASPECTS 3-5 or core 70-100 mL, ≤24h. mRS 0-3 30% vs 12%.
//   TENSION (Bendszus Lancet 2023;402:1753-63, PMID 37837989) — ASPECTS 3-5, ≤12h. cOR 2.58.
//   TESLA (Yoo JAMA 2024;332:1355-66, PMID 39374319) — ASPECTS 2-5 NCCT-only, ≤24h. Bayesian primary missed; trend favorable.
//   LASTE (Costalat NEJM 2024;390:1677-89, PMID 38718358) — ASPECTS 0-5 (incl 0-2), ≤6.5h. mRS 0-3 31% vs 12.5%, mortality 36% vs 55%.
// Review complete 2026 AHA/ASA vessel, imaging, time, and baseline-function criteria.
//
// Inputs:
//   age           — number
//   nihss         — number (most trials required NIHSS ≥6)
//   aspects       — 0-10 (NCCT) or null if CTP/MRI core used instead
//   coreMl        — CTP rCBF<30% or DWI core volume in mL (optional)
//   timeFromLKWh  — hours from last known well
//   premorbidMRS  — modified Rankin pre-stroke (most trials excluded mRS ≥3 except LASTE allowed up to 4)
//   lvoLocation   — 'ICA' | 'M1' | 'M2-prox' | other
export const evaluateLargeCoreEVT = ({ age, nihss, aspects, coreMl, timeFromLKWh, premorbidMRS, lvoLocation } = {}) => {
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  const asp = parseFloat(aspects);
  const c = parseFloat(coreMl);
  const t = parseFloat(timeFromLKWh);
  const pm = parseFloat(premorbidMRS);

  const loc = (lvoLocation || '').trim().toUpperCase();
  if (![a, n, t, pm].every(Number.isFinite) || t < 0 || a < 18 || !Number.isInteger(n) || n < 0 || n > 42 || !Number.isInteger(pm) || pm < 0 || pm > 6 || !loc || (!Number.isFinite(asp) && !Number.isFinite(c)) || (Number.isFinite(asp) && (!Number.isInteger(asp) || asp < 0 || asp > 10)) || (Number.isFinite(c) && c < 0)) {
    return { eligible: false, status: 'incomplete', matchingTrials: [], rationale: 'Enter valid age, NIHSS, time, premorbid mRS, vessel, and ASPECTS or core volume before applying this partial large-core trial screen.' };
  }
  if (!['ICA', 'M1', 'ICA-TERMINUS'].includes(loc)) return { eligible: false, status: 'outside-modeled-anatomy', matchingTrials: [], rationale: 'This large-core trial screen models ICA/M1 occlusion. Other vessels require their own evidence and clinical assessment.' };

  const trial = [];
  let eligible = false;
  let bestMatch = null;
  const reasons = [];

  // Age gate (most trials 18-85; SELECT-2/ANGEL allowed up to 85)
  const ageOk = a >= 18 && a <= 85;
  if (!ageOk) reasons.push(`Age ${a} outside 18-85`);

  // NIHSS gate (most trials required ≥6, ANGEL-ASPECT ≥6, SELECT-2 ≥6, TENSION ≥6, LASTE ≥6)
  const nihssOk = n >= 6;
  if (!nihssOk) reasons.push(`NIHSS ${n} <6 (below trial thresholds)`);

  // Premorbid mRS (most ≤2 except LASTE allowed ≤4)
  const pmOk = pm <= 1;

  // ASPECTS / core volume tiers
  const aspects35 = Number.isFinite(asp) && asp >= 3 && asp <= 5;
  const aspects02 = Number.isFinite(asp) && asp >= 0 && asp <= 2;
  const core50_70 = Number.isFinite(c) && c >= 50 && c < 70;
  const core70_100 = Number.isFinite(c) && c >= 70 && c <= 100;
  const coreGT100 = Number.isFinite(c) && c > 100;

  // LASTE — ASPECTS 0-2 within 6.5h
  if (aspects02 && t <= 6.5 && nihssOk && a < 80 && pmOk) {
    trial.push('LASTE'); bestMatch = 'LASTE'; eligible = true;
  }
  // RESCUE-Japan LIMIT — ASPECTS 3-5, ≤6h
  if (aspects35 && t <= 6 && nihssOk && ageOk && pmOk) {
    trial.push('RESCUE-Japan LIMIT'); bestMatch = bestMatch || 'RESCUE-Japan LIMIT'; eligible = true;
  }
  // TENSION — ASPECTS 3-5, ≤12h
  if (aspects35 && t <= 12 && n < 26 && a >= 18 && pm <= 2) {
    trial.push('TENSION'); bestMatch = bestMatch || 'TENSION'; eligible = true;
  }
  // SELECT-2 — ASPECTS 3-5 OR core ≥50, ≤24h
  if ((aspects35 || (Number.isFinite(c) && c >= 50)) && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('SELECT-2'); bestMatch = bestMatch || 'SELECT-2'; eligible = true;
  }
  // ANGEL-ASPECT — ASPECTS 3-5 OR core 70-100, ≤24h
  if ((aspects35 || (aspects02 && core70_100) || (asp > 5 && core70_100 && t >= 6)) && t <= 24 && nihssOk && n <= 30 && a <= 80 && pmOk) {
    trial.push('ANGEL-ASPECT'); bestMatch = bestMatch || 'ANGEL-ASPECT'; eligible = true;
  }
  // TESLA — ASPECTS 2-5 NCCT, ≤24h (note: primary missed Bayesian threshold, trend favorable)
  if (Number.isFinite(asp) && asp >= 2 && asp <= 5 && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('TESLA'); bestMatch = bestMatch || 'TESLA';
  }

  // SELECT2 and LASTE did not impose a universal 100-mL upper core limit.
  const beyondTrialRange = false;

  return {
    eligible,
    bestMatch,
    matchingTrials: trial,
    beyondTrialRange,
    aspects: Number.isFinite(asp) ? asp : null,
    coreMl: Number.isFinite(c) ? c : null,
    nihss: Number.isFinite(n) ? n : null,
    timeFromLKWh: t,
    status: eligible ? 'partial-screen-met' : 'screen-not-met',
    rationale: eligible
      ? 'Partial age/severity/imaging/time screen overlaps ' + trial.join(', ') + '. Confirm all remaining imaging exclusions, time definitions, baseline function, and 2026 guideline criteria with the stroke team. This does not establish complete trial or EVT eligibility.' + (coreGT100 ? ' A core above 100 mL is not outside all trial evidence; uncertainty increases with very extensive injury.' : '')
      : 'No modeled positive-trial branch is met. ' + reasons.join('; ') + ' This partial screen is not a contraindication to EVT; review the 2026 guideline and complete imaging.',
    sichCounseling: 'Large-core EVT improves disability outcomes in selected patients, while substantial disability may persist. Symptomatic-hemorrhage rates and definitions differ across trials; use trial-specific absolute risks instead of a pooled 6–7% assumption.',
    guidelineClass: 'Use the 2026 AHA/ASA AIS guideline section 4.7.2 and complete patient criteria; no single recommendation class applies to every large-core profile.',
    sources: 'NEJM 2022 (LIMIT, PMID 35138767); NEJM 2023 (SELECT-2 36762865; ANGEL-ASPECT 36762852); Lancet 2023 (TENSION 37837989); JAMA 2024 (TESLA, PMID 39374319); NEJM 2024 (LASTE 38718358)'
  };
};

// =====================================================================
// Late-window IV thrombolysis (TNK 4.5-24h LVO with mismatch, no EVT available)
// =====================================================================
// TRACE-III (Xiong NEJM 2024;391:203-12, PMID 38884324): Phase 3 RCT, n=516, China.
//   Inclusion: AIS with anterior LVO (ICA/M1), 4.5-24h from LKW, perfusion mismatch
//   (core <70 mL, mismatch ratio ≥1.8 AND mismatch volume ≥15 mL), NIHSS 6-25, age 18-80,
//   NO planned EVT (most spokes don't have it). TNK 0.25 mg/kg (max 25 mg) vs standard care.
//   Result: mRS 0-1 at 90d 33.0% vs 24.2% (RR 1.37). sICH 3.0% vs 0.8%.
// TIMELESS (NEJM 2024, PMID 38329148) was negative when most patients got EVT —
//   TRACE-III applies specifically to patients who CAN'T get EVT.
//
// Inputs:
//   timeFromLKWh — hours from LKW
//   evtAvailable — boolean: is mechanical thrombectomy available within reasonable transfer window?
//   lvo          — boolean: anterior LVO (ICA terminus or M1)
//   nihss        — number
//   age          — number
//   coreMl       — number, core volume (CTP rCBF<30% or DWI)
//   mismatchRatio — penumbra/core ratio
//   mismatchVolumeMl — penumbra - core
export const recommendLateWindowLytic = ({ timeFromLKWh, evtAvailable, lvo, nihss, age, coreMl, mismatchRatio, mismatchVolumeMl } = {}) => {
  const [t, n, a, c, r, v] = [timeFromLKWh, nihss, age, coreMl, mismatchRatio, mismatchVolumeMl].map(parseFloat);
  const source = 'TRACE-III NEJM 2024 (doi: 10.1056/NEJMoa2310392); AHA/ASA 2026 AIS guideline (doi: 10.1161/STR.0000000000000513)';
  if (!Number.isFinite(t) || t < 0) return { eligible: false, status: 'incomplete', reason: 'Enter a valid non-negative interval from last known well.', source };
  if (t <= 4.5) return { eligible: false, reason: 'Within the standard IVT window: assess the complete acute thrombolysis criteria. This extended-window screen does not determine standard-window eligibility.', source };
  if (t > 24) return { eligible: false, reason: 'Outside the 4.5–24h TRACE-III window modeled here; this screen is not a comprehensive assessment of all thrombolysis evidence.', source };
  if (lvo === false) return { eligible: false, reason: 'TRACE-III is an anterior-LVO trial. Other extended-window imaging-based IVT pathways require separate assessment under the 2026 guideline.', source };
  if (evtAvailable === true) return { eligible: false, reason: 'Urgently evaluate EVT and transfer. TRACE-III studied patients who did not have access to EVT; this screen does not settle adjunctive extended-window IVT for EVT candidates.', source };
  if (![n, a, c, r, v].every(Number.isFinite) || !Number.isInteger(n) || n < 0 || n > 42 || a <= 0 || c < 0 || r < 0 || v < 0 || lvo !== true || evtAvailable !== false) {
    return { eligible: false, status: 'incomplete', rationale: 'Confirm age, NIHSS, core volume, BOTH mismatch ratio and volume, anterior LVO, and lack of EVT access. Missing criteria are not presumed satisfied.', source };
  }
  const blockers = [];
  if (a < 18 || a > 80) blockers.push('Age outside 18–80');
  if (n < 6 || n > 25) blockers.push('NIHSS outside 6–25');
  if (c >= 70) blockers.push('Core must be <70 mL');
  if (r < 1.8 || v < 15) blockers.push('Both mismatch ratio ≥1.8 AND mismatch volume ≥15 mL are required');
  const eligible = blockers.length === 0;
  return {
    eligible,
    status: eligible ? 'partial-screen-met' : 'screen-not-met',
    regimen: eligible ? 'Review the tenecteplase extended-window pathway with the stroke specialist after the full contraindication assessment.' : null,
    rationale: eligible ? 'TRACE-III clinical/perfusion screen met; this is not complete thrombolysis eligibility. Confirm the vessel, imaging method, all exclusions, and appropriate local pathway. The trial found mRS 0–1 at 90d in 33.0% vs 24.2%.' : 'TRACE-III screen not met: ' + blockers.join('; '),
    sichRisk: 'TRACE-III reported sICH in 3.0% vs 0.8%.',
    source,
    guidelineClass: 'Partial trial screen; consult the 2026 guideline for the applicable extended-window recommendation.'
  };
};

// =====================================================================
// Post-EVT blood pressure target (after successful recanalization)
// =====================================================================
// ENCHANTED2/MT (Yang Lancet 2022;400:1585-96, PMID 36341753): RCT n=821 successful EVT
//   (mTICI ≥2b). Intensive SBP <120 vs standard <140-180. STOPPED FOR HARM — intensive arm
//   worse mRS shift (cOR 1.37). Tested an active intensive-lowering strategy, not an obligatory lower BP bound.
// OPTIMAL-BP (Nam JAMA 2023;330:832-42): Stopped early, intensive worse.
// AHA/ASA 2026: post-EVT ceiling ≤180/105; intensive SBP <140 after successful reperfusion is harmful.
//
// Inputs:
//   recanalized   — boolean (mTICI ≥2b)
//   currentSBP    — current systolic BP
//   ivLyticGiven  — boolean: did patient receive IV lytic (changes the rules for first 24h)
//   hasHemorrhage — boolean: post-procedure ICH on imaging?
export const recommendPostEVTBP = ({ recanalized, currentSBP, ivLyticGiven, hasHemorrhage, evtPerformed } = {}) => {
  const sbp = parseFloat(currentSBP);
  const source = 'AHA/ASA 2026 AIS guideline, BP management (doi: 10.1161/STR.0000000000000513)';
  if (hasHemorrhage === true) return {
    target: 'Individualize for post-procedure intracranial hemorrhage', lowerBound: null, upperBound: null,
    rationale: 'Reassess hemorrhage severity, reperfusion, ICP, and systemic needs urgently. The spontaneous mild-to-moderate ICH target should not be assigned automatically to every post-procedure hemorrhage.',
    source: 'AHA/ASA 2022 ICH guideline (doi: 10.1161/STR.0000000000000407)', class: 'Individualized assessment'
  };
  if (recanalized === true || evtPerformed === true) return {
    target: '≤180/105 mmHg during and for 24h after EVT', lowerBound: null, upperBound: 180,
    rationale: recanalized === true ? 'After successful anterior-circulation reperfusion (mTICI 2b–3), actively targeting SBP <140 for the first 72h is harmful when no other BP indication exists. This is not a mandatory SBP floor or a reason to induce hypertension in an otherwise stable patient.' : 'Maintain the post-EVT ceiling and individualize perfusion support; incomplete reperfusion requires separate clinical assessment.',
    currentBP: Number.isFinite(sbp) && sbp > 0 ? sbp : null,
    actionable: Number.isFinite(sbp) && sbp > 0 ? 'Assess both SBP and DBP, trends, examination, volume status, and competing indications before treatment changes.' : null,
    source, class: 'Post-EVT ceiling Class 2a B-NR; intensive SBP <140 after successful reperfusion Class 3 Harm A'
  };
  if (ivLyticGiven === true) return {
    target: '<180/105 mmHg for at least 24h after IVT', lowerBound: null, upperBound: 180,
    rationale: 'Use the post-thrombolysis ceiling and avoid hypotension; complete the post-IVT monitoring pathway.', source, class: 'Class 1 B-R'
  };
  if (evtPerformed !== false || ivLyticGiven !== false) return {
    target: 'Confirm reperfusion-treatment status', lowerBound: null, upperBound: null,
    rationale: 'Specify whether EVT and IVT were performed before choosing a BP pathway.', source, class: 'Incomplete inputs'
  };
  return {
    target: 'No routine early lowering below 220/120 mmHg without another urgent indication', lowerBound: null, upperBound: 220,
    rationale: 'For AIS without IVT or EVT, distinguish the 220/120 treatment threshold from a target. At or above it, or with an urgent comorbid indication, individualize cautious lowering. Avoid abrupt reductions and correct hypotension.', source, class: 'Clinical context and timing determine the recommendation'
  };
};

// =====================================================================
// Distal/medium-vessel occlusion (DMVO) thrombectomy advisory
// =====================================================================
// 2025 RCTs in DMVO have been NEGATIVE:
//   ESCAPE-MeVO (Goyal ISC 2025, n~530) — no benefit vs medical.
//   DISTAL (n~530) — negative for primary mRS shift in M2/M3/A2/A3/P2.
// 2026 AHA/ASA now provides a Class 3: No Benefit vessel-specific recommendation.
export const dmvoEVTAdvisory = ({ occlusionLocation } = {}) => {
  const loc = (occlusionLocation || '').trim().toUpperCase().replace(/[\s_]+/g, '-');
  const dmvoTokens = ['M2-DIST', 'M2-DISTAL', 'M2D', 'DISTAL-M2', 'M2-NONDOMINANT', 'NONDOMINANT-M2', 'M2-CODOMINANT', 'CODOMINANT-M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'];
  if (!loc) return { isDmvo: null, advisory: 'Confirm the vessel and, for proximal M2, division dominance before applying vessel-specific evidence.', proceed: 'incomplete' };
  if (!dmvoTokens.includes(loc)) {
    return {
      isDmvo: false,
      advisory: 'This vessel label is not classified by the distal-vessel screen. Assess standard EVT criteria; an unclassified vessel is not an eligibility result. Dominant proximal M2 has separate 2026 guidance.',
      proceed: 'review-standard-EVT-criteria'
    };
  }
  return {
    isDmvo: true,
    advisory: 'The 2026 AHA/ASA guideline does not recommend EVT to improve functional outcomes for proximal nondominant/codominant M2 or distal MCA, ACA, or PCA occlusions. DISTAL and ESCAPE-MeVO did not show benefit. A disabling deficit or NIHSS threshold alone does not override these results.',
    proceed: 'no-routine-EVT',
    nextSteps: 'Urgently assess IV thrombolysis using complete time, imaging, disability, and contraindication criteria. Continue stroke-unit surveillance and investigate deterioration promptly. This advisory does not prescribe lysis or a wait-and-see interval. Research enrollment requires the full trial criteria.',
    sources: 'AHA/ASA 2026 AIS guideline §4.7.2 recommendation 8 (doi: 10.1161/STR.0000000000000513); DISTAL and ESCAPE-MeVO NEJM 2025',
    class: 'Class 3: No Benefit, Level A (2026 AHA/ASA; vessel-specific recommendation)'
  };
};

// =====================================================================
// MOST advisory — adjunctive antithrombotic (tirofiban/argatroban/eptifibatide) post-IV lytic
// =====================================================================
// MOST (Adeoye/Broderick NEJM 2024;391:810-20, PMID 39231343): Phase 3 RCT, n=514, AIS s/p IV lytic.
// Argatroban or eptifibatide as adjunct vs placebo. STOPPED for futility — neither improved
// outcome. MR CLEAN-MED (Lancet 2022, PMID 35240044) similarly showed periprocedural
// heparin/aspirin during EVT increases sICH (stopped for harm).
// NOTE: RESCUE-BT2 (China, NEJM 2023;388:2025-36, PMID 37256974) showed tirofiban benefit in
  // ischemic stroke WITHOUT large- or medium-vessel occlusion (mostly small atherosclerotic infarcts) who
// were INELIGIBLE for lytic/EVT — different population; do NOT extrapolate to lytic-eligible.
export const adjunctiveAntithromboticAdvisory = ({ ivLyticGiven, evtPlanned, lyticIneligible }) => {
  if (ivLyticGiven === true) {
    return {
      recommend: 'No',
      drugs: ['argatroban', 'eptifibatide', 'tirofiban (post-lytic)', 'heparin'],
      rationale: 'MOST trial (Adeoye NEJM 2024, PMID 39231343) found NO benefit and possible harm from argatroban or eptifibatide added to IV lytic. Do not give adjunctive anticoagulants/antiplatelets in the first 24h post-lytic.',
      source: 'Adeoye NEJM 2024;391:810-20 (MOST, PMID 39231343); MR CLEAN-MED Lancet 2022 (PMID 35240044)',
      class: 'Class 3 (no benefit/possible harm)'
    };
  }
  if (evtPlanned === true) {
    return {
      recommend: 'No (periprocedural heparin/aspirin)',
      drugs: ['heparin', 'aspirin (periprocedural)'],
      rationale: 'MR CLEAN-MED stopped for harm (sICH excess) when heparin or aspirin added periprocedurally. Avoid adjunctive antithrombotics during EVT.',
      source: 'MR CLEAN-MED Lancet 2022 (PMID 35240044)',
      class: 'Class 3'
    };
  }
  if (lyticIneligible === true) {
    return {
      recommend: 'Tirofiban may be considered',
      drugs: ['tirofiban'],
      rationale: 'RESCUE-BT2 (NEJM 2023) improved the primary endpoint of excellent outcome (mRS 0-1) at 90 days — 29.1% vs 22.2%, adjusted RR 1.26 (95% CI 1.04-1.53), p=0.02, though secondary endpoints were generally not consistent with the primary result — with tirofiban in non-cardioembolic AIS who could not receive IV lytic or EVT. Distinct population from MOST.',
      source: 'RESCUE-BT2 NEJM 2023 (PMID 37256974)',
      class: 'Class 2b (selected non-cardioembolic, lytic/EVT-ineligible)'
    };
  }
  return { recommend: 'No specific adjunct', rationale: 'Standard ASA 81 mg PO/PR within 24-48h per routine.', source: 'AHA/ASA 2019 AIS' };
};

// =====================================================================
// ENRICH eligibility — minimally invasive surgery for lobar ICH 30-80 mL
// =====================================================================
// ENRICH (Pradilla NEJM 2024;390:1277-89, PMID 38598795): Adaptive RCT, n=300.
// June 2026 operational screen exposed on the public ICH page:
// spontaneous lobar ICH, 30-80 mL, age 18-80, NIHSS >5, GCS 5-14, no lesion.
// Minimally invasive parafascicular surgery (BrainPath/Myriad-Artemis) + medical vs medical alone.
// Primary: utility-weighted mRS at 180d. RESULT: 0.458 vs 0.374 (posterior probability 0.981).
// Benefit DRIVEN BY LOBAR subgroup (basal ganglia stratum dropped after futility analysis).
// Implication: lobar ICH ≥30 mL → call neurosurgery early for MIS evaluation.
export const evaluateENRICHEligibility = ({ icHLocation, volumeMl, timeFromOnsetH, gcs, premorbidMRS, age, nihss } = {}) => {
  const [v, g, a, t, pm, n] = [volumeMl, gcs, age, timeFromOnsetH, premorbidMRS, nihss].map(parseFloat);
  const loc = (icHLocation || '').trim().toLowerCase();
  if (![v, g, a, t, pm, n].every(Number.isFinite) || !loc || v < 0 || t < 0 || !Number.isInteger(g) || g < 3 || g > 15 || !Number.isInteger(pm) || pm < 0 || pm > 6 || !Number.isInteger(n) || n < 0 || n > 42 || a <= 0) {
    return { eligible: false, status: 'incomplete', rationale: 'Enter valid location, volume, age, GCS, NIHSS, premorbid mRS, and hours since onset before applying the ENRICH screen.' };
  }
  const isLobar = ['lobar', 'cortical'].includes(loc);
  const blockers = [];
  if (v < 30 || v > 80) blockers.push(`Volume ${v} mL outside 30–80`);
  if (a < 18 || a > 80) blockers.push(`Age ${a} outside 18–80`);
  if (g < 5 || g > 14) blockers.push(`GCS ${g} outside 5–14`);
  if (t > 24) blockers.push(`${t}h exceeds 24h treatment window`);
  if (pm > 1) blockers.push(`Premorbid mRS ${pm} >1`);
  if (n <= 5) blockers.push(`NIHSS ${n} ≤5`);
  if (!isLobar) blockers.push('The lobar-benefit screen requires confirmed lobar location');
  const eligible = blockers.length === 0;
  return {
    eligible,
    status: eligible ? 'partial-screen-met' : 'screen-not-met',
    bestCandidate: isLobar,
    rationale: eligible
      ? 'Lobar ENRICH demographic/severity/time screen met. Confirm surgery can begin within 24h and all imaging, coagulopathy, and other exclusions with neurosurgery. This is not complete surgical eligibility. Overall utility-weighted mRS was 0.458 vs 0.374; benefit was attributable to the lobar subgroup.'
      : `Lobar-benefit ENRICH screen not met: ${blockers.join('; ')}.`,
    nextSteps: 'Neurosurgical review and complete source criteria are required, including secondary lesion exclusion and thalamic/intraventricular extension. Failure to meet this partial ENRICH screen does not exclude other surgical indications.',
    source: 'Pradilla NEJM 2024;390:1277-89 (ENRICH, PMID 38598795; doi: 10.1056/NEJMoa2308440)',
    class: 'ENRICH trial screen; no predicted future guideline class assigned'
  };
};

// =====================================================================
// SWITCH eligibility — early decompressive craniectomy for deep ICH
// =====================================================================
// SWITCH: 201 randomized; stopped early for funding. Primary mRS 5–6 at 180d
// 44% vs 58%, aRR 0.77 (95% CI 0.59–1.01), p=0.057: weak evidence, not proof.
export const evaluateSWITCHEligibility = ({ icHLocation, volumeMl, gcs, timeFromOnsetH, age, premorbidMRS, nihss, clotStable } = {}) => {
  const [v, g, t, a, pm, n] = [volumeMl, gcs, timeFromOnsetH, age, premorbidMRS, nihss].map(parseFloat);
  const loc = (icHLocation || '').trim().toLowerCase();
  if (![v, g, t, a, pm, n].every(Number.isFinite) || !loc || v < 0 || t < 0 || a <= 0 || !Number.isInteger(g) || g < 3 || g > 15 || !Number.isInteger(n) || n < 0 || n > 42 || !Number.isInteger(pm) || pm < 0 || pm > 6 || typeof clotStable !== 'boolean') {
    return { eligible: false, status: 'incomplete', rationale: 'Confirm location, volume, GCS, NIHSS, onset time, age, premorbid mRS, and clot stability before applying the SWITCH screen.' };
  }
  const isDeep = ['basal ganglia', 'thalamus', 'thalamic', 'putamen', 'putaminal', 'deep'].includes(loc);
  const blockers = [];
  if (!isDeep) blockers.push('Requires deep basal-ganglia/thalamic ICH');
  if (v < 30 || v > 100) blockers.push(`Volume ${v} mL outside 30–100`);
  if (g < 8 || g > 13) blockers.push(`GCS ${g} outside 8–13`);
  if (n < 10 || n > 30) blockers.push(`NIHSS ${n} outside 10–30`);
  if (t >= 66) blockers.push(`${t}h is not <66h for randomization`);
  if (a < 18 || a > 75) blockers.push(`Age ${a} outside 18–75`);
  if (pm > 1) blockers.push(`Premorbid mRS ${pm} >1`);
  if (!clotStable) blockers.push('Clot stability not established');
  const eligible = blockers.length === 0;
  return {
    eligible,
    status: eligible ? 'partial-screen-met' : 'screen-not-met',
    rationale: eligible
      ? 'SWITCH demographic/severity/imaging screen met; this is not complete surgical eligibility. Confirm operative timing and all exclusions with neurosurgery.'
      : `SWITCH screen not met: ${blockers.join('; ')}. This does not exclude other surgical indications.`,
    nextSteps: 'Confirm stable clot, INR <1.5, platelets >100×10⁹/L, no secondary structural lesion or other exclusions, and surgery within 6h of randomization. Discuss treatment goals and expected disability with the family.',
    counseling: 'SWITCH primary mRS 5–6 at 180d occurred in 44% with decompression vs 58% with medical care (aRR 0.77, 95% CI 0.59–1.01; p=0.057). The trial stopped early for funding and provides weak evidence of benefit. Severe disability remained common in both groups; do not present this as proven functional independence or survival benefit.',
    source: 'Beck Lancet 2024;403:2395–2404 (doi: 10.1016/S0140-6736(24)00702-5); SWITCH protocol doi: 10.1177/23969873241231047',
    class: 'Trial-based partial screen; no projected guideline upgrade'
  };
};

// =====================================================================
// INTERACT3 ICH care bundle compliance
// =====================================================================
// INTERACT3 (Ma Lancet 2023;402:27-40, PMID 37245517): Cluster-RCT n=7036.
// Care bundle within first hour: SBP <140 ≤1h, glucose 6.1-7.8 (non-DM)/7.8-10 (DM),
// Tmax <37.5°C, INR reversal <1.5 within 1h. cOR for mRS shift 0.86 (p=0.015); mortality HR 0.77.
// Single most cost-effective ICH update.
export const ichCareBundleCheck = ({ sbpAtArrival, sbpAt1h, glucose, glucoseUnit, isDiabetic, temp, inr, isOnWarfarin, anticoagReversed }) => {
  const sbp1 = parseFloat(sbpAt1h);
  const glu = parseFloat(glucose);
  const tmp = parseFloat(temp);
  const i = parseFloat(inr);

  const items = [];
  // BP target
  const bpDone = Number.isFinite(sbp1) && sbp1 < 140;
  items.push({
    item: 'SBP <140 within 1h',
    target: '<140 mmHg',
    current: Number.isFinite(sbp1) ? `${sbp1} mmHg` : 'not entered',
    met: bpDone,
    action: bpDone ? null : 'Initiate IV labetalol 10 mg or nicardipine drip; recheck q15 min until target met. Avoid SBP <120.'
  });
  // Glucose
  const glucoseTarget = isDiabetic ? '7.8-10 mmol/L (140-180 mg/dL)' : '6.1-7.8 mmol/L (110-140 mg/dL)';
  const glucoseLow = isDiabetic ? 7.8 : 6.1;
  const glucoseHigh = isDiabetic ? 10 : 7.8;
  // Explicit unit toggle: 'mg/dL' or 'mmol/L'. The old magnitude heuristic
  // (>30 means mg/dL) misread severe hypoglycemia — 28 mg/dL parsed as
  // 28 mmol/L (~500 mg/dL). Without an explicit unit the value is treated
  // as NOT interpretable rather than guessed.
  const unit = glucoseUnit === 'mg/dL' || glucoseUnit === 'mmol/L' ? glucoseUnit : null;
  const gluMmol = !Number.isFinite(glu) ? NaN : unit === 'mg/dL' ? glu / 18 : unit === 'mmol/L' ? glu : NaN;
  const glucoseDone = Number.isFinite(gluMmol) && gluMmol >= glucoseLow && gluMmol <= glucoseHigh;
  items.push({
    item: 'Glucose in target range',
    target: glucoseTarget,
    current: Number.isFinite(glu) && unit ? (unit === 'mg/dL' ? `${glu} mg/dL (${gluMmol.toFixed(1)} mmol/L)` : `${glu} mmol/L`) : Number.isFinite(glu) ? `${glu} (unit not specified — select mg/dL or mmol/L)` : 'not entered',
    met: glucoseDone,
    action: glucoseDone ? null : (gluMmol < glucoseLow ? 'Treat hypoglycemia (D50W 25 g IV).' : `Insulin scale; target ${glucoseTarget}.`)
  });
  // Temperature
  const tempDone = Number.isFinite(tmp) && tmp < 37.5;
  items.push({
    item: 'Tmax <37.5°C',
    target: '<37.5°C',
    current: Number.isFinite(tmp) ? `${tmp}°C` : 'not entered',
    met: tempDone,
    action: tempDone ? null : 'Acetaminophen 1 g PO/PR/IV; cooling blanket if persistent fever. Investigate source.'
  });
  // INR reversal (only if on warfarin)
  if (isOnWarfarin === true) {
    const inrDone = (Number.isFinite(i) && i < 1.5) || anticoagReversed === true;
    items.push({
      item: 'INR <1.5 within 1h (warfarin)',
      target: '<1.5',
      current: Number.isFinite(i) ? `INR ${i}` : (anticoagReversed === true ? 'reversed' : 'not entered'),
      met: inrDone,
      action: inrDone ? null : 'Give 4F-PCC weight-based + Vitamin K 10 mg IV. Recheck INR at 30 min and 6h.'
    });
  }

  const completed = items.filter(x => x.met).length;
  const total = items.length;
  const fullyCompliant = completed === total;

  return {
    fullyCompliant,
    completed,
    total,
    percentComplete: Math.round((completed / total) * 100),
    items,
    rationale: fullyCompliant
      ? 'INTERACT3 bundle fully achieved within 1h — best evidence-based ICH outcome trajectory.'
      : `INTERACT3 bundle incomplete (${completed}/${total} elements met). Bundle as a whole reduces mRS shift (cOR 0.86) and mortality (HR 0.77).`,
    source: 'Ma Lancet 2023;402:27-40 (INTERACT3, PMID 37245517)',
    class: 'Class 2a equivalent (bundle-based recommendation, ESO/WSO 2023 endorse)'
  };
};

// =====================================================================
// PASCAL classification — PFO closure attribution probability
// =====================================================================
// Kent JAMA 2021;326:2277-86 (PMID 34905030).
// Combines RoPE score with PFO morphology (large shunt or atrial septal aneurysm).
// Categories: Unlikely / Possible / Probable. Closure benefit concentrated in Probable.
export const evaluatePASCAL = ({ ropeScore, largeShunt, atrialSeptalAneurysm } = {}) => {
  const rope = parseFloat(ropeScore);
  if (!Number.isInteger(rope) || rope < 0 || rope > 10) return null;
  if (largeShunt !== true && atrialSeptalAneurysm !== true && (largeShunt !== false || atrialSeptalAneurysm !== false)) return { category: 'Incomplete', recommendation: 'Confirm shunt size and atrial septal aneurysm status before assigning a PASCAL category.', nnt: null };
  const highRiskMorphology = largeShunt === true || atrialSeptalAneurysm === true;
  let category, recommendation, nnt;

  if (rope >= 7 && highRiskMorphology) {
    category = 'Probable';
    recommendation = 'Probable PFO-related stroke: closure can benefit appropriately selected patients. Confirm age, nonlacunar infarction, complete etiologic evaluation, anatomy, and alternatives with the stroke/structural-heart team.';
    nnt = null;
  } else if (rope >= 7 || highRiskMorphology) {
    category = 'Possible';
    recommendation = 'Possible PFO-related stroke: discuss potential closure benefit, procedural/AF risk, alternatives, and patient preferences after completing eligibility assessment.';
    nnt = null;
  } else {
    category = 'Unlikely';
    recommendation = 'Unlikely PFO-related stroke: routine closure is generally discouraged. Review competing mechanisms and any unusual evidence of high causal probability before an individualized decision.';
    nnt = 'No demonstrated benefit';
  }

  return {
    category,
    ropeScore: rope,
    largeShunt: largeShunt === true,
    atrialSeptalAneurysm: atrialSeptalAneurysm === true,
    recommendation,
    nnt,
    ageEligibility: 'PFO closure trials enrolled age 18-60. For age >60, individualize with shared decision-making; data sparser.',
    source: 'Kent JAMA 2021;326:2277-86 (PASCAL, PMID 34905030); CLOSE/REDUCE/RESPECT/DEFENSE-PFO RCTs',
    class: 'PASCAL is a causal-likelihood classification, not a stand-alone recommendation class. See AHA/ASA 2021 and ESO 2024 PFO guidance.'
  };
};

// =====================================================================
// Intracranial atherosclerotic disease (ICAD) medical regimen
// =====================================================================
// SAMMPRIS (NEJM 2011/2014, PMID 21899409), VISSIT (JAMA 2015), CASSISS (JAMA 2022, PMID 35943472)
// — stenting INFERIOR to aggressive medical for 70-99% intracranial stenosis.
// Aggressive medical = DAPT × 90d, LDL <70, SBP <140 (consider <130), intensive lifestyle.
// Cilostazol: TOSS-2 (Stroke 2011), CSPS.com (Lancet Neurol 2019, PMID 31122494) — adds benefit.
export const icadMedicalRegimen = ({ stenosisPercent, symptomatic, daysSinceEvent, lowHemorrhagicRisk, recurrentEvent, onCurrentDAPT } = {}) => {
  const s = parseFloat(stenosisPercent);
  const days = parseFloat(daysSinceEvent);
  if (!Number.isFinite(s) || s < 50 || s > 99) {
    return { applicable: false, message: 'Enter confirmed 50–99% intracranial atherosclerotic stenosis; complete occlusion and nonatherosclerotic disease require separate assessment.' };
  }
  const severe = s >= 70;
  const dapt90Appropriate = severe && symptomatic === true && Number.isFinite(days) && days >= 0 && days <= 30 && lowHemorrhagicRisk === true;
  const regimen = [
    { drug: 'Mechanism-appropriate antiplatelet therapy after hemorrhage and anticoagulation indications are assessed', duration: 'long-term; symptomatic ICAD guidance uses aspirin 325 mg/day' },
    { drug: 'Maximally tolerated statin and additional LDL lowering as needed', duration: 'long-term; LDL <70 mg/dL for ASCVD, <55 if the complete very-high-risk category applies (2026)' },
    { drug: 'BP control with avoidance of hypotension and hypoperfusion', duration: 'long-term; individualize acute versus stable outpatient targets' },
    { drug: 'Smoking cessation, physical activity, Mediterranean-style diet, and adherence review', duration: 'long-term' }
  ];
  if (dapt90Appropriate) regimen.unshift({ drug: 'Add clopidogrel 75 mg/day to aspirin', duration: 'up to 90 days for recent symptomatic 70–99% ICAD; then single antiplatelet', evidence: 'AHA/ASA 2021 §5.1.1, Class 2a, B-NR' });
  return {
    applicable: true,
    severe,
    dapt90Appropriate,
    missingAssessment: symptomatic !== true || !Number.isFinite(days) || lowHemorrhagicRisk !== true,
    daptNote: dapt90Appropriate ? 'The modeled recent severe symptomatic ICAD criteria are met; confirm remaining contraindications.' : 'Stenosis alone does not establish a 90-day DAPT indication. Confirm event attribution, onset within 30 days, 70–99% severity, and acceptable bleeding risk. Other short-DAPT indications require their own criteria.',
    regimen,
    recurrentEventReview: recurrentEvent === true ? `Reassess mechanism, adherence, risk-factor control, and bleeding risk with a stroke specialist. Cilostazol combined with aspirin OR clopidogrel is a selected Class 2b option; do not automatically add a third antiplatelet.${onCurrentDAPT === true ? ' Current DAPT must be reconciled before any change.' : ''}` : null,
    avoidStenting: 'Stenting NOT recommended outside refractory cases. SAMMPRIS and VISSIT showed net harm; CASSISS showed no benefit even with experienced operators and delayed treatment (8.0% vs 7.2%, HR 1.10, 95% CI 0.52-2.35, P=.82).',
    submaximalAngioplasty: severe ? 'BASIS (JAMA 2024) was a positive randomized trial of submaximal balloon angioplasty plus medical management in selected patients aged 35–80 with 70–99% symptomatic ICAD (TIA within 90d or stroke 14–90d). Its composite included revascularization; procedural complications and generalizability require specialist review. It does not establish routine angioplasty for every stenosis.' : null,
    source: 'AHA/ASA 2021 secondary prevention §5.1.1 (doi: 10.1161/STR.0000000000000375); BASIS JAMA 2024 (doi: 10.1001/jama.2024.12829); ACC/AHA 2026 dyslipidemia (doi: 10.1161/CIR.0000000000001423)',
    class: 'Recent severe symptomatic ICAD: clopidogrel plus aspirin up to 90d Class 2a; selected cilostazol dual therapy Class 2b (2021)'
  };
};

// =====================================================================
// Post-stroke BP target (long-term secondary prevention)
// =====================================================================
// SPS3 (Lancet 2013, PMID 23726159), SPRINT-MIND (JAMA 2019, PMID 30688979),
// ESPRIT (Lancet 2024, PMID 38945140).
// AHA/ACC 2025 hypertension guideline §5.3.9.3: outpatient goal <130/80.
export const bpTargetPostStroke = ({ strokeSubtype, age, orthostatic, ckd, currentSBP, currentDBP }) => {
  const a = parseFloat(age);
  const sbp = parseFloat(currentSBP);
  const dbp = parseFloat(currentDBP);

  const baseTarget = '<130/80 mmHg (AHA/ACC 2025; neurologically stable outpatient)';
  const aggressiveTarget = 'Lower targets require individualized assessment of tolerance; do not apply this outpatient target during acute stroke treatment.';

  let target = baseTarget;
  let lowerLimit = null;
  let cautions = [];

  // SPS3: small-vessel/lacunar — intensive (<130) trended benefit; ICH HR 0.37
  if ((strokeSubtype || '').toLowerCase().includes('lacun') || (strokeSubtype || '').toLowerCase().includes('small')) {
    target = '<130/80 mmHg (SPS3 tested SBP <130, not <120)';
  }

  if (orthostatic === true) {
    cautions.push('Orthostatic hypotension — check standing BP and symptoms; individualize the target and regimen to avoid falls.');
    target = 'Individualize because of orthostatic hypotension';
  }
  if (Number.isFinite(a) && a >= 80) {
    cautions.push('Age ≥80 — individualize; SPRINT/ESPRIT enrolled fewer very-elderly. Consider <140/80 if frail.');
  }
  if (ckd === true) {
    cautions.push('CKD — monitor creatinine, potassium, and volume status during treatment adjustment. Acute ICH trial targets do not define chronic BP goals.');
  }

  const firstLine = ['ACEi or ARB (lisinopril, losartan)', 'Thiazide diuretic (chlorthalidone preferred over HCTZ)', 'Calcium channel blocker (amlodipine)'];
  const drugClassNote = 'AHA/ACC 2025: thiazide-type diuretic, ACE inhibitor, or ARB reduce recurrent stroke risk; tailor the regimen to comorbidities and tolerance.';
  const completeBP = Number.isFinite(sbp) && sbp > 0 && Number.isFinite(dbp) && dbp > 0;

  return {
    target,
    aggressiveTarget,
    cautions,
    firstLine,
    drugClassNote,
    currentBP: completeBP ? `${sbp}/${dbp} mmHg` : null,
    actionable: completeBP
      ? orthostatic === true ? 'Review standing BP and symptoms before medication adjustment.'
        : sbp >= 130 || dbp >= 80 ? 'Above outpatient target — confirm average BP, adherence, and tolerance before adjusting treatment.'
          : 'Below 130/80 — continue monitoring and assess symptoms and tolerance.'
      : null,
    source: 'AHA/ACC 2025 hypertension guideline §5.3.9.3 (doi: 10.1161/CIR.0000000000001356); SPS3 Lancet 2013 (PMID 23726159)',
    class: 'Class 1 for <130/80'
  };
};

// =====================================================================
// Post-stroke lipid target (LDL)
// =====================================================================
// TST (NEJM 2020, PMID 31738483): post-stroke LDL <70 vs 90-110, MACE HR 0.78.
// SPARCL: atorva 80 baseline. FOURIER (PCSK9): stroke HR 0.79; no ICH increase.
// CLEAR Outcomes reduced composite events; stroke alone was not significant.
// ACC/AHA 2026: ASCVD LDL <70; very-high-risk ASCVD LDL <55.
export const lipidsTargetPostStroke = ({ strokeSubtype, currentLDL, onStatin, statinIntolerant, additionalCV, ckd, veryHighRiskASCVD }) => {
  const ldl = parseFloat(currentLDL);
  const isAtherosclerotic = ['atherosclerotic', 'lvd', 'icad', 'carotid', 'stenosis'].some(x =>
    (strokeSubtype || '').toLowerCase().includes(x)
  );
  // Atherosclerotic stroke alone does not establish the complete very-high-risk
  // definition. Require a clinician's explicit assessment of that category.
  const veryHighRisk = veryHighRiskASCVD === true;
  const target = veryHighRisk ? '<55 mg/dL (very-high-risk ASCVD)' : '<70 mg/dL (ASCVD; assess whether very-high-risk criteria apply)';

  const tier = [];
  tier.push({ step: 1, agent: 'High-intensity statin: atorvastatin 80 mg OR rosuvastatin 40 mg', evidence: 'SPARCL NEJM 2006 (PMID 16899775); TST NEJM 2020 (PMID 31738483)' });
  tier.push({ step: 2, agent: 'Add ezetimibe 10 mg PO daily', evidence: 'IMPROVE-IT NEJM 2015 (PMID 26040320)' });
  if (statinIntolerant) {
    tier.push({ step: 3, agent: 'Bempedoic acid 180 mg PO daily (statin-intolerant)', evidence: 'CLEAR Outcomes NEJM 2023 (PMID 36876740): composite benefit; stroke alone not significantly reduced' });
  }
  tier.push({ step: 4, agent: 'PCSK9 inhibitor: evolocumab 140 mg SC q2wk OR alirocumab 75-150 mg SC q2wk', evidence: 'FOURIER stroke analysis, Stroke 2020 (PMID 32312223)' });
  tier.push({ step: 5, agent: 'Inclisiran 284 mg SC initially, at 3 months, then every 6 months', evidence: 'LDL lowering established; cardiovascular outcome benefit not yet established in the 2026 dyslipidemia guideline' });

  return {
    target,
    veryHighRisk,
    currentLDL: Number.isFinite(ldl) ? ldl : null,
    atTarget: Number.isFinite(ldl) ? (veryHighRisk ? ldl < 55 : ldl < 70) : null,
    tier,
    rationale: `LDL goal ${target}. Confirm ASCVD and the full very-high-risk definition; do not assign <55 solely from stroke subtype. Use maximally tolerated statin and select additional therapy by the LDL reduction needed, outcome evidence, tolerance, and access.`,
    pcskISafetyInStroke: 'FOURIER found no significant increase in hemorrhagic stroke in its study population. This does not establish safety after prior ICH; individualize lipid therapy in that population.',
    source: 'ACC/AHA 2026 dyslipidemia guideline (doi: 10.1161/CIR.0000000000001423); TST NEJM 2020 (PMID 31738483); FOURIER Stroke 2020 (PMID 32312223); CLEAR Outcomes NEJM 2023 (PMID 36876740)',
    class: '2026 ACC/AHA ASCVD targets; assess the complete risk category'
  };
};

// =====================================================================
// ARCADIA / ATTICUS advisory — atrial cardiopathy ≠ AC indication
// =====================================================================
// ARCADIA (Kamel JAMA 2024;331:573-81, PMID 38324415): n=1015 ESUS + atrial cardiopathy
// markers. Apixaban vs ASA. Recurrent stroke 4.4 vs 4.4 per 100 PY (HR 1.00) — NEUTRAL.
// ATTICUS (Geisler NEJM Evid 2023, PMID 38320511): n=352 ESUS + cardiopathy/PFO marker;
// apixaban not superior to ASA.
// Implication: don't anticoagulate empirically for "atrial cardiopathy" — pursue prolonged
// rhythm monitoring (ICM) instead.
export const arcadiaAdvisory = ({ ptfv1, ntProBNP, laVolumeIndex, laDiameterCmM2, currentRegimen }) => {
  const ptf = parseFloat(ptfv1);
  const bnp = parseFloat(ntProBNP);
  const lavi = parseFloat(laVolumeIndex);
  const lad = parseFloat(laDiameterCmM2);

  const cardiopathyMarker = (Number.isFinite(ptf) && ptf > 5000)
    || (Number.isFinite(bnp) && bnp > 250)
    || (Number.isFinite(lad) && lad >= 3);

  return {
    cardiopathyPresent: cardiopathyMarker,
    leftAtrialEnlargement: Number.isFinite(lavi) ? lavi > 34 : null,
    recommendDOAC: false,
    rationale: cardiopathyMarker
      ? 'At least one ARCADIA entry biomarker is present (PTFV1 >5000 µV·ms, NT-proBNP >250 pg/mL, or indexed LA diameter ≥3 cm/m²). ARCADIA showed no recurrent-stroke benefit from empiric apixaban without AF. LAVI was not an ARCADIA entry criterion.'
      : 'No ARCADIA entry biomarker documented; missing measurements do not exclude atrial disease. LAVI is not an ARCADIA entry criterion.',
    nextSteps: cardiopathyMarker
      ? 'Continue mechanism-appropriate secondary prevention and arrange prolonged rhythm monitoring; consider an ICM when appropriate. If AF is confirmed, assess anticoagulation from stroke risk and bleeding context. Do not require 24 hours of AF for clinically diagnosed AF.'
      : 'Standard secondary prevention (antiplatelet + statin + BP). Consider ICM if other clinical features suggest paroxysmal AF (elevated HAVOC score, atrial cardiopathy, recurrent embolic pattern, frequent palpitations).',
    afBurdenThreshold: 'Device-detected AHRE without prior AF: consider duration together with CHA₂DS₂-VASc and bleeding risk. The 2023 AF guideline supports shared decisions for ≥24h with score ≥2 (2a), or 5 min–24h with score ≥3 (2b); <5 min alone is not an OAC indication. ARTESiA and NOAH show the benefit/bleeding tradeoff.',
    source: 'ARCADIA JAMA 2024;331:573-81 (PMID 38324415); ATTICUS NEJM Evid 2024 (PMID 38320511); 2023 ACC/AHA/ACCP/HRS AF guideline (doi: 10.1161/CIR.0000000000001193)',
    class: 'ARCADIA trial finding: no benefit from empiric apixaban for atrial cardiopathy without AF'
  };
};

// =====================================================================
// AF detection strategy — ICM vs Holter (HAVOC + clinical)
// =====================================================================
// Builds on HAVOC score when available; gives the actual recommendation in workflow terms.
export const afDetectionStrategy = ({ havocScore, strokeSubtype, hasICMAccess }) => {
  const score = parseFloat(havocScore);
  const isCryptogenic = (strokeSubtype || '').toLowerCase().includes('cryptogenic') || (strokeSubtype || '').toLowerCase().includes('esus');

  let strategy, evidence;
  if (Number.isFinite(score) && score >= 5) {
    strategy = 'Prolonged rhythm monitoring; consider ICM if external monitoring is negative or direct ICM access is available.';
    evidence = 'Medium/high HAVOC risk (5-14) predicts higher AF detection; CRYSTAL-AF, STROKE-AF, PER DIEM all showed ICM superior for AF detection.';
  } else if (isCryptogenic) {
    strategy = hasICMAccess === false
      ? '30-day external loop monitor or 14-day ECG patch (Zio); escalate to ICM if negative.'
      : 'Initial rhythm monitoring, with extended monitoring and an ICM if needed; no required 90-day delay.';
    evidence = 'CRYSTAL-AF (NEJM 2014, PMID 24963567): AF detection at 12 months 12.4% vs 2.0%. The 2023 AF guideline supports initial and, if needed, extended monitoring with an ICM after stroke/TIA of undetermined cause.';
  } else if (Number.isFinite(score) && score >= 1) {
    strategy = '30-day external monitor first; ICM if negative and clinical suspicion remains.';
    evidence = 'STROKE-AF (JAMA 2021, PMID 34061145) — even non-cardioembolic strokes show 12.1% AF.';
  } else {
    strategy = 'Standard inpatient telemetry + 24-48h Holter; ICM not routinely indicated.';
    evidence = 'Low HAVOC + non-cryptogenic mechanism — yield is lower; escalate only if clinical suspicion remains high.';
  }

  return {
    strategy,
    evidence,
    burdenThreshold: 'Confirmed clinical AF: use thromboembolic risk regardless of paroxysmal/persistent pattern. Device-detected AHRE without prior AF: assess duration and risk together (≥24h and CHA₂DS₂-VASc ≥2, or 5 min–24h and score ≥3); these are shared decisions, not automatic treatment triggers.',
    nextSteps: 'Review the tracing to confirm AF. If anticoagulation is indicated after stroke, individualize timing using infarct size, hemorrhagic transformation, imaging, and bleeding risk; avoid routine heparin bridging.',
    source: '2023 ACC/AHA/ACCP/HRS AF guideline (doi: 10.1161/CIR.0000000000001193); CRYSTAL-AF NEJM 2014; ARTESiA NEJM 2024 (PMID 37952132); NOAH-AFNET 6 NEJM 2023 (PMID 37622677)',
    class: 'Class 2a: initial monitoring and, if needed, extended monitoring with ICM after stroke/TIA of undetermined cause (2023 AF guideline)'
  };
};

// =====================================================================
// Boston criteria v2.0 for cerebral amyloid angiopathy
// =====================================================================
// Charidimou A et al. Lancet Neurol 2022;21:714-25 (PMID 35841910).
// Applies to patients aged >=50 presenting with spontaneous ICH, cognitive
// impairment, or transient focal neurological episodes.
// PROBABLE CAA: >=2 strictly lobar hemorrhagic lesions (ICH, cerebral
// microbleeds, or cortical superficial siderosis foci — a lobar ICH is NOT
// required) OR >=1 strictly lobar hemorrhagic lesion + >=1 white-matter
// feature (severe CSO perivascular spaces or multispot WMH), with no other
// cause. POSSIBLE CAA: 1 strictly lobar hemorrhagic lesion OR 1 white-matter
// feature. vs autopsy: sensitivity 74.5% (65.4-82.4), specificity 95.0%
// (83.1-99.4) for probable CAA.
export const evaluateBostonCAA20 = ({ age, lobarICH, corticalSiderosis, lobarMicrobleeds, lobarHemorrhagicLesionCount, csoPVSSevere, multispotWMH, otherCause, deepHemorrhagicLesions, qualifyingPresentation } = {}) => {
  const a = parseFloat(age);
  if (!Number.isFinite(a) || a <= 0) return { category: 'Incomplete', rationale: 'Enter a valid age before applying Boston v2.0.' };
  const meetsAge = a >= 50;
  const hasOtherCause = otherCause === true;

  if (!meetsAge) {
    return {
      category: 'N/A',
      rationale: 'Boston v2.0 criteria apply to patients aged ≥50. Below this, consider alternative etiologies (vasculitis, hereditary CAA syndromes, vascular malformation).'
    };
  }

  if (hasOtherCause) {
    return {
      category: 'Excluded',
      rationale: 'Other clear cause for the hemorrhagic lesions identified — Boston criteria not applied.'
    };
  }

  if (deepHemorrhagicLesions === true || qualifyingPresentation === false) {
    return { category: 'Not applicable', rationale: 'MRI-based Boston v2.0 requires a qualifying presentation (spontaneous ICH, transient focal neurological episodes, or cognitive impairment/dementia) and no deep ICH or deep microbleeds. Cerebellar hemorrhagic lesions count as neither lobar nor deep.' };
  }
  if (deepHemorrhagicLesions !== false || otherCause !== false || qualifyingPresentation !== true) {
    return { category: 'Incomplete', rationale: 'Confirm a qualifying clinical presentation, absence of deep hemorrhagic lesions, and exclusion of other causes before assigning a Boston v2.0 category.' };
  }

  // Count of strictly lobar hemorrhagic LESIONS (each ICH, each microbleed,
  // and each focus of cortical superficial siderosis counts individually).
  // Prefer the explicit count; otherwise derive a LOWER BOUND from the
  // boolean marker flags.
  const explicitCount = parseFloat(lobarHemorrhagicLesionCount);
  if (lobarHemorrhagicLesionCount !== undefined && lobarHemorrhagicLesionCount !== '' && (!Number.isInteger(explicitCount) || explicitCount < 0)) {
    return { category: 'Incomplete', rationale: 'Lobar hemorrhagic lesion count must be a non-negative whole number.' };
  }
  const derivedMinCount = (lobarICH === true ? 1 : 0) + (corticalSiderosis === true ? 1 : 0) + (lobarMicrobleeds === true ? 1 : 0);
  const lesionCount = Number.isFinite(explicitCount) ? explicitCount : derivedMinCount;
  const wmFeatures = (csoPVSSevere === true ? 1 : 0) + (multispotWMH === true ? 1 : 0);

  let category, action;
  if (lesionCount >= 2 || (lesionCount >= 1 && wmFeatures >= 1)) {
    // >=2 strictly lobar hemorrhagic lesions qualifies as Probable even
    // WITHOUT a symptomatic lobar ICH (e.g., two lobar microbleeds).
    category = 'Probable CAA';
    action = 'Meets MRI-based Boston v2.0 probable CAA criteria with the supplied exclusions. This is a diagnostic classification; antithrombotic and lipid decisions require a separate individualized assessment.';
  } else if (lesionCount === 1 || wmFeatures >= 1) {
    category = 'Possible CAA';
    action = 'One strictly lobar hemorrhagic lesion OR one white-matter feature. Not diagnostic — document markers, obtain/repeat susceptibility-weighted MRI, and reassess.';
  } else {
    category = 'Criteria not met';
    action = 'No qualifying markers were supplied. Failure to meet MRI-based criteria does not exclude CAA; verify MRI completeness and consider alternative etiologies.';
  }

  return {
    category,
    age: a,
    lobarHemorrhagicLesionCount: lesionCount,
    lesionCountIsLowerBound: !Number.isFinite(explicitCount),
    whiteMatterFeatures: wmFeatures,
    action,
    accuracy: 'Boston v2.0 probable CAA vs autopsy: sensitivity 74.5% (95% CI 65.4-82.4), specificity 95.0% (95% CI 83.1-99.4).',
    source: 'Charidimou A et al. Lancet Neurol 2022;21:714-25 (Boston criteria v2.0, PMID 35841910)',
    class: 'No formal class — diagnostic criteria used for prognostication and anticoagulation decision-making'
  };
};

// =====================================================================
// client-side BYOK configuration helper
// =====================================================================
// Single source of truth for which BYOK providers exist, and in what order.
// The Settings → API Configuration dropdown in src/app.jsx is derived from this
// list and only adds display metadata, so the two cannot drift apart.
// A provider outside this set — including the retired 'mock' demo entry —
// reads back as '' (unconfigured) so a caller can never dispatch on it.
export const AI_PROVIDERS = ['openai', 'anthropic', 'gemini', 'grok'];

export const getAIConfiguration = () => {
  const unconfigured = { provider: '', apiKey: '' };
  if (typeof window === 'undefined' || !window.localStorage) {
    return unconfigured;
  }
  try {
    const prefix = 'strokeApp:';
    const providerRaw = window.localStorage.getItem(prefix + 'apiProvider');
    try { window.localStorage.removeItem(prefix + 'apiKey'); } catch (e) {}
    const keyRaw = window.sessionStorage.getItem('apiKey');

    // localStorage stores JSON-stringified values if saved by setKey
    const stored = providerRaw ? JSON.parse(providerRaw) : '';
    const provider = AI_PROVIDERS.includes(stored) ? stored : '';
    const apiKey = keyRaw || '';
    return { provider, apiKey };
  } catch (e) {
    return unconfigured;
  }
};

// =====================================================================
// CRAO emergency assessment (THEIA 2025 / TenCRAOS 2026)
// =====================================================================
// Describes historical research-screen features; never establishes IVT eligibility.
// AHA Statement 2021 (Mac Grory, Stroke 2021;52:e282-e294, PMID 33677974);
// THEIA trial (Préterre et al., Lancet Neurol 2025;24(11):909-919, PMID 41109232):
// NEUTRAL — visual improvement 66% vs 48%, adjusted OR 1.1 (95% CI 0.07-18.39),
// p=0.95; n=70, underpowered. TenCRAOS (NEJM 2026, PMID 41604638)
// found no significant visual benefit and serious safety concerns, including fatal ICH.
export const evaluateCRAOTreatment = ({
  onsetHours,
  visualAcuity,
  fundusHemorrhage,
  ivtContraindicated,
  age
} = {}) => {
  const t = parseFloat(onsetHours);
  const a = parseFloat(age);
  if (!Number.isFinite(t)) return null;

  const windowOk = t >= 0 && t <= 4.5;
  const ageOk = a >= 18;

  let visionOk = false;
  if (typeof visualAcuity === 'boolean') {
    visionOk = visualAcuity;
  } else if (typeof visualAcuity === 'string') {
    const v = visualAcuity.toLowerCase().trim();
    const snellenMatch = v.match(/^20\/(\d+)$/);
    if (snellenMatch) {
      const denom = parseInt(snellenMatch[1], 10);
      visionOk = denom >= 200;
    } else {
      visionOk = ['no-light-perception', 'light-perception', 'hand-motion', 'count-fingers', 'severe', 'nlp', 'lp', 'hm', 'cf'].includes(v);
    }
  } else {
    visionOk = false;
  }

  const noHemorrhage = fundusHemorrhage === false;
  const noContraindication = ivtContraindicated === false;

  const meetsHistoricalScreen = windowOk && ageOk && visionOk && noHemorrhage && noContraindication;

  const contraindications = [];
  if (!windowOk) contraindications.push(t < 0 ? 'Onset interval must not be negative' : `Onset ${t}h exceeds 4.5h window`);
  if (!ageOk) contraindications.push(Number.isFinite(a) ? `Age ${a} < 18 years` : 'Age not documented');
  if (!visionOk) contraindications.push('Visual acuity not meeting severe vision loss criteria (<= 20/200 / count fingers / light perception)');
  if (!noHemorrhage) contraindications.push(fundusHemorrhage === true ? 'Retinal hemorrhage present on fundoscopy / OCT' : 'Retinal examination not confirmed');
  if (!noContraindication) contraindications.push(ivtContraindicated === true ? 'Systemic contraindications to IV thrombolysis present' : 'Systemic contraindication assessment incomplete');

  return {
    eligible: false,
    actionable: false,
    meetsHistoricalScreen,
    onsetHours: t,
    age: Number.isFinite(a) ? a : null,
    visualAcuityOk: visionOk,
    noHemorrhage,
    noContraindications: noContraindication,
    contraindications,
    recommendation: 'Suspected CRAO is an emergency: obtain urgent stroke and ophthalmology assessment, confirm the diagnosis, evaluate arteritic causes when indicated, and initiate cause-directed prevention. This screen does not recommend routine IV thrombolysis: THEIA was neutral and TenCRAOS found no significant visual benefit with serious safety concerns.',
    dosingInfo: 'No routine CRAO thrombolytic dose is provided. Any exceptional treatment discussion requires specialist assessment of current evidence and local governance.',
    sources: 'AHA Scientific Statement (Mac Grory Stroke 2021, PMID 33677974); THEIA Trial (Préterre Lancet Neurol 2025, PMID 41109232); TenCRAOS (Ryan NEJM 2026;394:442-450, PMID 41604638; doi: 10.1056/NEJMoa2508515)',
    class: 'Research-screen features are not an evidence-based treatment indication; current randomized trials do not establish routine CRAO IVT benefit'
  };
};

// =====================================================================
// SeLECT Post-Stroke Seizure & Epilepsy Risk Score
// =====================================================================
// Galovic M et al. Lancet Neurol 2018;17:143-152 (PMID 29413315).
// Predicts 1-year and 5-year risk of late post-stroke seizures / epilepsy.
// The 'L' item is LARGE-ARTERY ATHEROSCLEROTIC etiology (TOAST subtype),
// NOT large-vessel occlusion.
export const calculateSeLECTScore = ({
  nihss,
  corticalInvolvement,
  earlySeizure,
  largeArteryAtherosclerosis,
  lvoArtery, // deprecated alias retained for backward compatibility
  middleCerebralTerritory
} = {}) => {
  const n = parseFloat(nihss);
  if (!Number.isFinite(n)) return null;

  const toBool = (val) => val === true || String(val).toLowerCase() === 'true' || val === 1;

  const isCortical = toBool(corticalInvolvement);
  const isEarlySeizure = toBool(earlySeizure);
  const isLargeArtery = toBool(largeArteryAtherosclerosis !== undefined ? largeArteryAtherosclerosis : lvoArtery);
  const isMca = toBool(middleCerebralTerritory);

  const nihssPts = n >= 11 ? 2 : n >= 4 ? 1 : 0;
  const corticalPts = isCortical ? 2 : 0;
  const earlySeizurePts = isEarlySeizure ? 3 : 0;
  const largeArteryPts = isLargeArtery ? 1 : 0;
  const mcaPts = isMca ? 1 : 0;

  const score = nihssPts + corticalPts + earlySeizurePts + largeArteryPts + mcaPts;

  // Published anchors (Galovic 2018): score 0 = 0.7% (1 y) / 1.3% (5 y);
  // score 9 = 63% (95% CI 42-77) at 1 y and 83% (95% CI 62-93) at 5 y.
  // Intermediate rows are read from the publication's risk figure.
  const riskTable = {
    0: { y1: '0.7%', y5: '1.3%', numY1: 0.7, numY5: 1.3, tier: 'Low' },
    1: { y1: '1.2%', y5: '2.4%', numY1: 1.2, numY5: 2.4, tier: 'Low' },
    2: { y1: '2.1%', y5: '4.2%', numY1: 2.1, numY5: 4.2, tier: 'Low-Moderate' },
    3: { y1: '3.7%', y5: '7.3%', numY1: 3.7, numY5: 7.3, tier: 'Moderate' },
    4: { y1: '6.4%', y5: '12.4%', numY1: 6.4, numY5: 12.4, tier: 'Moderate-High' },
    5: { y1: '10.9%', y5: '20.3%', numY1: 10.9, numY5: 20.3, tier: 'High' },
    6: { y1: '17.9%', y5: '31.6%', numY1: 17.9, numY5: 31.6, tier: 'High' },
    7: { y1: '28.1%', y5: '46.0%', numY1: 28.1, numY5: 46.0, tier: 'Very High' },
    8: { y1: '41.3%', y5: '61.7%', numY1: 41.3, numY5: 61.7, tier: 'Very High' },
    9: { y1: '63%', y5: '83%', numY1: 63, numY5: 83, tier: 'Very High' }
  };

  const clampedScore = Math.min(Math.max(score, 0), 9);
  const risk = riskTable[clampedScore];

  return {
    score: clampedScore,
    oneYearRisk: risk.y1,
    fiveYearRisk: risk.y5,
    riskTier: risk.tier,
    recommendation: clampedScore >= 4
      ? `High risk of late post-stroke epilepsy (${risk.y5} at 5 years). Monitor closely and counsel patient/family on seizure precautions. Routine prophylactic ASM is NOT recommended, but initiate ASM promptly if an unprovoked seizure occurs >7 days post-stroke.`
      : `Low-to-moderate risk of post-stroke epilepsy (${risk.y5} at 5 years). Standard post-stroke follow-up without prophylactic ASM.`,
    breakdown: {
      nihssPoints: nihssPts,
      corticalPoints: corticalPts,
      earlySeizurePoints: earlySeizurePts,
      largeArteryAtherosclerosisPoints: largeArteryPts,
      mcaPoints: mcaPts
    },
    source: 'Galovic M et al. Lancet Neurol 2018;17:143-152 (SeLECT Score, PMID 29413315)'
  };
};

// =====================================================================
// EDEMA Score — potentially lethal malignant edema after anterior stroke
// =====================================================================
// Ong CJ et al. Stroke 2017;48:1969-1972 (PMID 28487333; PMC5487281).
// Items (from data within 24 h of ictus; derivation NIHSS >=8, anterior
// circulation): basal cistern effacement = 3; glucose >=150 mg/dL = 2;
// no tPA or thrombectomy = 1; midline shift at the septum pellucidum (mm):
// 0 = 0, >0-3 = 1, 3-6 = 2, 6-9 = 4, >9 = 7; no previous stroke = 1.
// Max 14. Score >=7: PPV 93%, specificity 99% for potentially lethal
// malignant edema (death with midline shift >=5 mm or hemicraniectomy).
// C-statistic 0.76 (derivation), 0.75 (bootstrap validation).
export const calculateEDEMAScore = ({
  basalCisternEffacement,
  glucoseMgDl,
  glucoseMmolL,
  noReperfusionTherapy,
  midlineShiftMm,
  noPreviousStroke
} = {}) => {
  const shift = parseFloat(midlineShiftMm);
  const gMg = parseFloat(glucoseMgDl);
  const gMmol = parseFloat(glucoseMmolL);
  // The score is defined only when its imaging inputs are assessable.
  if (!Number.isFinite(shift)) return null;

  const cisternPts = basalCisternEffacement === true ? 3 : 0;
  const glucosePts = ((Number.isFinite(gMg) && gMg >= 150) || (Number.isFinite(gMmol) && gMmol >= 8.3)) ? 2 : 0;
  const noTxPts = noReperfusionTherapy === true ? 1 : 0;
  let shiftPts = 0;
  if (shift > 9) shiftPts = 7;
  else if (shift >= 6) shiftPts = 4;
  else if (shift >= 3) shiftPts = 2;
  else if (shift > 0) shiftPts = 1;
  const noPriorPts = noPreviousStroke === true ? 1 : 0;

  const score = cisternPts + glucosePts + noTxPts + shiftPts + noPriorPts;
  const highRisk = score >= 7;

  return {
    score,
    highRiskForMalignantEdema: highRisk,
    riskTier: highRisk ? 'High' : score >= 3 ? 'Intermediate' : 'Low',
    recommendation: highRisk
      ? `EDEMA Score ${score} (>=7): high specificity (99%) and PPV (93%) for potentially lethal malignant edema. Trigger early neurosurgical consultation for decompressive hemicraniectomy evaluation (DESTINY/DECIMAL/HAMLET); Neuro-ICU monitoring with q1-2h neurochecks; prepare osmotherapy; avoid hypoventilation and hyperthermia.`
      : `EDEMA Score ${score} (<7): below the published high-risk threshold. Continue serial neurologic and imaging surveillance — the score is specific, not sensitive, so a low score does not exclude edema progression.`,
    breakdown: {
      basalCisternPoints: cisternPts,
      glucosePoints: glucosePts,
      noReperfusionPoints: noTxPts,
      midlineShiftPoints: shiftPts,
      noPreviousStrokePoints: noPriorPts
    },
    source: 'Ong CJ et al. Stroke 2017;48:1969-1972 (EDEMA Score, PMID 28487333)'
  };
};
